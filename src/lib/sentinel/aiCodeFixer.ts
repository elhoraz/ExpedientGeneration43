import { revalidatePath } from "next/cache";
import { sendWhatsAppMessageWithDetail } from "@/lib/whatsapp";
import { getLastIncident, TelemetryEvent } from "@/lib/sentinel/telemetryAlert";

interface GitHubFileResponse {
  path: string;
  sha: string;
  content: string;
  encoding: string;
}

/**
 * Pemetaan cerdas Route ke File Komponen Kunci Next.js
 */
const ROUTE_FILE_MAP: Record<string, string> = {
  "/": "src/components/landing/LandingContent.tsx",
  "/beranda": "src/app/(dashboard)/beranda/BerandaClient.tsx",
  "/galeri": "src/app/(dashboard)/galeri/GaleriClient.tsx",
  "/photobooth": "src/app/(dashboard)/photobooth/PhotoboothClient.tsx",
  "/panduan": "src/app/(dashboard)/panduan/PanduanClient.tsx",
  "/fitur": "src/app/(dashboard)/fitur/FiturClient.tsx",
  "/asmaul-husna": "src/app/(dashboard)/asmaul-husna/AsmaulHusnaClient.tsx",
  "/syndicate": "src/app/(dashboard)/syndicate/SyndicateForm.tsx",
  "/admin/cms": "src/app/(dashboard)/admin/(protected)/cms/CmsClient.tsx",
};

/**
 * Mencari target file kode yang harus diperbaiki berdasarkan insiden / instruksi
 */
export function resolveTargetFilePath(incident?: TelemetryEvent | null, customInput?: string): string {
  // 1. Cek jika pengguna mengetik nama file spesifik di WhatsApp (contoh: "perbaiki GaleriClient.tsx")
  if (customInput) {
    const matchExplicit = customInput.match(/([a-zA-Z0-9_\-\/]+\.(?:tsx|ts|css|jsx|js))/i);
    if (matchExplicit) {
      const explicit = matchExplicit[1];
      if (explicit.startsWith("src/")) return explicit;
      for (const mapped of Object.values(ROUTE_FILE_MAP)) {
        if (mapped.toLowerCase().endsWith(explicit.toLowerCase())) return mapped;
      }
    }
  }

  // 2. Ekstrak dari Call Stack trace error
  if (incident?.stack) {
    const matchStack = incident.stack.match(/(?:webpack-internal:\/\/\/|file:\/\/\/)?(src\/[a-zA-Z0-9_\-\/\(\)]+\.(?:tsx|ts|css|jsx|js))/i);
    if (matchStack) return matchStack[1];
  }

  // 3. Ekstrak dari Route
  const route = incident?.route || "/";
  const cleanRoute = route.split("?")[0].replace(/\/+$/, "") || "/";
  if (ROUTE_FILE_MAP[cleanRoute]) {
    return ROUTE_FILE_MAP[cleanRoute];
  }

  // Default fallback ke Landing page atau Galeri jika belum terdaftar
  return "src/components/landing/LandingContent.tsx";
}

/**
 * Mengambil kode file terkini langsung dari GitHub REST API
 */
async function fetchGitHubFile(
  filePath: string,
  githubToken: string,
  repo: string
): Promise<{ content: string; sha: string }> {
  const url = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=main`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Expedient-Sentinel-AI",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal membaca file ${filePath} dari GitHub: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as GitHubFileResponse;
  const decodedContent = Buffer.from(data.content, "base64").toString("utf-8");
  return { content: decodedContent, sha: data.sha };
}

/**
 * Mengirimkan prompt perbaikan ke Google Gemini 3.8 Flash High
 */
async function askGeminiToFixCode(
  filePath: string,
  currentCode: string,
  incident: TelemetryEvent | null,
  userInstruction: string,
  geminiApiKey: string,
  geminiModel: string
): Promise<string> {
  const prompt = `
You are an elite, highly reliable Full-Stack Next.js / React / TypeScript Software Engineer.
Your task is to review a file in an active production website and repair an identified bug/incident.

TARGET FILE: ${filePath}

INCIDENT CONTEXT:
- Category: ${incident?.category || "Bug/Dead Click/Glitch"}
- Route: ${incident?.route || "Unknown"}
- Error Message: ${incident?.message || "User reported failure"}
- Selector: ${incident?.selector || "N/A"}
- Stack Trace:
${incident?.stack || "No call stack provided"}

ADMIN INSTRUCTION FROM WHATSAPP:
"${userInstruction || "Fix the reported issue cleanly without breaking existing logic."}"

CURRENT FILE CODE:
\`\`\`typescript
${currentCode}
\`\`\`

CRITICAL REPAIR RULES:
1. Fix the bug completely (handle null/undefined guards, fix dead click handlers, ensure proper React state updates, fix unhandled rejections).
2. DO NOT delete unrelated components, exports, or functions. Preserve the exact architecture, imports, and styling.
3. Return the COMPLETE, VALID, DROP-IN REPLACEMENT TypeScript/TSX code for this file.
4. Output ONLY the code inside a single \`\`\`tsx or \`\`\`typescript block. No explanations, no introductory text, no pleasantries.
`.trim();

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;

  const bodyPayload = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      thinkingConfig: {
        thinkingBudget: 2048,
      },
    },
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const rawGeneratedText = result.candidates?.[0]?.content?.parts
    ?.map((p: any) => p.text)
    ?.join("") || "";

  if (!rawGeneratedText.trim()) {
    throw new Error("Gemini menghasilkan respon kosong.");
  }

  // Ekstrak kode murni dari markdown fence (```tsx ... ``` atau ```typescript ... ```)
  const codeBlockMatch = rawGeneratedText.match(/```(?:tsx|typescript|jsx|javascript|css)?\s*([\s\S]*?)```/);
  const cleanCode = codeBlockMatch ? codeBlockMatch[1].trim() : rawGeneratedText.trim();

  if (cleanCode.length < 50) {
    throw new Error("Hasil perbaikan kode terlalu pendek atau tidak valid.");
  }

  return cleanCode;
}

/**
 * Melakukan Git Commit & Push file perbaikan ke GitHub main branch
 */
async function commitFixedCodeToGitHub(
  filePath: string,
  fixedCode: string,
  originalSha: string,
  githubToken: string,
  repo: string,
  commitMessage: string
): Promise<{ commitSha: string; htmlUrl: string }> {
  const url = `https://api.github.com/repos/${repo}/contents/${filePath}`;

  const payload = {
    message: commitMessage,
    content: Buffer.from(fixedCode).toString("base64"),
    sha: originalSha,
    branch: "main",
    committer: {
      name: "Aegis Sentinel AI (Gemini 3.8 Flash)",
      email: "expedientgeneration43@gmail.com",
    },
  };

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Expedient-Sentinel-AI",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal push commit ke GitHub (${res.status}): ${errText}`);
  }

  const resData = await res.json();
  return {
    commitSha: resData.commit?.sha || "HEAD",
    htmlUrl: resData.commit?.html_url || `https://github.com/${repo}/commit/${resData.commit?.sha}`,
  };
}

/**
 * Controller Utama: Eksekusi Autonomous AI Code Repair Dipicu dari WhatsApp
 */
export async function executeAutonomousAiFix(
  adminPhone: string,
  userInstruction: string = ""
): Promise<{ success: boolean; message: string }> {
  const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();
  const geminiModel = (process.env.GEMINI_MODEL || "gemini-3.8-flash").trim();
  const githubToken = (process.env.GITHUB_TOKEN || "").trim();
  const githubRepo = (process.env.GITHUB_REPO || "elhoraz/ExpedientGeneration43").trim();

  // Validasi Kredensial
  if (!geminiApiKey) {
    const msg = `⚠️ *[AI AUTO-FIX GAGAL]*\n\nVariabel \`GEMINI_API_KEY\` belum diset di Vercel / server environment.`;
    await sendWhatsAppMessageWithDetail(adminPhone, msg);
    return { success: false, message: msg };
  }

  if (!githubToken) {
    const msg = `⚠️ *[AI AUTO-FIX GAGAL]*\n\nVariabel \`GITHUB_TOKEN\` belum diset di Vercel / server environment.`;
    await sendWhatsAppMessageWithDetail(adminPhone, msg);
    return { success: false, message: msg };
  }

  const lastIncident = getLastIncident();
  const targetFilePath = resolveTargetFilePath(lastIncident, userInstruction);

  // 1. Kirim notifikasi progres awal ke WhatsApp Admin
  await sendWhatsAppMessageWithDetail(
    adminPhone,
    `🧠 *[SENTINEL AI AUTO-FIX INITIATED]*\n\n` +
      `Model: *Gemini 3.8 Flash High*\n` +
      `Target File: \`${targetFilePath}\`\n` +
      `Status: Sedang menganalisis bug dan merevisi kode... Mohon tunggu ~10-15 detik.`
  );

  try {
    // 2. Ambil file asli dari GitHub
    console.log(`[AI-FIX] Mengambil ${targetFilePath} dari GitHub ${githubRepo}...`);
    const { content: originalCode, sha: originalSha } = await fetchGitHubFile(
      targetFilePath,
      githubToken,
      githubRepo
    );

    // 3. Minta Gemini 3.8 Flash memperbaiki kode
    console.log(`[AI-FIX] Memanggil Gemini 3.8 Flash untuk memperbaiki ${targetFilePath}...`);
    const fixedCode = await askGeminiToFixCode(
      targetFilePath,
      originalCode,
      lastIncident,
      userInstruction,
      geminiApiKey,
      geminiModel
    );

    // 4. Lakukan Git Commit & Push ke GitHub main branch
    const commitMsg = `fix(sentinel-ai): automated repair for ${targetFilePath} via WhatsApp (Gemini 3.8 Flash)`;
    console.log(`[AI-FIX] Melakukan commit & push ke GitHub...`);
    const { commitSha, htmlUrl } = await commitFixedCodeToGitHub(
      targetFilePath,
      fixedCode,
      originalSha,
      githubToken,
      githubRepo,
      commitMsg
    );

    // 5. Revalidate cache halaman terkait
    try {
      if (lastIncident?.route) revalidatePath(lastIncident.route);
      revalidatePath("/", "layout");
    } catch {
      // Non-blocking
    }

    const timeStr = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "medium",
      timeStyle: "medium",
    }).format(new Date());

    const successMsg =
      `🎉 *[AI AUTO-FIX BERHASIL DI-DEPLOY!]* 🎉\n\n` +
      `⏱️ *Waktu:* ${timeStr} WIB\n` +
      `🤖 *Model:* Gemini 3.8 Flash High (Reasoning)\n` +
      `📄 *File Diperbaiki:* \`${targetFilePath}\`\n` +
      `🔗 *Commit:* \`${commitSha.slice(0, 7)}\`\n\n` +
      `🚀 *Status Deploy:* Vercel telah mendeteksi commit baru ini dan sedang membangun ulang website (~60 detik).\n\n` +
      `🌐 *Lihat Perubahan:* ${htmlUrl}`;

    await sendWhatsAppMessageWithDetail(adminPhone, successMsg);
    return { success: true, message: successMsg };
  } catch (err: any) {
    console.error("[AI-FIX-EXCEPTION]:", err);
    const failureMsg =
      `❌ *[AI AUTO-FIX MENGALAMI KENDALA]*\n\n` +
      `Target File: \`${targetFilePath}\`\n` +
      `Detail Error: ${err.message || "Unknown error"}\n\n` +
      `_Silakan gunakan asisten coding di IDE jika memerlukan penanganan manual._`;
    await sendWhatsAppMessageWithDetail(adminPhone, failureMsg);
    return { success: false, message: failureMsg };
  }
}

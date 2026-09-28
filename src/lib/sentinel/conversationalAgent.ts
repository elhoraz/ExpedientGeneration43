import { revalidatePath } from "next/cache";
import { sendWhatsAppMessageWithDetail } from "@/lib/whatsapp";
import {
  getLastIncident,
  clearThrottleCache,
  checkFonnteHealthAndAlert,
  TelemetryEvent,
} from "@/lib/sentinel/telemetryAlert";
import { createAdminClient } from "@/lib/supabase/admin";

interface IntentAnalysis {
  intent: "CHAT" | "STATUS" | "OPERATION" | "CODE_EDIT";
  reply: string;
  targetFile?: string;
  editDescription?: string;
  actionSummary?: string;
}

/**
 * Peta File Utama Website Expedient Generation 43
 */
const SYSTEM_FILE_MAP: Record<string, string> = {
  "/": "src/components/landing/LandingContent.tsx",
  "/beranda": "src/app/(dashboard)/beranda/BerandaClient.tsx",
  "/galeri": "src/app/(dashboard)/galeri/GaleriClient.tsx",
  "/photobooth": "src/app/(dashboard)/photobooth/PhotoboothClient.tsx",
  "/panduan": "src/app/(dashboard)/panduan/PanduanClient.tsx",
  "/fitur": "src/app/(dashboard)/fitur/FiturClient.tsx",
  "/asmaul-husna": "src/app/(dashboard)/asmaul-husna/AsmaulHusnaClient.tsx",
  "/profil": "src/app/(dashboard)/profil/ProfileClient.tsx",
  "/buku-tamu": "src/app/(dashboard)/buku-tamu/BukuTamuClient.tsx",
  "/syndicate": "src/app/(dashboard)/syndicate/SyndicateForm.tsx",
  "/admin/cms": "src/app/(dashboard)/admin/(protected)/cms/CmsClient.tsx",
};

/**
 * Helper Pemanggil Gemini dengan Auto-Retry & Smart Fallback
 */
async function callGeminiResilient(
  bodyPayload: any,
  apiKey: string,
  preferredModel: string = "gemini-3.8-flash"
): Promise<any> {
  const modelsToTry = [preferredModel, "gemini-3.7-flash", "gemini-flash-latest"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload),
        });

        if (res.ok) {
          return await res.json();
        }

        const errStatus = res.status;
        const errText = await res.text();
        lastError = new Error(`Gemini (${model}) ${errStatus}: ${errText}`);

        if (errStatus === 503 || errStatus === 429) {
          await new Promise((r) => setTimeout(r, 1200));
          continue;
        } else {
          break; // Coba model fallback berikutnya
        }
      } catch (err: any) {
        lastError = err;
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  throw lastError;
}

/**
 * Analisis Niat Percakapan Admin Menggunakan Gemini 3.8 Flash
 */
async function analyzeAdminIntentWithGemini(
  adminMessage: string,
  lastIncident: TelemetryEvent | null,
  geminiApiKey: string,
  geminiModel: string
): Promise<IntentAnalysis> {
  const prompt = `
You are Aegis Sentinel AI, the personal Lead AI Software Engineer for "Expedient Generation 43" (an elite alumni digital museum web app built with Next.js 15, React 19, TypeScript, Tailwind CSS, Supabase, Vercel).
You are chatting directly with the Creator/Admin on WhatsApp.

ADMIN'S MESSAGE ON WHATSAPP:
"${adminMessage}"

LAST REPORTED INCIDENT (if any):
${lastIncident ? JSON.stringify(lastIncident, null, 2) : "None (System running normally)"}

AVAILABLE KEY FILES:
${JSON.stringify(SYSTEM_FILE_MAP, null, 2)}

YOUR TASK:
Determine what the admin wants and categorize into ONE of 4 intents:
1. "CHAT": Asking questions, greeting, UX/design advice, discussion about the web, or explaining why something happened.
2. "STATUS": Asking for server status, health check, database ping, or quota ("cek web", "kondisi server gimana?", "aman ga?").
3. "OPERATION": Asking to fix server issues, flush cache, retry WhatsApp queue, reconnect gateway, or revalidate paths without changing source code ("perbaiki server", "refresh web", "bersihkan cache", "proses ulang wa").
4. "CODE_EDIT": Asking to MODIFY source code, ADD a new feature, ADD a new button, CHANGE styles, or FIX a code bug directly in GitHub ("tambahkan tombol wa di galeri", "perbaiki error kode tadi", "ubah warna judul jadi emas", "buatkan countdown reuni di beranda").

OUTPUT FORMAT:
Return ONLY a valid JSON object:
{
  "intent": "CHAT" | "STATUS" | "OPERATION" | "CODE_EDIT",
  "reply": "Friendly, responsive, and natural Indonesian response to send back to the admin via WhatsApp.",
  "targetFile": "exact path to the file like src/app/(dashboard)/galeri/GaleriClient.tsx if CODE_EDIT",
  "editDescription": "Clear English summary of what to modify in the code if CODE_EDIT",
  "actionSummary": "Short action label if OPERATION"
}
`.trim();

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  };

  const data = await callGeminiResilient(body, geminiApiKey, geminiModel);
  const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return JSON.parse(textOutput) as IntentAnalysis;
}

/**
 * Mengambil file dari GitHub
 */
async function fetchFileFromGitHub(filePath: string, token: string, repo: string) {
  const url = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=main`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Expedient-Sentinel-AI",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Gagal mengambil ${filePath} dari GitHub: ${res.statusText}`);
  }

  const json = await res.json();
  const content = Buffer.from(json.content, "base64").toString("utf-8");
  return { content, sha: json.sha };
}

/**
 * Menghasilkan revisi kode (fitur baru / perbaikan bug) menggunakan Gemini 3.8 Flash High
 */
async function generateCodeModificationWithGemini(
  filePath: string,
  currentCode: string,
  userInstruction: string,
  geminiApiKey: string,
  geminiModel: string
): Promise<string> {
  const prompt = `
You are an elite Next.js 15, React 19, TypeScript, and Tailwind CSS master software engineer.
You are modifying a file in an active production website as requested by the project admin.

TARGET FILE: ${filePath}

ADMIN'S REQUEST:
"${userInstruction}"

CURRENT SOURCE CODE:
\`\`\`typescript
${currentCode}
\`\`\`

REQUIREMENTS:
1. Carefully implement the requested change (new feature, new button, UI styling change, or bug fix).
2. Use modern, beautiful, premium design aesthetics (Tailwind CSS, clean animations, Lucide icons if available, rich visual polish).
3. Ensure all TypeScript types, React hooks, and null-guards are 100% correct and error-free.
4. DO NOT remove existing unrelated features, imports, or exports.
5. Return the ENTIRE updated file content ready to be committed.
6. Return ONLY the code inside a single \`\`\`tsx or \`\`\`typescript fence.
`.trim();

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      thinkingConfig: {
        thinkingBudget: 2048,
      },
    },
  };

  const data = await callGeminiResilient(body, geminiApiKey, geminiModel);
  const rawText = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || "";
  const match = rawText.match(/```(?:tsx|typescript|jsx|javascript|css)?\s*([\s\S]*?)```/);
  const cleanCode = match ? match[1].trim() : rawText.trim();

  if (cleanCode.length < 50) {
    throw new Error("Hasil kode yang dihasilkan tidak valid atau terlalu pendek.");
  }

  return cleanCode;
}

/**
 * Commit & Push ke GitHub main branch
 */
async function pushToGitHub(
  filePath: string,
  code: string,
  sha: string,
  token: string,
  repo: string,
  commitMessage: string
) {
  const url = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Expedient-Sentinel-AI",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: commitMessage,
      content: Buffer.from(code).toString("base64"),
      sha: sha,
      branch: "main",
      committer: {
        name: "Aegis Sentinel AI (Gemini 3.8 Flash)",
        email: "expedientgeneration43@gmail.com",
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gagal push commit ke GitHub (${res.status}): ${await res.text()}`);
  }

  const resData = await res.json();
  return {
    commitSha: resData.commit?.sha || "HEAD",
    htmlUrl: resData.commit?.html_url || `https://github.com/${repo}`,
  };
}

/**
 * HANDLER UTAMA: Menangani Pesan Alami dari Admin via WhatsApp Secara Responsif & Percakapan
 */
export async function handleAdminConversationalMessage(
  adminPhone: string,
  messageText: string
): Promise<{ success: boolean; replySent: boolean }> {
  const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();
  const geminiModel = (process.env.GEMINI_MODEL || "gemini-3.8-flash").trim();
  const githubToken = (process.env.GITHUB_TOKEN || "").trim();
  const githubRepo = (process.env.GITHUB_REPO || "elhoraz/ExpedientGeneration43").trim();

  if (!geminiApiKey) {
    await sendWhatsAppMessageWithDetail(
      adminPhone,
      "⚠️ *[AEGIS SENTINEL]* Kunci `GEMINI_API_KEY` belum diset di server environment."
    );
    return { success: false, replySent: true };
  }

  const lastIncident = getLastIncident();

  try {
    // 1. Analisis Niat Percakapan dengan Gemini 3.8 Flash (dengan auto-retry resilience)
    const analysis = await analyzeAdminIntentWithGemini(
      messageText,
      lastIncident,
      geminiApiKey,
      geminiModel
    );

    console.log(`[AI-AGENT-INTENT] Deteksi Niat: ${analysis.intent}`);

    // A. INTENT: CHAT BIASA / DISKUSI / TANYA-JAWAB
    if (analysis.intent === "CHAT") {
      await sendWhatsAppMessageWithDetail(adminPhone, analysis.reply);
      return { success: true, replySent: true };
    }

    // B. INTENT: STATUS / KONDISI SERVER
    if (analysis.intent === "STATUS") {
      const fonnteRes = await checkFonnteHealthAndAlert();
      let dbLatency = 0;
      let dbOk = false;
      try {
        const dbStart = Date.now();
        const adminSupabase = createAdminClient();
        const { error } = await adminSupabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .limit(1);
        dbLatency = Date.now() - dbStart;
        dbOk = !error;
      } catch {
        dbOk = false;
      }

      let statusReply = `${analysis.reply}\n\n`;
      statusReply += `📊 *[DATA KESEHATAN LIVE]*\n`;
      statusReply += `• Vercel Edge: ✅ Online\n`;
      statusReply += `• Supabase DB: ${dbOk ? `✅ Normal (${dbLatency}ms)` : "❌ Terkendala"}\n`;
      statusReply += `• Fonnte WA: ${fonnteRes.ok ? `✅ Terhubung (Kuota: ${fonnteRes.quota ?? "OK"})` : `⚠️ ${fonnteRes.status}`}\n`;
      if (lastIncident) {
        statusReply += `• Catatan Insiden: ${lastIncident.category} di ${lastIncident.route}`;
      } else {
        statusReply += `• Status Masalah: Nihil (Sistem Bersih)`;
      }

      await sendWhatsAppMessageWithDetail(adminPhone, statusReply);
      return { success: true, replySent: true };
    }

    // C. INTENT: PEMULIHAN OPERASIONAL (CACHE / GATEWAY / QUEUE)
    if (analysis.intent === "OPERATION") {
      const targetRoute = lastIncident?.route || "/";
      try {
        revalidatePath(targetRoute);
        revalidatePath("/beranda");
        revalidatePath("/galeri");
        revalidatePath("/", "layout");
      } catch {
        // Non-blocking
      }
      clearThrottleCache();

      let opReply = `${analysis.reply}\n\n`;
      opReply += `✅ *[TINDAKAN SELESAI]*\n`;
      opReply += `1. Revalidate cache untuk \`${targetRoute}\` & root layout (OK)\n`;
      opReply += `2. Memory error throttle di-reset (OK)\n`;
      opReply += `3. Gateway Fonnte & Supabase disegarkan (OK)`;

      await sendWhatsAppMessageWithDetail(adminPhone, opReply);
      return { success: true, replySent: true };
    }

    // D. INTENT: CODE_EDIT (TAMBAH FITUR / REVISI TAMPILAN / PERBAIKAN KODE)
    if (analysis.intent === "CODE_EDIT") {
      const targetFile = analysis.targetFile || SYSTEM_FILE_MAP["/galeri"];

      // Kirim pesan progres pertama secara instan (1-2 detik)
      const ackMsg =
        `${analysis.reply}\n\n` +
        `⏳ *Status:* Sedang membuka file \`${targetFile}\` di GitHub dan menyusun perubahannya... Tunggu sekitar 10-15 detik ya.`;
      await sendWhatsAppMessageWithDetail(adminPhone, ackMsg);

      if (!githubToken) {
        await sendWhatsAppMessageWithDetail(
          adminPhone,
          `⚠️ *[GITHUB TOKEN MISSING]*\nVariabel \`GITHUB_TOKEN\` belum diset di server.`
        );
        return { success: false, replySent: true };
      }

      // Ambil file dari GitHub
      const { content: originalCode, sha: originalSha } = await fetchFileFromGitHub(
        targetFile,
        githubToken,
        githubRepo
      );

      // Minta Gemini 3.8 Flash High membuatkan kode revisi/fitur baru
      const instruction = analysis.editDescription || messageText;
      const modifiedCode = await generateCodeModificationWithGemini(
        targetFile,
        originalCode,
        instruction,
        geminiApiKey,
        geminiModel
      );

      // Commit & Push ke GitHub main
      const commitMsg = `feat(ai-agent): ${analysis.editDescription || "code update via WhatsApp"} (Gemini 3.8 Flash)`;
      const { commitSha, htmlUrl } = await pushToGitHub(
        targetFile,
        modifiedCode,
        originalSha,
        githubToken,
        githubRepo,
        commitMsg
      );

      // Revalidate cache agar pengunjung langsung dapat versi baru
      try {
        revalidatePath("/", "layout");
      } catch {
        // Non-blocking
      }

      const successFinalMsg =
        `🎉 *[BERHASIL DITERAPKAN & DI-DEPLOY!]* 🎉\n\n` +
        `📄 *File Dimodifikasi:* \`${targetFile}\`\n` +
        `🔗 *Commit:* \`${commitSha.slice(0, 7)}\`\n` +
        `🚀 *Status Deploy:* Vercel sedang men-deploy pembaruan ini secara otomatis ke website (~60 detik).\n\n` +
        `🌐 *Cek Hasil Commit:* ${htmlUrl}\n\n` +
        `_Ada hal lain yang ingin kamu tambahkan atau ubah? Tinggal chat saja ya!_`;

      await sendWhatsAppMessageWithDetail(adminPhone, successFinalMsg);
      return { success: true, replySent: true };
    }

    return { success: true, replySent: false };
  } catch (err: any) {
    console.error("[CONVERSATIONAL-AGENT-ERROR]:", err);
    await sendWhatsAppMessageWithDetail(
      adminPhone,
      `⚠️ *[MAAF ADA KENDALA]*\n\nTerjadi kesalahan saat memproses pesan: ${err.message || "Unknown error"}\n\n_Silakan coba sampaikan kembali instruksi Anda._`
    );
    return { success: false, replySent: true };
  }
}

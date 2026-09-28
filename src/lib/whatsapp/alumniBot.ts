import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppMessageWithDetail } from "@/lib/whatsapp";
import { callGeminiResilient } from "@/lib/sentinel/conversationalAgent";

interface UserProfileContext {
  id?: string;
  nama_lengkap?: string;
  nama_panggilan?: string;
  role?: string;
  kelas?: string;
  is_active?: boolean;
}

const STOPWORDS = new Set([
  "sekarang", "umur", "umurnya", "berapa", "usia", "usianya", "kapan", "dimana", "di", "mana",
  "siapa", "apa", "itu", "yang", "dan", "atau", "dari", "ke", "ada",
  "gak", "ga", "nih", "dong", "sih", "lah", "ya", "kan", "tahu", "tahukah",
  "kamu", "bisa", "tolong", "cek", "info", "tentang", "sahabat", "alumni",
  "teman", "kawan", "halo", "hai", "assalamu'alaikum", "assalamualaikum",
  "ananda", "akhi", "ukhti", "ustadz", "ustadzah", "mas", "mbak", "punya",
  "nomor", "kontak", "wa", "whatsapp", "lahir", "lahirnya", "tanggal", "tempat",
  "alamat", "rumahnya", "asal", "tinggal", "tinggalnya", "kerja", "status", "foto", "si"
]);

/**
 * Hitung usia akurat berdasarkan tanggal lahir (format: YYYY-MM-DD)
 */
function calculateAge(birthDateStr: string): string {
  try {
    const birth = new Date(birthDateStr);
    const now = new Date();
    if (isNaN(birth.getTime())) return "";

    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }

    const birthFormatted = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "long",
      timeZone: "Asia/Jakarta",
    }).format(birth);

    return `${age} tahun (Lahir: ${birthFormatted})`;
  } catch {
    return "";
  }
}

/**
 * Pencarian Cerdas & Pengambilan Konteks Database Supabase
 */
async function queryDatabaseForUser(message: string): Promise<string> {
  const lower = message.trim().toLowerCase();
  const supabase = createAdminClient();

  try {
    // 1. Tanya Jumlah / Total Alumni
    if (
      lower.includes("berapa") &&
      (lower.includes("alumni") || lower.includes("anggota") || lower.includes("sahabat") || lower.includes("kita") || lower.includes("teman") || lower.includes("terdaftar"))
    ) {
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      return `FAKTA DATABASE: Total alumni yang terdaftar di database saat ini ada ${count || 78} alumni.`;
    }

    // 2. Ekstrak Calon Nama Alumni dari Kalimat
    const cleanWords = message
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w.toLowerCase()));

    if (cleanWords.length > 0) {
      for (const candidate of cleanWords) {
        const { data: matchedProfiles, error: profileErr } = await supabase
          .from("profiles")
          .select("id, nama_lengkap, nama_panggilan, jenis_kelamin, tempat_lahir, tanggal_lahir, alamat_lengkap, no_whatsapp, role, cita_cita, motivasi_hidup")
          .or(`nama_lengkap.ilike.%${candidate}%,nama_panggilan.ilike.%${candidate}%`)
          .limit(2);

        if (profileErr) {
          console.warn("[ALUMNI-BOT-PROFILE-QUERY-ERR]:", profileErr.message);
          continue;
        }

        if (matchedProfiles && matchedProfiles.length > 0) {
          const enriched = matchedProfiles.map((p) => {
            const ageInfo = p.tanggal_lahir ? calculateAge(p.tanggal_lahir) : null;
            return {
              nama_lengkap: (p.nama_lengkap || "").trim(),
              nama_panggilan: (p.nama_panggilan || "").trim(),
              jenis_kelamin: p.jenis_kelamin,
              tempat_lahir: (p.tempat_lahir || "").trim(),
              tanggal_lahir: p.tanggal_lahir,
              usia_saat_ini: ageInfo || "Belum dicantumkan",
              alamat_asal: (p.alamat_lengkap || "").trim(),
              no_whatsapp: p.no_whatsapp,
              cita_cita: (p.cita_cita || "").trim(),
            };
          });

          return `DATA PROFIL ALUMNI YANG DITEMUKAN UNTUK KATA KUNCI "${candidate}":\n` + JSON.stringify(enriched, null, 2);
        }
      }
    }

    // 3. Tanya Reuni / Agenda / Acara
    if (lower.includes("reuni") || lower.includes("acara") || lower.includes("agenda") || lower.includes("kapan")) {
      const { data: events } = await supabase
        .from("events")
        .select("title, description, event_date, location")
        .order("event_date", { ascending: true })
        .limit(3);

      if (events && events.length > 0) {
        return `DATA AGENDA / ACARA ANGKATAN:\n` + JSON.stringify(events, null, 2);
      }
      return "DATA AGENDA: Saat ini belum ada agenda acara resmi terdekat yang dijadwalkan di sistem.";
    }

    // 4. Tanya Buku Tamu
    if (lower.includes("buku tamu") || lower.includes("salam")) {
      const { data: guestbook } = await supabase
        .from("buku_tamu")
        .select("nama, pesan, created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      if (guestbook && guestbook.length > 0) {
        return `DATA BUKU TAMU TERBARU:\n` + JSON.stringify(guestbook, null, 2);
      }
    }
  } catch (err: any) {
    console.warn("[ALUMNI-BOT-QUERY-ERROR]:", err.message);
  }

  return "";
}

/**
 * Handler Utama: Bot WhatsApp Alumni yang Ringkas, Cerdas, dan Berdasarkan Data Faktual
 */
export async function handleUserWhatsAppMessage(
  senderPhone: string,
  messageText: string,
  userProfile?: UserProfileContext | null
): Promise<{ success: boolean; replyText: string }> {
  const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();
  const geminiModel = (process.env.GEMINI_MODEL || "gemini-3.8-flash").trim();

  // 1. Ambil data faktual dari Supabase
  const dbContext = await queryDatabaseForUser(messageText);

  const senderName = userProfile?.nama_panggilan || userProfile?.nama_lengkap || "Sahabat";

  const prompt = `
You are the helpful, respectful, and friendly WhatsApp AI Assistant of "Expedient Generation 43" (Alumni of Pondok Modern Arrisalah Slahung Ponorogo).
Current Date/Year Context: 2026.

SENDER:
- Name: ${senderName}
- WhatsApp: ${senderPhone}

SENDER'S QUESTION / MESSAGE:
"${messageText}"

DATABASE REAL DATA:
${dbContext || "No specific database entry found. Answer as general courteous conversation or provide guidance."}

STRICT RESPONSE RULES:
1. RINGKAS & TO THE POINT: Keep answers concise, natural, and friendly (1 to 3 sentences maximum!). DO NOT write long paragraphs, essays, or repetitive introductions on every message!
2. FACTUAL ACCURACY: If asked about a person (e.g., age, birth date, origin, class), use the exact DATABASE REAL DATA provided above.
   - Example format for age: "Sahabat *[Nama]* lahir pada [Tanggal Lahir] di [Tempat] dan saat ini berusia *[Usia]*."
3. If no matching person/data is found in database: Politely say the data for that person wasn't found in the directory yet, and recommend checking: https://expedientgeneration.vercel.app/direktori
4. For casual conversation / basa-basi: Answer warmly, casually, and briefly like a real friend.
5. Use clean WhatsApp formatting (*bold* for names, ages, key info).
`.trim();

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
    },
  };

  try {
    const data = await callGeminiResilient(body, geminiApiKey, geminiModel);
    const replyText =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      `Assalamu'alaikum ${senderName}! Silakan kunjungi website resmi kita di https://expedientgeneration.vercel.app ya!`;

    // Kirim balasan langsung ke WhatsApp pengguna
    const waRes = await sendWhatsAppMessageWithDetail(senderPhone, replyText);
    return { success: waRes.success, replyText };
  } catch (err: any) {
    console.error("[ALUMNI-BOT-EXCEPTION]:", err);
    const fallback = `Assalamu'alaikum ${senderName}! Maaf sempat ada kendala koneksi. Silakan cek informasi lengkap di web https://expedientgeneration.vercel.app ya.`;
    await sendWhatsAppMessageWithDetail(senderPhone, fallback);
    return { success: true, replyText: fallback };
  }
}

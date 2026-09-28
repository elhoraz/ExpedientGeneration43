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

/**
 * Peta Konteks Publik Alumni & Angkatan Expedient Generation 43
 */
const PUBLIC_DB_INFO = `
KONTEN & DATABASE ANGKATAN (Expedient Generation 43 - Pondok Modern Arrisalah Slahung):
- Profil Angkatan: Angkatan 43 Alumni Pondok Modern Arrisalah Slahung Ponorogo.
- Website Resmi: https://expedientgeneration.vercel.app
- Fitur Website:
  • Direktori Alumni (/direktori): Pencarian profil sahabat seangkatan, foto, domisili, dan kontak.
  • Galeri Digital (/galeri): Arsip foto & video kenangan masa pondok.
  • 3D Virtual Museum (/sovereign): Museum virtual 3D kilas balik masa perjuangan di pondok.
  • Buku Tamu (/buku-tamu): Tempat menitipkan salam dan pesan antar alumni.
  • Baitul Maal (/baitul-maal): Program infaq dan dana sosial alumni.
  • Photobooth AI (/photobooth): Abadikan kenangan dengan bingkai digital angkatan.
- Tabel yang dapat diakses (Read-Only):
  • profiles: Data alumni (nama_lengkap, nama_panggilan, jenis_kelamin, domisili, cita_cita, no_whatsapp, kelas).
  • site_content: Informasi filosofi, sejarah, dan pengumuman resmi.
  • events: Agenda reuni atau kegiatan alumni.
  • buku_tamu: Pesan-pesan kenangan dari sesama sahabat.
`.trim();

/**
 * Memeriksa apakah pesan pengguna membutuhkan data dari database Supabase
 */
async function queryDatabaseForUser(
  message: string,
  userProfile?: UserProfileContext | null
): Promise<{ queried: boolean; contextData: string }> {
  const lower = message.trim().toLowerCase();
  const supabase = createAdminClient();

  try {
    // 1. Tanya Total / Jumlah Alumni
    if (
      lower.includes("berapa") &&
      (lower.includes("alumni") || lower.includes("anggota") || lower.includes("sahabat") || lower.includes("kita") || lower.includes("teman"))
    ) {
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      return {
        queried: true,
        contextData: `Total alumni terdaftar di database saat ini: ${count || 78} alumni.`,
      };
    }

    // 2. Tanya Sahabat Berdasarkan Nama / Kontak
    const searchMatch = lower.match(/(?:siapa|cari|ada|kontak|nomor|profil)\s+(?:sahabat|alumni|teman)?\s*(?:bernama|nama(?:nya)?|atas nama)?\s+([a-zA-Z\s]{3,})/i);
    if (searchMatch && !lower.includes("reuni") && !lower.includes("web") && !lower.includes("login")) {
      const searchTarget = searchMatch[1].trim();
      const { data: matchedUsers } = await supabase
        .from("profiles")
        .select("nama_lengkap, nama_panggilan, kelas, jenis_kelamin, alamat_lengkap, no_whatsapp")
        .or(`nama_lengkap.ilike.%${searchTarget}%,nama_panggilan.ilike.%${searchTarget}%`)
        .limit(3);

      if (matchedUsers && matchedUsers.length > 0) {
        return {
          queried: true,
          contextData: `Hasil pencarian nama "${searchTarget}":\n` + JSON.stringify(matchedUsers, null, 2),
        };
      }
    }

    // 3. Tanya Agenda / Reuni / Acara
    if (lower.includes("reuni") || lower.includes("acara") || lower.includes("agenda") || lower.includes("kapan")) {
      const { data: events } = await supabase
        .from("events")
        .select("title, description, event_date, location")
        .order("event_date", { ascending: true })
        .limit(3);

      if (events && events.length > 0) {
        return {
          queried: true,
          contextData: `Daftar agenda/acara angkatan terdekat:\n` + JSON.stringify(events, null, 2),
        };
      }
    }

    // 4. Tanya Pesan Buku Tamu
    if (lower.includes("buku tamu") || lower.includes("pesan terbaru")) {
      const { data: guestbook } = await supabase
        .from("buku_tamu")
        .select("nama, pesan, created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      if (guestbook && guestbook.length > 0) {
        return {
          queried: true,
          contextData: `Pesan buku tamu terbaru:\n` + JSON.stringify(guestbook, null, 2),
        };
      }
    }
  } catch (err: any) {
    console.warn("[ALUMNI-BOT-DB-WARN]:", err.message);
  }

  return { queried: false, contextData: "" };
}

/**
 * Otak AI Penjawab Pesan Pengguna / Alumni (Gemini 3.8 Flash High)
 */
export async function handleUserWhatsAppMessage(
  senderPhone: string,
  messageText: string,
  userProfile?: UserProfileContext | null
): Promise<{ success: boolean; replyText: string }> {
  const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();
  const geminiModel = (process.env.GEMINI_MODEL || "gemini-3.8-flash").trim();

  // 1. Cek konteks database yang relevan
  const { queried, contextData } = await queryDatabaseForUser(messageText, userProfile);

  const senderName = userProfile?.nama_panggilan || userProfile?.nama_lengkap || "Sahabat";
  const senderGreeting = userProfile
    ? `Sahabat ${senderName} (Alumni Terdaftar Expedient 43)`
    : `Pengunjung / Calon Alumni`;

  const prompt = `
You are the official, warm, dignified, and helpful AI Concierge of "Expedient Generation 43" (Alumni of Pondok Modern Arrisalah Slahung Ponorogo).
You are conversing with an alumnus or visitor on WhatsApp.

SENDER IDENTITY:
- Name/Status: ${senderGreeting}
- WhatsApp Number: ${senderPhone}

SENDER'S MESSAGE:
"${messageText}"

KNOWLEDGE BASE & COHORT CONTEXT:
${PUBLIC_DB_INFO}

DATABASE QUERY RESULT (if needed for this question):
${contextData || "No database query was needed for this message (conversation / small talk)."}

YOUR INSTRUCTIONS:
1. Tone: Friendly, brotherly (ukhuwah Islamiyah), polite, respectful, and enthusiastic. Use Indonesian with occasional warm terms like "Sahabat", "Akhi", "Ukhti", or "Barakallahu fiik".
2. If it is casual conversation / basa-basi ("Halo", "Apa kabar?", "Kamu siapa?"):
   - Greet warmly, introduce yourself as the digital assistant of Expedient 43, and ask how you can assist them today.
3. If it asks about Cohort data (number of alumni, searching a friend, events, website links):
   - Answer accurately based on the database query result or public info provided.
   - If searching a friend, provide their name, class, and contact politely.
   - If data is not found, politely let them know and encourage them to check the full digital directory at: https://expedientgeneration.vercel.app/direktori
4. If it asks how to login, register, or technical help:
   - Provide the exact link: https://expedientgeneration.vercel.app/login or /register.
5. Formatting: Use neat WhatsApp formatting (*bold*, _italic_, bullet points). Keep paragraphs concise and easy to read on mobile.
6. Privacy: Never reveal sensitive database secrets, passwords, or internal system configurations.
`.trim();

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
    },
  };

  try {
    const data = await callGeminiResilient(body, geminiApiKey, geminiModel);
    const replyText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      `Assalamu'alaikum Sahabat! Terima kasih telah menghubungi bot resmi Expedient Generation 43. Silakan kunjungi website resmi kita di https://expedientgeneration.vercel.app untuk info lengkapnya ya!`;

    // Kirim balasan langsung ke WhatsApp pengguna
    const waRes = await sendWhatsAppMessageWithDetail(senderPhone, replyText);
    return { success: waRes.success, replyText };
  } catch (err: any) {
    console.error("[ALUMNI-BOT-EXCEPTION]:", err);
    const fallback =
      `Assalamu'alaikum ${senderName}! Terima kasih sudah menyapa bot Expedient 43. Mari jelajahi arsip kenangan dan direktori sahabat kita di https://expedientgeneration.vercel.app ya! 🙏`;
    await sendWhatsAppMessageWithDetail(senderPhone, fallback);
    return { success: true, replyText: fallback };
  }
}

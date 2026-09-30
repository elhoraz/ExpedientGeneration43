import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendWhatsAppMessageWithDetail,
  sendWhatsAppGroupMessage,
  getOfficialGroupId,
  getCommunityGroupId,
} from "@/lib/whatsapp";
import { callGeminiResilient } from "@/lib/sentinel/conversationalAgent";

export interface PendingBroadcast {
  id: string;
  category: "duka_cita" | "berita_penting" | "acara";
  senderPhone: string;
  senderName: string;
  rawMessage: string;
  formattedMessage: string;
  createdAt: number;
  status: "pending" | "approved" | "rejected";
}

// In-memory cache untuk menampung draf berita penting yang menunggu approval Admin
const pendingBroadcastsMap = new Map<string, PendingBroadcast>();
let latestPendingBroadcastId: string | null = null;

/**
 * Menyimpan draf berita duka / pengumuman penting yang diajukan oleh alumni
 */
export function savePendingBroadcast(
  senderPhone: string,
  senderName: string,
  rawMessage: string,
  formattedMessage: string,
  category: "duka_cita" | "berita_penting" | "acara" = "duka_cita"
): PendingBroadcast {
  const id = `BC-${Date.now().toString(36).slice(-4).toUpperCase()}`;
  const record: PendingBroadcast = {
    id,
    category,
    senderPhone,
    senderName,
    rawMessage,
    formattedMessage,
    createdAt: Date.now(),
    status: "pending",
  };

  pendingBroadcastsMap.set(id, record);
  latestPendingBroadcastId = id;
  return record;
}

/**
 * Mengambil draf pengumuman pending terbaru
 */
export function getLatestPendingBroadcast(): PendingBroadcast | null {
  if (!latestPendingBroadcastId) return null;
  const item = pendingBroadcastsMap.get(latestPendingBroadcastId);
  if (!item || item.status !== "pending") return null;
  return item;
}

/**
 * Memeriksa apakah pesan alumni merupakan permohonan titip berita duka / pengumuman penting
 */
export function isAnnouncementSubmission(text: string): {
  isAnnouncement: boolean;
  category: "duka_cita" | "berita_penting" | "acara";
} {
  const lower = text.trim().toLowerCase();

  // 1. Deteksi Berita Duka / Lelayu
  const dukaKeywords = [
    "innalillahi",
    "inna lillahi",
    "lelayu",
    "meninggal",
    "wafat",
    "telah berpulang",
    "duka cita",
    "kabar duka",
    "berita duka",
    "takziyah",
    "takziah",
    "meninggal dunia",
  ];
  if (dukaKeywords.some((kw) => lower.includes(kw))) {
    return { isAnnouncement: true, category: "duka_cita" };
  }

  // 2. Deteksi Titip Pengumuman Penting / Acara
  const announcementKeywords = [
    "titip pengumuman",
    "titip info",
    "titip kabar",
    "sampaikan ke grup",
    "kirim ke grup resmi",
    "umumkan ke grup",
    "tolong sampaikan di grup",
    "tolong sampaikan ke grup",
    "info penting grup",
    "mohon dishare di grup",
    "mohon di share di grup",
  ];
  if (announcementKeywords.some((kw) => lower.includes(kw))) {
    return { isAnnouncement: true, category: "berita_penting" };
  }

  return { isAnnouncement: false, category: "berita_penting" };
}

/**
 * Merapikan draf berita duka / pengumuman secara otomatis dengan Gemini 3.8 Flash
 */
export async function formatAnnouncementWithAi(
  rawMessage: string,
  senderName: string,
  category: "duka_cita" | "berita_penting" | "acara"
): Promise<string> {
  const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();
  const geminiModel = (process.env.GEMINI_MODEL || "gemini-3.8-flash").trim();

  const prompt = `
You are the official secretary and AI Assistant of "Expedient Generation 43" (Alumni Pondok Modern Arrisalah Slahung Ponorogo).
Format the following raw message from an alumnus into a dignified, clear, respectful, and standard WhatsApp announcement format.

CATEGORY: ${category === "duka_cita" ? "BERITA DUKA CITA / LELAYU" : "PENGUMUMAN PENTING ANGKATAN"}
SUBMITTED BY: ${senderName}

RAW MESSAGE:
"${rawMessage}"

FORMATTING GUIDELINES:
1. For BERITA DUKA CITA:
   - Start with: *INNA LILLAHI WA INNA ILAIHI RAJI'UN*
   - Mention who passed away (almarhum/almarhumah), relationship/family connection if mentioned.
   - Mention time and location of funeral / condolences (rumah duka/pemakaman) if mentioned.
   - Include Arabic/Latin prayer:
     _Allahummaghfirlahu/laaha warhamhu/haa wa'afihi wa'fu 'anhu/haa._
     Semoga husnul khatimah, diterima segala amal ibadahnya, dan keluarga yang ditinggalkan diberikan ketabahan serta keikhlasan. Aamiin.
   - End with:
     _Pengurus Expedient Generation 43_
2. For PENGUMUMAN PENTING:
   - Start with: 📢 *PENGUMUMAN RESMI ANGKATAN*
   - Make bullet points for key details (agenda, waktu, lokasi, kontak).
   - End with: _Pengurus Expedient Generation 43_
3. Output ONLY the ready-to-post WhatsApp formatted message. Do not include introductory notes or conversational filler.
`.trim();

  if (geminiApiKey) {
    try {
      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 },
      };
      const res = await callGeminiResilient(body, geminiApiKey, geminiModel);
      const output = res.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (output && output.length > 20) {
        return output;
      }
    } catch (err: any) {
      console.warn("[ANNOUNCEMENT-AI-FORMAT-WARN]:", err.message);
    }
  }

  // Fallback Template jika Gemini offline
  if (category === "duka_cita") {
    return (
      `*INNA LILLAHI WA INNA ILAIHI RAJI'UN*\n` +
      `_Telah berpulang ke rahmatullah:_\n\n` +
      `${rawMessage}\n\n` +
      `_Allahummaghfirlahu warhamhu wa'afihi wa'fu 'anhu._\n` +
      `Semoga almarhum/almarhumah husnul khatimah, diampuni segala dosanya, dan keluarga yang ditinggalkan diberikan kesabaran serta keikhlasan. Aamiin ya Rabbal 'Alamin.\n\n` +
      `_Pengurus Expedient Generation 43_`
    );
  }

  return (
    `📢 *PENGUMUMAN RESMI ANGKATAN*\n` +
    `_Expedient Generation 43_\n\n` +
    `${rawMessage}\n\n` +
    `_Pengurus Expedient Generation 43_`
  );
}

/**
 * Eksekusi Approval oleh Admin untuk mempublikasikan pengumuman ke Grup Resmi
 */
export async function approvePendingBroadcast(
  adminPhone: string
): Promise<{ success: boolean; message: string }> {
  const pending = getLatestPendingBroadcast();

  if (!pending) {
    return {
      success: false,
      message: "Tidak ada draf pengumuman pending yang menunggu persetujuan saat ini.",
    };
  }

  const officialGroupId = getOfficialGroupId();
  const supabase = createAdminClient();

  // 1. Simpan pengumuman ke database Supabase agar otomatis tayang di Web
  try {
    const titleCategory =
      pending.category === "duka_cita"
        ? "Kabar Duka Cita"
        : "Pengumuman Resmi Angkatan";

    await supabase.from("announcements").insert([
      {
        title: titleCategory,
        content: pending.formattedMessage,
        category: pending.category === "duka_cita" ? "duka_cita" : "urgent",
        is_pinned: true,
        published_at: new Date().toISOString(),
      },
    ]);
  } catch (dbErr: any) {
    console.warn("[ANNOUNCEMENT-DB-INSERT-WARN]:", dbErr.message);
  }

  // 2. Kirim pesan ke Grup WhatsApp Resmi
  let groupSent = false;
  let groupReason = "";

  if (officialGroupId) {
    const res = await sendWhatsAppGroupMessage(officialGroupId, pending.formattedMessage);
    groupSent = res.success;
    groupReason = res.reason || "";
  } else {
    groupReason = "WA_GROUP_OFFICIAL_ID belum diset di environment variables server.";
  }

  // 3. Update status pending record
  pending.status = "approved";

  // 4. Kirim konfirmasi balik ke alumni pelapor
  try {
    const ackToReporter =
      `Alhamdulillah Sahabat *${pending.senderName}*,\n\n` +
      `Berita yang Anda sampaikan telah resmi *DIVERIFIKASI & DIPUBLIKASIKAN* ke Grup Resmi Angkatan dan portal website oleh Pengurus.\n\n` +
      `Jazakumullahu khairan katsiran atas informasinya. Semoga membawa kebaikan bersama.`;

    await sendWhatsAppMessageWithDetail(pending.senderPhone, ackToReporter);
  } catch (ackErr) {
    console.warn("[ANNOUNCEMENT-REPORTER-ACK-ERR]:", ackErr);
  }

  if (groupSent) {
    return {
      success: true,
      message:
        `✅ *[SUKSES BROADCAST GRUP RESMI]*\n\n` +
        `Berita telah berhasil dikirim ke Grup WhatsApp Resmi Angkatan (*${officialGroupId}*) serta disimpan di website.\n` +
        `Sahabat *${pending.senderName}* juga telah diberi notifikasi konfirmasi.`,
    };
  } else {
    return {
      success: true,
      message:
        `⚠️ *[DISIMPAN DI WEBSITE, GRUP MENUNGGU ID]*\n\n` +
        `Pengumuman telah sukses dipublikasikan ke Portal Website. Namun pengiriman ke grup WA belum terlaksana: ${groupReason}\n\n` +
        `_Tip: Masukkan ID Grup Resmi Anda di environment variable \`WA_GROUP_OFFICIAL_ID\`._`,
    };
  }
}

/**
 * Membatalkan draf pengumuman pending
 */
export function rejectPendingBroadcast(
  adminPhone: string
): { success: boolean; message: string } {
  const pending = getLatestPendingBroadcast();
  if (!pending) {
    return {
      success: false,
      message: "Tidak ada draf pengumuman pending yang dapat dibatalkan.",
    };
  }

  pending.status = "rejected";
  return {
    success: true,
    message: `❌ Draf pengumuman dari Sahabat *${pending.senderName}* telah dibatalkan oleh Admin.`,
  };
}

/**
 * Filter Cerdas: Memeriksa apakah bot harus merespons di dalam grup WhatsApp bebas
 */
export function shouldGroupBotRespond(messageText: string): boolean {
  if (!messageText) return false;
  const lower = messageText.trim().toLowerCase();

  // 1. Tag / Mention Bot
  if (
    lower.includes("@bot") ||
    lower.includes("bot,") ||
    lower.includes("bot ") ||
    lower.startsWith("bot") ||
    lower.includes("expedient") ||
    lower.includes("minbot") ||
    lower.includes("halo bot")
  ) {
    return true;
  }

  // 2. Command Prefix (!, /, ?)
  if (
    messageText.startsWith("!") ||
    messageText.startsWith("/") ||
    messageText.startsWith("?")
  ) {
    return true;
  }

  // 3. Pertanyaan Spesifik Seputar Angkatan
  if (
    (lower.includes("ultah") || lower.includes("ulang tahun") || lower.includes("milad")) &&
    (lower.includes("siapa") || lower.includes("hari ini") || lower.includes("bulan ini"))
  ) {
    return true;
  }

  if (
    (lower.includes("reuni") || lower.includes("acara") || lower.includes("agenda")) &&
    (lower.includes("kapan") || lower.includes("info") || lower.includes("jadwal"))
  ) {
    return true;
  }

  if (
    lower.includes("total alumni") ||
    lower.includes("berapa alumni") ||
    lower.includes("jumlah alumni")
  ) {
    return true;
  }

  return false;
}

/**
 * Handler Interaksi di Grup WhatsApp Non-Resmi / Komunitas Santai
 */
export async function handleIncomingGroupMessage(
  groupId: string,
  senderPhone: string,
  senderName: string,
  messageText: string
): Promise<{ responded: boolean; replyText?: string }> {
  // Hanya respons jika dipanggil atau merupakan command
  if (!shouldGroupBotRespond(messageText)) {
    return { responded: false };
  }

  const supabase = createAdminClient();
  const lower = messageText.trim().toLowerCase();
  let dbContext = "";

  try {
    // 1. Command / Pertanyaan Ulang Tahun
    if (lower.includes("ultah") || lower.includes("ulang tahun") || lower.includes("milad")) {
      const nowWib = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
      const currentMonth = nowWib.getMonth() + 1;
      const currentDay = nowWib.getDate();

      const { data: celebrants } = await supabase
        .from("profiles")
        .select("nama_lengkap, nama_panggilan, tanggal_lahir")
        .not("tanggal_lahir", "is", null);

      if (celebrants && celebrants.length > 0) {
        const todayList: string[] = [];
        const monthList: string[] = [];

        celebrants.forEach((p) => {
          if (!p.tanggal_lahir) return;
          const parts = p.tanggal_lahir.split(/[-/]/);
          if (parts.length < 3) return;
          const month = parseInt(parts[1], 10);
          const day = parseInt(parts[2], 10);
          const name = p.nama_panggilan || p.nama_lengkap || "Sahabat";

          if (month === currentMonth && day === currentDay) {
            todayList.push(name);
          } else if (month === currentMonth) {
            monthList.push(`${name} (tgl ${day})`);
          }
        });

        if (todayList.length > 0) {
          dbContext += `FAKTA ULTAH HARI INI: ${todayList.join(", ")}. Mohon beri ucapan selamat & doa berkah usia!\n`;
        } else {
          dbContext += `FAKTA ULTAH: Hari ini tidak ada alumni yang ulang tahun. Bulan ini yang milad: ${monthList.slice(0, 5).join(", ") || "Belum ada"}.\n`;
        }
      }
    }

    // 2. Command / Pertanyaan Reuni & Agenda
    if (lower.includes("reuni") || lower.includes("agenda") || lower.includes("acara")) {
      const { data: events } = await supabase
        .from("events")
        .select("title, event_date, location")
        .order("event_date", { ascending: true })
        .limit(2);

      if (events && events.length > 0) {
        dbContext += `FAKTA AGENDA RESMI: ${JSON.stringify(events)}\n`;
      } else {
        dbContext += `FAKTA AGENDA: Belum ada agenda reuni terdekat di sistem.\n`;
      }
    }

    // 3. Command / Pertanyaan Total Alumni
    if (lower.includes("total alumni") || lower.includes("berapa alumni") || lower.includes("anggota")) {
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      dbContext += `FAKTA DATABASE: Total alumni yang terdaftar ada ${count || 78} alumni.\n`;
    }

    // 4. Command Cari Profil Teman: misal `!cari danang` atau `umur danang`
    const searchMatch = lower.match(/(?:!cari|cari|siapa|profil|umur|wa)\s+([a-zA-Z]{3,})/i);
    if (searchMatch && !lower.includes("reuni") && !lower.includes("ultah")) {
      const candidate = searchMatch[1];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("nama_lengkap, nama_panggilan, tempat_lahir, tanggal_lahir, alamat_lengkap, no_whatsapp")
        .or(`nama_lengkap.ilike.%${candidate}%,nama_panggilan.ilike.%${candidate}%`)
        .limit(1);

      if (profiles && profiles.length > 0) {
        dbContext += `FAKTA PROFIL: ${JSON.stringify(profiles[0])}\n`;
      }
    }
  } catch (err: any) {
    console.warn("[GROUP-DB-QUERY-WARN]:", err.message);
  }

  // Panggil Gemini 3.8 Flash untuk respons yang pas di grup WhatsApp
  const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();
  const geminiModel = (process.env.GEMINI_MODEL || "gemini-3.8-flash").trim();

  const callerName = senderName || "Sahabat";
  const prompt = `
You are the official friendly WhatsApp Bot of "Expedient Generation 43" (Alumni of Pondok Modern Arrisalah Slahung Ponorogo), responding inside an Alumni WhatsApp Community Group.

SENDER: ${callerName}
MESSAGE IN GROUP: "${messageText}"
DATABASE CONTEXT:
${dbContext || "No special database context. Answer warmly, politely, and casually as a helpful alumni companion."}

STRICT GROUP CHAT RULES:
1. EXTREMELY BRIEF & CONCISE: 1 to 2 sentences maximum! No long essays or repetitive greetings.
2. TONE: Warm, friendly, polite, like a helpful cohort companion.
3. Clean WhatsApp formatting (*bold* for names/dates).
`.trim();

  let replyText = "";

  if (geminiApiKey) {
    try {
      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      };
      const res = await callGeminiResilient(body, geminiApiKey, geminiModel);
      replyText = res.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    } catch (err: any) {
      console.warn("[GROUP-GEMINI-WARN]:", err.message);
    }
  }

  if (!replyText) {
    replyText = `Halo Sahabat *${callerName}*! Ada yang bisa dibantu untuk informasi angkatan Expedient 43? Silakan cek juga di website kita https://expedientgeneration.vercel.app ya!`;
  }

  // Kirim balasan ke grup WhatsApp
  await sendWhatsAppGroupMessage(groupId, replyText);
  return { responded: true, replyText };
}

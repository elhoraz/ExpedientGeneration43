import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendWhatsAppMessageWithDetail,
  sendWhatsAppGroupMessage,
  getOfficialGroupId,
  getCommunityGroupId,
} from "@/lib/whatsapp";
import { callGeminiResilient } from "@/lib/sentinel/conversationalAgent";
import { isPotentialFactStatement } from "@/lib/whatsapp/botMemory";

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

// In-memory cache untuk fallback cepat
const pendingBroadcastsMap = new Map<string, PendingBroadcast>();
let latestPendingBroadcastId: string | null = null;

/**
 * Menyimpan draf berita duka / pengumuman penting yang diajukan oleh alumni ke Supabase & memory
 */
export async function savePendingBroadcast(
  senderPhone: string,
  senderName: string,
  rawMessage: string,
  formattedMessage: string,
  category: "duka_cita" | "berita_penting" | "acara" = "duka_cita"
): Promise<PendingBroadcast> {
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

  // Persist ke Supabase announcements agar survive restart & stateless Serverless di Vercel!
  try {
    const supabase = createAdminClient();
    await supabase.from("announcements").insert([
      {
        title: `[PENDING] ${category === "duka_cita" ? "Kabar Duka Cita" : "Pengumuman Resmi"} - ${senderName} (${senderPhone})`,
        content: formattedMessage,
        category: `pending_${category}`,
        is_pinned: false,
        published_at: null,
      },
    ]);
  } catch (err: any) {
    console.warn("[SAVE-PENDING-SUPABASE-ERR]:", err.message);
  }

  return record;
}

/**
 * Mengambil draf pengumuman pending terbaru dari Supabase (atau fallback memory)
 */
export async function getLatestPendingBroadcast(): Promise<PendingBroadcast | null> {
  // 1. Coba ambil dari database Supabase terlebih dahulu
  try {
    const supabase = createAdminClient();
    const { data: dbItem, error } = await supabase
      .from("announcements")
      .select("*")
      .like("category", "pending_%")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && dbItem) {
      const cat = dbItem.category.replace("pending_", "") as any;
      const phoneMatch = dbItem.title.match(/\(([0-9+]+)\)/);
      const phone = phoneMatch ? phoneMatch[1] : "";
      return {
        id: dbItem.id,
        category: cat || "duka_cita",
        senderPhone: phone,
        senderName: dbItem.title.replace("[PENDING] ", "").replace(/\s*\([0-9+]+\)/, ""),
        rawMessage: dbItem.content,
        formattedMessage: dbItem.content,
        createdAt: new Date(dbItem.created_at).getTime(),
        status: "pending",
      };
    }
  } catch (err: any) {
    console.warn("[GET-PENDING-SUPABASE-ERR]:", err.message);
  }

  // 2. Fallback memory jika DB query gagal
  if (latestPendingBroadcastId) {
    const item = pendingBroadcastsMap.get(latestPendingBroadcastId);
    if (item && item.status === "pending") return item;
  }

  return null;
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
  const pending = await getLatestPendingBroadcast();

  if (!pending) {
    return {
      success: false,
      message: "Tidak ada draf pengumuman pending yang menunggu persetujuan saat ini.",
    };
  }

  const officialGroupId = getOfficialGroupId();
  const supabase = createAdminClient();

  // 1. Update status announcement di Supabase menjadi terbit (publish)
  try {
    const finalCategory = pending.category === "duka_cita" ? "duka_cita" : "urgent";
    await supabase
      .from("announcements")
      .update({
        title: pending.category === "duka_cita" ? "Kabar Duka Cita" : "Pengumuman Resmi Angkatan",
        category: finalCategory,
        is_pinned: true,
        published_at: new Date().toISOString(),
      })
      .eq("id", pending.id);
  } catch (dbErr: any) {
    console.warn("[ANNOUNCEMENT-DB-UPDATE-WARN]:", dbErr.message);
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

  // 3. Update status in-memory
  pending.status = "approved";
  pendingBroadcastsMap.delete(pending.id);
  latestPendingBroadcastId = null;

  // 4. Kirim konfirmasi balik ke alumni pelapor
  if (pending.senderPhone) {
    try {
      const ackToReporter =
        `Alhamdulillah Sahabat,\n\n` +
        `Berita yang Anda sampaikan telah resmi *DIVERIFIKASI & DIPUBLIKASIKAN* ke Grup Resmi Angkatan dan portal website oleh Pengurus.\n\n` +
        `Jazakumullahu khairan katsiran atas informasinya. Semoga membawa kebaikan bersama.`;

      await sendWhatsAppMessageWithDetail(pending.senderPhone, ackToReporter);
    } catch (ackErr) {
      console.warn("[ANNOUNCEMENT-REPORTER-ACK-ERR]:", ackErr);
    }
  }

  if (groupSent) {
    return {
      success: true,
      message:
        `✅ *[SUKSES BROADCAST GRUP RESMI]*\n\n` +
        `Berita telah berhasil dikirim ke Grup WhatsApp Resmi Angkatan (*${officialGroupId}*) serta disimpan di website.`,
    };
  } else {
    return {
      success: true,
      message:
        `⚠️ *[DISIMPAN DI WEBSITE, GRUP MENUNGGU]*\n\n` +
        `Pengumuman telah sukses dipublikasikan ke Portal Website. Namun pengiriman ke grup WA belum terlaksana: ${groupReason}`,
    };
  }
}

/**
 * Membatalkan draf pengumuman pending
 */
export async function rejectPendingBroadcast(
  adminPhone: string
): Promise<{ success: boolean; message: string }> {
  const pending = await getLatestPendingBroadcast();
  if (!pending) {
    return {
      success: false,
      message: "Tidak ada draf pengumuman pending yang dapat dibatalkan.",
    };
  }

  // Hapus dari Supabase agar tidak tertinggal sebagai pending
  try {
    const supabase = createAdminClient();
    await supabase.from("announcements").delete().eq("id", pending.id);
  } catch (dbErr: any) {
    console.warn("[REJECT-SUPABASE-ERR]:", dbErr.message);
  }

  pending.status = "rejected";
  pendingBroadcastsMap.delete(pending.id);
  latestPendingBroadcastId = null;

  return {
    success: true,
    message: `❌ Draf pengumuman telah dibatalkan dan dihapus dari antrean oleh Admin.`,
  };
}

/**
 * Filter Cerdas: Memeriksa apakah bot harus merespons di dalam grup WhatsApp bebas
 */
export function shouldGroupBotRespond(messageText: string): boolean {
  if (!messageText) return false;
  const lower = messageText.trim().toLowerCase();

  // 1. Tag / Mention Bot (Termasuk nomor bot 6289675010185 / 089675010185, tag @ kontak WhatsApp, nama, atau panggilan min)
  if (
    lower.includes("89675010185") ||
    lower.includes("@bot") ||
    lower.includes("bot") ||
    lower.includes("expedient") ||
    lower.includes("minbot") ||
    lower.includes("admin bot") ||
    /\bmin\b/i.test(lower) ||
    lower.includes("@") // Tag mention WhatsApp contact
  ) {
    return true;
  }

  // 2. Command Prefix (!, /, ?, #)
  if (
    messageText.startsWith("!") ||
    messageText.startsWith("/") ||
    messageText.startsWith("?") ||
    messageText.startsWith("#")
  ) {
    return true;
  }

  // 3. Sapaan langsung / testing bot di grup
  if (
    lower === "tes" ||
    lower === "test" ||
    lower === "ping" ||
    lower.startsWith("tes bot") ||
    lower.startsWith("test bot") ||
    lower.startsWith("halo bot") ||
    lower.startsWith("hai bot") ||
    lower.startsWith("p ") ||
    lower === "p" ||
    lower.startsWith("assalamu'alaikum bot") ||
    lower.startsWith("assalamualaikum bot")
  ) {
    return true;
  }

  // 4. Pertanyaan Sosok / Profil Alumni / Siapa (Contoh: "siapa taufiqi", "alumni yang di bandung siapa aja", "kontak danang")
  if (
    lower.includes("siapa") ||
    lower.includes("siapakah") ||
    lower.startsWith("profil ") ||
    lower.startsWith("kontak ") ||
    lower.startsWith("nomor ") ||
    lower.startsWith("alamat ") ||
    lower.includes("tinggal di") ||
    lower.includes("info tentang ") ||
    lower.startsWith("tanya dong")
  ) {
    return true;
  }

  // 5. Pertanyaan Spesifik Seputar Angkatan & Website Portal
  if (
    lower.includes("ultah") ||
    lower.includes("ulang tahun") ||
    lower.includes("milad") ||
    lower.includes("reuni") ||
    lower.includes("agenda") ||
    lower.includes("acara") ||
    lower.includes("total alumni") ||
    lower.includes("berapa alumni") ||
    lower.includes("jumlah alumni") ||
    lower.includes("website") ||
    lower.includes("fitur") ||
    lower.includes("portal") ||
    lower.includes("link web")
  ) {
    return true;
  }

  // 6. Kabar / Update Alami Seputar Alumni (Self-Learning Alami 100% Bebas Keyword)
  // Contoh: "Danang sekarang kerja di Pertamina", "Auzan pindah ke Jakarta", "Rizki buka kafe di Ponorogo"
  if (isPotentialFactStatement(messageText)) {
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
  // =========================================================================
  // 1. CABANG KHUSUS: GRUP GRAPHIC DESIGN / STUDIO EDITOR ANGKATAN
  // =========================================================================
  const { isDesignGroupId, handleDesignStudioConversation, shouldDesignBotRespond } = await import("@/lib/whatsapp/designGroupAssistant");
  if (isDesignGroupId(groupId)) {
    if (!shouldDesignBotRespond(messageText)) {
      return { responded: false };
    }

    const callerName = senderName || "Sahabat Editor";
    const replyText = await handleDesignStudioConversation({
      senderPhone,
      senderName: callerName,
      messageText,
      groupId,
    });

    const groupSendResult = await sendWhatsAppGroupMessage(groupId, replyText);

    try {
      const supabase = createAdminClient();
      await supabase.from("whatsapp_queue").insert([
        {
          no_whatsapp: groupId.slice(0, 20),
          message: `[GRUP DESAIN] Dari ${callerName}: "${messageText.slice(0, 80)}"`,
          status: groupSendResult.success ? "replied_group" : "failed_group",
          error_message: groupSendResult.success
            ? `Dibalas: "${replyText.slice(0, 150)}"`
            : `Gagal kirim grup desain: ${groupSendResult.reason || "Unknown"}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    } catch (logErr) {
      console.warn("[DESIGN-QUEUE-LOG-WARN]:", logErr);
    }

    return { responded: true, replyText };
  }

  // =========================================================================
  // 2. CABANG REGULER: GRUP KOMUNITAS / ANGKATAN NON-RESMI
  // =========================================================================
  // Hanya respons jika dipanggil atau merupakan command / pertanyaan seputar angkatan
  if (!shouldGroupBotRespond(messageText)) {
    return { responded: false };
  }

  // A2. Cek Command Audit Member atau Kirim Undangan di Grup
  const cleanCmd = messageText.trim().toLowerCase();
  if (
    cleanCmd.includes("cek-member") ||
    cleanCmd.includes("cek member") ||
    cleanCmd.includes("audit member") ||
    cleanCmd.includes("cek nomor")
  ) {
    const { auditGroupMembersAgainstDatabase, formatAuditSummaryMessage } = await import("@/lib/whatsapp/memberAuditor");
    const auditRes = await auditGroupMembersAgainstDatabase(messageText);
    const replyText = formatAuditSummaryMessage(auditRes);
    await sendWhatsAppGroupMessage(groupId, replyText);
    return { responded: true, replyText };
  }

  if (
    cleanCmd.includes("kirim undangan") ||
    cleanCmd.includes("japri undangan") ||
    cleanCmd === "!kirim-undangan"
  ) {
    const { executeMemberInvitations } = await import("@/lib/whatsapp/memberAuditor");
    const inviteRes = await executeMemberInvitations(senderPhone);
    await sendWhatsAppGroupMessage(groupId, inviteRes.message);
    return { responded: true, replyText: inviteRes.message };
  }

  const callerName = senderName || "Sahabat";
  const { generateIntelligentCohortReply } = await import("@/lib/whatsapp/alumniIntelligence");

  // Hasilkan respons cerdas bertenaga Gemini & fakta database Supabase
  const replyText = await generateIntelligentCohortReply({
    messageText,
    senderPhone,
    senderName: callerName,
    isGroup: true,
    groupId,
  });

  // Kirim balasan ke grup WhatsApp
  const groupSendResult = await sendWhatsAppGroupMessage(groupId, replyText);

  // Catat riwayat grup ke database Supabase
  try {
    const supabase = createAdminClient();
    await supabase.from("whatsapp_queue").insert([
      {
        no_whatsapp: groupId.slice(0, 20),
        message: `[GRUP] Dari ${callerName}: "${messageText.slice(0, 80)}"`,
        status: groupSendResult.success ? "replied_group" : "failed_group",
        error_message: groupSendResult.success
          ? `Dibalas: "${replyText.slice(0, 150)}"`
          : `Gagal kirim grup: ${groupSendResult.reason || "Unknown"}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  } catch (logErr) {
    console.warn("[GROUP-QUEUE-LOG-WARN]:", logErr);
  }

  return { responded: true, replyText };
}

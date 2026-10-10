import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppMessageWithDetail, sendWhatsAppGroupMessage } from "@/lib/whatsapp";
import { extractPhoneNumbers } from "@/lib/whatsapp/memberAuditor";
import { getRecentGroupChatHistory } from "@/lib/whatsapp/groupConversationBuffer";
import { callGeminiResilient } from "@/lib/sentinel/conversationalAgent";

/**
 * Kata kunci penanda vendor, transaksi komersial, rekening, atau pihak luar angkatan
 */
const VENDOR_OR_NON_ALUMNI_INDICATORS = [
  "konveksi", "sablon", "kaos", "jersey", "bordir",
  "catering", "katering", "snack", "tumpeng", "kue", "resto", "restoran", "warung", "kafe", "cafe",
  "villa", "hotel", "homestay", "penginapan", "aula", "gedung", "sewa", "rental",
  "bus", "travel", "sopir", "driver", "elf", "hiace", "mobil",
  "toko", "admin toko", "penjual", "olshop", "shopee", "tokped", "lazada",
  "servis", "service", "bengkel", "fotocopy", "percetakan", "cetak",
  "rekening", "norek", "no rek", "transfer", "bca", "bri", "mandiri", "bni", "bsi", "dana", "gopay", "ovo",
  "resi", "kurir", "paket", "jnt", "jne", "sicepat",
  "ustadz", "ustadzah", "guru", "pembimbing", "yayasan", "pondok"
];

/**
 * Format tampilan nomor agar ramah dibaca (contoh: 0812-3456-7890)
 */
export function formatPhoneDisplay(raw: string): string {
  let clean = String(raw || "").replace(/\D/g, "");
  if (clean.startsWith("62")) {
    clean = "0" + clean.substring(2);
  }
  if (clean.length >= 10) {
    return clean.replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3");
  }
  return clean;
}

/**
 * Memeriksa apakah teks pesan mengindikasikan nomor vendor, rekening, atau entitas luar angkatan
 * Menggunakan batas kata (word boundary \b) agar tidak salah mencocokkan substring nama alumni (misal "Danang" bentrok dengan "dana")
 */
export function isVendorOrNonAlumniMessage(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();

  // Jika eksplisit menyebut alumni/sahabat, jangan di-skip
  if (lower.includes("alumni") || lower.includes("angkatan") || lower.includes("sahabat kita") || lower.includes("kawan kita")) {
    return false;
  }

  return VENDOR_OR_NON_ALUMNI_INDICATORS.some((indicator) => {
    // Cocokkan sebagai kata utuh
    const regex = new RegExp(`(^|[^a-zA-Z0-9])${indicator}([^a-zA-Z0-9]|$)`, "i");
    return regex.test(lower);
  });
}

/**
 * Memeriksa apakah suatu nomor sudah pernah dikirimi pesan undangan japri dalam 7 hari terakhir
 */
export async function isAlreadyInvitedRecently(phone: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("whatsapp_queue")
      .select("id")
      .eq("no_whatsapp", phone)
      .eq("status", "sent_invite")
      .gte("created_at", sevenDaysAgo)
      .limit(1);

    return Boolean(data && data.length > 0);
  } catch (err: any) {
    console.warn("[CHECK-RECENT-INVITE-ERR]:", err.message);
    return false;
  }
}

/**
 * Menemukan calon nama alumni dari pesan pengirim, pesan yang di-reply, atau riwayat obrolan grup
 */
export async function extractCandidateAlumniName(
  messageText: string,
  quotedText?: string,
  recentHistoryText?: string
): Promise<string | null> {
  const combinedContext = [
    `PESAN: "${messageText}"`,
    quotedText ? `PESAN YANG DI-REPLY: "${quotedText}"` : "",
    recentHistoryText ? `RIWAYAT OBROLAN SEBELUMNYA:\n${recentHistoryText}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();
  const geminiModel = (process.env.GEMINI_MODEL || "gemini-3.8-flash").trim();

  if (!geminiApiKey) {
    // Fallback regex sederhana: cari kata setelah "punya", "nomornya", "no", "si"
    const match = messageText.match(/(?:punya|nomornya|nomor|no|kontak|si)\s+([A-Z][a-z]+|[a-z]{3,15})/i);
    return match ? match[1].trim() : null;
  }

  const prompt = `
You are the Alumni Name Extractor for Expedient Generation 43 WhatsApp Bot.
A user in a WhatsApp group shared a phone number.

CONTEXT:
${combinedContext}

TASK:
Identify if the message, reply, or conversation mentions the NAME or NICKNAME of the person this phone number belongs to.
Examples:
- "Ini nomor barunya Danang: 08123456" -> "Danang"
- "punya Zaki" -> "Zaki"
- "0857... kontak Eva" -> "Eva"
- "Ada yang punya no Farhan?" -> replied with raw number -> "Farhan"
- "081234567890" (just numbers, no name anywhere in context) -> null
- "Ini no konveksi 0812..." -> null (not an alumni person)

OUTPUT FORMAT (JSON ONLY):
{
  "hasAlumniName": true | false,
  "name": "Single Name or Nickname (e.g. Danang, Zaki, Eva)" | null
}
`.trim();

  try {
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    };

    const res = await callGeminiResilient(body, geminiApiKey, geminiModel);
    const textOutput = res.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
    const parsed = JSON.parse(textOutput);

    if (parsed.hasAlumniName && parsed.name && typeof parsed.name === "string") {
      const cleanName = parsed.name.trim();
      if (cleanName.length >= 2 && !["null", "undefined", "bukan", "nomor"].includes(cleanName.toLowerCase())) {
        return cleanName;
      }
    }
  } catch (err: any) {
    console.warn("[EXTRACT-CANDIDATE-NAME-ERR]:", err.message);
  }

  return null;
}

/**
 * Mengirim pesan japri undangan personal ke nomor alumni yang belum terdaftar
 */
export async function sendDirectAlumniInvitation(
  targetPhone: string,
  candidateName: string | null,
  sharedByName: string
): Promise<{ success: boolean; reason?: string }> {
  const refCode = `EG43-${Math.floor(1000 + Math.random() * 9000)}`;
  const greetingName = candidateName ? `*${candidateName}*` : "sahabat";

  const message =
    `Assalamu'alaikum Warahmatullahi Wabarakatuh, Sahabat ${greetingName}! ✨\n\n` +
    `Salam silaturahmi hangat dari keluarga besar *Expedient Generation 43 (Alumni Pondok Modern Arrisalah Slahung Ponorogo, Angkatan 2025)*.\n\n` +
    `Nomor WhatsApp antum baru saja dibagikan oleh Sahabat *${sharedByName || "Sahabat Angkatan"}* di grup WhatsApp silaturahmi kita.\n\n` +
    `Yuk luangkan 1 menit untuk melengkapi profil & bergabung di portal direktori resmi alumni angkatan kita di:\n` +
    `👉 *https://expedientgeneration.vercel.app/register*\n\n` +
    `Di portal ini antum bisa:\n` +
    `• Mengisi biodata, domisili, & profesi direktori alumni se-Indonesia\n` +
    `• Mengakses kalender milad sahabat & agenda reuni akbar\n` +
    `• Bergabung dalam Baitul Maal & transparansi kas ta'awun angkatan\n\n` +
    `_Pesan otomatis asisten resmi Expedient Generation 43._\n` +
    `*(Catatan: Jika antum bukan sahabat alumni angkatan 43 atau terdapat kekeliruan pembagian nomor, kami memohon maaf sebesar-besarnya atas ketidaknyamanan ini dan pesan ini dapat diabaikan ya Akhi/Ukhti).*\n` +
    `_Ref: #${refCode}_`;

  const sendRes = await sendWhatsAppMessageWithDetail(targetPhone, message);

  // Catat riwayat pengiriman ke database whatsapp_queue untuk deduplikasi
  try {
    const supabase = createAdminClient();
    await supabase.from("whatsapp_queue").insert([
      {
        no_whatsapp: targetPhone,
        message: `[AUTO-INVITE JAPRI - ${refCode}] Untuk ${candidateName || "Alumni"} (Dibagikan oleh: ${sharedByName})`,
        status: sendRes.success ? "sent_invite" : "failed_invite",
        error_message: sendRes.success ? null : sendRes.reason,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  } catch (logErr) {
    console.warn("[LOG-AUTO-INVITE-ERR]:", logErr);
  }

  return sendRes;
}

/**
 * Handler Utama: Menangani deteksi nomor telepon yang dibagikan di grup WhatsApp secara Full Otomatis
 */
export async function handleAutomaticGroupNumberDetection(options: {
  groupId: string;
  senderPhone: string;
  senderName: string;
  messageText: string;
  quotedText?: string;
  quotedSender?: string;
  isQuotedFromBot?: boolean;
}): Promise<{ handled: boolean; replyText?: string }> {
  const { groupId, senderPhone, senderName, messageText, quotedText, quotedSender, isQuotedFromBot } = options;

  // 1. KASUS KHUSUS: PENGGUNA MEMBALAS (REPLY) PERTANYAAN BOT TENTANG NAMA PEMILIK NOMOR
  // Contoh: Bot tanya "Ini nomornya siapa ya?", lalu pengguna me-reply: "punya Danang" atau "Zaki"
  if (isQuotedFromBot && quotedText && quotedText.includes("belum terdaftar di web kita nih")) {
    const phonesInPrompt = extractPhoneNumbers(quotedText);
    if (phonesInPrompt.length > 0) {
      const targetPhone = phonesInPrompt[0];
      const candidateName = await extractCandidateAlumniName(messageText, quotedText);
      const finalName = candidateName || messageText.replace(/[^\w\s]/g, "").trim().slice(0, 30);

      // Eksekusi Japri Undangan
      const inviteRes = await sendDirectAlumniInvitation(targetPhone, finalName, senderName);

      let confirmationMsg = "";
      if (inviteRes.success) {
        confirmationMsg =
          `Alhamdulillah! Nomor Sahabat *${finalName}* (${formatPhoneDisplay(targetPhone)}) sudah otomatis ana japri link pendaftaran website angkatan ya! 🙌✨\n` +
          `Jazakallahu khair Sahabat *${senderName}* atas infonya! 🤝`;
      } else {
        confirmationMsg =
          `Afwan Sahabat *${senderName}*, sempat ada kendala teknis saat menjapri Sahabat *${finalName}* (${formatPhoneDisplay(targetPhone)}): ${inviteRes.reason || "Gateway timeout"}.`;
      }

      await sendWhatsAppGroupMessage(groupId, confirmationMsg);
      return { handled: true, replyText: confirmationMsg };
    }
  }

  // 1b. Jika pengguna memanggil command audit manual (cek-member / audit member / kirim undangan), biarkan ditangani oleh memberAuditor
  const lowerMsg = messageText.toLowerCase();
  if (
    lowerMsg.includes("cek-member") ||
    lowerMsg.includes("cek member") ||
    lowerMsg.includes("audit member") ||
    lowerMsg.includes("cek nomor") ||
    lowerMsg.includes("kirim undangan")
  ) {
    return { handled: false };
  }

  // 2. EKSTRAKSI SELURUH NOMOR TELEPON DARI PESAN MASUK
  const extractedPhones = extractPhoneNumbers(messageText);
  if (extractedPhones.length === 0) {
    return { handled: false };
  }

  // Abaikan nomor bot sendiri atau nomor admin gateway
  const selfPhones = ["6282142877426", "6285151771289", "6289675010185"];
  const validPhones = extractedPhones.filter((p) => !selfPhones.includes(p) && p !== senderPhone);

  if (validPhones.length === 0) {
    return { handled: false };
  }

  // 3. FILTER KONTEKS VENDOR / BUKAN ALUMNI
  if (isVendorOrNonAlumniMessage(messageText)) {
    console.log(`[AUTO-INVITER-SKIP] Pesan mengandung kata vendor/rekening/luar angkatan. Mengabaikan: "${messageText}"`);
    return { handled: false };
  }

  const targetPhone = validPhones[0]; // Ambil target nomor utama
  const supabase = createAdminClient();

  // 4. CEK APAKAH NOMOR SUDAH TERDAFTAR DI DATABASE PROFILES
  let registeredProfile: { nama_lengkap: string | null; nama_panggilan: string | null } | null = null;
  try {
    const cleanDigits = targetPhone.replace(/\D/g, "");
    const localFormat = "0" + cleanDigits.substring(2);

    const { data: matchedProfiles } = await supabase
      .from("profiles")
      .select("nama_lengkap, nama_panggilan, no_whatsapp")
      .or(`no_whatsapp.eq.${cleanDigits},no_whatsapp.eq.${localFormat},no_whatsapp.ilike.%${cleanDigits.slice(-9)}%`)
      .limit(1);

    if (matchedProfiles && matchedProfiles.length > 0) {
      registeredProfile = matchedProfiles[0];
    }
  } catch (dbErr: any) {
    console.warn("[AUTO-INVITER-DB-CHECK-ERR]:", dbErr.message);
  }

  // JIKA NOMOR SUDAH TERDAFTAR:
  if (registeredProfile) {
    const alumniName = registeredProfile.nama_panggilan || registeredProfile.nama_lengkap || "Sahabat";
    const alreadyMsg =
      `ℹ️ Nomor *${formatPhoneDisplay(targetPhone)}* milik Sahabat *${alumniName}*, alhamdulillah sudah terdaftar dan aktif di website angkatan kita! ✅`;

    await sendWhatsAppGroupMessage(groupId, alreadyMsg);
    return { handled: true, replyText: alreadyMsg };
  }

  // 5. JIKA NOMOR BELUM TERDAFTAR: CARI CALON NAMA ALUMNI
  let recentContextSnippet = "";
  try {
    const recentMessages = await getRecentGroupChatHistory(groupId, 5);
    if (recentMessages.length > 0) {
      recentContextSnippet = recentMessages
        .map((m) => `${m.senderName}: "${m.messageText}"`)
        .join("\n");
    }
  } catch {}

  const candidateName = await extractCandidateAlumniName(messageText, quotedText, recentContextSnippet);

  // KASUS A: NAMA ALUMNI TERDETEKSI (Langsung Eksekusi Japri Otomatis!)
  if (candidateName) {
    const alreadySent = await isAlreadyInvitedRecently(targetPhone);

    if (alreadySent) {
      const skipMsg =
        `ℹ️ Nomor *${formatPhoneDisplay(targetPhone)}* (Sahabat *${candidateName}*) belum terdaftar di web, dan sebelumnya sudah pernah ana japri link registrasi ya sahabat! 🙌`;
      await sendWhatsAppGroupMessage(groupId, skipMsg);
      return { handled: true, replyText: skipMsg };
    }

    // Eksekusi Japri Undangan Otomatis
    const inviteRes = await sendDirectAlumniInvitation(targetPhone, candidateName, senderName);

    let confirmationMsg = "";
    if (inviteRes.success) {
      confirmationMsg =
        `Nomor *${formatPhoneDisplay(targetPhone)}* (Sahabat *${candidateName}*) belum terdaftar di web angkatan, sudah otomatis ana japri link pendaftarannya ya! 🙌\n` +
        `_Pesan ajakan registrasi terkirim via jalur pribadi._`;
    } else {
      confirmationMsg =
        `Nomor *${formatPhoneDisplay(targetPhone)}* (Sahabat *${candidateName}*) belum terdaftar di web angkatan. (Gagal kirim japri: ${inviteRes.reason || "Kendala gateway"}).`;
    }

    await sendWhatsAppGroupMessage(groupId, confirmationMsg);
    return { handled: true, replyText: confirmationMsg };
  }

  // KASUS B: NOMOR POLOS TANPA NAMA & TANPA PETUNJUK OBROLAN
  // Minta konfirmasi ramah 1 langkah di grup
  const promptNameMsg =
    `Nomor *${formatPhoneDisplay(targetPhone)}* belum terdaftar di web angkatan kita nih. 🤔\n` +
    `Ini nomornya siapa ya Sahabat *${senderName}*?\n\n` +
    `Cukup *balas (reply)* pesan ini dengan menyebut namanya (misal: _'punya Danang'_), biar langsung ana japri link pendaftaran portal resminya! 🙌✨`;

  await sendWhatsAppGroupMessage(groupId, promptNameMsg);
  return { handled: true, replyText: promptNameMsg };
}

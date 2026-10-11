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

const BOT_OWN_PHONES = ["6285151771289", "6289675010185"];

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

const inMemoryInviteDedup = new Map<string, number>();

/**
 * Memeriksa apakah suatu nomor sudah pernah dikirimi pesan undangan japri dalam 7 hari terakhir
 * Dilengkapi in-memory cache 10 menit untuk mencegah race condition pengiriman ganda
 */
export async function isAlreadyInvitedRecently(phone: string): Promise<boolean> {
  const cleanPhone = phone.replace(/\D/g, "");
  // 1. Cek in-memory session cache (cooldown 10 menit per nomor)
  const lastTime = inMemoryInviteDedup.get(cleanPhone) || 0;
  if (Date.now() - lastTime < 10 * 60 * 1000) {
    return true;
  }

  try {
    const supabase = createAdminClient();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const altLocal = cleanPhone.startsWith("62") ? "0" + cleanPhone.slice(2) : "62" + cleanPhone.replace(/^0/, "");
    const { data } = await supabase
      .from("whatsapp_queue")
      .select("id")
      .or(`no_whatsapp.eq.${cleanPhone},no_whatsapp.eq.${altLocal}`)
      .eq("status", "sent_invite")
      .gte("created_at", sevenDaysAgo)
      .limit(1);

    if (data && data.length > 0) {
      inMemoryInviteDedup.set(cleanPhone, Date.now());
      return true;
    }
  } catch (err: any) {
    console.warn("[CHECK-RECENT-INVITE-ERR]:", err.message);
  }
  return false;
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
  sharedByName: string,
  customSender?: (targetPhone: string, message: string) => Promise<{ success: boolean; reason?: string }>
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

  let sendRes: { success: boolean; reason?: string };
  if (customSender) {
    sendRes = await customSender(targetPhone, message);
  } else {
    sendRes = await sendWhatsAppMessageWithDetail(targetPhone, message);
  }

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

export interface ExtractedContact {
  displayName: string;
  phone: string;
  vcard?: string;
}

/**
 * Mengekstrak seluruh kontak (Nama dan Nomor HP) dari string vCard
 */
export function parseContactsFromVCard(vcardStr: string, fallbackName?: string): ExtractedContact[] {
  if (!vcardStr) return [];
  const contacts: ExtractedContact[] = [];
  const vcardBlocks = vcardStr.split(/BEGIN:VCARD/i).filter((b) => b.trim().length > 0);

  for (const block of vcardBlocks) {
    let name = (fallbackName || "").trim();
    const fnMatch =
      block.match(/(?:^|\r?\n)FN[;:][^\r\n:]*:(.+?)(?:\r?\n|$)/i) ||
      block.match(/(?:^|\r?\n)FN:(.+?)(?:\r?\n|$)/i);
    if (fnMatch && fnMatch[1]?.trim()) {
      name = fnMatch[1].trim();
    } else {
      const nMatch =
        block.match(/(?:^|\r?\n)N[;:][^\r\n:]*:(.+?)(?:\r?\n|$)/i) ||
        block.match(/(?:^|\r?\n)N:(.+?)(?:\r?\n|$)/i);
      if (nMatch && nMatch[1]?.trim()) {
        const parts = nMatch[1].split(";").filter(Boolean).map((p) => p.trim());
        if (parts.length > 0) {
          name = parts.reverse().join(" ");
        }
      }
    }

    const rawPhones: string[] = [];
    const waidMatches = block.matchAll(/waid=(\d+)/gi);
    for (const m of waidMatches) {
      if (m[1]) rawPhones.push(m[1]);
    }
    const telMatches = block.matchAll(/(?:^|\r?\n)TEL[^:]*:(.+?)(?:\r?\n|$)/gi);
    for (const m of telMatches) {
      if (m[1]) rawPhones.push(m[1].trim());
    }

    const seen = new Set<string>();
    for (const raw of rawPhones) {
      let clean = raw.replace(/\D/g, "");
      if (clean.startsWith("0")) clean = "62" + clean.substring(1);
      else if (clean.startsWith("8")) clean = "62" + clean;
      if (/^628\d{7,12}$/.test(clean) && !seen.has(clean)) {
        seen.add(clean);
        contacts.push({
          displayName: name || fallbackName || "Sahabat",
          phone: clean,
          vcard: block,
        });
      }
    }
  }

  return contacts;
}

/**
 * Mengekstrak daftar kontak dari payload pesan WhatsApp Baileys (contactMessage, contactsArrayMessage)
 */
export function extractContactsFromBaileysMessage(msgContent: any): ExtractedContact[] {
  if (!msgContent) return [];
  const results: ExtractedContact[] = [];

  // 1. Single contactMessage
  if (msgContent.contactMessage) {
    const cm = msgContent.contactMessage;
    const name = cm.displayName || "";
    const vcard = cm.vcard || "";
    const parsed = parseContactsFromVCard(vcard, name);
    if (parsed.length > 0) {
      results.push(...parsed);
    } else if (name || vcard) {
      const phones = extractPhoneNumbers(`${name} ${vcard}`);
      for (const p of phones) {
        results.push({ displayName: name || "Sahabat", phone: p, vcard });
      }
    }
  }

  // 2. Multiple contactsArrayMessage
  if (msgContent.contactsArrayMessage && Array.isArray(msgContent.contactsArrayMessage.contacts)) {
    for (const cm of msgContent.contactsArrayMessage.contacts) {
      const name = cm.displayName || "";
      const vcard = cm.vcard || "";
      const parsed = parseContactsFromVCard(vcard, name);
      if (parsed.length > 0) {
        results.push(...parsed);
      } else if (name || vcard) {
        const phones = extractPhoneNumbers(`${name} ${vcard}`);
        for (const p of phones) {
          results.push({ displayName: name || "Sahabat", phone: p, vcard });
        }
      }
    }
  }

  // 3. Document .vcf file
  if (
    msgContent.documentMessage &&
    (msgContent.documentMessage.mimetype?.includes("vcard") ||
      msgContent.documentMessage.fileName?.endsWith(".vcf") ||
      msgContent.documentMessage.fileName?.endsWith(".vcard"))
  ) {
    const docName = msgContent.documentMessage.fileName?.replace(/\.(vcf|vcard)$/i, "") || "Sahabat";
    const phones = extractPhoneNumbers(msgContent.documentMessage.caption || "");
    for (const p of phones) {
      results.push({ displayName: docName, phone: p });
    }
  }

  // Deduplikasi berdasarkan nomor telepon
  const deduped: ExtractedContact[] = [];
  const seenPhones = new Set<string>();
  for (const c of results) {
    if (!seenPhones.has(c.phone)) {
      seenPhones.add(c.phone);
      deduped.push(c);
    }
  }

  return deduped;
}

/**
 * Handler Utama: Menangani deteksi nomor telepon yang dibagikan di grup WhatsApp maupun chat pribadi secara Full Otomatis
 */
export async function handleAutomaticGroupNumberDetection(options: {
  groupId: string;
  senderPhone: string;
  senderName: string;
  messageText: string;
  quotedText?: string;
  quotedSender?: string;
  isQuotedFromBot?: boolean;
  isPrivateChat?: boolean;
  contacts?: ExtractedContact[];
  customSender?: (target: string, message: string) => Promise<{ success: boolean; reason?: string }>;
}): Promise<{ handled: boolean; replyText?: string }> {
  const {
    groupId,
    senderPhone,
    senderName,
    messageText,
    quotedText,
    quotedSender,
    isQuotedFromBot,
    isPrivateChat = false,
    contacts,
    customSender,
  } = options;

  // Helper pengiriman pesan ke grup maupun jalur pribadi
  const sendTargetMessage = async (text: string) => {
    if (customSender) {
      return await customSender(groupId, text);
    }
    if (isPrivateChat || !groupId.includes("@g.us")) {
      return await sendWhatsAppMessageWithDetail(groupId, text);
    }
    const ok = await sendWhatsAppGroupMessage(groupId, text);
    return { success: ok };
  };

  // 0. ATURAN ANTI-LOOP MUTLAK:
  // Jangan pernah memproses pesan yang dikirim oleh nomor bot sendiri
  const cleanSender = String(senderPhone || "").replace(/\D/g, "");
  if (BOT_OWN_PHONES.some((bp) => cleanSender.includes(bp) || bp.includes(cleanSender))) {
    return { handled: false };
  }

  // Jangan proses jika pesan berisi template resmi bot sendiri (mencegah loop self-trigger dari quote/reply)
  const lowerMsgRaw = messageText.toLowerCase();
  if (
    lowerMsgRaw.includes("pesan otomatis asisten resmi expedient") ||
    lowerMsgRaw.includes("belum terdaftar di web angkatan kita nih") ||
    lowerMsgRaw.includes("sudah otomatis ana japri") ||
    (lowerMsgRaw.includes("milik sahabat") && lowerMsgRaw.includes("sudah terdaftar dan aktif di website")) ||
    lowerMsgRaw.includes("ref: #eg43-")
  ) {
    return { handled: false };
  }

  // =========================================================================
  // 0b. PENANGANAN UTAMA KARTU KONTAK ASLI (WhatsApp Share Contact / vCard)
  // =========================================================================
  let resolvedContacts: ExtractedContact[] = contacts && contacts.length > 0 ? [...contacts] : [];

  // Jika tidak diberikan objek contacts terstruktur namun teks pesan/reply mengandung vcard:
  if (resolvedContacts.length === 0 && messageText.includes("BEGIN:VCARD")) {
    resolvedContacts = parseContactsFromVCard(messageText);
  }
  if (resolvedContacts.length === 0 && quotedText && quotedText.includes("BEGIN:VCARD")) {
    resolvedContacts = parseContactsFromVCard(quotedText);
  }

  const validContacts = resolvedContacts.filter((c) => !BOT_OWN_PHONES.includes(c.phone));
  if (validContacts.length > 0) {
    const supabase = createAdminClient();
    const reports: string[] = [];

    for (const c of validContacts) {
      const targetPhone = c.phone;
      const cleanCandidateName = c.displayName
        .replace(/[^\p{L}\p{N}\s.'-]/gu, " ")
        .replace(/\s+/g, " ")
        .trim() || "Sahabat";

      // Cek apakah vendor
      if (isVendorOrNonAlumniMessage(cleanCandidateName)) {
        console.log(`[AUTO-INVITER-SKIP] Kontak terdeteksi sebagai vendor/pihak luar: "${cleanCandidateName}"`);
        continue;
      }

      // Cek apakah sudah terdaftar di profiles
      let registeredProfile: { nama_lengkap: string | null; nama_panggilan: string | null } | null = null;
      try {
        const cleanDigits = targetPhone.replace(/\D/g, "");
        const localFormat = "0" + cleanDigits.substring(2);
        const shortNine = cleanDigits.slice(-9);

        const { data: matchedProfiles } = await supabase
          .from("profiles")
          .select("nama_lengkap, nama_panggilan, no_whatsapp")
          .or(`no_whatsapp.eq.${cleanDigits},no_whatsapp.eq.${localFormat},no_whatsapp.ilike.%${shortNine}%`)
          .limit(1);

        if (matchedProfiles && matchedProfiles.length > 0) {
          registeredProfile = matchedProfiles[0];
        }
      } catch (dbErr: any) {
        console.warn("[AUTO-INVITER-CONTACT-DB-ERR]:", dbErr.message);
      }

      if (registeredProfile) {
        const alumniName = registeredProfile.nama_panggilan || registeredProfile.nama_lengkap || cleanCandidateName;
        reports.push(
          validContacts.length === 1
            ? `ℹ️ Kontak Sahabat *${alumniName}* (${formatPhoneDisplay(targetPhone)}), alhamdulillah sudah terdaftar dan aktif di website angkatan kita! ✅`
            : `• Sahabat *${alumniName}* (${formatPhoneDisplay(targetPhone)}): Alhamdulillah sudah terdaftar di web! ✅`
        );
        continue;
      }

      // Jika belum terdaftar:
      const alreadySent = await isAlreadyInvitedRecently(targetPhone);
      if (alreadySent) {
        reports.push(
          validContacts.length === 1
            ? `ℹ️ Kontak Sahabat *${cleanCandidateName}* (${formatPhoneDisplay(targetPhone)}) belum terdaftar di web, dan sebelumnya sudah pernah ana japri link registrasi ya sahabat! 🙌`
            : `• Sahabat *${cleanCandidateName}* (${formatPhoneDisplay(targetPhone)}): Belum terdaftar (sudah pernah dijapri link pendaftaran) 🙌`
        );
        continue;
      }

      // Eksekusi Japri Undangan
      const inviteRes = await sendDirectAlumniInvitation(targetPhone, cleanCandidateName, senderName, customSender);
      if (inviteRes.success) {
        reports.push(
          validContacts.length === 1
            ? `Alhamdulillah! Kontak Sahabat *${cleanCandidateName}* (${formatPhoneDisplay(targetPhone)}) belum terdaftar di web angkatan, sudah otomatis ana japri link pendaftarannya ya! 🙌✨\n_Pesan ajakan registrasi terkirim via jalur pribadi._`
            : `• Sahabat *${cleanCandidateName}* (${formatPhoneDisplay(targetPhone)}): Belum terdaftar, sudah otomatis ana japri link pendaftarannya! 🙌✨`
        );
      } else {
        reports.push(
          validContacts.length === 1
            ? `Kontak Sahabat *${cleanCandidateName}* (${formatPhoneDisplay(targetPhone)}) belum terdaftar di web angkatan. (Gagal kirim japri: ${inviteRes.reason || "Kendala gateway"}).`
            : `• Sahabat *${cleanCandidateName}* (${formatPhoneDisplay(targetPhone)}): Belum terdaftar (kendala japri: ${inviteRes.reason || "Gateway timeout"})`
        );
      }
    }

    if (reports.length > 0) {
      let finalReportMsg = "";
      if (validContacts.length === 1) {
        finalReportMsg = reports[0];
      } else {
        finalReportMsg = `📱 *Hasil Pemeriksaan Kartu Kontak (${validContacts.length} Kontak):*\n` + reports.join("\n");
      }
      await sendTargetMessage(finalReportMsg);
      return { handled: true, replyText: finalReportMsg };
    }
  }

  // 1. KASUS KHUSUS: PENGGUNA MEMBALAS (REPLY) PERTANYAAN BOT TENTANG NAMA PEMILIK NOMOR
  // Contoh: Bot tanya "Ini nomornya siapa ya?", lalu pengguna me-reply: "punya Danang" atau "Zaki"
  if (
    isQuotedFromBot &&
    quotedText &&
    (quotedText.includes("belum terdaftar di web") || quotedText.includes("Ini nomornya siapa ya"))
  ) {
    const phonesInPrompt = extractPhoneNumbers(quotedText);
    if (phonesInPrompt.length > 0) {
      const targetPhone = phonesInPrompt[0];
      const candidateName = await extractCandidateAlumniName(messageText, quotedText);
      const cleanFallback = messageText.replace(/[^\w\s]/g, "").trim().slice(0, 30);
      const finalName = candidateName || cleanFallback;

      // Cek apakah nomor ini sudah pernah dijapri (baik di DB maupun memori), cegah spam ganda
      const alreadySent = await isAlreadyInvitedRecently(targetPhone);
      if (alreadySent) {
        const skipMsg =
          `ℹ️ Sahabat *${finalName}* (${formatPhoneDisplay(targetPhone)}) sebelumnya sudah pernah ana japri link pendaftaran website angkatan ya! 🙌✨`;
        await sendTargetMessage(skipMsg);
        return { handled: true, replyText: skipMsg };
      }

      // Eksekusi Japri Undangan
      const inviteRes = await sendDirectAlumniInvitation(targetPhone, finalName, senderName, customSender);

      let confirmationMsg = "";
      if (inviteRes.success) {
        confirmationMsg =
          `Alhamdulillah! Nomor Sahabat *${finalName}* (${formatPhoneDisplay(targetPhone)}) sudah otomatis ana japri link pendaftaran website angkatan ya! 🙌✨\n` +
          `Jazakallahu khair Sahabat *${senderName}* atas infonya! 🤝`;
      } else {
        confirmationMsg =
          `Afwan Sahabat *${senderName}*, sempat ada kendala teknis saat menjapri Sahabat *${finalName}* (${formatPhoneDisplay(targetPhone)}): ${inviteRes.reason || "Gateway timeout"}.`;
      }

      await sendTargetMessage(confirmationMsg);
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

  // 2. EKSTRAKSI SELURUH NOMOR TELEPON DARI PESAN MASUK ATAU PESAN YANG DI-QUOTE
  let extractedPhones = extractPhoneNumbers(messageText);
  if (extractedPhones.length === 0 && quotedText) {
    extractedPhones = extractPhoneNumbers(quotedText);
  }

  if (extractedPhones.length === 0) {
    return { handled: false };
  }

  // Abaikan nomor bot sendiri (jangan balas diri sendiri)
  const validPhones = extractedPhones.filter((p) => !BOT_OWN_PHONES.includes(p));

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
    const shortNine = cleanDigits.slice(-9);

    const { data: matchedProfiles } = await supabase
      .from("profiles")
      .select("nama_lengkap, nama_panggilan, no_whatsapp")
      .or(`no_whatsapp.eq.${cleanDigits},no_whatsapp.eq.${localFormat},no_whatsapp.ilike.%${shortNine}%`)
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

    await sendTargetMessage(alreadyMsg);
    return { handled: true, replyText: alreadyMsg };
  }

  // 5. JIKA NOMOR BELUM TERDAFTAR: CARI CALON NAMA ALUMNI
  let recentContextSnippet = "";
  if (!isPrivateChat && groupId.includes("@g.us")) {
    try {
      const recentMessages = await getRecentGroupChatHistory(groupId, 5);
      if (recentMessages.length > 0) {
        recentContextSnippet = recentMessages
          .map((m) => `${m.senderName}: "${m.messageText}"`)
          .join("\n");
      }
    } catch {}
  }

  const candidateName = await extractCandidateAlumniName(messageText, quotedText, recentContextSnippet);

  // KASUS A: NAMA ALUMNI TERDETEKSI (Langsung Eksekusi Japri Otomatis!)
  if (candidateName) {
    const alreadySent = await isAlreadyInvitedRecently(targetPhone);

    if (alreadySent) {
      const skipMsg =
        `ℹ️ Nomor *${formatPhoneDisplay(targetPhone)}* (Sahabat *${candidateName}*) belum terdaftar di web, dan sebelumnya sudah pernah ana japri link registrasi ya sahabat! 🙌`;
      await sendTargetMessage(skipMsg);
      return { handled: true, replyText: skipMsg };
    }

    // Eksekusi Japri Undangan Otomatis
    const inviteRes = await sendDirectAlumniInvitation(targetPhone, candidateName, senderName, customSender);

    let confirmationMsg = "";
    if (inviteRes.success) {
      confirmationMsg =
        `Nomor *${formatPhoneDisplay(targetPhone)}* (Sahabat *${candidateName}*) belum terdaftar di web angkatan, sudah otomatis ana japri link pendaftarannya ya! 🙌\n` +
        `_Pesan ajakan registrasi terkirim via jalur pribadi._`;
    } else {
      confirmationMsg =
        `Nomor *${formatPhoneDisplay(targetPhone)}* (Sahabat *${candidateName}*) belum terdaftar di web angkatan. (Gagal kirim japri: ${inviteRes.reason || "Kendala gateway"}).`;
    }

    await sendTargetMessage(confirmationMsg);
    return { handled: true, replyText: confirmationMsg };
  }

  // KASUS B: NOMOR POLOS TANPA NAMA & TANPA PETUNJUK OBROLAN
  // Minta konfirmasi ramah 1 langkah di grup / chat pribadi
  const promptNameMsg = isPrivateChat
    ? `Nomor *${formatPhoneDisplay(targetPhone)}* belum terdaftar di web angkatan kita nih. 🤔\n` +
      `Ini nomornya siapa ya Sahabat *${senderName}*?\n\n` +
      `Cukup balas pesan ini dengan menyebut namanya (misal: _'punya Danang'_), biar langsung ana japri link pendaftaran portal resminya! 🙌✨`
    : `Nomor *${formatPhoneDisplay(targetPhone)}* belum terdaftar di web angkatan kita nih. 🤔\n` +
      `Ini nomornya siapa ya Sahabat *${senderName}*?\n\n` +
      `Cukup *balas (reply)* pesan ini dengan menyebut namanya (misal: _'punya Danang'_), biar langsung ana japri link pendaftaran portal resminya! 🙌✨`;

  await sendTargetMessage(promptNameMsg);
  return { handled: true, replyText: promptNameMsg };
}

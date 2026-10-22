import { createAdminClient } from "@/lib/supabase/admin";
import { callGeminiResilient } from "@/lib/geminiResilient";
import { getCommunityGroupId } from "@/lib/whatsapp";

export interface MenfessDraft {
  senderPhone: string;
  senderName: string;
  senderProfileName: string;
  senderProfileId?: string;
  targetPhone?: string; // 628xxxx
  targetName?: string;
  messageText?: string;
  isAnonymous: boolean; // default: false (nama ditampilkan)
  step: "AWAITING_TARGET" | "AWAITING_MESSAGE" | "AWAITING_CONFIRMATION";
  updatedAt: number;
}

export interface MenfessHandleResult {
  handled: boolean;
  replyToSender?: string;
  dispatchToGroup?: {
    groupId: string;
    text: string;
    mentions: string[];
  };
}

export interface ContactAttachment {
  displayName: string;
  phone: string;
}

// In-Memory store sesi percakapan per nomor pengirim (TTL 15 menit)
const activeMenfessDrafts = new Map<string, MenfessDraft>();
const DRAFT_TTL_MS = 15 * 60 * 1000;

// Rate limiting & Cooldown Anti-Ban
// 1. Kuota per orang: max 2 menfess per 24 jam
const userDailyMenfess = new Map<string, { count: number; dateStr: string }>();
// 2. Cooldown antar menfess di grup: minimal 10 menit
const groupLastMenfessTime = new Map<string, number>();
const GROUP_COOLDOWN_MS = 10 * 60 * 1000;

// Opt-out list: nomor yang tidak ingin ditag menfess
const optedOutPhoneNumbers = new Set<string>();

/**
 * Normalisasi nomor WhatsApp ke format 628xxx
 */
export function normalizePhone(raw: string): string {
  let cleaned = String(raw || "").replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = "62" + cleaned.substring(1);
  if (!cleaned.startsWith("62") && cleaned.length >= 9) cleaned = "62" + cleaned;
  return cleaned;
}

/**
 * Toggle opt-out status (menolak ditag menfess)
 */
export function toggleMenfessOptOut(phone: string, optOut: boolean): string {
  const norm = normalizePhone(phone);
  if (optOut) {
    optedOutPhoneNumbers.add(norm);
    return `🛡️ *[PREFERENSI TERSIMPAN]*\n\nNomor antum (${norm}) telah dinonaktifkan dari penerimaan tag Titip Salam / Menfess di grup.\nKetik *!menfess on* kapan saja jika ingin mengaktifkannya kembali. 🙏`;
  } else {
    optedOutPhoneNumbers.delete(norm);
    return `✅ *[PREFERENSI TERSIMPAN]*\n\nNomor antum (${norm}) telah diaktifkan kembali untuk dapat menerima tag Titip Salam dari kawan alumni. ✨`;
  }
}

export const SITE_PORTAL_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://expedientgeneration.vercel.app";

// Mapping LID WhatsApp (15-16 digit) ke Nomor HP Asli (628xxx)
const lidToPhoneMap = new Map<string, string>();

export function registerLidPhoneMapping(lid: string, phone: string): void {
  const normLid = normalizePhone(lid);
  const normPhone = normalizePhone(phone);
  if (normLid && normPhone && normPhone.length <= 14 && normLid !== normPhone) {
    lidToPhoneMap.set(normLid, normPhone);
  }
}

export function getPhoneFromLid(lid: string): string | undefined {
  const normLid = normalizePhone(lid);
  return lidToPhoneMap.get(normLid);
}

/**
 * Verifikasi apakah pengirim terdaftar di database website (profiles Supabase)
 * Mendukung pencocokan nomor langsung, LID WhatsApp, dan nama alumni terdaftar
 */
export async function verifySenderRegistration(
  senderPhone: string,
  senderName?: string
): Promise<{
  isRegistered: boolean;
  profileName?: string;
  profileId?: string;
  resolvedPhone?: string;
}> {
  try {
    const supabase = createAdminClient();
    let cleanPhone = normalizePhone(senderPhone);

    // 1. Cek dari mapping cache LID -> Nomor HP asli
    const mappedPhone = lidToPhoneMap.get(cleanPhone);
    if (mappedPhone) {
      cleanPhone = mappedPhone;
    }

    const localPhone = cleanPhone.startsWith("62") ? "0" + cleanPhone.substring(2) : cleanPhone;
    const shortPhone = cleanPhone.slice(-9);

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, nama_lengkap, nama_panggilan, no_whatsapp")
      .or(`no_whatsapp.eq.${cleanPhone},no_whatsapp.eq.${localPhone},no_whatsapp.ilike.%${shortPhone}%`)
      .limit(1);

    if (profiles && profiles.length > 0) {
      const p = profiles[0];
      const profileName = p.nama_panggilan || p.nama_lengkap || "Sahabat Santri";
      const actualPhone = normalizePhone(p.no_whatsapp);
      if (cleanPhone !== actualPhone) {
        lidToPhoneMap.set(normalizePhone(senderPhone), actualPhone);
      }
      return {
        isRegistered: true,
        profileName,
        profileId: p.id,
        resolvedPhone: actualPhone,
      };
    }

    // 2. Jika nomor adalah LID (>= 14 digit) dan ada nama pengirim (pushName WA)
    // Coba cocokkan dengan nama_panggilan atau nama_lengkap di profiles
    if (cleanPhone.length >= 14 && senderName && senderName.trim().length >= 3) {
      const cleanName = senderName.trim().replace(/[@#]/g, "");
      const { data: nameMatches } = await supabase
        .from("profiles")
        .select("id, nama_lengkap, nama_panggilan, no_whatsapp")
        .not("no_whatsapp", "is", null)
        .or(`nama_panggilan.ilike.%${cleanName}%,nama_lengkap.ilike.%${cleanName}%`)
        .limit(2);

      if (nameMatches && nameMatches.length === 1) {
        const p = nameMatches[0];
        const profileName = p.nama_panggilan || p.nama_lengkap || senderName;
        const actualPhone = normalizePhone(p.no_whatsapp);
        lidToPhoneMap.set(cleanPhone, actualPhone);
        return {
          isRegistered: true,
          profileName,
          profileId: p.id,
          resolvedPhone: actualPhone,
        };
      }
    }

    return { isRegistered: false };
  } catch (err: any) {
    console.warn("[MENFESS-VERIFY-ERR]:", err.message);
    return { isRegistered: false };
  }
}

/**
 * Cari profil alumni target berdasarkan nama atau nomor HP
 */
export async function findTargetAlumni(
  query: string,
  incomingContacts?: ContactAttachment[]
): Promise<{
  found: boolean;
  phone?: string;
  name?: string;
  multipleMatches?: string[];
}> {
  // 1. Jika ada Kartu Kontak WhatsApp asli yang dilampirkan
  if (incomingContacts && incomingContacts.length > 0) {
    const contact = incomingContacts[0];
    const norm = normalizePhone(contact.phone);
    if (norm.length >= 10) {
      // Coba cocokkan dengan nama di DB
      try {
        const supabase = createAdminClient();
        const short = norm.slice(-9);
        const { data } = await supabase
          .from("profiles")
          .select("nama_lengkap, nama_panggilan")
          .or(`no_whatsapp.eq.${norm},no_whatsapp.ilike.%${short}%`)
          .limit(1);
        const dbName = data?.[0]?.nama_panggilan || data?.[0]?.nama_lengkap;
        return {
          found: true,
          phone: norm,
          name: dbName || contact.displayName || "Sahabat Alumni",
        };
      } catch (_) {
        return {
          found: true,
          phone: norm,
          name: contact.displayName || "Sahabat Alumni",
        };
      }
    }
  }

  const cleanQuery = query.trim();
  if (!cleanQuery) return { found: false };

  // 2. Jika input berupa nomor HP langsung
  const digitsOnly = cleanQuery.replace(/\D/g, "");
  if (digitsOnly.length >= 10) {
    const norm = normalizePhone(digitsOnly);
    try {
      const supabase = createAdminClient();
      const short = norm.slice(-9);
      const { data } = await supabase
        .from("profiles")
        .select("nama_lengkap, nama_panggilan")
        .or(`no_whatsapp.eq.${norm},no_whatsapp.ilike.%${short}%`)
        .limit(1);
      const dbName = data?.[0]?.nama_panggilan || data?.[0]?.nama_lengkap;
      return {
        found: true,
        phone: norm,
        name: dbName || `Sahabat (@${norm})`,
      };
    } catch (_) {
      return {
        found: true,
        phone: norm,
        name: `Sahabat (@${norm})`,
      };
    }
  }

  // 3. Jika input berupa Nama Alumni (cari di Supabase profiles)
  try {
    const supabase = createAdminClient();
    const cleanName = cleanQuery.replace(/[@#]/g, "").trim();
    const { data: matches, error } = await supabase
      .from("profiles")
      .select("id, nama_lengkap, nama_panggilan, no_whatsapp")
      .not("no_whatsapp", "is", null)
      .or(`nama_lengkap.ilike.%${cleanName}%,nama_panggilan.ilike.%${cleanName}%`)
      .limit(5);

    if (error || !matches || matches.length === 0) {
      return { found: false };
    }

    if (matches.length === 1) {
      const target = matches[0];
      const norm = normalizePhone(target.no_whatsapp);
      return {
        found: true,
        phone: norm,
        name: target.nama_panggilan || target.nama_lengkap,
      };
    }

    // Jika ada beberapa alumni dengan nama mirip
    return {
      found: false,
      multipleMatches: matches.map(
        (m) => `${m.nama_panggilan ? `"${m.nama_panggilan}" (${m.nama_lengkap})` : m.nama_lengkap}`
      ),
    };
  } catch (err: any) {
    console.warn("[MENFESS-FIND-TARGET-ERR]:", err.message);
    return { found: false };
  }
}

/**
 * Filter Keamanan Konten AI (Gemini Safety Screener)
 * Mencegah pesan toxic, cyberbullying, fitnah, kata kasar, atau SARA
 */
export async function checkMenfessContentSafety(
  messageText: string
): Promise<{ isSafe: boolean; reason?: string }> {
  const lower = messageText.toLowerCase();

  // Basic regex check untuk kata-kata terlarang ekstrim
  const bannedPatterns = [
    /\b(babi|anjing|bajingan|pantek|lonte|kontol|memek|itil|bangsat|tolol|goblok|idiot)\b/i,
    /\b(kafir|sesat|murtad|teroris)\b/i,
  ];

  for (const pattern of bannedPatterns) {
    if (pattern.test(lower)) {
      return {
        isSafe: false,
        reason: "Pesan mengandung kata-kata kasar atau tidak pantas.",
      };
    }
  }

  // Cek mendalam dengan AI Gemini Resilient
  try {
    const prompt = `Kamu adalah AI content moderator untuk komunitas santri alumni pesantren.
Evaluasi pesan titip salam (menfess) berikut apakah aman untuk disebarkan di grup publik alumni:
"${messageText}"

Kriteria penolakan:
1. Cyberbullying, penghinaan personal, atau merendahkan martabat orang.
2. Fitnah, gosip aib pribadi yang belum terbukti, atau tuduhan jahat.
3. Konten vulgar, seksual/mesum, atau pelecehan.
4. Ujaran kebencian SARA atau provokasi permusuhan.

Kembalikan HANYA format JSON valid:
{
  "isSafe": true | false,
  "reason": "alasan singkat jika tidak aman"
}`;

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    };

    const res = await callGeminiResilient(payload, undefined, "gemini-3.8-flash");
    const raw = res?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (raw) {
      const parsed = JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
      if (typeof parsed.isSafe === "boolean") {
        return parsed;
      }
    }
  } catch (err: any) {
    console.warn("[MENFESS-SAFETY-AI-WARN]:", err.message);
  }

  // Default lolos jika AI unreachable dan regex aman
  return { isSafe: true };
}

/**
 * Cek Kuota Harian Pengirim (Anti-Spam)
 */
function checkUserDailyQuota(senderPhone: string): boolean {
  const norm = normalizePhone(senderPhone);
  const today = new Date().toISOString().slice(0, 10);
  const record = userDailyMenfess.get(norm);

  if (!record || record.dateStr !== today) {
    userDailyMenfess.set(norm, { count: 1, dateStr: today });
    return true;
  }

  if (record.count >= 2) {
    return false; // Melebihi kuota 2x sehari
  }

  record.count++;
  return true;
}

/**
 * Deteksi NLU: Apakah chat pribadi merupakan niat titip salam / menfess?
 */
async function detectMenfessIntentWithAI(
  text: string
): Promise<{
  isMenfessIntent: boolean;
  targetQuery?: string;
  messageContent?: string;
  isAnonymous?: boolean;
}> {
  const lower = text.toLowerCase().trim();

  // Keyword langsung yang pasti menfess
  const isDirectKeyword =
    lower.startsWith("!menfess") ||
    lower.startsWith("/menfess") ||
    lower.startsWith(".menfess") ||
    lower.startsWith("!titipsalam") ||
    lower.startsWith("/titipsalam") ||
    lower.startsWith("titip salam") ||
    lower.startsWith("menfess") ||
    lower.includes("bisa kirim chat ke grup") ||
    lower.includes("bisa kirim pesan ke grup") ||
    lower.includes("tolong kirim pesan ini ke grup") ||
    lower.includes("tolong kirim ke grup") ||
    lower.includes("titip pesan ke grup") ||
    lower.includes("tag orangnya di grup") ||
    lower.includes("tag di grup");

  if (!isDirectKeyword && text.length < 8) {
    return { isMenfessIntent: false };
  }

  // Cek indikasi anonim dari teks
  const wantsAnonymous =
    /\b(anonim|rahasia|secret|sembunyikan nama|jangan sebut nama|jangan kasih tau nama|jangan bilang dari|tanpa nama)\b/i.test(
      lower
    );

  try {
    const prompt = `Analisis pesan chat pribadi dari seorang alumni ke bot WhatsApp berikut:
"${text}"

Tentukan apakah pengguna berniat untuk:
- Mengirim titip salam / menfess / pesan ke grup WhatsApp.
- Meminta bot menyampaikan sesuatu ke anggota grup lain dengan cara di-tag.
- Bertanya apakah bot bisa mengirim chat/pesan ke grup.

Ekstrak informasi berikut jika ada:
1. isMenfessIntent: boolean (apakah ini permintaan/pertanyaan terkait titip salam/menfess ke grup)
2. targetQuery: string | null (nama atau nomor kawan yang ingin ditag/dikirimi salam)
3. messageContent: string | null (isi pesan atau ucapan yang ingin disampaikan)
4. isAnonymous: boolean (true jika meminta namanya dirahasiakan/anonim, false jika tidak ada permintaan demikian)

Kembalikan HANYA format JSON valid:
{
  "isMenfessIntent": true,
  "targetQuery": null,
  "messageContent": null,
  "isAnonymous": false
}`;

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    };

    const res = await callGeminiResilient(payload, undefined, "gemini-3.8-flash");
    const raw = res?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (raw) {
      const parsed = JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
      return {
        isMenfessIntent: Boolean(parsed.isMenfessIntent || isDirectKeyword),
        targetQuery: parsed.targetQuery || undefined,
        messageContent: parsed.messageContent || undefined,
        isAnonymous: Boolean(parsed.isAnonymous || wantsAnonymous),
      };
    }
  } catch (err: any) {
    console.warn("[MENFESS-NLU-WARN]:", err.message);
  }

  // Fallback heuristik jika AI tidak merespons
  return {
    isMenfessIntent: isDirectKeyword,
    isAnonymous: wantsAnonymous,
  };
}

/**
 * Format Pesan Preview untuk Pengirim
 */
function buildPreviewMessage(draft: MenfessDraft): string {
  const senderDisplay = draft.isAnonymous
    ? "Seorang Sahabat Santri (Anonim 🕵️✨)"
    : `${draft.senderProfileName} (Nama antum ditampilkan 👤)`;

  return (
    `📋 *[PREVIEW TITIP SALAM / MENFESS]* 🕊️\n\n` +
    `🎯 *Ditujukan untuk:* ${draft.targetName} (@${draft.targetPhone})\n` +
    `💌 *Isi Pesan:*\n"${draft.messageText}"\n\n` +
    `👤 *Pengirim:* ${senderDisplay}\n` +
    `👥 *Grup Tujuan:* Grup Komunitas Santri (Non-Resmi)\n` +
    `═══════════════════════════\n` +
    `⚡ *Apakah pesan di atas sudah pas sahabat?*\n\n` +
    `👉 Balas *KIRIM* untuk langsung meluncurkan ke grup!\n` +
    `👉 Balas *KIRIM ANONIM* jika ingin merahasiakan nama pengirim.\n` +
    `👉 Balas *BATAL* jika ingin membatalkan.`
  );
}

/**
 * Format Pesan Resmi yang Diposting ke Grup dengan Tag Biru
 */
export function buildGroupMenfessMessage(
  targetPhone: string,
  messageText: string,
  senderProfileName: string,
  isAnonymous: boolean
): string {
  const senderLine = isAnonymous
    ? `— Dari: *Seorang Sahabat Santri (Anonim 🕵️✨)*`
    : `— Dari: Sahabat *${senderProfileName}* 👤`;

  return (
    `💌 *[TITIP SALAM ALUMNI / MENFESS]* 🕊️\n\n` +
    `Ada titipan salam hangat dari kawan untuk @${targetPhone}:\n\n` +
    `_"${messageText.trim()}"_\n\n` +
    `${senderLine}\n` +
    `═══════════════════════════\n` +
    `_(Ingin titip salam juga? Chat pribadi langsung ke bot ini!)_ ✨`
  );
}

/**
 * Handler Utama: Memproses pesan chat pribadi (DM) terkait Titip Salam / Menfess
 */
export async function handlePrivateMenfessMessage(options: {
  senderPhone: string;
  senderName: string;
  messageText: string;
  incomingContacts?: ContactAttachment[];
}): Promise<MenfessHandleResult> {
  const { senderPhone, senderName, messageText, incomingContacts } = options;
  let normSenderPhone = normalizePhone(senderPhone);
  const now = Date.now();
  const lower = messageText.toLowerCase().trim();

  // 1. Cek apakah ada draf aktif untuk pengirim ini
  let draft = activeMenfessDrafts.get(normSenderPhone);

  // Bersihkan draf kedaluwarsa (>15 menit)
  if (draft && now - draft.updatedAt > DRAFT_TTL_MS) {
    activeMenfessDrafts.delete(normSenderPhone);
    draft = undefined;
  }

  // 2. Aksi Pembatalan (Batal / Cancel / Stop)
  if (draft && (lower === "batal" || lower === "cancel" || lower === "tidak jadi" || lower === "gak jadi")) {
    activeMenfessDrafts.delete(normSenderPhone);
    return {
      handled: true,
      replyToSender: `👌 *Titip Salam Dibatalkan!*\nDraf pesan antum telah dihapus. Ketik apa saja kapan pun antum ingin titip salam lagi ya sahabat! 😊`,
    };
  }

  // 3. Jika pengguna sedang di fase konfirmasi draf (AWAITING_CONFIRMATION)
  if (draft && draft.step === "AWAITING_CONFIRMATION") {
    // A. Pengguna konfirmasi "KIRIM"
    const isConfirmSend =
      lower === "kirim" ||
      lower === "kirimkan" ||
      lower === "gas" ||
      lower === "ya" ||
      lower === "oke" ||
      lower === "ok" ||
      lower === "send" ||
      lower === "lanjut";

    const isConfirmAnonymous =
      lower === "kirim anonim" ||
      lower === "kirim tapi anonim" ||
      lower === "anonim" ||
      lower === "rahasia";

    if (isConfirmSend || isConfirmAnonymous) {
      if (isConfirmAnonymous) {
        draft.isAnonymous = true;
      }

      // 1. Cek Kuota Harian (Maks 2x / 24 Jam)
      if (!checkUserDailyQuota(normSenderPhone)) {
        activeMenfessDrafts.delete(normSenderPhone);
        return {
          handled: true,
          replyToSender: `⚠️ *[KUOTA HARIAN TERCAPAI]*\n\nAfwan Sahabat *${draft.senderProfileName}*, demi kenyamanan anggota dan ketertiban grup, kuota titip salam dibatasi maksimal *2 kali sehari*.\nSilakan coba lagi besok ya! Barâkallâhu fîk. 🙏✨`,
        };
      }

      // 2. Cek Cooldown Grup (Anti-Ban Spike: minimal 10 menit antar menfess di grup)
      const targetGroupId = getCommunityGroupId();
      const lastGroupSent = groupLastMenfessTime.get(targetGroupId) || 0;
      if (now - lastGroupSent < GROUP_COOLDOWN_MS) {
        const remainingMin = Math.ceil((GROUP_COOLDOWN_MS - (now - lastGroupSent)) / 60000);
        return {
          handled: true,
          replyToSender: `⏳ *[GRUP SEDANG RAMAI]*\n\nAda titip salam yang baru saja dikirim ke grup kawan-kawan. Demi mencegah penumpukan notifikasi dan proteksi dari sistem Meta, bot memberi jeda *${remainingMin} menit* lagi sebelum pesan antum dikirim.\n\nPesan antum tetap tersimpan! Balas *KIRIM* beberapa menit lagi ya sahabat! 🙏`,
        };
      }

      // 3. Screen Konten dengan AI Gemini
      const safety = await checkMenfessContentSafety(draft.messageText || "");
      if (!safety.isSafe) {
        activeMenfessDrafts.delete(normSenderPhone);
        return {
          handled: true,
          replyToSender: `🚫 *[PESAN TIDAK DAPAT DIKIRIM]*\n\nAfwan sahabat, pesan antum tidak dapat diteruskan ke grup karena terdeteksi muatan yang kurang pantas:\n_${safety.reason || "Mengandung unsur yang berpotensi menyinggung/melanggar etika silaturahmi"}_\n\nMari jaga keharmonisan ukhuwah alumni ya sahabat! Silakan kirim ulang dengan kata-kata yang lebih santun. 🙏✨`,
        };
      }

      // 4. Cek apakah target opt-out (menolak ditag)
      if (draft.targetPhone && optedOutPhoneNumbers.has(draft.targetPhone)) {
        activeMenfessDrafts.delete(normSenderPhone);
        return {
          handled: true,
          replyToSender: `ℹ️ *Sahabat ${draft.targetName} telah menonaktifkan fitur tag menfess untuk nomornya.* Titip salam tidak dapat dikirim ke kontak ini demi menghargai privasi beliau. 🙏`,
        };
      }

      // 5. Eksekusi Kirim ke Grup
      const groupText = buildGroupMenfessMessage(
        draft.targetPhone!,
        draft.messageText!,
        draft.senderProfileName,
        draft.isAnonymous
      );

      groupLastMenfessTime.set(targetGroupId, now);
      activeMenfessDrafts.delete(normSenderPhone);

      return {
        handled: true,
        replyToSender: ` Alhamdulillah Sahabat *${draft.senderProfileName}*! Titip salam antum telah berhasil diposting ke grup dengan tag resmi untuk *${draft.targetName}*! \n\n${draft.isAnonymous ? "🔒 *Status Pengirim:* Dirahasiakan (Anonim)" : "👤 *Status Pengirim:* Nama antum dicantumkan"}`,
        dispatchToGroup: {
          groupId: targetGroupId,
          text: groupText,
          mentions: [`${draft.targetPhone}@s.whatsapp.net`],
        },
      };
    }

    // Toggle mode anonim dalam preview
    if (lower.includes("anonim") || lower.includes("rahasia") || lower.includes("sembunyikan")) {
      draft.isAnonymous = true;
      draft.updatedAt = now;
      return {
        handled: true,
        replyToSender: `🔒 *Mode Anonim Diaktifkan!*\n\n${buildPreviewMessage(draft)}`,
      };
    }

    if (lower.includes("tampilkan nama") || lower.includes("jangan anonim")) {
      draft.isAnonymous = false;
      draft.updatedAt = now;
      return {
        handled: true,
        replyToSender: `👤 *Nama Pengirim Akan Ditampilkan!*\n\n${buildPreviewMessage(draft)}`,
      };
    }
  }

  // 4. Jika sedang menunggu target (AWAITING_TARGET)
  if (draft && draft.step === "AWAITING_TARGET") {
    const targetResult = await findTargetAlumni(messageText, incomingContacts);

    if (targetResult.found && targetResult.phone) {
      draft.targetPhone = targetResult.phone;
      draft.targetName = targetResult.name;
      draft.updatedAt = now;

      // Jika pesan sudah ada sebelumnya
      if (draft.messageText) {
        draft.step = "AWAITING_CONFIRMATION";
        return {
          handled: true,
          replyToSender: buildPreviewMessage(draft),
        };
      }

      // Jika pesan belum ada, minta pesannya
      draft.step = "AWAITING_MESSAGE";
      return {
        handled: true,
        replyToSender: `🎯 *Target Terpilih:* ${draft.targetName} (@${draft.targetPhone})\n\nSekarang, silakan tulis *pesan atau salam hangat* apa yang ingin disampaikan ke beliau sahabat! 💌`,
      };
    }

    if (targetResult.multipleMatches && targetResult.multipleMatches.length > 0) {
      return {
        handled: true,
        replyToSender: `🔍 *Ditemukan beberapa kawan dengan nama mirip:*\n\n${targetResult.multipleMatches.map((m, i) => `${i + 1}. ${m}`).join("\n")}\n\nMohon tuliskan nama yang lebih spesifik atau lampirkan Kartu Kontak-nya ya sahabat! 📎`,
      };
    }

    return {
      handled: true,
      replyToSender: `🤔 *Kontak alumni "${messageText}" belum ditemukan di direktori.*\n\nBiar 100% akurat, antum bisa:\n1. 📎 Kirim **Kartu Kontak** beliau dari WA (klik ikon klip kertas).\n2. Atau ketik nomor WhatsApp beliau (contoh: *08123456789*).\n\n_(Ketik *BATAL* untuk membatalkan)_`,
    };
  }

  // 5. Jika sedang menunggu isi pesan (AWAITING_MESSAGE)
  if (draft && draft.step === "AWAITING_MESSAGE") {
    // Cek apakah di dalam pesan ada permintaan anonim
    if (/\b(anonim|rahasia|jangan sebut nama|jangan kasih tau nama|sembunyikan nama)\b/i.test(lower)) {
      draft.isAnonymous = true;
    }

    draft.messageText = messageText.trim();
    draft.step = "AWAITING_CONFIRMATION";
    draft.updatedAt = now;

    return {
      handled: true,
      replyToSender: buildPreviewMessage(draft),
    };
  }

  // 6. Jika belum ada draf, deteksi apakah ada niat titip salam / menfess
  const intent = await detectMenfessIntentWithAI(messageText);
  if (!intent.isMenfessIntent && (!incomingContacts || incomingContacts.length === 0)) {
    return { handled: false };
  }

  // PENGIRIM TERDETEKSI INGIN TITIP SALAM:
  // Langkah Pertama: Verifikasi Keanggotaan Website (Gatekeeper)
  const verification = await verifySenderRegistration(normSenderPhone, senderName);
  if (!verification.isRegistered) {
    const isLid = normSenderPhone.length >= 14;
    const phoneDisplay = isLid ? "" : ` (*${normSenderPhone}*)`;
    return {
      handled: true,
      replyToSender:
        `Assalamu'alaikum sahabat! 👋\n\n` +
        `Fitur *Titip Salam / Menfess* ke grup ini adalah fasilitas khusus untuk *Alumni Angkatan* yang telah terdata di website resmi demi menjaga ketertiban komunitas.\n\n` +
        `Nomor WhatsApp antum saat ini${phoneDisplay} belum terverifikasi di database portal alumni.\n\n` +
        `Yuk, lengkapi data antum terlebih dahulu di:\n` +
        `🔗 *${SITE_PORTAL_URL}/register* (atau login jika sudah punya akun)\n\n` +
        `💡 *Sudah punya akun tapi nomornya berbeda?*\n` +
        `Silakan login ke *${SITE_PORTAL_URL}/profil* lalu perbarui nomor WhatsApp aktif antum, atau hubungi admin angkatan ya! Barâkallâhu fîk. 🙏✨`,
    };
  }

  // Jika nomor asli berhasil di-resolve dari pemetaan LID
  if (verification.resolvedPhone) {
    normSenderPhone = verification.resolvedPhone;
  }

  // Jika sudah terdaftar, inisialisasi draf baru
  const newDraft: MenfessDraft = {
    senderPhone: normSenderPhone,
    senderName,
    senderProfileName: verification.profileName || senderName,
    senderProfileId: verification.profileId,
    isAnonymous: Boolean(intent.isAnonymous), // default false, true jika diminta
    step: "AWAITING_TARGET",
    updatedAt: now,
  };

  // Coba ekstrak target jika ada di pesan awal atau kontak
  const targetQuery = intent.targetQuery || (incomingContacts && incomingContacts.length > 0 ? incomingContacts[0].displayName : undefined);
  if (targetQuery || (incomingContacts && incomingContacts.length > 0)) {
    const resolved = await findTargetAlumni(targetQuery || "", incomingContacts);
    if (resolved.found && resolved.phone) {
      newDraft.targetPhone = resolved.phone;
      newDraft.targetName = resolved.name;
    }
  }

  // Coba ekstrak pesan jika ada di pesan awal
  if (intent.messageContent && intent.messageContent.length > 3) {
    newDraft.messageText = intent.messageContent;
  }

  // Tentukan langkah berikutnya
  if (newDraft.targetPhone && newDraft.messageText) {
    newDraft.step = "AWAITING_CONFIRMATION";
    activeMenfessDrafts.set(normSenderPhone, newDraft);
    return {
      handled: true,
      replyToSender: buildPreviewMessage(newDraft),
    };
  }

  if (newDraft.targetPhone && !newDraft.messageText) {
    newDraft.step = "AWAITING_MESSAGE";
    activeMenfessDrafts.set(normSenderPhone, newDraft);
    return {
      handled: true,
      replyToSender:
        `Bisa banget Sahabat *${newDraft.senderProfileName}*! 🤖✨\n\n` +
        `🎯 *Target Terpilih:* ${newDraft.targetName} (@${newDraft.targetPhone})\n\n` +
        `Sekarang, silakan ketik *isi salam atau pesan* apa yang ingin disampaikan ke beliau di grup! 💌\n` +
        `_(Nama antum otomatis ditampilkan di pesan, tapi kalau mau dirahasiakan tinggal bilang "kirim anonim" ya!)_`,
    };
  }

  // Jika target belum diketahui
  newDraft.step = "AWAITING_TARGET";
  activeMenfessDrafts.set(normSenderPhone, newDraft);

  return {
    handled: true,
    replyToSender:
      `Bisa banget Sahabat *${newDraft.senderProfileName}*! 🤖✨ Bot siap bantu sampaikan titip salam/pesan antum ke grup santri secara resmi.\n\n` +
      `Siapa kawan yang ingin antum tag di grup? Antum bisa:\n` +
      `1. 📎 Kirim **Kartu Kontak** kawan tersebut (klik tombol klip kertas).\n` +
      `2. Ketik nama kawan antum (contoh: *Ilham* atau *Mas Danu*).\n` +
      `3. Atau ketik nomor WhatsApp-nya langsung.\n\n` +
      `_(💡 Secara default, nama antum akan dicantumkan sebagai pengirim demi ukhuwah. Tapi kalau mau dirahasiakan/anonim, tinggal bilang ya!)_`,
  };
}

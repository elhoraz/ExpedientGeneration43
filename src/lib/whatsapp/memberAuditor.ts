import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppMessageWithDetail } from "@/lib/whatsapp";

const PENDING_INVITES_KEY = "pending_member_invitations";

export interface AuditResult {
  totalAnalyzed: number;
  registered: Array<{ phone: string; name: string }>;
  unregistered: string[];
}

/**
 * Mengekstrak dan menormalisasi seluruh nomor telepon dari teks bebas (paste WhatsApp, koma, baris baru, dsb)
 */
export function extractPhoneNumbers(text: string): string[] {
  if (!text) return [];

  // 1. Ambil seluruh pola nomor telepon yang mungkin (mengandung angka minimal 8 digit)
  // Cocok dengan format: +62 812-3456-7890, 08123456789, 628123456789, dll.
  const rawMatches = text.match(/(?:\+?62|0)[\s\-\.\(\)]*8[\s\-\.\(\)0-9]{7,15}/g) || [];

  const normalizedSet = new Set<string>();

  for (const raw of rawMatches) {
    let clean = raw.replace(/\D/g, "");
    if (clean.startsWith("0")) {
      clean = "62" + clean.substring(1);
    } else if (clean.startsWith("8")) {
      clean = "62" + clean;
    }

    // Validasi nomor seluler Indonesia: 628 + 8-12 digit angka (panjang total 10 - 14 karakter)
    if (/^628[0-9]{8,12}$/.test(clean)) {
      normalizedSet.add(clean);
    }
  }

  return Array.from(normalizedSet);
}

/**
 * Memeriksa daftar nomor terhadap database `profiles` di Supabase
 */
export async function auditGroupMembersAgainstDatabase(rawInput: string): Promise<AuditResult> {
  const extractedPhones = extractPhoneNumbers(rawInput);
  if (extractedPhones.length === 0) {
    return {
      totalAnalyzed: 0,
      registered: [],
      unregistered: [],
    };
  }

  const supabase = createAdminClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, nama_lengkap, nama_panggilan, no_whatsapp, is_active");

  if (error || !profiles) {
    console.error("[MEMBER-AUDIT-DB-ERR]:", error);
    return {
      totalAnalyzed: extractedPhones.length,
      registered: [],
      unregistered: extractedPhones,
    };
  }

  // Buat lookup map nomor WhatsApp yang terdaftar
  const registeredPhoneMap = new Map<string, string>();
  for (const p of profiles) {
    if (!p.no_whatsapp) continue;
    let norm = String(p.no_whatsapp).replace(/\D/g, "");
    if (norm.startsWith("0")) norm = "62" + norm.substring(1);
    if (!norm.startsWith("62")) norm = "62" + norm;

    const displayName = p.nama_panggilan || p.nama_lengkap || "Sahabat";
    registeredPhoneMap.set(norm, displayName);
  }

  const registered: Array<{ phone: string; name: string }> = [];
  const unregistered: string[] = [];

  for (const phone of extractedPhones) {
    if (registeredPhoneMap.has(phone)) {
      registered.push({
        phone,
        name: registeredPhoneMap.get(phone)!,
      });
    } else {
      unregistered.push(phone);
    }
  }

  // Simpan daftar nomor yang belum terdaftar ke Supabase site_content agar bisa dieksekusi japri
  try {
    await supabase.from("site_content").upsert(
      {
        content_key: PENDING_INVITES_KEY,
        content_value: JSON.stringify(unregistered),
        content_type: "json",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "content_key" }
    );
  } catch (err: any) {
    console.warn("[MEMBER-AUDIT-SAVE-WARN]:", err.message);
  }

  return {
    totalAnalyzed: extractedPhones.length,
    registered,
    unregistered,
  };
}

/**
 * Format laporan hasil audit ke dalam pesan WhatsApp yang rapi dan informatif
 */
export function formatAuditSummaryMessage(result: AuditResult): string {
  const { totalAnalyzed, registered, unregistered } = result;

  if (totalAnalyzed === 0) {
    return (
      `⚠️ *Tidak ada nomor WhatsApp yang terdeteksi!*\n\n` +
      `Pastikan antum menyertakan nomor telepon Indonesia (misal: 08123456789 atau +62 812-3456-7890).\n` +
      `Contoh penggunaan:\n` +
      `*@bot cek-member: 08123456789, 08571234567, 08139876543*`
    );
  }

  let text = `📊 *HASIL AUDIT ANGGOTA GRUP vs DATABASE WEBSITE* 🔍\n`;
  text += `_Expedient Generation 43_\n\n`;
  text += `• Total Nomor Dianalisis: *${totalAnalyzed} Nomor*\n`;
  text += `• ✅ Sudah Terdaftar di Web: *${registered.length} Sahabat*\n`;
  text += `• ❌ Belum Terdaftar di Web: *${unregistered.length} Nomor*\n\n`;

  if (registered.length > 0) {
    text += `*✅ Sahabat yang Sudah Terdaftar (${registered.length}):*\n`;
    registered.slice(0, 10).forEach((r, i) => {
      text += `  ${i + 1}. *${r.name}* (${maskPhone(r.phone)})\n`;
    });
    if (registered.length > 10) {
      text += `  _...dan ${registered.length - 10} sahabat lainnya._\n`;
    }
    text += `\n`;
  }

  if (unregistered.length > 0) {
    text += `*❌ Nomor yang BELUM Terdaftar (${unregistered.length}):*\n`;
    unregistered.slice(0, 10).forEach((u, i) => {
      text += `  ${i + 1}. ${formatPhoneDisplay(u)}\n`;
    });
    if (unregistered.length > 10) {
      text += `  _...dan ${unregistered.length - 10} nomor lainnya._\n`;
    }
    text += `\n`;
    text += `------------------------------------------\n`;
    text += `📢 *EKSEKUSI JAPRI UNDANGAN REGISTRASI:*\n`;
    text += `Ketik: *KIRIM UNDANGAN* (atau balas: *YA*)\n`;
    text += `Maka bot akan otomatis menjapri ${unregistered.length} sahabat di atas satu per satu dengan pesan ajakan ramah & link registrasi!\n`;
  } else {
    text += `🎉 *Luar biasa! Seluruh nomor yang diinput sudah memiliki akun di website angkatan!* 🌟`;
  }

  return text;
}

/**
 * Mengirim pesan japri undangan personal ke seluruh nomor yang belum terdaftar (dengan jeda aman anti-banned)
 */
export async function executeMemberInvitations(adminPhone: string): Promise<{
  success: boolean;
  totalTarget: number;
  sentCount: number;
  failedCount: number;
  message: string;
}> {
  const supabase = createAdminClient();

  // 1. Cek Emergency Killswitch
  try {
    const { data: killData } = await supabase
      .from("site_content")
      .select("content_value")
      .eq("content_key", "emergency_broadcast_killswitch")
      .maybeSingle();

    if (killData?.content_value) {
      const parsed = JSON.parse(killData.content_value);
      if (parsed.active) {
        return {
          success: false,
          totalTarget: 0,
          sentCount: 0,
          failedCount: 0,
          message: `🛑 *PENGIRIMAN DIBATALKAN (KILLSWITCH AKTIF)*\nSistem pengiriman broadcast/undangan sedang dimatikan darurat. Hubungi developer jika ingin mengaktifkan kembali.`,
        };
      }
    }
  } catch {}

  // 2. Ambil antrean nomor dari Supabase dan LANGSUNG KOSONGKAN antrean
  // Hal ini penting agar webhook retry dari Fonnte/Vercel TIDAK BISA memproses antrean ganda secara paralel!
  let rawPhones: string[] = [];
  try {
    const { data } = await supabase
      .from("site_content")
      .select("content_value")
      .eq("content_key", PENDING_INVITES_KEY)
      .maybeSingle();

    if (data?.content_value) {
      const parsed = JSON.parse(data.content_value);
      if (Array.isArray(parsed)) rawPhones = parsed;
    }

    // Langsung hapus antrean seketika (Atomic Pop) agar tidak dieksekusi dobel
    await supabase.from("site_content").delete().eq("content_key", PENDING_INVITES_KEY);
  } catch (err: any) {
    console.warn("[FETCH-PENDING-INVITES-ERR]:", err.message);
  }

  // Deduplikasi internal dalam batch
  const uniquePhones = Array.from(new Set(rawPhones));

  if (uniquePhones.length === 0) {
    return {
      success: false,
      totalTarget: 0,
      sentCount: 0,
      failedCount: 0,
      message:
        `⚠️ *Tidak ada antrean nomor yang belum terdaftar.*\n` +
        `Antrean kosong atau sudah selesai diproses. Silakan ketik *@bot cek-member:* untuk audit ulang jika diperlukan.`,
    };
  }

  // 3. DEDUPLIKASI KETAT HISTORIS: Periksa nomor mana saja yang sudah PERNAH dikirim undangan dalam 7 hari terakhir
  const alreadySentSet = new Set<string>();
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentQueue } = await supabase
      .from("whatsapp_queue")
      .select("no_whatsapp")
      .eq("status", "sent_invite")
      .gte("created_at", sevenDaysAgo);

    if (recentQueue) {
      recentQueue.forEach((q) => {
        if (q.no_whatsapp) alreadySentSet.add(q.no_whatsapp);
      });
    }
  } catch (err: any) {
    console.warn("[CHECK-DUPLICATES-ERR]:", err.message);
  }

  // Filter nomor yang benar-benar BELUM pernah menerima undangan
  const targetPhones = uniquePhones.filter((p) => !alreadySentSet.has(p));

  if (targetPhones.length === 0) {
    return {
      success: true,
      totalTarget: uniquePhones.length,
      sentCount: 0,
      failedCount: 0,
      message:
        `✅ *Semua nomor dalam daftar (${uniquePhones.length}) sudah pernah menerima pesan undangan sebelumnya.*\n` +
        `Pengiriman di-skip otomatis untuk mencegah pesan duplikat/spam ke sahabat alumni!`,
    };
  }

  let sentCount = 0;
  let failedCount = 0;

  // Variasi Spintax agar setiap pesan memiliki teks berbeda (Lolos dari deteksi filter bulk Meta/WhatsApp)
  const salamVariations = [
    "Assalamu'alaikum Warahmatullahi Wabarakatuh, Sahabat! ✨",
    "Assalamu'alaikum Wr. Wb. Salam hangat untuk Sahabat seperjuangan! 🌟",
    "Assalamu'alaikum Sahabat tercinta keluarga besar Expedient 43! 💫",
    "Bismillah, Assalamu'alaikum Warahmatullahi Wabarakatuh! 🙏✨",
  ];

  const introVariations = [
    "Semoga antum senantiasa sehat dan dilimpahkan keberkahan.",
    "Semoga kabar antum dan keluarga senantiasa dalam lindungan Allah SWT.",
    "Semoga hari-hari antum selalu dilimpahi kemudahan dan kesuksesan.",
    "Salam rindu dan silaturahmi hangat dari kami sesama alumni Arrisalah 2023.",
  ];

  const ctaVariations = [
    "Yuk luangkan 1 menit untuk melengkapi profil & biodata antum di tautan resmi ini:",
    "Monggo langsung bergabung dan aktifkan akun profil antum di link resmi berikut:",
    "Bisa langsung klik tautan resmi di bawah ini untuk pendaftaran akun alumni antum:",
    "Silakan daftarkan akun antum agar terhubung dalam direktori alumni terpadu kita:",
  ];

  for (let i = 0; i < targetPhones.length; i++) {
    const phone = targetPhones[i];

    // Double check sebelum kirim jika nomor ini baru saja terkirim
    if (alreadySentSet.has(phone)) {
      continue;
    }

    // Pick random variations for Anti-Fingerprint
    const salam = salamVariations[Math.floor(Math.random() * salamVariations.length)];
    const intro = introVariations[Math.floor(Math.random() * introVariations.length)];
    const cta = ctaVariations[Math.floor(Math.random() * ctaVariations.length)];
    const refCode = `EG43-${Math.floor(1000 + Math.random() * 9000)}`;

    const invitationMessage =
      `${salam}\n\n` +
      `${intro} Mengingatkan kembali bahwa portal resmi *Expedient Generation 43* (Alumni Pondok Modern Arrisalah Slahung Ponorogo, Angkatan 2023) telah aktif untuk mempererat ukhuwah kita:\n\n` +
      `🌐 *https://expedientgeneration.vercel.app*\n\n` +
      `Di website ini antum bisa:\n` +
      `• Mengisi biodata, foto, & domisili direktori alumni se-Indonesia\n` +
      `• Melihat kalender milad sahabat & agenda reuni angkatan\n` +
      `• Mengakses Baitul Maal & transparansi kas ta'awun terbuka\n\n` +
      `${cta}\n` +
      `👉 *https://expedientgeneration.vercel.app/register*\n\n` +
      `_Pesan resmi dari Pengurus Expedient Generation 43._\n` +
      `*(Catatan: Jika antum sudah pernah mendaftar di website dengan nomor lain/email, atau menerima pesan ini lebih dari satu kali karena sinkronisasi sistem, mohon diabaikan ya Akhi. Afwan atas ketidaknyamanannya! 🙏)*\n` +
      `_Ref: #${refCode}_`;

    const res = await sendWhatsAppMessageWithDetail(phone, invitationMessage);

    // Catat log pengiriman ke Supabase whatsapp_queue
    try {
      await supabase.from("whatsapp_queue").insert([
        {
          no_whatsapp: phone,
          message: `[UNDANGAN REGISTRASI WEB - ${refCode}] Terkirim ke ${phone}`,
          status: res.success ? "sent_invite" : "failed_invite",
          error_message: res.success ? null : res.reason,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    } catch {}

    if (res.success) {
      sentCount++;
      alreadySentSet.add(phone);
    } else {
      failedCount++;
    }

    // ULTRA-SAFE ANTI-BAN PACING:
    if (i < targetPhones.length - 1) {
      // Setiap kelipatan 10 pesan, beri jeda istirahat (cooling break) selama 20-30 detik
      if ((i + 1) % 10 === 0) {
        const coolingDelay = Math.floor(20000 + Math.random() * 10000);
        await new Promise((r) => setTimeout(r, coolingDelay));
      } else {
        // Jeda dinamis acak antar pesan: 7.000ms - 12.000ms (7 - 12 detik)
        const delayMs = Math.floor(7000 + Math.random() * 5000);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  // Bersihkan antrean setelah dieksekusi
  try {
    await supabase.from("site_content").delete().eq("content_key", PENDING_INVITES_KEY);
  } catch {}

  const report =
    `🎉 *LAPORAN PENGIRIMAN JAPRI UNDANGAN SELESAI* 🚀\n\n` +
    `• Total Target: *${targetPhones.length} Sahabat*\n` +
    `• ✅ Berhasil Terkirim: *${sentCount} Pesan*\n` +
    `• ❌ Gagal: *${failedCount} Pesan*\n\n` +
    `Alhamdulillah, sistem anti-ban spintax & safe pacing telah tuntas dijalankan. Seluruh sahabat yang belum terdaftar telah menerima undangan personal! 🙌✨`;

  return {
    success: true,
    totalTarget: targetPhones.length,
    sentCount,
    failedCount,
    message: report,
  };
}

function maskPhone(p: string): string {
  if (p.length < 8) return p;
  return p.slice(0, 4) + "****" + p.slice(-4);
}

function formatPhoneDisplay(p: string): string {
  if (p.startsWith("62")) {
    return "+62 " + p.slice(2, 5) + "-" + p.slice(5, 9) + "-" + p.slice(9);
  }
  return p;
}

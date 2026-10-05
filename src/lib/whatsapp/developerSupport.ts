import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Modul Gotong Royong & Keberlanjutan Sistem (Website & Bot Expedient 43)
 * Menangani informasi donasi / operasional server secara wajar & berwibawa
 * dengan penegasan bahwa selama ini operasional masih memakai dana pribadi developer.
 */

const WEEKLY_MAINTENANCE_KEY = "last_weekly_qris_sent_at";
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // Minimal jeda 7 hari (sekali seminggu)

/**
 * Mendeteksi secara alami apakah user bertanya / menyinggung biaya server, donasi, atau dukungan
 */
export function isDeveloperSupportInquiry(text: string): boolean {
  if (!text) return false;
  const lower = text.trim().toLowerCase();

  const patterns = [
    /\b(traktir|beliin|kasih|beli|sedekah)\s*(an\s*)?(kopi|es\s*teh|camilan)?\s*(dev|developer|pembuat|admin|min|bot)?\b/i,
    /\b(rekening|norek|no\s*rek|qris|saweria)\s*(dev|developer|admin|pembuat|web|bot|server|kopi)?\b/i,
    /\b(bantu|support|dukung|donasi|sawer|patungan)\s*(biaya\s*)?(dev|developer|server|hosting|pembuat|web|website|bot|kopi)?\b/i,
    /\b(cara\s*)?(traktir\s*kopi|sawer\s*kopi|donasi\s*web|beli\s*kopi|dukung\s*web|bantu\s*server)\b/i,
    /\b(mau|ingin|pengen)\s*(traktir|bantu|donasi|sawer|patungan)\b/i,
    /\b(biaya|bayar|ongkos)\s*(server|bot|web|website)\b/i,
    /\b(server|bot|web)\s*(ini\s*)?(bayar|gratis|mahal|pake\s*apa)\b/i,
    /\bdana\s*pribadi\b/i,
    /\brekening\s*pengembang\b/i,
    /\bkopi\s*(admin|dev|developer)\b/i,
  ];

  return patterns.some((p) => p.test(lower));
}

/**
 * Pesan On-Demand (Momen B): Dikirim saat ada kawan yang bertanya atau berniat mendukung
 * Lugas, santun, dan transparan tanpa menyebut nama pribadi/merchant
 */
export function getDeveloperSupportMessage(): string {
  return (
    `🌐 *[GOTONG ROYONG KEBERLANJUTAN SISTEM]*\n\n` +
    `Masya Allah, terima kasih banyak atas perhatian dan kepedulian Sahabat terhadap keberlanjutan website & bot WhatsApp Expedient 43! 🤲✨\n\n` +
    `Sekadar informasi transparan, seluruh operasional sistem digital angkatan kita—mulai dari *server cloud, domain, database alumni, hingga komputasi AI bot 24 jam*—selama ini masih berjalan menggunakan *dana pribadi developer*.\n\n` +
    `Bagi kawan-kawan yang ingin ikut berpartisipasi sukarela menjaga agar server angkatan tetap stabil melayani kawan-kawan, barcode QRIS di atas dapat langsung discan:\n\n` +
    `📱 *QRIS Resmi Sistem (Semua Bank & E-Wallet):*\n` +
    `   • Mendukung BCA, Mandiri, BRI, BNI, DANA, GoPay, OVO, ShopeePay, dll.\n\n` +
    `Berapa pun partisipasi sahabat, insya Allah menjadi amal jariyah yang bernilai ukhuwah tinggi. Semoga Allah membalas dengan kelapangan rezeki yang berlipat ganda dan berkah. Aamiin ya Rabbal 'Alamin. ☕🌿`
  );
}

/**
 * Pesan Terjadwal (Momen A): Dikirim otomatis maksimal 1 minggu sekali di grup
 * Menjelaskan keberlanjutan sistem yang masih menggunakan dana pribadi developer secara berwibawa
 */
export function getWeeklySystemMaintenanceMessage(): string {
  return (
    `🌐 *[KEBERLANJUTAN SISTEM EXPEDIENT 43]*\n\n` +
    `Assalamu'alaikum sahabat-sahabat *Successors 43*,\n\n` +
    `Sekadar kabar ukhuwah berkala, seluruh layanan digital angkatan kita—mulai dari *portal website direktori, buku kenangan, hingga bot WhatsApp AI* yang aktif 24 jam ini—operasional hariannya masih menggunakan *dana pribadi developer* (biaya server cloud, domain, dan kuota komputasi AI).\n\n` +
    `Bagi kawan-kawan yang memiliki kelapangan rezeki dan ingin ikut bergotong royong menjaga keberlanjutan sistem mandiri ini agar server tetap stabil melayani kita semua, partisipasi sukarela dapat disalurkan melalui QRIS di atas.\n\n` +
    `Dukungan sahabat sangat berarti demi kelangsungan rumah digital bersama ini. Semoga berkah berlimpah untuk antum sekeluarga. Jazakumullahu khairan katsiran! 🤲✨`
  );
}

/**
 * Pemeriksaan jadwal rutin mingguan (Momen A)
 * Jeda minimal 7 hari (1 minggu), dikirim di waktu santai (Jumat berkah / Malam Minggu)
 */
export async function checkAndTriggerWeeklySystemMaintenance(
  sendFn: (caption: string) => Promise<{ success: boolean }>
): Promise<{ triggered: boolean; reason?: string }> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("site_content")
      .select("content_value")
      .eq("content_key", WEEKLY_MAINTENANCE_KEY)
      .maybeSingle();

    const lastSent = data?.content_value ? Number(data.content_value) : 0;
    const now = Date.now();

    // Wajib jeda minimal 7 hari
    if (now - lastSent < ONE_WEEK_MS) {
      const daysLeft = Math.ceil((ONE_WEEK_MS - (now - lastSent)) / (24 * 60 * 60 * 1000));
      return { triggered: false, reason: `Cooldown aktif (tersisa ${daysLeft} hari).` };
    }

    // Waktu yang pas: Jumat (09.00 - 11.00 WIB) atau Sabtu Malam (20.00 - 21.30 WIB)
    const nowWib = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const day = nowWib.getDay(); // 0 = Minggu, 5 = Jumat, 6 = Sabtu
    const hour = nowWib.getHours();

    const isJumatBerkah = day === 5 && hour >= 9 && hour <= 11;
    const isMalamMinggu = day === 6 && hour >= 20 && hour <= 21;
    // Jika sudah lewat 8 hari (terlewat dari seminggu), izinkan kirim di jam santai siang/sore (10.00 - 21.00 WIB)
    const isOverdue = (now - lastSent > 8 * 24 * 60 * 60 * 1000) && (hour >= 10 && hour <= 21);

    if (!isJumatBerkah && !isMalamMinggu && !isOverdue) {
      return { triggered: false, reason: "Bukan jadwal waktu santai grup." };
    }

    const caption = getWeeklySystemMaintenanceMessage();
    const res = await sendFn(caption);

    if (res.success) {
      await supabase.from("site_content").upsert(
        {
          content_key: WEEKLY_MAINTENANCE_KEY,
          content_value: String(now),
          content_type: "text",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "content_key" }
      );
      return { triggered: true };
    }
  } catch (err: any) {
    return { triggered: false, reason: err.message };
  }
  return { triggered: false };
}

/**
 * Cek apakah struk transfer yang dikirim ditujukan untuk operasional developer / server
 */
export function isDeveloperCoffeeReceipt(ocrText: string, caption?: string): boolean {
  const combined = `${ocrText} ${caption || ""}`.toLowerCase();
  return (
    combined.includes("kopi") ||
    combined.includes("developer") ||
    combined.includes("server") ||
    combined.includes("web") ||
    combined.includes("traktir") ||
    combined.includes("dana pribadi") ||
    combined.includes("id1026582005231")
  );
}

/**
 * Balasan terima kasih dan doa tulus untuk sahabat yang mentransfer dukungan operasional
 */
export function getDeveloperCoffeeThankYou(senderName: string): string {
  const name = senderName || "Sahabat";
  return (
    `Alhamdulillah, jazakumullah khairan katsiran Sahabat *${name}*! ☕🤲\n\n` +
    `Dukungan untuk keberlanjutan server & sistem Expedient 43 sudah diterima dengan penuh rasa syukur.\n\n` +
    `Semoga Allah membalas kebaikan hati antum dengan keberkahan rezeki yang melimpah ruah, kesehatan lahir batin, dan kemudahan dalam setiap langkah ikhtiar. Titip salam hangat untuk keluarga ya sahabat! ✨`
  );
}

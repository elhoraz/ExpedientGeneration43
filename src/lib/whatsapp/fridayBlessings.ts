import { createAdminClient } from "@/lib/supabase/admin";

export interface MahfudzotItem {
  arab: string;
  latin: string;
  arti: string;
  hikmah: string;
}

export const MAHFUDZOT_COLLECTION: MahfudzotItem[] = [
  {
    arab: "مَنْ جَدَّ وَجَدَ",
    latin: "Man jadda wajada",
    arti: "Barangsiapa bersungguh-sungguh, maka ia akan berhasil.",
    hikmah: "Kunci keberhasilan bukan semata pada bakat, melainkan ketekunan dan kesungguhan perjuangan yang tak kenal lelah.",
  },
  {
    arab: "مَنْ صَبَرَ ظَفِرَ",
    latin: "Man shobaro dzhofiro",
    arti: "Barangsiapa bersabar, maka ia akan beruntung.",
    hikmah: "Kesabaran adalah nafas para pejuang. Buah manis kesuksesan hanya dipetik oleh mereka yang kuat menahan getirnya proses.",
  },
  {
    arab: "مَنْ سَارَ عَلَى الدَّرْبِ وَصَلَ",
    latin: "Man saaro 'alad darbi washola",
    arti: "Barangsiapa berjalan pada jalurnya, maka ia akan sampai.",
    hikmah: "Tetaplah melangkah di jalan kebaikan yang benar. Lambat atau cepat, antum pasti akan sampai pada tujuan mulia.",
  },
  {
    arab: "مَنْ قَلَّ صِدْقُهُ قَلَّ صَدِيْقُهُ",
    latin: "Man qolla shidquhu qolla shodiquhu",
    arti: "Barangsiapa sedikit kejujurannya, sedikit pula kawannya.",
    hikmah: "Kejujuran adalah magnet persahabatan sejati. Jagalah integritas dalam bermuamalah dan berteman.",
  },
  {
    arab: "جَالِسْ أَهْلَ الصِّدْقِ وَالوَفَاءِ",
    latin: "Jaalis ahlas shidqi wal wafa'",
    arti: "Bergaullah bersama orang-orang yang jujur dan menepati janji.",
    hikmah: "Lingkungan sahabat yang sholeh akan selalu menjaga arah kompas kebaikan hidup kita.",
  },
  {
    arab: "العَقْلُ السَّلِيمُ فِي الجِسْمِ السَّلِيمِ",
    latin: "Al-'aqlus saliim fil jismis saliim",
    arti: "Akal yang sehat terdapat pada tubuh yang sehat.",
    hikmah: "Jagalah kebugaran raga dan kesehatan fisik agar ibadah, fikiran, dan karya kita senantiasa prima.",
  },
  {
    arab: "خَيْرُ جَلِيسٍ فِي الزَّمَانِ كِتَابٌ",
    latin: "Khoiru jaliisin fiz zamaani kitaabun",
    arti: "Sebaik-baik teman duduk sepanjang waktu adalah buku.",
    hikmah: "Ilmu adalah cahaya yang tak pernah padam. Jadikan membaca dan menuntut ilmu sebagai kebiasaan seumur hidup.",
  },
  {
    arab: "إِجْهَدْ وَلَا تَكْسَلْ وَلَا تَكُ غَافِلًا، فَنَدَامَةُ العُقْبَى لِمَنْ يَتَكَاسَلُ",
    latin: "Ijhad wa laa taksal wa laa taku ghaafilan, fa nadaamatul 'uqbaa liman yatakaasalu",
    arti: "Bersungguh-sungguhlah, jangan malas, dan jangan lengah; karena penyesalan di masa depan hanya milik pemalas.",
    hikmah: "Masa muda adalah waktu menanam benih pengorbanan, bukan waktu membuang kesempatan berharga.",
  },
  {
    arab: "لَا تُؤَخِّرْ عَمَلَكَ إِلَى الغَدِ مَا تَقْدِرُ أَنْ تَعْمَلَهُ اليَوْمَ",
    latin: "Laa tu'akh-khir 'amalaka ilal ghadi maa taqdiru an ta'malahul yawm",
    arti: "Jangan menunda pekerjaanmu hingga esok hari apa yang dapat engkau kerjakan hari ini.",
    hikmah: "Menunda waktu adalah pencuri kesempatan. Selesaikan amanah tepat pada waktunya.",
  },
  {
    arab: "الوَقْتُ أَثْمَنُ مِنَ الذَّهَبِ",
    latin: "Al-waqtu atsmanu minadz dzahabi",
    arti: "Waktu itu jauh lebih berharga daripada emas.",
    hikmah: "Emas yang hilang bisa dibeli kembali, tapi satu detik waktu yang berlalu takkan pernah bisa terulang.",
  },
  {
    arab: "جَرِّبْ وَلَاحِظْ تَكُنْ عَارِفًا",
    latin: "Jarrib wa laahidz takun 'aarifan",
    arti: "Cobalah dan perhatikanlah, niscaya engkau akan menjadi orang yang mengerti.",
    hikmah: "Keberanian mencoba dan merenungi pengalaman adalah guru kehidupan yang paling berharga.",
  },
  {
    arab: "العِلْمُ بِلَا عَمَلٍ كَالشَّجَرِ بِلَا ثَمَرٍ",
    latin: "Al-'ilmu bilaa 'amalin kasy syajari bilaa tsamarin",
    arti: "Ilmu tanpa amal laksana pohon tanpa buah.",
    hikmah: "Bukan seberapa banyak hafalan dan teori kita, tetapi seberapa banyak manfaat nyata yang kita tebarkan bagi sesama.",
  },
];

export const HADITS_COLLECTION = [
  {
    arab: "المُؤْمِنُ لِلْمُؤْمِنِ كَالْبُنْيَانِ يَشُدُّ بَعْضُهُ بَعْضًا",
    arti: "Orang mukmin dengan mukmin lainnya bagaikan satu bangunan yang kokoh, saling menguatkan satu sama lain.",
    riwayat: "HR. Bukhari & Muslim",
    hikmah: "Kekuatan angkatan kita terletak pada persaudaraan yang saling menopang dan menguatkan.",
  },
  {
    arab: "خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ",
    arti: "Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lainnya.",
    riwayat: "HR. Ath-Thabarani",
    hikmah: "Jadikan setiap langkah karir, profesi, dan bisnis kita sebagai wasilah memberi manfaat luas.",
  },
  {
    arab: "طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ",
    arti: "Menuntut ilmu itu wajib atas setiap muslim.",
    riwayat: "HR. Ibnu Majah",
    hikmah: "Proses belajar santri tidak berhenti saat wisuda pondok, melainkan terus hidup sepanjang hayat.",
  },
  {
    arab: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ",
    arti: "Senyum manismu di hadapan saudaramu adalah sedekah bagimu.",
    riwayat: "HR. Tirmidzi",
    hikmah: "Kebaikan paling sederhana namun dahsyat mempererat ukhuwah adalah keramahan dan ketulusan sapaan.",
  },
];

/**
 * Format pesan mutiara Mahfudzot santri
 */
export function getRandomMahfudzotMessage(): string {
  const item = MAHFUDZOT_COLLECTION[Math.floor(Math.random() * MAHFUDZOT_COLLECTION.length)];
  return (
    `📖 *[MUTIARA MAHFUDZOT SANTRI]* 📖\n\n` +
    `🕌 *${item.arab}*\n` +
    `_(${item.latin})_\n\n` +
    `✨ *Artinya*:\n` +
    `"${item.arti}"\n\n` +
    `💡 *Refleksi Hikmah*:\n` +
    `${item.hikmah}\n\n` +
    `_Ketik *!mahfudzot* untuk menyimak mutiara hikmah lainnya._ 🤲`
  );
}

/**
 * Format pesan mutiara Hadits Nabi SAW
 */
export function getRandomHaditsMessage(): string {
  const item = HADITS_COLLECTION[Math.floor(Math.random() * HADITS_COLLECTION.length)];
  return (
    `📜 *[MUTIARA HADITS NABI SAW]* 📜\n\n` +
    `🕌 *${item.arab}*\n\n` +
    `✨ *Artinya*:\n` +
    `"${item.arti}"\n\n` +
    `📚 *${item.riwayat}*\n\n` +
    `💡 *Tadzkiroh Santri*:\n` +
    `${item.hikmah}\n\n` +
    `_Ketik *!hadits* untuk mutiara hadits lainnya._ ✨`
  );
}

/**
 * Format pesan Jum'at Berkah mingguan
 */
export function formatFridayBlessingMessage(): string {
  const mahfudzot = MAHFUDZOT_COLLECTION[Math.floor(Math.random() * MAHFUDZOT_COLLECTION.length)];

  return (
    `🌿✨ *JUM'AT BERKAH - EXPEDIENT GENERATION 43* ✨🌿\n\n` +
    `_Assalamu'alaikum Warahmatullahi Wabarakatuh sahabat seiman & seperjuangan!_\n\n` +
    `Alhamdulillah, Allah SWT mempertemukan kita kembali di Sayyidul Ayyam (Jum'at Berkah). Mari hiasi hari mulia ini dengan amalan sunnah:\n\n` +
    `📖 *1. Membaca Surat Al-Kahfi*\n` +
    `_Penerang cahaya antara dua Jum'at bagi pembacanya._\n\n` +
    `📿 *2. Memperbanyak Sholawat Nabi*\n` +
    `_Allahumma sholli 'ala sayyidina Muhammad wa 'ala ali sayyidina Muhammad._\n\n` +
    `🧼 *3. Mandi Sunnah & Memakai Wewangian*\n` +
    `_Menghidupkan kesegaran sunnah Rasulullah SAW._\n\n` +
    `💰 *4. Sedekah Subuh / Pagi Hari*\n` +
    `_Melapangkan rezeki dan menolak bala._\n\n` +
    `🤲 *5. Berdoa di Waktu Mustajab (Ba'da Ashar)*\n` +
    `_Doakan kebaikan diri, kedua orang tua, guru-guru pondok, dan seluruh kawan angkatan kita._\n\n` +
    `───────────────\n` +
    `💎 *Mutiara Hikmah Hari Ini:*\n` +
    `*${mahfudzot.arab}*\n` +
    `_("${mahfudzot.arti}")_\n\n` +
    `Semoga Allah senantiasa memberkahi ikhtiar dan meluaskan rezeki antum semua. Aamiin ya Rabbal 'Alamin! 🤲✨`
  );
}

let memoryLastFridayWishDate = "";
let isCheckingFridayBlessing = false;

/**
 * Format tanggal YYYY-MM-DD dalam zona waktu Asia/Jakarta (WIB)
 */
export function getWibDateString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Mengecek dan memicu pengiriman pesan Jum'at Berkah otomatis ke grup
 * Berjalan otomatis tepat 1x setiap hari Jum'at pagi (06:30 - 09:30 WIB)
 */
export async function checkAndTriggerFridayBlessing(
  sock: any,
  communityGroupId: string
): Promise<{ triggered: boolean }> {
  if (isCheckingFridayBlessing) {
    return { triggered: false };
  }

  isCheckingFridayBlessing = true;
  try {
    if (!communityGroupId) return { triggered: false };

    const todayDateStr = getWibDateString();

    // 1. In-memory anti-spam guard: jika dalam proses ini sudah kirim hari ini, langsung tolak
    if (memoryLastFridayWishDate === todayDateStr) {
      return { triggered: false };
    }

    const now = new Date();
    const jakartaTimeStr = now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
    const nowWib = new Date(jakartaTimeStr);
    const dayOfWeek = nowWib.getDay(); // 5 = Jumat
    const hour = nowWib.getHours();
    const minute = nowWib.getMinutes();

    // Hanya picu pada hari Jumat antara jam 06:30 s/d 09:30 WIB
    if (dayOfWeek !== 5 || hour < 6 || (hour === 6 && minute < 30) || hour >= 10) {
      return { triggered: false };
    }

    const supabase = createAdminClient();

    // 2. Cek apakah sudah pernah dikirim hari ini via Supabase (kolom content_key & content_value)
    const { data: record, error: fetchErr } = await supabase
      .from("site_content")
      .select("content_value")
      .eq("content_key", "wa_last_friday_wish_date")
      .maybeSingle();

    if (!fetchErr && record?.content_value === todayDateStr) {
      memoryLastFridayWishDate = todayDateStr;
      return { triggered: false };
    }

    // Pasang guard in-memory sebelum kirim agar asynchronous concurrent loop tidak lolos
    memoryLastFridayWishDate = todayDateStr;

    // Kirim pesan Jum'at Berkah ke grup komunitas
    const msg = formatFridayBlessingMessage();
    await sock.sendMessage(communityGroupId, { text: msg });

    // Tandai status selesai untuk hari ini di database Supabase
    try {
      await supabase.from("site_content").upsert(
        {
          content_key: "wa_last_friday_wish_date",
          content_value: todayDateStr,
          content_type: "text",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "content_key" }
      );
    } catch (saveErr: any) {
      console.warn("[SAVE-FRIDAY-WISH-DATE-WARN]:", saveErr.message);
    }

    return { triggered: true };
  } catch (err: any) {
    console.error("[TRIGGER-FRIDAY-ERR]:", err.message);
    return { triggered: false };
  } finally {
    isCheckingFridayBlessing = false;
  }
}


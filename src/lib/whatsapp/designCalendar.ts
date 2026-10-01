import { createAdminClient } from "@/lib/supabase/admin";

export interface CommemorativeEvent {
  id: string;
  name: string;
  month: number; // 1-12
  day: number; // 1-31
  category: "nasional" | "islam" | "internal";
  description: string;
  suggestedTheme: string;
  colorPalette: string[];
  suggestedKeywords: string;
  feedImageUrl?: string;
  storyImageUrl?: string;
}

/**
 * Daftar Hari Penting Nasional & Hari Besar Islam (Masehi / Hijriah terkonversi)
 */
export const COMMEMORATIVE_EVENTS: CommemorativeEvent[] = [
  // --- Januari ---
  {
    id: "tahun-baru-masehi",
    name: "Tahun Baru Masehi",
    month: 1,
    day: 1,
    category: "nasional",
    description: "Pergantian tahun baru kalender Masehi",
    suggestedTheme: "Optimisme Masa Depan, Glow Neon & Gold Minimalist",
    colorPalette: ["#0F172A", "#F59E0B", "#38BDF8", "#FFFFFF"],
    suggestedKeywords: "new year poster graphic design typography minimalist celebration",
  },
  {
    id: "hari-gizi-nasional",
    name: "Hari Gizi Nasional",
    month: 1,
    day: 25,
    category: "nasional",
    description: "Peringatan kesadaran gizi seimbang untuk bangsa",
    suggestedTheme: "Fresh, Sehat, Organik & Colorful Clean",
    colorPalette: ["#16A34A", "#FACC15", "#EA580C", "#F8FAFC"],
    suggestedKeywords: "healthy nutrition food poster flat vector design",
  },

  // --- Februari / Maret ---
  {
    id: "hari-pers-nasional",
    name: "Hari Pers Nasional (HPN)",
    month: 2,
    day: 9,
    category: "nasional",
    description: "Apresiasi jurnalisme dan keterbukaan informasi bangsa",
    suggestedTheme: "Editorial Vintage, Monokrom Koran Klasik & Bold Serif",
    colorPalette: ["#1C1917", "#78716C", "#D97706", "#FAFAF9"],
    suggestedKeywords: "editorial newspaper vintage poster typography press journalism",
  },
  {
    id: "hari-musik-nasional",
    name: "Hari Musik Nasional",
    month: 3,
    day: 9,
    category: "nasional",
    description: "Peringatan hari lahir WR Soepratman & apresiasi musik tanah air",
    suggestedTheme: "Vibrant Retro, Gelombang Audio & Ilustrasi Alat Musik",
    colorPalette: ["#6366F1", "#EC4899", "#8B5CF6", "#0F172A"],
    suggestedKeywords: "music day poster waves instruments retro typography",
  },

  // --- April / Mei ---
  {
    id: "hari-kartini",
    name: "Hari Kartini",
    month: 4,
    day: 21,
    category: "nasional",
    description: "Emansipasi wanita Indonesia & perjuangan RA Kartini",
    suggestedTheme: "Elegan Nusantara, Ornamen Batik Halus, Nuansa Anggun & Tegas",
    colorPalette: ["#831843", "#BE185D", "#FDE047", "#FFF1F2"],
    suggestedKeywords: "kartini day poster indonesia women empowerment batik floral",
  },
  {
    id: "hari-bumi",
    name: "Hari Bumi Sedunia",
    month: 4,
    day: 22,
    category: "nasional",
    description: "Kepedulian kelestarian lingkungan dan bumi",
    suggestedTheme: "Eco-Futuristic, Alam Hijau Emerald & Biru Laut Dalam",
    colorPalette: ["#065F46", "#059669", "#0284C7", "#ECFDF5"],
    suggestedKeywords: "earth day environmental save earth poster illustration",
  },
  {
    id: "hari-buruh",
    name: "Hari Buruh Internasional (May Day)",
    month: 5,
    day: 1,
    category: "nasional",
    description: "Apresiasi dedikasi para pekerja dan buruh",
    suggestedTheme: "Solidaritas Heroik, Ilustrasi Siluet Tegas & Typography Industrial",
    colorPalette: ["#B91C1C", "#1E293B", "#F59E0B", "#F8FAFC"],
    suggestedKeywords: "labor day may day poster industrial typography strength",
  },
  {
    id: "hardiknas",
    name: "Hari Pendidikan Nasional (Hardiknas)",
    month: 5,
    day: 2,
    category: "nasional",
    description: "Semangat Ki Hajar Dewantara: Tut Wuri Handayani",
    suggestedTheme: "Inspiratif & Akademis, Buku Terbuka, Obor Ilmu & Modern Clean",
    colorPalette: ["#1E40AF", "#3B82F6", "#F59E0B", "#EFF6FF"],
    suggestedKeywords: "education day indonesia hardiknas poster books learning future",
  },
  {
    id: "harkitnas",
    name: "Hari Kebangkitan Nasional (Harkitnas)",
    month: 5,
    day: 20,
    category: "nasional",
    description: "Lahirnya Boedi Oetomo dan persatuan bangsa",
    suggestedTheme: "Semangat Merah Putih, Dinamis & Siluet Pemuda Bangkit",
    colorPalette: ["#DC2626", "#991B1B", "#FACC15", "#FFFFFF"],
    suggestedKeywords: "national awakening day indonesia hero poster dynamic",
  },

  // --- Juni / Juli / Agustus ---
  {
    id: "hari-lahir-pancasila",
    name: "Hari Lahir Pancasila",
    month: 6,
    day: 1,
    category: "nasional",
    description: "Pondasi dasar negara Indonesia: Bhinneka Tunggal Ika",
    suggestedTheme: "Garuda Emas Gagah, Perisai 5 Sila & Nuansa Kenegaraan Megah",
    colorPalette: ["#B45309", "#D97706", "#991B1B", "#FEF3C7"],
    suggestedKeywords: "pancasila day indonesia garuda gold majestic poster typography",
  },
  {
    id: "hari-anak-nasional",
    name: "Hari Anak Nasional",
    month: 7,
    day: 23,
    category: "nasional",
    description: "Perlindungan dan masa depan ceria anak-anak Indonesia",
    suggestedTheme: "Playful Pastel, Karakter Kartun Hangat & Fun Vibes",
    colorPalette: ["#F43F5E", "#38BDF8", "#FBBF24", "#FEF9C3"],
    suggestedKeywords: "national children day playful pastel poster design vector",
  },
  {
    id: "hut-ri",
    name: "Hari Kemerdekaan RI (HUT RI)",
    month: 8,
    day: 17,
    category: "nasional",
    description: "Hari Kemerdekaan Republik Indonesia 17 Agustus 1945",
    suggestedTheme: "Patriotik Merah Putih, Ornamen Perjuangan, Emas & Modern Bold",
    colorPalette: ["#DC2626", "#FFFFFF", "#991B1B", "#F59E0B"],
    suggestedKeywords: "indonesia independence day 17 agustus poster typography red white",
  },

  // --- September / Oktober ---
  {
    id: "g30s-pki",
    name: "Peringatan Peristiwa G30S/PKI",
    month: 9,
    day: 30,
    category: "nasional",
    description: "Mengenang jasa dan pengorbanan para Pahlawan Revolusi",
    suggestedTheme: "Dark Heroic, Khidmat, Monokrom Charcoal, Siluet Lubang Buaya & Merah Gelap",
    colorPalette: ["#09090B", "#27272A", "#7F1D1D", "#E4E4E7"],
    suggestedKeywords: "g30s pki pahlawan revolusi tribute dark dramatic memorial poster",
    feedImageUrl: "https://expedientgeneration.vercel.app/images/posters/g30s_pki_feed.jpg",
    storyImageUrl: "https://expedientgeneration.vercel.app/images/posters/g30s_pki_story.jpg",
  },
  {
    id: "kesaktian-pancasila",
    name: "Hari Kesaktian Pancasila",
    month: 10,
    day: 1,
    category: "nasional",
    description: "Keteguhan Pancasila sebagai ideologi pemersatu bangsa",
    suggestedTheme: "Garuda Emas Kokoh, Cahaya Fajar Bangsa & Nuansa Patriotik Berwibawa",
    colorPalette: ["#78350F", "#B45309", "#1E293B", "#FFFBEB"],
    suggestedKeywords: "hari kesaktian pancasila garuda emas poster design dignity indonesia",
    feedImageUrl: "https://expedientgeneration.vercel.app/images/posters/kesaktian_pancasila_feed.jpg",
    storyImageUrl: "https://expedientgeneration.vercel.app/images/posters/kesaktian_pancasila_story.jpg",
  },
  {
    id: "hari-batik-nasional",
    name: "Hari Batik Nasional",
    month: 10,
    day: 2,
    category: "nasional",
    description: "Warisan budaya takbenda UNESCO kebanggaan Indonesia",
    suggestedTheme: "Motif Batik Parang/Kawung Elegan, Nuansa Cokelat Sogan & Emas Tradisional",
    colorPalette: ["#451A03", "#78350F", "#B45309", "#FEF3C7"],
    suggestedKeywords: "national batik day indonesia pattern textile traditional aesthetic poster",
  },
  {
    id: "hari-tni",
    name: "Hari Ulang Tahun TNI",
    month: 10,
    day: 5,
    category: "nasional",
    description: "Tentara Nasional Indonesia pengawal kedaulatan NKRI",
    suggestedTheme: "Military Camo Modern, Gagah, Siluet Matra Darat Laut Udara",
    colorPalette: ["#14532D", "#1E3A1E", "#78716C", "#F0FDF4"],
    suggestedKeywords: "military armed forces tni indonesia bold poster typography",
  },
  {
    id: "hari-santri-nasional",
    name: "Hari Santri Nasional (HSN)",
    month: 10,
    day: 22,
    category: "islam",
    description: "Resolusi Jihad 1945 & peran sentral pesantren dalam menjaga NKRI",
    suggestedTheme: "Santri Pesantren Megah, Hijau Botol Arrisalah, Ornamen Sarung/Peci & Kaligrafi Tegas",
    colorPalette: ["#064E3B", "#047857", "#D97706", "#ECFDF5"],
    suggestedKeywords: "hari santri nasional pesantren sarung peci islamic poster indonesia",
  },
  {
    id: "sumpah-pemuda",
    name: "Hari Sumpah Pemuda",
    month: 10,
    day: 28,
    category: "nasional",
    description: "Satu Nusa, Satu Bangsa, Satu Bahasa Indonesia 1928",
    suggestedTheme: "Energi Muda Membara, Typographic Explosion, Merah Putih & Siluet Pemuda",
    colorPalette: ["#DC2626", "#B91C1C", "#1E293B", "#FEF2F2"],
    suggestedKeywords: "sumpah pemuda 28 oktober youth movement indonesia dynamic poster typography",
  },

  // --- November / Desember ---
  {
    id: "hari-pahlawan",
    name: "Hari Pahlawan Nasional",
    month: 11,
    day: 10,
    category: "nasional",
    description: "Mengenang Pertempuran Surabaya 10 November 1945 Bung Tomo",
    suggestedTheme: "Vintage Sepia Heroik, Kobaran Api Perjuangan & Tipografi Pekik Merdeka",
    colorPalette: ["#7C2D12", "#9A3412", "#D97706", "#FEF3C7"],
    suggestedKeywords: "hari pahlawan 10 november heroes day vintage sepia grunge heroic poster",
  },
  {
    id: "hari-ayah-nasional",
    name: "Hari Ayah Nasional",
    month: 11,
    day: 12,
    category: "nasional",
    description: "Apresiasi sosok ayah dan keteladanan kepala keluarga",
    suggestedTheme: "Warm Heartfelt, Siluet Ayah & Anak, Navy Blue & Hangat",
    colorPalette: ["#1E3A8A", "#1E293B", "#F59E0B", "#EFF6FF"],
    suggestedKeywords: "fathers day silhouete warm family poster illustration",
  },
  {
    id: "hari-guru-nasional",
    name: "Hari Guru Nasional",
    month: 11,
    day: 25,
    category: "nasional",
    description: "Pahlawan tanpa tanda jasa & pendidik generasi bangsa",
    suggestedTheme: "Pelita Ilmu, Hangat, Buku Klasik, Papan Tulis Chalkboard & Emas",
    colorPalette: ["#1F2937", "#059669", "#D97706", "#F9FAFB"],
    suggestedKeywords: "teachers day national chalkboard book light wisdom poster",
  },
  {
    id: "hari-ibu-nasional",
    name: "Hari Ibu Nasional",
    month: 12,
    day: 22,
    category: "nasional",
    description: "Kasih sayang ibu tiada tara & peran agung wanita bangsa",
    suggestedTheme: "Soft Floral Pastel, Sentuhan Lembut Mawar & Doa Kasih Ibu",
    colorPalette: ["#9D174D", "#F472B6", "#FBBF24", "#FDF2F8"],
    suggestedKeywords: "mothers day floral elegant soft pink loving mother poster",
  },

  // --- Hari-hari Besar Islam Utama (Kalender Islam / Hijriah) ---
  {
    id: "maulid-nabi",
    name: "Maulid Nabi Muhammad SAW",
    month: 9,
    day: 15, // Kisaran umum rabiul awwal
    category: "islam",
    description: "Kelahiran Baginda Nabi Muhammad SAW rahmatan lil 'alamin",
    suggestedTheme: "Islamic Majestic, Kaligrafi Emas, Ornamen Masjid Nabawi & Hijau Zamrud",
    colorPalette: ["#064E3B", "#065F46", "#F59E0B", "#F0FDF4"],
    suggestedKeywords: "maulid nabi muhammad saw islamic calligraphy gold green emerald poster",
  },
  {
    id: "isra-miraj",
    name: "Peringatan Isra Mi'raj",
    month: 2,
    day: 27, // Kisaran 27 Rajab
    category: "islam",
    description: "Perjalanan agung Rasulullah SAW menjemput perintah Shalat 5 waktu",
    suggestedTheme: "Night Sky Galactic, Buraq Light, Ornamen Kubah Masjid & Deep Midnight Blue",
    colorPalette: ["#020617", "#1E1B4B", "#38BDF8", "#F8FAFC"],
    suggestedKeywords: "isra miraj night sky galaxy mosque dome light islamic poster",
  },
  {
    id: "awal-ramadhan",
    name: "Menyambut Awal Puasa Ramadhan",
    month: 3,
    day: 1, // Kisaran 1 Ramadhan
    category: "islam",
    description: "Marhaban ya Ramadhan bulan suci penuh berkah dan ampunan",
    suggestedTheme: "Lentera Fanous Ramadhan, Bulan Sabit Emas & Gradasi Ungu Senja",
    colorPalette: ["#312E81", "#4338CA", "#F59E0B", "#EEF2FF"],
    suggestedKeywords: "marhaban ya ramadan lantern crescent moon gold islamic poster",
  },
  {
    id: "nuzulul-quran",
    name: "Malam Nuzulul Qur'an (17 Ramadhan)",
    month: 3,
    day: 17,
    category: "islam",
    description: "Turunnya wahyu pertama Al-Qur'an surat Al-'Alaq",
    suggestedTheme: "Mushaf Al-Qur'an Bercahaya, Ornamen Geometris Islami & Gold Navy",
    colorPalette: ["#0F172A", "#1E3A8A", "#D97706", "#F8FAFC"],
    suggestedKeywords: "nuzulul quran mushaf holy quran light ray geometric islamic poster",
  },
  {
    id: "idul-fitri",
    name: "Hari Raya Idul Fitri 1 Syawal",
    month: 4,
    day: 1, // Kisaran 1 Syawal
    category: "islam",
    description: "Taqabbalallahu minna wa minkum, hari kemenangan dan silaturahmi",
    suggestedTheme: "Ketupat Modern, Ornamen Daun Palma Hijau, Emas Berkilau & Suci Putih",
    colorPalette: ["#047857", "#10B981", "#F59E0B", "#FFFFFF"],
    suggestedKeywords: "eid al fitr ketupat green gold festive islamic poster design",
  },
  {
    id: "idul-adha",
    name: "Hari Raya Idul Adha (Hari Raya Qurban)",
    month: 6,
    day: 10, // Kisaran 10 Dzulhijjah
    category: "islam",
    description: "Keteladanan Nabi Ibrahim AS & semangat berkurban bagi sesama",
    suggestedTheme: "Siluet Qurban, Padang Arafah/Ka'bah & Nuansa Gurun Pasir Hangat",
    colorPalette: ["#78350F", "#B45309", "#065F46", "#FEF3C7"],
    suggestedKeywords: "eid al adha qurban sacrifice kabah islamic poster typography",
  },
  {
    id: "tahun-baru-islam",
    name: "Tahun Baru Islam (1 Muharram)",
    month: 7,
    day: 1, // Kisaran 1 Muharram
    category: "islam",
    description: "Hijrah peradaban menuju kebaikan dan keberkahan hidup",
    suggestedTheme: "Spiritual Clean, Kaligrafi Hijriyah, Ornamen Bintang Delapan & Emas Gelap",
    colorPalette: ["#14532D", "#15803D", "#D97706", "#F0FDF4"],
    suggestedKeywords: "islamic new year 1 muharram hijriyah calligraphy minimalist poster",
  },
];

export interface UpcomingItem {
  type: "event" | "birthday";
  title: string;
  category: string;
  dateStr: string;
  daysLeft: number; // 0 = Hari ini, 1 = Besok, 3 = H-3, etc.
  description: string;
  colorPalette: string[];
  suggestedTheme: string;
  pinterestUrl: string;
  googleImagesUrl: string;
  feedImageUrl?: string;
  storyImageUrl?: string;
  extraData?: {
    alumniId?: string;
    fullName?: string;
    nickname?: string;
    profileUrl?: string;
    avatarUrl?: string;
    age?: number;
  };
}

/**
 * Mengambil daftar event penting (Nasional & Islam) dan Ulang Tahun dalam rentang N hari ke depan
 */
export async function getUpcomingDesignCalendar(daysAhead: number = 7): Promise<UpcomingItem[]> {
  const nowWib = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const results: UpcomingItem[] = [];

  // 1. Cek Hari Peringatan Nasional & Islam
  for (const event of COMMEMORATIVE_EVENTS) {
    const currentYear = nowWib.getFullYear();
    let eventDate = new Date(currentYear, event.month - 1, event.day);

    // Hitung selisih hari
    const diffTime = eventDate.getTime() - new Date(currentYear, nowWib.getMonth(), nowWib.getDate()).getTime();
    let diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= daysAhead) {
      const pinQuery = encodeURIComponent(`${event.suggestedKeywords} pinterest`);
      const gQuery = encodeURIComponent(`poster ${event.name} desain grafis`);

      results.push({
        type: "event",
        title: event.name,
        category: event.category === "islam" ? "Hari Besar Islam" : "Hari Nasional",
        dateStr: `${event.day} ${getMonthNameId(event.month)}`,
        daysLeft: diffDays,
        description: event.description,
        colorPalette: event.colorPalette,
        suggestedTheme: event.suggestedTheme,
        pinterestUrl: `https://www.pinterest.com/search/pins/?q=${pinQuery}`,
        googleImagesUrl: `https://www.google.com/search?tbm=isch&q=${gQuery}`,
        feedImageUrl: event.feedImageUrl,
        storyImageUrl: event.storyImageUrl,
      });
    }
  }

  // 2. Cek Ulang Tahun Sahabat Alumni dari Supabase
  try {
    const supabase = createAdminClient();
    const { data: users, error: dbErr } = await supabase
      .from("profiles")
      .select("id, nama_panggilan, nama_lengkap, no_whatsapp, tanggal_lahir, foto_profil")
      .eq("is_active", true);

    if (dbErr) {
      console.warn("[DESIGN-CALENDAR-BDAY-DB-ERR]:", dbErr.message);
    }

    if (users && users.length > 0) {
      const currentYear = nowWib.getFullYear();
      const todayDate = new Date(currentYear, nowWib.getMonth(), nowWib.getDate());

      for (const u of users) {
        if (!u.tanggal_lahir) continue;
        const parts = u.tanggal_lahir.split(/[-/]/);
        if (parts.length < 3) continue;

        let birthYear = parseInt(parts[0], 10);
        let birthMonth = parseInt(parts[1], 10);
        let birthDay = parseInt(parts[2], 10);
        if (parts[2].length === 4) {
          birthYear = parseInt(parts[2], 10);
          birthMonth = parseInt(parts[1], 10);
          birthDay = parseInt(parts[0], 10);
        }

        if (!birthMonth || !birthDay) continue;

        let bdayTargetYear = currentYear;
        let bdayDate = new Date(bdayTargetYear, birthMonth - 1, birthDay);
        let diffTime = bdayDate.getTime() - todayDate.getTime();
        let diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        // Jika ulang tahun tahun ini sudah terlewat, hitung untuk tahun depan
        if (diffDays < 0) {
          bdayTargetYear = currentYear + 1;
          bdayDate = new Date(bdayTargetYear, birthMonth - 1, birthDay);
          diffTime = bdayDate.getTime() - todayDate.getTime();
          diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        }

        if (diffDays >= 0 && diffDays <= daysAhead) {
          const rawAge = bdayTargetYear - birthYear;
          const nick = (u.nama_panggilan || u.nama_lengkap.split(" ")[0]).trim();
          const pinQuery = encodeURIComponent("birthday poster graphic design minimalist typography luxury");
          const gQuery = encodeURIComponent(`desain poster ucapan ulang tahun sahabat islami`);

          results.push({
            type: "birthday",
            title: `Milad Sahabat ${nick} (ke-${rawAge} Th)`,
            category: "Ulang Tahun Sahabat",
            dateStr: `${birthDay} ${getMonthNameId(birthMonth)}`,
            daysLeft: diffDays,
            description: `Ulang tahun Sahabat ${u.nama_lengkap} (${nick}) ke-${rawAge} tahun`,
            colorPalette: ["#0F172A", "#D97706", "#F59E0B", "#FFFFFF"],
            suggestedTheme: "Modern Gold & Navy Elegance, Foto Personal Clean & Typography Islami",
            pinterestUrl: `https://www.pinterest.com/search/pins/?q=${pinQuery}`,
            googleImagesUrl: `https://www.google.com/search?tbm=isch&q=${gQuery}`,
            extraData: {
              alumniId: u.id,
              fullName: u.nama_lengkap,
              nickname: nick,
              profileUrl: `https://expedientgeneration.vercel.app/dossier/${u.id}`,
              avatarUrl: u.foto_profil || `https://expedientgeneration.vercel.app/images/default-avatar.webp`,
              age: rawAge,
            },
          });
        }
      }
    }
  } catch (err: any) {
    console.warn("[DESIGN-CALENDAR-BDAY-WARN]:", err.message);
  }

  // Sort berdasarkan hari terdekat (Hari-H -> H-1 -> H-2 -> ...)
  results.sort((a, b) => a.daysLeft - b.daysLeft);
  return results;
}

function getMonthNameId(m: number): string {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  return months[m - 1] || "";
}

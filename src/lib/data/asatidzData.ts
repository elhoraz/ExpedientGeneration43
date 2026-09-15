/**
 * asatidzData.ts - Direktori Kehormatan Dewan Guru & Asatidz (Yearbook Edition)
 * Expedient Generation 43 - Pondok Modern Arrisalah
 * 
 * Silakan lengkapi atau ubah daftar ini sesuai data buku tahunan.
 * Foto disimpan di folder: /uploads/asatidz/[nama-file]
 */

export type AsatidzCategory = "pimpinan" | "walikelas" | "guru";

export interface AsatidzItem {
  id: string;
  name: string;
  titleHonorific?: string;
  role: string;
  category: AsatidzCategory;
  classAssigned?: string; // e.g. "6A", "6B", "6C", "6D"
  subject?: string;       // Mata pelajaran / amanah pengajaran
  photoUrl?: string;      // Contoh: "/uploads/asatidz/guru_1.webp"
  quote?: string;         // Pesan/Petuah Mutiara dari Buku Tahunan
  isRahimahullah?: boolean; // Tanda pita rahmatullah jika telah berpulang
  notes?: string;
}

export const ASATIDZ_ITEMS: AsatidzItem[] = [
  // ============================================================================
  // 1. PIMPINAN & MASYAYIKH PONDOK
  // ============================================================================
  {
    id: "pimpinan_1",
    name: "K.H. Muhammad Chozin, S.Ag.",
    titleHonorific: "K.H.",
    role: "Pimpinan Pondok Pesantren",
    category: "pimpinan",
    subject: "Tarbiyah Islamiyah & Tauhid",
    photoUrl: "/uploads/asatidz/kh_chozin.webp",
    quote: "Jadilah kader umat yang senantiasa ikhlas berjuang, berdikari di atas kaki sendiri, dan tidak menggantungkan hidup kepada selain Allah SWT.",
    isRahimahullah: false,
    notes: "Pengasuh Pondok Modern Arrisalah",
  },
  {
    id: "pimpinan_2",
    name: "Ustadz H. Ahmad Fauzi, M.Pd.I.",
    titleHonorific: "Ustadz",
    role: "Direktur KMI (Kulliyatul Mu'allimin Al-Islamiyyah)",
    category: "pimpinan",
    subject: "Ushul Fiqih & Metodologi Pengajaran",
    photoUrl: "/uploads/asatidz/ust_fauzi.webp",
    quote: "Nilai pondok tidak terletak pada megahnya dinding bangunan, melainkan pada keikhlasan ruh guru dan ketaatan santri dalam menuntut ilmu.",
    isRahimahullah: false,
  },
  {
    id: "pimpinan_3",
    name: "Ustadz H. Rahmat Hidayat, Lc., M.A.",
    titleHonorific: "Ustadz",
    role: "Kepala Pengasuhan Santri",
    category: "pimpinan",
    subject: "Dirasah Islamiyah & Akhlaq",
    photoUrl: "/uploads/asatidz/ust_rahmat.webp",
    quote: "Karakter dan disiplin adalah mahkota sejati seorang santri. Di mana pun kalian berada, jagalah nama baik almamater.",
    isRahimahullah: false,
  },

  // ============================================================================
  // 2. WALI KELAS & PEMBIMBING ANGKATAN EXPEDIENT 43
  // ============================================================================
  {
    id: "wali_6a",
    name: "Ustadz Abdullah Shodiq, S.Pd.I.",
    titleHonorific: "Ustadz",
    role: "Wali Kelas 6A",
    category: "walikelas",
    classAssigned: "6A",
    subject: "Bahasa Arab & Balaghah",
    photoUrl: "/uploads/asatidz/ust_shodiq.webp",
    quote: "Setiap tetes keringat perjuangan kalian di kelas ini kelak akan menjadi saksi keberhasilan dakwah kalian di masyarakat luas.",
    isRahimahullah: false,
  },
  {
    id: "wali_6b",
    name: "Ustadz M. Rizky Maulana, S.H.",
    titleHonorific: "Ustadz",
    role: "Wali Kelas 6B",
    category: "walikelas",
    classAssigned: "6B",
    subject: "Fiqih Muamalah & Perbandingan Madzhab",
    photoUrl: "/uploads/asatidz/ust_rizky.webp",
    quote: "Ilmu tanpa amal laksana pohon tanpa buah. Amalkan ilmumu walau hanya satu huruf.",
    isRahimahullah: false,
  },
  {
    id: "wali_6c",
    name: "Ustadzah Siti Fatimah, S.Pd.",
    titleHonorific: "Ustadzah",
    role: "Wali Kelas 6C",
    category: "walikelas",
    classAssigned: "6C",
    subject: "Ulumul Qur'an & Hadits",
    photoUrl: "/uploads/asatidz/ust_fatimah.webp",
    quote: "Jadilah wanita shalihah penyejuk umat, kokoh dalam aqidah dan anggun dalam budi pekerti.",
    isRahimahullah: false,
  },
  {
    id: "wali_6d",
    name: "Ustadzah Nurul Hidayati, M.A.",
    titleHonorific: "Ustadzah",
    role: "Wali Kelas 6D",
    category: "walikelas",
    classAssigned: "6D",
    subject: "Bahasa Inggris & Public Speaking",
    photoUrl: "/uploads/asatidz/ust_nurul.webp",
    quote: "Dunia menanti kontribusi nyata kalian. Bicara dengan hikmah, melangkah dengan keyakinan.",
    isRahimahullah: false,
  },

  // ============================================================================
  // 3. DEWAN GURU & ASATIDZ PENGAJAR
  // ============================================================================
  {
    id: "guru_1",
    name: "Ustadz M. Zainuddin, Lc.",
    titleHonorific: "Ustadz",
    role: "Guru Fiqih & Faraidh",
    category: "guru",
    subject: "Fiqih & Faraidh",
    photoUrl: "/uploads/asatidz/ust_zainuddin.webp",
    quote: "Keberkahan ilmu diperoleh dari ketundukan hati dan ta'zhim kepada guru serta orang tua.",
    isRahimahullah: false,
  },
  {
    id: "guru_2",
    name: "Ustadz Lukman Hakim, M.Pd.",
    titleHonorific: "Ustadz",
    role: "Guru Bahasa Arab & Nahwu",
    category: "guru",
    subject: "Nahwu, Sharaf & Muthala'ah",
    photoUrl: "/uploads/asatidz/ust_lukman.webp",
    quote: "Bahasa Arab adalah kunci memahami kalamullah dan hadits Rasulullah. Cintailah bahasa Al-Qur'an.",
    isRahimahullah: false,
  },
  {
    id: "guru_3",
    name: "Ustadz Dr. H. Burhanuddin, M.A.",
    titleHonorific: "Ustadz",
    role: "Guru Tarikh Islam & Sirah Nabawiyah",
    category: "guru",
    subject: "Tarikh Islam & Khulafaur Rasyidin",
    photoUrl: "/uploads/asatidz/ust_burhanuddin.webp",
    quote: "Sejarah bukan hanya cerita masa lalu, melainkan lentera penunjuk arah untuk menaklukkan masa depan.",
    isRahimahullah: false,
  },
  {
    id: "guru_4",
    name: "Ustadz Aris Munandar, S.T.",
    titleHonorific: "Ustadz",
    role: "Guru Matematika & Sains Modern",
    category: "guru",
    subject: "Matematika & IPA Terpadu",
    photoUrl: "/uploads/asatidz/ust_aris.webp",
    quote: "Satukan akal dan iman. Jadilah santri yang menguasai sains tanpa kehilangan kekhusyukan sujud.",
    isRahimahullah: false,
  },
  {
    id: "guru_5",
    name: "Ustadzah Maryam Jamilah, S.Ag.",
    titleHonorific: "Ustadzah",
    role: "Guru Tajwid & Tahfizhul Qur'an",
    category: "guru",
    subject: "Tahfizh & Qira'ah",
    photoUrl: "/uploads/asatidz/ust_maryam.webp",
    quote: "Jagalah Al-Qur'an dalam dadamu, maka Al-Qur'an akan menjagamu sepanjang perjalanan usiamu.",
    isRahimahullah: false,
  },
];

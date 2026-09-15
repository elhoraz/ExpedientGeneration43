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
  // 3. DEWAN GURU & ASATIDZ PENGAJAR (Arsip Buku Tahunan)
  // ============================================================================
  {
    id: "guru_sujono",
    name: "Al-Ustadz Sujono",
    titleHonorific: "Al-Ustadz",
    role: "Guru Mustholahul Hadist",
    category: "guru",
    subject: "Mustholahul Hadist",
    photoUrl: "/uploads/asatidz/ust-sujono.jpg",
    quote: "Memahami sanad dan matan hadits adalah jalan menjaga kemurnian dan keotentikan sabda Rasulullah SAW.",
    isRahimahullah: false,
  },
  {
    id: "guru_wuhin_abdullah",
    name: "Al-Ustadz Wuhin Abdullah",
    titleHonorific: "Al-Ustadz",
    role: "Guru Al-Fiqh",
    category: "guru",
    subject: "Al-Fiqh",
    photoUrl: "/uploads/asatidz/ust-wuhin-abdullah.jpg",
    quote: "Fiqih mengajarkan kelapangan dada dan kehati-hatian dalam setiap langkah ibadah serta muamalah.",
    isRahimahullah: false,
  },
  {
    id: "guru_suradi",
    name: "Al-Ustadz Suradi",
    titleHonorific: "Al-Ustadz",
    role: "Guru Composition (Insya')",
    category: "guru",
    subject: "Composition",
    photoUrl: "/uploads/asatidz/ust-suradi.jpg",
    quote: "Goreskan tintamu untuk kebaikan. Tulisan yang ditulis dengan keikhlasan akan abadi melintasi zaman.",
    isRahimahullah: false,
  },
  {
    id: "guru_kaulan",
    name: "Al-Ustadz Kaulan",
    titleHonorific: "Al-Ustadz",
    role: "Guru Constitution (Tata Negara)",
    category: "guru",
    subject: "Constitution",
    photoUrl: "/uploads/asatidz/ust-kaulan.jpg",
    quote: "Ketertiban, disiplin, dan kepemimpinan yang adil adalah pondasi kokoh tegaknya martabat umat.",
    isRahimahullah: false,
  },
  {
    id: "guru_fahmi_chatib",
    name: "Al-Ustadz Fahmi Chatib",
    titleHonorific: "Al-Ustadz",
    role: "Guru Akuntansi",
    category: "guru",
    subject: "Akuntansi",
    photoUrl: "/uploads/asatidz/ust-fahmi-chatib.jpg",
    quote: "Kejujuran dan ketelitian dalam perhitungan duniawi adalah cerminan kesiapan hisab di akhirat kelak.",
    isRahimahullah: false,
  },
  {
    id: "guru_mada_indarta",
    name: "Al-Ustadz Mada Indarta",
    titleHonorific: "Al-Ustadz",
    role: "Guru Reading (Muthala'ah)",
    category: "guru",
    subject: "Reading",
    photoUrl: "/uploads/asatidz/ust-mada-indarta.jpg",
    quote: "Membaca adalah kunci peradaban dan gerbang pembuka cakrawala ilmu pengetahuan yang tanpa batas.",
    isRahimahullah: false,
  },
  {
    id: "guru_imam_fathurrohaman",
    name: "Al-Ustadz Imam Fathurrohaman",
    titleHonorific: "Al-Ustadz",
    role: "Guru Al-Hadist",
    category: "guru",
    subject: "Al-Hadist",
    photoUrl: "/uploads/asatidz/ust-imam-fathurrohaman.jpg",
    quote: "Jadikan akhlaq dan sunnah Rasulullah SAW sebagai kompas petunjuk dalam setiap langkah kehidupanmu.",
    isRahimahullah: false,
  },
  {
    id: "guru_syamsudi_arifin",
    name: "Al-Ustadz Syamsudi Arifin",
    titleHonorific: "Al-Ustadz",
    role: "Guru Bahasa Indonesia",
    category: "guru",
    subject: "Bahasa Indonesia",
    photoUrl: "/uploads/asatidz/ust-syamsudi-arifin.jpg",
    quote: "Bahasa adalah cermin kepribadian budi pekerti. Rawatlah tutur kata santun dalam bergaul dan berdakwah.",
    isRahimahullah: false,
  },
];

/**
 * alhufazData.ts
 * Data & Logika Pembagian 5 Blok Warna Mushaf Al-Hufaz Cordoba
 * Serta metadata pendukung: Motivasi, Tema Ayat, Kotak Kontrol, dan Tabel Muraja'ah
 */

export interface AlhufazColorBlockConfig {
  id: number;
  name: string;
  colorName: string;
  colorHex: string;
  lightBg: string;
  darkBg: string;
  borderColor: string;
  badgeBg: string;
}

export const ALHUFAZ_COLOR_BLOCKS: AlhufazColorBlockConfig[] = [
  {
    id: 1,
    name: "Blok Kuning",
    colorName: "Kuning",
    colorHex: "#ca8a04",
    lightBg: "#fef9c3",
    darkBg: "rgba(234, 179, 8, 0.18)",
    borderColor: "#eab308",
    badgeBg: "rgba(234, 179, 8, 0.25)",
  },
  {
    id: 2,
    name: "Blok Hijau",
    colorName: "Hijau",
    colorHex: "#16a34a",
    lightBg: "#dcfce7",
    darkBg: "rgba(22, 163, 74, 0.18)",
    borderColor: "#22c55e",
    badgeBg: "rgba(22, 163, 74, 0.25)",
  },
  {
    id: 3,
    name: "Blok Biru",
    colorName: "Biru",
    colorHex: "#0284c7",
    lightBg: "#e0f2fe",
    darkBg: "rgba(2, 132, 199, 0.18)",
    borderColor: "#38bdf8",
    badgeBg: "rgba(2, 132, 199, 0.25)",
  },
  {
    id: 4,
    name: "Blok Pink",
    colorName: "Pink",
    colorHex: "#e11d48",
    lightBg: "#fce7f3",
    darkBg: "rgba(225, 29, 72, 0.18)",
    borderColor: "#fb7185",
    badgeBg: "rgba(225, 29, 72, 0.25)",
  },
  {
    id: 5,
    name: "Blok Krem",
    colorName: "Krem / Oranye",
    colorHex: "#ea580c",
    lightBg: "#ffedd5",
    darkBg: "rgba(234, 88, 12, 0.18)",
    borderColor: "#fb923c",
    badgeBg: "rgba(234, 88, 12, 0.25)",
  },
];

export const ALHUFAZ_MOTIVASI_LIST = [
  "Semua dengan pertolongan Allah SWT, kita mampu menghafal Al-Qur'an, maka mintalah selalu kepada-Nya.",
  "Menghafal Al-Qur'an adalah menanam mahkota kemuliaan bertabur cahaya untuk kedua orang tua di surga kelak.",
  "Lelahnya proses menghafal akan berangsur sirna, namun kemuliaan dan manisnya kalamullah akan abadi di sanubari.",
  "Kunci utama kelancaran (mutqin) bukanlah kecerdasan otak semata, melainkan keistiqamahan mengulang (tikrar) dan kebersihan hati.",
  "Jadikan setiap huruf Al-Qur'an sebagai sahabat setia yang menenteramkan jiwa di kala sunyi dan penerang di alam kubur.",
  "Jangan pernah menyerah ketika hafalan terasa berat, karena setiap huruf yang diulang berulang kali dilipatgandakan pahalanya oleh Allah SWT.",
  "Al-Qur'an itu sangat mudah dihafal bagi siapa saja yang berniat tulus dan menyisihkan waktu terbaiknya setiap hari.",
];

export interface PageVerseItem {
  id: number;
  verseKey: string;
  verseNumber: number;
  surahNumber: number;
  surahName: string;
  surahArabic: string;
  textUthmani: string;
  translationIndo: string;
  audioUrl: string;
  keywordArab: string;
  juzNumber: number;
  pageNumber: number;
}

export interface MushafWordItem {
  id: number;
  text: string;
  charType: "word" | "end";
  verseNumber: number;
  surahNumber: number;
  lineNumber: number;
  audioUrl?: string;
}

export interface MushafLineItem {
  lineNumber: number;
  blockId: number; // 1 to 5
  words: MushafWordItem[];
}

export interface PageHufazBlock {
  blockId: number; // 1 to 5
  config: AlhufazColorBlockConfig;
  ayahs: PageVerseItem[];
  lines?: MushafLineItem[];
  startAyat: number;
  endAyat: number;
  keywords: string[];
}

// 15 lines data exact from Al-Hufaz Cordoba Mushaf for Page 6 (Standar Mushaf Al-Qur'an Indonesia)
export const PAGE_6_DEFAULT_LINES: MushafLineItem[] = [
  // Blok 1 (Kuning): Lines 1, 2, 3
  {
    lineNumber: 1,
    blockId: 1,
    words: [
      { id: 1, text: "وَإِذْ", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 1 },
      { id: 2, text: "قَالَ", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 1 },
      { id: 3, text: "رَبُّكَ", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 1 },
      { id: 4, text: "لِلْمَلَائِكَةِ", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 1 },
      { id: 5, text: "إِنِّي", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 1 },
      { id: 6, text: "جَاعِلٌ", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 1 },
      { id: 7, text: "فِي", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 1 },
      { id: 8, text: "الْأَرْضِ", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 1 },
      { id: 9, text: "خَلِيفَةً ۖ", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 1 },
    ],
  },
  {
    lineNumber: 2,
    blockId: 1,
    words: [
      { id: 10, text: "قَالُوا", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 2 },
      { id: 11, text: "أَتَجْعَلُ", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 2 },
      { id: 12, text: "فِيهَا", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 2 },
      { id: 13, text: "مَنْ", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 2 },
      { id: 14, text: "يُفْسِدُ", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 2 },
      { id: 15, text: "فِيهَا", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 2 },
      { id: 16, text: "وَيَسْفِكُ", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 2 },
      { id: 17, text: "الدِّمَاءَ", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 2 },
      { id: 18, text: "وَنَحْنُ", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 2 },
    ],
  },
  {
    lineNumber: 3,
    blockId: 1,
    words: [
      { id: 19, text: "نُسَبِّحُ", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 3 },
      { id: 20, text: "بِحَمْدِكَ", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 3 },
      { id: 21, text: "وَنُقَدِّسُ", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 3 },
      { id: 22, text: "لَكَ ۖ", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 3 },
      { id: 23, text: "قَالَ", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 3 },
      { id: 24, text: "إِنِّي", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 3 },
      { id: 25, text: "أَعْلَمُ", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 3 },
      { id: 26, text: "مَا", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 3 },
      { id: 27, text: "لَا", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 3 },
      { id: 28, text: "تَعْلَمُونَ", charType: "word", verseNumber: 30, surahNumber: 2, lineNumber: 3 },
      { id: 29, text: "٣٠", charType: "end", verseNumber: 30, surahNumber: 2, lineNumber: 3 },
    ],
  },
  // Blok 2 (Hijau): Lines 4, 5, 6
  {
    lineNumber: 4,
    blockId: 2,
    words: [
      { id: 30, text: "وَعَلَّمَ", charType: "word", verseNumber: 31, surahNumber: 2, lineNumber: 4 },
      { id: 31, text: "آدَمَ", charType: "word", verseNumber: 31, surahNumber: 2, lineNumber: 4 },
      { id: 32, text: "الْأَسْمَاءَ", charType: "word", verseNumber: 31, surahNumber: 2, lineNumber: 4 },
      { id: 33, text: "كُلَّهَا", charType: "word", verseNumber: 31, surahNumber: 2, lineNumber: 4 },
      { id: 34, text: "ثُمَّ", charType: "word", verseNumber: 31, surahNumber: 2, lineNumber: 4 },
      { id: 35, text: "عَرَضَهُمْ", charType: "word", verseNumber: 31, surahNumber: 2, lineNumber: 4 },
      { id: 36, text: "عَلَى", charType: "word", verseNumber: 31, surahNumber: 2, lineNumber: 4 },
      { id: 37, text: "الْمَلَائِكَةِ", charType: "word", verseNumber: 31, surahNumber: 2, lineNumber: 4 },
    ],
  },
  {
    lineNumber: 5,
    blockId: 2,
    words: [
      { id: 38, text: "فَقَالَ", charType: "word", verseNumber: 31, surahNumber: 2, lineNumber: 5 },
      { id: 39, text: "أَنْبِئُونِي", charType: "word", verseNumber: 31, surahNumber: 2, lineNumber: 5 },
      { id: 40, text: "بِأَسْمَاءِ", charType: "word", verseNumber: 31, surahNumber: 2, lineNumber: 5 },
      { id: 41, text: "هَٰؤُلَاءِ", charType: "word", verseNumber: 31, surahNumber: 2, lineNumber: 5 },
      { id: 42, text: "إِنْ", charType: "word", verseNumber: 31, surahNumber: 2, lineNumber: 5 },
      { id: 43, text: "كُنْتُمْ", charType: "word", verseNumber: 31, surahNumber: 2, lineNumber: 5 },
      { id: 44, text: "صَادِقِينَ", charType: "word", verseNumber: 31, surahNumber: 2, lineNumber: 5 },
      { id: 45, text: "٣١", charType: "end", verseNumber: 31, surahNumber: 2, lineNumber: 5 },
      { id: 46, text: "قَالُوا", charType: "word", verseNumber: 32, surahNumber: 2, lineNumber: 5 },
    ],
  },
  {
    lineNumber: 6,
    blockId: 2,
    words: [
      { id: 47, text: "سُبْحَانَكَ", charType: "word", verseNumber: 32, surahNumber: 2, lineNumber: 6 },
      { id: 48, text: "لَا", charType: "word", verseNumber: 32, surahNumber: 2, lineNumber: 6 },
      { id: 49, text: "عِلْمَ", charType: "word", verseNumber: 32, surahNumber: 2, lineNumber: 6 },
      { id: 50, text: "لَنَا", charType: "word", verseNumber: 32, surahNumber: 2, lineNumber: 6 },
      { id: 51, text: "إِلَّا", charType: "word", verseNumber: 32, surahNumber: 2, lineNumber: 6 },
      { id: 52, text: "مَا", charType: "word", verseNumber: 32, surahNumber: 2, lineNumber: 6 },
      { id: 53, text: "عَلَّمْتَنَا ۖ", charType: "word", verseNumber: 32, surahNumber: 2, lineNumber: 6 },
      { id: 54, text: "إِنَّكَ", charType: "word", verseNumber: 32, surahNumber: 2, lineNumber: 6 },
      { id: 55, text: "أَنْتَ", charType: "word", verseNumber: 32, surahNumber: 2, lineNumber: 6 },
      { id: 56, text: "الْعَلِيمُ", charType: "word", verseNumber: 32, surahNumber: 2, lineNumber: 6 },
      { id: 57, text: "الْحَكِيمُ", charType: "word", verseNumber: 32, surahNumber: 2, lineNumber: 6 },
      { id: 58, text: "٣٢", charType: "end", verseNumber: 32, surahNumber: 2, lineNumber: 6 },
    ],
  },
  // Blok 3 (Biru): Lines 7, 8, 9
  {
    lineNumber: 7,
    blockId: 3,
    words: [
      { id: 59, text: "قَالَ", charType: "word", verseNumber: 33, surahNumber: 2, lineNumber: 7 },
      { id: 60, text: "يَا آدَمُ", charType: "word", verseNumber: 33, surahNumber: 2, lineNumber: 7 },
      { id: 61, text: "أَنْبِئْهُمْ", charType: "word", verseNumber: 33, surahNumber: 2, lineNumber: 7 },
      { id: 62, text: "بِأَسْمَائِهِمْ ۖ", charType: "word", verseNumber: 33, surahNumber: 2, lineNumber: 7 },
      { id: 63, text: "فَلَمَّا", charType: "word", verseNumber: 33, surahNumber: 2, lineNumber: 7 },
      { id: 64, text: "أَنْبَأَهُمْ", charType: "word", verseNumber: 33, surahNumber: 2, lineNumber: 7 },
      { id: 65, text: "بِأَسْمَائِهِمْ", charType: "word", verseNumber: 33, surahNumber: 2, lineNumber: 7 },
      { id: 66, text: "قَالَ", charType: "word", verseNumber: 33, surahNumber: 2, lineNumber: 7 },
    ],
  },
  {
    lineNumber: 8,
    blockId: 3,
    words: [
      { id: 67, text: "أَلَمْ", charType: "word", verseNumber: 33, surahNumber: 2, lineNumber: 8 },
      { id: 68, text: "أَقُلْ", charType: "word", verseNumber: 33, surahNumber: 2, lineNumber: 8 },
      { id: 69, text: "لَكُمْ", charType: "word", verseNumber: 33, surahNumber: 2, lineNumber: 8 },
      { id: 70, text: "إِنِّي", charType: "word", verseNumber: 33, surahNumber: 2, lineNumber: 8 },
      { id: 71, text: "أَعْلَمُ", charType: "word", verseNumber: 33, surahNumber: 2, lineNumber: 8 },
      { id: 72, text: "غَيْبَ", charType: "word", verseNumber: 33, surahNumber: 2, lineNumber: 8 },
      { id: 73, text: "السَّمَاوَاتِ", charType: "word", verseNumber: 33, surahNumber: 2, lineNumber: 8 },
      { id: 74, text: "وَالْأَرْضِ", charType: "word", verseNumber: 33, surahNumber: 2, lineNumber: 8 },
      { id: 75, text: "وَأَعْلَمُ", charType: "word", verseNumber: 33, surahNumber: 2, lineNumber: 8 },
      { id: 76, text: "مَا", charType: "word", verseNumber: 33, surahNumber: 2, lineNumber: 8 },
    ],
  },
  {
    lineNumber: 9,
    blockId: 3,
    words: [
      { id: 77, text: "تُبْدُونَ", charType: "word", verseNumber: 33, surahNumber: 2, lineNumber: 9 },
      { id: 78, text: "وَمَا", charType: "word", verseNumber: 33, surahNumber: 2, lineNumber: 9 },
      { id: 79, text: "كُنْتُمْ", charType: "word", verseNumber: 33, surahNumber: 2, lineNumber: 9 },
      { id: 80, text: "تَكْتُمُونَ", charType: "word", verseNumber: 33, surahNumber: 2, lineNumber: 9 },
      { id: 81, text: "٣٣", charType: "end", verseNumber: 33, surahNumber: 2, lineNumber: 9 },
      { id: 82, text: "وَإِذْ", charType: "word", verseNumber: 34, surahNumber: 2, lineNumber: 9 },
      { id: 83, text: "قُلْنَا", charType: "word", verseNumber: 34, surahNumber: 2, lineNumber: 9 },
      { id: 84, text: "لِلْمَلَائِكَةِ", charType: "word", verseNumber: 34, surahNumber: 2, lineNumber: 9 },
      { id: 85, text: "اسْجُدُوا", charType: "word", verseNumber: 34, surahNumber: 2, lineNumber: 9 },
    ],
  },
  // Blok 4 (Pink): Lines 10, 11, 12
  {
    lineNumber: 10,
    blockId: 4,
    words: [
      { id: 86, text: "لِآدَمَ", charType: "word", verseNumber: 34, surahNumber: 2, lineNumber: 10 },
      { id: 87, text: "فَسَجَدُوا", charType: "word", verseNumber: 34, surahNumber: 2, lineNumber: 10 },
      { id: 88, text: "إِلَّا", charType: "word", verseNumber: 34, surahNumber: 2, lineNumber: 10 },
      { id: 89, text: "إِبْلِيسَ", charType: "word", verseNumber: 34, surahNumber: 2, lineNumber: 10 },
      { id: 90, text: "أَبَىٰ", charType: "word", verseNumber: 34, surahNumber: 2, lineNumber: 10 },
      { id: 91, text: "وَاسْتَكْبَرَ", charType: "word", verseNumber: 34, surahNumber: 2, lineNumber: 10 },
      { id: 92, text: "وَكَانَ", charType: "word", verseNumber: 34, surahNumber: 2, lineNumber: 10 },
      { id: 93, text: "مِنَ", charType: "word", verseNumber: 34, surahNumber: 2, lineNumber: 10 },
      { id: 94, text: "الْكَافِرِينَ", charType: "word", verseNumber: 34, surahNumber: 2, lineNumber: 10 },
      { id: 95, text: "٣٤", charType: "end", verseNumber: 34, surahNumber: 2, lineNumber: 10 },
    ],
  },
  {
    lineNumber: 11,
    blockId: 4,
    words: [
      { id: 96, text: "وَقُلْنَا", charType: "word", verseNumber: 35, surahNumber: 2, lineNumber: 11 },
      { id: 97, text: "يَا آدَمُ", charType: "word", verseNumber: 35, surahNumber: 2, lineNumber: 11 },
      { id: 98, text: "اسْكُنْ", charType: "word", verseNumber: 35, surahNumber: 2, lineNumber: 11 },
      { id: 99, text: "أَنْتَ", charType: "word", verseNumber: 35, surahNumber: 2, lineNumber: 11 },
      { id: 100, text: "وَزَوْجُكَ", charType: "word", verseNumber: 35, surahNumber: 2, lineNumber: 11 },
      { id: 101, text: "الْجَنَّةَ", charType: "word", verseNumber: 35, surahNumber: 2, lineNumber: 11 },
      { id: 102, text: "وَكُلَا", charType: "word", verseNumber: 35, surahNumber: 2, lineNumber: 11 },
      { id: 103, text: "مِنْهَا", charType: "word", verseNumber: 35, surahNumber: 2, lineNumber: 11 },
      { id: 104, text: "رَغَدًا", charType: "word", verseNumber: 35, surahNumber: 2, lineNumber: 11 },
    ],
  },
  {
    lineNumber: 12,
    blockId: 4,
    words: [
      { id: 105, text: "حَيْثُ", charType: "word", verseNumber: 35, surahNumber: 2, lineNumber: 12 },
      { id: 106, text: "شِئْتُمَا", charType: "word", verseNumber: 35, surahNumber: 2, lineNumber: 12 },
      { id: 107, text: "وَلَا", charType: "word", verseNumber: 35, surahNumber: 2, lineNumber: 12 },
      { id: 108, text: "تَقْرَبَا", charType: "word", verseNumber: 35, surahNumber: 2, lineNumber: 12 },
      { id: 109, text: "هَٰذِهِ", charType: "word", verseNumber: 35, surahNumber: 2, lineNumber: 12 },
      { id: 110, text: "الشَّجَرَةَ", charType: "word", verseNumber: 35, surahNumber: 2, lineNumber: 12 },
      { id: 111, text: "فَتَكُونَا", charType: "word", verseNumber: 35, surahNumber: 2, lineNumber: 12 },
      { id: 112, text: "مِنَ", charType: "word", verseNumber: 35, surahNumber: 2, lineNumber: 12 },
      { id: 113, text: "الظَّالِمِينَ", charType: "word", verseNumber: 35, surahNumber: 2, lineNumber: 12 },
      { id: 114, text: "٣٥", charType: "end", verseNumber: 35, surahNumber: 2, lineNumber: 12 },
    ],
  },
  // Blok 5 (Krem): Lines 13, 14, 15
  {
    lineNumber: 13,
    blockId: 5,
    words: [
      { id: 115, text: "فَأَزَلَّهُمَا", charType: "word", verseNumber: 36, surahNumber: 2, lineNumber: 13 },
      { id: 116, text: "الشَّيْطَانُ", charType: "word", verseNumber: 36, surahNumber: 2, lineNumber: 13 },
      { id: 117, text: "عَنْهَا", charType: "word", verseNumber: 36, surahNumber: 2, lineNumber: 13 },
      { id: 118, text: "فَأَخْرَجَهُمَا", charType: "word", verseNumber: 36, surahNumber: 2, lineNumber: 13 },
      { id: 119, text: "مِمَّا", charType: "word", verseNumber: 36, surahNumber: 2, lineNumber: 13 },
      { id: 120, text: "كَانَا", charType: "word", verseNumber: 36, surahNumber: 2, lineNumber: 13 },
      { id: 121, text: "فِيهِ ۖ", charType: "word", verseNumber: 36, surahNumber: 2, lineNumber: 13 },
      { id: 122, text: "وَقُلْنَا", charType: "word", verseNumber: 36, surahNumber: 2, lineNumber: 13 },
      { id: 123, text: "اهْبِطُوا", charType: "word", verseNumber: 36, surahNumber: 2, lineNumber: 13 },
    ],
  },
  {
    lineNumber: 14,
    blockId: 5,
    words: [
      { id: 124, text: "بَعْضُكُمْ", charType: "word", verseNumber: 36, surahNumber: 2, lineNumber: 14 },
      { id: 125, text: "لِبَعْضٍ", charType: "word", verseNumber: 36, surahNumber: 2, lineNumber: 14 },
      { id: 126, text: "عَدُوٌّ ۖ", charType: "word", verseNumber: 36, surahNumber: 2, lineNumber: 14 },
      { id: 127, text: "وَلَكُمْ", charType: "word", verseNumber: 36, surahNumber: 2, lineNumber: 14 },
      { id: 128, text: "فِي", charType: "word", verseNumber: 36, surahNumber: 2, lineNumber: 14 },
      { id: 129, text: "الْأَرْضِ", charType: "word", verseNumber: 36, surahNumber: 2, lineNumber: 14 },
      { id: 130, text: "مُسْتَقَرٌّ", charType: "word", verseNumber: 36, surahNumber: 2, lineNumber: 14 },
      { id: 131, text: "وَمَتَاعٌ", charType: "word", verseNumber: 36, surahNumber: 2, lineNumber: 14 },
      { id: 132, text: "إِلَىٰ", charType: "word", verseNumber: 36, surahNumber: 2, lineNumber: 14 },
      { id: 133, text: "حِينٍ", charType: "word", verseNumber: 36, surahNumber: 2, lineNumber: 14 },
      { id: 134, text: "٣٦", charType: "end", verseNumber: 36, surahNumber: 2, lineNumber: 14 },
    ],
  },
  {
    lineNumber: 15,
    blockId: 5,
    words: [
      { id: 135, text: "فَتَلَقَّىٰ", charType: "word", verseNumber: 37, surahNumber: 2, lineNumber: 15 },
      { id: 136, text: "آدَمُ", charType: "word", verseNumber: 37, surahNumber: 2, lineNumber: 15 },
      { id: 137, text: "مِنْ", charType: "word", verseNumber: 37, surahNumber: 2, lineNumber: 15 },
      { id: 138, text: "رَبِّهِ", charType: "word", verseNumber: 37, surahNumber: 2, lineNumber: 15 },
      { id: 139, text: "كَلِمَاتٍ", charType: "word", verseNumber: 37, surahNumber: 2, lineNumber: 15 },
      { id: 140, text: "فَتَابَ", charType: "word", verseNumber: 37, surahNumber: 2, lineNumber: 15 },
      { id: 141, text: "عَلَيْهِ ۚ", charType: "word", verseNumber: 37, surahNumber: 2, lineNumber: 15 },
      { id: 142, text: "إِنَّهُ", charType: "word", verseNumber: 37, surahNumber: 2, lineNumber: 15 },
      { id: 143, text: "هُوَ", charType: "word", verseNumber: 37, surahNumber: 2, lineNumber: 15 },
      { id: 144, text: "التَّوَّابُ", charType: "word", verseNumber: 37, surahNumber: 2, lineNumber: 15 },
      { id: 145, text: "الرَّحِيمُ", charType: "word", verseNumber: 37, surahNumber: 2, lineNumber: 15 },
      { id: 146, text: "٣٧", charType: "end", verseNumber: 37, surahNumber: 2, lineNumber: 15 },
    ],
  },
];

/**
 * Mengelompokkan 15 baris ke dalam 5 Blok Warna Al-Hufaz Cordoba
 * Masing-masing blok memiliki tepat 3 baris:
 * Blok 1 = Baris 1, 2, 3
 * Blok 2 = Baris 4, 5, 6
 * Blok 3 = Baris 7, 8, 9
 * Blok 4 = Baris 10, 11, 12
 * Blok 5 = Baris 13, 14, 15
 */
export function partition15LinesInto5Blocks(
  lines: MushafLineItem[],
  verses: PageVerseItem[]
): PageHufazBlock[] {
  const safeLines = lines && lines.length > 0 ? lines : PAGE_6_DEFAULT_LINES;
  const blocks: PageHufazBlock[] = [];

  for (let b = 1; b <= 5; b++) {
    const blockLines = safeLines.filter((l) => l.blockId === b);
    // Find verse numbers covered in this block
    const verseNumbers = new Set<number>();
    blockLines.forEach((l) => l.words.forEach((w) => verseNumbers.add(w.verseNumber)));
    const blockAyahs = verses.filter((v) => verseNumbers.has(v.verseNumber));

    const startAyat = blockAyahs.length > 0 ? blockAyahs[0].verseNumber : b;
    const endAyat = blockAyahs.length > 0 ? blockAyahs[blockAyahs.length - 1].verseNumber : startAyat;
    const keywords = blockAyahs.map((v) => v.keywordArab);

    blocks.push({
      blockId: b,
      config: ALHUFAZ_COLOR_BLOCKS[(b - 1) % ALHUFAZ_COLOR_BLOCKS.length],
      ayahs: blockAyahs.length > 0 ? blockAyahs : (verses.slice(0, 1) || []),
      lines: blockLines,
      startAyat,
      endAyat,
      keywords,
    });
  }

  return blocks;
}

/**
 * Fallback: Membagi ayat-ayat pada satu halaman secara proporsional ke dalam 5 Blok Warna
 */
export function partitionPageInto5Blocks(verses: PageVerseItem[]): PageHufazBlock[] {
  if (!verses || verses.length === 0) return [];
  const total = verses.length;
  const numBlocks = Math.min(5, total);

  // Hitung pembagian seimbang (misal 8 ayat -> 2, 1, 2, 1, 2)
  const baseSize = Math.floor(total / numBlocks);
  let remainder = total % numBlocks;

  const blocks: PageHufazBlock[] = [];
  let currentIndex = 0;

  for (let b = 0; b < numBlocks; b++) {
    const take = baseSize + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;

    const blockVerses = verses.slice(currentIndex, currentIndex + take);
    currentIndex += take;

    if (blockVerses.length > 0) {
      blocks.push({
        blockId: b + 1,
        config: ALHUFAZ_COLOR_BLOCKS[b % ALHUFAZ_COLOR_BLOCKS.length],
        ayahs: blockVerses,
        startAyat: blockVerses[0].verseNumber,
        endAyat: blockVerses[blockVerses.length - 1].verseNumber,
        keywords: blockVerses.map((v) => v.keywordArab),
      });
    }
  }

  return blocks;
}

// Start page map for 114 Surahs
export const SURAH_START_PAGES: Record<number, number> = {
  1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187, 10: 208,
  11: 221, 12: 235, 13: 249, 14: 255, 15: 262, 16: 267, 17: 282, 18: 293, 19: 305, 20: 312,
  21: 322, 22: 332, 23: 342, 24: 350, 25: 359, 26: 367, 27: 377, 28: 385, 29: 396, 30: 404,
  31: 411, 32: 415, 33: 418, 34: 428, 35: 434, 36: 440, 37: 446, 38: 453, 39: 458, 40: 467,
  41: 477, 42: 483, 43: 489, 44: 496, 45: 499, 46: 502, 47: 507, 48: 511, 49: 515, 50: 518,
  51: 520, 52: 523, 53: 526, 54: 528, 55: 531, 56: 534, 57: 537, 58: 542, 59: 545, 60: 549,
  61: 551, 62: 553, 63: 554, 64: 556, 65: 558, 66: 560, 67: 562, 68: 564, 69: 566, 70: 568,
  71: 570, 72: 572, 73: 574, 74: 575, 75: 577, 76: 578, 77: 580, 78: 582, 79: 583, 80: 585,
  81: 586, 82: 587, 83: 587, 84: 589, 85: 590, 86: 591, 87: 591, 88: 592, 89: 593, 90: 594,
  91: 595, 92: 595, 93: 596, 94: 596, 95: 597, 96: 597, 97: 598, 98: 598, 99: 599, 100: 599,
  101: 600, 102: 600, 103: 601, 104: 601, 105: 601, 106: 602, 107: 602, 108: 602, 109: 603, 110: 603,
  111: 603, 112: 604, 113: 604, 114: 604
};

// Start page map for 30 Juz
export const JUZ_START_PAGES: Record<number, number> = {
  1: 1, 2: 22, 3: 42, 4: 62, 5: 82, 6: 102, 7: 122, 8: 142, 9: 162, 10: 182,
  11: 202, 12: 222, 13: 242, 14: 262, 15: 282, 16: 302, 17: 322, 18: 342, 19: 362, 20: 382,
  21: 402, 22: 422, 23: 442, 24: 462, 25: 482, 26: 502, 27: 522, 28: 542, 29: 562, 30: 582,
};

export interface AlhufazPageSpecialMeta {
  pageNumber: number;
  guideTopTitle: string;
  nextPageGuideText: string;
  blockKeywords: { [blockId: number]: string[] };
  motivasiQuote: string;
  motivasiAuthor: string;
  temaAyatItems: { title: string; desc: string }[];
  terjemahSubTitle?: string;
  footnotes: string[];
}

export const ALHUFAZ_PAGE_SPECIAL_DATA: Record<number, AlhufazPageSpecialMeta> = {
  6: {
    pageNumber: 6,
    guideTopTitle: "2. Al-Baqarah: 30 - 37",
    nextPageGuideText: "كَلِمَاتٍ فَتَابَ عَلَيْهِ",
    blockKeywords: {
      1: ["وَإِذْ قَالَ", "وَعَلَّمَ آدَمَ"],
      2: ["قَالُوا سُبْحَانَكَ"],
      3: ["قَالَ يَا آدَمُ", "وَإِذْ قُلْنَا لِلْمَلَائِكَةِ"],
      4: ["وَقُلْنَا يَا آدَمُ"],
      5: ["فَأَزَلَّهُمَا الشَّيْطَانُ", "فَتَلَقَّىٰ آدَمُ"],
    },
    motivasiQuote: "Betapa dengan pertolongan Allah SWT, kita mampu menghafal Al-Qur'an, maka serahkanlah diri kita selalu kepada-Nya.",
    motivasiAuthor: "H. Abdul Aziz Abdur Rauf, Al-Hafiz",
    temaAyatItems: [
      {
        title: "Al-Baqarah, 30-34",
        desc: "Mengisahkan Adam sebagai khalifah di muka bumi, dialog Allah dengan malaikat dan iblis, dan keutamaan ilmu pengetahuan Adam atas malaikat.",
      },
      {
        title: "Al-Baqarah, 35",
        desc: "Perintah Allah Swt kepada Adam dengan istrinya untuk mendiami surga.",
      },
      {
        title: "Al-Baqarah, 36-37",
        desc: "Godaan iblis dan diturunkannya Adam dan Hawa dengan membekalkan taubat kepada Adam serta penerimaan taubat oleh Allah SWT.",
      },
    ],
    terjemahSubTitle: "Penetapan Manusia Sebagai Khalifah di Bumi",
    footnotes: [
      "(1) Khalifah bermakna pengganti, pemimpin, atau penguasa di muka bumi untuk menegakkan syariat Allah SWT.",
      "(2) Bersujud dalam ayat ini bukan untuk menyembah Adam, melainkan sebagai bentuk penghormatan dan ketaatan atas perintah Allah SWT.",
    ],
  },
};

export function getAlhufazPageMeta(pageNum: number, verses: PageVerseItem[], juzNum: number): AlhufazPageSpecialMeta {
  if (ALHUFAZ_PAGE_SPECIAL_DATA[pageNum]) {
    return ALHUFAZ_PAGE_SPECIAL_DATA[pageNum];
  }
  const first = verses && verses.length > 0 ? verses[0] : null;
  const last = verses && verses.length > 0 ? verses[verses.length - 1] : null;
  const guideTopTitle = first ? `${first.surahNumber}. ${first.surahName}: ${first.verseNumber} - ${last?.verseNumber || first.verseNumber}` : `Halaman ${pageNum}`;

  return {
    pageNumber: pageNum,
    guideTopTitle,
    nextPageGuideText: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    blockKeywords: {},
    motivasiQuote: ALHUFAZ_MOTIVASI_LIST[(pageNum - 1) % ALHUFAZ_MOTIVASI_LIST.length] || ALHUFAZ_MOTIVASI_LIST[0],
    motivasiAuthor: "H. Abdul Aziz Abdur Rauf, Al-Hafiz",
    temaAyatItems: [
      {
        title: guideTopTitle,
        desc: `Kandungan ayat-ayat suci Al-Qur'an pada halaman ${pageNum} Juz ${juzNum} membimbing tauhid, pemahaman syariat, dan ketakwaan hamba kepada Allah SWT.`,
      },
    ],
    footnotes: [
      "(1) Terjemahan resmi bersumber dari Departemen Agama / Kementerian Agama Republik Indonesia.",
    ],
  };
}

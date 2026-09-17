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

export interface PageHufazBlock {
  blockId: number; // 1 to 5
  config: AlhufazColorBlockConfig;
  ayahs: PageVerseItem[];
  startAyat: number;
  endAyat: number;
  keywords: string[];
}

/**
 * Membagi ayat-ayat pada satu halaman secara proporsional ke dalam 5 Blok Warna
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

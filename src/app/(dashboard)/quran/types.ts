export const ARABIC_NUMS = [
  "", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩", "١٠",
  "١١", "١٢", "١٣", "١٤", "١٥", "١٦", "١٧", "١٨", "١٩", "٢٠",
  "٢١", "٢٢", "٢٣", "٢٤", "٢٥", "٢٦", "٢٧", "٢٨", "٢٩", "٣٠",
];

const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function toArabicNumerals(num: number): string {
  return String(num)
    .split("")
    .map((d) => ARABIC_DIGITS[parseInt(d, 10)] || d)
    .join("");
}

export interface LastReadState {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  timestamp: number;
}

export interface BookmarkItem {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  teksArab: string;
  teksIndonesia: string;
  addedAt: number;
}

export interface AudioQueueItem {
  url: string;
  ayah: number;
  surah: number;
  label?: string;
  blockId?: number;
}

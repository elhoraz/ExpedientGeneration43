import { NextRequest, NextResponse } from "next/server";
import { QURAN_SURAHS } from "@/lib/data/quranSurahList";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageNumber: string }> }
) {
  try {
    const { pageNumber } = await params;
    const pageNum = parseInt(pageNumber, 10);

    if (isNaN(pageNum) || pageNum < 1 || pageNum > 604) {
      return NextResponse.json(
        { success: false, message: "Nomor halaman tidak valid (1-604)" },
        { status: 400 }
      );
    }

    // Fetch verses by page from api.quran.com with Indonesian Kemenag translation and word-level line_numbers
    const apiUrl = `https://api.quran.com/api/v4/verses/by_page/${pageNum}?language=id&words=true&word_fields=text_uthmani,location,line_number,char_type_name&translations=33&fields=text_uthmani,chapter_id,verse_number,juz_number`;
    const res = await fetch(apiUrl, {
      next: { revalidate: 86400 }, // Cache 24 jam di Next.js server
    });

    if (!res.ok) {
      throw new Error(`Gagal mengambil data halaman dari server (${res.status})`);
    }

    const json = await res.json();
    const rawVerses = json.verses || [];

    if (rawVerses.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada data ayat pada halaman ini" },
        { status: 404 }
      );
    }

    // Process & normalize verses
    const verses = rawVerses.map((v: any) => {
      const surahNum = v.chapter_id;
      const ayahNum = v.verse_number;
      const surahMeta = QURAN_SURAHS.find((s) => s.nomor === surahNum);

      const surahStr = String(surahNum).padStart(3, "0");
      const ayahStr = String(ayahNum).padStart(3, "0");

      // Extract 2-3 initial words as the keyword (kata kunci awal ayat)
      const words = (v.text_uthmani || "").trim().split(/\s+/);
      const keywordArab = words.slice(0, Math.min(3, words.length)).join(" ");

      // Clean translation text (remove footnotes markup like <sup foot_note=...>)
      let cleanTranslation = v.translations?.[0]?.text || "";
      cleanTranslation = cleanTranslation.replace(/<sup[^>]*>.*?<\/sup>/gi, "");

      return {
        id: v.id,
        verseKey: v.verse_key,
        verseNumber: ayahNum,
        surahNumber: surahNum,
        surahName: surahMeta?.namaLatin || `Surah ${surahNum}`,
        surahArabic: surahMeta?.nama || "",
        textUthmani: v.text_uthmani,
        translationIndo: cleanTranslation,
        audioUrl: `https://everyayah.com/data/Alafasy_128kbps/${surahStr}${ayahStr}.mp3`,
        keywordArab,
        juzNumber: v.juz_number,
        pageNumber: v.page_number,
      };
    });

    // Group words into authentic 15 lines (Medina Mushaf standard)
    const lineMap: Record<number, any[]> = {};
    for (let i = 1; i <= 15; i++) {
      lineMap[i] = [];
    }

    rawVerses.forEach((v: any) => {
      (v.words || []).forEach((w: any) => {
        const lineNum = w.line_number || 1;
        if (!lineMap[lineNum]) lineMap[lineNum] = [];
        lineMap[lineNum].push({
          id: w.id,
          text: w.text_uthmani || w.text,
          charType: w.char_type_name || "word",
          verseNumber: v.verse_number,
          surahNumber: v.chapter_id,
          lineNumber: lineNum,
          audioUrl: `https://everyayah.com/data/Alafasy_128kbps/${String(v.chapter_id).padStart(3, "0")}${String(v.verse_number).padStart(3, "0")}.mp3`,
        });
      });
    });

    // Normalize: if a line starts with verse end marker ('end'), move it to the end of the previous line
    for (let i = 2; i <= 15; i++) {
      if (lineMap[i].length > 0 && lineMap[i][0].charType === "end") {
        const marker = lineMap[i].shift();
        lineMap[i - 1].push(marker);
      }
    }

    // Build the 15 lines array with corresponding blockId (1..5)
    const lines = [];
    for (let i = 1; i <= 15; i++) {
      const blockId = Math.min(5, Math.ceil(i / 3)); // Lines 1..3 -> 1, 4..6 -> 2, 7..9 -> 3, 10..12 -> 4, 13..15 -> 5
      lines.push({
        lineNumber: i,
        blockId,
        words: lineMap[i] || [],
      });
    }

    // Primary surah info on this page
    const primarySurahNum = verses[0].surahNumber;
    const primarySurah = QURAN_SURAHS.find((s) => s.nomor === primarySurahNum);

    const firstVerse = verses[0];
    const lastVerse = verses[verses.length - 1];
    const headerTitle =
      firstVerse.surahNumber === lastVerse.surahNumber
        ? `${firstVerse.surahNumber}. ${firstVerse.surahName}: ${firstVerse.verseNumber} - ${lastVerse.verseNumber}`
        : `${firstVerse.surahNumber}. ${firstVerse.surahName}: ${firstVerse.verseNumber} — ${lastVerse.surahNumber}. ${lastVerse.surahName}: ${lastVerse.verseNumber}`;

    return NextResponse.json({
      success: true,
      data: {
        pageNumber: pageNum,
        juzNumber: verses[0].juzNumber,
        headerTitle,
        primarySurah: {
          number: primarySurahNum,
          name: primarySurah?.namaLatin || `Surah ${primarySurahNum}`,
          nameArabic: primarySurah?.nama || "",
          arti: primarySurah?.arti || "",
          tempatTurun: primarySurah?.tempatTurun || "Mekah",
        },
        verses,
        lines,
      },
    });
  } catch (error: any) {
    console.error("API /api/quran/page/[pageNumber] error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Terjadi kesalahan saat memuat halaman Al-Qur'an" },
      { status: 500 }
    );
  }
}

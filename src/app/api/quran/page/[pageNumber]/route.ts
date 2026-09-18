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

    // Fetch verses by page from api.quran.com with Indonesian Kemenag translation, tajweed markup, and word-level line_numbers
    const apiUrl = `https://api.quran.com/api/v4/verses/by_page/${pageNum}?language=id&words=true&word_fields=text_uthmani,text_uthmani_tajweed,location,line_number,char_type_name&translations=33&fields=text_uthmani,chapter_id,verse_number,juz_number`;
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

    // Helper to sanitize Medina ligature artifacts for clean Indonesian Naskh rendering
    const cleanKhot = (str: string): string => {
      if (!str) return "";
      return str
        .replace(/ٱ/g, "ا") // Alif wasla -> standard Alif
        .replace(/ءَادَمَ/g, "آدَمَ")
        .replace(/يَـٰٓـَٔادَمُ|يَـَٰٔادَمُ/g, "يَا آدَمُ")
        .replace(/ـٰ/g, "ا") // dagger alif after tatweel -> alif
        .replace(/ـ+/g, "") // remove tatweel / kashida that breaks web font baselines
        .replace(/[\u06DF\u06E0\u06E2\u06E3\u06E5\u06E6\u06EA\u06EB\u06EC]/g, "") // remove problematic Medina glyph markers
        .replace(/ۢ/g, "نْ") // small high mim
        .normalize("NFC");
    };

    // Helper to format tajweed rule tags into semantically styled span elements (Standar Mushaf Al-Hufaz Cordoba & Kemenag)
    const formatTajweedHtml = (
      rawTajweed: string,
      fallbackText: string
    ): { html: string; tajweedType?: "mad" | "ghunnah" | "ikhfa" | "qalqalah" | "idgham" } => {
      if (!rawTajweed || !rawTajweed.includes("<rule")) {
        return { html: fallbackText };
      }

      let dominantType: "mad" | "ghunnah" | "ikhfa" | "qalqalah" | "idgham" | undefined;
      if (/madda_/.test(rawTajweed)) dominantType = "mad";
      else if (/ghunnah|idgham_ghunnah|idgham_shafawi/.test(rawTajweed)) dominantType = "ghunnah";
      else if (/ikhafa|iqlab/.test(rawTajweed)) dominantType = "ikhfa";
      else if (/qalaqah/.test(rawTajweed)) dominantType = "qalqalah";
      else if (/idgham_wo_ghunnah|idgham_mutajanisayn/.test(rawTajweed)) dominantType = "idgham";

      let html = rawTajweed
        .replace(/<rule class=(?:madda_normal|madda_obligatory_mottasel|madda_obligatory_monfasel|madda_permissible|madda_necessary)>/g, '<span class="tj-mad" title="Hukum Mad (Dibaca Panjang)">')
        .replace(/<rule class=(?:ghunnah|idgham_ghunnah|idgham_shafawi)>/g, '<span class="tj-ghunnah" title="Hukum Ghunnah (Dengung 2 Harakat)">')
        .replace(/<rule class=(?:ikhafa|ikhafa_shafawi|iqlab)>/g, '<span class="tj-ikhfa" title="Hukum Ikhfa / Iqlab (Samar / Ditukar)">')
        .replace(/<rule class=qalaqah>/g, '<span class="tj-qalqalah" title="Hukum Qalqalah (Memantul)">')
        .replace(/<rule class=(?:idgham_wo_ghunnah|idgham_mutajanisayn)>/g, '<span class="tj-idgham" title="Hukum Idgham (Melebur)">')
        .replace(/<rule class=(?:ham_wasl|slnt|laam_shamsiyah)>/g, '<span class="tj-wasl" title="Hamzah Wasl / Tidak Dibaca">')
        .replace(/<rule class=custom-alef-maksora>/g, '<span class="tj-alef">')
        .replace(/<rule class=[a-zA-Z0-9_-]+>/g, '<span>')
        .replace(/<\/rule>/g, '</span>');

      return { html, tajweedType: dominantType };
    };

    // Process & normalize verses
    const verses = rawVerses.map((v: any) => {
      const surahNum = v.chapter_id;
      const ayahNum = v.verse_number;
      const surahMeta = QURAN_SURAHS.find((s) => s.nomor === surahNum);

      const surahStr = String(surahNum).padStart(3, "0");
      const ayahStr = String(ayahNum).padStart(3, "0");

      // Extract 2-3 initial words as the keyword (kata kunci awal ayat)
      const words = (v.text_uthmani || "").trim().split(/\s+/);
      const rawKeyword = words.slice(0, Math.min(3, words.length)).join(" ");
      const keywordArab = cleanKhot(rawKeyword);

      // Clean translation text (remove footnotes markup like <sup foot_note=...>)
      let cleanTranslation = v.translations?.[0]?.text || "";
      cleanTranslation = cleanTranslation.replace(/<sup[^>]*>.*?<\/sup>/gi, "");

      const verseTajweedHtml = (v.words || [])
        .filter((w: any) => w.char_type_name === "word")
        .map((w: any) => formatTajweedHtml(w.text_uthmani_tajweed || "", cleanKhot(w.text_uthmani || w.text || "")).html)
        .join(" ");

      return {
        id: v.id,
        verseKey: v.verse_key,
        verseNumber: ayahNum,
        surahNumber: surahNum,
        surahName: surahMeta?.namaLatin || `Surah ${surahNum}`,
        surahArabic: surahMeta?.nama || "",
        textUthmani: cleanKhot(v.text_uthmani),
        translationIndo: cleanTranslation,
        audioUrl: `https://everyayah.com/data/Alafasy_128kbps/${surahStr}${ayahStr}.mp3`,
        keywordArab,
        tajweedHtml: verseTajweedHtml,
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
        const rawText = w.text_uthmani || w.text || "";
        const rawTajweed = w.text_uthmani_tajweed || "";
        const tajweedResult = formatTajweedHtml(rawTajweed, cleanKhot(rawText));

        lineMap[lineNum].push({
          id: w.id,
          text: cleanKhot(rawText),
          tajweedHtml: tajweedResult.html,
          tajweedType: tajweedResult.tajweedType,
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

    // Detect Surah Headers & Bismillah lines for every surah start on this page
    const surahStarts: { surahNum: number; v1Line: number }[] = [];
    rawVerses.forEach((v: any) => {
      if (v.verse_number === 1) {
        const v1Line = Math.min(...(v.words || []).map((w: any) => w.line_number || 1));
        surahStarts.push({ surahNum: v.chapter_id, v1Line });
      }
    });

    const headerMap: Record<number, any> = {};
    const bismillahMap: Record<number, number> = {};

    surahStarts.forEach(({ surahNum, v1Line }) => {
      const sMeta = QURAN_SURAHS.find((s) => s.nomor === surahNum);
      const surahData = {
        number: surahNum,
        name: sMeta?.namaLatin || `Surah ${surahNum}`,
        nameArabic: sMeta?.nama || "",
        tempatTurun: sMeta?.tempatTurun || "Mekah",
        jumlahAyat: sMeta?.jumlahAyat || 0,
      };

      if (surahNum === 9) {
        // Surah 9 (At-Taubah) does not have Basmalah
        if (v1Line >= 2 && lineMap[v1Line - 1]?.length === 0) {
          headerMap[v1Line - 1] = surahData;
        } else if (v1Line === 1 && lineMap[1]?.length === 0) {
          headerMap[1] = surahData;
        }
      } else if (surahNum === 1) {
        // Surah 1 (Al-Fatihah): Verse 1 is Basmalah, Line 1 is Surah Header
        if (lineMap[1]?.length === 0) {
          headerMap[1] = surahData;
        }
      } else {
        // Standard surahs (2..8, 10..114)
        if (v1Line >= 3 && lineMap[v1Line - 2]?.length === 0 && lineMap[v1Line - 1]?.length === 0) {
          headerMap[v1Line - 2] = surahData;
          bismillahMap[v1Line - 1] = surahNum;
        } else if (v1Line >= 2 && lineMap[v1Line - 1]?.length === 0) {
          headerMap[v1Line - 1] = surahData;
        }
      }
    });

    // Build the 15 lines array with corresponding blockId (1..5)
    const lines = [];
    for (let i = 1; i <= 15; i++) {
      const blockId = Math.min(5, Math.ceil(i / 3)); // Lines 1..3 -> 1, 4..6 -> 2, 7..9 -> 3, 10..12 -> 4, 13..15 -> 5
      lines.push({
        lineNumber: i,
        blockId,
        isSurahHeader: !!headerMap[i],
        surahData: headerMap[i] || null,
        isBismillah: !!bismillahMap[i],
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

"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  QURAN_SURAHS,
  JUZ_LIST,
  QARI_LIST,
  QuranSurahItem,
  QuranSurahDetail,
  QuranAyatItem,
  QariItem,
} from "@/lib/data/quranSurahList";
import {
  ALHUFAZ_COLOR_BLOCKS,
  ALHUFAZ_MOTIVASI_LIST,
  PageVerseItem,
  PageHufazBlock,
  MushafWordItem,
  MushafLineItem,
  PAGE_6_DEFAULT_LINES,
  partition15LinesInto5Blocks,
  partitionPageInto5Blocks,
  SURAH_START_PAGES,
  JUZ_START_PAGES,
  getAlhufazPageMeta,
  AlhufazPageSpecialMeta,
} from "@/lib/data/alhufazData";
import "./quran.css";

const QARI_EVERYAYAH_MAP: Record<string, string> = {
  "05": "Alafasy_128kbps",
  "03": "Abdurrahmaan_As-Sudais_192kbps",
  "01": "Abdullaah_3awwaad_Al-Juhaynee_128kbps",
  "06": "Yasser_Ad-Dussary_128kbps",
  "02": "Ghamadi_40kbps",
  "04": "Minshawy_Murattal_128kbps",
};

function getEveryAyahUrl(surahNum: number, ayahNum: number, qariId: string = "05"): string {
  const folder = QARI_EVERYAYAH_MAP[qariId] || "Alafasy_128kbps";
  const sStr = String(surahNum).padStart(3, "0");
  const aStr = String(ayahNum).padStart(3, "0");
  return `https://everyayah.com/data/${folder}/${sStr}${aStr}.mp3`;
}

function toArabicNumerals(num: number): string {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(num)
    .split("")
    .map((d) => arabicDigits[parseInt(d, 10)] || d)
    .join("");
}

interface LastReadState {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  timestamp: number;
}

interface BookmarkItem {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  teksArab: string;
  teksIndonesia: string;
  addedAt: number;
}

interface AudioQueueItem {
  url: string;
  ayah: number;
  surah: number;
  label?: string;
  blockId?: number;
}

export default function QuranClient({ currentUserId }: { currentUserId: string }) {
  // Main Top-Level Mode: "cordoba" (Authentic Mushaf Page Layout) vs "surahList" (List of Surahs)
  const [mainDisplayMode, setMainDisplayMode] = useState<"cordoba" | "surahList">("cordoba");

  // ==========================================
  // CORDOBA MUSHAF PER-PAGE STATES
  // ==========================================
  const [cordobaPage, setCordobaPage] = useState<number>(6); // Default to Page 6 (as in user reference photo)
  const [pageData, setPageData] = useState<{
    pageNumber: number;
    juzNumber: number;
    headerTitle: string;
    primarySurah: any;
    verses: PageVerseItem[];
    lines?: MushafLineItem[];
  } | null>(null);
  const [loadingPage, setLoadingPage] = useState<boolean>(true);
  const [errorPage, setErrorPage] = useState<string | null>(null);

  // Sub-view: "mushaf" (1:1 physical sheet) vs "poster" (poster diagram with arrows)
  const [cordobaSubView, setCordobaSubView] = useState<"mushaf" | "poster">("mushaf");
  const [showOriginalModal, setShowOriginalModal] = useState<boolean>(false);

  // Closed / Tutup Blocks for 20m memorization test
  const [closedBlocks, setClosedBlocks] = useState<{ [blockId: number]: boolean }>({});
  const [pageTikrar, setPageTikrar] = useState<{ [key: string]: number }>({});
  const [murajaahChecks, setMurajaahChecks] = useState<{ [key: string]: boolean }>({});
  const [blockBacaUlangChecks, setBlockBacaUlangChecks] = useState<{ [key: string]: boolean }>({});
  const [blockMenghafalChecks, setBlockMenghafalChecks] = useState<{ [key: string]: boolean }>({});
  const [bacaUlangBubbles, setBacaUlangBubbles] = useState<{ [key: string]: boolean }>({});
  const [menghafalBubbles, setMenghafalBubbles] = useState<{ [key: string]: boolean }>({});

  // Mobile column active tab in Cordoba mode
  const [mobileCordobaTab, setMobileCordobaTab] = useState<"mushaf" | "kontrol" | "panduan">("mushaf");

  // Hafalan Timer: 40m (baca ulang) vs 20m (menghafal tutup-buka)
  const [timerTargetMinutes, setTimerTargetMinutes] = useState<40 | 20>(40);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(40 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ==========================================
  // SURAH LIST & READER VIEW STATES
  // ==========================================
  const [activeTab, setActiveTab] = useState<"surah" | "juz">("surah");
  const [searchQuery, setSearchQuery] = useState("");
  const [revelationFilter, setRevelationFilter] = useState<"all" | "Mekah" | "Madinah">("all");
  const [selectedSurah, setSelectedSurah] = useState<QuranSurahDetail | null>(null);
  const [loadingSurah, setLoadingSurah] = useState(false);
  const [errorSurah, setErrorSurah] = useState<string | null>(null);

  // Reader Settings
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg" | "xl">("md");
  const [showLatin, setShowLatin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [isMushafMode, setIsMushafMode] = useState(false);

  // Audio Player States & Queue System
  const [selectedQari, setSelectedQari] = useState<string>("05"); // Default: Misyari Rasyid
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingAyah, setCurrentPlayingAyah] = useState<number | null>(null);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [audioQueue, setAudioQueue] = useState<AudioQueueItem[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [isLoopingQueue, setIsLoopingQueue] = useState<boolean>(false);
  const [currentPlayingBlockId, setCurrentPlayingBlockId] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<AudioQueueItem[]>([]);
  const queueIndexRef = useRef<number>(0);
  const isLoopingRef = useRef<boolean>(false);

  // Bookmarks & Last Read States
  const [lastRead, setLastRead] = useState<LastReadState | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [showBookmarksModal, setShowBookmarksModal] = useState(false);

  // Tafsir Modal States
  const [showTafsirModal, setShowTafsirModal] = useState(false);
  const [tafsirData, setTafsirData] = useState<any | null>(null);
  const [loadingTafsir, setLoadingTafsir] = useState(false);
  const [selectedAyahTafsir, setSelectedAyahTafsir] = useState<number | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const triggerHaptic = useCallback((ms = 12) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {}
    }
  }, []);

  // Format MM:SS for Timer
  const formatTimerDisplay = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedLastRead = localStorage.getItem("expedient_quran_last_read");
      if (savedLastRead) setLastRead(JSON.parse(savedLastRead));

      const savedBookmarks = localStorage.getItem("expedient_quran_bookmarks");
      if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));

      const savedQari = localStorage.getItem("expedient_quran_qari");
      if (savedQari) setSelectedQari(savedQari);

      const savedFontSize = localStorage.getItem("expedient_quran_font_size");
      if (savedFontSize) setFontSize(savedFontSize as any);

      const savedPage = localStorage.getItem("expedient_cordoba_page");
      if (savedPage) {
        const parsed = parseInt(savedPage, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 604) {
          setCordobaPage(parsed);
        }
      }

      const savedMurajaah = localStorage.getItem("expedient_cordoba_murajaah");
      if (savedMurajaah) setMurajaahChecks(JSON.parse(savedMurajaah));

      const savedBacaUlang = localStorage.getItem("expedient_cordoba_baca_ulang");
      if (savedBacaUlang) setBlockBacaUlangChecks(JSON.parse(savedBacaUlang));

      const savedMenghafal = localStorage.getItem("expedient_cordoba_menghafal");
      if (savedMenghafal) setBlockMenghafalChecks(JSON.parse(savedMenghafal));

      const savedBacaBubbles = localStorage.getItem("expedient_cordoba_baca_bubbles");
      if (savedBacaBubbles) setBacaUlangBubbles(JSON.parse(savedBacaBubbles));

      const savedHafalBubbles = localStorage.getItem("expedient_cordoba_hafal_bubbles");
      if (savedHafalBubbles) setMenghafalBubbles(JSON.parse(savedHafalBubbles));
    } catch (e) {
      console.warn("Error reading Quran preferences from localStorage:", e);
    }
  }, []);

  // Load Cordoba Mushaf Page
  const loadCordobaPage = useCallback(async (pageNum: number) => {
    setLoadingPage(true);
    setErrorPage(null);
    setClosedBlocks({}); // Reset block shields on page change

    try {
      const res = await fetch(`/api/quran/page/${pageNum}`);
      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.message || "Gagal memuat halaman mushaf");
      }

      setPageData(json.data);
      setCordobaPage(pageNum);

      // Save page to localStorage
      try {
        localStorage.setItem("expedient_cordoba_page", String(pageNum));
      } catch {}
    } catch (err: any) {
      console.error("Fetch cordoba page error:", err);
      setErrorPage(err?.message || "Terjadi kesalahan saat memuat halaman mushaf.");
    } finally {
      setLoadingPage(false);
    }
  }, []);

  // Initial load of Cordoba Page
  useEffect(() => {
    loadCordobaPage(cordobaPage);
  }, [cordobaPage, loadCordobaPage]);

  // Page Partition into 5 Colors (15 Baris Autentik Medina Mushaf)
  const pageBlocks = useMemo<PageHufazBlock[]>(() => {
    const rawLines =
      pageData?.lines && pageData.lines.length > 0
        ? pageData.lines
        : cordobaPage === 6
        ? PAGE_6_DEFAULT_LINES
        : [];
    const verses = pageData?.verses || [];
    if (rawLines.length > 0) {
      return partition15LinesInto5Blocks(rawLines, verses);
    }
    return partitionPageInto5Blocks(verses);
  }, [pageData, cordobaPage]);

  // Toggle TUTUP / BUKA for a color block
  const toggleBlockClosure = (blockId: number) => {
    triggerHaptic(15);
    setClosedBlocks((prev) => {
      const nextState = !prev[blockId];
      if (nextState) {
        showToast(`Blok ${blockId} ditutup untuk uji hafalan 20 menit`);
      } else {
        showToast(`Blok ${blockId} dibuka untuk memeriksa hafalan`);
      }
      return { ...prev, [blockId]: nextState };
    });
  };

  // Checkbox handlers for Muraja'ah & Control Box
  const toggleMurajaahCheck = (key: string) => {
    triggerHaptic(10);
    setMurajaahChecks((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("expedient_cordoba_murajaah", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const toggleBacaBubble = (blockId: number, bubbleIdx: number) => {
    triggerHaptic(8);
    const key = `p${cordobaPage}-b${blockId}-baca-${bubbleIdx}`;
    setBacaUlangBubbles((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("expedient_cordoba_baca_bubbles", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const toggleHafalBubble = (blockId: number, bubbleIdx: number) => {
    triggerHaptic(8);
    const key = `p${cordobaPage}-b${blockId}-hafal-${bubbleIdx}`;
    setMenghafalBubbles((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("expedient_cordoba_hafal_bubbles", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Special Page Metadata (Page 6 exact matching or dynamic for all pages)
  const pageMeta = useMemo(() => {
    return getAlhufazPageMeta(cordobaPage, pageData?.verses || [], pageData?.juzNumber || 1);
  }, [pageData, cordobaPage]);

  // Translation 3 Columns
  const { col1Verses, col2Verses, col3Verses } = useMemo(() => {
    if (!pageData?.verses || pageData.verses.length === 0) {
      return { col1Verses: [], col2Verses: [], col3Verses: [] };
    }
    const total = pageData.verses.length;
    const size1 = Math.ceil(total / 3);
    const size2 = Math.ceil((total - size1) / 2);
    return {
      col1Verses: pageData.verses.slice(0, size1),
      col2Verses: pageData.verses.slice(size1, size1 + size2),
      col3Verses: pageData.verses.slice(size1 + size2),
    };
  }, [pageData]);

  // Timer Control
  const toggleTimer = () => {
    triggerHaptic(12);
    if (isTimerRunning) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setIsTimerRunning(false);
    } else {
      setIsTimerRunning(true);
      timerIntervalRef.current = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setIsTimerRunning(false);
            triggerHaptic(50);
            showToast(`⏰ Waktu ${timerTargetMinutes} Menit Selesai!`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const resetTimer = (mins: 40 | 20) => {
    triggerHaptic(10);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsTimerRunning(false);
    setTimerTargetMinutes(mins);
    setTimerSecondsLeft(mins * 60);
    showToast(`Timer diatur: ${mins} Menit (${mins === 40 ? "Baca Ulang" : "Menghafal Tutup-Buka"})`);
  };

  // ==========================================
  // RESILIENT MULTI-TRACK AUDIO PLAYBACK ENGINE
  // ==========================================

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    audioQueueRef.current = [];
    setAudioQueue([]);
    setIsPlaying(false);
    setCurrentPlayingAyah(null);
    setCurrentPlayingBlockId(null);
  };

  const playQueueItemAtIndex = (index: number) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    const queue = audioQueueRef.current;

    if (index < 0 || index >= queue.length) {
      if (isLoopingRef.current && queue.length > 0) {
        queueIndexRef.current = 0;
        setQueueIndex(0);
        playQueueItemAtIndex(0);
        return;
      }
      setIsPlaying(false);
      setCurrentPlayingAyah(null);
      setCurrentPlayingBlockId(null);
      return;
    }

    queueIndexRef.current = index;
    setQueueIndex(index);

    const item = queue[index];
    setCurrentPlayingAyah(item.ayah);
    setCurrentPlayingBlockId(item.blockId || null);

    // Multi-candidate CORS-resilient fallback URLs
    const candidates: string[] = [];
    if (item.surah && item.ayah) {
      candidates.push(getEveryAyahUrl(item.surah, item.ayah, selectedQari));
      if (selectedQari !== "05") {
        candidates.push(getEveryAyahUrl(item.surah, item.ayah, "05"));
      }
      candidates.push(
        `https://verses.quran.com/Alafasy/mp3/${String(item.surah).padStart(3, "0")}${String(item.ayah).padStart(3, "0")}.mp3`
      );
    }
    if (item.url && !candidates.includes(item.url)) {
      candidates.push(item.url);
    }

    let candidateIdx = 0;

    const tryPlay = () => {
      if (candidateIdx >= candidates.length) {
        console.warn("All audio candidates failed for", item);
        const next = queueIndexRef.current + 1;
        if (next < queue.length) {
          playQueueItemAtIndex(next);
        } else {
          showToast("Gagal memutar audio ayat ini");
          setIsPlaying(false);
          setCurrentPlayingAyah(null);
          setCurrentPlayingBlockId(null);
        }
        return;
      }

      const currentTarget = candidates[candidateIdx];
      audio.src = currentTarget;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn(`Audio playback attempt ${candidateIdx + 1} failed for ${currentTarget}:`, err);
          candidateIdx++;
          tryPlay();
        });
    };

    audio.onended = () => {
      const q = audioQueueRef.current;
      const nextIdx = queueIndexRef.current + 1;
      if (nextIdx < q.length) {
        playQueueItemAtIndex(nextIdx);
      } else if (isLoopingRef.current && q.length > 0) {
        showToast("🔁 Mengulang murottal blok...");
        playQueueItemAtIndex(0);
      } else {
        setIsPlaying(false);
        setCurrentPlayingAyah(null);
        setCurrentPlayingBlockId(null);
      }
    };

    audio.onerror = () => {
      candidateIdx++;
      tryPlay();
    };

    tryPlay();
  };

  // Play a single verse directly
  const playVerseAudio = (audioUrl: string, ayahNum: number, surahNum?: number, blockId?: number) => {
    triggerHaptic(10);
    const item: AudioQueueItem = {
      url: audioUrl,
      ayah: ayahNum,
      surah: surahNum || 1,
      blockId,
      label: surahNum ? `Surah ${surahNum} : Ayat ${ayahNum}` : `Ayat ${ayahNum}`,
    };

    audioQueueRef.current = [item];
    setAudioQueue([item]);
    setCurrentPlayingBlockId(blockId || null);
    playQueueItemAtIndex(0);
  };

  // Play a single verse directly when a word or verse marker is clicked in the 15-line mushaf
  const playSingleAyahAudio = (verseNum: number, surahNum?: number, blockId?: number) => {
    triggerHaptic(10);
    const targetVerse = pageData?.verses?.find((v) => v.verseNumber === verseNum);
    const finalSurah = surahNum || targetVerse?.surahNumber || 2;
    const url = targetVerse?.audioUrl || getEveryAyahUrl(finalSurah, verseNum, selectedQari);
    playVerseAudio(url, verseNum, finalSurah, blockId);
  };

  // Play ALL verses of a color block in continuous sequence
  const playBlockVerses = (block: PageHufazBlock) => {
    triggerHaptic(12);
    if (block.ayahs.length === 0) return;

    const items: AudioQueueItem[] = block.ayahs.map((v, i) => ({
      url: v.audioUrl,
      ayah: v.verseNumber,
      surah: v.surahNumber,
      blockId: block.blockId,
      label: `${block.config.name} (Ayat ${v.verseNumber}) [${i + 1}/${block.ayahs.length}]`,
    }));

    audioQueueRef.current = items;
    setAudioQueue(items);
    setCurrentPlayingBlockId(block.blockId);
    showToast(`Memutar murottal ${block.config.name} (${block.ayahs.length} Ayat berurutan)`);
    playQueueItemAtIndex(0);
  };

  // Play entire page sequentially (all 5 blocks)
  const playEntirePage = () => {
    triggerHaptic(15);
    if (!pageData?.verses || pageData.verses.length === 0) return;

    const items: AudioQueueItem[] = pageData.verses.map((v, i) => ({
      url: v.audioUrl,
      ayah: v.verseNumber,
      surah: v.surahNumber,
      label: `Halaman ${cordobaPage} : Ayat ${v.verseNumber} (${i + 1}/${pageData.verses.length})`,
    }));

    audioQueueRef.current = items;
    setAudioQueue(items);
    setCurrentPlayingBlockId(null);
    showToast(`Memutar murottal 1 halaman penuh (${items.length} Ayat berurutan)`);
    playQueueItemAtIndex(0);
  };

  // Click on a verse in continuous mushaf: start playing from that verse to end of block
  const handleVerseClickInMushaf = (block: PageHufazBlock, verse: PageVerseItem) => {
    triggerHaptic(10);
    const startIdx = block.ayahs.findIndex((v) => v.verseNumber === verse.verseNumber);
    const ayahsToPlay = startIdx >= 0 ? block.ayahs.slice(startIdx) : [verse];

    const items: AudioQueueItem[] = ayahsToPlay.map((v) => ({
      url: v.audioUrl,
      ayah: v.verseNumber,
      surah: v.surahNumber,
      blockId: block.blockId,
      label: `${block.config.name} (Ayat ${v.verseNumber})`,
    }));

    audioQueueRef.current = items;
    setAudioQueue(items);
    setCurrentPlayingBlockId(block.blockId);
    playQueueItemAtIndex(0);
  };

  // Play in Mode Tilawah: from this ayah onwards
  const playTilawahAyah = (ayahNum: number) => {
    triggerHaptic(10);
    if (!selectedSurah) return;
    const startIdx = selectedSurah.ayat.findIndex((a) => a.nomorAyat === ayahNum);
    const ayahsToPlay = autoPlayNext ? selectedSurah.ayat.slice(startIdx) : [selectedSurah.ayat[startIdx]];

    const items: AudioQueueItem[] = ayahsToPlay.map((a) => ({
      url: a.audio[selectedQari] || "",
      ayah: a.nomorAyat,
      surah: selectedSurah.nomor,
      label: `${selectedSurah.namaLatin} : Ayat ${a.nomorAyat}`,
    }));

    audioQueueRef.current = items;
    setAudioQueue(items);
    setCurrentPlayingBlockId(null);
    playQueueItemAtIndex(0);
  };

  // Jump handlers
  const handleJumpSurah = (surahNum: number) => {
    const page = SURAH_START_PAGES[surahNum] || 1;
    loadCordobaPage(page);
  };

  const handleJumpJuz = (juzNum: number) => {
    const page = JUZ_START_PAGES[juzNum] || 1;
    loadCordobaPage(page);
  };

  // Open Surah in standard reader mode
  const openSurah = async (surahNumber: number, targetAyahNumber?: number) => {
    triggerHaptic(15);
    setLoadingSurah(true);
    setErrorSurah(null);
    stopAudio();

    try {
      const res = await fetch(`/api/quran/surat/${surahNumber}`);
      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.message || "Gagal memuat surat Al-Qur'an");
      }

      setSelectedSurah(json.data);
      setMainDisplayMode("surahList");
      window.scrollTo({ top: 0, behavior: "smooth" });

      const newLastRead: LastReadState = {
        surahNumber: json.data.nomor,
        surahName: json.data.namaLatin,
        ayahNumber: targetAyahNumber || 1,
        timestamp: Date.now(),
      };
      setLastRead(newLastRead);
      try {
        localStorage.setItem("expedient_quran_last_read", JSON.stringify(newLastRead));
      } catch {}
    } catch (err: any) {
      console.error("Open surah error:", err);
      setErrorSurah(err?.message || "Koneksi terganggu. Silakan coba lagi.");
    } finally {
      setLoadingSurah(false);
    }
  };

  const closeSurahReader = () => {
    triggerHaptic(12);
    stopAudio();
    setSelectedSurah(null);
  };

  // Open Tafsir Modal
  const openTafsirModal = async (ayahNumber: number) => {
    if (!selectedSurah) return;
    triggerHaptic(10);
    setSelectedAyahTafsir(ayahNumber);
    setShowTafsirModal(true);
    setLoadingTafsir(true);
    try {
      const res = await fetch(`/api/quran/tafsir/${selectedSurah.nomor}`);
      const json = await res.json();
      if (json.success && json.data) {
        setTafsirData(json.data);
      }
    } catch (e) {
      console.warn("Fetch tafsir error:", e);
    } finally {
      setLoadingTafsir(false);
    }
  };

  // Bookmark Toggle
  const toggleBookmark = (ayah: QuranAyatItem) => {
    if (!selectedSurah) return;
    triggerHaptic(10);
    const exists = bookmarks.some(
      (b) => b.surahNumber === selectedSurah.nomor && b.ayahNumber === ayah.nomorAyat
    );
    let updated: BookmarkItem[];
    if (exists) {
      updated = bookmarks.filter(
        (b) => !(b.surahNumber === selectedSurah.nomor && b.ayahNumber === ayah.nomorAyat)
      );
      showToast(`Bookmark Ayat ${ayah.nomorAyat} dihapus`);
    } else {
      const newItem: BookmarkItem = {
        surahNumber: selectedSurah.nomor,
        surahName: selectedSurah.namaLatin,
        ayahNumber: ayah.nomorAyat,
        teksArab: ayah.teksArab,
        teksIndonesia: ayah.teksIndonesia,
        addedAt: Date.now(),
      };
      updated = [newItem, ...bookmarks];
      showToast(`Ayat ${ayah.nomorAyat} disimpan ke Bookmark`);
    }
    setBookmarks(updated);
    try {
      localStorage.setItem("expedient_quran_bookmarks", JSON.stringify(updated));
    } catch {}
  };

  // Filtered Surahs
  const filteredSurahs = useMemo(() => {
    let list = QURAN_SURAHS;
    if (revelationFilter !== "all") {
      list = list.filter((s) => s.tempatTurun === revelationFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.namaLatin.toLowerCase().includes(q) ||
          s.arti.toLowerCase().includes(q) ||
          s.nomor.toString() === q ||
          s.nama.includes(q)
      );
    }
    return list;
  }, [searchQuery, revelationFilter]);

  return (
    <div className="quran-page-root">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="quran-toast">
          <i className="fa-solid fa-circle-check"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP VIEW SWITCHER: MUSHAF AL-HUFAZ CORDOBA VS DAFTAR SURAH */}
      <div className="top-mushaf-switcher-container">
        <button
          type="button"
          className={`top-mushaf-tab ${mainDisplayMode === "cordoba" ? "active" : ""}`}
          onClick={() => {
            triggerHaptic(12);
            setMainDisplayMode("cordoba");
            closeSurahReader();
          }}
        >
          <i className="fa-solid fa-book-quran"></i>
          <span>Mushaf Al-Hufaz Cordoba (Halaman 5 Blok)</span>
          <span className="live-pill">Metode 5 Jam</span>
        </button>

        <button
          type="button"
          className={`top-mushaf-tab ${mainDisplayMode === "surahList" ? "active" : ""}`}
          onClick={() => {
            triggerHaptic(12);
            setMainDisplayMode("surahList");
          }}
        >
          <i className="fa-solid fa-list-ul"></i>
          <span>Daftar 114 Surah & Tilawah</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: REPLIKA AUTENTIK MUSHAF AL-HUFAZ CORDOBA (PER-HALAMAN 1 - 604)   */}
      {/* ========================================================================= */}
      {mainDisplayMode === "cordoba" && (
        <div className="cordoba-master-container">
          {/* Top Page Control Bar */}
          <div className="cordoba-control-panel">
            {/* Page Navigation Left / Right */}
            <div className="cordoba-nav-group">
              <button
                type="button"
                className="cordoba-page-btn"
                onClick={() => cordobaPage > 1 && loadCordobaPage(cordobaPage - 1)}
                disabled={cordobaPage <= 1}
                title="Halaman Sebelumnya"
              >
                <i className="fa-solid fa-chevron-left"></i>
                <span className="btn-label">Sebelumnya</span>
              </button>

              <div className="cordoba-page-indicator">
                <span className="page-lbl">HALAMAN</span>
                <span className="page-val">{cordobaPage}</span>
                <span className="page-total">/ 604</span>
              </div>

              <button
                type="button"
                className="cordoba-page-btn"
                onClick={() => cordobaPage < 604 && loadCordobaPage(cordobaPage + 1)}
                disabled={cordobaPage >= 604}
                title="Halaman Selanjutnya"
              >
                <span className="btn-label">Selanjutnya</span>
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>

            {/* Quick Jumper Dropdowns */}
            <div className="cordoba-jump-group">
              <select
                className="cordoba-select"
                value={pageData?.primarySurah?.number || 2}
                onChange={(e) => handleJumpSurah(parseInt(e.target.value, 10))}
              >
                {QURAN_SURAHS.map((s) => (
                  <option key={s.nomor} value={s.nomor}>
                    {s.nomor}. {s.namaLatin} ({s.nama})
                  </option>
                ))}
              </select>

              <select
                className="cordoba-select juz-select"
                value={pageData?.juzNumber || 1}
                onChange={(e) => handleJumpJuz(parseInt(e.target.value, 10))}
              >
                {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                  <option key={j} value={j}>
                    Juz {j} (Hal. {JUZ_START_PAGES[j]})
                  </option>
                ))}
              </select>
            </div>

            {/* Interactive 5-Hour Memorization Timer */}
            <div className="cordoba-timer-box">
              <div className="timer-toggle-btns">
                <button
                  type="button"
                  className={`timer-tab-btn ${timerTargetMinutes === 40 ? "active" : ""}`}
                  onClick={() => resetTimer(40)}
                >
                  40m Baca Ulang
                </button>
                <button
                  type="button"
                  className={`timer-tab-btn ${timerTargetMinutes === 20 ? "active" : ""}`}
                  onClick={() => resetTimer(20)}
                >
                  20m Hafal Tutup-Buka
                </button>
              </div>

              <div className="timer-display-controls">
                <span className="timer-digits">{formatTimerDisplay(timerSecondsLeft)}</span>
                <button
                  type="button"
                  className={`timer-action-btn ${isTimerRunning ? "pause" : "play"}`}
                  onClick={toggleTimer}
                >
                  <i className={`fa-solid ${isTimerRunning ? "fa-pause" : "fa-play"}`}></i>
                </button>
                <button
                  type="button"
                  className="timer-action-btn reset"
                  onClick={() => resetTimer(timerTargetMinutes)}
                  title="Reset Timer"
                >
                  <i className="fa-solid fa-rotate-right"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Subview Selector Bar */}
          <div className="cordoba-subview-panel">
            <div className="subview-toggle-group">
              <button
                type="button"
                className={`subview-toggle-btn ${cordobaSubView === "mushaf" ? "active" : ""}`}
                onClick={() => {
                  triggerHaptic(10);
                  setCordobaSubView("mushaf");
                }}
              >
                <i className="fa-solid fa-book-open"></i>
                <span>Lembaran Cetak 1:1 (Persis Buku Fisik)</span>
              </button>

              <button
                type="button"
                className={`subview-toggle-btn ${cordobaSubView === "poster" ? "active" : ""}`}
                onClick={() => {
                  triggerHaptic(10);
                  setCordobaSubView("poster");
                }}
              >
                <i className="fa-solid fa-chalkboard-user"></i>
                <span>Poster Anatomi & Panduan (Sesuai Brosur)</span>
              </button>
            </div>

            <button
              type="button"
              className="subview-photo-btn"
              onClick={() => {
                triggerHaptic(12);
                setShowOriginalModal(true);
              }}
            >
              <i className="fa-solid fa-image"></i>
              <span>Lihat Foto Brosur Asli Al-Hufaz</span>
            </button>
          </div>

          {/* Mobile Tab Switcher for Cordoba columns on small screens */}
          <div className="cordoba-mobile-column-tabs">
            <button
              type="button"
              className={`mobile-col-btn ${mobileCordobaTab === "mushaf" ? "active" : ""}`}
              onClick={() => setMobileCordobaTab("mushaf")}
            >
              <i className="fa-solid fa-palette"></i>
              <span>Lembaran 5 Blok Warna</span>
            </button>
            <button
              type="button"
              className={`mobile-col-btn ${mobileCordobaTab === "kontrol" ? "active" : ""}`}
              onClick={() => setMobileCordobaTab("kontrol")}
            >
              <i className="fa-solid fa-list-check"></i>
              <span>Kotak Kontrol & Muraja'ah</span>
            </button>
            <button
              type="button"
              className={`mobile-col-btn ${mobileCordobaTab === "panduan" ? "active" : ""}`}
              onClick={() => setMobileCordobaTab("panduan")}
            >
              <i className="fa-solid fa-book"></i>
              <span>Panduan & Terjemah</span>
            </button>
          </div>

          {/* LOADING / ERROR STATE */}
          {loadingPage && (
            <div className="cordoba-loading-state">
              <i className="fa-solid fa-spinner fa-spin loading-icon"></i>
              <p>Mempersiapkan Lembaran Halaman {cordobaPage} Mushaf Al-Hufaz Cordoba...</p>
            </div>
          )}

          {errorPage && (
            <div className="cordoba-error-state">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <p>{errorPage}</p>
              <button
                type="button"
                className="page-go-btn"
                onClick={() => loadCordobaPage(cordobaPage)}
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* THE AUTHENTIC CORDOBA PRINTED MUSHAF SHEET */}
          {!loadingPage && pageData && (
            <div className={`cordoba-display-wrapper ${cordobaSubView === "poster" ? "in-poster-mode" : ""}`}>
              {/* If in Poster Mode: Show Top Floating Callout Badges */}
              {cordobaSubView === "poster" && (
                <div className="poster-top-callouts-bar">
                  <div className="poster-callout-pill pill-kontrol">
                    <span className="callout-pill-title">Kotak Kontrol</span>
                    <span className="callout-pill-desc">Kotak Kontrol Panduan Menghafal yang terdapat pada setiap blok warna.</span>
                    <i className="fa-solid fa-arrow-down-long callout-arrow-down"></i>
                  </div>

                  <div className="poster-callout-pill pill-motivasi">
                    <span className="callout-pill-title">Motivasi</span>
                    <span className="callout-pill-desc">Motivasi pada setiap halaman dari Pakar dan Pengajar Tahfiz Al-Qur'an H. Abdul Aziz Abdur Rauf, Al-Hafiz</span>
                    <i className="fa-solid fa-arrow-down-long callout-arrow-down"></i>
                  </div>

                  <div className="poster-callout-pill pill-tema">
                    <span className="callout-pill-title">Tema Ayat</span>
                    <span className="callout-pill-desc">Tema ayat secara ringkas untuk membantu memahami ayat-ayat yang sedang di hafal pada setiap halaman.</span>
                    <i className="fa-solid fa-arrow-down-long callout-arrow-down"></i>
                  </div>
                </div>
              )}

              <div className="poster-layout-row">
                {/* 1:1 AUTHENTIC PRINTED SHEET */}
                <div className="cordoba-mushaf-sheet">
                  {/* Top Ornate Arabesque Ribbon */}
                  <div className="mushaf-sheet-top-bar">
                    <div className="ornate-wing-left">
                      <span className="left-kemenag-badge">Kemenag RI</span>
                    </div>
                    <div className="ornate-title-cartouche">
                      <h2>{pageMeta.guideTopTitle}</h2>
                    </div>
                    <div className="ornate-method-pill">
                      <span>Metode 5 Jam 1 Halaman</span>
                    </div>
                  </div>

                  {/* THREE-COLUMN BODY (MARGIN KIRI, MUSHAF TENGAH, MARGIN KANAN) */}
                  <div className="sheet-columns-layout">
                    {/* ============================================================== */}
                    {/* 1. MARGIN KIRI: KOTAK KONTROL, KATA KUNCI & TABEL MURAJA'AH    */}
                    {/* ============================================================== */}
                    <div className={`sheet-left-margin ${mobileCordobaTab === "kontrol" ? "show-mobile" : ""}`}>
                      <div className="sheet-left-blocks">
                        {pageBlocks.map((b) => {
                          const keywords = pageMeta.blockKeywords[b.blockId] || b.keywords;
                          const isClosed = !!closedBlocks[b.blockId];
                          const isCurrentBlockPlaying = currentPlayingBlockId === b.blockId;

                          return (
                            <div
                              key={`left-b-${b.blockId}`}
                              className={`sheet-left-block-card ${isCurrentBlockPlaying ? "active-playing-card" : ""}`}
                            >
                              <div className="left-block-head">
                                <div className="left-block-badge-group">
                                  <span className="left-block-num-square">
                                    {b.blockId}
                                  </span>
                                  <span className="left-block-pill-title">
                                    {b.config.name} (1 Jam)
                                  </span>
                                </div>
                                <div className="left-block-actions">
                                  <button
                                    type="button"
                                    className={`left-block-action-btn audio-btn ${isCurrentBlockPlaying && isPlaying ? "is-playing" : ""}`}
                                    onClick={() => playBlockVerses(b)}
                                    title={`Putar semua ayat berurutan di ${b.config.name} (Ayat ${b.startAyat}-${b.endAyat})`}
                                  >
                                    <i className={`fa-solid ${isCurrentBlockPlaying && isPlaying ? "fa-pause" : "fa-volume-high"}`}></i>
                                  </button>
                                  <button
                                    type="button"
                                    className={`left-block-action-btn eye-btn ${isClosed ? "is-closed" : ""}`}
                                    onClick={() => toggleBlockClosure(b.blockId)}
                                    title={isClosed ? "Buka teks Arab" : "Tutup teks Arab untuk tes hafalan 20 menit"}
                                  >
                                    <i className={`fa-solid ${isClosed ? "fa-eye" : "fa-eye-slash"}`}></i>
                                  </button>
                                </div>
                              </div>

                              <div className="left-block-subtitle">
                                Menghafal 1 jam dibagi 2 sesi: 40 mnt & 20 mnt
                              </div>

                              <div className="left-block-checklist-row">
                                <span className="chk-label">Baca Ulang (40 Mnt)</span>
                                <div className="chk-bubbles">
                                  {[1, 2, 3, 4].map((idx) => {
                                    const k = `p${cordobaPage}-b${b.blockId}-baca-${idx}`;
                                    const chk = !!bacaUlangBubbles[k];
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        className={`chk-bubble ${chk ? "checked" : ""}`}
                                        onClick={() => toggleBacaBubble(b.blockId, idx)}
                                        title={`Pengulangan bacaan ke-${idx}`}
                                      >
                                        {chk ? "✓" : ""}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="left-block-checklist-row">
                                <span className="chk-label">Menghafal* (20 Mnt)</span>
                                <div className="chk-bubbles">
                                  {[1, 2, 3, 4].map((idx) => {
                                    const k = `p${cordobaPage}-b${b.blockId}-hafal-${idx}`;
                                    const chk = !!menghafalBubbles[k];
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        className={`chk-bubble ${chk ? "checked" : ""}`}
                                        onClick={() => toggleHafalBubble(b.blockId, idx)}
                                        title={`Sesi menghafal ke-${idx}`}
                                      >
                                        {chk ? "✓" : ""}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Kata Kunci Awal Ayat (Bold Green Arabic Script) */}
                              <div className="left-block-keywords" dir="rtl">
                                {keywords.join(" - ")}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* TABEL MURAJA'AH (5X SEHARI DALAM 1 PEKAN) */}
                      <div className="sheet-murajaah-box">
                        <div className="murajaah-box-header">
                          <span className="murajaah-title">Tabel Muraja'ah</span>
                          <span className="murajaah-sub">Mengingat kembali ayat yang telah dihafal</span>
                        </div>

                        <div className="murajaah-grid-compact">
                          <div className="murajaah-col-headers">
                            <span className="col-empty">Waktu</span>
                            <span>Subuh</span>
                            <span>Dzuhur</span>
                            <span>Ashar</span>
                            <span>Maghrib</span>
                            <span>Isya</span>
                          </div>

                          {["sen", "sel", "rab", "kam", "jum", "sab", "ahd"].map((hari, dIdx) => (
                            <div key={hari} className="murajaah-grid-row">
                              <span className="row-day">{["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Ahad"][dIdx]}</span>
                              {["Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya"].map((waktu) => {
                                const key = `p${cordobaPage}-${waktu}-${hari}`;
                                const isChecked = !!murajaahChecks[key];
                                return (
                                  <button
                                    key={waktu}
                                    type="button"
                                    className={`murajaah-bubble ${isChecked ? "checked" : ""}`}
                                    onClick={() => toggleMurajaahCheck(key)}
                                  >
                                    {isChecked ? "✓" : ""}
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* ============================================================== */}
                    {/* 2. TENGAH: LEMBARAN MUSHAF ASLI 5 BLOK WARNA CONTINUOUS        */}
                    {/* ============================================================== */}
                    <div className={`sheet-center-mushaf ${mobileCordobaTab === "mushaf" ? "show-mobile" : ""}`}>
                      <div className="mushaf-golden-frame">
                        {/* 1. Baris Cepat Kontrol Tutup/Buka & Murottal 5 Blok */}
                        <div className="mushaf-quick-blocks-bar">
                          <div className="quick-blocks-pills-row">
                            {pageBlocks.map((b) => {
                              const isClosed = !!closedBlocks[b.blockId];
                              const isCurrentBlockPlaying = currentPlayingBlockId === b.blockId;
                              return (
                                <div
                                  key={`quick-b-${b.blockId}`}
                                  className={`quick-block-pill band-${b.blockId} ${isCurrentBlockPlaying ? "active-playing-pill" : ""}`}
                                >
                                  <button
                                    type="button"
                                    className={`quick-pill-toggle ${isClosed ? "is-closed" : ""}`}
                                    onClick={() => toggleBlockClosure(b.blockId)}
                                    title={isClosed ? `Buka Teks ${b.config.name}` : `Tutup Teks ${b.config.name} (Uji Hafalan)`}
                                  >
                                    <i className={`fa-solid ${isClosed ? "fa-eye" : "fa-eye-slash"}`}></i>
                                    <span>{b.config.name} ({b.startAyat}-{b.endAyat})</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="quick-pill-audio"
                                    onClick={() => playBlockVerses(b)}
                                    title={`Putar semua ayat berurutan di ${b.config.name}`}
                                  >
                                    <i className={`fa-solid ${isCurrentBlockPlaying && isPlaying ? "fa-pause" : "fa-volume-high"}`}></i>
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          <div className="quick-blocks-actions">
                            <button
                              type="button"
                              className="quick-play-page-btn"
                              onClick={playEntirePage}
                              title="Putar murottal 1 halaman penuh (Ayat 30-37 bersambung)"
                            >
                              <i className="fa-solid fa-play"></i>
                              <span>Putar 1 Halaman Penuh</span>
                            </button>
                          </div>
                        </div>

                        {/* 2. Teks Mushaf Al-Hufaz Autentik: 15 Baris & 5 Blok Warna Solid Nempel Atas-Bawah */}
                        <div className="mushaf-15lines-wrapper">
                          {pageBlocks.map((b) => {
                            const isClosed = !!closedBlocks[b.blockId];
                            const isCurrentPlayingBlock = currentPlayingBlockId === b.blockId;
                            const blockLines = b.lines && b.lines.length > 0 ? b.lines : [];

                            return (
                              <div
                                key={`block-${b.blockId}`}
                                className={`mushaf-color-band band-${b.blockId} ${isClosed ? "is-closed" : ""} ${isCurrentPlayingBlock ? "highlight-active-band" : ""}`}
                              >
                                {blockLines.length > 0 ? (
                                  blockLines.map((line) => (
                                    <div key={`line-${line.lineNumber}`} className="mushaf-15-line" dir="rtl">
                                      {line.words.map((w, wIdx) => {
                                        if (w.charType === "end") {
                                          const isAudioActive = currentPlayingAyah === w.verseNumber;
                                          return (
                                            <span
                                              key={`w-${line.lineNumber}-${wIdx}`}
                                              className={`mushaf-end-marker ${isAudioActive ? "active-audio-marker" : ""}`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (isClosed) {
                                                  toggleBlockClosure(b.blockId);
                                                } else {
                                                  playSingleAyahAudio(w.verseNumber, w.surahNumber, b.blockId);
                                                }
                                              }}
                                              title={`Akhir Ayat ${w.verseNumber} (Klik untuk dengar audio)`}
                                            >
                                              <span className="end-marker-symbol">۝</span>
                                              <span className="end-marker-num">{toArabicNumerals(w.verseNumber)}</span>
                                            </span>
                                          );
                                        }

                                        const isAudioActive = currentPlayingAyah === w.verseNumber;
                                        return (
                                          <span
                                            key={`w-${line.lineNumber}-${wIdx}`}
                                            className={`mushaf-word-item ${isAudioActive ? "active-audio-word" : ""}`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (isClosed) {
                                                toggleBlockClosure(b.blockId);
                                              } else {
                                                playSingleAyahAudio(w.verseNumber, w.surahNumber, b.blockId);
                                              }
                                            }}
                                            title={`Ayat ${w.verseNumber} (Klik untuk dengar audio)`}
                                          >
                                            {w.text}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  ))
                                ) : (
                                  <div className="mushaf-fallback-ayahs-flow" dir="rtl">
                                    {b.ayahs.map((v) => (
                                      <span
                                        key={v.verseKey}
                                        className="mushaf-word-item"
                                        onClick={() => playSingleAyahAudio(v.verseNumber, v.surahNumber, b.blockId)}
                                      >
                                        {v.textUthmani}{" "}
                                        <span className="mushaf-end-marker">
                                          <span className="end-marker-symbol">۝</span>
                                          <span className="end-marker-num">{toArabicNumerals(v.verseNumber)}</span>
                                        </span>{" "}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {isClosed && (
                                  <div className="mushaf-band-blind-overlay">
                                    <button
                                      type="button"
                                      onClick={() => toggleBlockClosure(b.blockId)}
                                      className="blind-reveal-btn"
                                    >
                                      <i className="fa-solid fa-eye"></i> Buka Teks {b.config.name}
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Frame Bottom Navigation / Indicator */}
                      <div className="mushaf-frame-bottom-bar">
                        <div className="bottom-left-guide-text" dir="rtl">
                          {pageMeta.nextPageGuideText}
                        </div>
                        <div className="bottom-center-cartouche">
                          <span className="cartouche-juz">Juz {pageData.juzNumber}</span>
                          <span className="cartouche-divider">•</span>
                          <span className="cartouche-page">Hal. {cordobaPage}</span>
                        </div>
                      </div>
                    </div>

                    {/* ============================================================== */}
                    {/* 3. MARGIN KANAN: PANDUAN, MOTIVASI, & TEMA AYAT                */}
                    {/* ============================================================== */}
                    <div className={`sheet-right-margin ${mobileCordobaTab === "panduan" ? "show-mobile" : ""}`}>
                      {/* Box 1: Metode 5 Jam 1 Halaman */}
                      <div className="sheet-right-card metode-card">
                        <div className="right-card-header blue-header">
                          <span>Metode 5 Jam 1 Halaman</span>
                        </div>
                        <ol className="metode-numbered-list">
                          <li><strong>Syarat Utama:</strong> FOKUS, IKHLAS, DAN TIDAK PULANG KAMPUNG/ONLINE.</li>
                          <li><strong>Menghafal berurutan:</strong> Mulai blok 1 (kuning) 40 menit membaca berulang, kemudian hafalkan tutup-buka 20 menit (fokus mushaf). Buka mushaf jika lupa dan ulangi 3x.</li>
                          <li><strong>Setelah lancar,</strong> lanjutkan blok 2 (hijau) sampai blok 5 (krem).</li>
                          <li><strong>Muraja'ah (mengulang)</strong> hafalan 5 kali sehari dalam seminggu. Gunakan tabel kontrol untuk monitoring.</li>
                        </ol>
                      </div>

                      {/* Box 2: Motivasi */}
                      <div className="sheet-right-card motivasi-card">
                        <div className="right-card-header red-header">
                          <span>Motivasi</span>
                        </div>
                        <p className="motivasi-body-text">
                          "{pageMeta.motivasiQuote}"
                        </p>
                        <div className="motivasi-author-text">
                          - {pageMeta.motivasiAuthor}
                        </div>
                      </div>

                      {/* Box 3: Tema Ayat */}
                      <div className="sheet-right-card tema-card">
                        <div className="right-card-header green-header">
                          <span>Tema Ayat</span>
                        </div>
                        <div className="tema-items-list">
                          {pageMeta.temaAyatItems.map((item, idx) => (
                            <div key={idx} className="tema-sub-item">
                              <strong className="tema-item-title">{item.title}:</strong>
                              <p className="tema-item-desc">{item.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ============================================================== */}
                  {/* 4. FOOTER: KOLOM TERJEMAH KEMENAG RI & CATATAN KAKI            */}
                  {/* ============================================================== */}
                  <div className="sheet-terjemah-section">
                    <div className="terjemah-green-ribbon">
                      <span className="ribbon-title">TERJEMAH</span>
                      <span className="ribbon-sub">Terjemah Kementerian Agama RI</span>
                    </div>

                    {pageMeta.terjemahSubTitle && (
                      <div className="terjemah-editorial-subtitle">
                        <h4>{pageMeta.terjemahSubTitle}</h4>
                      </div>
                    )}

                    <div className="terjemah-three-columns">
                      {/* Column 1 */}
                      <div className="terjemah-col">
                        {col1Verses.map((v) => (
                          <div key={v.verseKey} className="terjemah-verse-entry">
                            <span className="t-ayah-num">({v.verseNumber})</span>
                            <span className="t-ayah-text">{v.translationIndo}</span>
                          </div>
                        ))}
                      </div>

                      {/* Column 2 */}
                      <div className="terjemah-col">
                        {col2Verses.map((v) => (
                          <div key={v.verseKey} className="terjemah-verse-entry">
                            <span className="t-ayah-num">({v.verseNumber})</span>
                            <span className="t-ayah-text">{v.translationIndo}</span>
                          </div>
                        ))}
                      </div>

                      {/* Column 3 */}
                      <div className="terjemah-col">
                        {col3Verses.map((v) => (
                          <div key={v.verseKey} className="terjemah-verse-entry">
                            <span className="t-ayah-num">({v.verseNumber})</span>
                            <span className="t-ayah-text">{v.translationIndo}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footnotes box */}
                    {pageMeta.footnotes && pageMeta.footnotes.length > 0 && (
                      <div className="terjemah-footnotes-box">
                        {pageMeta.footnotes.map((fn, idx) => (
                          <p key={idx} className="footnote-item">{fn}</p>
                        ))}
                      </div>
                    )}

                    {/* Sheet Bottom Branding */}
                    <div className="sheet-bottom-branding">
                      <div className="cordoba-brand-badge">
                        <span className="badge-page-num">{cordobaPage}</span>
                        <span className="badge-brand-title">AL-HUFAZ CORDOBA</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* If in Poster Mode: Show Right Floating Panel with 5 Red Arrows */}
                {cordobaSubView === "poster" && (
                  <div className="poster-right-sidebar">
                    <div className="poster-arrows-stack">
                      <div className="poster-arrow-card arrow-kuning">
                        <div className="arrow-badge-box">
                          <i className="fa-solid fa-arrow-left-long"></i>
                        </div>
                        <div className="arrow-text-box">
                          <strong>BLOK KUNING</strong>
                          <span>DIBACA 1 JAM</span>
                        </div>
                      </div>

                      <div className="poster-arrow-card arrow-hijau">
                        <div className="arrow-badge-box">
                          <i className="fa-solid fa-arrow-left-long"></i>
                        </div>
                        <div className="arrow-text-box">
                          <strong>BLOK HIJAU</strong>
                          <span>DIBACA 1 JAM</span>
                        </div>
                      </div>

                      <div className="poster-arrow-card arrow-biru">
                        <div className="arrow-badge-box">
                          <i className="fa-solid fa-arrow-left-long"></i>
                        </div>
                        <div className="arrow-text-box">
                          <strong>BLOK BIRU</strong>
                          <span>DIBACA 1 JAM</span>
                        </div>
                      </div>

                      <div className="poster-arrow-card arrow-pink">
                        <div className="arrow-badge-box">
                          <i className="fa-solid fa-arrow-left-long"></i>
                        </div>
                        <div className="arrow-text-box">
                          <strong>BLOK PINK</strong>
                          <span>DIBACA 1 JAM</span>
                        </div>
                      </div>

                      <div className="poster-arrow-card arrow-krem">
                        <div className="arrow-badge-box">
                          <i className="fa-solid fa-arrow-left-long"></i>
                        </div>
                        <div className="arrow-text-box">
                          <strong>BLOK KREM</strong>
                          <span>DIBACA 1 JAM</span>
                        </div>
                      </div>
                    </div>

                    <div className="poster-guide-explainer">
                      <div className="explainer-bullet">
                        <i className="fa-solid fa-stopwatch"></i>
                        <p>
                          <strong>Membaca Ulang:</strong> Ayat-ayat yang ada di blok warna sesuai blok warna yang sedang dihafalkan selama <strong>40 Menit</strong>.
                        </p>
                      </div>
                      <div className="explainer-bullet">
                        <i className="fa-solid fa-eye-slash"></i>
                        <p>
                          <strong>Menghafal (dengan TUTUP-BUKA):</strong> Ayat-ayat yang di blok warna sesuai blok warna yang sedang dihafalkan selama <strong>20 Menit</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="poster-bottom-callouts">
                      <div className="poster-callout-pill pill-murajaah">
                        <span className="callout-pill-title">Tabel Muraja'ah</span>
                        <span className="callout-pill-desc">Tabel Muraja'ah 5x sehari dalam 1 pekan</span>
                        <i className="fa-solid fa-arrow-left-long callout-arrow-left"></i>
                      </div>

                      <div className="poster-callout-pill pill-terjemah">
                        <span className="callout-pill-title">Terjemah</span>
                        <span className="callout-pill-desc">Terjemah Kementerian Agama RI</span>
                        <i className="fa-solid fa-arrow-left-long callout-arrow-left"></i>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LIGHTBOX MODAL: LIHAT FOTO ASLI BROSUR */}
          {showOriginalModal && (
            <div className="original-photo-modal-overlay" onClick={() => setShowOriginalModal(false)}>
              <div className="original-photo-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="original-modal-header">
                  <div className="header-title-group">
                    <i className="fa-solid fa-image"></i>
                    <h3>Foto Brosur Cetak Asli Mushaf Al-Hufaz Cordoba</h3>
                  </div>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={() => setShowOriginalModal(false)}
                    title="Tutup Popup"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
                <div className="original-modal-body">
                  <img
                    src="/images/quran/mushaf-alhufaz-cordoba-asli.png"
                    alt="Foto Asli Mushaf Al-Hufaz Cordoba"
                    className="original-brochure-img"
                  />
                </div>
                <div className="original-modal-footer">
                  <p>Arsip Referensi Autentik Brosur Promosi & Panduan Mushaf Tahfiz Cordoba 5 Jam 1 Halaman.</p>
                  <button
                    type="button"
                    className="lightbox-action-btn"
                    onClick={() => setShowOriginalModal(false)}
                  >
                    Tutup Tampilan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: DAFTAR 114 SURAH & TILAWAH STANDAR                                */}
      {/* ========================================================================= */}
      {mainDisplayMode === "surahList" && (
        <>
          {/* Loading Indicator when opening a Surah */}
          {loadingSurah && (
            <div className="quran-loading-overlay">
              <div className="quran-loading-card">
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span className="loading-title">Membuka Surah Al-Qur'an...</span>
                <span className="loading-desc">Memuat ayat, transliterasi Latin, dan murottal resmi</span>
              </div>
            </div>
          )}

          {/* SURAH CATALOG (DISPLAYED ONLY WHEN NO SURAH IS SELECTED) */}
          {!selectedSurah ? (
            <div className="quran-catalog-view">
              {/* Hero Header */}
              <div className="quran-hero-banner">
                <div className="quran-hero-badge">
                  <i className="fa-solid fa-quran"></i>
                  <span>Mushaf Digital Kemenag RI</span>
                </div>
                <h1 className="quran-hero-title">
                  Al-Qur'an <span className="gold-text">Al-Karim</span>
                </h1>
                <p className="quran-hero-desc">
                  Katalog 114 Surah lengkap dengan audio murottal 6 Qari, transliterasi Latin, dan terjemahan resmi Kemenag RI.
                </p>

                {/* Quick Actions Header: Bookmarks & Last Read */}
                <div className="quran-quick-bar">
                  {lastRead && (
                    <button
                      type="button"
                      className="last-read-pill"
                      onClick={() => openSurah(lastRead.surahNumber, lastRead.ayahNumber)}
                    >
                      <div className="last-read-icon">
                        <i className="fa-solid fa-bookmark"></i>
                      </div>
                      <div className="last-read-info">
                        <span className="last-read-label">Terakhir Dibaca</span>
                        <span className="last-read-target">
                          Surah {lastRead.surahName} : Ayat {lastRead.ayahNumber}
                        </span>
                      </div>
                      <i className="fa-solid fa-arrow-right last-read-arrow"></i>
                    </button>
                  )}

                  <button
                    type="button"
                    className="quran-action-btn"
                    onClick={() => {
                      triggerHaptic(10);
                      setShowBookmarksModal(true);
                    }}
                  >
                    <i className="fa-solid fa-star"></i>
                    <span>Bookmark Saya ({bookmarks.length})</span>
                  </button>
                </div>
              </div>

              {/* Controls Deck: Tabs, Search, & Filters */}
              <div className="quran-control-deck">
                {/* Segmented Switcher Tab */}
                <div className="quran-tabs-container">
                  <button
                    type="button"
                    className={`quran-tab-btn ${activeTab === "surah" ? "active" : ""}`}
                    onClick={() => {
                      setActiveTab("surah");
                      triggerHaptic(10);
                    }}
                  >
                    <i className="fa-solid fa-book-open"></i>
                    <span>Daftar Surah (114)</span>
                  </button>
                  <button
                    type="button"
                    className={`quran-tab-btn ${activeTab === "juz" ? "active" : ""}`}
                    onClick={() => {
                      setActiveTab("juz");
                      triggerHaptic(10);
                    }}
                  >
                    <i className="fa-solid fa-layer-group"></i>
                    <span>30 Juz</span>
                  </button>
                </div>

                {/* Search & Filter Bar */}
                {activeTab === "surah" && (
                  <div className="quran-filter-bar">
                    <div className="quran-search-wrapper">
                      <i className="fa-solid fa-magnifying-glass search-icon"></i>
                      <input
                        type="text"
                        className="quran-search-input"
                        placeholder="Cari nama surah, arti, atau nomor (misal: Yasin, Kahf, 36)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          className="search-clear-btn"
                          onClick={() => setSearchQuery("")}
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      )}
                    </div>

                    <div className="quran-chips-group">
                      <button
                        type="button"
                        className={`filter-chip ${revelationFilter === "all" ? "active" : ""}`}
                        onClick={() => {
                          setRevelationFilter("all");
                          triggerHaptic(8);
                        }}
                      >
                        Semua ({QURAN_SURAHS.length})
                      </button>
                      <button
                        type="button"
                        className={`filter-chip chip-mekah ${revelationFilter === "Mekah" ? "active" : ""}`}
                        onClick={() => {
                          setRevelationFilter("Mekah");
                          triggerHaptic(8);
                        }}
                      >
                        <i className="fa-solid fa-kaaba"></i> Makkiyyah (86)
                      </button>
                      <button
                        type="button"
                        className={`filter-chip chip-madinah ${revelationFilter === "Madinah" ? "active" : ""}`}
                        onClick={() => {
                          setRevelationFilter("Madinah");
                          triggerHaptic(8);
                        }}
                      >
                        <i className="fa-solid fa-mosque"></i> Madaniyyah (28)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SURAH GRID LISTING */}
              {activeTab === "surah" && (
                <div className="quran-surah-grid">
                  {filteredSurahs.map((surah) => (
                    <div
                      key={surah.nomor}
                      className="surah-card"
                      onClick={() => openSurah(surah.nomor)}
                    >
                      <div className="surah-card-header">
                        <div className="surah-number-badge">
                          <span className="surah-num">{surah.nomor}</span>
                        </div>
                        <div className="surah-arabic-title">{surah.nama}</div>
                      </div>

                      <div className="surah-card-body">
                        <h3 className="surah-latin-name">{surah.namaLatin}</h3>
                        <p className="surah-meaning">{surah.arti}</p>
                      </div>

                      <div className="surah-card-footer">
                        <span className={`revelation-tag ${surah.tempatTurun.toLowerCase()}`}>
                          {surah.tempatTurun === "Mekah" ? "Makkiyyah" : "Madaniyyah"}
                        </span>
                        <span className="verses-count">
                          <i className="fa-solid fa-lines-leaning"></i> {surah.jumlahAyat} Ayat
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 30 JUZ GRID LISTING */}
              {activeTab === "juz" && (
                <div className="quran-juz-grid">
                  {JUZ_LIST.map((juz) => (
                    <div
                      key={juz.juz}
                      className="juz-card"
                      onClick={() => handleJumpJuz(juz.juz)}
                    >
                      <div className="juz-card-top">
                        <div className="juz-badge">
                          <span>Juz {juz.juz}</span>
                        </div>
                        <div className="juz-icon">
                          <i className="fa-solid fa-book-quran"></i>
                        </div>
                      </div>

                      <h3 className="juz-title">Juz {juz.juz}</h3>
                      <p className="juz-range">{juz.name}</p>

                      <div className="juz-card-action">
                        <span>Buka di Mushaf Al-Hufaz</span>
                        <i className="fa-solid fa-circle-play"></i>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* SURAH READER VIEW (DISPLAYED DIRECTLY AT THE TOP WHEN A SURAH IS CLICKED) */
            <div className="quran-reader-view">
              {/* Sticky Top Reader Bar */}
              <div className="reader-top-bar">
                <button
                  type="button"
                  className="back-btn"
                  onClick={closeSurahReader}
                  title="Kembali ke Daftar Surah"
                >
                  <i className="fa-solid fa-arrow-left"></i>
                  <span className="back-text">Kembali ke Daftar</span>
                </button>

                <div className="reader-center-info">
                  <span className="reader-surah-name">{selectedSurah.namaLatin}</span>
                  <span className="reader-surah-meta">
                    {selectedSurah.nama} • {selectedSurah.jumlahAyat} Ayat • {selectedSurah.tempatTurun}
                  </span>
                </div>

                <button
                  type="button"
                  className="nav-surah-btn cordoba-jump-btn"
                  onClick={() => {
                    const page = SURAH_START_PAGES[selectedSurah.nomor] || 1;
                    setCordobaPage(page);
                    setMainDisplayMode("cordoba");
                  }}
                  title="Buka di Mushaf 5 Blok Al-Hufaz"
                >
                  <i className="fa-solid fa-book-quran"></i>
                  <span>Buka di Al-Hufaz</span>
                </button>
              </div>

              {/* Surah Ornate Header Banner */}
              <div className="surah-ornate-banner">
                <span className="banner-surah-number">SURAH KE-{selectedSurah.nomor}</span>
                <h1 className="banner-arabic-name">{selectedSurah.nama}</h1>
                <h2 className="banner-latin-name">{selectedSurah.namaLatin}</h2>
                <p className="banner-meaning">"{selectedSurah.arti}" • {selectedSurah.jumlahAyat} Ayat • {selectedSurah.tempatTurun}</p>

                {/* Bismillah Banner (except Surah 9 At-Taubah & Surah 1 Al-Fatihah where Bismillah is ayah 1) */}
                {selectedSurah.nomor !== 9 && selectedSurah.nomor !== 1 && (
                  <div className="bismillah-ornament">
                    <span className="bismillah-text">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
                  </div>
                )}
              </div>

              {/* Reader Settings & Audio Bar */}
              <div className="reader-settings-bar">
                <div className="setting-group">
                  <span className="setting-label">Ukuran Font:</span>
                  <div className="btn-group-pill">
                    {(["sm", "md", "lg", "xl"] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        className={`size-btn ${fontSize === sz ? "active" : ""}`}
                        onClick={() => {
                          setFontSize(sz);
                          try {
                            localStorage.setItem("expedient_quran_font_size", sz);
                          } catch {}
                        }}
                      >
                        {sz.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="setting-group">
                  <button
                    type="button"
                    className={`toggle-pill ${showLatin ? "active" : ""}`}
                    onClick={() => setShowLatin(!showLatin)}
                  >
                    <i className="fa-solid fa-font"></i> Latin
                  </button>

                  <button
                    type="button"
                    className={`toggle-pill ${showTranslation ? "active" : ""}`}
                    onClick={() => setShowTranslation(!showTranslation)}
                  >
                    <i className="fa-solid fa-language"></i> Arti
                  </button>

                  <button
                    type="button"
                    className={`toggle-pill ${autoPlayNext ? "active" : ""}`}
                    onClick={() => {
                      const next = !autoPlayNext;
                      setAutoPlayNext(next);
                      showToast(next ? "Otomatis lanjut ayat berikutnya (ON)" : "Otomatis lanjut (OFF)");
                    }}
                    title="Putar otomatis ayat selanjutnya saat ayat saat ini selesai"
                  >
                    <i className="fa-solid fa-forward-step"></i> Auto-Next
                  </button>
                </div>

                <div className="setting-group">
                  <select
                    className="qari-select"
                    value={selectedQari}
                    onChange={(e) => {
                      setSelectedQari(e.target.value);
                      try {
                        localStorage.setItem("expedient_quran_qari", e.target.value);
                      } catch {}
                    }}
                  >
                    {QARI_LIST.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Verses List */}
              <div className={`verses-container font-${fontSize}`}>
                {selectedSurah.ayat.map((ayah) => {
                  const isCurrentPlaying = currentPlayingAyah === ayah.nomorAyat;
                  const isBookmarked = bookmarks.some(
                    (b) => b.surahNumber === selectedSurah.nomor && b.ayahNumber === ayah.nomorAyat
                  );

                  return (
                    <div
                      key={ayah.nomorAyat}
                      id={`ayah-${ayah.nomorAyat}`}
                      className={`ayah-card ${isCurrentPlaying ? "active-playing" : ""}`}
                    >
                      <div className="ayah-header">
                        <div className="ayah-number-badge">
                          <span>{selectedSurah.nomor}:{ayah.nomorAyat}</span>
                        </div>
                        <div className="ayah-action-buttons">
                          <button
                            type="button"
                            className={`ayah-action-btn ${isCurrentPlaying && isPlaying ? "playing-btn" : ""}`}
                            onClick={() => playTilawahAyah(ayah.nomorAyat)}
                            title="Dengar Murottal (Lanjut terus ke ayat berikutnya)"
                          >
                            <i className={`fa-solid ${isCurrentPlaying && isPlaying ? "fa-pause" : "fa-play"}`}></i>
                          </button>

                          <button
                            type="button"
                            className={`ayah-action-btn ${isBookmarked ? "bookmarked-btn" : ""}`}
                            onClick={() => toggleBookmark(ayah)}
                            title={isBookmarked ? "Hapus dari Bookmark" : "Simpan Bookmark"}
                          >
                            <i className={`fa-${isBookmarked ? "solid" : "regular"} fa-star`}></i>
                          </button>

                          <button
                            type="button"
                            className="ayah-action-btn tafsir-btn"
                            onClick={() => openTafsirModal(ayah.nomorAyat)}
                            title="Baca Tafsir Ayat"
                          >
                            <i className="fa-solid fa-book-open-reader"></i>
                          </button>
                        </div>
                      </div>

                      <div className="ayah-arabic-wrapper">
                        <p className="ayah-arabic-text" dir="rtl">
                          {ayah.teksArab}
                          <span className="ayah-end-symbol">
                            ۝<span className="ayah-end-num">{toArabicNumerals(ayah.nomorAyat)}</span>
                          </span>
                        </p>
                      </div>

                      {showLatin && ayah.teksLatin && (
                        <div className="ayah-latin-wrapper">
                          <p className="ayah-latin-text">{ayah.teksLatin}</p>
                        </div>
                      )}

                      {showTranslation && (
                        <div className="ayah-translation-wrapper">
                          <p className="ayah-translation-text">{ayah.teksIndonesia}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Reader Footer Navigation */}
              <div className="reader-footer-nav">
                {selectedSurah.suratSebelumnya ? (
                  <button
                    type="button"
                    className="footer-nav-btn prev"
                    onClick={() => openSurah(selectedSurah.suratSebelumnya ? selectedSurah.suratSebelumnya.nomor : 1)}
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                    <div>
                      <span className="footer-nav-subtitle">Surah Sebelumnya</span>
                      <span className="footer-nav-title">{selectedSurah.suratSebelumnya.namaLatin}</span>
                    </div>
                  </button>
                ) : <div />}

                {selectedSurah.suratSelanjutnya && (
                  <button
                    type="button"
                    className="footer-nav-btn next"
                    onClick={() => openSurah(selectedSurah.suratSelanjutnya ? selectedSurah.suratSelanjutnya.nomor : 114)}
                  >
                    <div>
                      <span className="footer-nav-subtitle">Surah Selanjutnya</span>
                      <span className="footer-nav-title">{selectedSurah.suratSelanjutnya.namaLatin}</span>
                    </div>
                    <i className="fa-solid fa-arrow-right"></i>
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* GLOBAL STICKY FLOATING AUDIO PLAYER BAR                                   */}
      {/* ========================================================================= */}
      {currentPlayingAyah !== null && (
        <div className="quran-floating-audio-bar">
          <div className="audio-bar-content">
            <div className="audio-meta">
              <div className="audio-wave-anim">
                <span className="wave-bar"></span>
                <span className="wave-bar"></span>
                <span className="wave-bar"></span>
              </div>
              <div className="audio-text-info">
                <span className="audio-surah-title">
                  {audioQueue.length > 0 && audioQueue[queueIndex]?.label
                    ? audioQueue[queueIndex].label
                    : selectedSurah
                    ? `${selectedSurah.namaLatin} : Ayat ${currentPlayingAyah}`
                    : `Ayat ${currentPlayingAyah}`}
                  {audioQueue.length > 1 && (
                    <span className="audio-track-counter">
                      {" "}[${queueIndex + 1}/${audioQueue.length}]
                    </span>
                  )}
                </span>
                <span className="audio-qari-name">
                  {QARI_LIST.find((q) => q.id === selectedQari)?.name || "Misyari Rasyid Al-Afasi"}
                </span>
              </div>
            </div>

            <div className="audio-controls-group">
              {audioQueue.length > 1 && (
                <button
                  type="button"
                  className="audio-btn prev-btn"
                  onClick={() => queueIndex > 0 && playQueueItemAtIndex(queueIndex - 1)}
                  disabled={queueIndex <= 0}
                  title="Ayat Sebelumnya"
                >
                  <i className="fa-solid fa-backward-step"></i>
                </button>
              )}

              <button
                type="button"
                className="audio-btn play-main-btn"
                onClick={() => {
                  if (audioRef.current) {
                    if (isPlaying) {
                      audioRef.current.pause();
                      setIsPlaying(false);
                    } else {
                      audioRef.current.play();
                      setIsPlaying(true);
                    }
                  }
                }}
                title={isPlaying ? "Jeda Audio" : "Lanjutkan Audio"}
              >
                <i className={`fa-solid ${isPlaying ? "fa-pause" : "fa-play"}`}></i>
              </button>

              {audioQueue.length > 1 && (
                <button
                  type="button"
                  className="audio-btn next-btn"
                  onClick={() => queueIndex + 1 < audioQueue.length && playQueueItemAtIndex(queueIndex + 1)}
                  disabled={queueIndex + 1 >= audioQueue.length}
                  title="Ayat Berikutnya"
                >
                  <i className="fa-solid fa-forward-step"></i>
                </button>
              )}

              <button
                type="button"
                className={`audio-btn loop-btn ${isLoopingQueue ? "active-loop" : ""}`}
                onClick={() => {
                  const next = !isLoopingQueue;
                  isLoopingRef.current = next;
                  setIsLoopingQueue(next);
                  showToast(next ? "🔁 Loop Murottal Aktif (Akan mengulang terus)" : "➡️ Loop Murottal Nonaktif");
                }}
                title={isLoopingQueue ? "Ulangi Terus (Aktif)" : "Ulangi Terus (Nonaktif)"}
              >
                <i className="fa-solid fa-repeat"></i>
              </button>

              <button
                type="button"
                className="audio-btn close-audio-btn"
                onClick={stopAudio}
                title="Hentikan Audio"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAFSIR MODAL */}
      {showTafsirModal && (
        <div className="quran-modal-overlay" onClick={() => setShowTafsirModal(false)}>
          <div className="quran-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="quran-modal-header">
              <div className="modal-title-group">
                <i className="fa-solid fa-book-open-reader"></i>
                <h3>Tafsir Ringkas Kemenag RI</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowTafsirModal(false)}
                title="Tutup Modal"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="quran-modal-body">
              {loadingTafsir ? (
                <div className="modal-loading-state">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <p>Memuat tafsir ayat...</p>
                </div>
              ) : (
                <>
                  {selectedAyahTafsir && selectedSurah && (
                    <div className="tafsir-ayah-box">
                      <div className="tafsir-arabic" dir="rtl">
                        {selectedSurah.ayat.find((a) => a.nomorAyat === selectedAyahTafsir)?.teksArab}
                      </div>
                      <div className="tafsir-indo">
                        "{selectedSurah.ayat.find((a) => a.nomorAyat === selectedAyahTafsir)?.teksIndonesia}"
                      </div>
                    </div>
                  )}

                  <div className="tafsir-explanation">
                    <h4>Penjelasan Tafsir Resmi:</h4>
                    <p>
                      {tafsirData?.tafsir?.find((t: any) => t.ayat === selectedAyahTafsir)?.teks ||
                        "Tafsir resmi Kemenag RI untuk ayat ini sedang diproses."}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BOOKMARKS MODAL */}
      {showBookmarksModal && (
        <div className="quran-modal-overlay" onClick={() => setShowBookmarksModal(false)}>
          <div className="quran-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="quran-modal-header">
              <div className="modal-title-group">
                <i className="fa-solid fa-star gold-icon"></i>
                <h3>Bookmark & Ayat Favorit</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowBookmarksModal(false)}
                title="Tutup Modal"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="quran-modal-body">
              {bookmarks.length === 0 ? (
                <div className="modal-empty-bookmarks">
                  <i className="fa-regular fa-bookmark empty-icon"></i>
                  <p>Belum ada ayat yang ditandai</p>
                  <span>Ketuk ikon bintang pada ayat saat membaca untuk menyimpannya di sini.</span>
                </div>
              ) : (
                <div className="bookmarks-list">
                  {bookmarks.map((b, idx) => (
                    <div
                      key={idx}
                      className="bookmark-item-card"
                      onClick={() => {
                        setShowBookmarksModal(false);
                        openSurah(b.surahNumber, b.ayahNumber);
                      }}
                    >
                      <div className="bookmark-item-top">
                        <span className="bookmark-surah-tag">
                          Surah {b.surahName} : Ayat {b.ayahNumber}
                        </span>
                        <button
                          type="button"
                          className="bookmark-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = bookmarks.filter((_, i) => i !== idx);
                            setBookmarks(updated);
                            try {
                              localStorage.setItem("expedient_quran_bookmarks", JSON.stringify(updated));
                            } catch {}
                            showToast("Bookmark dihapus");
                          }}
                          title="Hapus bookmark"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                      <p className="bookmark-arabic" dir="rtl">{b.teksArab}</p>
                      <p className="bookmark-translation">{b.teksIndonesia}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

  // Audio Player States
  const [selectedQari, setSelectedQari] = useState<string>("05"); // Default: Misyari Rasyid
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingAyah, setCurrentPlayingAyah] = useState<number | null>(null);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // Initialize from LocalStorage
  useEffect(() => {
    try {
      const savedLastRead = localStorage.getItem("expedient_quran_last_read");
      if (savedLastRead) setLastRead(JSON.parse(savedLastRead));

      const savedBookmarks = localStorage.getItem("expedient_quran_bookmarks");
      if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));

      const savedFontSize = localStorage.getItem("expedient_quran_font_size");
      if (savedFontSize && ["sm", "md", "lg", "xl"].includes(savedFontSize)) {
        setFontSize(savedFontSize as any);
      }

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

  // Page Partition into 5 Colors
  const pageBlocks = useMemo<PageHufazBlock[]>(() => {
    if (!pageData || !pageData.verses) return [];
    return partitionPageInto5Blocks(pageData.verses);
  }, [pageData]);

  // Random / rotating motivasi based on page number
  const currentMotivasi = useMemo(() => {
    return ALHUFAZ_MOTIVASI_LIST[(cordobaPage - 1) % ALHUFAZ_MOTIVASI_LIST.length];
  }, [cordobaPage]);

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

  const toggleBlockBacaUlang = (blockId: number) => {
    triggerHaptic(10);
    const key = `p${cordobaPage}-b${blockId}`;
    setBlockBacaUlangChecks((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("expedient_cordoba_baca_ulang", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const toggleBlockMenghafal = (blockId: number) => {
    triggerHaptic(10);
    const key = `p${cordobaPage}-b${blockId}`;
    setBlockMenghafalChecks((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("expedient_cordoba_menghafal", JSON.stringify(updated));
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
  };

  const formatTimerDisplay = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Audio Playback
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentPlayingAyah(null);
  };

  const playVerseAudio = (audioUrl: string, ayahNum: number, surahNum?: number) => {
    triggerHaptic(10);
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    // Multi-candidate CORS-resilient fallback URLs
    const candidates: string[] = [];
    if (surahNum && ayahNum) {
      candidates.push(getEveryAyahUrl(surahNum, ayahNum, selectedQari));
      if (selectedQari !== "05") {
        candidates.push(getEveryAyahUrl(surahNum, ayahNum, "05"));
      }
      candidates.push(
        `https://verses.quran.com/Alafasy/mp3/${String(surahNum).padStart(3, "0")}${String(ayahNum).padStart(3, "0")}.mp3`
      );
    }
    if (audioUrl && !candidates.includes(audioUrl)) {
      candidates.push(audioUrl);
    }

    let candidateIdx = 0;

    const tryPlay = () => {
      if (candidateIdx >= candidates.length) {
        showToast("Gagal memutar audio murottal");
        setIsPlaying(false);
        setCurrentPlayingAyah(null);
        return;
      }

      const currentTarget = candidates[candidateIdx];
      audio.src = currentTarget;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setCurrentPlayingAyah(ayahNum);
        })
        .catch((err) => {
          console.warn(`Audio playback failed for ${currentTarget}:`, err);
          candidateIdx++;
          tryPlay();
        });
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentPlayingAyah(null);
    };

    audio.onerror = () => {
      candidateIdx++;
      tryPlay();
    };

    tryPlay();
  };

  const playBlockVerses = (block: PageHufazBlock) => {
    triggerHaptic(12);
    if (block.ayahs.length === 0) return;
    showToast(`Memutar murottal ${block.config.name} (Ayat ${block.startAyat} - ${block.endAyat})`);
    playVerseAudio(block.ayahs[0].audioUrl, block.ayahs[0].verseNumber, block.ayahs[0].surahNumber);
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

  // Open Surah in standard reader mode (if user clicks)
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
                className="cordoba-page-nav-btn"
                onClick={() => {
                  if (cordobaPage > 1) loadCordobaPage(cordobaPage - 1);
                }}
                disabled={cordobaPage <= 1 || loadingPage}
                title="Halaman Sebelumnya"
              >
                <i className="fa-solid fa-chevron-left"></i>
                <span className="btn-label-mobile">Hal Sebelumnya</span>
              </button>

              {/* Page Number Quick Selector */}
              <div className="cordoba-page-input-wrapper">
                <span className="page-label">Halaman</span>
                <input
                  type="number"
                  min="1"
                  max="604"
                  className="cordoba-page-input"
                  value={cordobaPage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1 && val <= 604) {
                      setCordobaPage(val);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      loadCordobaPage(cordobaPage);
                    }
                  }}
                />
                <span className="page-total">/ 604</span>
                <button
                  type="button"
                  className="page-go-btn"
                  onClick={() => loadCordobaPage(cordobaPage)}
                  disabled={loadingPage}
                >
                  Buka
                </button>
              </div>

              <button
                type="button"
                className="cordoba-page-nav-btn"
                onClick={() => {
                  if (cordobaPage < 604) loadCordobaPage(cordobaPage + 1);
                }}
                disabled={cordobaPage >= 604 || loadingPage}
                title="Halaman Selanjutnya"
              >
                <span className="btn-label-mobile">Hal Selanjutnya</span>
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>

            {/* Quick Jumps: Surah & Juz Dropdowns */}
            <div className="cordoba-jump-group">
              {/* Surah Jump */}
              <select
                className="cordoba-select"
                onChange={(e) => handleJumpSurah(parseInt(e.target.value, 10))}
                defaultValue=""
              >
                <option value="" disabled>Lompat ke Surah...</option>
                {QURAN_SURAHS.map((s) => (
                  <option key={s.nomor} value={s.nomor}>
                    {s.nomor}. {s.namaLatin} ({s.nama})
                  </option>
                ))}
              </select>

              {/* Juz Jump */}
              <select
                className="cordoba-select"
                onChange={(e) => handleJumpJuz(parseInt(e.target.value, 10))}
                defaultValue=""
              >
                <option value="" disabled>Lompat ke Juz...</option>
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
                <i className="fa-solid fa-diagram-project"></i>
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
                    <div className="ornate-wing-left"></div>
                    <div className="ornate-title-cartouche">
                      <h2>{pageMeta.guideTopTitle}</h2>
                    </div>
                    <div className="ornate-wing-right"></div>
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

                          return (
                            <div key={`left-b-${b.blockId}`} className="sheet-left-block-card">
                              <div className="left-block-head">
                                <span className="left-block-num-square">
                                  {b.blockId}
                                </span>
                                <span className="left-block-pill-title">
                                  {b.config.name} (1 Jam)
                                </span>
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
                          {pageBlocks.map((b) => {
                            const isClosed = !!closedBlocks[b.blockId];
                            return (
                              <div key={`quick-b-${b.blockId}`} className={`quick-block-pill band-${b.blockId}`}>
                                <button
                                  type="button"
                                  className={`quick-pill-toggle ${isClosed ? "is-closed" : ""}`}
                                  onClick={() => toggleBlockClosure(b.blockId)}
                                  title={isClosed ? `Buka Teks ${b.config.name}` : `Tutup Teks ${b.config.name} (Uji Hafalan 20 Menit)`}
                                >
                                  <i className={`fa-solid ${isClosed ? "fa-eye" : "fa-eye-slash"}`}></i>
                                  <span>{b.config.name} ({b.startAyat}-{b.endAyat})</span>
                                </button>
                                <button
                                  type="button"
                                  className="quick-pill-audio"
                                  onClick={() => playBlockVerses(b)}
                                  title={`Putar murottal ${b.config.name}`}
                                >
                                  <i className="fa-solid fa-volume-high"></i>
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* 2. Teks Al-Qur'an Sambung 15 Baris Autentik (1 Baris Bisa 2 Warna Berbeda) */}
                        <div className="mushaf-continuous-text-flow" dir="rtl">
                          {pageBlocks.map((b) => {
                            const isClosed = !!closedBlocks[b.blockId];
                            return b.ayahs.map((v) => {
                              const isCurrentAudio = currentPlayingAyah === v.verseNumber;
                              return (
                                <span
                                  key={v.verseKey}
                                  className={`hufaz-verse-flow-span band-${b.blockId} ${isClosed ? "is-blind-closed" : ""} ${isCurrentAudio ? "highlight-audio" : ""}`}
                                  onClick={() => {
                                    if (isClosed) {
                                      toggleBlockClosure(b.blockId);
                                    } else {
                                      playVerseAudio(v.audioUrl, v.verseNumber, v.surahNumber);
                                    }
                                  }}
                                  title={
                                    isClosed
                                      ? `Ayat ${v.verseNumber} (Teks ${b.config.name} ditutup - klik untuk membuka)`
                                      : `Ayat ${v.verseNumber} (Klik untuk dengar audio murottal)`
                                  }
                                >
                                  <span className="verse-text-content">{v.textUthmani}</span>
                                  {" "}
                                  <span className="verse-golden-ayah-marker" contentEditable={false}>
                                    <span className="ayah-symbol">۝</span>
                                    <span className="ayah-num">{v.verseNumber}</span>
                                  </span>
                                  {" "}
                                </span>
                              );
                            });
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
                          <li><strong>Syarat Utama:</strong> FOKUS, IKHLAS, DAN TIDAK PEGANG HANDPHONE</li>
                          <li><strong>Mengulang bacaan</strong> blok kuning 40 menit, kemudian <strong>menghafalkannya</strong> 20 menit (fokus mushaf). Buka mushaf jika lupa.</li>
                          <li><strong>Lakukan hal yang sama</strong> untuk blok berikutnya sampai terhafal seluruhnya.</li>
                          <li><strong>Muraja'ah (mengulang)</strong> hafalan 5 kali sehari dalam seminggu. Gunakan tabel kontrol untuk memonitoring.</li>
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

                    <div className="terjemah-three-columns">
                      {/* Column 1 */}
                      <div className="terjemah-col">
                        {pageMeta.terjemahSubTitle && (
                          <h4 className="terjemah-col-subheading">{pageMeta.terjemahSubTitle}</h4>
                        )}
                        {col1Verses.map((v) => (
                          <p key={`col1-${v.verseKey}`} className="terjemah-verse-para">
                            <strong className="terjemah-verse-bold">{v.verseNumber}.</strong> {v.translationIndo}
                          </p>
                        ))}
                      </div>

                      {/* Column 2 */}
                      <div className="terjemah-col">
                        {col2Verses.map((v) => (
                          <p key={`col2-${v.verseKey}`} className="terjemah-verse-para">
                            <strong className="terjemah-verse-bold">{v.verseNumber}.</strong> {v.translationIndo}
                          </p>
                        ))}
                      </div>

                      {/* Column 3 */}
                      <div className="terjemah-col">
                        {col3Verses.map((v) => (
                          <p key={`col3-${v.verseKey}`} className="terjemah-verse-para">
                            <strong className="terjemah-verse-bold">{v.verseNumber}.</strong> {v.translationIndo}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Footnotes / Catatan Kaki */}
                    {pageMeta.footnotes && pageMeta.footnotes.length > 0 && (
                      <div className="terjemah-footnotes">
                        {pageMeta.footnotes.map((fn, idx) => (
                          <span key={idx} className="footnote-item">{fn}</span>
                        ))}
                      </div>
                    )}

                    {/* Bottom Watermark Bar */}
                    <div className="sheet-bottom-watermark-bar">
                      <div className="watermark-badge-left">
                        <span className="page-box">{cordobaPage}</span>
                        <span className="brand-name">AL-HUFAZ CORDOBA</span>
                      </div>
                      <div className="watermark-center">
                        <span>Metode 5 Jam 1 Halaman • Penerbit Cordoba</span>
                      </div>
                      <div className="watermark-right">
                        <span>Expedient Generation 43 Digital Replica</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* If in Poster Mode: Show Right Floating Panel with 5 Red Arrows */}
                {cordobaSubView === "poster" && (
                  <div className="poster-right-sidebar">
                    <div className="poster-arrows-stack">
                      <div className="poster-arrow-block arrow-kuning">
                        <i className="fa-solid fa-arrow-left-long arrow-icon"></i>
                        <span className="arrow-block-tag">BLOK KUNING DIBACA 1 JAM</span>
                      </div>

                      <div className="poster-arrow-block arrow-hijau">
                        <i className="fa-solid fa-arrow-left-long arrow-icon"></i>
                        <span className="arrow-block-tag">BLOK HIJAU DIBACA 1 JAM</span>
                      </div>

                      <div className="poster-arrow-block arrow-biru">
                        <i className="fa-solid fa-arrow-left-long arrow-icon"></i>
                        <span className="arrow-block-tag">BLOK BIRU DIBACA 1 JAM</span>
                      </div>

                      <div className="poster-arrow-block arrow-pink">
                        <i className="fa-solid fa-arrow-left-long arrow-icon"></i>
                        <span className="arrow-block-tag">BLOK PINK DIBACA 1 JAM</span>
                      </div>

                      <div className="poster-arrow-block arrow-krem">
                        <i className="fa-solid fa-arrow-left-long arrow-icon"></i>
                        <span className="arrow-block-tag">BLOK KREM DIBACA 1 JAM</span>
                      </div>
                    </div>

                    <div className="poster-orange-guide-card">
                      <div className="guide-card-point">
                        <i className="fa-solid fa-circle-check"></i>
                        <p>
                          <strong>Membaca ulang</strong> ayat-ayat yang di blok warna sesuai blok warna yang sedang dihafalkan selama <strong>40 Menit</strong>.
                        </p>
                      </div>

                      <div className="guide-card-point">
                        <i className="fa-solid fa-circle-check"></i>
                        <p>
                          <strong>Menghafal (dengan TUTUP-BUKA)</strong> ayat-ayat yang di blok warna sesuai blok warna yang sedang dihafalkan selama <strong>20 Menit</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* If in Poster Mode: Show Bottom Callouts */}
              {cordobaSubView === "poster" && (
                <div className="poster-bottom-callouts-bar">
                  <div className="poster-callout-pill pill-murajaah">
                    <i className="fa-solid fa-arrow-up-long callout-arrow-up"></i>
                    <span className="callout-pill-title">Tabel Muraja'ah</span>
                    <span className="callout-pill-desc">Tabel Muraja'ah 5 x sehari dalam 1 pekan</span>
                  </div>

                  <div className="poster-callout-pill pill-terjemah">
                    <i className="fa-solid fa-arrow-up-long callout-arrow-up"></i>
                    <span className="callout-pill-title">Terjemah</span>
                    <span className="callout-pill-desc">Terjemah Kementerian Agama RI</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LIGHTBOX MODAL: LIHAT FOTO BROSUR ASLI */}
          {showOriginalModal && (
            <div className="photo-lightbox-backdrop" onClick={() => setShowOriginalModal(false)}>
              <div className="photo-lightbox-modal" onClick={(e) => e.stopPropagation()}>
                <div className="lightbox-modal-header">
                  <div className="lightbox-modal-title">
                    <i className="fa-solid fa-image"></i>
                    <span>Foto Brosur Asli Mushaf Al-Hufaz Cordoba</span>
                  </div>
                  <button
                    type="button"
                    className="lightbox-close-btn"
                    onClick={() => setShowOriginalModal(false)}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                <div className="lightbox-modal-body">
                  <img
                    src="/images/quran/mushaf-alhufaz-cordoba-asli.png"
                    alt="Diagram Mushaf Al-Hufaz Cordoba Asli"
                    className="lightbox-img"
                  />
                </div>

                <div className="lightbox-modal-footer">
                  <p>
                    Diagram Resmi Mushaf Al-Qur'an Al-Hufaz (Penerbit Cordoba) - Metode 5 Jam Hafal 1 Halaman.
                  </p>
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
      )}

      {/* SURAH READER VIEW (IF OPENED FROM SURAH LIST) */}
      {selectedSurah && (
        <div className="quran-reader-view">
          <div className="reader-top-bar">
            <button
              type="button"
              className="back-btn"
              onClick={closeSurahReader}
              title="Kembali ke Daftar Surah"
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span className="back-text">Kembali</span>
            </button>

            <div className="reader-center-info">
              <span className="reader-surah-name">{selectedSurah.namaLatin}</span>
              <span className="reader-surah-meta">
                {selectedSurah.nama} • {selectedSurah.jumlahAyat} Ayat
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
              <span>Mode Al-Hufaz</span>
            </button>
          </div>

          {/* Verses Container */}
          <div className={`verses-container font-${fontSize}`}>
            {selectedSurah.ayat.map((ayah) => (
              <div
                key={ayah.nomorAyat}
                id={`ayah-${ayah.nomorAyat}`}
                className="ayah-card"
              >
                <div className="ayah-header">
                  <div className="ayah-number-badge">
                    <span>{selectedSurah.nomor}:{ayah.nomorAyat}</span>
                  </div>
                  <div className="ayah-action-buttons">
                    <button
                      type="button"
                      className={`ayah-action-btn ${currentPlayingAyah === ayah.nomorAyat && isPlaying ? "playing-btn" : ""}`}
                      onClick={() => playVerseAudio(ayah.audio[selectedQari], ayah.nomorAyat, selectedSurah.nomor)}
                      title="Dengar Murottal"
                    >
                      <i className={`fa-solid ${currentPlayingAyah === ayah.nomorAyat && isPlaying ? "fa-pause" : "fa-play"}`}></i>
                    </button>
                  </div>
                </div>
                <div className="ayah-arabic-wrapper">
                  <p className="ayah-arabic-text" dir="rtl">
                    {ayah.teksArab}
                    <span className="ayah-end-symbol">
                      ۝<span className="ayah-end-num">{ayah.nomorAyat}</span>
                    </span>
                  </p>
                </div>
                <div className="ayah-translation-wrapper">
                  <p className="ayah-translation-text">{ayah.teksIndonesia}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STICKY FLOATING AUDIO PLAYER BAR (FOR BOTH CORDOBA & TILAWAH) */}
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
                  {selectedSurah ? `${selectedSurah.namaLatin} : Ayat ${currentPlayingAyah}` : `Ayat ${currentPlayingAyah}`}
                </span>
                <span className="audio-qari-name">
                  {QARI_LIST.find((q) => q.id === selectedQari)?.name || "Misyari Rasyid Al-Afasi"}
                </span>
              </div>
            </div>

            <div className="audio-controls-group">
              <button
                type="button"
                className="audio-play-pause-btn"
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
              <button
                type="button"
                className="audio-stop-btn"
                onClick={stopAudio}
                title="Hentikan Audio"
              >
                <i className="fa-solid fa-stop"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
} from "@/lib/data/alhufazData";
import "./quran.css";

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

  // Closed / Tutup Blocks for 20m memorization test
  const [closedBlocks, setClosedBlocks] = useState<{ [blockId: number]: boolean }>({});
  const [pageTikrar, setPageTikrar] = useState<{ [key: string]: number }>({});
  const [murajaahChecks, setMurajaahChecks] = useState<{ [key: string]: boolean }>({});
  const [blockBacaUlangChecks, setBlockBacaUlangChecks] = useState<{ [key: string]: boolean }>({});
  const [blockMenghafalChecks, setBlockMenghafalChecks] = useState<{ [key: string]: boolean }>({});

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

  const playVerseAudio = (audioUrl: string, ayahNum: number) => {
    triggerHaptic(10);
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    audio.src = audioUrl;
    audio.play().then(() => {
      setIsPlaying(true);
      setCurrentPlayingAyah(ayahNum);
    }).catch(() => {
      showToast("Gagal memutar audio murottal");
      setIsPlaying(false);
    });

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentPlayingAyah(null);
    };
  };

  const playBlockVerses = (block: PageHufazBlock) => {
    triggerHaptic(12);
    if (block.ayahs.length === 0) return;
    showToast(`Memutar murottal ${block.config.name} (Ayat ${block.startAyat} - ${block.endAyat})`);
    playVerseAudio(block.ayahs[0].audioUrl, block.ayahs[0].verseNumber);
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
            <div className="cordoba-mushaf-sheet">
              {/* Top Ornate Header */}
              <div className="mushaf-page-top-header">
                <div className="header-juz-badge">
                  <span>JUZ {pageData.juzNumber}</span>
                </div>

                <div className="header-surah-title">
                  <h2>{pageData.headerTitle}</h2>
                </div>

                <div className="header-method-badge">
                  <i className="fa-solid fa-clock"></i>
                  <span>Metode 5 Jam Hafal 1 Halaman</span>
                </div>
              </div>

              {/* THREE-COLUMN BODY (MARGIN KIRI, MUSHAF TENGAH, MARGIN KANAN) */}
              <div className="mushaf-page-body-grid">
                {/* ============================================================== */}
                {/* 1. MARGIN KIRI: KOTAK KONTROL, KATA KUNCI & TABEL MURAJA'AH    */}
                {/* ============================================================== */}
                <div className={`mushaf-left-margin ${mobileCordobaTab === "kontrol" ? "show-mobile" : ""}`}>
                  <div className="left-margin-header">
                    <i className="fa-solid fa-list-check"></i>
                    <span>KOTAK KONTROL HAFALAN</span>
                  </div>

                  {/* 5 Block Control Boxes */}
                  <div className="block-control-boxes-list">
                    {pageBlocks.map((b) => {
                      const bacaUlangChecked = !!blockBacaUlangChecks[`p${cordobaPage}-b${b.blockId}`];
                      const menghafalChecked = !!blockMenghafalChecks[`p${cordobaPage}-b${b.blockId}`];

                      return (
                        <div
                          key={`ctrl-box-${b.blockId}`}
                          className="block-control-card"
                          style={{ borderColor: b.config.borderColor }}
                        >
                          <div
                            className="ctrl-card-title"
                            style={{ backgroundColor: b.config.badgeBg, color: b.config.colorHex }}
                          >
                            <span>{b.config.name} (1 Jam)</span>
                          </div>

                          <div className="ctrl-checkboxes">
                            <label className="ctrl-check-item">
                              <input
                                type="checkbox"
                                checked={bacaUlangChecked}
                                onChange={() => toggleBlockBacaUlang(b.blockId)}
                              />
                              <span>Baca Ulang (40m)</span>
                            </label>
                            <label className="ctrl-check-item">
                              <input
                                type="checkbox"
                                checked={menghafalChecked}
                                onChange={() => toggleBlockMenghafal(b.blockId)}
                              />
                              <span>Menghafal (20m)</span>
                            </label>
                          </div>

                          {/* Kata Kunci Awal Ayat (Printed Bold Vertically) */}
                          <div className="ctrl-keywords-section">
                            <span className="keywords-label">Awal Ayat:</span>
                            <div className="keywords-tags">
                              {b.keywords.map((kw, i) => (
                                <span key={i} className="keyword-arabic-badge" dir="rtl">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* TABEL MURAJA'AH 5X SEHARI DALAM 1 PEKAN */}
                  <div className="murajaah-table-card">
                    <div className="murajaah-card-title">
                      <i className="fa-solid fa-calendar-check"></i>
                      <span>TABEL MURAJA'AH (5x Sehari)</span>
                    </div>

                    <div className="murajaah-grid">
                      <div className="murajaah-row header-row">
                        <span className="waktu-header">Waktu</span>
                        <span>Sen</span>
                        <span>Sel</span>
                        <span>Rab</span>
                        <span>Kam</span>
                        <span>Jum</span>
                        <span>Sab</span>
                        <span>Ahad</span>
                      </div>

                      {["Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya"].map((waktu) => (
                        <div key={waktu} className="murajaah-row">
                          <span className="waktu-col">{waktu}</span>
                          {["sen", "sel", "rab", "kam", "jum", "sab", "ahd"].map((hari) => {
                            const key = `p${cordobaPage}-${waktu}-${hari}`;
                            const isChecked = !!murajaahChecks[key];
                            return (
                              <button
                                key={hari}
                                type="button"
                                className={`murajaah-check-box ${isChecked ? "checked" : ""}`}
                                onClick={() => toggleMurajaahCheck(key)}
                              >
                                {isChecked && <i className="fa-solid fa-check"></i>}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ============================================================== */}
                {/* 2. TENGAH: LEMBARAN MUSHAF ASLI 5 BLOK WARNA CORDOBA           */}
                {/* ============================================================== */}
                <div className={`mushaf-center-content ${mobileCordobaTab === "mushaf" ? "show-mobile" : ""}`}>
                  <div className="mushaf-ornate-inner-border">
                    {pageBlocks.map((b) => {
                      const isClosed = !!closedBlocks[b.blockId];

                      return (
                        <div
                          key={`mushaf-block-${b.blockId}`}
                          className="mushaf-color-block"
                          style={{
                            backgroundColor: b.config.lightBg,
                            borderLeftColor: b.config.borderColor,
                          }}
                        >
                          {/* Block Quick Control Header */}
                          <div className="mushaf-block-quick-bar">
                            <div className="block-tag-left">
                              <span
                                className="block-pill-indicator"
                                style={{ backgroundColor: b.config.colorHex }}
                              >
                                {b.blockId}
                              </span>
                              <span className="block-color-name">
                                {b.config.name} • Ayat {b.startAyat} - {b.endAyat}
                              </span>
                            </div>

                            <div className="block-actions-right">
                              {/* TUTUP / BUKA BUTTON (Sesuai Panah Gambar: Menghafal Tutup-Buka) */}
                              <button
                                type="button"
                                className={`block-tutup-buka-btn ${isClosed ? "closed" : ""}`}
                                onClick={() => toggleBlockClosure(b.blockId)}
                                title="Tutup teks Arab saat sesi menghafal 20 menit"
                              >
                                <i className={`fa-solid ${isClosed ? "fa-eye" : "fa-eye-slash"}`}></i>
                                <span>{isClosed ? "BUKA BLOK" : "TUTUP BLOK"}</span>
                              </button>

                              {/* Play Block Audio */}
                              <button
                                type="button"
                                className="block-murottal-btn"
                                onClick={() => playBlockVerses(b)}
                                title="Putar Murottal Ayat dalam Blok ini"
                              >
                                <i className="fa-solid fa-play"></i>
                              </button>
                            </div>
                          </div>

                          {/* Arabic Quranic Verses in this Block */}
                          <div className="block-verses-content">
                            {isClosed ? (
                              <div
                                className="block-blind-shield"
                                onClick={() => toggleBlockClosure(b.blockId)}
                              >
                                <i className="fa-solid fa-eye-slash shield-icon"></i>
                                <span className="shield-title">
                                  Teks {b.config.name} Ditutup
                                </span>
                                <span className="shield-desc">
                                  Sedang dalam sesi menghafal 20 menit. Ketuk untuk membuka dan memeriksa hafalan.
                                </span>
                              </div>
                            ) : (
                              <div className="block-arabic-flow" dir="rtl">
                                {b.ayahs.map((v) => (
                                  <span
                                    key={v.verseKey}
                                    className={`arabic-ayah-span ${
                                      currentPlayingAyah === v.verseNumber ? "playing-highlight" : ""
                                    }`}
                                    onClick={() => playVerseAudio(v.audioUrl, v.verseNumber)}
                                    title={`Ayat ${v.verseNumber} (Klik untuk dengar audio)`}
                                  >
                                    {v.textUthmani}{" "}
                                    <span className="cordoba-verse-marker">
                                      ۝<span className="marker-digit">{v.verseNumber}</span>
                                    </span>{" "}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ============================================================== */}
                {/* 3. MARGIN KANAN: PANDUAN, MOTIVASI, & TEMA AYAT                */}
                {/* ============================================================== */}
                <div className={`mushaf-right-margin ${mobileCordobaTab === "panduan" ? "show-mobile" : ""}`}>
                  {/* Panduan 5 Jam 1 Halaman */}
                  <div className="panduan-card">
                    <div className="panduan-header">
                      <i className="fa-solid fa-graduation-cap"></i>
                      <span>METODE 5 JAM 1 HALAMAN</span>
                    </div>
                    <ol className="panduan-list">
                      <li>
                        <strong>Syarat Utama:</strong> FOKUS, IKHLAS, DAN TIDAK MEMEGANG HANDPHONE.
                      </li>
                      <li>
                        <strong>Membaca Ulang:</strong> Baca berulang ayat di blok warna selama <strong>40 Menit</strong>.
                      </li>
                      <li>
                        <strong>Menghafal (TUTUP-BUKA):</strong> Hafalkan dengan menutup mushaf selama <strong>20 Menit</strong>. Buka mushaf jika ragu untuk cek hafalan.
                      </li>
                      <li>
                        <strong>Muraja'ah:</strong> Ulangi 5 kali sehari dalam sepekan di setiap waktu shalat.
                      </li>
                    </ol>
                  </div>

                  {/* Kotak Motivasi Al-Hafiz */}
                  <div className="motivasi-card">
                    <div className="motivasi-header">
                      <i className="fa-solid fa-feather-pointed"></i>
                      <span>MOTIVASI AL-HAFIZ</span>
                    </div>
                    <div className="motivasi-author">
                      H. Abdul Aziz Abdur Rauf, Lc., Al-Hafiz
                    </div>
                    <p className="motivasi-quote">"{currentMotivasi}"</p>
                  </div>

                  {/* Tema Ayat */}
                  <div className="tema-ayat-card">
                    <div className="tema-header">
                      <i className="fa-solid fa-lightbulb"></i>
                      <span>TEMA AYAT HALAMAN INI</span>
                    </div>
                    <div className="tema-content">
                      <h4>{pageData.primarySurah.name}: {pageData.verses[0].verseNumber} - {pageData.verses[pageData.verses.length - 1].verseNumber}</h4>
                      <p>
                        Ayat-ayat pada halaman ini mengandung petunjuk agung seputar {pageData.primarySurah.name} ({pageData.primarySurah.arti}), mengokohkan tauhid, risalah kenabian, serta tadabbur hukum dan hikmah kehidupan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* 4. FOOTER: KOLOM TERJEMAH KEMENAG RI & NOMOR HALAMAN           */}
              {/* ============================================================== */}
              <div className="mushaf-page-footer">
                <div className="footer-terjemah-header">
                  <i className="fa-solid fa-book-open"></i>
                  <span>TERJEMAH RESMI KEMENTERIAN AGAMA RI (HALAMAN {cordobaPage})</span>
                </div>

                <div className="footer-terjemah-grid">
                  {pageData.verses.map((v) => (
                    <div key={`trans-${v.verseKey}`} className="terjemah-col-item">
                      <span className="terjemah-ayah-badge">
                        [{v.verseNumber}]
                      </span>
                      <span className="terjemah-text-body">
                        {v.translationIndo}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mushaf-page-bottom-number">
                  <span className="page-num-circle">{cordobaPage}</span>
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
                      className="ayah-action-btn"
                      onClick={() => playVerseAudio(ayah.audio[selectedQari], ayah.nomorAyat)}
                    >
                      <i className="fa-solid fa-play"></i>
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
    </div>
  );
}

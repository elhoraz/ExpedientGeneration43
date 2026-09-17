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
  // Navigation & View States
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
      if (savedLastRead) {
        setLastRead(JSON.parse(savedLastRead));
      }

      const savedBookmarks = localStorage.getItem("expedient_quran_bookmarks");
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }

      const savedFontSize = localStorage.getItem("expedient_quran_font_size");
      if (savedFontSize && ["sm", "md", "lg", "xl"].includes(savedFontSize)) {
        setFontSize(savedFontSize as any);
      }

      const savedQari = localStorage.getItem("expedient_quran_qari");
      if (savedQari && QARI_LIST.some((q) => q.id === savedQari)) {
        setSelectedQari(savedQari);
      }
    } catch (e) {
      console.warn("Error reading Quran preferences from localStorage:", e);
    }
  }, []);

  // Save Settings Changes
  const handleSetFontSize = (size: "sm" | "md" | "lg" | "xl") => {
    setFontSize(size);
    try {
      localStorage.setItem("expedient_quran_font_size", size);
    } catch {}
  };

  const handleSetQari = (qariId: string) => {
    setSelectedQari(qariId);
    try {
      localStorage.setItem("expedient_quran_qari", qariId);
    } catch {}
    // If playing, switch audio source smoothly
    if (isPlaying && currentPlayingAyah !== null && selectedSurah) {
      const ayah = selectedSurah.ayat.find((a) => a.nomorAyat === currentPlayingAyah);
      if (ayah && ayah.audio[qariId]) {
        playAyahAudio(currentPlayingAyah, qariId);
      }
    }
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

  // Open Surah Detail
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
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Save as last read
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

      // Scroll to target ayah if provided
      if (targetAyahNumber && targetAyahNumber > 1) {
        setTimeout(() => {
          const el = document.getElementById(`ayah-${targetAyahNumber}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 500);
      }
    } catch (err: any) {
      console.error("Open surah error:", err);
      setErrorSurah(err?.message || "Koneksi terganggu. Silakan coba lagi.");
    } finally {
      setLoadingSurah(false);
    }
  };

  // Close Reader & Return to List
  const closeSurahReader = () => {
    triggerHaptic(12);
    stopAudio();
    setSelectedSurah(null);
    setTafsirData(null);
  };

  // Audio Controls
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentPlayingAyah(null);
  };

  const playAyahAudio = (ayahNumber: number, qariId = selectedQari) => {
    if (!selectedSurah) return;
    const ayah = selectedSurah.ayat.find((a) => a.nomorAyat === ayahNumber);
    if (!ayah || !ayah.audio || !ayah.audio[qariId]) {
      showToast("Audio untuk ayat ini belum tersedia");
      return;
    }

    triggerHaptic(10);
    const audioUrl = ayah.audio[qariId];

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    audio.src = audioUrl;
    audio.play().then(() => {
      setIsPlaying(true);
      setCurrentPlayingAyah(ayahNumber);

      // Auto-scroll to active ayah
      const el = document.getElementById(`ayah-${ayahNumber}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }).catch((e) => {
      console.error("Play audio failed:", e);
      showToast("Gagal memutar audio. Periksa koneksi internet.");
      setIsPlaying(false);
    });

    audio.onended = () => {
      if (autoPlayNext && selectedSurah) {
        const nextAyahNum = ayahNumber + 1;
        if (nextAyahNum <= selectedSurah.jumlahAyat) {
          playAyahAudio(nextAyahNum, qariId);
        } else {
          stopAudio();
          showToast(`Selesai membaca Surah ${selectedSurah.namaLatin}`);
        }
      } else {
        stopAudio();
      }
    };
  };

  const togglePlayCurrent = () => {
    if (!selectedSurah) return;
    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentPlayingAyah !== null) {
        if (audioRef.current && audioRef.current.src) {
          audioRef.current.play();
          setIsPlaying(true);
        } else {
          playAyahAudio(currentPlayingAyah);
        }
      } else {
        playAyahAudio(1);
      }
    }
  };

  const playNextAyah = () => {
    if (!selectedSurah || currentPlayingAyah === null) return;
    const next = currentPlayingAyah + 1;
    if (next <= selectedSurah.jumlahAyat) {
      playAyahAudio(next);
    }
  };

  const playPrevAyah = () => {
    if (!selectedSurah || currentPlayingAyah === null) return;
    const prev = currentPlayingAyah - 1;
    if (prev >= 1) {
      playAyahAudio(prev);
    }
  };

  // Bookmark toggler
  const toggleBookmark = (ayah: QuranAyatItem) => {
    if (!selectedSurah) return;
    triggerHaptic(15);
    const existingIndex = bookmarks.findIndex(
      (b) => b.surahNumber === selectedSurah.nomor && b.ayahNumber === ayah.nomorAyat
    );

    let updated: BookmarkItem[];
    if (existingIndex >= 0) {
      updated = bookmarks.filter((_, idx) => idx !== existingIndex);
      showToast(`Dihapus dari Bookmark (Ayat ${ayah.nomorAyat})`);
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
      showToast(`Tersimpan di Bookmark (Ayat ${ayah.nomorAyat})`);
    }

    setBookmarks(updated);
    try {
      localStorage.setItem("expedient_quran_bookmarks", JSON.stringify(updated));
    } catch {}
  };

  const isBookmarked = (ayahNumber: number) => {
    if (!selectedSurah) return false;
    return bookmarks.some(
      (b) => b.surahNumber === selectedSurah.nomor && b.ayahNumber === ayahNumber
    );
  };

  // Copy Ayah to Clipboard
  const copyAyah = (ayah: QuranAyatItem) => {
    if (!selectedSurah) return;
    triggerHaptic(10);
    const textToCopy = `"${ayah.teksArab}"\n\n(${selectedSurah.namaLatin} ${selectedSurah.nomor}:${ayah.nomorAyat})\n\nArtinya:\n"${ayah.teksIndonesia}"\n\n— Via Al-Qur'an Digital Expedient 43`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast(`Ayat ${ayah.nomorAyat} berhasil disalin!`);
    }).catch(() => {
      showToast("Gagal menyalin teks.");
    });
  };

  // Open Tafsir Modal
  const openTafsir = async (ayahNumber: number) => {
    if (!selectedSurah) return;
    triggerHaptic(12);
    setSelectedAyahTafsir(ayahNumber);
    setShowTafsirModal(true);

    if (!tafsirData || tafsirData.nomor !== selectedSurah.nomor) {
      setLoadingTafsir(true);
      try {
        const res = await fetch(`/api/quran/tafsir/${selectedSurah.nomor}`);
        const json = await res.json();
        if (json.success && json.data) {
          setTafsirData(json.data);
        }
      } catch (e) {
        console.error("Fetch tafsir error:", e);
      } finally {
        setLoadingTafsir(false);
      }
    }
  };

  // Jump from Juz to Surah
  const handleJuzClick = (juz: typeof JUZ_LIST[0]) => {
    openSurah(juz.startSurah, juz.startAyat);
  };

  return (
    <div className="quran-page-root">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="quran-toast">
          <i className="fa-solid fa-circle-check"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* VIEW 1: SURAH & JUZ CATALOG VIEW */}
      {!selectedSurah && (
        <div className="quran-catalog-view">
          {/* Hero Header */}
          <div className="quran-hero-banner">
            <div className="quran-hero-badge">
              <i className="fa-solid fa-quran"></i>
              <span>Mushaf Digital Resmi Kemenag RI</span>
            </div>
            <h1 className="quran-hero-title">
              Al-Qur'an <span className="gold-text">Al-Karim</span>
            </h1>
            <p className="quran-hero-desc">
              Pedoman hidup, penyejuk kalbu, dan pelita peradaban. Baca dan tadabburi 30 Juz & 114 Surah kalamullah dengan tilawah murottal syahdu.
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

            {/* Search & Filter Bar (Only in Surah mode) */}
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
              {filteredSurahs.length === 0 ? (
                <div className="quran-empty-state">
                  <i className="fa-solid fa-book-skull empty-icon"></i>
                  <h3>Surah Tidak Ditemukan</h3>
                  <p>Tidak ada surah yang cocok dengan kata kunci "{searchQuery}".</p>
                  <button
                    type="button"
                    className="reset-search-btn"
                    onClick={() => {
                      setSearchQuery("");
                      setRevelationFilter("all");
                    }}
                  >
                    Reset Pencarian
                  </button>
                </div>
              ) : (
                filteredSurahs.map((surah) => (
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

                    <div className="surah-card-glow"></div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 30 JUZ GRID LISTING */}
          {activeTab === "juz" && (
            <div className="quran-juz-grid">
              {JUZ_LIST.map((juz) => (
                <div
                  key={juz.juz}
                  className="juz-card"
                  onClick={() => handleJuzClick(juz)}
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
                    <span>Mulai Tilawah</span>
                    <i className="fa-solid fa-circle-play"></i>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: SURAH READER MODE */}
      {selectedSurah && (
        <div className="quran-reader-view">
          {/* Sticky Reader Top Bar */}
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

            {/* Quick Actions in Top Bar */}
            <div className="reader-top-actions">
              {/* Prev / Next Surah */}
              {selectedSurah.suratSebelumnya && (
                <button
                  type="button"
                  className="nav-surah-btn"
                  title={`Ke Surah ${selectedSurah.suratSebelumnya.namaLatin}`}
                  onClick={() => openSurah((selectedSurah.suratSebelumnya as any).nomor)}
                >
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
              )}

              {selectedSurah.suratSelanjutnya && (
                <button
                  type="button"
                  className="nav-surah-btn"
                  title={`Ke Surah ${selectedSurah.suratSelanjutnya.namaLatin}`}
                  onClick={() => openSurah((selectedSurah.suratSelanjutnya as any).nomor)}
                >
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              )}
            </div>
          </div>

          {/* Reader Sub-Control Bar: Settings */}
          <div className="reader-settings-bar">
            {/* Font Size Adjuster */}
            <div className="setting-group">
              <span className="setting-label">Ukuran Huruf:</span>
              <div className="btn-group-pill">
                <button
                  type="button"
                  className={`size-btn ${fontSize === "sm" ? "active" : ""}`}
                  onClick={() => handleSetFontSize("sm")}
                >
                  A-
                </button>
                <button
                  type="button"
                  className={`size-btn ${fontSize === "md" ? "active" : ""}`}
                  onClick={() => handleSetFontSize("md")}
                >
                  A
                </button>
                <button
                  type="button"
                  className={`size-btn ${fontSize === "lg" ? "active" : ""}`}
                  onClick={() => handleSetFontSize("lg")}
                >
                  A+
                </button>
                <button
                  type="button"
                  className={`size-btn ${fontSize === "xl" ? "active" : ""}`}
                  onClick={() => handleSetFontSize("xl")}
                >
                  A++
                </button>
              </div>
            </div>

            {/* View Mode Toggles */}
            <div className="setting-group toggles-group">
              <button
                type="button"
                className={`toggle-pill ${showLatin ? "active" : ""}`}
                onClick={() => setShowLatin(!showLatin)}
              >
                <i className={`fa-solid ${showLatin ? "fa-check" : "fa-xmark"}`}></i>
                <span>Latin</span>
              </button>

              <button
                type="button"
                className={`toggle-pill ${showTranslation ? "active" : ""}`}
                onClick={() => setShowTranslation(!showTranslation)}
              >
                <i className={`fa-solid ${showTranslation ? "fa-check" : "fa-xmark"}`}></i>
                <span>Terjemahan</span>
              </button>

              <button
                type="button"
                className={`toggle-pill mushaf-toggle ${isMushafMode ? "active" : ""}`}
                onClick={() => {
                  const next = !isMushafMode;
                  setIsMushafMode(next);
                  if (next) {
                    setShowLatin(false);
                    setShowTranslation(false);
                  } else {
                    setShowLatin(true);
                    setShowTranslation(true);
                  }
                }}
              >
                <i className="fa-solid fa-quran"></i>
                <span>Mode Mushaf</span>
              </button>
            </div>

            {/* Qari Selector */}
            <div className="setting-group qari-group">
              <span className="setting-label">Qari:</span>
              <select
                className="qari-select"
                value={selectedQari}
                onChange={(e) => handleSetQari(e.target.value)}
              >
                {QARI_LIST.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Surah Banner Card */}
          <div className="surah-ornate-banner">
            <div className="banner-inner">
              <div className="banner-surah-number">Surah Ke-{selectedSurah.nomor}</div>
              <h2 className="banner-arabic-name">{selectedSurah.nama}</h2>
              <h1 className="banner-latin-name">{selectedSurah.namaLatin}</h1>
              <p className="banner-meaning">
                "{selectedSurah.arti}" • {selectedSurah.tempatTurun === "Mekah" ? "Makkiyyah" : "Madaniyyah"} • {selectedSurah.jumlahAyat} Ayat
              </p>

              {/* Bismillah (Except Surah At-Taubah #9 & Al-Fatihah #1 which already has bismillah as verse 1) */}
              {selectedSurah.nomor !== 9 && selectedSurah.nomor !== 1 && (
                <div className="bismillah-ornament">
                  <span className="bismillah-text">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</span>
                </div>
              )}
            </div>
          </div>

          {/* Verses Container */}
          <div className={`verses-container font-${fontSize} ${isMushafMode ? "mushaf-layout" : ""}`}>
            {selectedSurah.ayat.map((ayah) => {
              const isPlayingThis = currentPlayingAyah === ayah.nomorAyat;
              const bookmarked = isBookmarked(ayah.nomorAyat);

              return (
                <div
                  key={ayah.nomorAyat}
                  id={`ayah-${ayah.nomorAyat}`}
                  className={`ayah-card ${isPlayingThis ? "active-playing" : ""}`}
                >
                  {/* Ayah Meta Action Header */}
                  <div className="ayah-header">
                    <div className="ayah-number-badge">
                      <span>{selectedSurah.nomor}:{ayah.nomorAyat}</span>
                    </div>

                    <div className="ayah-action-buttons">
                      {/* Play Ayah Audio */}
                      <button
                        type="button"
                        className={`ayah-action-btn ${isPlayingThis ? "playing-btn" : ""}`}
                        title={isPlayingThis ? "Hentikan Audio" : "Dengarkan Ayat Ini"}
                        onClick={() => {
                          if (isPlayingThis) {
                            stopAudio();
                          } else {
                            playAyahAudio(ayah.nomorAyat);
                          }
                        }}
                      >
                        <i className={`fa-solid ${isPlayingThis ? "fa-pause" : "fa-play"}`}></i>
                      </button>

                      {/* Tafsir Modal Button */}
                      <button
                        type="button"
                        className="ayah-action-btn"
                        title="Buka Tafsir Ringkas Kemenag"
                        onClick={() => openTafsir(ayah.nomorAyat)}
                      >
                        <i className="fa-solid fa-book-bookmark"></i>
                      </button>

                      {/* Bookmark Button */}
                      <button
                        type="button"
                        className={`ayah-action-btn ${bookmarked ? "bookmarked-btn" : ""}`}
                        title={bookmarked ? "Hapus dari Bookmark" : "Simpan ke Bookmark"}
                        onClick={() => toggleBookmark(ayah)}
                      >
                        <i className={`${bookmarked ? "fa-solid" : "fa-regular"} fa-star`}></i>
                      </button>

                      {/* Copy Button */}
                      <button
                        type="button"
                        className="ayah-action-btn"
                        title="Salin Ayat & Terjemahan"
                        onClick={() => copyAyah(ayah)}
                      >
                        <i className="fa-solid fa-copy"></i>
                      </button>
                    </div>
                  </div>

                  {/* Arabic Text */}
                  <div className="ayah-arabic-wrapper">
                    <p className="ayah-arabic-text" dir="rtl">
                      {ayah.teksArab}
                      <span className="ayah-end-symbol">
                        ۝<span className="ayah-end-num">{ayah.nomorAyat}</span>
                      </span>
                    </p>
                  </div>

                  {/* Latin Transliteration */}
                  {showLatin && !isMushafMode && (
                    <div className="ayah-latin-wrapper">
                      <p className="ayah-latin-text">{ayah.teksLatin}</p>
                    </div>
                  )}

                  {/* Indonesian Translation */}
                  {showTranslation && !isMushafMode && (
                    <div className="ayah-translation-wrapper">
                      <p className="ayah-translation-text">{ayah.teksIndonesia}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Surah Navigation Footer */}
          <div className="reader-footer-nav">
            {selectedSurah.suratSebelumnya ? (
              <button
                type="button"
                className="footer-nav-btn prev"
                onClick={() => openSurah((selectedSurah.suratSebelumnya as any).nomor)}
              >
                <i className="fa-solid fa-arrow-left"></i>
                <div>
                  <span className="footer-nav-subtitle">Surah Sebelumnya</span>
                  <span className="footer-nav-title">{selectedSurah.suratSebelumnya.namaLatin}</span>
                </div>
              </button>
            ) : <div />}

            {selectedSurah.suratSelanjutnya ? (
              <button
                type="button"
                className="footer-nav-btn next"
                onClick={() => openSurah((selectedSurah.suratSelanjutnya as any).nomor)}
              >
                <div>
                  <span className="footer-nav-subtitle">Surah Selanjutnya</span>
                  <span className="footer-nav-title">{selectedSurah.suratSelanjutnya.namaLatin}</span>
                </div>
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            ) : <div />}
          </div>
        </div>
      )}

      {/* STICKY FLOATING AUDIO PLAYER BAR */}
      {selectedSurah && currentPlayingAyah !== null && (
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
                  {selectedSurah.namaLatin} : Ayat {currentPlayingAyah}
                </span>
                <span className="audio-qari-name">
                  {QARI_LIST.find((q) => q.id === selectedQari)?.name || "Qari"}
                </span>
              </div>
            </div>

            <div className="audio-controls-group">
              <button
                type="button"
                className="audio-btn"
                title="Ayat Sebelumnya"
                onClick={playPrevAyah}
                disabled={currentPlayingAyah <= 1}
              >
                <i className="fa-solid fa-backward-step"></i>
              </button>

              <button
                type="button"
                className="audio-btn play-main-btn"
                title={isPlaying ? "Jeda" : "Putar"}
                onClick={togglePlayCurrent}
              >
                <i className={`fa-solid ${isPlaying ? "fa-pause" : "fa-play"}`}></i>
              </button>

              <button
                type="button"
                className="audio-btn"
                title="Ayat Selanjutnya"
                onClick={playNextAyah}
                disabled={currentPlayingAyah >= selectedSurah.jumlahAyat}
              >
                <i className="fa-solid fa-forward-step"></i>
              </button>

              <button
                type="button"
                className="audio-btn close-audio-btn"
                title="Tutup Pemutar"
                onClick={stopAudio}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAFSIR KEMENAG */}
      {showTafsirModal && selectedSurah && selectedAyahTafsir && (
        <div className="quran-modal-overlay" onClick={() => setShowTafsirModal(false)}>
          <div className="quran-modal-card tafsir-modal" onClick={(e) => e.stopPropagation()}>
            <div className="quran-modal-header">
              <div className="modal-title-group">
                <i className="fa-solid fa-book-open-reader"></i>
                <h3>
                  Tafsir Ringkas Kemenag — Surah {selectedSurah.namaLatin} : Ayat {selectedAyahTafsir}
                </h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowTafsirModal(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="quran-modal-body">
              {loadingTafsir ? (
                <div className="modal-loading-state">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <p>Memuat tafsir Kementerian Agama RI...</p>
                </div>
              ) : (
                (() => {
                  const ayahTafsir = tafsirData?.tafsir?.find(
                    (t: any) => t.ayat === selectedAyahTafsir
                  );
                  return (
                    <div className="tafsir-content">
                      <div className="tafsir-ayah-box">
                        <p className="tafsir-arabic">
                          {selectedSurah.ayat.find((a) => a.nomorAyat === selectedAyahTafsir)?.teksArab}
                        </p>
                        <p className="tafsir-indo">
                          "{selectedSurah.ayat.find((a) => a.nomorAyat === selectedAyahTafsir)?.teksIndonesia}"
                        </p>
                      </div>

                      <div className="tafsir-explanation">
                        <h4>Penjelasan & Asbabun Nuzul:</h4>
                        <p>
                          {ayahTafsir?.teks ||
                            "Tafsir untuk ayat ini sedang disinkronisasikan dari server Kemenag."}
                        </p>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BOOKMARKS LIST */}
      {showBookmarksModal && (
        <div className="quran-modal-overlay" onClick={() => setShowBookmarksModal(false)}>
          <div className="quran-modal-card bookmarks-modal" onClick={(e) => e.stopPropagation()}>
            <div className="quran-modal-header">
              <div className="modal-title-group">
                <i className="fa-solid fa-star gold-icon"></i>
                <h3>Bookmark & Ayat Pilihan Saya ({bookmarks.length})</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowBookmarksModal(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="quran-modal-body">
              {bookmarks.length === 0 ? (
                <div className="modal-empty-bookmarks">
                  <i className="fa-regular fa-star empty-icon"></i>
                  <p>Belum ada ayat yang ditandai sebagai bookmark.</p>
                  <span>Tekan ikon bintang pada setiap ayat saat membaca untuk menyimpannya di sini.</span>
                </div>
              ) : (
                <div className="bookmarks-list">
                  {bookmarks.map((b) => (
                    <div
                      key={`${b.surahNumber}-${b.ayahNumber}`}
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
                          title="Hapus bookmark"
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = bookmarks.filter(
                              (item) => !(item.surahNumber === b.surahNumber && item.ayahNumber === b.ayahNumber)
                            );
                            setBookmarks(updated);
                            try {
                              localStorage.setItem("expedient_quran_bookmarks", JSON.stringify(updated));
                            } catch {}
                            showToast("Bookmark dihapus");
                          }}
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                      <p className="bookmark-arabic" dir="rtl">{b.teksArab}</p>
                      <p className="bookmark-translation">"{b.teksIndonesia}"</p>
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

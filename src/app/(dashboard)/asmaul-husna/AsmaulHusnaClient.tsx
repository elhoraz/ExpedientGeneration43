"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  ASMAUL_HUSNA_DATA,
  ASMA_CATEGORIES,
  AsmaulHusnaItem,
  AsmaCategory
} from "@/lib/data/asmaulHusnaData";
import "./asmaul-husna.css";

type TabType = "gallery" | "tasbih" | "player" | "favorites";
type StoryTheme = "obsidian" | "emerald" | "ivory";

export default function AsmaulHusnaClient() {
  const { t, locale } = useLanguage();
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<TabType>("gallery");

  // Gallery & Filter State
  const [selectedCategory, setSelectedCategory] = useState<AsmaCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedAsma, setSelectedAsma] = useState<AsmaulHusnaItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Story Generator Modal State
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [storyItem, setStoryItem] = useState<AsmaulHusnaItem | null>(null);
  const [storyTheme, setStoryTheme] = useState<StoryTheme>("obsidian");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dedicated Tasbih Mode State
  const [tasbihAsma, setTasbihAsma] = useState<AsmaulHusnaItem>(ASMAUL_HUSNA_DATA[0]);
  const [tasbihCount, setTasbihCount] = useState(0);
  const [tasbihTarget, setTasbihTarget] = useState<number>(33); // 33, 99, 100, 1000, 0 = Bebas
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Sequential Murattal Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayIndex, setCurrentPlayIndex] = useState(0);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("expedient_asma_favs");
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleFavorite = (num: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => {
      const updated = prev.includes(num) ? prev.filter((item) => item !== num) : [...prev, num];
      try {
        localStorage.setItem("expedient_asma_favs", JSON.stringify(updated));
      } catch {
        // ignore
      }
      showToast(updated.includes(num) ? t.asmaul_husna.fav_added : t.asmaul_husna.fav_removed);
      return updated;
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Persistent Audio Context for guaranteed mobile & desktop audio
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioCtx = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          audioCtxRef.current = new AudioCtx();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  // Web Audio Synthesizer: Crystal bead click
  const playClickSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } catch {
      // ignore
    }
  }, [soundEnabled, getAudioCtx]);

  const playFinishFanfare = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.09, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.4);
      });
    } catch {
      // ignore
    }
  }, [soundEnabled, getAudioCtx]);

  // Active HTML5 Audio stream reference
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopActiveAudio = useCallback(() => {
    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    if (activeAudioRef.current) {
      try {
        const audio = activeAudioRef.current;
        (audio as any)._aborted = true;
        audio.onended = null;
        audio.onerror = null;
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      } catch {
        // ignore
      }
      activeAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }, []);

  // Pronunciation via High-Fidelity Arabic Audio Stream from Qari
  const speakAsma = useCallback(
    (item: AsmaulHusnaItem, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();

      setIsPlaying(false);
      playClickSound();
      stopActiveAudio();

      showToast(locale === "ar" ? `تلاوة: يا ${item.arabic} 🔊` : locale === "en" ? `Reciting: Ya ${item.latin} 🔊` : `Melafalkan: Ya ${item.latin} 🔊`);

      try {
        const spokenText = `يا ${item.arabic.replace(/^ال/, "")}، ${item.arabic}`;
        const audioUrl = `/api/audio/tts?type=asma&id=${item.number}&text=${encodeURIComponent(spokenText)}&lang=ar`;
        const audio = new Audio(audioUrl);
        activeAudioRef.current = audio;

        audio.onerror = () => {
          if ((audio as any)._aborted) return;
          console.warn(`Asma audio playback error for #${item.number}`);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            if ((audio as any)._aborted) return;
            console.warn(`Asma play promise error for #${item.number}:`, err);
          });
        }
      } catch (err) {
        console.warn("Audio recitation error:", err);
      }
    },
    [playClickSound, stopActiveAudio, locale]
  );

  // Tasbih Tap Handler
  const handleTasbihTap = () => {
    playClickSound();
    if ("vibrate" in navigator) navigator.vibrate(25);

    const nextVal = tasbihCount + 1;
    setTasbihCount(nextVal);

    if (tasbihTarget > 0 && nextVal === tasbihTarget) {
      playFinishFanfare();
      if ("vibrate" in navigator) navigator.vibrate([60, 40, 80]);
      showToast(locale === "ar" ? `الحمد لله! تم إنجاز الهدف ${tasbihTarget} مرة ✨` : locale === "en" ? `Alhamdulillah! Target ${tasbihTarget}x reached ✨` : `Alhamdulillah! Target ${tasbihTarget}x tercapai ✨`);
    }
  };

  const resetTasbih = () => {
    setTasbihCount(0);
    showToast(locale === "ar" ? "تمت إعادة ضبط عداد التسبيح إلى ٠" : locale === "en" ? "Tasbih count reset to 0" : "Hitungan tasbih direset ke 0");
  };

  const startDzikirWithAsma = (item: AsmaulHusnaItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTasbihAsma(item);
    setTasbihCount(0);
    setActiveTab("tasbih");
    setSelectedAsma(null);
    showToast(locale === "ar" ? `وضع التسبيح: يا ${item.arabic} ✨` : locale === "en" ? `Tasbih Mode: Ya ${item.latin} ✨` : `Mode Tasbih: Ya ${item.latin} ✨`);
  };

  // Sequential Murattal Player Engine
  const startSequentialPlay = () => {
    setIsPlaying(true);
    playNextSequential(currentPlayIndex);
  };

  const pauseSequentialPlay = () => {
    setIsPlaying(false);
    stopActiveAudio();
  };

  const playNextSequential = (index: number) => {
    if (index >= ASMAUL_HUSNA_DATA.length) {
      setIsPlaying(false);
      setCurrentPlayIndex(0);
      showToast(t.asmaul_husna.khatam_congrats);
      return;
    }

    const currentItem = ASMAUL_HUSNA_DATA[index];
    setCurrentPlayIndex(index);
    playClickSound();
    stopActiveAudio();

    try {
      const spokenText = `يا ${currentItem.arabic.replace(/^ال/, "")}، ${currentItem.arabic}`;
      const audioUrl = `/api/audio/tts?type=asma&id=${currentItem.number}&text=${encodeURIComponent(spokenText)}&lang=ar`;
      const audio = new Audio(audioUrl);
      activeAudioRef.current = audio;

      let advanced = false;
      const advance = () => {
        if (advanced || (audio as any)._aborted) return;
        advanced = true;
        playTimerRef.current = setTimeout(() => {
          playNextSequential(index + 1);
        }, 900);
      };

      audio.onended = advance;
      audio.onerror = () => {
        if ((audio as any)._aborted) return;
        advance();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          if ((audio as any)._aborted) return;
          advance();
        });
      }
    } catch {
      playTimerRef.current = setTimeout(() => {
        playNextSequential(index + 1);
      }, 1500);
    }
  };

  useEffect(() => {
    return () => {
      stopActiveAudio();
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
      if ("speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [stopActiveAudio]);

  // Filtered List
  const filteredList = useMemo(() => {
    return ASMAUL_HUSNA_DATA.filter((item) => {
      if (activeTab === "favorites") {
        return favorites.includes(item.number);
      }
      const matchCat = selectedCategory === "all" || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.latin.toLowerCase().includes(q) ||
        item.translation.toLowerCase().includes(q) ||
        item.arabic.includes(q) ||
        item.number.toString() === q;
      return matchCat && matchQuery;
    });
  }, [activeTab, selectedCategory, searchQuery, favorites]);

  // --------------------------------------------------------------------------
  // HTML5 Canvas Story Card Generator (9:16)
  // --------------------------------------------------------------------------
  const openStoryModal = (item: AsmaulHusnaItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setStoryItem(item);
    setStoryModalOpen(true);
  };

  const drawStoryCanvas = useCallback(() => {
    if (!canvasRef.current || !storyItem) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = 1080;
    const h = 1920;
    canvas.width = w;
    canvas.height = h;

    const isLight = storyTheme === "ivory";

    if (storyTheme === "obsidian") {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#070b13");
      grad.addColorStop(0.5, "#0e1626");
      grad.addColorStop(1, "#05080f");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const radial = ctx.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, 650);
      radial.addColorStop(0, "rgba(212, 175, 55, 0.2)");
      radial.addColorStop(1, "transparent");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, w, h);
    } else if (storyTheme === "emerald") {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#031a12");
      grad.addColorStop(0.5, "#06291d");
      grad.addColorStop(1, "#02120c");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const radial = ctx.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, 650);
      radial.addColorStop(0, "rgba(16, 185, 129, 0.22)");
      radial.addColorStop(1, "transparent");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, w, h);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#fdfcf9");
      grad.addColorStop(0.5, "#f7f4ee");
      grad.addColorStop(1, "#ece7dd");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const radial = ctx.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, 600);
      radial.addColorStop(0, "rgba(212, 175, 55, 0.12)");
      radial.addColorStop(1, "transparent");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, w, h);
    }

    // Outer & Inner Borders
    ctx.strokeStyle = isLight ? "rgba(170, 119, 28, 0.45)" : "rgba(212, 175, 55, 0.45)";
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 50, w - 100, h - 100);

    ctx.strokeStyle = isLight ? "rgba(170, 119, 28, 0.25)" : "rgba(212, 175, 55, 0.25)";
    ctx.lineWidth = 2;
    ctx.strokeRect(70, 70, w - 140, h - 140);

    // Header Emblem
    ctx.textAlign = "center";
    ctx.font = "bold 26px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#aa771c" : "#d4af37";
    ctx.letterSpacing = "6px";
    ctx.fillText("EXPEDIENT GENERATION 43", w / 2, 170);

    ctx.font = "20px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#64748b" : "#94a3b8";
    ctx.letterSpacing = "3px";
    ctx.fillText("99 ASMAUL HUSNA • TADABBUR & DZIKIR", w / 2, 210);

    ctx.font = "32px 'Amiri', serif";
    ctx.fillStyle = isLight ? "#aa771c" : "#d4af37";
    ctx.fillText("✦  —  ۞  —  ✦", w / 2, 280);

    // Asma Number Pill
    ctx.font = "bold 22px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#aa771c" : "#d4af37";
    ctx.fillText(`ASMA KE-${storyItem.number} DARI 99`, w / 2, 380);

    // Big Calligraphy
    ctx.font = "bold 110px 'Amiri', 'Traditional Arabic', serif";
    ctx.fillStyle = isLight ? "#0f172a" : "#ffffff";
    ctx.fillText(storyItem.arabic, w / 2, 590);

    // Latin Title
    ctx.font = "bold 44px 'Playfair Display', serif";
    ctx.fillStyle = isLight ? "#aa771c" : "#d4af37";
    ctx.fillText(storyItem.latin, w / 2, 690);

    // Translation
    ctx.font = "32px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#334155" : "#e2e8f0";
    ctx.fillText(`"${storyItem.translation}"`, w / 2, 755);

    // Quran Reference Badge
    ctx.font = "bold 24px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#059669" : "#34d399";
    ctx.fillText(`📖 Dalil: ${storyItem.quranRef}`, w / 2, 830);

    // Golden Divider
    ctx.strokeStyle = isLight ? "rgba(170, 119, 28, 0.35)" : "rgba(212, 175, 55, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 200, 880);
    ctx.lineTo(w / 2 + 200, 880);
    ctx.stroke();

    // Tadabbur Box
    const boxW = w - 240;
    const boxH = 340;
    const boxY = 940;

    ctx.fillStyle = isLight ? "rgba(170, 119, 28, 0.08)" : "rgba(212, 175, 55, 0.08)";
    ctx.strokeStyle = isLight ? "rgba(170, 119, 28, 0.25)" : "rgba(212, 175, 55, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect((w - boxW) / 2, boxY, boxW, boxH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font = "bold 24px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#aa771c" : "#d4af37";
    ctx.fillText("💡 MAKNA & TADABBUR", w / 2, boxY + 55);

    // Wrap meaning text
    ctx.font = "24px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#475569" : "#cbd5e1";
    const words = storyItem.meaning.split(" ");
    let line = "";
    const lines = [];
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > boxW - 80 && n > 0) {
        lines.push(line.trim());
        line = words[n] + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());

    lines.slice(0, 5).forEach((l, idx) => {
      ctx.fillText(l, w / 2, boxY + 115 + idx * 42);
    });

    // Fadhilah Box
    const fadhilahY = boxY + boxH + 40;
    const fadhilahH = 260;

    ctx.fillStyle = isLight ? "rgba(16, 185, 129, 0.08)" : "rgba(16, 185, 129, 0.1)";
    ctx.strokeStyle = isLight ? "rgba(16, 185, 129, 0.25)" : "rgba(16, 185, 129, 0.3)";
    ctx.beginPath();
    ctx.roundRect((w - boxW) / 2, fadhilahY, boxW, fadhilahH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font = "bold 24px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#059669" : "#34d399";
    ctx.fillText("📿 KHASIAT & AMALAN DZIKIR", w / 2, fadhilahY + 55);

    ctx.font = "22px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#475569" : "#cbd5e1";
    const bWords = storyItem.dhikrBenefit.split(" ");
    let bLine = "";
    const bLines = [];
    for (let n = 0; n < bWords.length; n++) {
      const testLine = bLine + bWords[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > boxW - 80 && n > 0) {
        bLines.push(bLine.trim());
        bLine = bWords[n] + " ";
      } else {
        bLine = testLine;
      }
    }
    bLines.push(bLine.trim());

    bLines.slice(0, 3).forEach((l, idx) => {
      ctx.fillText(l, w / 2, fadhilahY + 110 + idx * 40);
    });

    // Footer
    ctx.font = "22px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#94a3b8" : "#64748b";
    ctx.fillText("Portal Alumni Angkatan 43 • Meneguhkan Tauhid & Akhlak", w / 2, h - 130);
  }, [storyItem, storyTheme]);

  useEffect(() => {
    if (storyModalOpen && storyItem) {
      setTimeout(drawStoryCanvas, 60);
    }
  }, [storyModalOpen, storyItem, drawStoryCanvas]);

  const downloadStoryImage = () => {
    if (!canvasRef.current || !storyItem) return;
    const link = document.createElement("a");
    link.download = `asmaul-husna-${storyItem.number}-${storyItem.latin.toLowerCase()}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    showToast(locale === "ar" ? "تم تحميل بطاقة قصة أسماء الله الحسنى بنجاح! 📲" : locale === "en" ? "Asmaul Husna story card downloaded successfully! 📲" : "Story card Asmaul Husna berhasil diunduh! 📲");
  };

  const shareToWhatsApp = (item: AsmaulHusnaItem) => {
    const text = `*Asmaul Husna Hari Ini: ${item.arabic} (${item.latin})*\n\n"${item.translation}"\n📖 *Dalil Al-Qur'an:* ${item.quranRef}\n\n💡 *Tadabbur & Makna:*\n${item.meaning}\n\n📿 *Amalan Dzikir:*\n${item.dhikrBenefit}\n\nPelajari 99 Asmaul Husna: https://angkatan43.id/asmaul-husna`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Dial progress calculations
  const progressPercent = tasbihTarget > 0 ? Math.min((tasbihCount / tasbihTarget) * 100, 100) : 100;
  const radius = 95;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="asma-page-wrapper">
      <div className="asma-bg-ambient" />

      {/* SVG Gradient definitions for Tasbih Dial */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffd700" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#aa771c" />
          </linearGradient>
        </defs>
      </svg>

      <div className="asma-container">
        {/* Top Back Action */}
        <div className="asma-top-actions">
          <Link href="/fitur" className="btn-back">
            <i className="fa-solid fa-arrow-left"></i> {t.asmaul_husna.back_to_features}
          </Link>
        </div>

        {/* Header */}
        <header className="asma-header">
          <div className="asma-badge">
            <span>✨</span>
            <span>{locale === "ar" ? "خزائن الأسماء الحسنى" : locale === "en" ? "Divine Names Sanctuary" : "Khazanah Asma Agung"}</span>
          </div>
          <h1 className="asma-title">{t.asmaul_husna.title}</h1>
          <p className="asma-subtitle">
            {t.asmaul_husna.subtitle}
          </p>
        </header>

        {/* Navigation Tabs */}
        <nav className="asma-tabs-nav" aria-label={locale === "ar" ? "التنقل في أسماء الله الحسنى" : locale === "en" ? "Asmaul Husna Navigation" : "Navigasi Fitur Asmaul Husna"}>
          <button
            type="button"
            className={`asma-tab-btn ${activeTab === "gallery" ? "active" : ""}`}
            onClick={() => setActiveTab("gallery")}
          >
            <span>💎</span>
            <span>{t.asmaul_husna.tab_gallery}</span>
          </button>
          <button
            type="button"
            className={`asma-tab-btn ${activeTab === "tasbih" ? "active" : ""}`}
            onClick={() => setActiveTab("tasbih")}
          >
            <span>📿</span>
            <span>{t.asmaul_husna.tab_tasbih}</span>
          </button>
          <button
            type="button"
            className={`asma-tab-btn ${activeTab === "player" ? "active" : ""}`}
            onClick={() => setActiveTab("player")}
          >
            <span>🎧</span>
            <span>{t.asmaul_husna.tab_murottal}</span>
          </button>
          <button
            type="button"
            className={`asma-tab-btn ${activeTab === "favorites" ? "active" : ""}`}
            onClick={() => setActiveTab("favorites")}
          >
            <span>⭐</span>
            <span>{t.asmaul_husna.tab_favorites} ({favorites.length})</span>
          </button>
        </nav>

        {/* ------------------------------------------------------------------
            TAB 1: GALERI 99 NAMA & FAVORIT
            ------------------------------------------------------------------ */}
        {(activeTab === "gallery" || activeTab === "favorites") && (
          <>
            <div className="asma-controls">
              {/* Search Bar */}
              <div className="asma-search-bar">
                <span className="asma-search-icon">🔍</span>
                <input
                  type="text"
                  className="asma-search-input"
                  placeholder={t.asmaul_husna.search_placeholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="asma-search-clear"
                    onClick={() => setSearchQuery("")}
                    title={locale === "ar" ? "مسح البحث" : locale === "en" ? "Clear search" : "Hapus pencarian"}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Filters */}
              {activeTab === "gallery" && (
                <div className="asma-categories">
                  {ASMA_CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      className={`asma-cat-chip ${selectedCategory === cat.key ? "active" : ""}`}
                      onClick={() => setSelectedCategory(cat.key)}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grid of Jeweled Asma Cards */}
            <div className="asma-grid">
              {filteredList.map((item) => {
                const isFav = favorites.includes(item.number);
                const isPlayingThis = isPlaying && currentPlayIndex === item.number - 1;

                return (
                  <article
                    key={item.number}
                    className={`asma-jewel-card ${isPlayingThis ? "active-playback" : ""}`}
                    onClick={() => setSelectedAsma(item)}
                  >
                    <div className="asma-card-top">
                      <span className="asma-num-badge">#{String(item.number).padStart(2, "0")}</span>
                      <button
                        type="button"
                        className={`asma-fav-btn ${isFav ? "favorited" : ""}`}
                        onClick={(e) => toggleFavorite(item.number, e)}
                        title={isFav ? (locale === "ar" ? "إزالة من المفضلة" : locale === "en" ? "Remove from favorites" : "Hapus dari favorit") : (locale === "ar" ? "حفظ في المفضلة" : locale === "en" ? "Save to favorites" : "Simpan ke favorit")}
                      >
                        {isFav ? "★" : "☆"}
                      </button>
                    </div>

                    <p className="asma-arabic-display">{item.arabic}</p>
                    <h3 className="asma-latin-title">{item.latin}</h3>
                    <p className="asma-meaning-text">{item.translation}</p>

                    <div className="asma-card-footer">
                      <button
                        type="button"
                        className="asma-mini-btn"
                        onClick={(e) => speakAsma(item, e)}
                        title={locale === "ar" ? "استمع للفظ" : locale === "en" ? "Listen to pronunciation" : "Dengarkan pelafalan"}
                      >
                        <span>🔊</span>
                      </button>
                      <button
                        type="button"
                        className="asma-mini-btn dzikir"
                        onClick={(e) => startDzikirWithAsma(item, e)}
                        title={locale === "ar" ? "ابدأ التسبيح بهذا الاسم" : locale === "en" ? "Open tasbih for this name" : "Buka tasbih untuk asma ini"}
                      >
                        <span>📿 {t.asmaul_husna.dzikir_btn}</span>
                      </button>
                      <button
                        type="button"
                        className="asma-mini-btn"
                        onClick={(e) => openStoryModal(item, e)}
                        title={locale === "ar" ? "إنشاء بطاقة قصة واتساب" : locale === "en" ? "Create WhatsApp Story Card" : "Buat Story Card WhatsApp"}
                      >
                        <span>🎨 {t.asmaul_husna.story_btn}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {filteredList.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                <p style={{ fontSize: "1.8rem", marginBottom: "8px" }}>🍃</p>
                <p>
                  {activeTab === "favorites"
                    ? t.asmaul_husna.empty_favorites
                    : `${t.asmaul_husna.empty_search} (${searchQuery})`}
                </p>
              </div>
            )}
          </>
        )}

        {/* ------------------------------------------------------------------
            TAB 2: MODE TASBIH DZIKIR ASMA TERPILIH
            ------------------------------------------------------------------ */}
        {activeTab === "tasbih" && (
          <div className="tasbih-mode-wrapper">
            <div className="tasbih-card">
              {/* Asma Selector Dropdown */}
              <div className="tasbih-selector-row">
                <span style={{ fontSize: "0.8rem", color: "var(--gold-main)", fontWeight: 700 }}>
                  {t.asmaul_husna.select_asma}
                </span>
                <select
                  className="tasbih-select-input"
                  value={tasbihAsma.number}
                  onChange={(e) => {
                    const found = ASMAUL_HUSNA_DATA.find((x) => x.number === Number(e.target.value));
                    if (found) {
                      setTasbihAsma(found);
                      setTasbihCount(0);
                    }
                  }}
                >
                  {ASMAUL_HUSNA_DATA.map((item) => (
                    <option key={item.number} value={item.number}>
                      #{item.number} {item.latin} - {item.arabic}
                    </option>
                  ))}
                </select>
              </div>

              {/* Display Current Asma */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Amiri', serif", fontSize: "2.8rem", color: "#ffffff", direction: "rtl", textShadow: "0 0 20px rgba(212,175,55,0.4)" }}>
                  يَا {tasbihAsma.arabic.replace(/^ال/, "")}
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--gold-main)" }}>
                  Ya {tasbihAsma.latin}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "2px" }}>
                  "{tasbihAsma.translation}"
                </div>
              </div>

              {/* Target Counter Presets */}
              <div className="tasbih-presets">
                {[33, 99, 100, 1000, 0].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`preset-chip ${tasbihTarget === preset ? "active" : ""}`}
                    onClick={() => {
                      setTasbihTarget(preset);
                      setTasbihCount(0);
                    }}
                  >
                    {preset === 0 ? t.asmaul_husna.free_target : `${preset}x`}
                  </button>
                ))}
              </div>

              {/* Interactive SVG Dial Tap Button */}
              <div
                className="tasbih-dial-container"
                onClick={handleTasbihTap}
                role="button"
                tabIndex={0}
                aria-label={t.asmaul_husna.tap_to_count}
              >
                <svg className="tasbih-dial-svg" viewBox="0 0 220 220">
                  <circle className="tasbih-track" cx="110" cy="110" r={radius} />
                  <circle
                    className="tasbih-progress"
                    cx="110"
                    cy="110"
                    r={radius}
                    style={{
                      strokeDasharray: circumference,
                      strokeDashoffset: strokeDashoffset,
                    }}
                  />
                </svg>

                <div className="tasbih-inner-button">
                  <span className="tasbih-counter-number">{tasbihCount}</span>
                  <span className="tasbih-target-label">
                    {tasbihTarget > 0 ? `${t.asmaul_husna.target_times} ${tasbihTarget}x` : t.asmaul_husna.free_target}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="tasbih-actions-bar">
                <button type="button" className="tasbih-tool-btn" onClick={resetTasbih}>
                  <span>🔄</span>
                  <span>{t.asmaul_husna.reset_btn}</span>
                </button>
                <button
                  type="button"
                  className="tasbih-tool-btn"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                >
                  <span>{soundEnabled ? "🔊" : "🔇"}</span>
                  <span>{soundEnabled ? t.asmaul_husna.sound_active : t.asmaul_husna.sound_mute}</span>
                </button>
                <button
                  type="button"
                  className="tasbih-tool-btn"
                  onClick={() => setSelectedAsma(tasbihAsma)}
                >
                  <span>📖</span>
                  <span>{t.asmaul_husna.tadabbur_btn}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            TAB 3: PEMUTAR MUROJA'AH AUDIO SEKUENSIAL (1-99)
            ------------------------------------------------------------------ */}
        {activeTab === "player" && (
          <div className="murattal-player-card">
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--gold-main)", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>
              <span>🎧</span>
              <span>{t.asmaul_husna.auto_player_title}</span>
            </div>

            <div className="player-track-info">
              <span className="asma-num-badge">
                #{currentPlayIndex + 1} {t.asmaul_husna.of_99}
              </span>
              <p className="player-big-arabic">{ASMAUL_HUSNA_DATA[currentPlayIndex].arabic}</p>
              <h3 style={{ fontSize: "1.3rem", color: "var(--gold-main)", margin: 0 }}>
                {ASMAUL_HUSNA_DATA[currentPlayIndex].latin}
              </h3>
              <p style={{ fontSize: "0.95rem", color: "#cbd5e1", margin: 0 }}>
                "{ASMAUL_HUSNA_DATA[currentPlayIndex].translation}"
              </p>
              <div className="asma-quran-ref-badge" style={{ marginTop: "6px" }}>
                📖 {ASMAUL_HUSNA_DATA[currentPlayIndex].quranRef}
              </div>
            </div>

            {/* Controls */}
            <div className="player-controls-row">
              <button
                type="button"
                className="player-round-btn"
                onClick={() => {
                  const prev = Math.max(0, currentPlayIndex - 1);
                  setCurrentPlayIndex(prev);
                  if (isPlaying) playNextSequential(prev);
                }}
                title={locale === "ar" ? "الاسم السابق" : locale === "en" ? "Previous Name" : "Asma Sebelumnya"}
              >
                ⏮
              </button>

              <button
                type="button"
                className="player-round-btn play"
                onClick={isPlaying ? pauseSequentialPlay : startSequentialPlay}
                title={isPlaying ? (locale === "ar" ? "إيقاف مؤقت" : locale === "en" ? "Pause" : "Jeda") : (locale === "ar" ? "تشغيل متتابع" : locale === "en" ? "Play Sequentially" : "Putar Berurutan")}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>

              <button
                type="button"
                className="player-round-btn"
                onClick={() => {
                  const next = Math.min(ASMAUL_HUSNA_DATA.length - 1, currentPlayIndex + 1);
                  setCurrentPlayIndex(next);
                  if (isPlaying) playNextSequential(next);
                }}
                title={locale === "ar" ? "الاسم التالي" : locale === "en" ? "Next Name" : "Asma Berikutnya"}
              >
                ⏭
              </button>
            </div>

            <p style={{ fontSize: "0.82rem", color: "#94a3b8", textAlign: "center", maxWidth: "480px" }}>
              {locale === "ar" ? "يقوم هذا الوضع بتشغيل تلاوة 99 اسماً من أسماء الله الحسنى تلقائياً من 1 إلى 99. مناسب للاستماع أثناء الراحة أو القيادة أو الحفظ." : locale === "en" ? "This mode automatically plays the recitation of the 99 Names of Allah sequentially from 1 to 99. Ideal for listening during rest, commute, or memorization." : "Mode ini memutar pelafalan 99 Asmaul Husna secara otomatis dari nomor 1 hingga 99. Cocok didengarkan saat beristirahat, berkendara, atau menghafal."}
            </p>
          </div>
        )}

        {/* ------------------------------------------------------------------
            MODAL TADABBUR & DETAIL LEMBAR
            ------------------------------------------------------------------ */}
        {selectedAsma && (
          <div className="asma-modal-overlay" onClick={() => setSelectedAsma(null)}>
            <div className="asma-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="asma-modal-header">
                <span className="asma-num-badge">#{selectedAsma.number} / 99</span>
                <button
                  type="button"
                  className="asma-modal-close"
                  onClick={() => setSelectedAsma(null)}
                >
                  ✕
                </button>
              </div>

              <p className="asma-modal-arabic">{selectedAsma.arabic}</p>
              <h2 className="asma-modal-latin">{selectedAsma.latin}</h2>
              <p className="asma-modal-trans">"{selectedAsma.translation}"</p>

              <div className="asma-quran-ref-badge">
                <span>📖</span>
                <span>{t.asmaul_husna.dalil_label}: {selectedAsma.quranRef}</span>
              </div>

              {/* Tadabbur Section */}
              <div className="asma-section-box">
                <div className="asma-section-title">
                  <span>💡</span>
                  <span>{t.asmaul_husna.meaning_label}</span>
                </div>
                <p className="asma-section-desc">{selectedAsma.meaning}</p>
              </div>

              {/* Fadhilah Dzikir Section */}
              <div className="asma-section-box" style={{ borderColor: "rgba(16, 185, 129, 0.3)" }}>
                <div className="asma-section-title" style={{ color: "#34d399" }}>
                  <span>📿</span>
                  <span>{locale === "ar" ? "فضائل وذكر الاسم" : locale === "en" ? "Virtues & Dhikr Benefits" : "Khasiat & Amalan Dzikir"}</span>
                </div>
                <p className="asma-section-desc">{selectedAsma.dhikrBenefit}</p>
              </div>

              {/* Action Buttons */}
              <div className="asma-modal-actions">
                <button
                  type="button"
                  className="asma-mini-btn dzikir"
                  style={{ padding: "10px 18px", fontSize: "0.85rem" }}
                  onClick={() => startDzikirWithAsma(selectedAsma)}
                >
                  <span>📿</span>
                  <span>{t.asmaul_husna.dzikir_btn}</span>
                </button>
                <button
                  type="button"
                  className="asma-mini-btn"
                  style={{ padding: "10px 16px", fontSize: "0.85rem" }}
                  onClick={() => speakAsma(selectedAsma)}
                >
                  <span>🔊</span>
                  <span>{locale === "ar" ? "تلاوة" : locale === "en" ? "Recite" : "Lafalkan"}</span>
                </button>
                <button
                  type="button"
                  className="asma-mini-btn"
                  style={{ padding: "10px 16px", fontSize: "0.85rem" }}
                  onClick={() => openStoryModal(selectedAsma)}
                >
                  <span>🎨</span>
                  <span>{t.asmaul_husna.story_btn}</span>
                </button>
                <button
                  type="button"
                  className="asma-mini-btn"
                  style={{ padding: "10px 16px", fontSize: "0.85rem" }}
                  onClick={() => shareToWhatsApp(selectedAsma)}
                >
                  <span>📲</span>
                  <span>{locale === "ar" ? "واتساب" : locale === "en" ? "Share WA" : "Kirim WA"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            MODAL STORY CARD GENERATOR (HTML5 CANVAS)
            ------------------------------------------------------------------ */}
        {storyModalOpen && storyItem && (
          <div className="asma-modal-overlay" onClick={() => setStoryModalOpen(false)}>
            <div className="asma-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="asma-modal-header">
                <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--gold-main)" }}>
                  🎨 {t.asmaul_husna.story_preview_title}
                </span>
                <button
                  type="button"
                  className="asma-modal-close"
                  onClick={() => setStoryModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              {/* Theme Selector */}
              <div style={{ display: "flex", gap: "8px", justifyContent: "center", width: "100%" }}>
                {(["obsidian", "emerald", "ivory"] as StoryTheme[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`preset-chip ${storyTheme === t ? "active" : ""}`}
                    onClick={() => setStoryTheme(t)}
                  >
                    {t === "obsidian" ? "Obsidian Gold" : t === "emerald" ? "Emerald Madinah" : "Royal Ivory"}
                  </button>
                ))}
              </div>

              {/* 9:16 Preview Canvas */}
              <div
                style={{
                  width: "100%",
                  maxWidth: "280px",
                  aspectRatio: "9 / 16",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                  border: "1px solid rgba(212,175,55,0.4)",
                  background: "#000000",
                }}
              >
                <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }} />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                <button
                  type="button"
                  className="asma-mini-btn dzikir"
                  style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "0.9rem" }}
                  onClick={downloadStoryImage}
                >
                  <span>📥</span>
                  <span>{t.asmaul_husna.story_download}</span>
                </button>
                <button
                  type="button"
                  className="asma-mini-btn"
                  style={{ width: "100%", justifyContent: "center", padding: "10px", fontSize: "0.85rem" }}
                  onClick={() => shareToWhatsApp(storyItem)}
                >
                  <span>📲</span>
                  <span>{locale === "ar" ? "مشاركة النص إلى واتساب" : locale === "en" ? "Share Text to WhatsApp" : "Bagikan Teks ke WhatsApp"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Toast */}
        {toastMessage && <div className="asma-toast">{toastMessage}</div>}
      </div>
    </div>
  );
}

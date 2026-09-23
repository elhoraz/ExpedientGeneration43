"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  MAFHUZHAT_DATA,
  MAFHUZHAT_CATEGORIES,
  PESANTREN_RANKS,
  MahfuzhatItem,
  MahfuzhatCategory
} from "@/lib/data/mahfuzhatData";
import "./mahfuzhat.css";

type TabType = "library" | "quiz" | "daily";
type StoryTheme = "obsidian" | "emerald" | "ivory";

interface QuizQuestion {
  item: MahfuzhatItem;
  options: string[];
  correctIndex: number;
}

export default function MahfuzhatClient() {
  const { t, locale } = useLanguage();
  // Tab Navigation
  const [activeTab, setActiveTab] = useState<TabType>("library");

  // Library State
  const [selectedCategory, setSelectedCategory] = useState<MahfuzhatCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSyarah, setExpandedSyarah] = useState<Record<string, boolean>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Story Card Generator State
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [storyItem, setStoryItem] = useState<MahfuzhatItem | null>(null);
  const [storyTheme, setStoryTheme] = useState<StoryTheme>("obsidian");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Quiz Game State
  const [gameState, setGameState] = useState<"welcome" | "playing" | "answered" | "finished">("welcome");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [quizHistory, setQuizHistory] = useState<{ isCorrect: boolean; userChoice: number }[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem("expedient_mahfuzhat_favs");
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem("expedient_mahfuzhat_favs", JSON.stringify(updated));
      } catch {
        // ignore
      }
      showToast(updated.includes(id) ? "Ditambahkan ke Favorit ✨" : "Dihapus dari Favorit");
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

  // Sound Synthesizer (Web Audio API)
  const playSound = useCallback((type: "correct" | "wrong" | "finish") => {
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;

      if (type === "correct") {
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.35);
        });
      } else if (type === "wrong") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      } else if (type === "finish") {
        const fanfare = [392, 523.25, 659.25, 783.99, 1046.5];
        fanfare.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.09, ctx.currentTime + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.1);
          osc.stop(ctx.currentTime + idx * 0.1 + 0.45);
        });
      }
    } catch {
      // Audio not permitted or unsupported
    }
  }, [getAudioCtx]);

  // Active HTML5 Audio stream reference
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopActiveAudio = useCallback(() => {
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

  // Pronunciation via High-Fidelity Arabic Audio Stream
  const speakArabic = useCallback(
    (arabicText: string, latinText?: string) => {
      // 1. Always play harmonious chime so there is immediate, guaranteed audio feedback
      playSound("correct");

      // 2. Stop any existing audio or speech
      stopActiveAudio();

      showToast(`Melafalkan: ${latinText || arabicText} 🔊`);

      // 3. Play authentic native Arabic audio stream
      try {
        const audioUrl = `/api/audio/tts?text=${encodeURIComponent(arabicText)}&lang=ar`;
        const audio = new Audio(audioUrl);
        activeAudioRef.current = audio;

        audio.onerror = () => {
          if ((audio as any)._aborted) return;
          console.warn("Mahfuzhat audio playback error");
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            if ((audio as any)._aborted) return;
            console.warn("Mahfuzhat audio play promise error:", err);
          });
        }
      } catch (e) {
        console.warn("Audio recitation error:", e);
      }
    },
    [playSound, stopActiveAudio]
  );

  // Copy to Clipboard
  const copyMahfuzhat = (item: MahfuzhatItem) => {
    const text = `« ${item.arabic} »\n(${item.latin})\n\n"${item.translation}"\n\n📌 Hikmah:\n${item.syarah}\n\n— Expedient Generation 43 | Mahfuzhat Santri`;
    navigator.clipboard.writeText(text).then(() => {
      showToast("Kutipan berhasil disalin ke clipboard! 📋");
    });
  };

  // Share to WhatsApp
  const shareToWhatsApp = (item: MahfuzhatItem) => {
    const text = `*Mahfuzhat Hari Ini - Expedient 43*\n\n« *${item.arabic}* »\n_${item.latin}_\n\n"${item.translation}"\n\n💡 *Syarah & Hikmah:*\n${item.syarah}\n\nKunjungi portal alumni: https://angkatan43.id/mahfuzhat`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Toggle Syarah
  const toggleSyarah = (id: string) => {
    setExpandedSyarah((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Filtered Library Items
  const filteredMahfuzhat = useMemo(() => {
    return MAFHUZHAT_DATA.filter((item) => {
      const matchCat = selectedCategory === "all" || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.latin.toLowerCase().includes(q) ||
        item.translation.toLowerCase().includes(q) ||
        item.arabic.includes(q) ||
        item.syarah.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  // Daily Featured Item (deterministic by current day of year)
  const dailyFeatured = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const index = dayOfYear % MAFHUZHAT_DATA.length;
    return MAFHUZHAT_DATA[index];
  }, []);

  // --------------------------------------------------------------------------
  // Story Card HTML5 Canvas Generator
  // --------------------------------------------------------------------------
  const openStoryModal = (item: MahfuzhatItem) => {
    setStoryItem(item);
    setStoryModalOpen(true);
  };

  const drawStoryCanvas = useCallback(() => {
    if (!canvasRef.current || !storyItem) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High resolution portrait 1080 x 1920 (Instagram / WhatsApp Story 9:16)
    const w = 1080;
    const h = 1920;
    canvas.width = w;
    canvas.height = h;

    // Background themes
    if (storyTheme === "obsidian") {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#080c15");
      grad.addColorStop(0.5, "#0d1527");
      grad.addColorStop(1, "#05080e");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Gold Radial Glow in center
      const radial = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, 600);
      radial.addColorStop(0, "rgba(212, 175, 55, 0.16)");
      radial.addColorStop(1, "transparent");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, w, h);
    } else if (storyTheme === "emerald") {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#031c14");
      grad.addColorStop(0.5, "#062c20");
      grad.addColorStop(1, "#02130e");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const radial = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, 600);
      radial.addColorStop(0, "rgba(16, 185, 129, 0.18)");
      radial.addColorStop(1, "transparent");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, w, h);
    } else {
      // Ivory Porcelain
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#fdfcf9");
      grad.addColorStop(0.5, "#f7f4ee");
      grad.addColorStop(1, "#eee9df");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const radial = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, 550);
      radial.addColorStop(0, "rgba(212, 175, 55, 0.1)");
      radial.addColorStop(1, "transparent");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, w, h);
    }

    // Outer Decorative Border
    const isLight = storyTheme === "ivory";
    ctx.strokeStyle = isLight ? "rgba(170, 119, 28, 0.45)" : "rgba(212, 175, 55, 0.45)";
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 50, w - 100, h - 100);

    // Inner Delicate Border
    ctx.strokeStyle = isLight ? "rgba(170, 119, 28, 0.25)" : "rgba(212, 175, 55, 0.25)";
    ctx.lineWidth = 2;
    ctx.strokeRect(70, 70, w - 140, h - 140);

    // Corner Ornaments
    const drawCorner = (x: number, y: number) => {
      ctx.save();
      ctx.strokeStyle = isLight ? "#aa771c" : "#d4af37";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, 30, 30);
      ctx.restore();
    };
    drawCorner(85, 85);
    drawCorner(w - 115, 85);
    drawCorner(85, h - 115);
    drawCorner(w - 115, h - 115);

    // Header Emblem
    ctx.textAlign = "center";
    ctx.font = "bold 26px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#aa771c" : "#d4af37";
    ctx.letterSpacing = "6px";
    ctx.fillText("EXPEDIENT GENERATION 43", w / 2, 170);

    ctx.font = "20px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#64748b" : "#94a3b8";
    ctx.letterSpacing = "3px";
    ctx.fillText("MUTIARA MAHFUZHAT PESANTREN", w / 2, 210);

    // Decorative Floral / Bismillah divider
    ctx.font = "32px 'Amiri', serif";
    ctx.fillStyle = isLight ? "#aa771c" : "#d4af37";
    ctx.fillText("✦  —  ۞  —  ✦", w / 2, 280);

    // Arabic Quote (Large Calligraphic Display)
    ctx.font = "bold 64px 'Amiri', 'Traditional Arabic', serif";
    ctx.fillStyle = isLight ? "#0f172a" : "#ffffff";

    // Text wrapping for long Arabic aphorisms
    const words = storyItem.arabic.split(" ");
    let line = "";
    const lines = [];
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > w - 240 && n > 0) {
        lines.push(line.trim());
        line = words[n] + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());

    // Render Arabic lines
    const startY = 750 - (lines.length - 1) * 50;
    lines.forEach((l, idx) => {
      ctx.fillText(l, w / 2, startY + idx * 105);
    });

    // Latin Transliteration
    const latinY = startY + lines.length * 105 + 60;
    ctx.font = "italic 32px 'Inter', serif";
    ctx.fillStyle = isLight ? "#aa771c" : "#d4af37";
    ctx.fillText(`"${storyItem.latin}"`, w / 2, latinY);

    // Golden Divider Line
    ctx.strokeStyle = isLight ? "rgba(170, 119, 28, 0.4)" : "rgba(212, 175, 55, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 180, latinY + 50);
    ctx.lineTo(w / 2 + 180, latinY + 50);
    ctx.stroke();

    // Indonesian Translation
    ctx.font = "30px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#334155" : "#e2e8f0";

    const transWords = storyItem.translation.split(" ");
    let tLine = "";
    const tLines = [];
    for (let n = 0; n < transWords.length; n++) {
      const testLine = tLine + transWords[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > w - 280 && n > 0) {
        tLines.push(tLine.trim());
        tLine = transWords[n] + " ";
      } else {
        tLine = testLine;
      }
    }
    tLines.push(tLine.trim());

    const transStartY = latinY + 110;
    tLines.forEach((l, idx) => {
      ctx.fillText(l, w / 2, transStartY + idx * 48);
    });

    // Syarah / Insight Box
    const syarahBoxY = Math.max(transStartY + tLines.length * 48 + 70, 1350);
    const boxW = w - 240;
    const boxH = 260;

    ctx.fillStyle = isLight ? "rgba(170, 119, 28, 0.08)" : "rgba(212, 175, 55, 0.08)";
    ctx.strokeStyle = isLight ? "rgba(170, 119, 28, 0.25)" : "rgba(212, 175, 55, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect((w - boxW) / 2, syarahBoxY, boxW, boxH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font = "bold 22px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#aa771c" : "#d4af37";
    ctx.fillText("💡 HIKMAH & KONTEKS", w / 2, syarahBoxY + 50);

    // Syarah wrapped text
    ctx.font = "22px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#475569" : "#cbd5e1";
    const syarahWords = storyItem.syarah.split(" ");
    let sLine = "";
    const sLines = [];
    for (let n = 0; n < syarahWords.length; n++) {
      const testLine = sLine + syarahWords[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > boxW - 80 && n > 0) {
        sLines.push(sLine.trim());
        sLine = syarahWords[n] + " ";
      } else {
        sLine = testLine;
      }
    }
    sLines.push(sLine.trim());

    // Print up to 3 lines of syarah
    sLines.slice(0, 4).forEach((l, idx) => {
      ctx.fillText(l, w / 2, syarahBoxY + 95 + idx * 36);
    });

    // Footer Branding
    ctx.font = "22px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#94a3b8" : "#64748b";
    ctx.fillText("Alumni Angkatan 43 • Menembus Batas, Menjaga Adab", w / 2, h - 130);
  }, [storyItem, storyTheme]);

  useEffect(() => {
    if (storyModalOpen && storyItem) {
      setTimeout(drawStoryCanvas, 50);
    }
  }, [storyModalOpen, storyItem, drawStoryCanvas]);

  const downloadStoryImage = () => {
    if (!canvasRef.current || !storyItem) return;
    const link = document.createElement("a");
    link.download = `mahfuzhat-${storyItem.number}-${storyItem.latin.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    showToast("Story card berhasil diunduh! 📲");
  };

  // --------------------------------------------------------------------------
  // Sambung Mahfuzhat Quiz Engine
  // --------------------------------------------------------------------------
  const startQuiz = () => {
    // Shuffle and pick 10 questions
    const shuffled = [...MAFHUZHAT_DATA].sort(() => 0.5 - Math.random()).slice(0, 10);
    const questions: QuizQuestion[] = shuffled.map((item) => ({
      item,
      options: item.quiz.options,
      correctIndex: item.quiz.answerIndex
    }));

    setQuizQuestions(questions);
    setCurrentQIndex(0);
    setScore(0);
    setStreak(0);
    setQuizHistory([]);
    setSelectedAnswer(null);
    setTimeLeft(15);
    setGameState("playing");
  };

  // Quiz Timer Countdown
  useEffect(() => {
    if (gameState !== "playing") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAnswer(-1); // time out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, currentQIndex]);

  const handleAnswer = (choiceIndex: number) => {
    if (gameState !== "playing") return;
    if (timerRef.current) clearInterval(timerRef.current);

    const currQ = quizQuestions[currentQIndex];
    const isCorrect = choiceIndex === currQ.correctIndex;
    setSelectedAnswer(choiceIndex);
    setGameState("answered");

    if (isCorrect) {
      // Bonus based on speed
      const speedBonus = Math.min(Math.floor(timeLeft / 3), 3);
      const points = 10 + speedBonus;
      setScore((prev) => prev + points);
      setStreak((prev) => prev + 1);
      playSound("correct");
      if ("vibrate" in navigator) navigator.vibrate(30);
    } else {
      setStreak(0);
      playSound("wrong");
      if ("vibrate" in navigator) navigator.vibrate([60, 40, 60]);
    }

    setQuizHistory((prev) => [...prev, { isCorrect, userChoice: choiceIndex }]);
  };

  const nextQuestion = () => {
    if (currentQIndex + 1 < quizQuestions.length) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setTimeLeft(15);
      setGameState("playing");
    } else {
      setGameState("finished");
      playSound("finish");
    }
  };

  // Determine Pesantren Rank
  const finalRank = useMemo(() => {
    for (const rank of PESANTREN_RANKS) {
      if (score >= rank.minScore) {
        return rank;
      }
    }
    return PESANTREN_RANKS[PESANTREN_RANKS.length - 1];
  }, [score]);

  return (
    <div className="mahfuzhat-page-wrapper">
      <div className="mahfuzhat-bg-ambient" />

      <div className="mahfuzhat-container">
        {/* Top Back Action */}
        <div className="mahfuzhat-top-actions">
          <Link href="/fitur" className="btn-back">
            <i className="fa-solid fa-arrow-left"></i> {t.mahfuzhat.back_to_features}
          </Link>
        </div>

        {/* Header */}
        <header className="mahfuzhat-header">
          <div className="mahfuzhat-badge">
            <span>✨</span>
            <span>Khazanah Pesantren 43</span>
          </div>
          <h1 className="mahfuzhat-title">{t.mahfuzhat.title}</h1>
          <p className="mahfuzhat-subtitle">
            {t.mahfuzhat.subtitle}
          </p>
        </header>

        {/* Tab Navigation */}
        <nav className="mahfuzhat-tabs-nav" aria-label="Navigasi Fitur Mahfuzhat">
          <button
            type="button"
            className={`mahfuzhat-tab-btn ${activeTab === "library" ? "active" : ""}`}
            onClick={() => setActiveTab("library")}
          >
            <span>📚</span>
            <span>{locale === "ar" ? "المكتبة (30)" : locale === "en" ? "Library (30)" : "Perpustakaan (30)"}</span>
          </button>
          <button
            type="button"
            className={`mahfuzhat-tab-btn ${activeTab === "quiz" ? "active" : ""}`}
            onClick={() => setActiveTab("quiz")}
          >
            <span>⚡</span>
            <span>{locale === "ar" ? "مسابقة الإكمال" : locale === "en" ? "Matching Quiz" : "Kuis Sambung"}</span>
          </button>
          <button
            type="button"
            className={`mahfuzhat-tab-btn ${activeTab === "daily" ? "active" : ""}`}
            onClick={() => setActiveTab("daily")}
          >
            <span>🌙</span>
            <span>{locale === "ar" ? "حكمة اليوم" : locale === "en" ? "Daily Wisdom" : "Mutiara Hari Ini"}</span>
          </button>
        </nav>

        {/* ------------------------------------------------------------------
            TAB 1: PERPUSTAKAAN MAHFUZHAT
            ------------------------------------------------------------------ */}
        {activeTab === "library" && (
          <>
            <div className="library-controls">
              {/* Search Bar */}
              <div className="library-search-bar">
                <span className="library-search-icon">🔍</span>
                <input
                  type="text"
                  className="library-search-input"
                  placeholder={locale === "ar" ? "ابحث في المحفوظات... (مثال: صبَرَ، وجد، علم)" : locale === "en" ? "Search mahfuzhat... (e.g. wajada, patience, knowledge)" : "Cari mahfuzhat... (contoh: wajada, sabar, teman, ilmu)"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="library-search-clear"
                    onClick={() => setSearchQuery("")}
                    title={locale === "ar" ? "مسح البحث" : locale === "en" ? "Clear search" : "Hapus pencarian"}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Filter Chips */}
              <div className="library-categories">
                {MAFHUZHAT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    className={`cat-chip ${selectedCategory === cat.key ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat.key)}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Mahfuzhat Cards */}
            <div className="mahfuzhat-grid">
              {filteredMahfuzhat.map((item) => {
                const isFav = favorites.includes(item.id);
                const isExpanded = !!expandedSyarah[item.id];

                return (
                  <article key={item.id} className="mahfuzhat-card">
                    <div className="mahfuzhat-card-header">
                      <span className="mahfuzhat-number-badge">#{String(item.number).padStart(2, "0")}</span>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <span className="mahfuzhat-cat-badge">
                          {MAFHUZHAT_CATEGORIES.find((c) => c.key === item.category)?.label || item.category}
                        </span>
                        <button
                          type="button"
                          className="card-action-btn"
                          onClick={() => toggleFavorite(item.id)}
                          title={isFav ? (locale === "ar" ? "إزالة من المفضلة" : locale === "en" ? "Remove from favorites" : "Hapus dari favorit") : (locale === "ar" ? "حفظ في المفضلة" : locale === "en" ? "Save to favorites" : "Simpan ke favorit")}
                          style={{ color: isFav ? "#d4af37" : "inherit" }}
                        >
                          {isFav ? "★" : "☆"}
                        </button>
                      </div>
                    </div>

                    {/* Arabic Text Display */}
                    <div className="mahfuzhat-arabic-box">
                      <p className="mahfuzhat-arabic-text">{item.arabic}</p>
                    </div>

                    {/* Latin & Translation */}
                    <div className="mahfuzhat-latin">« {item.latin} »</div>
                    <div className="mahfuzhat-translation">"{item.translation}"</div>

                    {/* Syarah Collapsible */}
                    <button
                      type="button"
                      className="mahfuzhat-syarah-toggle"
                      onClick={() => toggleSyarah(item.id)}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>💡</span>
                        <span>{locale === "ar" ? "الشرح والمعاني العميقة" : locale === "en" ? "Syarah & In-depth Meaning" : "Syarah & Makna Mendalam"}</span>
                      </span>
                      <span>{isExpanded ? "▲" : "▼"}</span>
                    </button>

                    {isExpanded && (
                      <div className="mahfuzhat-syarah-body">
                        {item.syarah}
                        {item.source && (
                          <div style={{ marginTop: "6px", fontSize: "0.75rem", color: "var(--gold-main)" }}>
                            {locale === "ar" ? "المصدر: " : locale === "en" ? "Source: " : "Sumber: "}{item.source}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="mahfuzhat-card-actions">
                      <button
                        type="button"
                        className="card-action-btn"
                        onClick={() => speakArabic(item.arabic, item.latin)}
                        title={locale === "ar" ? "استماع للنطق العربي" : locale === "en" ? "Listen Arabic pronunciation" : "Dengarkan pelafalan bahasa Arab"}
                      >
                        <span>🔊</span>
                        <span>{locale === "ar" ? "استماع" : locale === "en" ? "Pronounce" : "Lafalkan"}</span>
                      </button>
                      <button
                        type="button"
                        className="card-action-btn"
                        onClick={() => copyMahfuzhat(item)}
                        title={locale === "ar" ? "نسخ للحافظة" : locale === "en" ? "Copy to clipboard" : "Salin ke clipboard"}
                      >
                        <span>📋</span>
                        <span>{locale === "ar" ? "نسخ" : locale === "en" ? "Copy" : "Salin"}</span>
                      </button>
                      <button
                        type="button"
                        className="card-action-btn primary"
                        onClick={() => openStoryModal(item)}
                        title={locale === "ar" ? "إنشاء بطاقة قصة" : locale === "en" ? "Create story card" : "Buat kartu status WhatsApp / Instagram"}
                      >
                        <span>🎨</span>
                        <span>Story Card</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {filteredMahfuzhat.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                <p style={{ fontSize: "1.5rem", marginBottom: "8px" }}>🍃</p>
                <p>{locale === "ar" ? `لم يتم العثور على محفوظات بكلمة "${searchQuery}".` : locale === "en" ? `No mahfuzhat found matching "${searchQuery}".` : `Tidak ditemukan mahfuzhat dengan kata kunci "${searchQuery}".`}</p>
              </div>
            )}
          </>
        )}

        {/* ------------------------------------------------------------------
            TAB 2: KUIS SAMBUNG MAHFUZHAT
            ------------------------------------------------------------------ */}
        {activeTab === "quiz" && (
          <div className="quiz-container">
            {/* 1. Welcome Screen */}
            {gameState === "welcome" && (
              <div className="quiz-welcome-card">
                <div className="quiz-welcome-icon">🕌</div>
                <h2 className="quiz-welcome-title">{locale === "ar" ? "مسابقة إكمال المحفوظات" : locale === "en" ? "Mahfuzhat Matching Quiz" : "Kuis Sambung Mahfuzhat"}</h2>
                <p className="quiz-welcome-desc">
                  {locale === "ar" ? "اختبر قوة ذاكرتك واسترجع محفوظات أيام المعهد المباركة. أكمل شطر الحكمة قبل نفاد الوقت!" : locale === "en" ? "Test your memory and recall your boarding school mahfuzhat memories. Complete the wisdom before time runs out!" : "Uji ketajaman memori dan kenangan hafalan mahfuzhat Anda sewaktu di pesantren. Lanjutkan potongan kalimat hikmah dengan tepat sebelum waktu habis!"}
                </p>

                <div className="quiz-rules-list">
                  <div>📌 <strong>{locale === "ar" ? "10 أسئلة" : locale === "en" ? "10 Questions" : "10 Pertanyaan"}</strong> {locale === "ar" ? "عشوائية من كنوز المحفوظات." : locale === "en" ? "random from mahfuzhat treasures." : "acak dari khazanah mahfuzhat."}</div>
                  <div>⏳ <strong>{locale === "ar" ? "15 ثانية" : locale === "en" ? "15 Seconds" : "15 Detik"}</strong> {locale === "ar" ? "لكل سؤال." : locale === "en" ? "per question." : "batas waktu per pertanyaan."}</div>
                  <div>🔥 <strong>{locale === "ar" ? "نقاط متتالية وسرعة" : locale === "en" ? "Streak & Speed Bonus" : "Streak & Speed Bonus"}</strong> {locale === "ar" ? "للإجابات الصحيحة والسريعة." : locale === "en" ? "for fast and accurate answers." : "untuk jawaban cepat dan akurat."}</div>
                  <div>📜 <strong>{locale === "ar" ? "شهادة رقمية" : locale === "en" ? "Digital Certificate" : "Syahadah Digital"}</strong> {locale === "ar" ? "مع رتبة المعهد في نهاية المسابقة." : locale === "en" ? "with pesantren rank at the end." : "dengan predikat pesantren di akhir kuis."}</div>
                </div>

                <button type="button" className="quiz-start-btn" onClick={startQuiz}>
                  <span>{locale === "ar" ? "بدء اختبار الحفظ" : locale === "en" ? "Start Memory Test" : "Mulai Uji Hafalan"}</span>
                  <span>➜</span>
                </button>
              </div>
            )}

            {/* 2. Active Game Screen */}
            {(gameState === "playing" || gameState === "answered") && quizQuestions.length > 0 && (
              <div className="quiz-active-card">
                {/* HUD Bar */}
                <div className="quiz-hud-bar">
                  <div className="hud-pill">
                    <span>{locale === "ar" ? `السؤال ${currentQIndex + 1} / ${quizQuestions.length}` : locale === "en" ? `Question ${currentQIndex + 1} / ${quizQuestions.length}` : `Soal ${currentQIndex + 1} / ${quizQuestions.length}`}</span>
                  </div>
                  <div className={`hud-timer ${timeLeft <= 4 ? "warning" : "normal"}`}>
                    <span>⏱️</span>
                    <span>{timeLeft}s</span>
                  </div>
                  <div className="hud-pill">
                    <span>⭐ {locale === "ar" ? "النقاط: " : locale === "en" ? "Score: " : "Skor: "}{score}</span>
                    {streak > 1 && <span style={{ color: "#f59e0b", marginLeft: "4px" }}>🔥 {streak}x</span>}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="quiz-timer-line">
                  <div
                    className={`quiz-timer-fill ${timeLeft <= 4 ? "warning" : ""}`}
                    style={{ width: `${(timeLeft / 15) * 100}%` }}
                  />
                </div>

                {/* Question Prompt */}
                <div className="quiz-prompt-box">
                  <div className="quiz-prompt-arabic">
                    {quizQuestions[currentQIndex].item.quiz.questionPart}
                  </div>
                  <div className="quiz-prompt-hint">
                    {locale === "ar" ? "تلميح: " : locale === "en" ? "Hint: " : "Petunjuk: "} "{quizQuestions[currentQIndex].item.translation}"
                  </div>
                </div>

                {/* Options 2x2 */}
                <div className="quiz-options-grid">
                  {quizQuestions[currentQIndex].options.map((opt, idx) => {
                    const isCorrectChoice = idx === quizQuestions[currentQIndex].correctIndex;
                    const isUserChoice = idx === selectedAnswer;

                    let btnClass = "quiz-opt-btn";
                    if (gameState === "answered") {
                      if (isCorrectChoice) btnClass += " correct";
                      else if (isUserChoice) btnClass += " wrong";
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        className={btnClass}
                        disabled={gameState === "answered"}
                        onClick={() => handleAnswer(idx)}
                      >
                        <span className="quiz-opt-arabic">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Answer Feedback & Next Button */}
                {gameState === "answered" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                    <div className="quiz-feedback-box">
                      <div style={{ fontWeight: 700, color: "var(--gold-main)", marginBottom: "4px" }}>
                        {selectedAnswer === quizQuestions[currentQIndex].correctIndex
                          ? (locale === "ar" ? "✨ ممتاز! إجابة صحيحة" : locale === "en" ? "✨ Excellent! Correct Answer" : "✨ Mumtaz! Jawaban Tepat")
                          : selectedAnswer === -1
                          ? (locale === "ar" ? "⏳ انتهى الوقت!" : locale === "en" ? "⏳ Time is Up!" : "⏳ Waktu Habis!")
                          : (locale === "ar" ? "❌ غير صحيح" : locale === "en" ? "❌ Not Quite" : "❌ Belum Tepat")}
                      </div>
                      <div>{quizQuestions[currentQIndex].item.quiz.explanation}</div>
                      <div style={{ marginTop: "6px", fontStyle: "italic", fontSize: "0.8rem", color: "#94a3b8" }}>
                        {locale === "ar" ? "الكامل: " : locale === "en" ? "Full: " : "Lengkap: "} {quizQuestions[currentQIndex].item.arabic} ({quizQuestions[currentQIndex].item.latin})
                      </div>
                    </div>

                    <button type="button" className="quiz-next-btn" onClick={nextQuestion}>
                      {currentQIndex + 1 < quizQuestions.length
                        ? (locale === "ar" ? "السؤال التالي ➜" : locale === "en" ? "Next Question ➜" : "Lanjut ke Soal Berikutnya ➜")
                        : (locale === "ar" ? "عرض النتيجة واللقب 🏆" : locale === "en" ? "View Rank & Result 🏆" : "Lihat Hasil Predikat 🏆")}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. Final Finished Screen */}
            {gameState === "finished" && (
              <div className="quiz-result-card">
                <div className="result-badge-icon">{finalRank.badge}</div>
                <h2 className="result-rank-title">{finalRank.title}</h2>
                <p className="result-rank-desc">{finalRank.desc}</p>

                <div className="result-score-display">
                  <div className="score-item">
                    <span className="score-num">{score}</span>
                    <span className="score-label">{locale === "ar" ? "مجموع النقاط" : locale === "en" ? "Total Score" : "Total Skor"}</span>
                  </div>
                  <div style={{ width: "1px", height: "40px", background: "rgba(212, 175, 55, 0.3)" }} />
                  <div className="score-item">
                    <span className="score-num">
                      {quizHistory.filter((h) => h.isCorrect).length} / {quizQuestions.length}
                    </span>
                    <span className="score-label">{locale === "ar" ? "الصحيحة" : locale === "en" ? "Correct" : "Benar"}</span>
                  </div>
                  <div style={{ width: "1px", height: "40px", background: "rgba(212, 175, 55, 0.3)" }} />
                  <div className="score-item">
                    <span className="score-num">
                      {Math.round((quizHistory.filter((h) => h.isCorrect).length / quizQuestions.length) * 100)}%
                    </span>
                    <span className="score-label">{locale === "ar" ? "الدقة" : locale === "en" ? "Accuracy" : "Akurasi"}</span>
                  </div>
                </div>

                <div className="result-actions">
                  <button
                    type="button"
                    className="card-action-btn primary"
                    onClick={startQuiz}
                    style={{ padding: "10px 20px" }}
                  >
                    <span>🔄</span>
                    <span>{locale === "ar" ? "إعادة المسابقة" : locale === "en" ? "Retake Quiz" : "Ulangi Kuis"}</span>
                  </button>
                  <button
                    type="button"
                    className="card-action-btn"
                    onClick={() => {
                      const shareMsg = `Alhamdulillah! Saya meraih predikat *${finalRank.title}* dengan skor *${score}* pada Kuis Sambung Mahfuzhat Pesantren (Expedient 43). Yuk uji hafalanmu juga di: https://angkatan43.id/mahfuzhat`;
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMsg)}`, "_blank");
                    }}
                    style={{ padding: "10px 20px" }}
                  >
                    <span>📲</span>
                    <span>{locale === "ar" ? "مشاركة عبر واتساب" : locale === "en" ? "Share to WhatsApp" : "Bagikan ke WhatsApp"}</span>
                  </button>
                  <button
                    type="button"
                    className="card-action-btn"
                    onClick={() => setActiveTab("library")}
                    style={{ padding: "10px 20px" }}
                  >
                    <span>📖</span>
                    <span>{locale === "ar" ? "فتح المكتبة" : locale === "en" ? "Open Library" : "Buka Perpustakaan"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------
            TAB 3: MUTIARA HARI INI
            ------------------------------------------------------------------ */}
        {activeTab === "daily" && dailyFeatured && (
          <div className="daily-featured-card">
            <div className="daily-tag">
              <span>📅</span>
              <span>{locale === "ar" ? "حكمة اليوم" : locale === "en" ? "Daily Wisdom" : "Mutiara Hari Ini"}</span>
            </div>

            <p className="daily-arabic">{dailyFeatured.arabic}</p>
            <div className="daily-latin">« {dailyFeatured.latin} »</div>
            <div className="daily-trans">"{dailyFeatured.translation}"</div>

            <div className="daily-syarah-box">
              <div className="daily-syarah-title">
                <span>💡</span>
                <span>{locale === "ar" ? "تدبر وتأمل في الحياة" : locale === "en" ? "Contemplation & Life Reflection" : "Tadabbur & Refleksi Kehidupan"}</span>
              </div>
              <p className="daily-syarah-text">{dailyFeatured.syarah}</p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", width: "100%" }}>
              <button
                type="button"
                className="card-action-btn primary"
                onClick={() => openStoryModal(dailyFeatured)}
                style={{ padding: "10px 20px" }}
              >
                <span>🎨</span>
                <span>{locale === "ar" ? "إنشاء بطاقة قصة" : locale === "en" ? "Create Story Card" : "Buat Story WhatsApp / IG"}</span>
              </button>
              <button
                type="button"
                className="card-action-btn"
                onClick={() => speakArabic(dailyFeatured.arabic, dailyFeatured.latin)}
                style={{ padding: "10px 18px" }}
              >
                <span>🔊</span>
                <span>{locale === "ar" ? "استماع للنطق" : locale === "en" ? "Listen Pronunciation" : "Dengarkan Pelafalan"}</span>
              </button>
              <button
                type="button"
                className="card-action-btn"
                onClick={() => shareToWhatsApp(dailyFeatured)}
                style={{ padding: "10px 18px" }}
              >
                <span>📲</span>
                <span>{locale === "ar" ? "إرسال إلى صديق" : locale === "en" ? "Send to Friend" : "Kirim ke Sahabat"}</span>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            MODAL: STORY CARD GENERATOR (CANVAS)
            ------------------------------------------------------------------ */}
        {storyModalOpen && storyItem && (
          <div className="story-modal-overlay" onClick={() => setStoryModalOpen(false)}>
            <div className="story-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="story-modal-header">
                <h3 className="story-modal-title">
                  <span>🎨</span>
                  <span>{locale === "ar" ? "مولد بطاقات القصة 9:16" : locale === "en" ? "Story Card Generator 9:16" : "Generator Story Card 9:16"}</span>
                </h3>
                <button
                  type="button"
                  className="story-modal-close"
                  onClick={() => setStoryModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              {/* Theme Selector */}
              <div className="story-theme-selector">
                <button
                  type="button"
                  className={`theme-chip-btn ${storyTheme === "obsidian" ? "active" : ""}`}
                  onClick={() => setStoryTheme("obsidian")}
                >
                  Obsidian Gold
                </button>
                <button
                  type="button"
                  className={`theme-chip-btn ${storyTheme === "emerald" ? "active" : ""}`}
                  onClick={() => setStoryTheme("emerald")}
                >
                  Emerald Madinah
                </button>
                <button
                  type="button"
                  className={`theme-chip-btn ${storyTheme === "ivory" ? "active" : ""}`}
                  onClick={() => setStoryTheme("ivory")}
                >
                  Royal Ivory
                </button>
              </div>

              {/* Scaled Preview Canvas */}
              <div className="story-preview-container">
                <canvas ref={canvasRef} className="story-preview-canvas" />
              </div>

              {/* Action Buttons */}
              <div className="story-modal-actions">
                <button
                  type="button"
                  className="card-action-btn primary"
                  onClick={downloadStoryImage}
                  style={{ width: "100%", justifyContent: "center", padding: "12px" }}
                >
                  <span>📥</span>
                  <span>{locale === "ar" ? "تحميل صورة القصة (PNG HD)" : locale === "en" ? "Download Story Image (PNG HD)" : "Unduh Gambar Story (PNG HD)"}</span>
                </button>
                <button
                  type="button"
                  className="card-action-btn"
                  onClick={() => shareToWhatsApp(storyItem)}
                  style={{ width: "100%", justifyContent: "center", padding: "10px" }}
                >
                  <span>📲</span>
                  <span>{locale === "ar" ? "مشاركة النص عبر واتساب" : locale === "en" ? "Share Text to WhatsApp" : "Bagikan Teks ke WhatsApp"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Toast Notification */}
        {toastMessage && <div className="mahfuzhat-toast">{toastMessage}</div>}
      </div>
    </div>
  );
}

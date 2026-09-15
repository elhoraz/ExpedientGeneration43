"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  MATSURAT_ITEMS,
  MatsuratItem,
  MatsuratTime,
  MatsuratType,
} from "@/lib/data/matsuratData";
import "./matsurat.css";

export default function MatsuratClient() {
  // 1. Inisialisasi waktu otomatis (Pagi: 04.00 - 15.00, Petang: 15.00 - 04.00)
  const [time, setTime] = useState<MatsuratTime>(() => {
    if (typeof window !== "undefined") {
      const hour = new Date().getHours();
      return hour >= 4 && hour < 15 ? "pagi" : "petang";
    }
    return "pagi";
  });

  const [type, setType] = useState<MatsuratType>("sughro");
  const [viewMode, setViewMode] = useState<"focus" | "list">("focus");
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(true);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [fontSizeIndex, setFontSizeIndex] = useState<number>(1); // 0: Normal, 1: Besar, 2: Sangat Besar
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Filter daftar doa berdasarkan pilihan Sughro/Kubro dan waktu Pagi/Petang
  const activeItems = useMemo(() => {
    return MATSURAT_ITEMS.filter((item) => {
      // Filter tipe
      if (type === "sughro" && item.type !== "sughro") return false;
      // Filter waktu
      if (item.applicableTime !== "both" && item.applicableTime !== time) return false;
      return true;
    });
  }, [type, time]);

  const currentItem: MatsuratItem | undefined = activeItems[currentIndex] || activeItems[0];
  const currentCount = currentItem ? counts[currentItem.id] || 0 : 0;
  const isCurrentComplete = currentItem ? currentCount >= currentItem.targetCount : false;

  // Persistensi hitungan ke LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(`expedient_matsurat_${time}_${type}`);
    if (saved) {
      try {
        setCounts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse matsurat storage:", e);
      }
    } else {
      setCounts({});
    }
    setCurrentIndex(0);
  }, [time, type]);

  const saveCounts = useCallback(
    (newCounts: Record<string, number>) => {
      setCounts(newCounts);
      localStorage.setItem(
        `expedient_matsurat_${time}_${type}`,
        JSON.stringify(newCounts)
      );
    },
    [time, type]
  );

  // Persistent Web Audio context with auto-resume
  const getAudioCtx = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtxClass) {
          audioCtxRef.current = new AudioCtxClass();
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

  // Sound Synthesizer via Web Audio API: Rich wooden bead resonance
  const playClickSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.055);
    } catch (e) {
      console.log("Audio notice:", e);
    }
  }, [soundEnabled, getAudioCtx]);

  const playCompleteChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C chord chime
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);

        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.07);
        osc.stop(ctx.currentTime + idx * 0.07 + 0.35);
      });
    } catch (e) {
      console.log("Audio chime notice:", e);
    }
  }, [soundEnabled, getAudioCtx]);

  // Active HTML5 Audio stream reference
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopActiveAudio = useCallback(() => {
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
        activeAudioRef.current.src = "";
      } catch {
        // ignore
      }
      activeAudioRef.current = null;
    }
  }, []);

  // Recite Dzikir via High-Fidelity Arabic Audio Stream (with browser TTS fallback)
  const speakDzikir = useCallback(
    (item: MatsuratItem) => {
      playClickSound();
      stopActiveAudio();
      if ("speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }

      const arabicText = time === "petang" && item.arabicPetang ? item.arabicPetang : item.arabicPagi;
      const latinText = time === "petang" && item.latinPetang ? item.latinPetang : item.latinPagi;

      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2200);

      try {
        const audioUrl = `/api/audio/tts?text=${encodeURIComponent(arabicText)}&lang=ar`;
        const audio = new Audio(audioUrl);
        activeAudioRef.current = audio;

        audio.onerror = () => {
          if ("speechSynthesis" in window) {
            try {
              if (window.speechSynthesis.paused) window.speechSynthesis.resume();
              const utterance = new SpeechSynthesisUtterance(latinText);
              utterance.lang = "id-ID";
              utterance.rate = 0.85;
              window.speechSynthesis.speak(utterance);
            } catch {
              // ignore
            }
          }
        };

        const p = audio.play();
        if (p !== undefined) {
          p.catch(() => {
            if ("speechSynthesis" in window) {
              try {
                if (window.speechSynthesis.paused) window.speechSynthesis.resume();
                const utterance = new SpeechSynthesisUtterance(latinText);
                utterance.lang = "id-ID";
                window.speechSynthesis.speak(utterance);
              } catch {
                // ignore
              }
            }
          });
        }
      } catch {
        // ignore
      }
    },
    [playClickSound, stopActiveAudio, time]
  );

  const triggerHaptic = useCallback(
    (pattern: number | number[]) => {
      if (!hapticEnabled) return;
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate(pattern);
        } catch {
          // ignore
        }
      }
    },
    [hapticEnabled]
  );

  // Aksi Menambah Hitungan Dzikir
  const handleIncrement = useCallback(
    (itemId?: string) => {
      const targetItem = itemId
        ? activeItems.find((it) => it.id === itemId)
        : currentItem;
      if (!targetItem) return;

      const currentVal = counts[targetItem.id] || 0;
      if (currentVal >= targetItem.targetCount) {
        // Sudah selesai, beri getaran penegasan
        triggerHaptic([30]);
        return;
      }

      const nextVal = currentVal + 1;
      const updated = { ...counts, [targetItem.id]: nextVal };
      saveCounts(updated);

      if (nextVal >= targetItem.targetCount) {
        // Target tercapai!
        triggerHaptic([40, 60, 40]);
        playCompleteChime();

        if (viewMode === "focus" && autoAdvance) {
          setTimeout(() => {
            setCurrentIndex((prev) => Math.min(prev + 1, activeItems.length - 1));
          }, 450);
        }
      } else {
        // Hitungan biasa
        triggerHaptic(20);
        playClickSound();
      }
    },
    [
      activeItems,
      currentItem,
      counts,
      saveCounts,
      triggerHaptic,
      playCompleteChime,
      playClickSound,
      viewMode,
      autoAdvance,
    ]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        handleIncrement();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(prev + 1, activeItems.length - 1));
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleIncrement, activeItems.length]);

  // Reset Hitungan
  const handleResetCurrent = () => {
    if (!currentItem) return;
    const updated = { ...counts, [currentItem.id]: 0 };
    saveCounts(updated);
    triggerHaptic(30);
  };

  const handleResetAll = () => {
    if (confirm("Reset seluruh hitungan dzikir untuk sesi ini?")) {
      saveCounts({});
      setCurrentIndex(0);
      triggerHaptic([50, 50]);
    }
  };

  // Hitung Total Progres
  const totalCompleted = activeItems.filter(
    (item) => (counts[item.id] || 0) >= item.targetCount
  ).length;
  const progressPercent = Math.round((totalCompleted / activeItems.length) * 100);

  // Salin Teks Doa
  const handleCopyDoa = (item: MatsuratItem) => {
    const arabic = time === "petang" && item.arabicPetang ? item.arabicPetang : item.arabicPagi;
    const latin = time === "petang" && item.latinPetang ? item.latinPetang : item.latinPagi;
    const meaning = time === "petang" && item.meaningPetang ? item.meaningPetang : item.meaningPagi;

    const text = `${item.title} (Al-Ma'tsurat ${time.toUpperCase()})\n\n${arabic}\n\n"${latin}"\n\nArtinya: "${meaning}"\n\nSumber: ${item.source} • Expedient 43`;
    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    triggerHaptic(30);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  // Bagikan via WhatsApp
  const handleShareWhatsApp = (item: MatsuratItem) => {
    const arabic = time === "petang" && item.arabicPetang ? item.arabicPetang : item.arabicPagi;
    const meaning = time === "petang" && item.meaningPetang ? item.meaningPetang : item.meaningPagi;

    const text = encodeURIComponent(
      `*${item.title}* - Al-Ma'tsurat ${time.toUpperCase()}\n\n${arabic}\n\n_"${meaning}"_\n\n🔗 Dibagikan melalui Portal Alumni Expedient 43`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  // Ukuran Font Arab Dinamis
  const fontSizes = ["1.7rem", "2.1rem", "2.6rem"];
  const currentFontSize = fontSizes[fontSizeIndex];

  // SVG Dial Math
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const dialOffset = currentItem
    ? circumference - (Math.min(currentCount, currentItem.targetCount) / currentItem.targetCount) * circumference
    : circumference;

  return (
    <div className="matsurat-page-wrapper">
      <div className="matsurat-bg-ambient"></div>

      <div className="matsurat-container">
        {/* Header Title & Badge */}
        <div className="matsurat-header">
          <div className="matsurat-title-badge">
            <i className={`fa-solid ${time === "pagi" ? "fa-sun" : "fa-moon"}`}></i>
            &nbsp;Amalan Harian Santri & Alumni
          </div>
          <h1 className="matsurat-title">Al-Ma’tsurat</h1>
          <p className="matsurat-subtitle">
            Untaian doa pelindung jiwa dan penentram batin yang diajarkan Rasulullah SAW di waktu fajar dan senja.
          </p>
        </div>

        {/* Top Control Toolbar */}
        <div className="matsurat-toolbar">
          <div className="matsurat-toolbar-row">
            {/* Toggle Waktu (Pagi / Petang) */}
            <div className="pill-toggle-group">
              <button
                type="button"
                className={`btn-pill-toggle ${time === "pagi" ? "active" : ""}`}
                onClick={() => setTime("pagi")}
              >
                <i className="fa-solid fa-sun" style={{ color: "#f59e0b" }}></i> Dzikir Pagi
              </button>
              <button
                type="button"
                className={`btn-pill-toggle ${time === "petang" ? "active" : ""}`}
                onClick={() => setTime("petang")}
              >
                <i className="fa-solid fa-moon" style={{ color: "#38bdf8" }}></i> Dzikir Petang
              </button>
            </div>

            {/* Toggle Sughro / Kubro */}
            <div className="pill-toggle-group">
              <button
                type="button"
                className={`btn-pill-toggle ${type === "sughro" ? "active" : ""}`}
                onClick={() => setType("sughro")}
                title="Edisi Inti Ringkas"
              >
                Sughro
              </button>
              <button
                type="button"
                className={`btn-pill-toggle ${type === "kubro" ? "active" : ""}`}
                onClick={() => setType("kubro")}
                title="Edisi Lengkap Sempurna"
              >
                Kubro
              </button>
            </div>

            {/* Mode Tampilan & Preferensi */}
            <div className="matsurat-pref-actions">
              <button
                type="button"
                className={`btn-pref-icon ${viewMode === "focus" ? "active" : ""}`}
                onClick={() => setViewMode(viewMode === "focus" ? "list" : "focus")}
                title={viewMode === "focus" ? "Ubah ke Mode Lembaran (List)" : "Ubah ke Mode Fokus (Step)"}
                aria-label="Toggle View Mode"
              >
                <i className={`fa-solid ${viewMode === "focus" ? "fa-expand" : "fa-bars-staggered"}`}></i>
              </button>

              <button
                type="button"
                className={`btn-pref-icon ${soundEnabled ? "active" : ""}`}
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? "Matikan Suara Klik" : "Nyalakan Suara Klik"}
                aria-label="Toggle Sound"
              >
                <i className={`fa-solid ${soundEnabled ? "fa-volume-high" : "fa-volume-xmark"}`}></i>
              </button>

              <button
                type="button"
                className={`btn-pref-icon ${hapticEnabled ? "active" : ""}`}
                onClick={() => setHapticEnabled(!hapticEnabled)}
                title={hapticEnabled ? "Getaran Haptic Aktif" : "Getaran Dimatikan"}
                aria-label="Toggle Haptic"
              >
                <i className="fa-solid fa-mobile-screen"></i>
              </button>

              <button
                type="button"
                className="btn-pref-icon"
                onClick={() => setFontSizeIndex((prev) => (prev + 1) % 3)}
                title="Ubah Ukuran Huruf Arab"
                aria-label="Font Size"
              >
                <span style={{ fontSize: "0.72rem", fontWeight: 800 }}>A±</span>
              </button>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="matsurat-overall-progress">
            <div className="progress-meta-row">
              <span>
                Progress: <strong>{totalCompleted}</strong> dari {activeItems.length} Doa
              </span>
              <span>
                <strong>{progressPercent}%</strong> Selesai
              </span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------
            MODE FOKUS: STEP-BY-STEP DIAL CARD
            ------------------------------------------------------------------ */}
        {viewMode === "focus" && currentItem && (
          <div
            className={`matsurat-focus-card ${
              currentItem.category === "rabithah" ? "is-rabithah" : ""
            }`}
            style={{ "--arabic-size": currentFontSize } as React.CSSProperties}
          >
            {/* Top Badges */}
            <div className="card-badges-row">
              <div className="badge-doa-category">
                <i
                  className={`fa-solid ${
                    currentItem.category === "ayat"
                      ? "fa-book-quran"
                      : currentItem.category === "tasbih"
                      ? "fa-gem"
                      : currentItem.category === "rabithah"
                      ? "fa-heart"
                      : "fa-hands-praying"
                  }`}
                ></i>
                &nbsp;{currentItem.category}
              </div>

              <div className="badge-target-count">
                <i className="fa-solid fa-repeat"></i>
                &nbsp;Target: {currentItem.targetCount}x
              </div>
            </div>

            {/* Title */}
            <h2 className="card-doa-title">{currentItem.title}</h2>

            {/* Arabic Text */}
            <div className="card-arabic-text">
              {time === "petang" && currentItem.arabicPetang
                ? currentItem.arabicPetang
                : currentItem.arabicPagi}
            </div>

            <div className="card-divider-gold"></div>

            {/* Latin Transliteration */}
            <p className="card-latin-text">
              &ldquo;
              {time === "petang" && currentItem.latinPetang
                ? currentItem.latinPetang
                : currentItem.latinPagi}
              &rdquo;
            </p>

            {/* Translation */}
            <p className="card-meaning-text">
              &ldquo;
              {time === "petang" && currentItem.meaningPetang
                ? currentItem.meaningPetang
                : currentItem.meaningPagi}
              &rdquo;
            </p>

            {/* THE GOLDEN DIAL COUNTER (CLICK TO COUNT) */}
            <div
              className="matsurat-dial-wrapper"
              onClick={() => handleIncrement()}
              title="Ketuk untuk menghitung dzikir"
              role="button"
              tabIndex={0}
            >
              <svg className="dial-svg-ring" viewBox="0 0 130 130">
                <circle className="dial-track-circle" cx="65" cy="65" r={radius} />
                <circle
                  className={`dial-progress-circle ${isCurrentComplete ? "is-complete" : ""}`}
                  cx="65"
                  cy="65"
                  r={radius}
                  strokeDasharray={circumference}
                  strokeDashoffset={dialOffset}
                />
              </svg>

              <div className="dial-center-content">
                <span className="dial-current-num">
                  {isCurrentComplete ? (
                    <i className="fa-solid fa-check" style={{ color: "#10b981" }}></i>
                  ) : (
                    currentCount
                  )}
                </span>
                <span className="dial-target-label">/ {currentItem.targetCount}x</span>
              </div>
            </div>

            <div className="dial-hint-text">
              {isCurrentComplete
                ? "✨ Target Doa Ini Tuntas"
                : "Ketuk lingkaran atau tekan SPASI"}
            </div>

            {/* Virtue & Hadith Source Box */}
            <div className="card-virtue-box">
              <div className="virtue-header">
                <i className="fa-solid fa-book-open"></i> {currentItem.source}
              </div>
              <div>{currentItem.fadhilah}</div>
            </div>

            {/* Card Navigation Controls */}
            <div className="card-nav-row">
              <button
                type="button"
                className="btn-card-nav"
                onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                disabled={currentIndex === 0}
              >
                <i className="fa-solid fa-chevron-left"></i> Sebelumnya
              </button>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  type="button"
                  className="btn-reset-counter"
                  onClick={() => speakDzikir(currentItem)}
                  title="Lafalkan doa (Audio)"
                >
                  <i className="fa-solid fa-volume-high"></i>
                </button>
                <button
                  type="button"
                  className="btn-reset-counter"
                  onClick={handleResetCurrent}
                  title="Reset hitungan doa ini"
                >
                  <i className="fa-solid fa-rotate-left"></i>
                </button>
                <button
                  type="button"
                  className="btn-reset-counter"
                  onClick={() => handleCopyDoa(currentItem)}
                  title="Salin teks doa"
                >
                  <i className="fa-solid fa-copy"></i>
                </button>
                <button
                  type="button"
                  className="btn-reset-counter"
                  onClick={() => handleShareWhatsApp(currentItem)}
                  title="Bagikan ke WhatsApp"
                >
                  <i className="fa-brands fa-whatsapp"></i>
                </button>
              </div>

              <button
                type="button"
                className={`btn-card-nav ${
                  isCurrentComplete ? "btn-primary-next" : ""
                }`}
                onClick={() =>
                  setCurrentIndex((prev) =>
                    Math.min(prev + 1, activeItems.length - 1)
                  )
                }
                disabled={currentIndex === activeItems.length - 1}
              >
                Berikutnya <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            MODE LEMBARAN (CONTINUOUS SCROLLABLE LIST VIEW)
            ------------------------------------------------------------------ */}
        {viewMode === "list" && (
          <div
            className="matsurat-list-view"
            style={{ "--arabic-size": currentFontSize } as React.CSSProperties}
          >
            {activeItems.map((item, idx) => {
              const itemCnt = counts[item.id] || 0;
              const isDone = itemCnt >= item.targetCount;
              const arabic =
                time === "petang" && item.arabicPetang
                  ? item.arabicPetang
                  : item.arabicPagi;
              const latin =
                time === "petang" && item.latinPetang
                  ? item.latinPetang
                  : item.latinPagi;
              const meaning =
                time === "petang" && item.meaningPetang
                  ? item.meaningPetang
                  : item.meaningPagi;

              return (
                <div
                  key={item.id}
                  className={`matsurat-list-item ${isDone ? "is-done" : ""}`}
                >
                  <div className="list-item-header">
                    <div className="list-item-left-meta">
                      <div className="list-item-idx">{idx + 1}</div>
                      <h3 className="list-item-title">{item.title}</h3>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <button
                        type="button"
                        className={`btn-micro-counter ${isDone ? "is-done" : ""}`}
                        onClick={() => handleIncrement(item.id)}
                      >
                        {isDone ? (
                          <>
                            <i className="fa-solid fa-check"></i> Selesai ({item.targetCount}x)
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-plus"></i> {itemCnt} / {item.targetCount}x
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        className="btn-pref-icon"
                        style={{ width: "30px", height: "30px", fontSize: "0.75rem" }}
                        onClick={() => speakDzikir(item)}
                        title="Lafalkan Doa (Audio)"
                      >
                        <i className="fa-solid fa-volume-high"></i>
                      </button>

                      <button
                        type="button"
                        className="btn-pref-icon"
                        style={{ width: "30px", height: "30px", fontSize: "0.75rem" }}
                        onClick={() => handleCopyDoa(item)}
                        title="Salin Doa"
                      >
                        <i className="fa-solid fa-copy"></i>
                      </button>
                    </div>
                  </div>

                  <div className="card-arabic-text">{arabic}</div>
                  <div className="card-divider-gold"></div>
                  <p className="card-latin-text">&ldquo;{latin}&rdquo;</p>
                  <p className="card-meaning-text">&ldquo;{meaning}&rdquo;</p>

                  <div className="card-virtue-box">
                    <div className="virtue-header">
                      <i className="fa-solid fa-book-open"></i> {item.source}
                    </div>
                    <div>{item.fadhilah}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Climax Completion Banner */}
        {progressPercent === 100 && (
          <div className="matsurat-complete-banner">
            <i
              className="fa-solid fa-crown"
              style={{ fontSize: "2rem", color: "#d4af37" }}
            ></i>
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.4rem",
                color: "#10b981",
                margin: 0,
              }}
            >
              Alhamdulillah, Selesai Membaca Al-Ma’tsurat {time.toUpperCase()}
            </h3>
            <p
              style={{
                fontSize: "0.88rem",
                color: "#e2e8f0",
                maxWidth: "480px",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Semoga Allah SWT senantiasa memelihara iman, kesehatan, melapangkan rezeki, dan meneguhkan ukhuwah persaudaraan seluruh alumni Expedient Generation 43.
            </p>
            <button
              type="button"
              className="btn-card-nav btn-primary-next"
              onClick={handleResetAll}
              style={{ marginTop: "8px" }}
            >
              <i className="fa-solid fa-rotate-left"></i> Mulai Ulang Dzikir
            </button>
          </div>
        )}

        {/* Back to Fitur Navigation Link */}
        <div style={{ marginTop: "10px" }}>
          <Link
            href="/fitur"
            className="btn-card-nav"
            style={{ textDecoration: "none" }}
          >
            <i className="fa-solid fa-arrow-left"></i> Kembali ke Menu Fitur
          </Link>
        </div>
      </div>

      {/* Copy Feedback Toast */}
      {copiedToast && (
        <div
          style={{
            position: "fixed",
            bottom: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#10b981",
            color: "#000000",
            padding: "10px 22px",
            borderRadius: "25px",
            fontSize: "0.82rem",
            fontWeight: 700,
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            zIndex: 9999,
          }}
        >
          <i className="fa-solid fa-check"></i> Teks doa berhasil disalin!
        </div>
      )}
    </div>
  );
}

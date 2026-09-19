"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import ThemeToggle from "@/components/layout/ThemeToggle";
import "./tasbih.css";

interface DzikirItem {
  id: string;
  name: string;
  arabic: string;
  latin: string;
  meaning: string;
  defaultTarget: number;
}

const DZIKIR_LIST: DzikirItem[] = [
  {
    id: "tasbih",
    name: "Subhanallah",
    arabic: "سُبْحَانَ اللَّهِ",
    latin: "Subhānallāh",
    meaning: "Maha Suci Allah dari segala kekurangan dan kesyirikan.",
    defaultTarget: 33,
  },
  {
    id: "tahmid",
    name: "Alhamdulillah",
    arabic: "الْحَمْدُ لِلَّهِ",
    latin: "Alhamdulillāh",
    meaning: "Segala puji hanya bagi Allah, Rabb semesta alam.",
    defaultTarget: 33,
  },
  {
    id: "takbir",
    name: "Allahu Akbar",
    arabic: "اللَّهُ أَكْبَرُ",
    latin: "Allāhu Akbar",
    meaning: "Allah Maha Besar di atas segala sesuatu di langit dan bumi.",
    defaultTarget: 33,
  },
  {
    id: "tahlil",
    name: "Tahlil",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ",
    latin: "Lā ilāha illallāh",
    meaning: "Tiada Tuhan yang berhak disembah selain Allah.",
    defaultTarget: 100,
  },
  {
    id: "istighfar",
    name: "Istighfar",
    arabic: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",
    latin: "Astaghfirullāha wa atūbu ilaih",
    meaning: "Aku memohon ampun kepada Allah dan bertaubat kepada-Nya.",
    defaultTarget: 100,
  },
  {
    id: "shalawat",
    name: "Shalawat",
    arabic: "اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ",
    latin: "Allāhumma shalli 'alā sayyidinā Muhammad",
    meaning: "Ya Allah, limpahkanlah shalawat dan salam kepada junjungan kami Nabi Muhammad.",
    defaultTarget: 100,
  },
  {
    id: "hauqalah",
    name: "Hauqalah",
    arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    latin: "Lā hawla wa lā quwwata illā billāh",
    meaning: "Tiada daya untuk menjauhi maksiat dan tiada kekuatan untuk taat melainkan dengan pertolongan Allah.",
    defaultTarget: 100,
  },
  {
    id: "sayyidul",
    name: "Sayyidul Istighfar",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ",
    latin: "Allāhumma anta rabbī lā ilāha illā anta khalaqtanī wa anā 'abduk",
    meaning: "Puncak permohonan ampunan yang menjamin keselamatan dunia dan akhirat.",
    defaultTarget: 33,
  },
];

const TOTAL_BEADS = 33;

export default function TasbihClient() {
  const { t } = useLanguage();
  const [selectedDzikir, setSelectedDzikir] = useState<DzikirItem>(DZIKIR_LIST[0]);
  const [count, setCount] = useState<number>(0);
  const [target, setTarget] = useState<number>(33);
  const [round, setRound] = useState<number>(1);
  const [totalDzikir, setTotalDzikir] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(true);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Load saved session stats from LocalStorage
  useEffect(() => {
    try {
      const savedTotal = localStorage.getItem("expedient_tasbih_total");
      if (savedTotal) {
        setTotalDzikir(parseInt(savedTotal, 10) || 0);
      }
    } catch (e) {
      console.warn("LocalStorage access notice:", e);
    }
  }, []);

  // Web Audio Synthesizer: Soft organic wooden bead click
  const playBeadSound = useCallback(() => {
    if (!soundEnabled) return;

    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioCtxRef.current = new AudioCtx();
        }
      }

      const ctx = audioCtxRef.current;
      if (!ctx) return;

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(480, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.045);
    } catch (e) {
      console.warn("Sound synth error:", e);
    }
  }, [soundEnabled]);

  // Haptic Feedback Generator
  const triggerHaptic = useCallback(
    (pattern: number | number[] = 18) => {
      if (!hapticEnabled) return;
      if (typeof window !== "undefined" && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    },
    [hapticEnabled]
  );

  // Main Tap Counter Function
  const handleTap = () => {
    playBeadSound();

    const nextCount = count + 1;
    const newTotal = totalDzikir + 1;
    setTotalDzikir(newTotal);

    try {
      localStorage.setItem("expedient_tasbih_total", String(newTotal));
    } catch (e) {
      console.warn("Storage write error:", e);
    }

    if (target > 0 && nextCount >= target) {
      // Reached Target milestone
      setCount(0);
      setRound((prev) => prev + 1);
      triggerHaptic([40, 60, 40, 80, 50]);
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 600);
    } else {
      setCount(nextCount);
      triggerHaptic(18);
    }
  };

  // Switch Dzikir Preset
  const handleSelectDzikir = (item: DzikirItem) => {
    setSelectedDzikir(item);
    setTarget(item.defaultTarget);
    setCount(0);
  };

  // Undo (-1)
  const handleUndo = () => {
    if (count > 0) {
      setCount((prev) => prev - 1);
      setTotalDzikir((prev) => Math.max(0, prev - 1));
      triggerHaptic(20);
    }
  };

  // Reset Round
  const handleReset = () => {
    if (count > 0 || round > 1) {
      setCount(0);
      setRound(1);
      triggerHaptic([30, 30]);
    }
  };

  // Generate 33 Bead coordinates for orbit circle
  const beads = Array.from({ length: TOTAL_BEADS }, (_, i) => {
    const angle = (i * (360 / TOTAL_BEADS) - 90) * (Math.PI / 180);
    const radius = 135; // px from center
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { i, x, y };
  });

  const activeBeadIndex = count % TOTAL_BEADS;

  return (
    <div className="tasbih-page-wrapper">
      <div className="tasbih-bg-ambient"></div>

      <div className="tasbih-container">
        {/* Navigation */}
        <div className="tasbih-nav-bar">
          <Link href="/fitur" className="btn-back">
            <i className="fa-solid fa-arrow-left"></i> {t.tasbih.back_to_features}
          </Link>
          <ThemeToggle />
        </div>

        {/* Header */}
        <div className="tasbih-header-box">
          <div className="tasbih-badge-sup">
            <i className="fa-solid fa-gem"></i> Tasbih Mutiara Haptic
          </div>
          <h1 className="tasbih-title">{t.tasbih.title}</h1>
        </div>

        {/* Dzikir Selection Scroll */}
        <div className="tasbih-dzikir-scroll">
          {DZIKIR_LIST.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`dzikir-pill ${selectedDzikir.id === item.id ? "active" : ""}`}
              onClick={() => handleSelectDzikir(item)}
            >
              {item.name}
            </button>
          ))}
        </div>

        {/* Active Dzikir Showcase Card */}
        <div className="tasbih-recite-card">
          <div className="recite-arabic">{selectedDzikir.arabic}</div>
          <div className="recite-latin">&ldquo;{selectedDzikir.latin}&rdquo;</div>
          <div className="recite-meaning">{selectedDzikir.meaning}</div>
        </div>

        {/* Target & Toggles Bar */}
        <div className="tasbih-controls-bar">
          <div className="target-pills">
            <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginRight: "4px" }}>
              Target:
            </span>
            {[33, 99, 100, 0].map((val) => (
              <button
                key={val}
                type="button"
                className={`target-pill ${target === val ? "active" : ""}`}
                onClick={() => {
                  setTarget(val);
                  setCount(0);
                }}
              >
                {val === 0 ? "Bebas" : val}
              </button>
            ))}
          </div>

          <div className="toggles-group">
            <button
              type="button"
              className={`btn-toggle-round ${soundEnabled ? "active" : ""}`}
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Suara Aktif" : "Suara Senyap"}
            >
              <i className={`fa-solid ${soundEnabled ? "fa-volume-high" : "fa-volume-xmark"}`}></i>
            </button>

            <button
              type="button"
              className={`btn-toggle-round ${hapticEnabled ? "active" : ""}`}
              onClick={() => setHapticEnabled(!hapticEnabled)}
              title={hapticEnabled ? "Getar Haptic Aktif" : "Getar Nonaktif"}
            >
              <i className="fa-solid fa-mobile-screen"></i>
            </button>
          </div>
        </div>

        {/* =========================================================================
            INTERACTIVE BEAD RING & TAP DIAL
            ========================================================================= */}
        <div className="tasbih-stage">
          {/* Rotating Bead Orbit Ring */}
          <div
            className="bead-orbit-ring"
            style={{
              transform: `rotate(${count * (360 / TOTAL_BEADS)}deg)`,
            }}
          >
            {beads.map((b) => (
              <div
                key={b.i}
                className={`bead-particle ${b.i <= activeBeadIndex ? "active" : ""}`}
                style={{
                  left: `calc(50% + ${b.x}px)`,
                  top: `calc(50% + ${b.y}px)`,
                }}
              ></div>
            ))}
          </div>

          {/* Central Tap Dial */}
          <button
            type="button"
            className={`tasbih-tap-dial ${isFlashing ? "milestone-flash" : ""}`}
            onClick={handleTap}
            aria-label="Sentuh untuk berdzikir"
          >
            <div className="counter-num">{count}</div>
            <div className="counter-target-lbl">
              {target > 0 ? `/ ${target}` : "Bebas"}
            </div>
            {target > 0 && <div className="counter-round-lbl">Putaran ke-{round}</div>}
            <span className="counter-tap-hint">Sentuh</span>
          </button>
        </div>

        {/* Bottom Actions: Undo & Reset */}
        <div className="tasbih-bottom-actions">
          <button
            type="button"
            className="btn-tasbih-action"
            onClick={handleUndo}
            disabled={count === 0}
            style={{ opacity: count === 0 ? 0.4 : 1 }}
          >
            <i className="fa-solid fa-rotate-left"></i> -1
          </button>

          <div className="tasbih-total-badge">
            <i className="fa-solid fa-seedling"></i> Total Sesi: {totalDzikir.toLocaleString("id-ID")}
          </div>

          <button
            type="button"
            className="btn-tasbih-action danger"
            onClick={handleReset}
          >
            <i className="fa-solid fa-arrow-rotate-right"></i> Reset
          </button>
        </div>
      </div>
    </div>
  );
}

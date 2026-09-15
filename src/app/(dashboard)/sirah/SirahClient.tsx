"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  SIRAH_PLACES,
  SIRAH_ROUTES,
  SIRAH_EVENTS,
  SirahEvent,
  HistoricPlace,
  SirahRoute,
  SirahPhase
} from "@/lib/data/sirahData";
import "./sirah.css";

type TabView = "map" | "timeline" | "leadership";
type StoryTheme = "obsidian" | "parchment" | "ivory";

export default function SirahClient() {
  // Tabs
  const [activeTab, setActiveTab] = useState<TabView>("map");

  // Map Navigation & Engine State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedPlace, setSelectedPlace] = useState<HistoricPlace | null>(null);
  const [activeRouteId, setActiveRouteId] = useState<string>("hijrah");
  const [isTouring, setIsTouring] = useState(false);

  // Timeline State
  const [selectedPhase, setSelectedPhase] = useState<SirahPhase>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<SirahEvent | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Story Card Generator State
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [storyEvent, setStoryEvent] = useState<SirahEvent | null>(null);
  const [storyTheme, setStoryTheme] = useState<StoryTheme>("obsidian");
  const storyCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Persistent Audio Context for ambient gong & chimes
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioCtx = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

  const playAmbientChime = useCallback(() => {
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const notes = [440, 554.37, 659.25]; // A4, C#5, E5 (meditative harmony)
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.4);
      });
    } catch {
      // ignore
    }
  }, [getAudioCtx]);

  const playPinClick = useCallback(() => {
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(293.66, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // ignore
    }
  }, [getAudioCtx]);

  // --------------------------------------------------------------------------
  // 2.5D Canvas Cartography Renderer
  // --------------------------------------------------------------------------
  const renderMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear with antique parchment tone
    ctx.fillStyle = "#070b14";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    // Apply pan & zoom
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-500, -400); // Center normalized 1000x800 coordinate space

    // 1. Grid lines (Ancient nautical cartography lines)
    ctx.strokeStyle = "rgba(212, 175, 55, 0.07)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= 1000; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 800);
      ctx.stroke();
    }
    for (let y = 0; y <= 800; y += 100) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1000, y);
      ctx.stroke();
    }

    // 2. Red Sea Coastline (Bahrul Ahmar stylized polygon on the west)
    ctx.fillStyle = "rgba(10, 25, 45, 0.6)";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 0);
    ctx.bezierCurveTo(120, 200, 180, 450, 220, 600);
    ctx.bezierCurveTo(240, 680, 290, 750, 310, 800);
    ctx.lineTo(0, 800);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Stylized sea label
    ctx.font = "italic 13px 'Playfair Display', serif";
    ctx.fillStyle = "rgba(56, 189, 248, 0.4)";
    ctx.fillText("بَحْرُ الْقُلْزُمِ (Laut Merah)", 110, 450);

    // 3. Mountain Ranges (Jabal Hijaz relief shading)
    const drawMountain = (x: number, y: number, r: number) => {
      ctx.fillStyle = "rgba(212, 175, 55, 0.08)";
      ctx.strokeStyle = "rgba(212, 175, 55, 0.2)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - r, y + r * 0.8);
      ctx.lineTo(x, y - r);
      ctx.lineTo(x + r, y + r * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };
    drawMountain(460, 610, 25); // Jabal An-Nur
    drawMountain(390, 690, 22); // Jabal Tsur
    drawMountain(410, 325, 28); // Jabal Uhud
    drawMountain(440, 250, 20); // Khaibar hills

    // 4. Draw Active Routes (Dashed animated trajectories)
    SIRAH_ROUTES.forEach((route) => {
      const isActive = route.id === activeRouteId;
      ctx.strokeStyle = isActive ? route.color : "rgba(255,255,255,0.15)";
      ctx.lineWidth = isActive ? 3.5 : 1.5;
      ctx.setLineDash(isActive ? [8, 5] : [4, 4]);

      ctx.beginPath();
      route.waypoints.forEach((wp, idx) => {
        if (idx === 0) ctx.moveTo(wp.x, wp.y);
        else ctx.lineTo(wp.x, wp.y);
      });
      ctx.stroke();
      ctx.setLineDash([]); // reset

      // Waypoint Dots
      if (isActive) {
        route.waypoints.forEach((wp) => {
          ctx.fillStyle = route.color;
          ctx.beginPath();
          ctx.arc(wp.x, wp.y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    });

    // 5. Draw Historic Landmark Pins
    SIRAH_PLACES.forEach((place) => {
      const isSelected = selectedPlace?.id === place.id;
      const x = place.mapX;
      const y = place.mapY;

      // Outer Glow circle
      ctx.fillStyle = isSelected ? "rgba(212, 175, 55, 0.35)" : "rgba(212, 175, 55, 0.12)";
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 16 : 9, 0, Math.PI * 2);
      ctx.fill();

      // Pin core
      ctx.fillStyle = isSelected ? "#ffffff" : "#d4af37";
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();

      // Pin Label
      ctx.font = isSelected ? "bold 13px 'Inter', sans-serif" : "11px 'Inter', sans-serif";
      ctx.fillStyle = isSelected ? "#ffd700" : "#cbd5e1";
      ctx.textAlign = "center";
      ctx.fillText(place.name, x, y - (isSelected ? 20 : 12));
    });

    ctx.restore();
  }, [pan, zoom, selectedPlace, activeRouteId]);

  useEffect(() => {
    renderMap();
  }, [renderMap]);

  // Window resize handler for canvas
  useEffect(() => {
    const handleResize = () => renderMap();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [renderMap]);

  // Mouse / Touch Interaction for Map
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    setZoom((prev) => Math.min(Math.max(0.6, prev * zoomFactor), 3.5));
  };

  // Canvas Click Detection on Landmark Pins
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert screen coordinates to canvas world coordinates
    const worldX = (clickX - (canvas.clientWidth / 2 + pan.x)) / zoom + 500;
    const worldY = (clickY - (canvas.clientHeight / 2 + pan.y)) / zoom + 400;

    // Find nearest historic landmark
    const clickedPlace = SIRAH_PLACES.find((p) => {
      const dx = p.mapX - worldX;
      const dy = p.mapY - worldY;
      return Math.sqrt(dx * dx + dy * dy) < 25; // hit radius
    });

    if (clickedPlace) {
      setSelectedPlace(clickedPlace);
      showToast(`Lokasi: ${clickedPlace.name}`);
    }
  };

  // Focus on a specific location
  const focusOnPlace = (place: HistoricPlace) => {
    setSelectedPlace(place);
    setActiveTab("map");
    // Center pan on the target
    setPan({
      x: (500 - place.mapX) * 1.5,
      y: (400 - place.mapY) * 1.5
    });
    setZoom(1.5);
    showToast(`Membidik: ${place.name} 📍`);
  };

  // Guided Automated Hijrah Tour
  const runGuidedHijrahTour = () => {
    setIsTouring(true);
    setActiveRouteId("hijrah");
    setActiveTab("map");
    showToast("Memulai Tur Ekspedisi Hijrah 🐪");

    const tourSteps = [
      { placeId: "makkah", zoom: 1.6, delay: 0 },
      { placeId: "gua-tsur", zoom: 2.0, delay: 3000 },
      { placeId: "quba", zoom: 1.8, delay: 6500 },
      { placeId: "yatsrib", zoom: 1.6, delay: 10000 },
    ];

    tourSteps.forEach((step) => {
      setTimeout(() => {
        const p = SIRAH_PLACES.find((x) => x.id === step.placeId);
        if (p) {
          setSelectedPlace(p);
          setPan({
            x: (500 - p.mapX) * step.zoom,
            y: (400 - p.mapY) * step.zoom
          });
          setZoom(step.zoom);
        }
      }, step.delay);
    });

    setTimeout(() => {
      setIsTouring(false);
      showToast("Tur Ekspedisi Hijrah selesai ✨");
    }, 13500);
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return SIRAH_EVENTS.filter((ev) => {
      const matchPhase =
        selectedPhase === "all" ||
        ev.phase === selectedPhase ||
        (selectedPhase === "battle" && ev.category === "battle") ||
        (selectedPhase === "peace" && ev.category === "treaty");

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        ev.title.toLowerCase().includes(q) ||
        ev.summary.toLowerCase().includes(q) ||
        ev.leadership.lesson.toLowerCase().includes(q) ||
        ev.yearM.toString().includes(q);

      return matchPhase && matchQuery;
    });
  }, [selectedPhase, searchQuery]);

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

  // Audio Speech Narration with stream proxy & clean abortion
  const speakNarrative = (event: SirahEvent) => {
    playAmbientChime();
    stopActiveAudio();

    showToast("Memutar narasi sirah nabawiyah 🔊");

    try {
      const narrativeText = `${event.title}. ${event.summary}. Pelajaran Kepemimpinan: ${event.leadership.title}. ${event.leadership.lesson}`;
      const audioUrl = `/api/audio/tts?text=${encodeURIComponent(narrativeText)}&lang=id`;
      const audio = new Audio(audioUrl);
      activeAudioRef.current = audio;

      audio.onerror = () => {
        if ((audio as any)._aborted) return;
        console.warn("Sirah audio stream error");
      };

      const p = audio.play();
      if (p !== undefined) {
        p.catch((err) => {
          if ((audio as any)._aborted) return;
          console.warn("Sirah narration play error:", err);
        });
      }
    } catch {
      // ignore
    }
  };

  // --------------------------------------------------------------------------
  // HTML5 Canvas Story Card (9:16)
  // --------------------------------------------------------------------------
  const openStoryModal = (ev: SirahEvent) => {
    setStoryEvent(ev);
    setStoryModalOpen(true);
  };

  const drawStoryCanvas = useCallback(() => {
    if (!storyCanvasRef.current || !storyEvent) return;
    const canvas = storyCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = 1080;
    const h = 1920;
    canvas.width = w;
    canvas.height = h;

    const isLight = storyTheme === "ivory";

    if (storyTheme === "obsidian") {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#080c14");
      grad.addColorStop(0.5, "#0e1526");
      grad.addColorStop(1, "#05080e");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const radial = ctx.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, 650);
      radial.addColorStop(0, "rgba(212, 175, 55, 0.18)");
      radial.addColorStop(1, "transparent");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, w, h);
    } else if (storyTheme === "parchment") {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#23180c");
      grad.addColorStop(0.5, "#2f2010");
      grad.addColorStop(1, "#181007");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const radial = ctx.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, 650);
      radial.addColorStop(0, "rgba(245, 158, 11, 0.2)");
      radial.addColorStop(1, "transparent");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, w, h);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#fdfcf9");
      grad.addColorStop(0.5, "#f7f3ea");
      grad.addColorStop(1, "#ebe4d5");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const radial = ctx.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, 600);
      radial.addColorStop(0, "rgba(180, 83, 9, 0.12)");
      radial.addColorStop(1, "transparent");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, w, h);
    }

    // Outer & Inner Borders
    ctx.strokeStyle = isLight ? "rgba(180, 83, 9, 0.45)" : "rgba(212, 175, 55, 0.45)";
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 50, w - 100, h - 100);

    ctx.strokeStyle = isLight ? "rgba(180, 83, 9, 0.25)" : "rgba(212, 175, 55, 0.25)";
    ctx.lineWidth = 2;
    ctx.strokeRect(70, 70, w - 140, h - 140);

    // Header Emblem
    ctx.textAlign = "center";
    ctx.font = "bold 26px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#b45309" : "#d4af37";
    ctx.letterSpacing = "6px";
    ctx.fillText("EXPEDIENT GENERATION 43", w / 2, 170);

    ctx.font = "20px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#78350f" : "#94a3b8";
    ctx.letterSpacing = "3px";
    ctx.fillText("SIRAH NABAWIYAH & JEJAK KEPEMIMPINAN", w / 2, 210);

    ctx.font = "32px 'Amiri', serif";
    ctx.fillStyle = isLight ? "#b45309" : "#d4af37";
    ctx.fillText("✦  —  ۞  —  ✦", w / 2, 280);

    // Chronology Date Badge
    ctx.font = "bold 24px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#b45309" : "#d4af37";
    ctx.fillText(storyEvent.dateString.toUpperCase(), w / 2, 380);

    // Arabic Event Title
    ctx.font = "bold 64px 'Amiri', 'Traditional Arabic', serif";
    ctx.fillStyle = isLight ? "#0f172a" : "#ffffff";
    ctx.fillText(storyEvent.arabicTitle, w / 2, 490);

    // Latin Event Title
    ctx.font = "bold 42px 'Playfair Display', serif";
    ctx.fillStyle = isLight ? "#b45309" : "#d4af37";
    ctx.fillText(storyEvent.title, w / 2, 570);

    // Quran Reference
    if (storyEvent.quranRef) {
      ctx.font = "bold 22px 'Inter', sans-serif";
      ctx.fillStyle = isLight ? "#059669" : "#34d399";
      ctx.fillText(`📖 Dalil: ${storyEvent.quranRef}`, w / 2, 630);
    }

    // Divider
    ctx.strokeStyle = isLight ? "rgba(180, 83, 9, 0.35)" : "rgba(212, 175, 55, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 200, 670);
    ctx.lineTo(w / 2 + 200, 670);
    ctx.stroke();

    // Narrative Box
    const boxW = w - 240;
    const boxH = 340;
    const boxY = 720;

    ctx.fillStyle = isLight ? "rgba(180, 83, 9, 0.06)" : "rgba(212, 175, 55, 0.08)";
    ctx.strokeStyle = isLight ? "rgba(180, 83, 9, 0.25)" : "rgba(212, 175, 55, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect((w - boxW) / 2, boxY, boxW, boxH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font = "bold 24px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#b45309" : "#d4af37";
    ctx.fillText("📜 RINGKASAN PERISTIWA", w / 2, boxY + 50);

    ctx.font = "24px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#475569" : "#cbd5e1";
    const words = storyEvent.detailedStory.split(" ");
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
      ctx.fillText(l, w / 2, boxY + 110 + idx * 42);
    });

    // Leadership Box
    const leaderY = boxY + boxH + 40;
    const leaderH = 460;

    ctx.fillStyle = isLight ? "rgba(245, 158, 11, 0.08)" : "rgba(245, 158, 11, 0.12)";
    ctx.strokeStyle = isLight ? "rgba(245, 158, 11, 0.35)" : "rgba(245, 158, 11, 0.4)";
    ctx.beginPath();
    ctx.roundRect((w - boxW) / 2, leaderY, boxW, leaderH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font = "bold 26px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#b45309" : "#f59e0b";
    ctx.fillText(`⚡ PILAR KEPEMIMPINAN: ${storyEvent.leadership.title.toUpperCase()}`, w / 2, leaderY + 55);

    ctx.font = "22px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#334155" : "#e2e8f0";

    const lWords = storyEvent.leadership.lesson.split(" ");
    let lLine = "";
    const lLines = [];
    for (let n = 0; n < lWords.length; n++) {
      const testLine = lLine + lWords[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > boxW - 80 && n > 0) {
        lLines.push(lLine.trim());
        lLine = lWords[n] + " ";
      } else {
        lLine = testLine;
      }
    }
    lLines.push(lLine.trim());

    lLines.slice(0, 4).forEach((l, idx) => {
      ctx.fillText(l, w / 2, leaderY + 115 + idx * 38);
    });

    // Modern Application Sub-box
    const appBoxY = leaderY + 280;
    ctx.fillStyle = isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.roundRect((w - boxW) / 2 + 30, appBoxY, boxW - 60, 140, 12);
    ctx.fill();

    ctx.font = "bold 20px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#b45309" : "#d4af37";
    ctx.fillText("💼 RELEVANSI KARIR & ALUMNI:", w / 2, appBoxY + 38);

    ctx.font = "20px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#475569" : "#cbd5e1";
    const appWords = storyEvent.leadership.modernApplication.split(" ");
    let aLine = "";
    const aLines = [];
    for (let n = 0; n < appWords.length; n++) {
      const testLine = aLine + appWords[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > boxW - 120 && n > 0) {
        aLines.push(aLine.trim());
        aLine = appWords[n] + " ";
      } else {
        aLine = testLine;
      }
    }
    aLines.push(aLine.trim());

    aLines.slice(0, 2).forEach((l, idx) => {
      ctx.fillText(l, w / 2, appBoxY + 75 + idx * 32);
    });

    // Footer
    ctx.font = "22px 'Inter', sans-serif";
    ctx.fillStyle = isLight ? "#94a3b8" : "#64748b";
    ctx.fillText("Alumni Angkatan 43 • Meneladani Jejak Sang Pemimpin Agung", w / 2, h - 130);
  }, [storyEvent, storyTheme]);

  useEffect(() => {
    if (storyModalOpen && storyEvent) {
      setTimeout(drawStoryCanvas, 60);
    }
  }, [storyModalOpen, storyEvent, drawStoryCanvas]);

  const downloadStoryImage = () => {
    if (!storyCanvasRef.current || !storyEvent) return;
    const link = document.createElement("a");
    link.download = `sirah-${storyEvent.yearM}-${storyEvent.id}.png`;
    link.href = storyCanvasRef.current.toDataURL("image/png");
    link.click();
    showToast("Story card Sirah berhasil diunduh! 📲");
  };

  const shareToWhatsApp = (ev: SirahEvent) => {
    const text = `*Jejak Sirah Nabawiyah: ${ev.title}*\n_${ev.dateString}_\n\n« *${ev.arabicTitle}* »\n\n"${ev.summary}"\n\n⚡ *Pilar Kepemimpinan (${ev.leadership.title}):*\n${ev.leadership.lesson}\n\n💼 *Aplikasi Modern:*\n${ev.leadership.modernApplication}\n\nJelajahi peta interaktif: https://angkatan43.id/sirah`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="sirah-page-wrapper">
      <div className="sirah-bg-ambient" />

      <div className="sirah-container">
        {/* Top Action / Back Button */}
        <div className="sirah-top-actions">
          <Link href="/fitur" className="btn-back">
            <i className="fa-solid fa-arrow-left"></i> Kembali ke Menu Fitur
          </Link>
        </div>

        {/* Header */}
        <header className="sirah-header">
          <div className="sirah-badge">
            <span>🕌</span>
            <span>Ekspedisi Sejarah & Kepemimpinan</span>
          </div>
          <h1 className="sirah-title">SIRAH NABAWIYAH 3D</h1>
          <p className="sirah-subtitle">
            Peta kartografi manuskrip kuno Jazirah Arab, linimasa peristiwa agung Makkah & Madinah, dan tadabbur prinsip kepemimpinan modern Rasulullah SAW.
          </p>
        </header>

        {/* Tab Navigation */}
        <nav className="sirah-tabs-nav" aria-label="Navigasi Fitur Sirah">
          <button
            type="button"
            className={`sirah-tab-btn ${activeTab === "map" ? "active" : ""}`}
            onClick={() => setActiveTab("map")}
          >
            <span>🗺️</span>
            <span>Peta Manuskrip</span>
          </button>
          <button
            type="button"
            className={`sirah-tab-btn ${activeTab === "timeline" ? "active" : ""}`}
            onClick={() => setActiveTab("timeline")}
          >
            <span>📜</span>
            <span>Linimasa Akbar</span>
          </button>
          <button
            type="button"
            className={`sirah-tab-btn ${activeTab === "leadership" ? "active" : ""}`}
            onClick={() => setActiveTab("leadership")}
          >
            <span>⚡</span>
            <span>Prinsip Kepemimpinan</span>
          </button>
        </nav>

        {/* ------------------------------------------------------------------
            TAB 1: PETA MANUSKRIP KARTOGRAFI 2.5D INTERAKTIF
            ------------------------------------------------------------------ */}
        {activeTab === "map" && (
          <div className="sirah-map-card">
            {/* Toolbar Route Selection */}
            <div className="sirah-map-toolbar">
              <div className="route-selector-group">
                <span style={{ fontSize: "0.76rem", color: "var(--gold-main)", fontWeight: 700 }}>
                  RUTE KAFILAH:
                </span>
                {SIRAH_ROUTES.map((route) => (
                  <button
                    key={route.id}
                    type="button"
                    className={`route-chip ${activeRouteId === route.id ? "active" : ""}`}
                    onClick={() => {
                      setActiveRouteId(route.id);
                      showToast(`Rute: ${route.name}`);
                    }}
                  >
                    <span>📍</span>
                    <span>{route.name}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="sirah-action-btn primary"
                onClick={runGuidedHijrahTour}
                disabled={isTouring}
              >
                <span>{isTouring ? "⏳ Berlayar..." : "🐪 Tur Ekspedisi Hijrah"}</span>
              </button>
            </div>

            {/* Interactive Canvas Viewport */}
            <div className="sirah-canvas-wrapper">
              <canvas
                ref={canvasRef}
                className="sirah-main-canvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onClick={handleCanvasClick}
              />

              {/* Compass HUD */}
              <div className="map-compass-hud">
                <span>🧭</span>
                <span>JAZIRAH ARAB (610-632 M)</span>
              </div>

              {/* Floating Zoom / Reset Controls */}
              <div className="map-float-controls">
                <button
                  type="button"
                  className="map-control-btn"
                  onClick={() => setZoom((z) => Math.min(3.5, z * 1.25))}
                  title="Perbesar"
                >
                  +
                </button>
                <button
                  type="button"
                  className="map-control-btn"
                  onClick={() => setZoom((z) => Math.max(0.6, z * 0.8))}
                  title="Perkecil"
                >
                  -
                </button>
                <button
                  type="button"
                  className="map-control-btn"
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                    setSelectedPlace(null);
                  }}
                  title="Reset Kamera"
                >
                  ↺
                </button>
              </div>

              {/* Selected Place Pop-up Overlay */}
              {selectedPlace && (
                <div className="map-selected-place-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="event-date-badge">{selectedPlace.region}</span>
                    <button
                      type="button"
                      style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                      onClick={() => setSelectedPlace(null)}
                    >
                      ✕
                    </button>
                  </div>
                  <h4 className="place-card-name">{selectedPlace.name}</h4>
                  <p className="place-card-arabic">{selectedPlace.arabic}</p>
                  <p className="place-card-desc">{selectedPlace.description}</p>
                  <div style={{ fontSize: "0.72rem", color: "var(--gold-main)", marginTop: "4px" }}>
                    📍 {selectedPlace.distanceInfo}
                  </div>
                </div>
              )}
            </div>

            {/* Sub-bar Description */}
            <div style={{ fontSize: "0.82rem", color: "#94a3b8", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <span>💡 Geser / drag untuk menjelajahi peta. Scroll atau cubit untuk memperbesar. Klik titik nama untuk detail.</span>
              <span style={{ color: "var(--gold-main)", fontWeight: 600 }}>Total 13 Lokasi & 3 Rute Akbar</span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            TAB 2: LINIMASA SEJARAH AKBAR
            ------------------------------------------------------------------ */}
        {activeTab === "timeline" && (
          <div className="sirah-timeline-container">
            {/* Search and Filters */}
            <div className="timeline-filters">
              <input
                type="text"
                placeholder="Cari peristiwa sejarah, tahun, atau nama tokoh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: "1 1 240px",
                  background: "rgba(12, 18, 30, 0.7)",
                  border: "1px solid rgba(212, 175, 55, 0.25)",
                  borderRadius: "14px",
                  padding: "10px 16px",
                  color: "#ffffff",
                  fontSize: "0.86rem",
                  outline: "none"
                }}
              />

              {(["all", "makkah", "madinah", "battle", "peace"] as SirahPhase[]).map((phase) => (
                <button
                  key={phase}
                  type="button"
                  className={`timeline-filter-chip ${selectedPhase === phase ? "active" : ""}`}
                  onClick={() => setSelectedPhase(phase)}
                >
                  {phase === "all"
                    ? "Semua (15)"
                    : phase === "makkah"
                    ? "Fase Makkah"
                    : phase === "madinah"
                    ? "Fase Madinah"
                    : phase === "battle"
                    ? "Perang Besar"
                    : "Diplomasi"}
                </button>
              ))}
            </div>

            {/* Timeline Vertical Track */}
            <div className="timeline-list">
              {filteredEvents.map((ev) => {
                const place = SIRAH_PLACES.find((p) => p.id === ev.locationId);

                return (
                  <div key={ev.id} className="timeline-item-node">
                    <div className="timeline-node-pin" />
                    <article className="sirah-event-card" onClick={() => { playPinClick(); setSelectedEvent(ev); }}>
                      <div className="event-card-header">
                        <span className="event-date-badge">{ev.dateString}</span>
                        <span className={`event-phase-tag ${ev.phase}`}>
                          {ev.phase === "makkah" ? "Fase Makkah" : "Fase Madinah"}
                        </span>
                      </div>

                      <h3 className="event-card-title">{ev.title}</h3>
                      <p className="event-card-arabic">{ev.arabicTitle}</p>
                      <p className="event-card-summary">{ev.summary}</p>

                      <div className="event-leadership-pill">
                        <span>⚡</span>
                        <span>
                          <strong>{ev.leadership.title}:</strong> {ev.leadership.lesson.slice(0, 85)}...
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                          📍 {place ? place.name : "Jazirah Arab"}
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "var(--gold-main)", fontWeight: 600 }}>
                          Lihat Hikmah & Peta ➜
                        </span>
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            TAB 3: PRINSIP KEPEMIMPINAN SIRAH
            ------------------------------------------------------------------ */}
        {activeTab === "leadership" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "18px", width: "100%" }}>
            {SIRAH_EVENTS.map((ev) => (
              <article
                key={ev.id}
                className="sirah-leadership-card"
                style={{ cursor: "pointer" }}
                onClick={() => { playPinClick(); setSelectedEvent(ev); }}
              >
                <div className="leadership-header">
                  <span>⚡</span>
                  <span>{ev.leadership.title}</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--gold-main)", fontWeight: 600 }}>
                  Dari Peristiwa: {ev.title} ({ev.dateString})
                </div>
                <p className="leadership-lesson">{ev.leadership.lesson}</p>

                <div className="leadership-modern-box">
                  <div style={{ fontWeight: 700, fontSize: "0.76rem", marginBottom: "3px" }}>
                    💼 Aplikasi Modern Alumni:
                  </div>
                  {ev.leadership.modernApplication}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* ------------------------------------------------------------------
            MODAL DETAIL: PERISTIWA & HIKMAH KEPEMIMPINAN
            ------------------------------------------------------------------ */}
        {selectedEvent && (
          <div className="sirah-modal-overlay" onClick={() => setSelectedEvent(null)}>
            <div className="sirah-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="sirah-modal-header">
                <div>
                  <span className="event-date-badge">{selectedEvent.dateString}</span>
                  <h2 className="sirah-modal-title" style={{ marginTop: "6px" }}>{selectedEvent.title}</h2>
                  <p className="sirah-modal-arabic">{selectedEvent.arabicTitle}</p>
                </div>
                <button
                  type="button"
                  className="sirah-modal-close"
                  onClick={() => setSelectedEvent(null)}
                >
                  ✕
                </button>
              </div>

              {/* Narrative Story */}
              <div className="sirah-story-box">
                <div style={{ fontWeight: 700, color: "var(--gold-main)", marginBottom: "6px" }}>
                  📜 Catatan Peristiwa:
                </div>
                {selectedEvent.detailedStory}
                {selectedEvent.quranRef && (
                  <div style={{ marginTop: "10px", color: "#34d399", fontSize: "0.8rem", fontWeight: 600 }}>
                    📖 Rujukan Dalil: {selectedEvent.quranRef}
                  </div>
                )}
              </div>

              {/* Leadership Pillar */}
              <div className="sirah-leadership-card">
                <div className="leadership-header">
                  <span>⚡</span>
                  <span>{selectedEvent.leadership.title}</span>
                </div>
                <p className="leadership-lesson">{selectedEvent.leadership.lesson}</p>

                <div className="leadership-modern-box">
                  <div style={{ fontWeight: 700, fontSize: "0.78rem", marginBottom: "4px" }}>
                    💼 Aplikasi di Dunia Nyata / Alumni:
                  </div>
                  {selectedEvent.leadership.modernApplication}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="sirah-modal-footer-actions">
                {selectedEvent.locationId && (
                  <button
                    type="button"
                    className="sirah-action-btn"
                    onClick={() => {
                      const pl = SIRAH_PLACES.find((p) => p.id === selectedEvent.locationId);
                      if (pl) {
                        setSelectedEvent(null);
                        focusOnPlace(pl);
                      }
                    }}
                  >
                    <span>📍</span>
                    <span>Bidik di Peta</span>
                  </button>
                )}
                <button
                  type="button"
                  className="sirah-action-btn"
                  onClick={() => speakNarrative(selectedEvent)}
                >
                  <span>🔊</span>
                  <span>Lafalkan Narasi</span>
                </button>
                <button
                  type="button"
                  className="sirah-action-btn primary"
                  onClick={() => openStoryModal(selectedEvent)}
                >
                  <span>🎨</span>
                  <span>Buat Story Card</span>
                </button>
                <button
                  type="button"
                  className="sirah-action-btn"
                  onClick={() => shareToWhatsApp(selectedEvent)}
                >
                  <span>📲</span>
                  <span>Bagikan ke WA</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            MODAL STORY CARD GENERATOR (HTML5 CANVAS)
            ------------------------------------------------------------------ */}
        {storyModalOpen && storyEvent && (
          <div className="sirah-modal-overlay" onClick={() => setStoryModalOpen(false)}>
            <div className="sirah-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="sirah-modal-header">
                <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--gold-main)" }}>
                  🎨 Generator Story Card Sirah 9:16
                </span>
                <button
                  type="button"
                  className="sirah-modal-close"
                  onClick={() => setStoryModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              {/* Theme Selector */}
              <div style={{ display: "flex", gap: "8px", justifyContent: "center", width: "100%" }}>
                {(["obsidian", "parchment", "ivory"] as StoryTheme[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`timeline-filter-chip ${storyTheme === t ? "active" : ""}`}
                    onClick={() => setStoryTheme(t)}
                  >
                    {t === "obsidian" ? "Obsidian Gold" : t === "parchment" ? "Ancient Parchment" : "Royal Ivory"}
                  </button>
                ))}
              </div>

              {/* 9:16 Canvas Preview */}
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
                <canvas ref={storyCanvasRef} style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }} />
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                <button
                  type="button"
                  className="sirah-action-btn primary"
                  style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "0.9rem" }}
                  onClick={downloadStoryImage}
                >
                  <span>📥</span>
                  <span>Unduh Gambar Story (PNG HD)</span>
                </button>
                <button
                  type="button"
                  className="sirah-action-btn"
                  style={{ width: "100%", justifyContent: "center", padding: "10px", fontSize: "0.85rem" }}
                  onClick={() => shareToWhatsApp(storyEvent)}
                >
                  <span>📲</span>
                  <span>Bagikan Teks ke WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Toast Notification */}
        {toastMessage && <div className="sirah-toast">{toastMessage}</div>}
      </div>
    </div>
  );
}

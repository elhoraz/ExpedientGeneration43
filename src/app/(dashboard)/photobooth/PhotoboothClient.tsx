"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import html2canvas from "html2canvas";
import "./photobooth.css";

type LayoutMode = "korean-4cut" | "grid-2x2" | "retro-3cut" | "polaroid";
type FilterMode = "normal" | "golden" | "noir" | "vintage" | "emerald" | "cyber" | "pastel";
type FrameTheme =
  | "ticket"
  | "receipt"
  | "scrapbook"
  | "doodle"
  | "mihrab"
  | "sovereign"
  | "white"
  | "film"
  | "santri"
  | "sakura"
  | "cyber"
  | "parchment"
  | "ocean"
  | "velvet"
  | "y2k"
  | "botanical"
  | "monolith"
  | "custom";
type AspectRatioMode = "classic" | "square" | "portrait";

interface PhotoItem {
  image: string;
  video?: string;
}

interface PlacedSticker {
  id: string;
  emoji: string;
  top: number;
  left: number;
  scale?: number;
}

export default function PhotoboothClient() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Sticker dragging states
  const [draggingStickerId, setDraggingStickerId] = useState<string | null>(null);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);

  // Studio States
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Mode: Foto Diam vs Foto Live
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isLivePlaying, setIsLivePlaying] = useState(true);

  // Configuration
  const [layout, setLayout] = useState<LayoutMode>("korean-4cut");
  const [filter, setFilter] = useState<FilterMode>("normal");
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [theme, setTheme] = useState<FrameTheme>("sovereign");

  // Frame Layout Customizations
  const [frameGap, setFrameGap] = useState<number>(10);
  const [frameRadius, setFrameRadius] = useState<number>(6);
  const [photoAspect, setPhotoAspect] = useState<AspectRatioMode>("classic");
  const [customBgColor, setCustomBgColor] = useState<string>("#0d0d10");

  // Frame Element Toggles
  const [showHeader, setShowHeader] = useState(true);
  const [showDivider, setShowDivider] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [showCrest, setShowCrest] = useState(true);

  // Captions
  const [captionTitle, setCaptionTitle] = useState("Expedient Generation");
  const [captionDate, setCaptionDate] = useState(() => {
    const d = new Date();
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  });

  // Photo captures
  const [photos, setPhotos] = useState<(PhotoItem | null)[]>([null, null, null, null]);
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownNum, setCountdownNum] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Stickers
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);

  // Total slots based on layout
  const totalSlots = layout === "polaroid" ? 1 : layout === "retro-3cut" ? 3 : 4;

  // Safe Haptic Vibration
  const triggerHaptic = (ms: number = 30) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {}
    }
  };

  // Synthesized Web Audio Chime for Shutter
  const playBeep = (freq: number = 600, duration: number = 0.1) => {
    if (typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  };

  // Completely Stop Camera Hardware
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setIsCameraReady(false);
  }, []);

  // Initialize Camera Stream
  const startCamera = useCallback(async (facing: "user" | "environment") => {
    setCameraError(null);
    setIsCameraReady(false);

    // Stop any existing stream first to avoid hardware lock
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser ini tidak mendukung akses kamera langsung.");
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      streamRef.current = newStream;
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      }
    } catch (err: any) {
      console.warn("Camera access error:", err);
      setCameraError(err.message || "Izin akses kamera tidak diberikan.");
      setIsCameraReady(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    startCamera(cameraFacing);

    // Guarantee camera turns off when leaving the page or closing tab
    const handleUnload = () => {
      stopCamera();
    };
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    return () => {
      stopCamera();
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, [stopCamera]);

  // Flip Camera (Mobile)
  const handleToggleFacing = () => {
    triggerHaptic(20);
    const nextFacing = cameraFacing === "user" ? "environment" : "user";
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // Compute CSS filter string
  const getFilterStyle = () => {
    let base = "";
    if (filter === "golden") {
      base = "sepia(0.25) saturate(1.2) contrast(1.05) brightness(1.04)";
    } else if (filter === "noir") {
      base = "grayscale(1) contrast(1.3) brightness(0.95)";
    } else if (filter === "vintage") {
      base = "sepia(0.4) saturate(0.85) contrast(1.1) hue-rotate(-10deg)";
    } else if (filter === "emerald") {
      base = "hue-rotate(45deg) saturate(1.15) brightness(1.02)";
    } else if (filter === "cyber") {
      base = "hue-rotate(180deg) saturate(1.4) contrast(1.15)";
    } else if (filter === "pastel") {
      base = "sepia(0.15) brightness(1.08) saturate(0.9) contrast(0.95)";
    } else {
      base = "none";
    }

    if (brightness !== 100 || contrast !== 100) {
      base += ` brightness(${brightness / 100}) contrast(${contrast / 100})`;
    }
    return base;
  };

  // Capture Still Video Frame to Base64 Image
  const captureFrame = (): string | null => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // If front camera, mirror image to match viewfinder
    if (cameraFacing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.95);
  };

  // Start Live Motion Clip Recording (MediaRecorder)
  const recordLiveClip = (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!stream || typeof MediaRecorder === "undefined") {
        resolve(null);
        return;
      }

      try {
        let mimeType = "video/webm";
        if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
          mimeType = "video/webm;codecs=vp8";
        } else if (MediaRecorder.isTypeSupported("video/mp4")) {
          mimeType = "video/mp4";
        }

        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          const videoUrl = URL.createObjectURL(blob);
          resolve(videoUrl);
        };

        recorder.start();
        setTimeout(() => {
          if (recorder.state === "recording") {
            recorder.stop();
          }
        }, 1800); // Record 1.8 seconds live snippet
      } catch (err) {
        console.warn("Live recording error:", err);
        resolve(null);
      }
    });
  };

  // Trigger Countdown & Shutter
  const triggerShutter = async () => {
    if (isCountingDown) return;
    triggerHaptic(40);
    setIsCountingDown(true);
    let count = 3;
    setCountdownNum(count);
    playBeep(440, 0.1);

    const timer = setInterval(async () => {
      count -= 1;
      if (count > 0) {
        setCountdownNum(count);
        playBeep(440, 0.1);
        triggerHaptic(20);
      } else {
        clearInterval(timer);
        setCountdownNum(null);
        setIsCountingDown(false);

        // Flash & Shutter
        playBeep(880, 0.25);
        triggerHaptic(80);
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 200);

        // Save Still Frame
        const stillFrame = captureFrame();

        // If Live Photo Mode, record video loop concurrently
        let liveVideoUrl: string | undefined;
        if (isLiveMode && stream) {
          const recorded = await recordLiveClip();
          if (recorded) liveVideoUrl = recorded;
        }

        if (stillFrame) {
          setPhotos((prev) => {
            const next = [...prev];
            next[activeSlot] = {
              image: stillFrame,
              video: liveVideoUrl,
            };
            return next;
          });

          // Advance to next empty slot
          const nextSlot = (activeSlot + 1) % totalSlots;
          setActiveSlot(nextSlot);
        }
      }
    }, 1000);
  };

  // Handle Fallback Photo Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setPhotos((prev) => {
          const next = [...prev];
          next[activeSlot] = { image: dataUrl };
          return next;
        });
        setActiveSlot((prev) => (prev + 1) % totalSlots);
        triggerHaptic(20);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Retake Slot
  const handleRetakeSlot = (index: number) => {
    triggerHaptic(20);
    setPhotos((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    setActiveSlot(index);
  };

  // Reset All Slots
  const handleResetAll = () => {
    triggerHaptic(30);
    setPhotos([null, null, null, null]);
    setActiveSlot(0);
    setStickers([]);
  };

  // Add Sticker
  const handleAddSticker = (emoji: string) => {
    triggerHaptic(15);
    const newSticker: PlacedSticker = {
      id: "stk_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      emoji,
      top: 35 + Math.random() * 30,
      left: 20 + Math.random() * 60,
      scale: 1,
    };
    setStickers((prev) => [...prev, newSticker]);
    setSelectedStickerId(newSticker.id);
  };

  // Sticker Dragging Pointer Events (Universal for Mouse & Mobile Touch)
  const handleStickerPointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    triggerHaptic(15);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    setDraggingStickerId(id);
    setSelectedStickerId(id);
  };

  const handleStickerPointerMove = (e: React.PointerEvent, id: string) => {
    if (draggingStickerId !== id || !stripRef.current) return;
    e.stopPropagation();

    const stripRect = stripRef.current.getBoundingClientRect();
    const rawX = e.clientX - stripRect.left;
    const rawY = e.clientY - stripRect.top;

    // Convert to percentage of photostrip card
    let leftPercent = (rawX / stripRect.width) * 100;
    let topPercent = (rawY / stripRect.height) * 100;

    // Strict boundary clamping so stickers NEVER escape the photostrip card
    leftPercent = Math.max(6, Math.min(92, leftPercent));
    topPercent = Math.max(4, Math.min(94, topPercent));

    setStickers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, left: leftPercent, top: topPercent } : s))
    );
  };

  const handleStickerPointerUp = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setDraggingStickerId(null);
  };

  // Resize Individual Sticker (+ / -)
  const handleResizeSticker = (id: string, delta: number, e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    triggerHaptic(15);
    setStickers((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const currentScale = s.scale || 1;
        const nextScale = Math.max(0.7, Math.min(2.2, Number((currentScale + delta).toFixed(1))));
        return { ...s, scale: nextScale };
      })
    );
  };

  // Delete Individual Sticker
  const handleDeleteSticker = (id: string, e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    triggerHaptic(25);
    setStickers((prev) => prev.filter((s) => s.id !== id));
    if (selectedStickerId === id) setSelectedStickerId(null);
  };

  // Delete All Stickers
  const handleClearAllStickers = () => {
    triggerHaptic(30);
    setStickers([]);
    setSelectedStickerId(null);
  };

  // Export Photostrip to PNG or Story
  const handleDownloadStrip = async (mode: "strip" | "story") => {
    if (!stripRef.current) return;
    setIsExporting(true);
    triggerHaptic(30);

    try {
      const canvas = await html2canvas(stripRef.current, {
        scale: 3, // High-res 300dpi equivalent
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });

      let finalCanvas = canvas;

      // If Story Mode (9:16), pad canvas onto 9:16 background
      if (mode === "story") {
        const storyCanvas = document.createElement("canvas");
        const targetWidth = 1080;
        const targetHeight = 1920;
        storyCanvas.width = targetWidth;
        storyCanvas.height = targetHeight;
        const ctx = storyCanvas.getContext("2d");
        if (ctx) {
          // Luxury dark radial background for story
          const gradient = ctx.createRadialGradient(
            targetWidth / 2,
            targetHeight / 2,
            100,
            targetWidth / 2,
            targetHeight / 2,
            targetHeight / 1.2
          );
          gradient.addColorStop(0, "#15151a");
          gradient.addColorStop(1, "#050507");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, targetWidth, targetHeight);

          // Draw golden glow behind photostrip
          ctx.shadowColor = "rgba(212, 175, 55, 0.35)";
          ctx.shadowBlur = 60;

          // Scale photostrip to fit comfortably in story center
          const scaleFactor = (targetHeight * 0.78) / canvas.height;
          const stripW = canvas.width * scaleFactor;
          const stripH = canvas.height * scaleFactor;
          const stripX = (targetWidth - stripW) / 2;
          const stripY = (targetHeight - stripH) / 2;

          ctx.drawImage(canvas, stripX, stripY, stripW, stripH);

          // Branding header in story
          ctx.shadowBlur = 0;
          ctx.font = "bold 28px 'Inter', sans-serif";
          ctx.fillStyle = "#d4af37";
          ctx.textAlign = "center";
          ctx.fillText("EXPEDIENT GENERATION 42ND ARRISALAH", targetWidth / 2, 90);

          ctx.font = "18px 'Inter', sans-serif";
          ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
          ctx.fillText("The Official Photostrip Archive", targetWidth / 2, 125);

          finalCanvas = storyCanvas;
        }
      }

      const dataUrl = finalCanvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `Expedient_Photostrip_${layout}_${Date.now()}.png`;
      a.click();
      triggerHaptic(50);
    } catch (error) {
      console.error("Export error:", error);
      alert("Gagal mengekspor foto strip. Silakan coba lagi.");
    } finally {
      setIsExporting(false);
    }
  };

  // Export Live Video Strip (WebM / Video Loop)
  const handleExportLiveVideo = async () => {
    if (!stripRef.current) return;
    setIsExporting(true);
    triggerHaptic(40);

    try {
      const canvas = await html2canvas(stripRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });

      // Check if captureStream is available
      if (!(canvas as any).captureStream) {
        alert("Browser Anda belum mendukung ekspor video canvas. Mengunduh format PNG HD sebagai gantinya.");
        handleDownloadStrip("strip");
        return;
      }

      const stream = (canvas as any).captureStream(30);
      let mimeType = "video/webm";
      if (MediaRecorder.isTypeSupported("video/mp4")) {
        mimeType = "video/mp4";
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `Expedient_Live_Photostrip_${Date.now()}.${mimeType.includes("mp4") ? "mp4" : "webm"}`;
        a.click();
        triggerHaptic(50);
        setIsExporting(false);
      };

      recorder.start();
      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 2500);
    } catch (err) {
      console.error("Live video export error:", err);
      handleDownloadStrip("strip");
    }
  };

  // Determine container background styling
  const getStripBackgroundStyle = () => {
    if (theme === "custom") {
      return { background: customBgColor };
    }
    return {};
  };

  return (
    <div className="photobooth-page">
      {/* Studio Header */}
      <div className="studio-header">
        <div className="studio-badge">
          <i className="fa-solid fa-camera-retro"></i> Aegis Studio Photobooth
        </div>
        <h1 className="studio-title">
          Studio Kenangan <span className="gold-accent">Expedient 42</span>
        </h1>
        <p className="studio-subtitle">
          Abadikan pose terbaikmu dalam photostrip eksklusif. Edit tata letak frame, hapus & pasang stiker sesukamu, terapkan filter tone, dan coba mode Foto Live bergerak!
        </p>

        {/* Live Photo Mode Switcher */}
        <div className="live-mode-toggle-bar">
          <button
            className={`live-mode-btn ${!isLiveMode ? "active" : ""}`}
            onClick={() => { triggerHaptic(15); setIsLiveMode(false); }}
          >
            <i className="fa-solid fa-camera"></i> Foto Diam (Standard)
          </button>
          <button
            className={`live-mode-btn ${isLiveMode ? "active" : ""}`}
            onClick={() => { triggerHaptic(15); setIsLiveMode(true); }}
          >
            <i className="fa-solid fa-video"></i> 📹 Foto Live (Bergerak)
          </button>
        </div>
      </div>

      {/* Main Studio Container */}
      <div className="studio-container">
        {/* =========================================================
            LEFT COLUMN: VIEWFINDER & LIVE CONTROLS
            ========================================================= */}
        <div className="camera-studio-box">
          {/* Live Viewfinder */}
          <div className="viewfinder-wrapper">
            {cameraError ? (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "24px",
                  textAlign: "center",
                  background: "#111116",
                }}
              >
                <i className="fa-solid fa-camera-slash" style={{ fontSize: "2.5rem", color: "#e63946", marginBottom: "12px" }}></i>
                <div style={{ fontWeight: 700, fontSize: "1rem", color: "#fff", marginBottom: "6px" }}>
                  Kamera Tidak Dapat Diakses
                </div>
                <p style={{ fontSize: "0.85rem", color: "#888", maxWidth: "340px", marginBottom: "16px" }}>
                  {cameraError}. Jangan khawatir, Anda tetap bisa memasukkan foto langsung dari galeri ponsel/laptop.
                </p>
                <button
                  className="chip-btn active"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ padding: "10px 20px" }}
                >
                  <i className="fa-solid fa-folder-open"></i> Unggah Foto dari Galeri
                </button>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`viewfinder-video ${cameraFacing === "environment" ? "unmirrored" : ""}`}
                style={{ filter: getFilterStyle() }}
              />
            )}

            {/* Screen Flash Overlay */}
            <div className={`screen-flash ${isFlashing ? "flashing" : ""}`} />

            {/* Countdown Overlay */}
            {isCountingDown && countdownNum !== null && (
              <div className="countdown-overlay">
                <span className="countdown-number">{countdownNum}</span>
              </div>
            )}

            {/* Viewfinder HUD */}
            <div className="viewfinder-hud">
              <div className="hud-top-bar">
                <div className="hud-pill">
                  <span className="hud-rec-dot"></span>
                  <span>{isLiveMode ? "LIVE MOTION READY" : "STUDIO SHOT"}</span>
                </div>
                <div className="hud-pill">
                  <span>
                    POSE {activeSlot + 1} / {totalSlots}
                  </span>
                </div>
              </div>

              {/* Aesthetic dashed frame guide */}
              <div className="hud-frame-guide" />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="hud-pill" style={{ textTransform: "capitalize" }}>
                  <i className="fa-solid fa-wand-magic-sparkles" style={{ color: "#ffd700" }}></i> {filter}
                </div>
                {cameraFacing === "user" && (
                  <div className="hud-pill">
                    <i className="fa-solid fa-arrows-split-up-and-left"></i> Selfie View
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hidden File Input for fallback */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />

          {/* Camera Controls Bar */}
          <div className="camera-controls-bar">
            {/* Flip Camera Button */}
            <button
              className="btn-icon-tool"
              title="Putar Kamera (Depan/Belakang)"
              onClick={handleToggleFacing}
            >
              <i className="fa-solid fa-camera-rotate"></i>
            </button>

            {/* Main Shutter Button */}
            <button
              className="btn-shutter"
              onClick={triggerShutter}
              disabled={isCountingDown}
            >
              <i className={isLiveMode ? "fa-solid fa-video" : "fa-solid fa-camera"}></i>
              <span>{isCountingDown ? "Bersiap..." : isLiveMode ? `Rekam Live (${activeSlot + 1}/${totalSlots})` : `Ambil Foto (${activeSlot + 1}/${totalSlots})`}</span>
            </button>

            {/* Upload Fallback Button */}
            <button
              className="btn-icon-tool"
              title="Unggah dari Galeri"
              onClick={() => fileInputRef.current?.click()}
            >
              <i className="fa-solid fa-upload"></i>
            </button>
          </div>

          {/* Studio Customizer Controls */}
          <div className="studio-tools-accordion">
            {/* 1. Layout Mode */}
            <div>
              <div className="tool-group-label">
                <i className="fa-solid fa-table-cells-large"></i> 1. Format Susunan Foto
              </div>
              <div className="chips-scroll-row">
                <button
                  className={`chip-btn ${layout === "korean-4cut" ? "active" : ""}`}
                  onClick={() => { triggerHaptic(10); setLayout("korean-4cut"); }}
                >
                  <i className="fa-solid fa-grip-vertical"></i> 4-Cut Strip
                </button>
                <button
                  className={`chip-btn ${layout === "grid-2x2" ? "active" : ""}`}
                  onClick={() => { triggerHaptic(10); setLayout("grid-2x2"); }}
                >
                  <i className="fa-solid fa-border-all"></i> 2×2 Grid
                </button>
                <button
                  className={`chip-btn ${layout === "retro-3cut" ? "active" : ""}`}
                  onClick={() => { triggerHaptic(10); setLayout("retro-3cut"); }}
                >
                  <i className="fa-solid fa-ellipsis-vertical"></i> 3-Cut Retro
                </button>
                <button
                  className={`chip-btn ${layout === "polaroid" ? "active" : ""}`}
                  onClick={() => { triggerHaptic(10); setLayout("polaroid"); }}
                >
                  <i className="fa-solid fa-square"></i> Polaroid
                </button>
              </div>
            </div>

            {/* 2. Frame Layout Editor (Jarak, Sudut, Rasio, & Warna) */}
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="tool-group-label">
                <i className="fa-solid fa-sliders"></i> 2. Edit Tata Letak & Desain Frame
              </div>

              {/* Aspect Ratio */}
              <div style={{ marginBottom: "12px" }}>
                <span style={{ fontSize: "0.75rem", color: "#888", display: "block", marginBottom: "6px" }}>Bentuk Bidang Foto:</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className={`toggle-element-btn ${photoAspect === "classic" ? "active" : ""}`}
                    onClick={() => { triggerHaptic(10); setPhotoAspect("classic"); }}
                  >
                    4:3 (Klasik)
                  </button>
                  <button
                    className={`toggle-element-btn ${photoAspect === "square" ? "active" : ""}`}
                    onClick={() => { triggerHaptic(10); setPhotoAspect("square"); }}
                  >
                    1:1 (Kotak)
                  </button>
                  <button
                    className={`toggle-element-btn ${photoAspect === "portrait" ? "active" : ""}`}
                    onClick={() => { triggerHaptic(10); setPhotoAspect("portrait"); }}
                  >
                    3:4 (Potret)
                  </button>
                </div>
              </div>

              {/* Sliders: Gap & Radius */}
              <div className="layout-slider-row">
                <span className="layout-slider-label">Jarak Foto:</span>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={frameGap}
                  onChange={(e) => setFrameGap(Number(e.target.value))}
                  className="custom-range-slider"
                />
                <span style={{ fontSize: "0.75rem", color: "#ffd700", width: "35px" }}>{frameGap}px</span>
              </div>

              <div className="layout-slider-row">
                <span className="layout-slider-label">Sudut Lengkung:</span>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={frameRadius}
                  onChange={(e) => setFrameRadius(Number(e.target.value))}
                  className="custom-range-slider"
                />
                <span style={{ fontSize: "0.75rem", color: "#ffd700", width: "35px" }}>{frameRadius}px</span>
              </div>

              {/* Color Swatches */}
              <div style={{ marginTop: "10px" }}>
                <span style={{ fontSize: "0.75rem", color: "#888", display: "block", marginBottom: "6px" }}>Warna Dasar Bingkai (Kustom):</span>
                <div className="color-swatches-row">
                  {[
                    { color: "#0d0d10", label: "Obsidian" },
                    { color: "#ffffff", label: "White" },
                    { color: "#fbf7ee", label: "Cream" },
                    { color: "#0d1b2a", label: "Navy" },
                    { color: "#061a10", label: "Emerald" },
                    { color: "#1a080d", label: "Velvet" },
                  ].map((sw) => (
                    <div
                      key={sw.color}
                      className={`color-swatch-circle ${theme === "custom" && customBgColor === sw.color ? "active" : ""}`}
                      style={{ background: sw.color }}
                      onClick={() => {
                        triggerHaptic(10);
                        setTheme("custom");
                        setCustomBgColor(sw.color);
                      }}
                      title={sw.label}
                    />
                  ))}
                  {/* Custom Color Input */}
                  <label className="color-picker-input-btn" title="Pilih Warna Kustom Bebas">
                    <i className="fa-solid fa-palette"></i>
                    <input
                      type="color"
                      value={customBgColor}
                      onChange={(e) => {
                        setTheme("custom");
                        setCustomBgColor(e.target.value);
                      }}
                      style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
                    />
                  </label>
                </div>
              </div>

              {/* 17 Frame Themes Picker */}
              <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: "0.75rem", color: "#ffd700", display: "block", marginBottom: "8px", fontWeight: 700 }}>
                  <i className="fa-solid fa-fire"></i> Edisi Viral Pinterest (Khas Santri & Expedient):
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                  {[
                    { id: "ticket", label: "🎟️ Boarding Pass Ticket" },
                    { id: "receipt", label: "🧾 Struk Kopontren Mart" },
                    { id: "scrapbook", label: "📌 Scrapbook Santri" },
                    { id: "doodle", label: "⚡ Y2K Doodle Pop" },
                    { id: "mihrab", label: "🕌 Mihrab Kubah Emas" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`toggle-element-btn ${theme === t.id ? "active" : ""}`}
                      onClick={() => {
                        triggerHaptic(10);
                        setTheme(t.id as FrameTheme);
                      }}
                      style={{
                        fontSize: "0.76rem",
                        padding: "6px 11px",
                        fontWeight: 700,
                        borderColor: theme === t.id ? "#ffd700" : "rgba(255,215,0,0.3)",
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <span style={{ fontSize: "0.75rem", color: "#a0a0a8", display: "block", marginBottom: "6px", fontWeight: 600 }}>
                  <i className="fa-solid fa-crown"></i> Edisi Studio & Luxury:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {[
                    { id: "sovereign", label: "👑 Sovereign Gold" },
                    { id: "white", label: "🤍 Minimalist White" },
                    { id: "film", label: "🎞️ 35mm Analog" },
                    { id: "santri", label: "🕌 Nostalgia Santri" },
                    { id: "sakura", label: "🌸 Sakura Pastel" },
                    { id: "cyber", label: "🌌 Cyberpunk Neon" },
                    { id: "parchment", label: "📜 Vintage Parchment" },
                    { id: "ocean", label: "🌊 Deep Ocean" },
                    { id: "velvet", label: "💜 Royal Velvet" },
                    { id: "y2k", label: "⚡ Y2K Chrome" },
                    { id: "botanical", label: "🍃 Sage Botanical" },
                    { id: "monolith", label: "🖤 Dark Monolith" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`toggle-element-btn ${theme === t.id ? "active" : ""}`}
                      onClick={() => {
                        triggerHaptic(10);
                        setTheme(t.id as FrameTheme);
                      }}
                      style={{ fontSize: "0.74rem", padding: "5px 10px" }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frame Elements Toggles */}
              <div style={{ marginTop: "12px" }}>
                <span style={{ fontSize: "0.75rem", color: "#888", display: "block", marginBottom: "6px" }}>Tampilkan / Sembunyikan Bagian:</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  <button
                    className={`toggle-element-btn ${showHeader ? "active" : ""}`}
                    onClick={() => { triggerHaptic(10); setShowHeader(!showHeader); }}
                  >
                    <i className={showHeader ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"}></i> Header
                  </button>
                  <button
                    className={`toggle-element-btn ${showDivider ? "active" : ""}`}
                    onClick={() => { triggerHaptic(10); setShowDivider(!showDivider); }}
                  >
                    <i className={showDivider ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"}></i> Garis
                  </button>
                  <button
                    className={`toggle-element-btn ${showFooter ? "active" : ""}`}
                    onClick={() => { triggerHaptic(10); setShowFooter(!showFooter); }}
                  >
                    <i className={showFooter ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"}></i> Teks Bawah
                  </button>
                  <button
                    className={`toggle-element-btn ${showCrest ? "active" : ""}`}
                    onClick={() => { triggerHaptic(10); setShowCrest(!showCrest); }}
                  >
                    <i className={showCrest ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"}></i> Cap Angkatan
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Filter Selector */}
            <div>
              <div className="tool-group-label">
                <i className="fa-solid fa-wand-magic-sparkles"></i> 3. Filter Tone Warna (Bisa Diubah Kapan Saja)
              </div>
              <div className="chips-scroll-row">
                <button
                  className={`chip-btn ${filter === "normal" ? "active" : ""}`}
                  onClick={() => { triggerHaptic(10); setFilter("normal"); }}
                >
                  Asli
                </button>
                <button
                  className={`chip-btn ${filter === "golden" ? "active" : ""}`}
                  onClick={() => { triggerHaptic(10); setFilter("golden"); }}
                >
                  ✨ Golden Hour
                </button>
                <button
                  className={`chip-btn ${filter === "noir" ? "active" : ""}`}
                  onClick={() => { triggerHaptic(10); setFilter("noir"); }}
                >
                  🎬 Noir B&W
                </button>
                <button
                  className={`chip-btn ${filter === "vintage" ? "active" : ""}`}
                  onClick={() => { triggerHaptic(10); setFilter("vintage"); }}
                >
                  🎞️ 90s Film
                </button>
                <button
                  className={`chip-btn ${filter === "emerald" ? "active" : ""}`}
                  onClick={() => { triggerHaptic(10); setFilter("emerald"); }}
                >
                  🌿 Emerald
                </button>
                <button
                  className={`chip-btn ${filter === "cyber" ? "active" : ""}`}
                  onClick={() => { triggerHaptic(10); setFilter("cyber"); }}
                >
                  🔮 Cyber Glow
                </button>
                <button
                  className={`chip-btn ${filter === "pastel" ? "active" : ""}`}
                  onClick={() => { triggerHaptic(10); setFilter("pastel"); }}
                >
                  🌸 Soft Pastel
                </button>
              </div>

              {/* Sliders for Brightness and Contrast */}
              <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "#888" }}>Kecerahan ({brightness}%):</span>
                  <input
                    type="range"
                    min="75"
                    max="140"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="custom-range-slider"
                  />
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "#888" }}>Kontras ({contrast}%):</span>
                  <input
                    type="range"
                    min="75"
                    max="140"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="custom-range-slider"
                  />
                </div>
              </div>
            </div>

            {/* 4. Digital Stickers & Deletion */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="tool-group-label" style={{ marginBottom: 0 }}>
                  <i className="fa-solid fa-icons"></i> 4. Tempel Simbol & Stiker
                </div>
                {stickers.length > 0 && (
                  <button
                    onClick={handleClearAllStickers}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#ff4d4d",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <i className="fa-solid fa-trash-can"></i> Hapus Semua Stiker
                  </button>
                )}
              </div>

              <div className="stickers-picker-grid">
                {["👑", "🎓", "✨", "🌙", "📸", "🤍", "🕶️", "🕌", "🤝", "⚡", "⭐", "🌺"].map((emoji) => (
                  <button
                    key={emoji}
                    className="sticker-item-btn"
                    onClick={() => handleAddSticker(emoji)}
                    title={`Tempel ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: "0.72rem", color: "#888", marginTop: "4px" }}>
                💡 <em>Sentuh stiker di pratinjau untuk memunculkan tanda silang (×) dan menghapusnya.</em>
              </p>
            </div>

            {/* 5. Custom Text */}
            <div>
              <div className="tool-group-label">
                <i className="fa-solid fa-pen-nib"></i> 5. Judul & Tanggal Kenangan
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input
                  type="text"
                  value={captionTitle}
                  onChange={(e) => setCaptionTitle(e.target.value)}
                  placeholder="Judul Momen"
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#fff",
                    fontSize: "0.85rem",
                  }}
                />
                <input
                  type="text"
                  value={captionDate}
                  onChange={(e) => setCaptionDate(e.target.value)}
                  placeholder="Tanggal"
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#fff",
                    fontSize: "0.85rem",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            RIGHT COLUMN: RENDERABLE PHOTOSTRIP PREVIEW
            ========================================================= */}
        <div className="photostrip-preview-pane">
          <div className="preview-top-actions">
            <div className="preview-heading">
              <i className="fa-solid fa-eye"></i> Pratinjau Photostrip
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              {isLiveMode && (
                <button
                  onClick={() => { triggerHaptic(15); setIsLivePlaying(!isLivePlaying); }}
                  style={{
                    background: "rgba(212,175,55,0.15)",
                    border: "1px solid #d4af37",
                    color: "#ffd700",
                    padding: "3px 8px",
                    borderRadius: "8px",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                  }}
                >
                  <i className={isLivePlaying ? "fa-solid fa-pause" : "fa-solid fa-play"}></i> {isLivePlaying ? "Jeda" : "Putar"}
                </button>
              )}
              <button
                onClick={handleResetAll}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ff4d4d",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <i className="fa-solid fa-rotate-left"></i> Reset
              </button>
            </div>
          </div>

          {/* THE PHOTOSTRIP TO BE RENDERED INTO HIGH-RES IMAGE */}
          <div
            ref={stripRef}
            className={`photostrip-card theme-${theme}`}
            id="photostrip-render-target"
            style={getStripBackgroundStyle()}
          >
            {/* Header Brand */}
            {showHeader && (
              <div className="strip-header">
                {theme === "ticket" ? (
                  <div className="ticket-barcode-wrap">
                    <div style={{ fontSize: "0.72rem", fontWeight: 900, color: "#8b0000", letterSpacing: "1.5px" }}>
                      EXPEDIENT BOARDING PASS
                    </div>
                    <div style={{ fontSize: "0.56rem", color: "#555", fontWeight: 700, margin: "2px 0 4px" }}>
                      FROM: ARRISALAH ➔ TO: SUCCESS & JANNAH
                    </div>
                    <div style={{ fontSize: "1.4rem", letterSpacing: "3px", color: "#111", lineHeight: 0.8, fontFamily: "monospace", userSelect: "none" }}>
                      ||| | |||| || ||| |
                    </div>
                  </div>
                ) : theme === "receipt" ? (
                  <div className="receipt-header-box">
                    <div style={{ fontSize: "0.82rem", fontWeight: 900, color: "#111", letterSpacing: "1px" }}>
                      ★ KOPONTREN MART 42 ★
                    </div>
                    <div style={{ fontSize: "0.62rem", opacity: 0.8 }}>Pesantren Arrisalah Slahung</div>
                    <div style={{ fontSize: "0.58rem", opacity: 0.7, marginTop: "2px" }}>
                      Tgl: {captionDate} • Kasir: Santri-42
                    </div>
                  </div>
                ) : theme === "scrapbook" ? (
                  <div style={{ position: "relative", textAlign: "center", padding: "4px 0 6px" }}>
                    <span className="scrapbook-pin-corner">🧷</span>
                    <span className="scrapbook-washi-tape"></span>
                    <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#ffe4e8", letterSpacing: "1px" }}>
                      ✨ AKHI FILLAH • '42
                    </div>
                  </div>
                ) : theme === "doodle" ? (
                  <div style={{ textAlign: "center", paddingBottom: "4px" }}>
                    <div className="doodle-speech-tag">★ WE LIT ★</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, letterSpacing: "1px", textShadow: "2px 2px 0px #0a1f5c" }}>
                      EXPEDIENT 42
                    </div>
                  </div>
                ) : theme === "mihrab" ? (
                  <div style={{ textAlign: "center", paddingBottom: "4px" }}>
                    <div style={{ fontSize: "1.2rem", color: "#ffd700", marginBottom: "1px" }}>🕌</div>
                    <div style={{ fontFamily: "serif", fontSize: "0.92rem", color: "#ffd700", fontWeight: 700 }}>
                      بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ
                    </div>
                  </div>
                ) : (
                  <div className="strip-badge-text">
                    {theme === "santri" ? "أُخُوَّةٌ فِي سَبِيلِ اللهِ" : "EXPEDIENT GENERATION"}
                  </div>
                )}
                {showDivider && theme !== "receipt" && <div className="strip-divider" />}
              </div>
            )}

            {/* Slots Grid with Custom Gap */}
            <div
              className={`strip-grid-slots ${layout === "grid-2x2" ? "layout-grid" : layout === "polaroid" ? "layout-polaroid" : ""}`}
              style={{ gap: `${frameGap}px` }}
            >
              {Array.from({ length: totalSlots }).map((_, idx) => {
                const photoObj = photos[idx];
                return (
                  <div
                    key={idx}
                    className={`photo-cell aspect-${photoAspect} ${activeSlot === idx ? "active-slot-border" : ""}`}
                    style={{
                      borderRadius: `${frameRadius}px`,
                      filter: getFilterStyle(),
                    }}
                  >
                    {photoObj ? (
                      <>
                        {/* If Live Video is available and active */}
                        {isLiveMode && photoObj.video && isLivePlaying ? (
                          <video
                            src={photoObj.video}
                            autoPlay
                            loop
                            muted
                            playsInline
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        ) : (
                          <img src={photoObj.image} alt={`Pose ${idx + 1}`} />
                        )}

                        {/* Live Photo Badge */}
                        {photoObj.video && (
                          <div className="live-badge-indicator">
                            <span className="live-pulse-dot"></span>
                            <span>LIVE</span>
                          </div>
                        )}

                        {/* Retake Button */}
                        <button
                          className="cell-retake-btn"
                          onClick={() => handleRetakeSlot(idx)}
                          title="Foto Ulang Slot Ini"
                        >
                          <i className="fa-solid fa-arrow-rotate-right"></i>
                        </button>
                      </>
                    ) : (
                      <div className="photo-cell-placeholder">
                        <i className="fa-solid fa-camera"></i>
                        <span>Slot {idx + 1}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Placed Interactive Draggable Stickers with Full Mobile & Desktop Support */}
            {stickers.map((stk) => {
              const isSelected = selectedStickerId === stk.id;
              const isDragging = draggingStickerId === stk.id;
              const currentScale = stk.scale || 1;

              return (
                <div
                  key={stk.id}
                  className={`strip-sticker ${isDragging ? "is-dragging" : ""} ${isSelected ? "is-selected" : ""}`}
                  style={{
                    top: `${stk.top}%`,
                    left: `${stk.left}%`,
                    fontSize: `${1.8 * currentScale}rem`,
                  }}
                  onPointerDown={(e) => handleStickerPointerDown(e, stk.id)}
                  onPointerMove={(e) => handleStickerPointerMove(e, stk.id)}
                  onPointerUp={handleStickerPointerUp}
                  onPointerCancel={handleStickerPointerUp}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStickerId(stk.id);
                  }}
                >
                  <span className="sticker-emoji-body">{stk.emoji}</span>

                  {/* Floating Action Controls (Resize & Delete) — ignored by html2canvas export */}
                  <div
                    className="sticker-mini-toolbar"
                    data-html2canvas-ignore="true"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="sticker-tool-mini-btn"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleResizeSticker(stk.id, -0.2, e);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleResizeSticker(stk.id, -0.2, e);
                      }}
                      title="Perkecil"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      className="sticker-tool-mini-btn"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleResizeSticker(stk.id, 0.2, e);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleResizeSticker(stk.id, 0.2, e);
                      }}
                      title="Perbesar"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="sticker-tool-mini-btn btn-del"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeleteSticker(stk.id, e);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeleteSticker(stk.id, e);
                      }}
                      title="Hapus Stiker"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Footer Brand & Custom Text */}
            {showFooter && (
              <div className="strip-footer">
                {theme === "receipt" ? (
                  <div className="receipt-footer-box">
                    <div className="receipt-itemized-table">
                      <div className="receipt-row"><span>1x Momen Nostalgia</span><span>Rp 0</span></div>
                      <div className="receipt-row"><span>1x Ukhuwah Selamanya</span><span>GRATIS</span></div>
                      <div className="receipt-row"><span>1x Tawa & Kenangan</span><span>PRICELESS</span></div>
                      <div style={{ borderTop: "1px dashed #777", margin: "4px 0" }} />
                      <div className="receipt-row" style={{ fontWeight: 800 }}><span>TOTAL: 42 ITEM</span><span>KEKAL</span></div>
                      <div className="receipt-row" style={{ fontSize: "0.56rem", opacity: 0.8 }}><span>BAYAR: DOA BERSAMA</span><span>LUNAS</span></div>
                    </div>
                    <div style={{ textAlign: "center", fontSize: "0.62rem", marginTop: "6px", fontWeight: 700 }}>
                      *** JAZAKUMULLAHU KHAIRAN ***
                    </div>
                    <div className="receipt-barcode">|||| | |||| || ||| |||| | ||||</div>
                  </div>
                ) : theme === "ticket" ? (
                  <div style={{ width: "100%", textAlign: "center" }}>
                    {showDivider && <div className="strip-divider" />}
                    <div className="strip-caption-title" style={{ fontWeight: 800 }}>{captionTitle}</div>
                    <div className="strip-caption-date">{captionDate} • GATE 42</div>
                    <div className="ticket-barcode-wrap" style={{ marginTop: "4px" }}>
                      <div className="ticket-barcode-lines" style={{ fontSize: "1.5rem" }}>|||| | |||| || ||| ||||</div>
                      <div style={{ fontSize: "0.55rem", letterSpacing: "2px", opacity: 0.8 }}>EXP-42ND-ARRISALAH</div>
                    </div>
                  </div>
                ) : theme === "scrapbook" ? (
                  <div style={{ width: "100%", textAlign: "center", position: "relative" }}>
                    {showDivider && <div className="strip-divider" />}
                    <div className="strip-caption-title" style={{ fontFamily: "cursive, sans-serif" }}>{captionTitle}</div>
                    <div className="strip-caption-date">✦ {captionDate} ✦</div>
                    <div className="scrapbook-plaid-corner" />
                    <div style={{ fontSize: "0.62rem", letterSpacing: "1px", opacity: 0.9, marginTop: "4px" }}>
                      BEST MEMORIES EVER
                    </div>
                  </div>
                ) : theme === "doodle" ? (
                  <div style={{ width: "100%", textAlign: "center" }}>
                    {showDivider && <div className="strip-divider" />}
                    <div className="strip-caption-title" style={{ fontWeight: 900 }}>{captionTitle}</div>
                    <div className="strip-caption-date">{captionDate}</div>
                    <div style={{ display: "inline-block", background: "#fff", color: "#103396", padding: "2px 8px", borderRadius: "4px", fontSize: "0.62rem", fontWeight: 900, marginTop: "4px", boxShadow: "2px 2px 0px #000" }}>
                      ✦ SQUAD ARRISALAH ✦
                    </div>
                  </div>
                ) : theme === "mihrab" ? (
                  <div style={{ width: "100%", textAlign: "center" }}>
                    {showDivider && <div className="strip-divider" />}
                    <div style={{ fontFamily: "serif", fontSize: "0.85rem", color: "#ffd700", marginBottom: "2px" }}>
                      أُخُوَّةٌ فِي سَبِيلِ اللهِ حَتَّى الْجَنَّةِ
                    </div>
                    <div className="strip-caption-title">{captionTitle}</div>
                    <div className="strip-caption-date">{captionDate}</div>
                    {showCrest && <div className="strip-brand-crest">42ND ARRISALAH COHORT</div>}
                  </div>
                ) : (
                  <>
                    {showDivider && <div className="strip-divider" />}
                    <div className="strip-caption-title">{captionTitle}</div>
                    <div className="strip-caption-date">{captionDate}</div>
                    {showCrest && <div className="strip-brand-crest">42ND ARRISALAH COHORT</div>}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Export & Sharing Buttons */}
          <div className="strip-export-actions">
            {isLiveMode && (
              <button
                className="btn-export-primary"
                onClick={handleExportLiveVideo}
                disabled={isExporting}
                style={{ background: "linear-gradient(135deg, #00c9ff, #92fe9d)", color: "#05131a" }}
              >
                <i className="fa-solid fa-video"></i>
                <span>{isExporting ? "Mengekspor Live..." : "Unduh Foto Live Bergerak (Video)"}</span>
              </button>
            )}

            <button
              className="btn-export-primary"
              onClick={() => handleDownloadStrip("strip")}
              disabled={isExporting}
            >
              <i className="fa-solid fa-download"></i>
              <span>{isExporting ? "Memproses..." : "Unduh Photostrip HD (PNG)"}</span>
            </button>

            <button
              className="btn-export-secondary"
              onClick={() => handleDownloadStrip("story")}
              disabled={isExporting}
            >
              <i className="fa-brands fa-instagram"></i>
              <span>Unduh Format IG Story / WA (9:16)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

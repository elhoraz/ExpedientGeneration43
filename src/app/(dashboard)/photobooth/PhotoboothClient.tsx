"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import html2canvas from "html2canvas";
import "./photobooth.css";

type LayoutMode = "korean-4cut" | "grid-2x2" | "retro-3cut" | "polaroid";
type FilterMode = "normal" | "golden" | "noir" | "vintage" | "emerald";
type FrameTheme = "sovereign" | "white" | "film" | "santri";

interface PlacedSticker {
  id: string;
  emoji: string;
  top: number;
  left: number;
}

export default function PhotoboothClient() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Studio States
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Configuration
  const [layout, setLayout] = useState<LayoutMode>("korean-4cut");
  const [filter, setFilter] = useState<FilterMode>("normal");
  const [theme, setTheme] = useState<FrameTheme>("sovereign");
  const [captionTitle, setCaptionTitle] = useState("Expedient Generation");
  const [captionDate, setCaptionDate] = useState(() => {
    const d = new Date();
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  });

  // Photo captures
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null]);
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

  // Initialize Camera Stream
  const startCamera = useCallback(async (facing: "user" | "environment") => {
    setCameraError(null);
    setIsCameraReady(false);

    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }

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
  }, [stream]);

  useEffect(() => {
    startCamera(cameraFacing);
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Flip Camera (Mobile)
  const handleToggleFacing = () => {
    triggerHaptic(20);
    const nextFacing = cameraFacing === "user" ? "environment" : "user";
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // Capture Video Frame to Base64 Image
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

    // Apply active filter to the canvas context directly for crisp bake-in
    if (filter === "golden") {
      ctx.filter = "sepia(0.25) saturate(1.2) contrast(1.05) brightness(1.04)";
    } else if (filter === "noir") {
      ctx.filter = "grayscale(1) contrast(1.3) brightness(0.95)";
    } else if (filter === "vintage") {
      ctx.filter = "sepia(0.4) saturate(0.85) contrast(1.1) hue-rotate(-10deg)";
    } else if (filter === "emerald") {
      ctx.filter = "hue-rotate(45deg) saturate(1.15) brightness(1.02)";
    } else {
      ctx.filter = "none";
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.95);
  };

  // Trigger Countdown & Shutter
  const triggerShutter = () => {
    if (isCountingDown) return;
    triggerHaptic(40);
    setIsCountingDown(true);
    let count = 3;
    setCountdownNum(count);
    playBeep(440, 0.1);

    const timer = setInterval(() => {
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

        // Save Photo
        const photoData = captureFrame();
        if (photoData) {
          setPhotos((prev) => {
            const next = [...prev];
            next[activeSlot] = photoData;
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
          next[activeSlot] = dataUrl;
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
      id: "stk_" + Date.now(),
      emoji,
      top: 30 + Math.random() * 40,
      left: 10 + Math.random() * 70,
    };
    setStickers((prev) => [...prev, newSticker]);
  };

  // Export Photostrip to PNG
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
          Abadikan pose terbaikmu dalam photostrip eksklusif. Pilih tata letak, terapkan filter vintage, dan simpan dalam resolusi HD siap cetak atau Instagram Story.
        </p>
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
                className={`viewfinder-video ${cameraFacing === "environment" ? "unmirrored" : ""} filter-${filter}`}
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
                  <span>LIVE STUDIO</span>
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
                    <i className="fa-solid fa-arrows-split-up-and-left"></i> Selfie Mode
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
              <i className="fa-solid fa-camera"></i>
              <span>{isCountingDown ? "Bersiap..." : `Ambil Foto (${activeSlot + 1}/${totalSlots})`}</span>
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
                <i className="fa-solid fa-table-cells-large"></i> 1. Tata Letak (Layout)
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

            {/* 2. Filter Selector */}
            <div>
              <div className="tool-group-label">
                <i className="fa-solid fa-sliders"></i> 2. Filter Tone Warna
              </div>
              <div className="chips-scroll-row">
                <button
                  className={`chip-btn ${filter === "normal" ? "active" : ""}`}
                  onClick={() => { triggerHaptic(10); setFilter("normal"); }}
                >
                  Normal
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
                  🌿 Emerald Glow
                </button>
              </div>
            </div>

            {/* 3. Theme Frame */}
            <div>
              <div className="tool-group-label">
                <i className="fa-solid fa-crop-simple"></i> 3. Tema Bingkai (Frame)
              </div>
              <div className="chips-scroll-row">
                <button
                  className={`chip-btn ${theme === "sovereign" ? "active" : ""}`}
                  onClick={() => { triggerHaptic(10); setTheme("sovereign"); }}
                >
                  👑 Sovereign Gold
                </button>
                <button
                  className={`chip-btn ${theme === "white" ? "active" : ""}`}
                  onClick={() => { triggerHaptic(10); setTheme("white"); }}
                >
                  🤍 Minimalist White
                </button>
                <button
                  className={`chip-btn ${theme === "film" ? "active" : ""}`}
                  onClick={() => { triggerHaptic(10); setTheme("film"); }}
                >
                  🎞️ 35mm Analog Film
                </button>
                <button
                  className={`chip-btn ${theme === "santri" ? "active" : ""}`}
                  onClick={() => { triggerHaptic(10); setTheme("santri"); }}
                >
                  🕌 Nostalgia Santri
                </button>
              </div>
            </div>

            {/* 4. Digital Stickers */}
            <div>
              <div className="tool-group-label">
                <i className="fa-solid fa-icons"></i> 4. Tempel Stiker Digital
              </div>
              <div className="stickers-picker-grid">
                {["👑", "🎓", "✨", "🌙", "📸", "🤍", "🕶️", "🕌", "🤝", "⚡"].map((emoji) => (
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
            </div>

            {/* 5. Custom Text */}
            <div>
              <div className="tool-group-label">
                <i className="fa-solid fa-pen-nib"></i> 5. Judul & Tanggal Momen
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

          {/* THE PHOTOSTRIP TO BE RENDERED INTO HIGH-RES IMAGE */}
          <div
            ref={stripRef}
            className={`photostrip-card theme-${theme}`}
            id="photostrip-render-target"
          >
            {/* Header Brand */}
            <div className="strip-header">
              <div className="strip-badge-text">
                {theme === "santri" ? "أُخُوَّةٌ فِي سَبِيلِ اللهِ" : "EXPEDIENT GENERATION"}
              </div>
              <div className="strip-divider" />
            </div>

            {/* Slots Grid */}
            <div
              className={`strip-grid-slots ${layout === "grid-2x2" ? "layout-grid" : layout === "polaroid" ? "layout-polaroid" : ""}`}
            >
              {Array.from({ length: totalSlots }).map((_, idx) => (
                <div
                  key={idx}
                  className={`photo-cell ${activeSlot === idx ? "active-slot-border" : ""}`}
                >
                  {photos[idx] ? (
                    <>
                      <img src={photos[idx]!} alt={`Pose ${idx + 1}`} />
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
              ))}
            </div>

            {/* Placed Stickers */}
            {stickers.map((stk) => (
              <div
                key={stk.id}
                className="strip-sticker"
                style={{ top: `${stk.top}%`, left: `${stk.left}%`, fontSize: "1.8rem" }}
              >
                {stk.emoji}
              </div>
            ))}

            {/* Footer Brand & Custom Text */}
            <div className="strip-footer">
              <div className="strip-divider" />
              <div className="strip-caption-title">{captionTitle}</div>
              <div className="strip-caption-date">{captionDate}</div>
              <div className="strip-brand-crest">42ND ARRISALAH COHORT</div>
            </div>
          </div>

          {/* Export & Sharing Buttons */}
          <div className="strip-export-actions">
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

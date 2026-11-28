"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getAvatarUrl } from "@/lib/avatar";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import { executeThemeTransition } from "@/lib/theme/executeThemeTransition";
import {
  type CardIdentityData,
  type CardThemeMode,
  drawIdBackFace,
  drawIdFrontFace,
  drawKtaBackFace,
  drawKtaFrontFace,
  loadArtworkImage,
} from "./cardArtwork";

const SovereignThreeScene = dynamic(() => import("./SovereignThreeScene"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#d4af37",
        fontFamily: "monospace",
        fontSize: "12px",
        letterSpacing: "2px",
      }}
    >
      INITIALIZING 3D ENVIRONMENT...
    </div>
  ),
});

interface SovereignUser {
  id: string;
  nama_lengkap: string;
  nama_panggilan: string | null;
  foto_profil: string | null;
  public_token?: string | null;
  prestise_points?: number;
}

export default function SovereignClient({ user }: { user: SovereignUser }) {
  const { t, locale } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);

  // Engine Mode: '3d' (Optimized Three.js Studio) vs 'lite' (60 FPS CSS 3D Backup)
  const [viewMode, setViewMode] = useState<"lite" | "3d">("3d");
  const [cardFormat, setCardFormat] = useState<"id" | "kta">("id");
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 });
  const [isLoading, setIsLoading] = useState(true);

  const isDraggingCard = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Resolve foto URL secara aman
  const fotoUrl = user.foto_profil
    ? getAvatarUrl(user.foto_profil, user.nama_panggilan || user.nama_lengkap)
    : "";

  // QR Code menggunakan public_token atau fallback ke id
  const qrToken = user.public_token || user.id;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=000000&bgcolor=d4af37&margin=10&data=${encodeURIComponent(baseUrl + "/scan/" + qrToken)}`;

  // Nomor ID: 4 karakter pertama UUID uppercase
  const nomorId = "EXP-" + user.id.replace(/-/g, "").substring(0, 4).toUpperCase();

  // Inisialisasi mode: langsung masuk ke 3D Studio di Desktop & Mobile (kecuali user memilih Lite sebelumnya)
  useEffect(() => {
    const savedMode = localStorage.getItem("sovereign_chosen_mode") as "lite" | "3d" | null;
    if (savedMode === "lite") {
      setViewMode("lite");
    } else {
      setViewMode("3d");
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 350);

    document.body.classList.add("page-sovereign");
    return () => {
      clearTimeout(timer);
      document.body.classList.remove("page-sovereign");
    };
  }, []);

  // Update root attribute & handle transition saat ganti tema
  const handleToggleTheme = (e: React.MouseEvent) => {
    const nextMode = !isLightMode;
    setIsLightMode(nextMode);
    executeThemeTransition(nextMode ? "light" : "dark", e);
  };

  // Handler memilih mode dari switcher atas
  const handleSelectMode = (mode: "lite" | "3d") => {
    setViewMode(mode);
    localStorage.setItem("sovereign_chosen_mode", mode);
  };

  // Salin Nomor ID
  const handleCopyId = () => {
    navigator.clipboard.writeText(nomorId);
    setCopiedId(true);
    if (navigator.vibrate) navigator.vibrate(40);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // ---------------------------------------------------------------------------
  // INTERAKSI TILT & DRAG PADA MODE SUPER RINGAN (CSS 3D HOLOGRAPHIC)
  // ---------------------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingCard.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const pctX = Math.max(0, Math.min(100, (cx / rect.width) * 100));
    const pctY = Math.max(0, Math.min(100, (cy / rect.height) * 100));

    if (isDraggingCard.current) {
      const deltaX = (e.clientX - dragStart.current.x) * 0.4;
      const deltaY = -(e.clientY - dragStart.current.y) * 0.4;
      setTilt({
        x: Math.max(-28, Math.min(28, deltaX)),
        y: Math.max(-28, Math.min(28, deltaY)),
        glareX: pctX,
        glareY: pctY,
      });
    } else {
      const rotY = (pctX - 50) * 0.35;
      const rotX = -(pctY - 50) * 0.35;
      setTilt({ x: rotY, y: rotX, glareX: pctX, glareY: pctY });
    }
  };

  const handlePointerUp = () => {
    isDraggingCard.current = false;
    setTilt((prev) => ({ ...prev, x: 0, y: 0 }));
  };

  // Gyroscope tilt untuk Mode Super Ringan di mobile
  useEffect(() => {
    if (viewMode !== "lite") return;
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      const rotY = Math.max(-25, Math.min(25, e.gamma * 0.7));
      const rotX = Math.max(-25, Math.min(25, (e.beta - 45) * 0.6));
      setTilt({
        x: rotY,
        y: rotX,
        glareX: 50 + rotY * 1.5,
        glareY: 50 + rotX * 1.5,
      });
    };
    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => window.removeEventListener("deviceorientation", handleOrientation, true);
  }, [viewMode]);

  // ---------------------------------------------------------------------------
  // GENERATOR EKSPOR HIGH-RESOLUTION PNG (2400 x 1800) - UNIFIED FLAGSHIP ARTWORK
  // ---------------------------------------------------------------------------
  const handleExportPng = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const compCanvas = document.createElement("canvas");
      const ctx = compCanvas.getContext("2d")!;
      compCanvas.width = 2400;
      compCanvas.height = 1800;

      const themeMode: CardThemeMode = isLightMode ? "light" : "dark";
      const bgGrad = ctx.createLinearGradient(0, 0, compCanvas.width, compCanvas.height);
      if (isLightMode) {
        bgGrad.addColorStop(0, "#faf8f3");
        bgGrad.addColorStop(1, "#eae3d4");
      } else {
        bgGrad.addColorStop(0, "#0e192d");
        bgGrad.addColorStop(0.5, "#060b14");
        bgGrad.addColorStop(1, "#04070e");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, compCanvas.width, compCanvas.height);

      ctx.fillStyle = isLightMode ? "rgba(155,112,22,0.08)" : "rgba(212,175,55,0.06)";
      ctx.font = '900 116px "Playfair Display", serif';
      ctx.textAlign = "center";
      ctx.fillText("EXPEDIENT 43 ALUMNI REGISTRY", 1200, 220);

      ctx.fillStyle = isLightMode ? "#9b7016" : "#d4af37";
      ctx.font = '600 22px "Inter", sans-serif';
      ctx.letterSpacing = "6px";
      ctx.fillText("KARTU TANDA ALUMNI RESMI • PONDOK MODERN ARRISALAH", 1200, 290);
      ctx.letterSpacing = "0px";

      const [crestImg, avatarImg, qrImg] = await Promise.all([
        loadArtworkImage("/images/logo-utuh.webp"),
        loadArtworkImage(fotoUrl),
        loadArtworkImage(qrUrl),
      ]);

      const identity: CardIdentityData = {
        nama: user.nama_lengkap,
        panggilan: user.nama_panggilan || user.nama_lengkap,
        nomorId,
        angkatanLabel: "ALUMNI ANGKATAN KE-43",
        berlakuLabel: "BERLAKU SELAMANYA",
        maskedCardNumber: `4300 •••• •••• ${nomorId.replace("EXP-", "")}`,
      };
      const assets = { crestImg, avatarImg, qrImg };

      const renderSubCanvas = (
        w: number,
        h: number,
        painter: (cCtx: CanvasRenderingContext2D) => void
      ) => {
        const sub = document.createElement("canvas");
        sub.width = w;
        sub.height = h;
        painter(sub.getContext("2d")!);
        return sub;
      };

      const idFrontCanvas = renderSubCanvas(1024, 1624, (cCtx) =>
        drawIdFrontFace({ cCtx }, identity, themeMode, assets)
      );
      const idBackCanvas = renderSubCanvas(1024, 1624, (cCtx) =>
        drawIdBackFace({ cCtx }, identity, themeMode, assets)
      );
      const ktaFrontCanvas = renderSubCanvas(1024, 640, (cCtx) =>
        drawKtaFrontFace({ cCtx }, identity, themeMode, assets)
      );
      const ktaBackCanvas = renderSubCanvas(1024, 640, (cCtx) =>
        drawKtaBackFace({ cCtx }, identity, themeMode, assets)
      );

      const drawFramedCard = (
        src: HTMLCanvasElement,
        x: number,
        y: number,
        w: number,
        h: number,
        r: number
      ) => {
        ctx.save();
        ctx.shadowColor = isLightMode ? "rgba(24,24,27,0.22)" : "rgba(0,0,0,0.72)";
        ctx.shadowBlur = 38;
        ctx.shadowOffsetX = 12;
        ctx.shadowOffsetY = 20;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fillStyle = isLightMode ? "#f5f2ea" : "#080e1a";
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.clip();
        ctx.drawImage(src, x, y, w, h);
        ctx.restore();

        ctx.strokeStyle = isLightMode ? "#9b7016" : "#d4af37";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.stroke();
      };

      // Subtle flat woven strap silhouette above Vertical ID Card
      ctx.save();
      ctx.fillStyle = "#171d29";
      ctx.fillRect(425, 0, 90, 412);
      ctx.fillStyle = "rgba(212,175,55,0.65)";
      ctx.fillRect(430, 0, 5, 412);
      ctx.fillRect(505, 0, 5, 412);
      ctx.fillStyle = "#d4af37";
      ctx.fillRect(438, 392, 64, 34);
      ctx.restore();

      drawFramedCard(idFrontCanvas, 180, 420, 580, 920, 34);
      drawFramedCard(idBackCanvas, 840, 420, 580, 920, 34);
      drawFramedCard(ktaFrontCanvas, 1500, 420, 720, 450, 28);
      drawFramedCard(ktaBackCanvas, 1500, 910, 720, 450, 28);

      const link = document.createElement("a");
      link.download = `sovereign-credential-${nomorId}.png`;
      link.href = compCanvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Gagal export PNG:", err);
    } finally {
      setIsExporting(false);
    }
  }, [fotoUrl, isExporting, isLightMode, nomorId, qrUrl, user]);

  // ---------------------------------------------------------------------------
  // Note: Three.js 3D Studio Runner has been extracted to SovereignThreeScene.tsx (ARCH-02 & PERF-02)

  return (
    <div
      style={{
        width: "100%",
        height: "100dvh",
        background: isLightMode
          ? "radial-gradient(circle at 30% 20%, #ffffff 0%, #f4f1ea 55%, #eae4d7 100%)"
          : "radial-gradient(circle at 50% 25%, #0e1a2e 0%, #070d18 55%, #04070e 100%)",
        overflow: "hidden",
        position: "fixed",
        inset: 0,
        fontFamily: "'Inter', sans-serif",
        userSelect: "none",
        transition: "background 0.45s ease",
      }}
    >
      {/* CSS Marble Gallery & Kintsugi Accent Veins (0 WebGL Overdraw) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1200 800"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1,
          opacity: isLightMode ? 0.24 : 0.2,
          transition: "opacity 0.45s ease",
        }}
      >
        <path
          d="M-40 160 C 260 220, 420 90, 740 190 T 1260 120"
          fill="none"
          stroke="#d4af37"
          strokeWidth="1.4"
          strokeOpacity="0.6"
        />
        <path
          d="M-60 540 C 210 470, 520 640, 820 510 T 1260 610"
          fill="none"
          stroke="#d4af37"
          strokeWidth="1.1"
          strokeOpacity="0.45"
        />
        <path
          d="M320 -20 C 390 210, 290 460, 420 820"
          fill="none"
          stroke={isLightMode ? "#c8b998" : "#1d3152"}
          strokeWidth="1.8"
          strokeOpacity="0.55"
        />
        <path
          d="M890 -20 C 810 260, 960 520, 830 820"
          fill="none"
          stroke={isLightMode ? "#c8b998" : "#1d3152"}
          strokeWidth="1.5"
          strokeOpacity="0.45"
        />
      </svg>

      {/* ========================================================================= */}
      {/* PRELOADER INITIAL                                                         */}
      {/* ========================================================================= */}
      <div
        id="preloader"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          background: "#060b14",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          transition: "opacity 0.4s ease, visibility 0.4s ease",
          opacity: isLoading ? 1 : 0,
          visibility: isLoading ? "visible" : "hidden",
          pointerEvents: isLoading ? "auto" : "none",
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            border: "2px solid rgba(212,175,55,0.1)",
            borderTopColor: "#d4af37",
            borderRadius: "50%",
            animation: "spinLoader 1s linear infinite",
            marginBottom: 20,
            boxShadow: "0 0 20px rgba(212,175,55,0.2)",
          }}
        />
        <span
          id="loadingText"
          style={{
            color: "#d4af37",
            fontWeight: 600,
            letterSpacing: "0.08em",
            fontSize: 13,
          }}
        >
          Memuat Kartu Alumni 3D...
        </span>
      </div>

      {/* Vignette Background */}
      <div
        className="vault-vignette"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 4,
          background: isLightMode
            ? "radial-gradient(circle at center, transparent 22%, rgba(235,230,218,0.68) 100%)"
            : "radial-gradient(circle at center, transparent 22%, rgba(0,0,0,0.78) 100%)",
          transition: "background 0.45s ease",
        }}
      />

      {/* ========================================================================= */}
      {/* HEADER NAVIGASI (RESPONSIF, ANTI-TUMPANG TINDIH)                         */}
      {/* ========================================================================= */}
      <header className="sovereign-header">
        {/* Row 1: Back Button (Left) & Actions (Right) */}
        <div className="sovereign-header-row1">
          <Link href="/fitur" id="btnBackToFitur" className="sovereign-back-btn">
            <i className="fa-solid fa-chevron-left" />
            <span>{t.common.back}</span>
          </Link>

          <div className="sovereign-header-actions">
            {/* Language Switcher */}
            <LanguageSwitcher variant="pill" />

            <button
              onClick={handleToggleTheme}
              id="btnThemeToggle"
              title="Ganti Tema Siang/Malam"
              aria-label="Ganti Tema"
            >
              <i className={isLightMode ? "fa-solid fa-moon" : "fa-solid fa-sun"} />
            </button>

            <button
              onClick={handleExportPng}
              id="btnExportId"
              disabled={isExporting}
              title={isExporting ? t.sovereign.exporting_btn : t.sovereign.export_btn}
              aria-label="Simpan PNG"
            >
              <i className={isExporting ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-download"} />
            </button>
          </div>
        </div>

        {/* Row 2: Mode Switcher (Centered underneath Row 1 on mobile, 0% overlap) */}
        <div className="sovereign-mode-switcher-wrap">
          <div className="sovereign-mode-switcher">
            <button
              onClick={() => handleSelectMode("lite")}
              className={`sovereign-mode-tab ${viewMode === "lite" ? "active" : ""}`}
              title="Mode Super Ringan (0% Lag WebGL, 60 FPS CSS 3D)"
            >
              <i className="fa-solid fa-bolt" />
              <span>{t.sovereign.mode_lite}</span>
            </button>

            <button
              onClick={() => handleSelectMode("3d")}
              className={`sovereign-mode-tab ${viewMode === "3d" ? "active" : ""}`}
              title="Mode 3D Studio Three.js (Fisika Tali & Galeri)"
            >
              <i className="fa-solid fa-cube" />
              <span>{t.sovereign.mode_3d}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MODE SUPER RINGAN (SERINGAN-RINGANNYA: CSS 3D HOLOGRAPHIC CARD)           */}
      {/* ========================================================================= */}
      {viewMode === "lite" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            perspective: 1200,
            padding: "20px",
            touchAction: "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Lanyard Strap Header (CSS ID Card Only) */}
          {cardFormat === "id" && (
            <div
              style={{
                position: "absolute",
                top: 0,
                width: 32,
                height: "calc(50vh - 200px)",
                minHeight: 60,
                background: "linear-gradient(180deg, #111 0%, #1a1a1a 80%, #333 100%)",
                borderInline: "1px solid rgba(212,175,55,0.4)",
                boxShadow: "0 0 15px rgba(0,0,0,0.6)",
                zIndex: 12,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 16,
                  background: "linear-gradient(135deg, #d4af37, #c59b27, #996515)",
                  borderRadius: 4,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}
              />
            </div>
          )}

          {/* Kartu 3D Interaktif */}
          <div
            ref={cardRef}
            onClick={() => setIsFlipped(!isFlipped)}
            style={{
              position: "relative",
              width: cardFormat === "id" ? "min(300px, 80vw)" : "min(340px, 88vw)",
              aspectRatio: cardFormat === "id" ? "54 / 86" : "85.6 / 54",
              maxHeight: "calc(100dvh - 220px)",
              maxWidth: cardFormat === "id" ? "calc((100dvh - 220px) * 54 / 86)" : "min(350px, 88vw)",
              transformStyle: "preserve-3d",
              transition: isDraggingCard.current
                ? "none"
                : "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)",
              transform: `rotateY(${isFlipped ? 180 + tilt.x : tilt.x}deg) rotateX(${tilt.y}deg)`,
              cursor: "pointer",
              touchAction: "none",
            }}
          >
            {/* ================= MUKA DEPAN (FRONT FACE) ================= */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 20,
                background: isLightMode
                  ? "linear-gradient(135deg, #ffffff 0%, #f4f6f9 50%, #e9ecef 100%)"
                  : "linear-gradient(135deg, #181c24 0%, #0a0c10 50%, #121620 100%)",
                border: "1.5px solid rgba(212,175,55,0.45)",
                boxShadow: isLightMode
                  ? "0 20px 40px rgba(0,0,0,0.1), inset 0 0 20px rgba(212,175,55,0.08)"
                  : "0 25px 50px rgba(0,0,0,0.85), inset 0 0 25px rgba(212,175,55,0.12)",
                backfaceVisibility: "hidden",
                overflow: "hidden",
                padding: cardFormat === "id" ? "20px 18px" : "18px 22px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* Dynamic Holographic Glare + Spectral Foil Sweep */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  background: `radial-gradient(circle 340px at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,215,0,0.22) 0%, rgba(16,185,129,0.08) 22%, rgba(56,189,248,0.06) 42%, transparent 68%)`,
                  mixBlendMode: isLightMode ? "multiply" : "screen",
                }}
              />

              {cardFormat === "id" ? (
                /* ID BADGE FRONT */
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div
                      style={{
                        width: 44,
                        height: 34,
                        borderRadius: 6,
                        background: "linear-gradient(135deg, #f9d976 0%, #d4af37 50%, #a67c00 100%)",
                        border: "1px solid #ffeaa7",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          inset: "3px",
                          border: "1px solid rgba(0,0,0,0.3)",
                          borderRadius: 3,
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: 0,
                          right: 0,
                          height: 1,
                          background: "rgba(0,0,0,0.3)",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          bottom: 0,
                          left: "50%",
                          width: 1,
                          background: "rgba(0,0,0,0.3)",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "3px 8px 3px 4px",
                        borderRadius: 16,
                        background: isLightMode ? "rgba(155,112,22,0.12)" : "rgba(212,175,55,0.12)",
                        border: "1px solid rgba(212,175,55,0.45)",
                      }}
                    >
                      <img
                        src="/images/logo-utuh.webp"
                        alt="Expedient 43"
                        style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover" }}
                      />
                      <span style={{ fontSize: 10, fontWeight: 800, color: "#d4af37", letterSpacing: 1 }}>
                        43
                      </span>
                    </div>
                  </div>

                  {/* Foto Anggota */}
                  <div
                    style={{
                      alignSelf: "center",
                      width: "60%",
                      aspectRatio: "1/1",
                      maxHeight: 180,
                      borderRadius: 16,
                      border: "2px solid rgba(212,175,55,0.6)",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
                      overflow: "hidden",
                      background: "#1a1f2c",
                      position: "relative",
                      margin: "12px 0 8px",
                    }}
                  >
                    {fotoUrl ? (
                      <img
                        src={fotoUrl}
                        alt={user.nama_lengkap}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 48,
                          fontWeight: 800,
                          color: "#d4af37",
                        }}
                      >
                        {user.nama_lengkap.charAt(0)}
                      </div>
                    )}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        insetInline: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
                        padding: "4px",
                        textAlign: "center",
                        fontSize: 9,
                        letterSpacing: 2,
                        color: "#d4af37",
                        fontWeight: 700,
                      }}
                    >
                      EXPEDIENT 43
                    </div>
                  </div>

                  {/* Detail Nama & ID */}
                  <div style={{ textAlign: "center" }}>
                    <h2
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "clamp(16px, 4.5vw, 20px)",
                        fontWeight: 800,
                        color: isLightMode ? "#111" : "#ffffff",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        margin: "0 0 2px",
                        lineHeight: 1.2,
                      }}
                    >
                      {user.nama_lengkap}
                    </h2>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: 3,
                        color: "#d4af37",
                        marginBottom: 8,
                        textTransform: "uppercase",
                      }}
                    >
                      ALUMNI ANGKATAN KE-43
                    </div>

                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "4px 14px",
                        borderRadius: 8,
                        background: isLightMode ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(212,175,55,0.2)",
                        fontSize: 11,
                        fontFamily: "monospace",
                        color: isLightMode ? "#222" : "#e2e8f0",
                      }}
                    >
                      <span>
                        ID: <strong style={{ color: "#d4af37" }}>{nomorId}</strong>
                      </span>
                      <span style={{ opacity: 0.4 }}>•</span>
                      <span style={{ fontSize: 9, color: "#10b981", fontWeight: 700 }}>ACTIVE</span>
                    </div>
                  </div>

                  {/* Barcode Simulation */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 2,
                      opacity: isLightMode ? 0.7 : 0.5,
                      marginTop: 4,
                    }}
                  >
                    {[6, 2, 4, 1, 8, 3, 2, 6, 1, 4, 3, 8, 2, 5, 2, 6, 4, 1, 3, 8, 5, 2, 4].map(
                      (w, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: w,
                            height: 22,
                            background: isLightMode ? "#000" : "#d4af37",
                          }}
                        />
                      )
                    )}
                  </div>
                </>
              ) : (
                /* KTA HORIZONTAL FRONT */
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 48,
                          height: 36,
                          borderRadius: 6,
                          background: "linear-gradient(135deg, #f9d976 0%, #d4af37 50%, #a67c00 100%)",
                          border: "1px solid #ffeaa7",
                        }}
                      />
                      <i
                        className="fa-solid fa-wifi"
                        style={{ color: "#d4af37", fontSize: 18, transform: "rotate(90deg)" }}
                      />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: 13,
                            fontWeight: 800,
                            letterSpacing: 2,
                            color: "#d4af37",
                          }}
                        >
                          EXPEDIENT
                        </div>
                        <div style={{ fontSize: 8.5, letterSpacing: 2, opacity: 0.7 }}>ANGKATAN 43</div>
                      </div>
                      <img
                        src="/images/logo-utuh.webp"
                        alt="Expedient 43 Crest"
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          border: "1px solid rgba(212,175,55,0.5)",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  </div>

                  {/* Card Embossed Number */}
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: "clamp(15px, 4.5vw, 19px)",
                      letterSpacing: 3,
                      color: isLightMode ? "#111" : "#fff",
                      textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                      margin: "14px 0",
                    }}
                  >
                    4300 •••• •••• <span style={{ color: "#d4af37" }}>{nomorId.replace("EXP-", "")}</span>
                  </div>

                  {/* Bottom Details */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <div style={{ fontSize: 9, letterSpacing: 2, color: "#d4af37", textTransform: "uppercase" }}>
                        PEMEGANG KTA RESMI
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: isLightMode ? "#111" : "#ffffff",
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        {user.nama_lengkap}
                      </div>
                      <div style={{ fontSize: 9, color: isLightMode ? "#666" : "#94a3b8", marginTop: 2 }}>
                        BERLAKU SELAMANYA
                      </div>
                    </div>

                    {fotoUrl && (
                      <div
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: "50%",
                          border: "2px solid #d4af37",
                          overflow: "hidden",
                          boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
                        }}
                      >
                        <img
                          src={fotoUrl}
                          alt="Avatar"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ================= MUKA BELAKANG (BACK FACE) ================= */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 20,
                background: isLightMode
                  ? "linear-gradient(135deg, #f8f9fa 0%, #edf0f5 100%)"
                  : "linear-gradient(135deg, #0e1117 0%, #06080b 100%)",
                border: "1.5px solid rgba(212,175,55,0.4)",
                boxShadow: isLightMode
                  ? "0 20px 40px rgba(0,0,0,0.1)"
                  : "0 25px 50px rgba(0,0,0,0.85)",
                transform: "rotateY(180deg)",
                backfaceVisibility: "hidden",
                overflow: "hidden",
                padding: cardFormat === "id" ? "0 0 16px" : "0 0 12px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* Magnetic Stripe */}
              <div
                style={{
                  width: "100%",
                  height: cardFormat === "id" ? 42 : 36,
                  marginTop: cardFormat === "id" ? 28 : 18,
                  background: "linear-gradient(180deg, #111 0%, #000 100%)",
                  boxShadow: "inset 0 1px 3px rgba(255,255,255,0.1)",
                }}
              />

              {/* Content Back */}
              <div
                style={{
                  padding: "10px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  flex: 1,
                  justifyContent: "space-around",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#d4af37",
                      letterSpacing: 2,
                      marginBottom: 4,
                    }}
                  >
                    VERIFIKASI ALUMNI RESMI
                  </div>
                  <p
                    style={{
                      fontSize: 9,
                      lineHeight: 1.4,
                      color: isLightMode ? "#555" : "#94a3b8",
                      margin: 0,
                      maxWidth: 240,
                    }}
                  >
                    Kartu identitas resmi Keluarga Besar Alumni Expedient Generation 43,
                    Pondok Modern Arrisalah Slahung Ponorogo.
                  </p>
                </div>

                {/* QR Code Container */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowQrModal(true);
                  }}
                  style={{
                    padding: 8,
                    background: "#fff",
                    borderRadius: 10,
                    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <img
                    src={qrUrl}
                    alt="QR Verification"
                    style={{
                      width: cardFormat === "id" ? 95 : 75,
                      height: cardFormat === "id" ? 95 : 75,
                      display: "block",
                    }}
                  />
                  <span style={{ fontSize: 8, fontWeight: 700, color: "#000", letterSpacing: 1 }}>
                    KETUK UNTUK PERBESAR
                  </span>
                </div>

                {/* Signature Strip */}
                <div
                  style={{
                    width: "80%",
                    height: 28,
                    background: isLightMode ? "#e2e8f0" : "#ffffff",
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Playfair Display', serif",
                    fontStyle: "italic",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#000",
                    border: "1px dashed rgba(212,175,55,0.6)",
                  }}
                >
                  {user.nama_panggilan || user.nama_lengkap}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3D STUDIO (THREE.JS CANVAS VIEW)                                     */}
      {/* ========================================================================= */}
      {viewMode === "3d" && (
        <SovereignThreeScene
          user={user}
          nomorId={nomorId}
          fotoUrl={fotoUrl}
          qrUrl={qrUrl}
          isLightMode={isLightMode}
          cardFormat={cardFormat}
          isFlipped={isFlipped}
          onCardFormatChange={setCardFormat}
          onFlipChange={setIsFlipped}
          onLoaded={() => setIsLoading(false)}
        />
      )}

      {/* Unified Bottom Dock Controls (Mode 3D & Mode Ringan) */}
      <div
        className="sovereign-bottom-dock"
        style={{
          position: "absolute",
          bottom: "max(16px, env(safe-area-inset-bottom, 16px))",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 60,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          maxWidth: "94vw",
          pointerEvents: "auto",
        }}
      >
        {/* Format Switcher (ID Card Lanyard vs KTA Horizontal) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: isLightMode ? "rgba(255,255,255,0.96)" : "rgba(18,22,30,0.94)",
            padding: "4px 6px",
            borderRadius: 24,
            border: "1px solid rgba(212,175,55,0.35)",
            boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setCardFormat("id");
              setIsFlipped(false);
            }}
            style={{
              minHeight: 38,
              padding: "6px 12px",
              borderRadius: 18,
              border: "none",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.4,
              cursor: "pointer",
              background:
                cardFormat === "id"
                  ? "linear-gradient(135deg, #d4af37, #f3e5ab)"
                  : "transparent",
              color: cardFormat === "id" ? "#000" : isLightMode ? "#52525b" : "#94a3b8",
              boxShadow: cardFormat === "id" ? "0 2px 8px rgba(212,175,55,0.4)" : "none",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: 5,
              whiteSpace: "nowrap",
            }}
          >
            <i className="fa-solid fa-id-badge" aria-hidden="true" />
            <span>{locale === "ar" ? "البطاقة الطولية" : "ID Card"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCardFormat("kta");
              setIsFlipped(false);
            }}
            style={{
              minHeight: 38,
              padding: "6px 12px",
              borderRadius: 18,
              border: "none",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.4,
              cursor: "pointer",
              background:
                cardFormat === "kta"
                  ? "linear-gradient(135deg, #d4af37, #f3e5ab)"
                  : "transparent",
              color: cardFormat === "kta" ? "#000" : isLightMode ? "#52525b" : "#94a3b8",
              boxShadow: cardFormat === "kta" ? "0 2px 8px rgba(212,175,55,0.4)" : "none",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: 5,
              whiteSpace: "nowrap",
            }}
          >
            <i className="fa-solid fa-address-card" aria-hidden="true" />
            <span>{locale === "ar" ? "بطاقة KTA" : "KTA Horizontal"}</span>
          </button>
        </div>

        {/* Action Buttons (Flip, Copy, QR) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: isLightMode ? "rgba(255,255,255,0.96)" : "rgba(18,22,30,0.94)",
            padding: "5px 8px",
            borderRadius: 24,
            border: "1px solid rgba(212,175,55,0.3)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          }}
        >
          <button
            type="button"
            onClick={() => setIsFlipped((prev) => !prev)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              minHeight: 34,
              padding: "6px 12px",
              borderRadius: 18,
              border: "none",
              background: isFlipped ? "#d4af37" : "rgba(212,175,55,0.15)",
              color: isFlipped ? "#000" : isLightMode ? "#7c520a" : "#d4af37",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <i className="fa-solid fa-repeat" aria-hidden="true" />
            <span>
              {isFlipped
                ? locale === "ar"
                  ? "الأمام"
                  : locale === "en"
                  ? "Front"
                  : "Depan"
                : t.sovereign.flip_btn}
            </span>
          </button>

          <button
            type="button"
            onClick={handleCopyId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              minHeight: 34,
              padding: "6px 12px",
              borderRadius: 18,
              border: "none",
              background: copiedId ? "#10b981" : "rgba(212,175,55,0.15)",
              color: copiedId ? "#fff" : isLightMode ? "#7c520a" : "#d4af37",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
            }}
          >
            <i className={copiedId ? "fa-solid fa-check" : "fa-solid fa-copy"} aria-hidden="true" />
            <span>
              {copiedId
                ? locale === "ar"
                  ? "تم النسخ"
                  : locale === "en"
                  ? "Copied"
                  : "Tersalin"
                : locale === "ar"
                ? "نسخ المعرف"
                : locale === "en"
                ? "Copy ID"
                : "Salin ID"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              minHeight: 34,
              padding: "6px 12px",
              borderRadius: 18,
              border: "none",
              background: "rgba(212,175,55,0.15)",
              color: isLightMode ? "#7c520a" : "#d4af37",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <i className="fa-solid fa-qrcode" aria-hidden="true" />
            <span>QR</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FULLSCREEN QR CODE MODAL                                                  */}
      {/* ========================================================================= */}
      {showQrModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowQrModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: isLightMode ? "#ffffff" : "#0d1117",
              border: "2px solid #d4af37",
              borderRadius: 24,
              padding: "32px 24px",
              maxWidth: 340,
              width: "100%",
              textAlign: "center",
              boxShadow: "0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(212,175,55,0.25)",
            }}
          >
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 20,
                fontWeight: 800,
                color: isLightMode ? "#111" : "#ffffff",
                margin: "0 0 4px",
              }}
            >
              SCAN VERIFIKASI
            </h3>
            <p style={{ fontSize: 11, color: "#d4af37", letterSpacing: 2, marginBottom: 20 }}>
              EXPEDIENT GENERATION 43
            </p>

            <div
              style={{
                background: "#fff",
                padding: 16,
                borderRadius: 16,
                display: "inline-block",
                boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
                marginBottom: 16,
              }}
            >
              <img src={qrUrl} alt="QR Big" style={{ width: 200, height: 200, display: "block" }} />
            </div>

            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: isLightMode ? "#111" : "#fff",
                marginBottom: 4,
              }}
            >
              {user.nama_lengkap}
            </div>
            <div
              style={{
                fontSize: 12,
                fontFamily: "monospace",
                color: "#d4af37",
                marginBottom: 24,
              }}
            >
              {nomorId}
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 14,
                border: "none",
                background: "linear-gradient(135deg, #d4af37, #f3e5ab)",
                color: "#000",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 2,
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Global CSS Styles */}
      <style>{`
        body.page-sovereign .film-grain,
        body.page-sovereign .aurora-container,
        body.page-sovereign #particles-js,
        body.page-sovereign .cursor-dot,
        body.page-sovereign .cursor-ring {
          display: none !important;
        }
        body.page-sovereign {
          overflow: hidden !important;
        }

        @keyframes spinLoader {
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInModal {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        body.is-grabbing { cursor: grabbing !important; }
        #uxOverlay.hidden { opacity: 0 !important; transform: translateX(-50%) translateY(10px) !important; }
        
        /* SOVEREIGN RESPONSIVE HEADER */
        .sovereign-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: max(12px, env(safe-area-inset-top, 12px)) max(14px, env(safe-area-inset-right, 14px)) 6px max(14px, env(safe-area-inset-left, 14px));
          pointer-events: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .sovereign-header-row1 {
          display: flex;
          width: 100%;
          justify-content: space-between;
          align-items: center;
          pointer-events: auto;
        }

        .sovereign-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 44px;
          padding: 8px 14px;
          background: rgba(12, 16, 26, 0.92);
          border: 1px solid rgba(212, 175, 55, 0.4);
          border-radius: 20px;
          color: var(--gold-main, #d4af37);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-decoration: none;
          text-transform: uppercase;
          box-shadow: 0 4px 15px rgba(0,0,0,0.25);
          transition: transform 0.25s ease, border-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
        }
        :root[data-theme='light'] .sovereign-back-btn {
          background: rgba(255, 255, 255, 0.94);
          color: #18181b;
        }
        @media (hover: hover) and (pointer: fine) {
          .sovereign-back-btn:hover {
            transform: translateX(-3px);
            box-shadow: 0 6px 20px rgba(212,175,55,0.35);
            border-color: var(--gold-main, #d4af37);
            color: #fff;
          }
        }

        .sovereign-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          pointer-events: auto;
        }

        .sovereign-header-actions .lang-widget {
          position: static !important;
          top: auto !important;
          right: auto !important;
        }

        #btnThemeToggle, #btnExportId {
          width: 44px;
          height: 44px;
          min-width: 44px;
          min-height: 44px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          background: rgba(15, 20, 30, 0.94);
          border: 1px solid rgba(212, 175, 55, 0.35);
          color: var(--gold-main, #d4af37);
          font-size: 15px;
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        :root[data-theme='light'] #btnThemeToggle,
        :root[data-theme='light'] #btnExportId {
          background: #ffffff;
          color: #7c520a;
        }
        #btnThemeToggle:hover { transform: scale(1.06); border-color: #d4af37; }
        #btnExportId:hover { transform: scale(1.06); border-color: #d4af37; }

        .sovereign-mode-switcher-wrap {
          pointer-events: auto;
          display: flex;
          justify-content: center;
        }

        .sovereign-mode-switcher {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          background: rgba(15, 20, 30, 0.9);
          padding: 3px 5px;
          border-radius: 30px;
          border: 1px solid rgba(212, 175, 55, 0.35);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
        :root[data-theme='light'] .sovereign-mode-switcher {
          background: rgba(255, 255, 255, 0.92);
        }

        .sovereign-mode-tab {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 13px;
          border-radius: 20px;
          border: none;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.8px;
          cursor: pointer;
          background: transparent;
          color: #94a3b8;
          transition: all 0.25s ease;
        }
        :root[data-theme='light'] .sovereign-mode-tab {
          color: #64748b;
        }

        .sovereign-mode-tab.active {
          background: linear-gradient(135deg, #d4af37, #f3e5ab);
          color: #000 !important;
          box-shadow: 0 2px 10px rgba(212, 175, 55, 0.4);
        }

        /* Responsive adjustments for Desktop (>= 768px) */
        @media (min-width: 768px) {
          .sovereign-header {
            flex-direction: row;
            justify-content: space-between;
            padding: max(16px, env(safe-area-inset-top, 16px)) max(24px, env(safe-area-inset-right, 24px)) 0 max(24px, env(safe-area-inset-left, 24px));
            gap: 0;
          }
          .sovereign-header-row1 {
            width: 100%;
          }
          .sovereign-mode-switcher-wrap {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            top: max(16px, env(safe-area-inset-top, 16px));
          }
        }
        
        /* TEMA SIANG & SAFE MOBILE HUD CLEARANCE */
        @media (max-width: 767px) {
          .tactical-hud { display: none !important; }
        }
        :root[data-theme='light'] body.page-sovereign { background-color: #f6f5f1 !important; }
        :root[data-theme='light'] body.page-sovereign .vault-vignette { background: radial-gradient(circle at center, transparent 22%, rgba(235,230,218,0.68) 100%) !important; }
        :root[data-theme='light'] body.page-sovereign .tactical-hud, 
        :root[data-theme='light'] body.page-sovereign .ux-text { color: #18181b !important; text-shadow: none !important; }
        :root[data-theme='light'] body.page-sovereign .ux-icon { filter: none !important; color: #7c520a !important; }
      `}</style>
    </div>
  );
}

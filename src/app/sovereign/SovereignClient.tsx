"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getAvatarUrl } from "@/lib/avatar";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

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
  public_token: string | null;
  prestise_points?: number;
}

export default function SovereignClient({ user }: { user: SovereignUser }) {
  const { t } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);

  // Engine Mode: 'lite' (60 FPS CSS3D Hologram - Bebas Lag) vs '3d' (Three.js Studio Lanyard)
  const [viewMode, setViewMode] = useState<"lite" | "3d">("3d");
  const [showMobileChoiceModal, setShowMobileChoiceModal] = useState(false);
  const [cardFormat, setCardFormat] = useState<"id" | "kta">("id");
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 });
  const [isMobileDevice, setIsMobileDevice] = useState(false);
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

  // Deteksi Mobile pada Mount & Inisialisasi Mode
  useEffect(() => {
    const isMobile =
      typeof window !== "undefined" &&
      (window.innerWidth < 768 ||
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        (window.matchMedia && window.matchMedia("(pointer: coarse)").matches));

    setIsMobileDevice(isMobile);

    if (isMobile) {
      const savedMode = localStorage.getItem("sovereign_chosen_mode") as "lite" | "3d" | null;
      if (savedMode === "lite" || savedMode === "3d") {
        setViewMode(savedMode);
        setShowMobileChoiceModal(false);
      } else {
        // Tampilkan modal pilihan jika belum pernah memilih preferensi engine
        setShowMobileChoiceModal(true);
        setViewMode("lite");
      }
    } else {
      // Desktop: langsung ke 3D Studio grafis maksimal
      setViewMode("3d");
      setShowMobileChoiceModal(false);
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

  // Update root attribute saat ganti tema
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isLightMode ? "light" : "dark");
  }, [isLightMode]);

  // Handler memilih mode dari modal atau switcher
  const handleSelectMode = (mode: "lite" | "3d") => {
    setViewMode(mode);
    setShowMobileChoiceModal(false);
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
  // GENERATOR EKSPOR HIGH-RESOLUTION PNG (2400 x 1800)
  // ---------------------------------------------------------------------------
  const handleExportPng = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const compCanvas = document.createElement("canvas");
      const ctx = compCanvas.getContext("2d")!;
      compCanvas.width = 2400;
      compCanvas.height = 1800;

      // Background Luxury Obsidian / Light
      const bgGrad = ctx.createLinearGradient(0, 0, compCanvas.width, compCanvas.height);
      if (isLightMode) {
        bgGrad.addColorStop(0, "#f8f9fa");
        bgGrad.addColorStop(1, "#e9ecef");
      } else {
        bgGrad.addColorStop(0, "#161a22");
        bgGrad.addColorStop(0.5, "#080a0d");
        bgGrad.addColorStop(1, "#020202");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, compCanvas.width, compCanvas.height);

      // Watermark Header
      ctx.fillStyle = isLightMode ? "rgba(180,134,0,0.08)" : "rgba(212,175,55,0.06)";
      ctx.font = '900 130px "Playfair Display", serif';
      ctx.textAlign = "center";
      ctx.fillText("THE SOVEREIGN ALUMNI REGISTRY", 1200, 240);

      ctx.fillStyle = isLightMode ? "#8a6d1c" : "#d4af37";
      ctx.font = '600 24px "Inter", sans-serif';
      ctx.letterSpacing = "6px";
      ctx.fillText("EXPEDIENT 43 • OFFICIAL COHORT IDENTIFICATION CREDENTIAL", 1200, 310);

      // Helper load image
      const loadImage = (url: string): Promise<HTMLImageElement | null> => {
        return new Promise((resolve) => {
          if (!url) return resolve(null);
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.src = url;
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
        });
      };

      const [avatarImg, qrImg] = await Promise.all([
        fotoUrl ? loadImage(fotoUrl) : Promise.resolve(null),
        loadImage(qrUrl),
      ]);

      const drawCardPlate = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 35;
        ctx.shadowOffsetY = 15;
        ctx.fillStyle = isLightMode ? "#ffffff" : "#0f131a";
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fill();
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
      };

      // 1. ID CARD VERTIKAL (MUKA DEPAN) - x=180, y=420, w=580, h=920
      const idX = 180, idY = 420, idW = 580, idH = 920;
      drawCardPlate(idX, idY, idW, idH, 36);

      // Clip Lanyard Top
      ctx.fillStyle = "#d4af37";
      ctx.fillRect(idX + idW / 2 - 40, idY - 20, 80, 25);

      // Gold Chip
      ctx.fillStyle = "#d4af37";
      ctx.beginPath();
      ctx.roundRect(idX + 50, idY + 50, 90, 70, 10);
      ctx.fill();

      // VVIP Badge
      ctx.fillStyle = isLightMode ? "#111" : "#ffffff";
      ctx.font = 'bold 32px "Playfair Display", serif';
      ctx.textAlign = "right";
      ctx.fillText("VVIP", idX + idW - 50, idY + 95);

      // Avatar Foto
      const pX = idX + 50, pY = idY + 160, pW = idW - 100, pH = 340;
      ctx.fillStyle = "#1a1f2c";
      ctx.fillRect(pX, pY, pW, pH);
      if (avatarImg) {
        ctx.drawImage(avatarImg, pX, pY, pW, pH);
      }
      ctx.strokeStyle = "#d4af37";
      ctx.lineWidth = 2;
      ctx.strokeRect(pX, pY, pW, pH);

      // Nama Anggota
      ctx.textAlign = "center";
      ctx.fillStyle = isLightMode ? "#111" : "#ffffff";
      ctx.font = 'bold 36px "Playfair Display", serif';
      ctx.fillText(user.nama_lengkap.toUpperCase(), idX + idW / 2, idY + 580, idW - 80);

      ctx.fillStyle = "#d4af37";
      ctx.font = '700 18px "Inter", sans-serif';
      ctx.letterSpacing = "4px";
      ctx.fillText("EXPEDIENT INHABITANT", idX + idW / 2, idY + 625);

      // ID Tag
      ctx.fillStyle = isLightMode ? "#555" : "#94a3b8";
      ctx.font = "bold 22px monospace";
      ctx.fillText(`ID: ${nomorId}`, idX + idW / 2, idY + 700);
      ctx.fillText("VALID THRU: FOREVER", idX + idW / 2, idY + 740);

      // Barcode
      ctx.fillStyle = isLightMode ? "#000000" : "#ffffff";
      for (let i = 0; i < 36; i++) {
        const bw = (i % 3 === 0 ? 6 : i % 2 === 0 ? 3 : 2);
        ctx.fillRect(idX + 80 + i * 11, idY + 800, bw, 50);
      }

      // 2. ID CARD VERTIKAL (MUKA BELAKANG) - x=840, y=420, w=580, h=920
      const bX = 840, bY = 420;
      drawCardPlate(bX, bY, idW, idH, 36);

      // Magnetic Stripe
      ctx.fillStyle = "#050505";
      ctx.fillRect(bX, bY + 60, idW, 90);

      // Directive Text
      ctx.textAlign = "center";
      ctx.fillStyle = "#d4af37";
      ctx.font = 'bold 26px "Playfair Display", serif';
      ctx.fillText("THE REGISTRY DIRECTIVE", bX + idW / 2, bY + 230);

      ctx.fillStyle = isLightMode ? "#555" : "#94a3b8";
      ctx.font = '18px "Inter", sans-serif';
      ctx.fillText("Properti Eksklusif Expedient Generation 43.", bX + idW / 2, bY + 280);
      ctx.fillText("Simpan kartu ini sebagai hak akses The Vault.", bX + idW / 2, bY + 315);

      // QR Code
      const qrBoxX = bX + (idW - 240) / 2, qrBoxY = bY + 360;
      if (qrImg) {
        ctx.drawImage(qrImg, qrBoxX, qrBoxY, 240, 240);
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 3;
        ctx.strokeRect(qrBoxX, qrBoxY, 240, 240);
      }

      ctx.fillStyle = isLightMode ? "#333" : "#e2e8f0";
      ctx.font = "bold 18px monospace";
      ctx.fillText("SCAN TO VERIFY CREDENTIAL", bX + idW / 2, bY + 650);

      // Signature Strip
      ctx.fillStyle = isLightMode ? "#e2e8f0" : "#ffffff";
      ctx.fillRect(bX + 80, bY + 720, idW - 160, 50);
      ctx.fillStyle = "#000000";
      ctx.font = 'italic bold 22px "Playfair Display", serif';
      ctx.fillText(user.nama_panggilan || user.nama_lengkap, bX + idW / 2, bY + 755);

      // 3. KTA HORIZONTAL (FRONT) - x=1500, y=420, w=720, h=440
      const kX = 1500, kY = 420, kW = 720, kH = 440;
      drawCardPlate(kX, kY, kW, kH, 30);

      ctx.fillStyle = "#d4af37";
      ctx.beginPath();
      ctx.roundRect(kX + 60, kY + 60, 90, 70, 10);
      ctx.fill();

      ctx.textAlign = "right";
      ctx.fillStyle = isLightMode ? "#111" : "#ffffff";
      ctx.font = 'bold 28px "Playfair Display", serif';
      ctx.fillText("EXPEDIENT SOVEREIGN", kX + kW - 60, kY + 90);

      ctx.textAlign = "left";
      ctx.fillStyle = "#d4af37";
      ctx.font = "bold 32px monospace";
      ctx.fillText(`4300 •••• •••• ${nomorId.replace("EXP-", "")}`, kX + 60, kY + 230);

      ctx.fillStyle = isLightMode ? "#111" : "#ffffff";
      ctx.font = 'bold 28px "Inter", sans-serif';
      ctx.fillText(user.nama_lengkap.toUpperCase(), kX + 60, kY + 320, 450);

      ctx.fillStyle = isLightMode ? "#666" : "#94a3b8";
      ctx.font = "16px monospace";
      ctx.fillText("VALID: FOREVER", kX + 60, kY + 360);

      if (avatarImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(kX + kW - 110, kY + 310, 70, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatarImg, kX + kW - 180, kY + 240, 140, 140);
        ctx.restore();
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(kX + kW - 110, kY + 310, 70, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4. KTA HORIZONTAL (BACK) - x=1500, y=900, w=720, h=440
      const kbY = 900;
      drawCardPlate(kX, kbY, kW, kH, 30);

      ctx.fillStyle = "#050505";
      ctx.fillRect(kX, kbY + 50, kW, 70);

      ctx.textAlign = "left";
      ctx.fillStyle = "#d4af37";
      ctx.font = 'bold 24px "Playfair Display", serif';
      ctx.fillText("THE VAULT AUTHORIZATION", kX + 60, kbY + 180);

      ctx.fillStyle = isLightMode ? "#555" : "#94a3b8";
      ctx.font = '16px "Inter", sans-serif';
      ctx.fillText("Official Alumni Credential • Expedient 43", kX + 60, kbY + 225);
      ctx.fillText("Unauthorized reproduction is strictly prohibited.", kX + 60, kbY + 260);

      if (qrImg) {
        ctx.drawImage(qrImg, kX + kW - 200, kbY + 170, 140, 140);
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 2;
        ctx.strokeRect(kX + kW - 200, kbY + 170, 140, 140);
      }

      // Download file PNG
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
        background: isLightMode ? "#f8f9fa" : "#020202",
        overflow: "hidden",
        position: "fixed",
        inset: 0,
        fontFamily: "'Inter', sans-serif",
        userSelect: "none",
        transition: "background 0.5s ease",
      }}
    >
      {/* ========================================================================= */}
      {/* PRELOADER INITIAL                                                         */}
      {/* ========================================================================= */}
      <div
        id="preloader"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          background: "#020202",
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
            borderTopColor: "#ffd700",
            borderRadius: "50%",
            animation: "spinLoader 1s linear infinite",
            marginBottom: 20,
            boxShadow: "0 0 20px rgba(212,175,55,0.2)",
          }}
        />
        <span
          id="loadingText"
          style={{
            color: "#ffd700",
            fontFamily: "'Courier New', monospace",
            letterSpacing: 4,
            fontSize: 11,
            textShadow: "0 0 10px rgba(212,175,55,0.5)",
          }}
        >
          DECRYPTING OMNIPRESENCE...
        </span>
      </div>

      {/* Vignette Background */}
      <div
        className="vault-vignette"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 11,
          background: isLightMode
            ? "radial-gradient(circle at center, transparent 10%, rgba(255,255,255,0.6) 100%)"
            : "radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.9) 100%)",
          transition: "background 0.5s ease",
        }}
      />

      {/* ========================================================================= */}
      {/* HEADER NAVIGASI & CONTROLS                                                */}
      {/* ========================================================================= */}
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

            {/* Quick Switcher Modal Button on Mobile */}
            {isMobileDevice && (
              <button
                onClick={() => setShowMobileChoiceModal(true)}
                id="btnOpenModeModal"
                title="Pilih Versi (Super Ringan / 3D)"
                className="sovereign-mode-pill-btn"
              >
                <i className="fa-solid fa-sliders" />
                <span>Mode</span>
              </button>
            )}

            <button
              onClick={() => setIsLightMode(!isLightMode)}
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
                  background: "linear-gradient(135deg, #ffd700, #d4af37, #996515)",
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
              {/* Dynamic Holographic Glare Sweep */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  background: `radial-gradient(circle 350px at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,215,0,0.22) 0%, rgba(255,255,255,0.08) 25%, transparent 65%)`,
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
                        padding: "4px 10px",
                        borderRadius: 12,
                        background: isLightMode ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0.1)",
                        border: "1px solid rgba(212,175,55,0.4)",
                      }}
                    >
                      <i className="fa-solid fa-crown" style={{ color: "#d4af37", fontSize: 10 }} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: "#d4af37", letterSpacing: 1 }}>
                        VVIP
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
                        color: "#ffd700",
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
                      EXPEDIENT INHABITANT
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
                      <div style={{ fontSize: 9, letterSpacing: 3, opacity: 0.6 }}>SOVEREIGN</div>
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
                        CARDHOLDER
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
                        VALID: FOREVER
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
                    THE VAULT AUTHORIZATION
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
                    Credential ini adalah bukti keabsahan sah alumni Expedient Generation 43.
                    Penggunaan tanpa hak akan diproses sesuai statuta kehormatan.
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

          {/* Bottom Dock Controls (Unified, Clean, Anti-Tumpang Tindih) */}
          <div
            style={{
              position: "absolute",
              bottom: "max(18px, env(safe-area-inset-bottom, 18px))",
              zIndex: 60,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              maxWidth: "94vw",
            }}
          >
            {/* Format Switcher (ID Card vs KTA) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: isLightMode ? "rgba(255,255,255,0.92)" : "rgba(18,22,30,0.88)",
                padding: "3px 5px",
                borderRadius: 20,
                border: "1px solid rgba(212,175,55,0.35)",
                boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                backdropFilter: "blur(12px)",
              }}
            >
              <button
                onClick={() => setCardFormat("id")}
                style={{
                  padding: "5px 12px",
                  borderRadius: 14,
                  border: "none",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  cursor: "pointer",
                  background:
                    cardFormat === "id"
                      ? "linear-gradient(135deg, #d4af37, #f3e5ab)"
                      : "transparent",
                  color: cardFormat === "id" ? "#000" : isLightMode ? "#666" : "#94a3b8",
                  boxShadow: cardFormat === "id" ? "0 2px 8px rgba(212,175,55,0.4)" : "none",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <i className="fa-solid fa-id-badge" />
                <span>ID Card</span>
              </button>

              <button
                onClick={() => setCardFormat("kta")}
                style={{
                  padding: "5px 12px",
                  borderRadius: 14,
                  border: "none",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  cursor: "pointer",
                  background:
                    cardFormat === "kta"
                      ? "linear-gradient(135deg, #d4af37, #f3e5ab)"
                      : "transparent",
                  color: cardFormat === "kta" ? "#000" : isLightMode ? "#666" : "#94a3b8",
                  boxShadow: cardFormat === "kta" ? "0 2px 8px rgba(212,175,55,0.4)" : "none",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <i className="fa-solid fa-address-card" />
                <span>KTA Horizontal</span>
              </button>
            </div>

            {/* Action Buttons (Flip, Copy, QR) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: isLightMode ? "rgba(255,255,255,0.92)" : "rgba(18,22,30,0.88)",
                padding: "5px 8px",
                borderRadius: 24,
                border: "1px solid rgba(212,175,55,0.3)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                backdropFilter: "blur(12px)",
              }}
            >
              <button
                onClick={() => setIsFlipped(!isFlipped)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 12px",
                  borderRadius: 18,
                  border: "none",
                  background: "rgba(212,175,55,0.15)",
                  color: "#d4af37",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <i className="fa-solid fa-repeat" />
                <span>{isFlipped ? "Depan" : "Belakang"}</span>
              </button>

              <button
                onClick={handleCopyId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 12px",
                  borderRadius: 18,
                  border: "none",
                  background: copiedId ? "#10b981" : "rgba(212,175,55,0.15)",
                  color: copiedId ? "#fff" : "#d4af37",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <i className={copiedId ? "fa-solid fa-check" : "fa-solid fa-copy"} />
                <span>{copiedId ? "Tersalin" : "Salin ID"}</span>
              </button>

              <button
                onClick={() => setShowQrModal(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 12px",
                  borderRadius: 18,
                  border: "none",
                  background: "rgba(212,175,55,0.15)",
                  color: "#d4af37",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <i className="fa-solid fa-qrcode" />
                <span>QR</span>
              </button>
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
          onLoaded={() => setIsLoading(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL PILIHAN MODE (KHUSUS MOBILE PADA SAAT MASUK HALAMAN)               */}
      {/* ========================================================================= */}
      {showMobileChoiceModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.88)",
            backdropFilter: "blur(20px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px 16px",
            animation: "fadeInModal 0.3s ease",
          }}
        >
          <div
            style={{
              maxWidth: 420,
              width: "100%",
              background: "linear-gradient(180deg, #131720 0%, #0a0d13 100%)",
              border: "1.5px solid rgba(212,175,55,0.5)",
              borderRadius: 24,
              padding: "24px 20px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.9), 0 0 40px rgba(212,175,55,0.2)",
              color: "#fff",
              position: "relative",
            }}
          >
            {/* Header Modal */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  borderRadius: 20,
                  background: "rgba(212,175,55,0.15)",
                  border: "1px solid rgba(212,175,55,0.3)",
                  fontSize: 10,
                  color: "#d4af37",
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                <i className="fa-solid fa-mobile-screen-button" />
                Khusus Tampilan HP
              </div>
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#ffffff",
                  margin: "0 0 6px",
                  letterSpacing: 1,
                }}
              >
                PILIH VERSI TAMPILAN
              </h3>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                Pilih versi KTA digital yang paling sesuai dan nyaman untuk perangkat HP Anda:
              </p>
            </div>

            {/* Dua Pilihan Mode */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
              {/* Opsi 1: Mode Super Ringan (Seringan-ringannya) */}
              <div
                onClick={() => handleSelectMode("lite")}
                style={{
                  background: "linear-gradient(135deg, rgba(212,175,55,0.14) 0%, rgba(20,24,32,0.85) 100%)",
                  border: "1.5px solid rgba(212,175,55,0.6)",
                  borderRadius: 18,
                  padding: "16px",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #ffd700, #d4af37)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#000",
                        fontSize: 16,
                        fontWeight: 900,
                      }}
                    >
                      ⚡
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>
                        Versi Super Ringan
                      </div>
                      <div style={{ fontSize: 10, color: "#ffd700", fontWeight: 700 }}>
                        SERINGAN-RINGANNYA (60 FPS)
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      padding: "3px 8px",
                      borderRadius: 10,
                      background: "#10b981",
                      color: "#fff",
                      fontWeight: 800,
                      letterSpacing: 1,
                    }}
                  >
                    DIREKOMENDASIKAN
                  </span>
                </div>

                <p style={{ fontSize: 11, color: "#cbd5e1", margin: 0, lineHeight: 1.4 }}>
                  0% beban WebGL. Menggunakan kartu holografik CSS 3D, bebas lag 100%, lancar jaya di
                  semua HP, sangat hemat baterai.
                </p>

                <button
                  style={{
                    alignSelf: "flex-end",
                    padding: "6px 14px",
                    borderRadius: 12,
                    border: "none",
                    background: "linear-gradient(135deg, #d4af37, #f3e5ab)",
                    color: "#000",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 1,
                    cursor: "pointer",
                  }}
                >
                  Pilih Versi Ini →
                </button>
              </div>

              {/* Opsi 2: Mode 3D Studio Fisika (Sudah Diperbaiki Tidak Terbalik) */}
              <div
                onClick={() => handleSelectMode("3d")}
                style={{
                  background: "linear-gradient(135deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.85) 100%)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 18,
                  padding: "16px",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(212,175,55,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#d4af37",
                        fontSize: 15,
                      }}
                    >
                      ✦
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>
                        Versi 3D Studio
                      </div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>
                        SIMULASI 3D TALI &amp; GALERI
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      padding: "3px 8px",
                      borderRadius: 10,
                      background: "rgba(212,175,55,0.2)",
                      color: "#d4af37",
                      fontWeight: 800,
                      border: "1px solid rgba(212,175,55,0.4)",
                    }}
                  >
                    TELAH DIPERBAIKI
                  </span>
                </div>

                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, lineHeight: 1.4 }}>
                  Simulasi 3D Three.js asli lengkap dengan tali lanyard fisik &amp; pencahayaan galeri.
                  Orientasi kartu yang sebelumnya terbalik kini sudah tegak &amp; normal.
                </p>

                <button
                  style={{
                    alignSelf: "flex-end",
                    padding: "6px 14px",
                    borderRadius: 12,
                    border: "1px solid rgba(212,175,55,0.4)",
                    background: "rgba(212,175,55,0.1)",
                    color: "#d4af37",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1,
                    cursor: "pointer",
                  }}
                >
                  Pilih Versi 3D →
                </button>
              </div>
            </div>

            {/* Note & Close */}
            <div
              style={{
                textAlign: "center",
                fontSize: 10,
                color: "#64748b",
                lineHeight: 1.5,
              }}
            >
              💡 <em>Anda dapat beralih mode kapan saja lewat tombol di bagian atas layar.</em>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULLSCREEN QR CODE MODAL                                                  */}
      {/* ========================================================================= */}
      {showQrModal && (
        <div
          onClick={() => setShowQrModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(16px)",
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
          padding: 7px 14px;
          background: rgba(0, 0, 0, 0.65);
          border: 1px solid rgba(212, 175, 55, 0.4);
          border-radius: 20px;
          color: #d4af37;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-decoration: none;
          text-transform: uppercase;
          backdrop-filter: blur(12px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.25);
          transition: all 0.25s ease;
        }
        :root[data-theme='light'] .sovereign-back-btn {
          background: rgba(255, 255, 255, 0.88);
          color: #111;
        }
        .sovereign-back-btn:hover {
          transform: translateX(-3px);
          box-shadow: 0 0 20px rgba(212,175,55,0.5);
          border-color: #ffd700;
          color: #fff;
        }

        .sovereign-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          pointer-events: auto;
        }

        .sovereign-mode-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid rgba(212, 175, 55, 0.4);
          background: rgba(212, 175, 55, 0.15);
          color: #d4af37;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          cursor: pointer;
          backdrop-filter: blur(10px);
          transition: all 0.2s ease;
        }
        :root[data-theme='light'] .sovereign-mode-pill-btn {
          background: rgba(212, 175, 55, 0.2);
          color: #996515;
        }

        #btnThemeToggle, #btnExportId {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          background: rgba(0, 0, 0, 0.65);
          border: 1px solid rgba(212, 175, 55, 0.4);
          color: #d4af37;
          font-size: 14px;
          cursor: pointer;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.25);
          transition: all 0.25s ease;
        }
        :root[data-theme='light'] #btnThemeToggle,
        :root[data-theme='light'] #btnExportId {
          background: #ffffff;
          color: #b48600;
        }
        #btnThemeToggle:hover { transform: scale(1.1) rotate(15deg); box-shadow: 0 0 20px rgba(212,175,55,0.5); }
        #btnExportId:hover { transform: scale(1.1) translateY(2px); box-shadow: 0 0 20px rgba(212,175,55,0.5); }

        .sovereign-mode-switcher-wrap {
          pointer-events: auto;
          display: flex;
          justify-content: center;
        }

        .sovereign-mode-switcher {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          background: rgba(10, 12, 16, 0.85);
          padding: 3px 5px;
          border-radius: 30px;
          border: 1px solid rgba(212, 175, 55, 0.4);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4), 0 0 15px rgba(212, 175, 55, 0.15);
          backdrop-filter: blur(14px);
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
        
        /* TEMA SIANG */
        :root[data-theme='light'] body.page-sovereign { background-color: #f8f9fa !important; }
        :root[data-theme='light'] body.page-sovereign .vault-vignette { background: radial-gradient(circle at center, transparent 10%, rgba(255,255,255,0.6) 100%) !important; }
        :root[data-theme='light'] body.page-sovereign .tactical-hud, 
        :root[data-theme='light'] body.page-sovereign .ux-text { color: #222 !important; text-shadow: 0 0 5px rgba(255,255,255,0.8) !important; }
        :root[data-theme='light'] body.page-sovereign .ux-icon { filter: drop-shadow(0 0 10px rgba(0,0,0,0.2)) !important; color: #b48600 !important; }
      `}</style>
    </div>
  );
}

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
  formatDomisiliLabel,
  generateVerificationQrCanvas,
  loadArtworkImage,
} from "./cardArtwork";
import "./sovereign.css";

const SovereignThreeScene = dynamic(() => import("./SovereignThreeScene"), {
  ssr: false,
  loading: () => (
    <div className="sovereign-stage-fallback">Menyiapkan ruang pamer 3D…</div>
  ),
});

export interface SovereignUser {
  id: string;
  nama_lengkap: string;
  nama_panggilan: string | null;
  foto_profil: string | null;
  alamat_lengkap?: string | null;
  role?: string | null;
  public_token?: string | null;
  prestise_points?: number;
}

const DEFAULT_ORIGIN = "https://expedientgeneration.vercel.app";

export default function SovereignClient({ user }: { user: SovereignUser }) {
  const { t, locale } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<"lite" | "3d">("3d");
  const [cardFormat, setCardFormat] = useState<"id" | "kta">("id");
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 });
  const [isLoading, setIsLoading] = useState(true);
  const [originUrl, setOriginUrl] = useState(DEFAULT_ORIGIN);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const isDraggingCard = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const fotoUrl = user.foto_profil
    ? getAvatarUrl(user.foto_profil, user.nama_panggilan || user.nama_lengkap)
    : "";

  const nomorId = "EXP-" + user.id.replace(/-/g, "").substring(0, 4).toUpperCase();
  const domisili = formatDomisiliLabel(user.alamat_lengkap);
  const verificationUrl = `${originUrl}/dossier/${user.id}`;

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin) {
      setOriginUrl(window.location.origin);
    }

    const savedMode = localStorage.getItem("sovereign_chosen_mode") as "lite" | "3d" | null;
    if (savedMode === "lite") {
      setViewMode("lite");
    } else {
      setViewMode("3d");
    }

    const savedTheme =
      localStorage.getItem("expedient_theme") ||
      document.documentElement.getAttribute("data-theme") ||
      "dark";
    setIsLightMode(savedTheme === "light");

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 380);

    document.body.classList.add("page-sovereign");
    return () => {
      clearTimeout(timer);
      document.body.classList.remove("page-sovereign");
    };
  }, []);

  // Generate local verification QR DataURL once origin resolves (zero external API dependency)
  useEffect(() => {
    let active = true;
    generateVerificationQrCanvas(`${originUrl}/dossier/${user.id}`, 480).then((canvas) => {
      if (active && canvas) {
        setQrDataUrl(canvas.toDataURL("image/png"));
      }
    });
    return () => {
      active = false;
    };
  }, [originUrl, user.id]);

  // Close QR modal cleanly on Escape
  useEffect(() => {
    if (!showQrModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowQrModal(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showQrModal]);

  const handleToggleTheme = (e: React.MouseEvent) => {
    const nextMode = !isLightMode;
    setIsLightMode(nextMode);
    executeThemeTransition(nextMode ? "light" : "dark", e);
  };

  const handleSelectMode = (mode: "lite" | "3d") => {
    setViewMode(mode);
    localStorage.setItem("sovereign_chosen_mode", mode);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(nomorId);
    setCopiedId(true);
    if (navigator.vibrate) navigator.vibrate(35);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Pointer & gyroscope tilt for Lite CSS 3D Mode
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingCard.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const pctX = Math.max(0, Math.min(100, (cx / Math.max(1, rect.width)) * 100));
    const pctY = Math.max(0, Math.min(100, (cy / Math.max(1, rect.height)) * 100));

    if (isDraggingCard.current) {
      const deltaX = (e.clientX - dragStart.current.x) * 0.38;
      const deltaY = -(e.clientY - dragStart.current.y) * 0.38;
      setTilt({
        x: Math.max(-26, Math.min(26, deltaX)),
        y: Math.max(-26, Math.min(26, deltaY)),
        glareX: pctX,
        glareY: pctY,
      });
    } else {
      const rotY = (pctX - 50) * 0.32;
      const rotX = -(pctY - 50) * 0.32;
      setTilt({ x: rotY, y: rotX, glareX: pctX, glareY: pctY });
    }
  };

  const handlePointerUp = () => {
    isDraggingCard.current = false;
    setTilt((prev) => ({ ...prev, x: 0, y: 0 }));
  };

  useEffect(() => {
    if (viewMode !== "lite") return;
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      const rotY = Math.max(-24, Math.min(24, e.gamma * 0.65));
      const rotX = Math.max(-24, Math.min(24, (e.beta - 45) * 0.55));
      setTilt({
        x: rotY,
        y: rotX,
        glareX: 50 + rotY * 1.4,
        glareY: 50 + rotX * 1.4,
      });
    };
    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => window.removeEventListener("deviceorientation", handleOrientation, true);
  }, [viewMode]);

  // High-Resolution Credential Sheet Export (2400 x 1800)
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
        bgGrad.addColorStop(1, "#e7dfd0");
      } else {
        bgGrad.addColorStop(0, "#0d1526");
        bgGrad.addColorStop(0.5, "#060912");
        bgGrad.addColorStop(1, "#030509");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, compCanvas.width, compCanvas.height);

      // Architectural border frame on export sheet
      ctx.strokeStyle = isLightMode ? "rgba(155, 112, 22, 0.28)" : "rgba(212, 175, 55, 0.28)";
      ctx.lineWidth = 3;
      ctx.strokeRect(56, 56, compCanvas.width - 112, compCanvas.height - 112);

      ctx.textAlign = "center";
      ctx.fillStyle = isLightMode ? "#18181b" : "#f5e19c";
      ctx.font = '700 62px "Playfair Display", Georgia, serif';
      ctx.fillText("Kartu Tanda Alumni Resmi · Expedient 43", 1200, 186);

      ctx.fillStyle = isLightMode ? "#7c520a" : "#94a3b8";
      ctx.font = '500 24px "Inter", sans-serif';
      ctx.fillText(
        `Pondok Modern Arrisalah, Slahung, Ponorogo  ·  ${user.nama_lengkap} (${nomorId})`,
        1200,
        244
      );

      const [crestImg, avatarImg, qrCanvas] = await Promise.all([
        loadArtworkImage("/images/logo-utuh.webp"),
        loadArtworkImage(fotoUrl),
        generateVerificationQrCanvas(verificationUrl, 520),
      ]);

      const identity: CardIdentityData = {
        nama: user.nama_lengkap,
        panggilan: user.nama_panggilan || user.nama_lengkap,
        nomorId,
        domisili,
        angkatanLabel: "Ke-43 · Expedient Generation",
        berlakuLabel: "Seumur Hidup",
        maskedCardNumber: `4300  2026  ••••  ${nomorId.replace("EXP-", "")}`,
      };
      const assets = { crestImg, avatarImg, qrCanvas };

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
        ctx.shadowColor = isLightMode ? "rgba(24, 24, 27, 0.2)" : "rgba(0, 0, 0, 0.72)";
        ctx.shadowBlur = 42;
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 22;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fillStyle = "#070a12";
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.clip();
        ctx.drawImage(src, x, y, w, h);
        ctx.restore();

        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.stroke();
      };

      // Woven ribbon lanyard silhouette above Vertical ID Card
      ctx.save();
      ctx.fillStyle = "#0e131d";
      ctx.fillRect(428, 56, 84, 326);
      ctx.fillStyle = "rgba(212, 175, 55, 0.65)";
      ctx.fillRect(433, 56, 4, 326);
      ctx.fillRect(503, 56, 4, 326);
      ctx.fillStyle = "#d4af37";
      ctx.fillRect(438, 364, 64, 26);
      ctx.restore();

      drawFramedCard(idFrontCanvas, 180, 380, 580, 920, 34);
      drawFramedCard(idBackCanvas, 840, 380, 580, 920, 34);
      drawFramedCard(ktaFrontCanvas, 1500, 380, 720, 450, 28);
      drawFramedCard(ktaBackCanvas, 1500, 870, 720, 450, 28);

      ctx.textAlign = "center";
      ctx.fillStyle = isLightMode ? "#52525b" : "#64748b";
      ctx.font = '500 20px "Inter", sans-serif';
      ctx.fillText(
        `Verifikasi daring: ${verificationUrl}`,
        1200,
        1690
      );

      const link = document.createElement("a");
      link.download = `kta-expedient43-${nomorId}.png`;
      link.href = compCanvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Gagal mengekspor KTA PNG:", err);
    } finally {
      setIsExporting(false);
    }
  }, [domisili, fotoUrl, isExporting, isLightMode, nomorId, user, verificationUrl]);

  return (
    <div className={`sovereign-root ${isLightMode ? "is-light" : ""}`}>
      {/* Preloader */}
      <div
        id="preloader"
        className={`sovereign-preloader ${isLoading ? "" : "is-done"}`}
      >
        <div className="sovereign-spinner" />
        <span id="loadingText" className="sovereign-preloader-label">
          Menyiapkan Kartu Tanda Alumni 3D…
        </span>
      </div>

      <div className="sovereign-vignette" />

      {/* Responsive Header */}
      <header className="sovereign-header">
        <div className="sovereign-header-row1">
          <Link href="/fitur" id="btnBackToFitur" className="sovereign-back-btn">
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            <span>{t.common.back}</span>
          </Link>

          <div className="sovereign-header-actions">
            <LanguageSwitcher variant="pill" />

            <button
              type="button"
              onClick={handleToggleTheme}
              id="btnThemeToggle"
              className="sovereign-icon-btn"
              title="Ganti Pencahayaan Ruang Pamer (Siang/Malam)"
              aria-label="Ganti Pencahayaan Ruang Pamer"
            >
              <i
                className={isLightMode ? "fa-solid fa-moon" : "fa-solid fa-sun"}
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              onClick={handleExportPng}
              id="btnExportId"
              className="sovereign-icon-btn"
              disabled={isExporting}
              title={isExporting ? t.sovereign.exporting_btn : t.sovereign.export_btn}
              aria-label="Unduh Lembar KTA Resolusi Tinggi"
            >
              <i
                className={
                  isExporting ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-download"
                }
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        <div className="sovereign-mode-switcher-wrap">
          <div className="sovereign-mode-switcher" role="tablist" aria-label="Mode Tampilan">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "lite"}
              onClick={() => handleSelectMode("lite")}
              className={`sovereign-mode-tab ${viewMode === "lite" ? "active" : ""}`}
            >
              <i className="fa-solid fa-bolt" aria-hidden="true" />
              <span>{t.sovereign.mode_lite}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "3d"}
              onClick={() => handleSelectMode("3d")}
              className={`sovereign-mode-tab ${viewMode === "3d" ? "active" : ""}`}
            >
              <i className="fa-solid fa-cube" aria-hidden="true" />
              <span>{t.sovereign.mode_3d}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* LITE CSS 3D MODE (60 FPS ZERO-WEBGL BACKUP WITH IDENTICAL AESTHETIC)  */}
      {/* ===================================================================== */}
      {viewMode === "lite" && (
        <div
          className="sovereign-lite-stage"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 1200 800"
            preserveAspectRatio="none"
            className="sovereign-lite-marble-veins"
          >
            <path
              d="M-40 160 C 260 220, 420 90, 740 190 T 1260 120"
              fill="none"
              stroke="#d4af37"
              strokeWidth="1.4"
              strokeOpacity="0.65"
            />
            <path
              d="M-60 560 C 220 470, 520 650, 830 510 T 1260 610"
              fill="none"
              stroke="#d4af37"
              strokeWidth="1.1"
              strokeOpacity="0.45"
            />
          </svg>

          {cardFormat === "id" && (
            <div className="sovereign-lite-strap" aria-hidden="true">
              <div className="sovereign-lite-clasp" />
            </div>
          )}

          <div
            ref={cardRef}
            onClick={() => setIsFlipped((prev) => !prev)}
            className={`sovereign-lite-card ${cardFormat === "id" ? "is-id" : "is-kta"}`}
            style={{
              transition: isDraggingCard.current
                ? "none"
                : "transform 0.48s cubic-bezier(0.23, 1, 0.32, 1)",
              transform: `rotateY(${isFlipped ? 180 + tilt.x : tilt.x}deg) rotateX(${tilt.y}deg)`,
            }}
          >
            {/* FRONT FACE */}
            <div
              className="sovereign-lite-face"
              style={{
                padding: cardFormat === "id" ? "18px 18px 16px" : "16px 20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  background: `radial-gradient(circle 300px at ${tilt.glareX}% ${tilt.glareY}%, rgba(245, 225, 156, 0.2) 0%, rgba(212, 175, 55, 0.06) 36%, transparent 68%)`,
                }}
              />

              {cardFormat === "id" ? (
                <>
                  {/* Header: Official Crest + Title & 24K EMV Chip */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/logo-utuh.webp"
                        alt="Expedient 43"
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          border: "1.5px solid #d4af37",
                          objectFit: "cover",
                        }}
                      />
                      <div>
                        <div
                          style={{
                            fontFamily: "var(--font-playfair, Georgia, serif)",
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            color: "#f5e19c",
                          }}
                        >
                          EXPEDIENT 43
                        </div>
                        <div style={{ fontSize: 9, color: "#94a3b8" }}>
                          Pondok Modern Arrisalah
                        </div>
                      </div>
                    </div>

                    <div className="sovereign-lite-chip" />
                  </div>

                  {/* Portrait Window */}
                  <div
                    style={{
                      width: "100%",
                      flex: 1,
                      minHeight: 148,
                      maxHeight: 205,
                      margin: "10px 0",
                      borderRadius: 12,
                      border: "1.5px solid rgba(212, 175, 55, 0.65)",
                      overflow: "hidden",
                      background: "radial-gradient(circle at 50% 38%, #172236 0%, #090e18 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {fotoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={fotoUrl}
                        alt={user.nama_lengkap}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span
                        style={{
                          fontFamily: "var(--font-playfair, Georgia, serif)",
                          fontSize: 52,
                          fontWeight: 700,
                          color: "#f5e19c",
                        }}
                      >
                        {user.nama_lengkap.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Editorial Identity & 2-Column Metadata */}
                  <div>
                    <div
                      style={{
                        fontSize: 8.5,
                        fontWeight: 600,
                        letterSpacing: "0.12em",
                        color: "#d4af37",
                        marginBottom: 3,
                      }}
                    >
                      KARTU TANDA ALUMNI RESMI
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-playfair, Georgia, serif)",
                        fontSize: "clamp(14px, 4vw, 17px)",
                        fontWeight: 700,
                        color: "#f8fafc",
                        lineHeight: 1.2,
                        textTransform: "uppercase",
                        paddingBottom: 8,
                        borderBottom: "1px solid rgba(212, 175, 55, 0.28)",
                      }}
                    >
                      {user.nama_lengkap}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        paddingTop: 7,
                        fontSize: 9.5,
                      }}
                    >
                      <div>
                        <div style={{ color: "#94a3b8", fontSize: 8.5 }}>Domisili</div>
                        <div style={{ color: "#f8fafc", fontWeight: 600 }}>{domisili}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#94a3b8", fontSize: 8.5 }}>Nomor Anggota</div>
                        <div
                          style={{
                            fontFamily: "var(--font-jetbrains-mono, monospace)",
                            color: "#f5e19c",
                            fontWeight: 700,
                          }}
                        >
                          {nomorId}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* KTA HORIZONTAL FRONT */
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 14,
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minWidth: 0,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/logo-utuh.webp"
                        alt="Expedient 43"
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          border: "1.5px solid #d4af37",
                          objectFit: "cover",
                        }}
                      />
                      <div>
                        <div
                          style={{
                            fontFamily: "var(--font-playfair, Georgia, serif)",
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            color: "#f5e19c",
                          }}
                        >
                          EXPEDIENT GENERATION
                        </div>
                        <div style={{ fontSize: 8.5, color: "#94a3b8" }}>
                          Pondok Modern Arrisalah · Ke-43
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="sovereign-lite-chip" />
                      <span
                        style={{
                          fontFamily: "var(--font-jetbrains-mono, monospace)",
                          fontSize: 12,
                          color: "#f5e19c",
                          letterSpacing: "0.06em",
                        }}
                      >
                        4300 •••• {nomorId.replace("EXP-", "")}
                      </span>
                    </div>

                    <div>
                      <div style={{ fontSize: 8, letterSpacing: "0.1em", color: "#d4af37" }}>
                        PEMEGANG KARTU
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-playfair, Georgia, serif)",
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: "#f8fafc",
                          textTransform: "uppercase",
                          lineHeight: 1.2,
                        }}
                      >
                        {user.nama_lengkap}
                      </div>
                      <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>
                        {domisili} · {nomorId}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      width: 78,
                      alignSelf: "stretch",
                      marginTop: 28,
                      borderRadius: 10,
                      border: "1.5px solid rgba(212, 175, 55, 0.65)",
                      overflow: "hidden",
                      background: "#111a2a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {fotoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={fotoUrl}
                        alt={user.nama_lengkap}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span
                        style={{
                          fontFamily: "var(--font-playfair, Georgia, serif)",
                          fontSize: 28,
                          fontWeight: 700,
                          color: "#f5e19c",
                        }}
                      >
                        {user.nama_lengkap.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* BACK FACE */}
            <div
              className="sovereign-lite-face is-back"
              style={{
                padding: cardFormat === "id" ? "0 0 16px" : "0 0 12px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: cardFormat === "id" ? 38 : 30,
                  marginTop: cardFormat === "id" ? 22 : 14,
                  background: "#020408",
                  borderBlock: "1px solid rgba(212, 175, 55, 0.18)",
                }}
              />

              <div
                style={{
                  padding: "10px 18px",
                  display: "flex",
                  flexDirection: cardFormat === "id" ? "column" : "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flex: 1,
                }}
              >
                <div style={{ textAlign: cardFormat === "id" ? "center" : "left" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-playfair, Georgia, serif)",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#f5e19c",
                      marginBottom: 4,
                    }}
                  >
                    Verifikasi Keanggotaan Resmi
                  </div>
                  <p
                    style={{
                      fontSize: 9.5,
                      lineHeight: 1.45,
                      color: "#94a3b8",
                      margin: 0,
                      maxWidth: 230,
                    }}
                  >
                    Keluarga Besar Alumni Angkatan ke-43 Pondok Modern Arrisalah, Slahung, Ponorogo.
                  </p>

                  <div
                    style={{
                      marginTop: 10,
                      padding: "4px 12px",
                      background: "#f4f1ea",
                      borderRadius: 6,
                      border: "1px solid rgba(212, 175, 55, 0.55)",
                      fontFamily: "var(--font-playfair, Georgia, serif)",
                      fontStyle: "italic",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#0f172a",
                      display: "inline-block",
                    }}
                  >
                    {user.nama_panggilan || user.nama_lengkap}
                  </div>
                </div>

                {qrDataUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowQrModal(true);
                    }}
                    style={{
                      padding: 7,
                      background: "#faf8f3",
                      borderRadius: 10,
                      border: "1.5px solid #d4af37",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                    title="Perbesar Kode QR Verifikasi"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrDataUrl}
                      alt="QR Verifikasi Alumni"
                      style={{
                        width: cardFormat === "id" ? 94 : 78,
                        height: cardFormat === "id" ? 94 : 78,
                        display: "block",
                      }}
                    />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3D HOROLOGY STUDIO STAGE (THREE.JS)                                   */}
      {/* ===================================================================== */}
      {viewMode === "3d" && (
        <SovereignThreeScene
          user={user}
          nomorId={nomorId}
          fotoUrl={fotoUrl}
          verificationUrl={verificationUrl}
          isLightMode={isLightMode}
          cardFormat={cardFormat}
          isFlipped={isFlipped}
          onCardFormatChange={setCardFormat}
          onFlipChange={setIsFlipped}
          onLoaded={() => setIsLoading(false)}
        />
      )}

      {/* Unified Bottom Control Dock */}
      <div className="sovereign-bottom-dock">
        <div className="sovereign-dock-pill" role="group" aria-label="Format Kartu">
          <button
            type="button"
            onClick={() => {
              setCardFormat("id");
              setIsFlipped(false);
            }}
            className={`sovereign-dock-btn ${cardFormat === "id" ? "is-active" : ""}`}
          >
            <i className="fa-solid fa-id-badge" aria-hidden="true" />
            <span>{locale === "ar" ? "البطاقة الطولية" : "ID Lanyard"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCardFormat("kta");
              setIsFlipped(false);
            }}
            className={`sovereign-dock-btn ${cardFormat === "kta" ? "is-active" : ""}`}
          >
            <i className="fa-solid fa-address-card" aria-hidden="true" />
            <span>{locale === "ar" ? "بطاقة المحفظة" : "KTA Dompet"}</span>
          </button>
        </div>

        <div className="sovereign-dock-pill" role="group" aria-label="Tindakan Kartu">
          <button
            type="button"
            onClick={() => setIsFlipped((prev) => !prev)}
            className={`sovereign-dock-btn ${isFlipped ? "is-active" : "is-tinted"}`}
          >
            <i className="fa-solid fa-repeat" aria-hidden="true" />
            <span>
              {isFlipped
                ? locale === "ar"
                  ? "الوجه الأمامي"
                  : locale === "en"
                  ? "Front Side"
                  : "Sisi Depan"
                : t.sovereign.flip_btn}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="sovereign-dock-btn is-tinted"
          >
            <i className="fa-solid fa-qrcode" aria-hidden="true" />
            <span>{locale === "ar" ? "رمز التحقق" : locale === "en" ? "Verify QR" : "Kode QR"}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyId}
            className={`sovereign-dock-btn ${copiedId ? "is-copied" : "is-tinted"}`}
          >
            <i
              className={copiedId ? "fa-solid fa-check" : "fa-solid fa-copy"}
              aria-hidden="true"
            />
            <span>
              {copiedId
                ? locale === "ar"
                  ? "تم النسخ"
                  : locale === "en"
                  ? "Copied"
                  : "Tersalin"
                : locale === "ar"
                ? "نسخ الرقم"
                : locale === "en"
                ? "Copy ID"
                : "Salin ID"}
            </span>
          </button>
        </div>
      </div>

      {/* Fullscreen Verification QR Modal */}
      {showQrModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sovereignQrModalTitle"
          className="sovereign-modal-backdrop"
          onClick={() => setShowQrModal(false)}
        >
          <div className="sovereign-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3
              id="sovereignQrModalTitle"
              style={{
                fontFamily: "var(--font-playfair, Georgia, serif)",
                fontSize: 21,
                fontWeight: 700,
                color: "var(--sov-text)",
                margin: "0 0 4px",
              }}
            >
              Verifikasi Keanggotaan
            </h3>
            <p
              style={{
                fontSize: 12,
                color: "var(--sov-gold-ink)",
                margin: 0,
              }}
            >
              Pondok Modern Arrisalah · Expedient 43
            </p>

            <div className="sovereign-modal-qr-frame">
              {qrDataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={qrDataUrl}
                  alt="Kode QR Verifikasi Alumni"
                  style={{ width: 208, height: 208, display: "block" }}
                />
              ) : (
                <div style={{ width: 208, height: 208 }} />
              )}
            </div>

            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--sov-text)",
                marginBottom: 2,
              }}
            >
              {user.nama_lengkap}
            </div>
            <div
              style={{
                fontSize: 12,
                fontFamily: "var(--font-jetbrains-mono, monospace)",
                color: "var(--sov-gold-ink)",
                marginBottom: 16,
              }}
            >
              {nomorId} · {domisili}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link
                href={`/dossier/${user.id}`}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--sov-gold-ink)",
                  textDecoration: "none",
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--sov-border)",
                }}
              >
                Buka Profil Verifikasi Resmi →
              </Link>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="sovereign-modal-close"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ScannerClient() {
  const { locale, dir, isRTL } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraState, setCameraState] = useState<"requesting" | "active" | "error">("requesting");
  const [scanSuccess, setScanSuccess] = useState(false);
  const [decodedText, setDecodedText] = useState<string | null>(null);
  const router = useRouter();

  const startCamera = useCallback(() => {
    setCameraState("requesting");
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
            setCameraState("active");
          }
        })
        .catch(() => {
          setCameraState("error");
        });
    } else {
      setCameraState("error");
    }
  }, []);

  useEffect(() => {
    startCamera();
    const videoEl = videoRef.current;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    let scanTween: gsap.core.Tween | null = null;
    if (!reducedMotion) {
      scanTween = gsap.fromTo(
        ".scan-line",
        { top: "8%" },
        { top: "92%", duration: 2.2, repeat: -1, yoyo: true, ease: "power1.inOut" }
      );
    }

    return () => {
      scanTween?.kill();
      if (videoEl && videoEl.srcObject) {
        const tracks = (videoEl.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  useEffect(() => {
    if (cameraState !== "active" || scanSuccess) return;
    const BarcodeDetectorCtor = (window as any).BarcodeDetector;
    if (typeof BarcodeDetectorCtor !== "function") return;

    let cancelled = false;
    let detector: any = null;
    try {
      detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });
    } catch {
      return;
    }

    const resolveSafePortalRoute = (raw: string): string | null => {
      const value = raw.trim();
      if (!value) return null;
      if (value.startsWith("/ar-hologram/") || value.startsWith("/direktori/") || value.startsWith("/b/")) {
        return value;
      }
      try {
        const parsed = new URL(value);
        if (parsed.origin === window.location.origin) {
          return parsed.pathname + parsed.search + parsed.hash;
        }
      } catch {
        // Non-URL payload is treated as plain alumni code below
      }
      return null;
    };

    const interval = setInterval(async () => {
      if (cancelled || !videoRef.current || videoRef.current.readyState < 2) return;
      try {
        const codes = await detector.detect(videoRef.current);
        if (codes && codes.length > 0 && codes[0]?.rawValue) {
          const rawValue = String(codes[0].rawValue).trim();
          const portalPath = resolveSafePortalRoute(rawValue);
          setDecodedText(rawValue);
          setScanSuccess(true);
          if (portalPath) {
            setTimeout(() => {
              router.push(portalPath);
            }, 400);
          }
        }
      } catch {
        // Frame decode can throw transiently while autofocus adjusts
      }
    }, 350);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [cameraState, scanSuccess, router]);

  const handlePreviewDemo = () => {
    if (scanSuccess) return;
    setScanSuccess(true);
    setTimeout(() => {
      router.push("/ar-hologram/demo");
    }, 450);
  };

  return (
    <main className="scanner-wrapper" dir={dir}>
      <style>{`
        .scanner-wrapper {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100dvh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: var(--bg-main, #060b14);
          color: var(--text-primary, #f2efe9);
          overflow: hidden;
          padding: 24px 16px;
        }
        .video-container {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
          opacity: 0.42;
        }
        .scanner-scrim {
          position: absolute;
          inset: 0;
          z-index: 2;
          background: radial-gradient(circle at center, rgba(6, 11, 20, 0.25) 0%, rgba(6, 11, 20, 0.86) 85%);
          pointer-events: none;
        }
        .scanner-topbar {
          position: fixed;
          top: max(18px, env(safe-area-inset-top, 18px));
          left: 20px;
          right: 20px;
          z-index: 50;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .scanner-close {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: 10px;
          background: var(--bg-card, #0f141e);
          border: 1px solid var(--border-strong, rgba(212, 175, 55, 0.35));
          color: var(--text-primary, #f2efe9);
          font-size: 0.88rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: border-color 0.2s ease, background-color 0.2s ease;
        }
        .scanner-close:hover { border-color: var(--gold-main, #d4af37); }
        .scanner-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 420px;
          width: 100%;
        }
        .scanner-frame {
          width: clamp(220px, 68vw, 280px);
          height: clamp(220px, 68vw, 280px);
          border: 2px solid var(--border-strong, rgba(212, 175, 55, 0.45));
          background: rgba(15, 20, 30, 0.55);
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.25s ease;
        }
        .scanner-frame.is-success {
          border-color: #4cc38a;
        }
        .scanner-frame::before,
        .scanner-frame::after {
          content: '';
          position: absolute;
          width: 28px;
          height: 28px;
          border-color: var(--gold-main, #d4af37);
          border-style: solid;
        }
        .scanner-frame::before {
          top: -2px;
          left: -2px;
          border-width: 3px 0 0 3px;
          border-top-left-radius: 18px;
        }
        .scanner-frame::after {
          bottom: -2px;
          right: -2px;
          border-width: 0 3px 3px 0;
          border-bottom-right-radius: 18px;
        }
        .scan-line {
          position: absolute;
          left: 8%;
          width: 84%;
          height: 2px;
          background: var(--gold-main, #d4af37);
          z-index: 15;
        }
        .scanner-fallback-msg {
          padding: 18px;
          color: var(--text-secondary, #a1a8b5);
          font-size: 0.85rem;
          line-height: 1.5;
        }
        .scanner-fallback-msg i {
          font-size: 1.6rem;
          color: var(--gold-main, #d4af37);
          margin-bottom: 10px;
          display: block;
        }
        .scanner-heading {
          margin: 24px 0 6px 0;
          color: var(--gold-main, #d4af37);
          font-family: var(--font-playfair, 'Playfair Display', serif);
          font-size: clamp(1.25rem, 3.8vw, 1.55rem);
        }
        .scanner-sub {
          margin: 0 0 20px 0;
          color: var(--text-secondary, #a1a8b5);
          font-size: 0.9rem;
          line-height: 1.5;
        }
        .scanner-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
        }
        .scanner-btn {
          min-height: 44px;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid transparent;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .scanner-btn-primary {
          background: var(--gold-main, #d4af37);
          color: #060b14;
        }
        .scanner-btn-secondary {
          background: var(--bg-card, #0f141e);
          border-color: var(--border-strong, rgba(212, 175, 55, 0.32));
          color: var(--text-primary, #f2efe9);
        }
        .scanner-btn:hover { opacity: 0.92; transform: translateY(-1px); }
        .scanner-close:focus-visible,
        .scanner-btn:focus-visible {
          outline: 2px solid var(--focus-ring, #d4af37);
          outline-offset: 2px;
        }

        :root[data-theme="light"] .scanner-wrapper { background: #f6f5f1; color: #18181b; }
        :root[data-theme="light"] .scanner-scrim {
          background: radial-gradient(circle at center, rgba(246, 245, 241, 0.4) 0%, rgba(246, 245, 241, 0.92) 85%);
        }
        :root[data-theme="light"] .scanner-close { background: #ffffff; border-color: rgba(124, 82, 10, 0.28); color: #18181b; }
        :root[data-theme="light"] .scanner-frame { background: rgba(255, 255, 255, 0.82); border-color: rgba(124, 82, 10, 0.38); }
        :root[data-theme="light"] .scanner-frame.is-success { border-color: #065f46; }
        :root[data-theme="light"] .scanner-frame::before,
        :root[data-theme="light"] .scanner-frame::after { border-color: #7c520a; }
        :root[data-theme="light"] .scan-line { background: #7c520a; }
        :root[data-theme="light"] .scanner-heading { color: #7c520a; }
        :root[data-theme="light"] .scanner-sub,
        :root[data-theme="light"] .scanner-fallback-msg { color: #52525b; }
        :root[data-theme="light"] .scanner-fallback-msg i { color: #7c520a; }
        :root[data-theme="light"] .scanner-btn-primary { background: #7c520a; color: #ffffff; }
        :root[data-theme="light"] .scanner-btn-secondary { background: #ffffff; border-color: rgba(24, 24, 27, 0.16); color: #18181b; }
      `}</style>

      <video ref={videoRef} autoPlay playsInline muted className="video-container"></video>
      <div className="scanner-scrim" aria-hidden="true"></div>

      <div className="scanner-topbar">
        <Link href="/fitur" className="scanner-close">
          <i className={`fa-solid ${isRTL ? "fa-arrow-right" : "fa-arrow-left"}`} aria-hidden="true"></i>
          <span>{locale === "ar" ? "إغلاق الماسح" : locale === "en" ? "Close Scanner" : "Tutup Pemindai"}</span>
        </Link>
      </div>

      <div className="scanner-content">
        <div className={`scanner-frame ${scanSuccess ? "is-success" : ""}`}>
          {cameraState === "active" && <div className="scan-line" aria-hidden="true"></div>}
          {cameraState === "error" && (
            <div className="scanner-fallback-msg">
              <i className="fa-solid fa-camera-slash" aria-hidden="true"></i>
              <span>
                {locale === "ar"
                  ? "الكاميرا غير متاحة أو تم رفض الإذن."
                  : locale === "en"
                  ? "Camera is unavailable or permission was denied."
                  : "Kamera belum diizinkan atau tidak tersedia di perangkat ini."}
              </span>
            </div>
          )}
        </div>

        <h1 className="scanner-heading">
          {scanSuccess
            ? locale === "ar"
              ? "تم فتح المعاينة..."
              : locale === "en"
              ? "Opening preview..."
              : "Membuka pratinjau kartu..."
            : cameraState === "active"
            ? locale === "ar"
              ? "جاهز لمسح رمز QR"
              : locale === "en"
              ? "Ready to Scan QR Code"
              : "Pindai Kode QR Alumni"
            : cameraState === "error"
            ? locale === "ar"
              ? "تعذر الوصول إلى الكاميرا"
              : locale === "en"
              ? "Camera Access Needed"
              : "Akses Kamera Diperlukan"
            : locale === "ar"
            ? "جارٍ تشغيل الكاميرا..."
            : locale === "en"
            ? "Starting camera..."
            : "Membuka kamera..."}
        </h1>

        <p className="scanner-sub">
          {decodedText
            ? decodedText
            : locale === "ar"
            ? "وجّه الكاميرا نحو رمز QR في بطاقة الهوية أو دليل الخريجين."
            : locale === "en"
            ? "Point your camera at an alumni ID QR code or open a sample card preview below."
            : "Arahkan kamera ke kode QR pada KTA Digital atau profil alumni di direktori."}
        </p>

        <div className="scanner-actions">
          {decodedText && scanSuccess && (
            <button
              type="button"
              className="scanner-btn scanner-btn-secondary"
              onClick={() => {
                setDecodedText(null);
                setScanSuccess(false);
              }}
            >
              <i className="fa-solid fa-rotate-right" aria-hidden="true"></i>
              <span>{locale === "ar" ? "مسح رمز آخر" : locale === "en" ? "Scan Another" : "Pindai Ulang"}</span>
            </button>
          )}
          {cameraState === "error" && (
            <button type="button" className="scanner-btn scanner-btn-secondary" onClick={startCamera}>
              <i className="fa-solid fa-rotate-right" aria-hidden="true"></i>
              <span>{locale === "ar" ? "إعادة المحاولة" : locale === "en" ? "Retry Camera" : "Coba Aktifkan Kamera"}</span>
            </button>
          )}
          <button type="button" className="scanner-btn scanner-btn-primary" onClick={handlePreviewDemo} disabled={scanSuccess}>
            <i className="fa-solid fa-id-card" aria-hidden="true"></i>
            <span>{locale === "ar" ? "معاينة بطاقة نموذجية" : locale === "en" ? "View Sample Card" : "Lihat Contoh Kartu 3D"}</span>
          </button>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { sendTelemetryAlert } from "@/lib/sentinel/clientWatcher";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { locale } = useLanguage();
  useEffect(() => {
    console.error("Global System Error:", error);
    const msg = String(error?.message || error?.name || "");
    if (msg.includes("Failed to load chunk") || msg.includes("ChunkLoadError") || msg.includes("Loading chunk")) {
      const last = sessionStorage.getItem("chunk_reload_retry");
      const now = Date.now();
      if (!last || now - Number(last) > 10000) {
        sessionStorage.setItem("chunk_reload_retry", String(now));
        window.location.reload();
      }
    } else {
      sendTelemetryAlert({
        category: "react_error_boundary",
        message: `React Page Crash: ${error?.message || "Render exception"}`,
        detail: error?.digest ? `Digest ID: ${error.digest}` : undefined,
        stack: error?.stack,
      });
    }
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px 20px",
        textAlign: "center",
        position: "relative",
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: "var(--bg-card, #0f141e)",
          border: "1px solid var(--border-strong, rgba(220, 38, 38, 0.35))",
          borderRadius: "20px",
          padding: "44px 32px",
          maxWidth: "520px",
          width: "100%",
          boxShadow: "var(--glass-shadow, 0 20px 50px rgba(0, 0, 0, 0.45))",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "18px",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "16px",
            background: "rgba(220, 38, 38, 0.12)",
            border: "1px solid rgba(220, 38, 38, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#dc2626",
            fontSize: "1.65rem",
          }}
          aria-hidden="true"
        >
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>

        <h1
          style={{
            fontSize: "1.45rem",
            color: "var(--text-primary, #f8fafc)",
            fontWeight: 700,
            margin: 0,
            fontFamily: "var(--font-playfair, 'Playfair Display', serif)",
          }}
        >
          {locale === "ar" ? "حدث خطأ في النظام" : locale === "en" ? "System Encountered an Issue" : "Sistem Menemui Kendala"}
        </h1>

        <p
          style={{
            color: "var(--text-secondary, #94a3b8)",
            fontSize: "0.9rem",
            lineHeight: 1.6,
            margin: 0,
            maxWidth: "400px",
          }}
        >
          {error.message && !error.message.includes("digest")
            ? error.message
            : locale === "ar"
            ? "حدث خلل مؤقت في وحدة التطبيق. يرجى إعادة التحميل أو العودة إلى الصفحة الرئيسية."
            : locale === "en"
            ? "A temporary disruption occurred in the application module. Please reload or return to the main home page."
            : "Terjadi gangguan sementara pada modul aplikasi. Silakan muat ulang atau kembali ke beranda utama."}
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: "12px",
            width: "100%",
          }}
        >
          <button
            type="button"
            onClick={() => reset()}
            style={{
              minHeight: "44px",
              display: "inline-flex",
              alignItems: "center",
              padding: "10px 22px",
              borderRadius: "12px",
              border: "1px solid rgba(220, 38, 38, 0.4)",
              background: "rgba(220, 38, 38, 0.14)",
              color: "#dc2626",
              fontSize: "0.88rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <i className="fa-solid fa-rotate-right" aria-hidden="true" style={{ marginInlineEnd: "8px" }}></i>
            {locale === "ar" ? "إعادة تحميل الوحدة" : locale === "en" ? "Reload Module" : "Muat Ulang Modul"}
          </button>

          <Link
            href="/beranda"
            style={{
              minHeight: "44px",
              display: "inline-flex",
              alignItems: "center",
              padding: "10px 24px",
              borderRadius: "12px",
              border: "1px solid var(--gold-main, #d4af37)",
              background: "var(--gold-main, #d4af37)",
              color: "#060b14",
              fontSize: "0.88rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <i className="fa-solid fa-landmark" aria-hidden="true" style={{ marginInlineEnd: "8px" }}></i>
            {locale === "ar" ? "الصفحة الرئيسية" : locale === "en" ? "Home Page" : "Beranda Utama"}
          </Link>
        </div>
      </div>
    </div>
  );
}

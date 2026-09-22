"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";

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
    }
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
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
          background: "rgba(18, 10, 12, 0.8)",
          border: "1px solid rgba(255, 51, 102, 0.3)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "48px 36px",
          maxWidth: "520px",
          width: "100%",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 51, 102, 0.15)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "18px",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "rgba(255, 51, 102, 0.12)",
            border: "1px solid rgba(255, 51, 102, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ff3366",
            fontSize: "1.8rem",
          }}
        >
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>

        <h2
          style={{
            fontSize: "1.4rem",
            color: "#ffffff",
            fontWeight: 700,
            margin: 0,
            fontFamily: "'Playfair Display', serif",
          }}
        >
          {locale === "ar" ? "حدث خطأ في النظام" : locale === "en" ? "System Encountered an Issue" : "Sistem Menemui Kendala"}
        </h2>

        <p
          style={{
            color: "#8b9ba8",
            fontSize: "0.88rem",
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
            onClick={() => reset()}
            style={{
              padding: "12px 24px",
              borderRadius: "30px",
              border: "1px solid rgba(255, 51, 102, 0.4)",
              background: "rgba(255, 51, 102, 0.15)",
              color: "#ff3366",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            <i className="fa-solid fa-rotate-right" style={{ marginInlineEnd: "8px" }}></i>
            {locale === "ar" ? "إعادة تحميل الوحدة" : locale === "en" ? "Reload Module" : "Muat Ulang Modul"}
          </button>

          <Link
            href="/beranda"
            style={{
              padding: "12px 28px",
              borderRadius: "30px",
              border: "1px solid rgba(212, 175, 55, 0.4)",
              background: "rgba(212, 175, 55, 0.1)",
              color: "#d4af37",
              fontSize: "0.85rem",
              fontWeight: 700,
              textDecoration: "none",
              transition: "all 0.3s ease",
            }}
          >
            <i className="fa-solid fa-landmark" style={{ marginInlineEnd: "8px" }}></i>
            {locale === "ar" ? "الصفحة الرئيسية" : locale === "en" ? "Home Page" : "Beranda Utama"}
          </Link>
        </div>
      </div>
    </div>
  );
}

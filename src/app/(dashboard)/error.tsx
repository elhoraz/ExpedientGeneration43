"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { sendTelemetryAlert } from "@/lib/sentinel/clientWatcher";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { locale } = useLanguage();

  useEffect(() => {
    console.error("Dashboard Boundary Error:", error);
    sendTelemetryAlert({
      category: "react_error_boundary",
      message: `Dashboard Error: ${error?.message || "Render exception"}`,
      detail: error?.digest ? `Digest ID: ${error.digest}` : undefined,
      stack: error?.stack,
    });
  }, [error]);

  return (
    <div style={{
      width: "100%",
      minHeight: "calc(100dvh - 80px)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      background: "var(--bg-main)",
      color: "var(--text-primary)",
      padding: "20px",
      textAlign: "center"
    }}>
      <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" style={{ fontSize: "2.8rem", color: "#dc2626", marginBottom: "20px" }}></i>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", color: "var(--text-primary)", marginBottom: "10px" }}>
        {locale === "ar" ? "حدث خطأ في النظام" : locale === "en" ? "System Error Occurred" : "Terjadi Kesalahan Sistem"}
      </h1>
      <p style={{ color: "var(--text-secondary)", maxWidth: "500px", marginBottom: "30px", fontSize: "0.9rem" }}>
        {error.message || (locale === "ar"
          ? "تعذر عرض المكون أو انقطع الاتصال بقاعدة البيانات. يرجى محاولة إعادة تحميل الصفحة."
          : locale === "en"
          ? "Component could not be rendered or database connection was lost. Please try reloading the page."
          : "Komponen tidak dapat dirender atau koneksi database terputus. Silakan coba muat ulang halaman.")}
      </p>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            minHeight: "44px",
            display: "inline-flex",
            alignItems: "center",
            background: "rgba(220, 38, 38, 0.12)",
            border: "1px solid rgba(220, 38, 38, 0.35)",
            color: "#dc2626",
            padding: "10px 20px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          <i className="fa-solid fa-rotate-right" aria-hidden="true" style={{ marginInlineEnd: "8px" }}></i> {locale === "ar" ? "حاول مرة أخرى" : locale === "en" ? "Try Again" : "Coba Lagi"}
        </button>
        <Link href="/beranda" style={{
            minHeight: "44px",
            display: "inline-flex",
            alignItems: "center",
            background: "var(--gold-main, #d4af37)",
            border: "1px solid var(--gold-main, #d4af37)",
            color: "#060b14",
            padding: "10px 20px",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: 700
          }}>
          <i className="fa-solid fa-house" aria-hidden="true" style={{ marginInlineEnd: "8px" }}></i> {locale === "ar" ? "العودة إلى الصفحة الرئيسية" : locale === "en" ? "Return to Home" : "Kembali ke Beranda"}
        </Link>
      </div>
    </div>
  );
}

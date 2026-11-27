"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function NotFound() {
  const router = useRouter();
  const { locale, t } = useLanguage();

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
          border: "1px solid var(--border-strong, rgba(212, 175, 55, 0.25))",
          borderRadius: "20px",
          padding: "44px 32px",
          maxWidth: "540px",
          width: "100%",
          boxShadow: "var(--glass-shadow, 0 20px 50px rgba(0, 0, 0, 0.45))",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "18px",
        }}
      >
        <Image
          src="/images/logo-utuh.webp"
          width={80}
          height={80}
          alt="Expedient Generation"
          style={{ opacity: 0.92 }}
        />

        <div
          style={{
            display: "inline-block",
            fontSize: "3.75rem",
            fontWeight: 900,
            letterSpacing: "0.06em",
            lineHeight: 1,
            color: "var(--gold-main, #d4af37)",
            fontFamily: "var(--font-playfair, 'Playfair Display', serif)",
            marginTop: "8px",
          }}
        >
          404
        </div>

        <h1
          style={{
            fontSize: "1.4rem",
            color: "var(--text-primary, #f8fafc)",
            fontWeight: 700,
            margin: 0,
            fontFamily: "var(--font-playfair, 'Playfair Display', serif)",
          }}
        >
          {locale === "ar" ? "الأرشيف غير موجود" : locale === "en" ? "Archive Not Found" : "Arsip Tidak Ditemukan"}
        </h1>

        <p
          style={{
            color: "var(--text-secondary, #94a3b8)",
            fontSize: "0.92rem",
            lineHeight: 1.6,
            margin: 0,
            maxWidth: "420px",
          }}
        >
          {locale === "ar"
            ? "الصفحة أو الإحداثيات التي تبحث عنها تقع خارج نطاق رادار إكسبيدينت جينيريشن الرقمي."
            : locale === "en"
            ? "The coordinates or page you are looking for is beyond the reach of the Expedient Generation digital radar."
            : "Koordinat atau halaman yang Anda tuju berada di luar jangkauan radar galeri digital Expedient Generation."}
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
            onClick={() => router.back()}
            style={{
              minHeight: "44px",
              display: "inline-flex",
              alignItems: "center",
              padding: "10px 22px",
              borderRadius: "12px",
              border: "1px solid var(--border-strong, rgba(255, 255, 255, 0.2))",
              background: "transparent",
              color: "var(--text-primary, #f8fafc)",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <i className={`fa-solid ${locale === "ar" ? "fa-arrow-right" : "fa-arrow-left"}`} aria-hidden="true" style={{ marginInlineEnd: "8px" }}></i>
            {t.common.back}
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

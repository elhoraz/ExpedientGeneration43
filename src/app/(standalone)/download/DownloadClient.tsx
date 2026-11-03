"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import ThemeToggle from "@/components/layout/ThemeToggle";
import "./download.css";

export default function DownloadClient() {
  const { t, isRTL: isRtl, dir, locale } = useLanguage();
  const [activeGuideTab, setActiveGuideTab] = useState<"android" | "ios" | "pwa">("android");
  const [activeIosMethod, setActiveIosMethod] = useState<"sideloadly" | "direct">("sideloadly");

  const apkDownloadUrl =
    process.env.NEXT_PUBLIC_APK_DOWNLOAD_URL ||
    "https://github.com/elhoraz/ExpedientGeneration43/releases/download/v1.2.3/Expedient43-v1.2.3.apk";
  const ipaDownloadUrl = process.env.NEXT_PUBLIC_IPA_DOWNLOAD_URL || "/Expedient43.ipa";

  const scrollToGuide = (tab: "android" | "ios" | "pwa") => {
    setActiveGuideTab(tab);
    const element = document.getElementById("installation-guide-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      dir={dir}
      className="download-page-scroll-container"
      style={{
        fontFamily: isRtl
          ? "var(--font-amiri, serif), var(--font-inter, sans-serif)"
          : "var(--font-inter, sans-serif)",
      }}
    >
      <div className="download-main-card">
        {/* Top Bar with Back Button, Theme Toggle & Language Switcher */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.75rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <Link
            href="/"
            className="download-top-link"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            <i className={`fa-solid ${isRtl ? "fa-arrow-right" : "fa-arrow-left"}`} />
            <span>{t.download_center.back_home}</span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <ThemeToggle />
            <LanguageSwitcher variant="pill" />
          </div>
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "14px",
              padding: "12px 24px",
              borderRadius: "50px",
              background: "radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, rgba(3, 5, 4, 0.7) 90%)",
              border: "1px solid rgba(212, 175, 55, 0.4)",
              marginBottom: "1.25rem",
              boxShadow: "0 0 30px rgba(212, 175, 55, 0.2)",
            }}
          >
            <i className="fa-brands fa-android" style={{ fontSize: "28px", color: "#10b981" }} />
            <span style={{ color: "rgba(212, 175, 55, 0.6)", fontSize: "18px" }}>•</span>
            <i className="fa-brands fa-apple" style={{ fontSize: "28px", color: "var(--text-primary)" }} />
          </div>

          <h1
            style={{
              fontFamily: isRtl ? "inherit" : "var(--font-playfair, serif)",
              fontSize: "2.15rem",
              color: "var(--gold-main, #d4af37)",
              margin: "0 0 0.5rem 0",
              letterSpacing: isRtl ? "0" : "0.5px",
            }}
          >
            {t.download_center.title}
          </h1>

          <p
            className="download-card-desc"
            style={{ fontSize: "0.98rem", margin: "0 auto", maxWidth: "600px", lineHeight: 1.6 }}
          >
            {t.download_center.subtitle}
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "14px",
              padding: "6px 16px",
              borderRadius: "999px",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#10b981",
              fontSize: "0.82rem",
              fontWeight: 600,
            }}
          >
            <i className="fa-solid fa-shield-check" /> {t.download_center.apk_badge}
          </div>
        </div>

        {/* 3 Download Cards (Android, iOS, PWA) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1.25rem",
            marginBottom: "2.75rem",
          }}
        >
          {/* Card 1: Android APK (Utama & Rekomendasi) */}
          <div
            className="download-card-android"
            style={{
              borderRadius: "16px",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "12px",
                [isRtl ? "left" : "right"]: "12px",
                background: "rgba(212, 175, 55, 0.2)",
                color: "var(--gold-main, #d4af37)",
                padding: "3px 10px",
                borderRadius: "6px",
                fontSize: "0.72rem",
                fontWeight: 700,
                border: "1px solid rgba(212, 175, 55, 0.3)",
              }}
            >
              {t.download_center.recommended_badge}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "rgba(16, 185, 129, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i className="fa-brands fa-android" style={{ fontSize: "1.5rem", color: "#10b981" }} />
                </div>
                <div>
                  <h2 className="download-card-title" style={{ fontSize: "1.15rem", margin: 0 }}>
                    {t.download_center.tab_apk}
                  </h2>
                  <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 600 }}>
                    Smartphone Android
                  </span>
                </div>
              </div>

              <p className="download-card-desc" style={{ fontSize: "0.84rem", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
                {t.download_center.apk_desc}
              </p>

              <ul
                className="download-card-list"
                style={{
                  fontSize: "0.8rem",
                  paddingInlineStart: "1.2rem",
                  margin: "0 0 1.25rem 0",
                  lineHeight: 1.6,
                }}
              >
                <li>
                  <code className="download-code-tag-gold">Expedient43-v1.2.3.apk</code> (v1.2.3 Build 5)
                </li>
                <li>{t.download_center.apk_size_label}</li>
                <li>{t.download_center.apk_support_label}</li>
                <li>Alarm Adzan Offline & Push Notification</li>
              </ul>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <a
                href={apkDownloadUrl}
                download="Expedient43-v1.2.3.apk"
                id="btnDownloadApk"
                onClick={(e) => {
                  if (typeof window !== "undefined" && (window as any).ExpedientNativeBridge?.installApk) {
                    e.preventDefault();
                    (window as any).ExpedientNativeBridge.installApk(apkDownloadUrl);
                    return;
                  }
                  window.location.href = apkDownloadUrl;
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "0.85rem 1rem",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #d4af37, #aa820a)",
                  color: "#060b14",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  textDecoration: "none",
                  boxShadow: "0 8px 20px rgba(212, 175, 55, 0.3)",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
              >
                <i className="fa-solid fa-download" /> {t.download_center.apk_btn_download}
              </a>

              <button
                type="button"
                className="download-btn-ghost-apk"
                onClick={() => scrollToGuide("android")}
                style={{
                  padding: "0.6rem 1rem",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                }}
              >
                <i className="fa-solid fa-circle-info" />{" "}
                {locale === "ar" ? "دليل تثبيت APK" : locale === "en" ? "APK Install Guide" : "Lihat Cara Pasang APK"}
              </button>
            </div>
          </div>

          {/* Card 2: Apple iOS (IPA) */}
          <div
            className="download-card-ios"
            style={{
              borderRadius: "16px",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "12px",
                [isRtl ? "left" : "right"]: "12px",
                background: "rgba(14, 165, 233, 0.2)",
                color: "#0284c7",
                padding: "3px 10px",
                borderRadius: "6px",
                fontSize: "0.72rem",
                fontWeight: 700,
                border: "1px solid rgba(56, 189, 248, 0.3)",
              }}
            >
              {t.download_center.ios_badge}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "rgba(2, 132, 199, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i className="fa-brands fa-apple" style={{ fontSize: "1.6rem", color: "var(--text-primary)" }} />
                </div>
                <div>
                  <h2 className="download-card-title" style={{ fontSize: "1.15rem", margin: 0 }}>
                    {t.download_center.tab_ios}
                  </h2>
                  <span style={{ fontSize: "0.75rem", color: "#0284c7", fontWeight: 600 }}>iPhone & iPad Native</span>
                </div>
              </div>

              <p className="download-card-desc" style={{ fontSize: "0.84rem", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
                {t.download_center.ios_desc}
              </p>

              <ul
                className="download-card-list"
                style={{
                  fontSize: "0.8rem",
                  paddingInlineStart: "1.2rem",
                  margin: "0 0 1.25rem 0",
                  lineHeight: 1.6,
                }}
              >
                <li>
                  <code className="download-code-tag">Expedient43.ipa</code> (v1.2.3 Native)
                </li>
                <li>{t.download_center.ios_size_label}</li>
                <li>{t.download_center.ios_support_label}</li>
                <li>APNs Push Notification & Adzan</li>
              </ul>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <a
                href={ipaDownloadUrl}
                download="Expedient43.ipa"
                id="btnDownloadIpa"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "0.85rem 1rem",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #0284c7, #2563eb)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  textDecoration: "none",
                  boxShadow: "0 8px 20px rgba(14, 165, 233, 0.3)",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
              >
                <i className="fa-solid fa-download" /> {t.download_center.ios_btn_download}
              </a>

              <button
                type="button"
                className="download-btn-ghost-ios"
                onClick={() => scrollToGuide("ios")}
                style={{
                  padding: "0.6rem 1rem",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                }}
              >
                <i className="fa-solid fa-circle-info" />{" "}
                {locale === "ar"
                  ? "كيفية التثبيت على الآيفون"
                  : locale === "en"
                  ? "How to Install on iPhone"
                  : "Lihat Cara Pasang di iPhone"}
              </button>
            </div>
          </div>

          {/* Card 3: PWA Web App */}
          <div
            className="download-card-pwa"
            style={{
              borderRadius: "16px",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "rgba(100, 116, 139, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i className="fa-solid fa-globe" style={{ fontSize: "1.4rem", color: "var(--text-primary)" }} />
                </div>
                <div>
                  <h2 className="download-card-title" style={{ fontSize: "1.15rem", margin: 0 }}>
                    {t.download_center.tab_pwa}
                  </h2>
                  <span className="download-card-desc" style={{ fontSize: "0.75rem" }}>
                    Browser Mobile
                  </span>
                </div>
              </div>

              <p className="download-card-desc" style={{ fontSize: "0.84rem", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
                {t.download_center.pwa_desc}
              </p>

              <ul
                className="download-card-list"
                style={{
                  fontSize: "0.8rem",
                  paddingInlineStart: "1.2rem",
                  margin: "0 0 1.25rem 0",
                  lineHeight: 1.6,
                }}
              >
                <li>{t.download_center.pwa_feature_1}</li>
                <li>{t.download_center.pwa_feature_2}</li>
                <li>{t.download_center.pwa_feature_3}</li>
                <li>Ukuran: 0 MB (Instan)</li>
              </ul>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Link
                href="/login"
                className="download-btn-pwa-primary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "0.85rem 1rem",
                  borderRadius: "10px",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                }}
              >
                <i className="fa-solid fa-mobile-screen" /> {t.download_center.pwa_btn_open}
              </Link>

              <button
                type="button"
                className="download-btn-ghost-pwa"
                onClick={() => scrollToGuide("pwa")}
                style={{
                  padding: "0.6rem 1rem",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                }}
              >
                <i className="fa-solid fa-circle-info" />{" "}
                {locale === "ar" ? "دليل PWA" : locale === "en" ? "PWA Guide" : "Cara Pasang PWA"}
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Installation Guide Section */}
        <div id="installation-guide-section" className="download-guide-container">
          {/* Guide Title & Segmented Control Tabs */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "1.75rem",
              borderBottom: "1px solid var(--glass-border, rgba(255, 255, 255, 0.08))",
              paddingBottom: "1.25rem",
            }}
          >
            <h2
              style={{
                fontSize: "1.25rem",
                color: "var(--gold-main, #d4af37)",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <i className="fa-solid fa-list-check" />
              <span>
                {activeGuideTab === "ios"
                  ? t.download_center.ios_install_guide_title
                  : activeGuideTab === "android"
                  ? t.download_center.apk_install_guide_title
                  : t.download_center.pwa_guide_title}
              </span>
            </h2>

            {/* Tab Buttons */}
            <div
              style={{
                display: "flex",
                background: "rgba(100, 116, 139, 0.12)",
                padding: "4px",
                borderRadius: "12px",
                gap: "4px",
              }}
            >
              <button
                type="button"
                onClick={() => setActiveGuideTab("android")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: activeGuideTab === "android" ? 700 : 500,
                  background: activeGuideTab === "android" ? "#d4af37" : "transparent",
                  color: activeGuideTab === "android" ? "#060b14" : "var(--text-secondary)",
                  transition: "all 0.2s ease",
                }}
              >
                <i className="fa-brands fa-android" />
                <span>Android (.APK)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGuideTab("ios")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: activeGuideTab === "ios" ? 700 : 500,
                  background: activeGuideTab === "ios" ? "#0284c7" : "transparent",
                  color: activeGuideTab === "ios" ? "#ffffff" : "var(--text-secondary)",
                  transition: "all 0.2s ease",
                }}
              >
                <i className="fa-brands fa-apple" />
                <span>iPhone (.IPA)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGuideTab("pwa")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: activeGuideTab === "pwa" ? 700 : 500,
                  background: activeGuideTab === "pwa" ? "rgba(100, 116, 139, 0.3)" : "transparent",
                  color: activeGuideTab === "pwa" ? "var(--text-primary)" : "var(--text-secondary)",
                  transition: "all 0.2s ease",
                }}
              >
                <i className="fa-solid fa-globe" />
                <span>PWA</span>
              </button>
            </div>
          </div>

          {/* TAB CONTENT: ANDROID APK GUIDE */}
          {activeGuideTab === "android" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Step 1 */}
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "#d4af37",
                    color: "#060b14",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    flexShrink: 0,
                  }}
                >
                  1
                </div>
                <div>
                  <h3 className="download-step-title" style={{ fontSize: "0.95rem", margin: "0 0 4px 0" }}>
                    {t.download_center.apk_step1_title}
                  </h3>
                  <p className="download-step-desc" style={{ fontSize: "0.85rem", margin: 0, lineHeight: 1.5 }}>
                    {t.download_center.apk_step1_desc}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "#d4af37",
                    color: "#060b14",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    flexShrink: 0,
                  }}
                >
                  2
                </div>
                <div>
                  <h3 className="download-step-title" style={{ fontSize: "0.95rem", margin: "0 0 4px 0" }}>
                    {t.download_center.apk_step2_title}
                  </h3>
                  <p className="download-step-desc" style={{ fontSize: "0.85rem", margin: 0, lineHeight: 1.5 }}>
                    {t.download_center.apk_step2_desc}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "#d4af37",
                    color: "#060b14",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    flexShrink: 0,
                  }}
                >
                  3
                </div>
                <div>
                  <h3 className="download-step-title" style={{ fontSize: "0.95rem", margin: "0 0 4px 0" }}>
                    {t.download_center.apk_step3_title}
                  </h3>
                  <p className="download-step-desc" style={{ fontSize: "0.85rem", margin: 0, lineHeight: 1.5 }}>
                    {t.download_center.apk_step3_desc}
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "#d4af37",
                    color: "#060b14",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    flexShrink: 0,
                  }}
                >
                  4
                </div>
                <div>
                  <h3 className="download-step-title" style={{ fontSize: "0.95rem", margin: "0 0 4px 0" }}>
                    {t.download_center.apk_step4_title}
                  </h3>
                  <p className="download-step-desc" style={{ fontSize: "0.85rem", margin: 0, lineHeight: 1.5 }}>
                    {t.download_center.apk_step4_desc}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: iOS IPA GUIDE */}
          {activeGuideTab === "ios" && (
            <div>
              {/* Method Switcher Banner */}
              <div className="download-guide-banner-ios" style={{ borderRadius: "14px", padding: "1.25rem", marginBottom: "1.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <i className="fa-solid fa-circle-question" style={{ color: "#0284c7", fontSize: "1.2rem" }} />
                  <strong style={{ color: "#0284c7", fontSize: "0.95rem" }}>
                    {locale === "ar"
                      ? "لماذا نستخدم طريقة التثبيت الذاتي (.IPA) على الآيفون؟"
                      : locale === "en"
                      ? "Why do we use standalone (.IPA) sideloading on iPhone?"
                      : "Mengapa menggunakan instalasi mandiri (.IPA) di iPhone?"}
                  </strong>
                </div>
                <p className="download-step-desc" style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.6 }}>
                  {locale === "ar"
                    ? "تطبيق إكسبيدينت ٤٣ هو تطبيق خاص وحصري للدفعة ولا يُنشر في متجر App Store العام. التثبيت عبر Sideloadly مجاني وآمن ١٠٠٪ دون جلبريك ويمنحك جميع مزايا التطبيق الأصلي كالإشعارات الفورية ومنبه الأذان."
                    : locale === "en"
                    ? "The Expedient 43 app is a private alumni application and is not published on the public App Store. Sideloading via Sideloadly is 100% free, official, safe without jailbreak, and delivers full native push notifications & offline adzan alarms."
                    : "Aplikasi Expedient 43 merupakan aplikasi internal alumni tanpa dipublikasikan ke App Store publik Apple. Pemasangan via Sideloadly 100% aman, gratis, tanpa jailbreak, dan memberikan fitur aplikasi native penuh seperti Push Notification APNs & Alarm Adzan."}
                </p>

                {/* Sub-method toggle buttons */}
                <div style={{ display: "flex", gap: "10px", marginTop: "14px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setActiveIosMethod("sideloadly")}
                    style={{
                      background: activeIosMethod === "sideloadly" ? "#0284c7" : "rgba(100, 116, 139, 0.2)",
                      color: activeIosMethod === "sideloadly" ? "#ffffff" : "var(--text-primary)",
                      border: "none",
                      padding: "6px 14px",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <i className="fa-solid fa-laptop" /> {t.download_center.ios_method1_title}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveIosMethod("direct")}
                    style={{
                      background: activeIosMethod === "direct" ? "#0284c7" : "rgba(100, 116, 139, 0.2)",
                      color: activeIosMethod === "direct" ? "#ffffff" : "var(--text-primary)",
                      border: "none",
                      padding: "6px 14px",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <i className="fa-solid fa-mobile-screen-button" /> {t.download_center.ios_method2_title}
                  </button>
                </div>
              </div>

              {/* Steps for Method 1: Sideloadly */}
              {activeIosMethod === "sideloadly" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "#0284c7",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "1rem",
                        flexShrink: 0,
                      }}
                    >
                      1
                    </div>
                    <div>
                      <h3 className="download-step-title" style={{ fontSize: "1rem", margin: "0 0 6px 0" }}>
                        {t.download_center.ios_step1_title}
                      </h3>
                      <p className="download-step-desc" style={{ fontSize: "0.88rem", margin: "0 0 8px 0", lineHeight: 1.5 }}>
                        {t.download_center.ios_step1_desc}
                      </p>
                      <a
                        href="https://sideloadly.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "0.82rem",
                          color: "#0284c7",
                          textDecoration: "underline",
                          fontWeight: 600,
                        }}
                      >
                        <i className="fa-solid fa-arrow-up-right-from-square" /> Kunjungi Situs Resmi Sideloadly (sideloadly.io)
                      </a>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "#0284c7",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "1rem",
                        flexShrink: 0,
                      }}
                    >
                      2
                    </div>
                    <div>
                      <h3 className="download-step-title" style={{ fontSize: "1rem", margin: "0 0 6px 0" }}>
                        {t.download_center.ios_step2_title}
                      </h3>
                      <p className="download-step-desc" style={{ fontSize: "0.88rem", margin: 0, lineHeight: 1.5 }}>
                        {t.download_center.ios_step2_desc}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "#0284c7",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "1rem",
                        flexShrink: 0,
                      }}
                    >
                      3
                    </div>
                    <div>
                      <h3 className="download-step-title" style={{ fontSize: "1rem", margin: "0 0 6px 0" }}>
                        {t.download_center.ios_step3_title}
                      </h3>
                      <p className="download-step-desc" style={{ fontSize: "0.88rem", margin: 0, lineHeight: 1.5 }}>
                        {t.download_center.ios_step3_desc}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "#0284c7",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "1rem",
                        flexShrink: 0,
                      }}
                    >
                      4
                    </div>
                    <div>
                      <h3 className="download-step-title" style={{ fontSize: "1rem", margin: "0 0 6px 0" }}>
                        {t.download_center.ios_step4_title}
                      </h3>
                      <p className="download-step-desc" style={{ fontSize: "0.88rem", margin: 0, lineHeight: 1.5 }}>
                        {t.download_center.ios_step4_desc}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Steps for Method 2: Direct Scarlet / TrollStore */}
              {activeIosMethod === "direct" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "#0284c7",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "1rem",
                        flexShrink: 0,
                      }}
                    >
                      1
                    </div>
                    <div>
                      <h3 className="download-step-title" style={{ fontSize: "1rem", margin: "0 0 6px 0" }}>
                        Unduh File Expedient43.ipa ke iPhone
                      </h3>
                      <p className="download-step-desc" style={{ fontSize: "0.88rem", margin: 0, lineHeight: 1.5 }}>
                        Klik tombol biru <strong>Unduh Expedient43.ipa</strong> di atas menggunakan browser Safari. Simpan file ke aplikasi <em>Files (File Saya)</em> di iPhone Anda.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "#0284c7",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "1rem",
                        flexShrink: 0,
                      }}
                    >
                      2
                    </div>
                    <div>
                      <h3 className="download-step-title" style={{ fontSize: "1rem", margin: "0 0 6px 0" }}>
                        Buka Aplikasi Scarlet / TrollStore
                      </h3>
                      <p className="download-step-desc" style={{ fontSize: "0.88rem", margin: 0, lineHeight: 1.5 }}>
                        Buka aplikasi Scarlet (usescarlet.com) atau TrollStore yang terpasang di iPhone Anda.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "#0284c7",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "1rem",
                        flexShrink: 0,
                      }}
                    >
                      3
                    </div>
                    <div>
                      <h3 className="download-step-title" style={{ fontSize: "1rem", margin: "0 0 6px 0" }}>
                        Import File IPA & Pasang Otomatis
                      </h3>
                      <p className="download-step-desc" style={{ fontSize: "0.88rem", margin: 0, lineHeight: 1.5 }}>
                        Ketuk tombol Sideload (ikon panah atas di kanan atas aplikasi), lalu pilih file <code className="download-code-tag">Expedient43.ipa</code>. Scarlet akan menandatangani dan memasang aplikasi secara otomatis ke layar utama iPhone Anda!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: PWA WEB APP GUIDE */}
          {activeGuideTab === "pwa" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "rgba(100, 116, 139, 0.2)",
                    color: "var(--text-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    flexShrink: 0,
                  }}
                >
                  <i className="fa-brands fa-apple" />
                </div>
                <div>
                  <h3 className="download-step-title" style={{ fontSize: "0.95rem", margin: "0 0 4px 0" }}>
                    Di Browser Safari (iPhone / iPad)
                  </h3>
                  <p className="download-step-desc" style={{ fontSize: "0.85rem", margin: 0, lineHeight: 1.5 }}>
                    {t.download_center.pwa_ios_desc}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "rgba(100, 116, 139, 0.2)",
                    color: "var(--text-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    flexShrink: 0,
                  }}
                >
                  <i className="fa-brands fa-chrome" />
                </div>
                <div>
                  <h3 className="download-step-title" style={{ fontSize: "0.95rem", margin: "0 0 4px 0" }}>
                    Di Browser Google Chrome (Android)
                  </h3>
                  <p className="download-step-desc" style={{ fontSize: "0.85rem", margin: 0, lineHeight: 1.5 }}>
                    {t.download_center.pwa_android_desc}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FAQ Section */}
        <div className="download-faq-container">
          <h3
            style={{
              fontSize: "1rem",
              color: "var(--gold-main, #d4af37)",
              margin: "0 0 1rem 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <i className="fa-solid fa-circle-question" /> {t.download_center.faq_title}
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <strong className="download-faq-q" style={{ fontSize: "0.88rem" }}>
                Q: {t.download_center.faq_q_ios}
              </strong>
              <p className="download-faq-a" style={{ fontSize: "0.84rem", lineHeight: 1.5, margin: "4px 0 0 0" }}>
                A: {t.download_center.faq_a_ios}
              </p>
            </div>
            <div>
              <strong className="download-faq-q" style={{ fontSize: "0.88rem" }}>
                Q: {t.download_center.faq_q1}
              </strong>
              <p className="download-faq-a" style={{ fontSize: "0.84rem", lineHeight: 1.5, margin: "4px 0 0 0" }}>
                A: {t.download_center.faq_a1}
              </p>
            </div>
            <div>
              <strong className="download-faq-q" style={{ fontSize: "0.88rem" }}>
                Q: {t.download_center.faq_q2}
              </strong>
              <p className="download-faq-a" style={{ fontSize: "0.84rem", lineHeight: 1.5, margin: "4px 0 0 0" }}>
                A: {t.download_center.faq_a2}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            borderTop: "1px solid var(--glass-border, rgba(255, 255, 255, 0.1))",
            paddingTop: "1.5rem",
          }}
        >
          <Link
            href="/"
            className="download-top-link"
            style={{
              textDecoration: "none",
              fontSize: "0.88rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <i className={`fa-solid ${isRtl ? "fa-arrow-right" : "fa-arrow-left"}`} /> {t.download_center.back_home}
          </Link>

          <div style={{ display: "flex", gap: "1rem" }}>
            <Link
              href="/login"
              style={{
                color: "var(--gold-main, #d4af37)",
                textDecoration: "none",
                fontSize: "0.88rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {t.download_center.btn_login} <i className={`fa-solid ${isRtl ? "fa-arrow-left" : "fa-arrow-right"}`} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

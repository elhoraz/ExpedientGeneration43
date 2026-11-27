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
  const [activeIosMethod, setActiveIosMethod] = useState<"safari" | "ipa">("safari");

  const apkDownloadUrl =
    process.env.NEXT_PUBLIC_APK_DOWNLOAD_URL ||
    "https://github.com/elhoraz/ExpedientGeneration43/releases/download/v1.2.3/Expedient43-v1.2.3.apk";
  const ipaDownloadUrl = (process.env.NEXT_PUBLIC_IPA_DOWNLOAD_URL || "").trim();
  const hasConfiguredIpa = Boolean(ipaDownloadUrl);

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
            className="download-platform-emblem"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "14px",
              padding: "10px 22px",
              borderRadius: "50px",
              marginBottom: "1.25rem",
            }}
          >
            <i className="fa-brands fa-android" style={{ fontSize: "26px", color: "#10b981" }} aria-hidden="true" />
            <span style={{ color: "var(--gold-main, #d4af37)", opacity: 0.7, fontSize: "18px" }} aria-hidden="true">•</span>
            <i className="fa-brands fa-apple" style={{ fontSize: "26px", color: "var(--text-primary)" }} aria-hidden="true" />
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

          <div className="download-status-pill">
            <i className="fa-solid fa-shield-halved" aria-hidden="true" /> {t.download_center.apk_badge}
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
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
              <span className="download-android-badge">
                {t.download_center.recommended_badge}
              </span>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem" }}>
                <div className="download-android-icon-box">
                  <i className="fa-brands fa-android" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="download-card-title" style={{ fontSize: "1.15rem", margin: 0 }}>
                    {t.download_center.tab_apk}
                  </h2>
                  <span className="download-android-sub">
                    {locale === "ar" ? "أجهزة أندرويد" : locale === "en" ? "Android Smartphones" : "Smartphone Android"}
                  </span>
                </div>
              </div>

              <p className="download-card-desc" style={{ fontSize: "0.85rem", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
                {t.download_center.apk_desc}
              </p>

              <ul
                className="download-card-list"
                style={{
                  fontSize: "0.82rem",
                  paddingInlineStart: "1.2rem",
                  margin: "0 0 1.25rem 0",
                  lineHeight: 1.6,
                }}
              >
                <li>
                  <code className="download-code-tag-gold">Expedient43-v1.2.3.apk</code> (v1.2.3)
                </li>
                <li>{t.download_center.apk_size_label}</li>
                <li>{t.download_center.apk_support_label}</li>
                <li>
                  {locale === "ar"
                    ? "منبه الأذان دون اتصال والإشعارات"
                    : locale === "en"
                    ? "Offline Adzan Alarm & Push Notifications"
                    : "Alarm Adzan Offline & Notifikasi Push"}
                </li>
              </ul>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <a
                href={apkDownloadUrl}
                download="Expedient43-v1.2.3.apk"
                id="btnDownloadApk"
                className="download-action-primary"
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
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #d4af37, #aa820a)",
                  color: "#060b14",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  textDecoration: "none",
                  boxShadow: "0 8px 20px rgba(212, 175, 55, 0.25)",
                  cursor: "pointer",
                }}
              >
                <i className="fa-solid fa-download" aria-hidden="true" /> {t.download_center.apk_btn_download}
              </a>

              <button
                type="button"
                className="download-btn-ghost-apk"
                onClick={() => scrollToGuide("android")}
                style={{
                  padding: "0.65rem 1rem",
                  borderRadius: "10px",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <i className="fa-solid fa-circle-info" aria-hidden="true" />{" "}
                {locale === "ar" ? "دليل تثبيت APK" : locale === "en" ? "APK Install Guide" : "Lihat Cara Pasang APK"}
              </button>
            </div>
          </div>

          {/* Card 2: Apple iOS / Safari */}
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
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
              <div className="download-ios-badge">
                {t.download_center.ios_badge}
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "rgba(3, 105, 161, 0.14)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i className="fa-brands fa-apple" style={{ fontSize: "1.6rem", color: "var(--text-primary)" }} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="download-card-title" style={{ fontSize: "1.15rem", margin: 0 }}>
                    {t.download_center.tab_ios}
                  </h2>
                  <span className="download-ios-sub" style={{ fontSize: "0.78rem", fontWeight: 600 }}>
                    iPhone & iPad (Safari / iOS)
                  </span>
                </div>
              </div>

              <p className="download-card-desc" style={{ fontSize: "0.85rem", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
                {t.download_center.ios_desc}
              </p>

              <ul
                className="download-card-list"
                style={{
                  fontSize: "0.82rem",
                  paddingInlineStart: "1.2rem",
                  margin: "0 0 1.25rem 0",
                  lineHeight: 1.6,
                }}
              >
                <li>
                  <code className="download-code-tag">
                    {hasConfiguredIpa ? "Expedient43.ipa" : "Safari Web App (PWA)"}
                  </code>
                </li>
                <li>{t.download_center.ios_size_label}</li>
                <li>{t.download_center.ios_support_label}</li>
                <li>
                  {locale === "ar"
                    ? "تثبيت فوري بملء الشاشة عبر سفاري"
                    : locale === "en"
                    ? "Full-screen Safari Home Screen shortcut"
                    : "Tampilan layar penuh langsung dari Safari"}
                </li>
              </ul>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {hasConfiguredIpa ? (
                <a
                  href={ipaDownloadUrl}
                  download="Expedient43.ipa"
                  id="btnDownloadIpa"
                  className="download-action-primary"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    background: "#0369a1",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    textDecoration: "none",
                    boxShadow: "0 8px 20px rgba(3, 105, 161, 0.25)",
                    cursor: "pointer",
                  }}
                >
                  <i className="fa-solid fa-download" aria-hidden="true" /> {t.download_center.ios_btn_download}
                </a>
              ) : (
                <button
                  type="button"
                  id="btnDownloadIpa"
                  className="download-action-primary"
                  onClick={() => scrollToGuide("ios")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    border: "none",
                    background: "#0369a1",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    boxShadow: "0 8px 20px rgba(3, 105, 161, 0.25)",
                    cursor: "pointer",
                  }}
                >
                  <i className="fa-brands fa-safari" aria-hidden="true" /> {t.download_center.ios_btn_download}
                </button>
              )}

              <button
                type="button"
                className="download-btn-ghost-ios"
                onClick={() => scrollToGuide("ios")}
                style={{
                  padding: "0.65rem 1rem",
                  borderRadius: "10px",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <i className="fa-solid fa-circle-info" aria-hidden="true" />{" "}
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
                  <i className="fa-solid fa-globe" style={{ fontSize: "1.4rem", color: "var(--text-primary)" }} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="download-card-title" style={{ fontSize: "1.15rem", margin: 0 }}>
                    {t.download_center.tab_pwa}
                  </h2>
                  <span className="download-card-desc" style={{ fontSize: "0.78rem" }}>
                    {locale === "ar" ? "متصفح الهاتف" : locale === "en" ? "Mobile Browser" : "Browser Mobile"}
                  </span>
                </div>
              </div>

              <p className="download-card-desc" style={{ fontSize: "0.85rem", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
                {t.download_center.pwa_desc}
              </p>

              <ul
                className="download-card-list"
                style={{
                  fontSize: "0.82rem",
                  paddingInlineStart: "1.2rem",
                  margin: "0 0 1.25rem 0",
                  lineHeight: 1.6,
                }}
              >
                <li>{t.download_center.pwa_feature_1}</li>
                <li>{t.download_center.pwa_feature_2}</li>
                <li>{t.download_center.pwa_feature_3}</li>
                <li>
                  {locale === "ar"
                    ? "الحجم: ٠ ميجابايت (فوري)"
                    : locale === "en"
                    ? "Size: 0 MB (Instant Web App)"
                    : "Ukuran: 0 MB (Instan)"}
                </li>
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
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  textDecoration: "none",
                }}
              >
                <i className="fa-solid fa-mobile-screen" aria-hidden="true" /> {t.download_center.pwa_btn_open}
              </Link>

              <button
                type="button"
                className="download-btn-ghost-pwa"
                onClick={() => scrollToGuide("pwa")}
                style={{
                  padding: "0.65rem 1rem",
                  borderRadius: "10px",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <i className="fa-solid fa-circle-info" aria-hidden="true" />{" "}
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
              <i className="fa-solid fa-list-check" aria-hidden="true" />
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
              role="tablist"
              aria-label={t.download_center.title}
              style={{
                display: "flex",
                flexWrap: "wrap",
                background: "rgba(100, 116, 139, 0.12)",
                padding: "4px",
                borderRadius: "12px",
                gap: "4px",
              }}
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeGuideTab === "android"}
                className="download-tab-btn"
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
                }}
              >
                <i className="fa-brands fa-android" aria-hidden="true" />
                <span>Android (.APK)</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeGuideTab === "ios"}
                className="download-tab-btn"
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
                  background: activeGuideTab === "ios" ? "#0369a1" : "transparent",
                  color: activeGuideTab === "ios" ? "#ffffff" : "var(--text-secondary)",
                }}
              >
                <i className="fa-brands fa-apple" aria-hidden="true" />
                <span>iPhone (iOS)</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeGuideTab === "pwa"}
                className="download-tab-btn"
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
                }}
              >
                <i className="fa-solid fa-globe" aria-hidden="true" />
                <span>Web App (PWA)</span>
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

          {/* TAB CONTENT: iOS GUIDE */}
          {activeGuideTab === "ios" && (
            <div>
              {/* Method Switcher Banner */}
              <div className="download-guide-banner-ios" style={{ borderRadius: "14px", padding: "1.25rem", marginBottom: "1.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <i className="fa-solid fa-circle-question download-ios-heading" style={{ fontSize: "1.2rem" }} aria-hidden="true" />
                  <strong className="download-ios-heading" style={{ fontSize: "0.95rem" }}>
                    {locale === "ar"
                      ? "طريقة الاستخدام الرسمية على هواتف آيفون"
                      : locale === "en"
                      ? "Recommended Setup on iPhone & iPad"
                      : "Panduan Resmi Pemasangan di iPhone"}
                  </strong>
                </div>
                <p className="download-step-desc" style={{ margin: 0, fontSize: "0.86rem", lineHeight: 1.6 }}>
                  {locale === "ar"
                    ? "يمكن تشغيل البوابة الكاملة على آيفون وآيباد بملء الشاشة مباشرة عبر متصفح سفاري دون متجر تطبيقات أو إعدادات معقدة."
                    : locale === "en"
                    ? "Run the complete portal on iPhone and iPad full-screen through Safari Add to Home Screen with no computer or App Store download required."
                    : "Portal lengkap Expedient 43 berjalan di iPhone dan iPad dalam tampilan layar penuh langsung melalui Safari tanpa komputer atau instalasi App Store."}
                </p>

                {hasConfiguredIpa && (
                  <div style={{ display: "flex", gap: "10px", marginTop: "14px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="download-submethod-btn"
                      onClick={() => setActiveIosMethod("safari")}
                      style={{
                        background: activeIosMethod === "safari" ? "#0369a1" : "rgba(100, 116, 139, 0.2)",
                        color: activeIosMethod === "safari" ? "#ffffff" : "var(--text-primary)",
                        border: "none",
                        padding: "8px 14px",
                        borderRadius: "8px",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <i className="fa-brands fa-safari" aria-hidden="true" /> {t.download_center.ios_method1_title}
                    </button>
                    <button
                      type="button"
                      className="download-submethod-btn"
                      onClick={() => setActiveIosMethod("ipa")}
                      style={{
                        background: activeIosMethod === "ipa" ? "#0369a1" : "rgba(100, 116, 139, 0.2)",
                        color: activeIosMethod === "ipa" ? "#ffffff" : "var(--text-primary)",
                        border: "none",
                        padding: "8px 14px",
                        borderRadius: "8px",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <i className="fa-solid fa-laptop" aria-hidden="true" /> {t.download_center.ios_method2_title}
                    </button>
                  </div>
                )}
              </div>

              {/* Steps for Safari Home Screen */}
              {activeIosMethod === "safari" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "#0369a1",
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
                      <p className="download-step-desc" style={{ fontSize: "0.88rem", margin: 0, lineHeight: 1.5 }}>
                        {t.download_center.ios_step1_desc}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "#0369a1",
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
                        background: "#0369a1",
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
                        background: "#0369a1",
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

              {/* Optional IPA Sideload Guidance when configured */}
              {hasConfiguredIpa && activeIosMethod === "ipa" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <p className="download-step-desc" style={{ fontSize: "0.9rem", margin: 0, lineHeight: 1.6 }}>
                    {t.download_center.ios_method2_desc}
                  </p>
                  <a
                    href="https://sideloadly.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="download-ios-heading"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.88rem",
                      textDecoration: "underline",
                      fontWeight: 600,
                    }}
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />{" "}
                    {locale === "ar"
                      ? "الموقع الرسمي لبرنامج Sideloadly (sideloadly.io)"
                      : locale === "en"
                      ? "Open Sideloadly Official Website (sideloadly.io)"
                      : "Kunjungi Situs Resmi Sideloadly (sideloadly.io)"}
                  </a>
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
                  <i className="fa-brands fa-apple" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="download-step-title" style={{ fontSize: "0.95rem", margin: "0 0 4px 0" }}>
                    {locale === "ar"
                      ? "في متصفح سفاري (iPhone / iPad)"
                      : locale === "en"
                      ? "In Safari Browser (iPhone / iPad)"
                      : "Di Browser Safari (iPhone / iPad)"}
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
                  <i className="fa-brands fa-chrome" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="download-step-title" style={{ fontSize: "0.95rem", margin: "0 0 4px 0" }}>
                    {locale === "ar"
                      ? "في متصفح جوجل كروم (أندرويد)"
                      : locale === "en"
                      ? "In Google Chrome Browser (Android)"
                      : "Di Browser Google Chrome (Android)"}
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
                minHeight: "44px",
                padding: "0 8px",
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

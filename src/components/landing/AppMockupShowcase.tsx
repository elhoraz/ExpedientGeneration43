"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type ScreenPreview = "kta" | "quran" | "radar";

export default function AppMockupShowcase() {
  const { t, locale } = useLanguage();
  const [activeScreen, setActiveScreen] = useState<ScreenPreview>("kta");
  const sectionRef = useRef<HTMLElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0); // -1 (passed) to 0 (centered) to 1 (incoming)
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let ticking = false;

    const calculateParallax = () => {
      if (!sectionRef.current) {
        ticking = false;
        return;
      }

      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight || 800;

      // Distance from center of section to center of viewport
      const sectionCenter = rect.top + rect.height / 2;
      const viewportCenter = windowHeight / 2;
      const maxDistance = (rect.height + windowHeight) / 2;
      const distance = sectionCenter - viewportCenter;

      // Normalized ratio: -1 (above viewport), 0 (centered), 1 (below viewport)
      const ratio = Math.max(-1, Math.min(1, distance / maxDistance));
      setScrollProgress(ratio);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(calculateParallax);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    calculateParallax();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setMouseOffset({ x: x * 6, y: y * -6 });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  // 3D Parallax Transformations for Smartphone Chassis
  const phoneRotateX = scrollProgress * 15 + mouseOffset.y;
  const phoneRotateY = scrollProgress * -12 + mouseOffset.x;
  const phoneRotateZ = scrollProgress * -2.5;
  const phoneTranslateY = scrollProgress * 42;

  // Independent Layered Depth for KTA Card & Content
  const cardTranslateY = scrollProgress * -22;
  const cardRotateX = scrollProgress * -8;
  const cardRotateY = scrollProgress * 5;

  return (
    <section ref={sectionRef} className="app-showcase-section" id="aplikasi">
      <div className="section-header">
        <div className="landing-prestige-badge" style={{ marginBottom: "14px" }}>
          <i className="fa-brands fa-android"></i>
          <span>{t.app_showcase.badge}</span>
        </div>
        <h2 className="section-title">
          {t.app_showcase.title}
        </h2>
        <p className="section-lead">
          {t.app_showcase.lead}
        </p>
      </div>

      <div className="app-showcase-container">
        {/* Left / Info Column */}
        <div className="app-info-col">
          <div className="app-pill-feature">
            <span className="live-pulse-dot"></span>
            <span>{t.app_showcase.version_pill}</span>
          </div>

          <h3 className="app-feature-headline">
            {t.app_showcase.headline}
          </h3>
          <p className="app-feature-desc">
            {t.app_showcase.desc}
          </p>

          {/* Interactive Screen Switcher Tabs */}
          <div className="app-preview-tabs">
            <button
              type="button"
              className={`app-tab-btn ${activeScreen === "kta" ? "active" : ""}`}
              onClick={() => setActiveScreen("kta")}
            >
              <i className="fa-solid fa-id-card"></i>
              <span>{t.app_showcase.tab_kta}</span>
            </button>
            <button
              type="button"
              className={`app-tab-btn ${activeScreen === "quran" ? "active" : ""}`}
              onClick={() => setActiveScreen("quran")}
            >
              <i className="fa-solid fa-book-quran"></i>
              <span>{t.app_showcase.tab_quran}</span>
            </button>
            <button
              type="button"
              className={`app-tab-btn ${activeScreen === "radar" ? "active" : ""}`}
              onClick={() => setActiveScreen("radar")}
            >
              <i className="fa-solid fa-map-location-dot"></i>
              <span>{t.app_showcase.tab_radar}</span>
            </button>
          </div>

          {/* Feature Badges List */}
          <div className="app-perks-grid">
            <div className="perk-item">
              <i className="fa-solid fa-shield-halved"></i>
              <div>
                <strong>{t.app_showcase.perk1_title}</strong>
                <span>{t.app_showcase.perk1_desc}</span>
              </div>
            </div>
            <div className="perk-item">
              <i className="fa-solid fa-cloud-arrow-down"></i>
              <div>
                <strong>{t.app_showcase.perk2_title}</strong>
                <span>{t.app_showcase.perk2_desc}</span>
              </div>
            </div>
            <div className="perk-item">
              <i className="fa-solid fa-feather"></i>
              <div>
                <strong>{t.app_showcase.perk3_title}</strong>
                <span>{t.app_showcase.perk3_desc}</span>
              </div>
            </div>
            <div className="perk-item">
              <i className="fa-solid fa-compass"></i>
              <div>
                <strong>{t.app_showcase.perk4_title}</strong>
                <span>{t.app_showcase.perk4_desc}</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="app-action-buttons">
            <Link href="/download" className="btn-primary" id="btnDownloadApkLanding">
              <i className="fa-brands fa-android"></i>
              <span>{t.cta.btn_apk}</span>
            </Link>
            <Link href="/download" className="btn-secondary">
              <i className="fa-solid fa-circle-question"></i>
              <span>{locale === "ar" ? "دليل التثبيت" : locale === "en" ? "Installation Guide" : "Panduan Instalasi"}</span>
            </Link>
          </div>
        </div>

        {/* Right / Luxury 3D Smartphone Mockup */}
        <div className="app-mockup-col">
          <div
            className="phone-mockup-wrapper"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Ambient Gold Glow Behind Device with Parallax Depth */}
            <div
              className="phone-ambient-glow"
              style={{
                transform: `translateY(${scrollProgress * -25}px) scale(${1 + (1 - Math.abs(scrollProgress)) * 0.15})`,
                opacity: 0.65 + (1 - Math.abs(scrollProgress)) * 0.35,
              }}
            ></div>

            {/* Smartphone Chassis with Smooth 3D Scroll Parallax */}
            <div
              className="phone-chassis"
              style={{
                transform: `perspective(1000px) translateY(${phoneTranslateY}px) rotateX(${phoneRotateX}deg) rotateY(${phoneRotateY}deg) rotateZ(${phoneRotateZ}deg)`,
              }}
            >
              {/* Speaker / Dynamic Island */}
              <div className="phone-dynamic-island">
                <span className="camera-lens"></span>
              </div>

              {/* Status Bar */}
              <div className="phone-status-bar">
                <span className="status-clock">09:43</span>
                <div className="status-icons">
                  <i className="fa-solid fa-signal"></i>
                  <i className="fa-solid fa-wifi"></i>
                  <i className="fa-solid fa-battery-full"></i>
                </div>
              </div>

              {/* App Screen Content */}
              <div className="phone-screen-content">
                {/* Screen 1: KTA 3D */}
                {activeScreen === "kta" && (
                  <div className="screen-view screen-kta">
                    <div className="screen-header">
                      <span className="screen-title">SOVEREIGN CARD</span>
                      <span className="screen-badge">
                        {locale === "ar" ? "عضو رسمي" : locale === "en" ? "OFFICIAL MEMBER" : "ANGGOTA RESMI"}
                      </span>
                    </div>

                    <div
                      className="mock-card-card"
                      style={{
                        transform: `translateZ(20px) translateY(${cardTranslateY}px) rotateX(${cardRotateX}deg) rotateY(${cardRotateY}deg)`,
                      }}
                    >
                      <div
                        className="mock-card-gold-shine"
                        style={{
                          background: `linear-gradient(${45 + scrollProgress * 30}deg, transparent 40%, rgba(212, 175, 55, ${0.2 + (1 - Math.abs(scrollProgress)) * 0.15}) 50%, transparent 60%)`,
                        }}
                      ></div>
                      <div className="mock-card-top">
                        <span className="mock-brand">EXPEDIENT 43</span>
                        <i className="fa-solid fa-shield-cat gold-icon"></i>
                      </div>
                      <div className="mock-chip-row">
                        <div className="mock-sim-chip"></div>
                        <i className="fa-solid fa-wifi nfc-icon"></i>
                      </div>
                      <div className="mock-card-num">43.2026.001.088</div>
                      <div className="mock-card-footer">
                        <div>
                          <span className="mock-lbl">
                            {locale === "ar" ? "اسم العضو" : locale === "en" ? "MEMBER NAME" : "NAMA SANTRI"}
                          </span>
                          <span className="mock-val">AHMAD ARRISALAH</span>
                        </div>
                        <div>
                          <span className="mock-lbl">
                            {locale === "ar" ? "المعهد" : locale === "en" ? "ALMAMATER" : "ALMAMATER"}
                          </span>
                          <span className="mock-val">SLAHUNG</span>
                        </div>
                      </div>
                    </div>

                    <div className="mock-action-pill">
                      <i className="fa-solid fa-qrcode"></i> {locale === "ar" ? "مسح رمز التحقق" : locale === "en" ? "Scan QR Verification" : "Scan QR Verifikasi"}
                    </div>
                  </div>
                )}

                {/* Screen 2: Quran Mushaf Al-Hufaz */}
                {activeScreen === "quran" && (
                  <div className="screen-view screen-quran">
                    <div className="screen-header">
                      <span className="screen-title">{t.quran.tab_mushaf.toUpperCase()}</span>
                      <span className="screen-badge">
                        {locale === "ar" ? "الجزء ١ • ص ٦" : locale === "en" ? "JUZ 1 • PAGE 6" : "JUZ 1 • HAL 6"}
                      </span>
                    </div>

                    <div
                      className="mock-mushaf-sheet"
                      style={{
                        transform: `translateZ(16px) translateY(${scrollProgress * -15}px)`,
                      }}
                    >
                      <div className="mock-surah-header">
                        <span>سُورَةُ البَقَرَةِ</span>
                      </div>
                      <div className="mock-quran-band band-1">
                        <span>وَإِذْ قَالَ رَبُّكَ لِلْمَلَائِكَةِ إِنِّي جَاعِلٌ فِي الْأَرْضِ خَلِيفَةً</span>
                      </div>
                      <div className="mock-quran-band band-2">
                        <span>قَالُوا أَتَجْعَلُ فِيهَا مَن يُفْسِدُ فِيهَا وَيَسْفِكُ الدِّمَاءَ</span>
                      </div>
                      <div className="mock-quran-band band-3">
                        <span>وَنَحْنُ نُسَبِّحُ بِحَمْدِكَ وَنُقَدِّسُ لَكَ ۖ قَالَ إِنِّي أَعْلَمُ</span>
                      </div>
                      <div className="mock-quran-band band-4">
                        <span>وَعَلَّمَ آدَمَ الْأَسْمَاءَ كُلَّهَا ثُمَّ عَرَضَهُمْ عَلَى الْمَلَائِكَةِ</span>
                      </div>
                      <div className="mock-quran-band band-5">
                        <span>فَقَالَ أَنبِئُونِي بِأَسْمَاءِ هَٰؤُلَاءِ إِن كُنتُمْ صَادِقِينَ</span>
                      </div>
                    </div>

                    <div className="mock-quran-player-bar">
                      <i className="fa-solid fa-play gold-icon"></i>
                      <span>Misyari Rasyid • Al-Baqarah 30-37</span>
                    </div>
                  </div>
                )}

                {/* Screen 3: Radar Alumni */}
                {activeScreen === "radar" && (
                  <div className="screen-view screen-radar">
                    <div className="screen-header">
                      <span className="screen-title">
                        {locale === "ar" ? "رادار الخريجين" : locale === "en" ? "GEOSPATIAL RADAR" : "RADAR GEOSPASIAL"}
                      </span>
                      <span className="screen-badge">
                        {locale === "ar" ? "قمر صناعي حي" : locale === "en" ? "LIVE SATELLITE" : "LIVE SATELLITE"}
                      </span>
                    </div>

                    <div
                      className="mock-radar-map"
                      style={{
                        transform: `translateZ(16px) translateY(${scrollProgress * -15}px)`,
                      }}
                    >
                      <div className="radar-sweep-beam"></div>
                      <div className="radar-ring r1"></div>
                      <div className="radar-ring r2"></div>
                      <div className="radar-pin p-center" title="Slahung Ponorogo">
                        <i className="fa-solid fa-kaaba"></i>
                      </div>
                      <div className="radar-pin p-egypt" title={locale === "ar" ? "القاهرة، مصر" : locale === "en" ? "Cairo, Egypt" : "Kairo, Mesir"}>
                        <span className="pin-dot"></span>
                      </div>
                      <div className="radar-pin p-jkt" title={locale === "ar" ? "جاكرتا" : "Jakarta"}>
                        <span className="pin-dot"></span>
                      </div>
                      <div className="radar-pin p-sby" title={locale === "ar" ? "سورابايا" : "Surabaya"}>
                        <span className="pin-dot"></span>
                      </div>
                    </div>

                    <div className="mock-radar-stats">
                      <div>
                        <strong>142</strong>
                        <span>{locale === "ar" ? "متصل" : locale === "en" ? "Connected" : "Terhubung"}</span>
                      </div>
                      <div>
                        <strong>18</strong>
                        <span>{locale === "ar" ? "محافظة" : locale === "en" ? "Provinces" : "Provinsi"}</span>
                      </div>
                      <div>
                        <strong>6</strong>
                        <span>{locale === "ar" ? "دول" : locale === "en" ? "Countries" : "Negara"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Home Indicator */}
              <div className="phone-home-indicator"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

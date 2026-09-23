"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type ScreenPreview = "kta" | "quran" | "radar";

export default function AppMockupShowcase() {
  const { t, locale } = useLanguage();
  const [activeScreen, setActiveScreen] = useState<ScreenPreview>("kta");

  return (
    <section className="app-showcase-section" id="aplikasi">
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
          <div className="phone-mockup-wrapper">
            {/* Ambient Gold Glow Behind Device */}
            <div className="phone-ambient-glow"></div>

            {/* Smartphone Chassis */}
            <div className="phone-chassis">
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
                      <span className="screen-badge">ANGGOTA RESMI</span>
                    </div>

                    <div className="mock-card-card">
                      <div className="mock-card-gold-shine"></div>
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
                          <span className="mock-lbl">NAMA SANTRI</span>
                          <span className="mock-val">AHMAD ARRISALAH</span>
                        </div>
                        <div>
                          <span className="mock-lbl">ALMAMATER</span>
                          <span className="mock-val">SLAHUNG</span>
                        </div>
                      </div>
                    </div>

                    <div className="mock-action-pill">
                      <i className="fa-solid fa-qrcode"></i> Scan QR Verifikasi
                    </div>
                  </div>
                )}

                {/* Screen 2: Quran Mushaf Al-Hufaz */}
                {activeScreen === "quran" && (
                  <div className="screen-view screen-quran">
                    <div className="screen-header">
                      <span className="screen-title">MUSHAF AL-HUFAZ</span>
                      <span className="screen-badge">JUZ 1 • HAL 6</span>
                    </div>

                    <div className="mock-mushaf-sheet">
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
                      <span className="screen-title">RADAR GEOSPASIAL</span>
                      <span className="screen-badge">LIVE SATELLITE</span>
                    </div>

                    <div className="mock-radar-map">
                      <div className="radar-sweep-beam"></div>
                      <div className="radar-ring r1"></div>
                      <div className="radar-ring r2"></div>
                      <div className="radar-pin p-center" title="Slahung Ponorogo">
                        <i className="fa-solid fa-kaaba"></i>
                      </div>
                      <div className="radar-pin p-egypt" title="Kairo, Mesir">
                        <span className="pin-dot"></span>
                      </div>
                      <div className="radar-pin p-jkt" title="Jakarta">
                        <span className="pin-dot"></span>
                      </div>
                      <div className="radar-pin p-sby" title="Surabaya">
                        <span className="pin-dot"></span>
                      </div>
                    </div>

                    <div className="mock-radar-stats">
                      <div>
                        <strong>142</strong>
                        <span>Terhubung</span>
                      </div>
                      <div>
                        <strong>18</strong>
                        <span>Provinsi</span>
                      </div>
                      <div>
                        <strong>6</strong>
                        <span>Negara</span>
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

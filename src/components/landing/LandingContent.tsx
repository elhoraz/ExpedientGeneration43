"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import "@/app/landing.css";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import ThemeToggle from "@/components/layout/ThemeToggle";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import TiltCard from "@/components/features/TiltCard";
import HeritageVideoPlayer from "@/components/features/HeritageVideoPlayer";
import CelestialParticles from "@/components/landing/CelestialParticles";
import HistoryTimeline from "@/components/landing/HistoryTimeline";
import WisdomAsatidz from "@/components/landing/WisdomAsatidz";
import AppMockupShowcase from "@/components/landing/AppMockupShowcase";
import MobileDrawer from "@/components/landing/MobileDrawer";
import ScrollToTopIndicator from "@/components/landing/ScrollToTopIndicator";
import DailyWisdomWidget from "@/components/landing/DailyWisdomWidget";
import PolaroidMemories from "@/components/landing/PolaroidMemories";

interface LandingContentProps {
  totalAlumni: number;
  cms?: any[];
}

// Helper function to get content from CMS array with fallback
function getCms(contents: any[] | undefined, key: string, defaultValue: string) {
  if (!contents) return defaultValue;
  const item = contents.find((c: any) => c.content_key === key);
  return item ? item.content_value : defaultValue;
}

export default function LandingContent({ totalAlumni, cms = [] }: LandingContentProps) {
  const { t, locale, isRTL } = useLanguage();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  const shareWaUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(t.cta.share_wa_text)}`;

  return (
    <>
      {/* ====== FLOATING ISLAND NAVIGATION BAR ====== */}
      <header className="landing-nav-island">
        <Link href="/" className="nav-brand">
          <div className="nav-logo-wrap">
            <Image
              src="/images/logo-utuh.webp"
              alt="Logo Expedient 43"
              width={34}
              height={34}
              priority
              className="nav-logo-img"
            />
          </div>
          <div className="nav-brand-text">
            <span className="brand-title">EXPEDIENT 43</span>
            <span className="brand-subtitle">{t.nav.brand_sub}</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="nav-links">
          <a href="#sejarah" className="nav-link">Sejarah 1982</a>
          <a href="#nasehat" className="nav-link">Nasehat Asatidz</a>
          <a href="#almamater" className="nav-link">{t.nav.almamater}</a>
          <a href="#aplikasi" className="nav-link">Aplikasi APK</a>
          <a href="#ekosistem" className="nav-link">{t.nav.ecosystem}</a>
          <Link href="/radar" className="nav-link nav-link-highlight">
            <i className="fa-solid fa-map-location-dot"></i> {t.nav.radar}
          </Link>
        </nav>

        <div className="nav-actions">
          <div className="landing-desktop-lang">
            <LanguageSwitcher variant="pill" />
          </div>
          <ThemeToggle />
          <Link href="/login" className="nav-link nav-login-link" title={t.hero.cta_login}>
            <i className="fa-solid fa-circle-user"></i>
            <span>{t.nav.login}</span>
          </Link>
          <Link href="/beranda" className="nav-btn-portal" id="navCtaExplore">
            <i className="fa-solid fa-landmark"></i>
            <span>{t.nav.explore_museum}</span>
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="nav-hamburger-btn"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Buka Menu Navigasi"
          >
            <i className="fa-solid fa-bars-staggered"></i>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Sheet */}
      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="landing-wrapper">
        {/* ====== HERO SECTION ====== */}
        <section className="landing-content" id="beranda">
          {/* 60 FPS Lightweight Celestial Canvas Background */}
          <CelestialParticles />

          {/* Almamater Dignified Tag */}
          <div className="tuku-heritage-badge">
            <span className="badge-bullet">⚜️</span>
            <span>PONDOK MODERN ARRISALAH • KELAS 2025</span>
          </div>

          {/* Clean Logo with Interactive Embossed Pesantren Stamp */}
          <div className="tuku-logo-wrapper">
            <Image
              src={getCms(cms, "landing_hero_image", "/images/logo-utuh.webp")}
              alt="Expedient Generation 43"
              width={150}
              height={150}
              priority
              className="tuku-logo-img"
              unoptimized={getCms(cms, "landing_hero_image", "/images/logo-utuh.webp").startsWith("data:")}
            />
            {/* Interactive Stamp - Cap Resmi Pesantren Arrisalah */}
            <div className="tuku-interactive-stamp" title="Cap Resmi Santri Angkatan 43 Arrisalah">
              <svg viewBox="0 0 100 100" className="stamp-svg-ring">
                <path
                  id="stampCurvePath"
                  d="M 50, 50 m -36, 0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0"
                  fill="none"
                />
                <text className="stamp-curved-text">
                  <textPath href="#stampCurvePath" startOffset="0%">
                    ✦ EXPEDIENT 43 ✦ ARRISALAH SLAHUNG ✦ EST. 1982 ✦
                  </textPath>
                </text>
              </svg>
              <div className="stamp-center-emblem">43</div>
            </div>
          </div>

          <p className="landing-eyebrow-tuku">
            {locale === "id" ? "WARISAN & UKHUWAH SANTRI" : "HERITAGE & FELLOWSHIP"}
          </p>

          <h1 className="landing-title-tuku">
            Expedient Generation
          </h1>

          <p className="landing-subtitle-tuku">
            {locale === "id"
              ? "Rumah temu digital dan arsip kenangan alumni angkatan ke-43. Merawat hangatnya ukhuwah dari kawah candradimuka Slahung hingga penjuru peradaban dunia."
              : t.hero.subtitle}
          </p>

          {/* Official Cohort Instagram & Motto Touchpoint */}
          <div className="tuku-ig-bar">
            <a
              href="https://www.instagram.com/expedientgeneration_/"
              target="_blank"
              rel="noopener noreferrer"
              className="tuku-ig-link"
              title="Instagram Resmi Angkatan 43: @expedientgeneration_"
            >
              <i className="fa-brands fa-instagram"></i>
              <span className="tuku-ig-handle">@expedientgeneration_</span>
              <span className="tuku-ig-sep">•</span>
              <span className="tuku-ig-tag">The Successor of Islamic Glory</span>
            </a>
          </div>

          {/* Action Button Group - Focused, Uncrowded */}
          <div className="tuku-cta-row">
            <Link href="/beranda" className="btn-tuku-primary" id="ctaExplore">
              <i className="fa-solid fa-compass"></i> {t.hero.cta_explore}
            </Link>
            <Link href="/login" className="btn-tuku-secondary" id="ctaLogin" title="Khusus Anggota Alumni">
              <i className="fa-solid fa-circle-user"></i> {t.hero.cta_login}
            </Link>
          </div>

          {/* Compact Single-Row Stats Ribbon (Bebas Sesak di HP) */}
          <div className="tuku-stats-ribbon">
            <div className="tuku-stat-item">
              <span className="tuku-stat-num" id="counterAlumni">{totalAlumni || 240}</span>
              <span className="tuku-stat-lbl">{t.hero.stat_alumni_label}</span>
            </div>
            <div className="tuku-stat-divider">/</div>
            <div className="tuku-stat-item">
              <span className="tuku-stat-num">{t.hero.stat_grad_year}</span>
              <span className="tuku-stat-lbl">{t.hero.stat_grad_label}</span>
            </div>
            <div className="tuku-stat-divider">/</div>
            <div className="tuku-stat-item">
              <span className="tuku-stat-num">43</span>
              <span className="tuku-stat-lbl">Generasi</span>
            </div>
            <div className="tuku-stat-divider">/</div>
            <div className="tuku-stat-item">
              <span className="tuku-stat-num">100%</span>
              <span className="tuku-stat-lbl">Ukhuwah</span>
            </div>
          </div>

          <div className="scroll-hint">
            <span>{t.hero.scroll_hint}</span>
            <div className="scroll-line"></div>
          </div>
        </section>

        {/* ====== TUKU-STYLE RUNNING TICKER RIBBON (CSS-ONLY, ULTRA LIGHTWEIGHT) ====== */}
        <div className="tuku-running-ribbon" aria-hidden="true">
          <div className="tuku-ticker-track">
            <span className="ticker-segment">⚜️ EXPEDIENT 43</span>
            <span className="ticker-dot">✦</span>
            <span className="ticker-segment">PONDOK MODERN ARRISALAH SLAHUNG</span>
            <span className="ticker-dot">✦</span>
            <span className="ticker-segment">PANGGUNG GEMBIRA 643 (18 JULI 2024)</span>
            <span className="ticker-dot">✦</span>
            <span className="ticker-segment">THE SUCCESSOR OF ISLAMIC GLORY</span>
            <span className="ticker-dot">✦</span>
            <span className="ticker-segment">240 SANTRI BERUKHUWAH</span>
            <span className="ticker-dot">✦</span>
            <span className="ticker-segment">@expedientgeneration_</span>
            <span className="ticker-dot">✦</span>
            {/* Duplicate for seamless infinite loop */}
            <span className="ticker-segment">⚜️ EXPEDIENT 43</span>
            <span className="ticker-dot">✦</span>
            <span className="ticker-segment">PONDOK MODERN ARRISALAH SLAHUNG</span>
            <span className="ticker-dot">✦</span>
            <span className="ticker-segment">PANGGUNG GEMBIRA 643 (18 JULI 2024)</span>
            <span className="ticker-dot">✦</span>
            <span className="ticker-segment">THE SUCCESSOR OF ISLAMIC GLORY</span>
            <span className="ticker-dot">✦</span>
            <span className="ticker-segment">240 SANTRI BERUKHUWAH</span>
            <span className="ticker-dot">✦</span>
            <span className="ticker-segment">@expedientgeneration_</span>
            <span className="ticker-dot">✦</span>
          </div>
        </div>

        {/* Daily Wisdom Note (Secarik Nasihat Mahfuzhat Santri) */}
        <div className="tuku-wisdom-section">
          <DailyWisdomWidget />
        </div>

        {/* Islamic Heritage Flourish Divider 1 */}
        <div className="islamic-flourish-divider" aria-hidden="true">
          <div className="flourish-line"></div>
          <div className="flourish-center">
            <span className="flourish-star">✦</span>
            <span className="flourish-emblem">⚜️</span>
            <span className="flourish-star">✦</span>
          </div>
          <div className="flourish-line"></div>
        </div>

        {/* ====== SECTION 1: SEJARAH & NAPAK TILAS PONDOK 1982 ====== */}
        <HistoryTimeline />

        {/* Islamic Heritage Flourish Divider 2 */}
        <div className="islamic-flourish-divider" aria-hidden="true">
          <div className="flourish-line"></div>
          <div className="flourish-center">
            <span className="flourish-star">✦</span>
            <span className="flourish-emblem">📜</span>
            <span className="flourish-star">✦</span>
          </div>
          <div className="flourish-line"></div>
        </div>

        {/* ====== SECTION 2: LEMBARAN POLAROID & KENANGAN SANTRI ====== */}
        <PolaroidMemories />

        {/* Islamic Heritage Flourish Divider 3 */}
        <div className="islamic-flourish-divider" aria-hidden="true">
          <div className="flourish-line"></div>
          <div className="flourish-center">
            <span className="flourish-star">✦</span>
            <span className="flourish-emblem">🕌</span>
            <span className="flourish-star">✦</span>
          </div>
          <div className="flourish-line"></div>
        </div>

        {/* ====== SECTION 3: KALAM HIKMAH & NASEHAT ASATIDZ ====== */}
        <WisdomAsatidz />

        {/* Islamic Heritage Flourish Divider 4 */}
        <div className="islamic-flourish-divider" aria-hidden="true">
          <div className="flourish-line"></div>
          <div className="flourish-center">
            <span className="flourish-star">✦</span>
            <span className="flourish-emblem">⚜️</span>
            <span className="flourish-star">✦</span>
          </div>
          <div className="flourish-line"></div>
        </div>

        {/* ====== SECTION 3: ALMAMATER HERITAGE (BUMI SLAHUNG) ====== */}
        <section className="heritage-section" id="almamater">
          <div className="section-header">
            <p className="section-eyebrow">{t.almamater.eyebrow}</p>
            <h2 className="section-title">
              {t.almamater.title}
            </h2>
            <p className="section-lead">
              {t.almamater.lead}
            </p>
          </div>

          <div className="heritage-pillars-grid">
            <TiltCard className="pillar-card">
              <div className="pillar-icon-wrap">
                <i className="fa-solid fa-globe"></i>
              </div>
              <h3 className="pillar-title">{t.almamater.p1_title}</h3>
              <p className="pillar-desc">{t.almamater.p1_desc}</p>
              <div className="pillar-badge">{t.almamater.p1_badge}</div>
            </TiltCard>

            <TiltCard className="pillar-card">
              <div className="pillar-icon-wrap">
                <i className="fa-solid fa-microchip"></i>
              </div>
              <h3 className="pillar-title">{t.almamater.p2_title}</h3>
              <p className="pillar-desc">{t.almamater.p2_desc}</p>
              <div className="pillar-badge">{t.almamater.p2_badge}</div>
            </TiltCard>

            <TiltCard className="pillar-card">
              <div className="pillar-icon-wrap">
                <i className="fa-solid fa-mosque"></i>
              </div>
              <h3 className="pillar-title">{t.almamater.p3_title}</h3>
              <p className="pillar-desc">{t.almamater.p3_desc}</p>
              <div className="pillar-badge">{t.almamater.p3_badge}</div>
            </TiltCard>
          </div>

          {/* Video Dokumenter Profil & Suasana Almamater */}
          <div className="heritage-video-container">
            <HeritageVideoPlayer />
          </div>
        </section>

        {/* ====== SECTION 4: SHOWCASE APLIKASI MOBILE 3D MOCKUP ====== */}
        <AppMockupShowcase />

        {/* ====== SECTION 5: THE PHILOSOPHY OF EXPEDIENT (IDENTITAS 43) ====== */}
        <section className="philosophy-section" id="filosofi">
          <div className="section-header">
            <p className="section-eyebrow">{t.philosophy.eyebrow}</p>
            <h2 className="section-title">{t.philosophy.title}</h2>
          </div>

          {/* Grand Epigraph Banner */}
          <div className="epigraph-card">
            <div className="epigraph-quote-mark">&ldquo;</div>
            <blockquote className="epigraph-text">
              {t.philosophy.epigraph_body}
            </blockquote>
            <div className="epigraph-author">
              {t.philosophy.epigraph_author}
            </div>
          </div>

          <div className="philosophy-cards-row">
            <div className="philo-card">
              <div className="philo-icon">
                <i className="fa-solid fa-bolt-lightning"></i>
              </div>
              <h3 className="philo-title">{t.philosophy.card1_title}</h3>
              <p className="philo-desc">{t.philosophy.card1_desc}</p>
            </div>

            <div className="philo-card">
              <div className="philo-icon">
                <i className="fa-solid fa-ring"></i>
              </div>
              <h3 className="philo-title">{t.philosophy.card2_title}</h3>
              <p className="philo-desc">{t.philosophy.card2_desc}</p>
            </div>
          </div>
        </section>

        {/* ====== SECTION 6: BENTO GRID EKOSISTEM DIGITAL ====== */}
        <section className="bento-section" id="ekosistem">
          <div className="section-header">
            <p className="section-eyebrow">{t.ecosystem.eyebrow}</p>
            <h2 className="section-title">{t.ecosystem.title}</h2>
            <p className="section-lead">{t.ecosystem.lead}</p>
          </div>

          <div className="bento-grid">
            {/* Bento 1: Radar Alumni (Wide Card) */}
            <div className="bento-card bento-wide">
              <div className="bento-badge">
                <span className="radar-live-dot"></span>
                <span>{t.ecosystem.b1_badge}</span>
              </div>
              <div className="bento-content">
                <h3 className="bento-title">{t.ecosystem.b1_title}</h3>
                <p className="bento-desc">{t.ecosystem.b1_desc}</p>
                <div className="bento-meta-strip">
                  <span><i className="fa-solid fa-satellite"></i> {t.ecosystem.b1_meta1}</span>
                  <span><i className="fa-solid fa-location-crosshairs"></i> {t.ecosystem.b1_meta2}</span>
                </div>
              </div>
              <div className="bento-action">
                <Link href="/radar" className="bento-link">
                  {t.ecosystem.b1_action} <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </div>

            {/* Bento 2: Sovereign 3D KTA */}
            <TiltCard className="bento-card">
              <div className="bento-badge">
                <i className="fa-solid fa-cube"></i>
                <span>{t.ecosystem.b2_badge}</span>
              </div>
              <div className="bento-content">
                <h3 className="bento-title">{t.ecosystem.b2_title}</h3>
                <p className="bento-desc">{t.ecosystem.b2_desc}</p>
              </div>
              <div className="bento-action">
                <Link href="/sovereign" className="bento-link">
                  {t.ecosystem.b2_action} <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </TiltCard>

            {/* Bento 3: Museum Digital */}
            <TiltCard className="bento-card">
              <div className="bento-badge">
                <i className="fa-solid fa-landmark"></i>
                <span>{t.ecosystem.b3_badge}</span>
              </div>
              <div className="bento-content">
                <h3 className="bento-title">{t.ecosystem.b3_title}</h3>
                <p className="bento-desc">{t.ecosystem.b3_desc}</p>
              </div>
              <div className="bento-action">
                <Link href="/beranda" className="bento-link">
                  {t.ecosystem.b3_action} <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </TiltCard>

            {/* Bento 4: Baitul Maal & Sinergi */}
            <TiltCard className="bento-card">
              <div className="bento-badge">
                <i className="fa-solid fa-hand-holding-dollar"></i>
                <span>{t.ecosystem.b4_badge}</span>
              </div>
              <div className="bento-content">
                <h3 className="bento-title">{t.ecosystem.b4_title}</h3>
                <p className="bento-desc">{t.ecosystem.b4_desc}</p>
              </div>
              <div className="bento-action">
                <Link href="/baitul-maal" className="bento-link">
                  {t.ecosystem.b4_action} <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </TiltCard>

            {/* Bento 5: Audio Lounge & Realtime */}
            <TiltCard className="bento-card">
              <div className="bento-badge">
                <i className="fa-solid fa-headphones"></i>
                <span>{t.ecosystem.b5_badge}</span>
              </div>
              <div className="bento-content">
                <h3 className="bento-title">{t.ecosystem.b5_title}</h3>
                <p className="bento-desc">{t.ecosystem.b5_desc}</p>
              </div>
              <div className="bento-action">
                <Link href="/chat/lounge" className="bento-link">
                  {t.ecosystem.b5_action} <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </TiltCard>
          </div>
        </section>

        {/* ====== SECTION 7: CALL TO ACTION ====== */}
        <section className="cta-banner-section">
          <div className="cta-banner-box">
            <div className="cta-glow-circle"></div>
            <p className="cta-banner-eyebrow">{t.cta.eyebrow}</p>
            <h2 className="cta-banner-title">
              {t.cta.title}
            </h2>
            <p className="cta-banner-desc">
              {t.cta.desc}
            </p>
            <div className="cta-banner-buttons">
              <Link href="/beranda" className="btn-primary">
                <i className="fa-solid fa-landmark"></i> {t.cta.btn_explore}
              </Link>
              <Link href="/login" className="btn-secondary">
                <i className="fa-solid fa-circle-user"></i> {t.cta.btn_member}
              </Link>
              <Link href="/download" className="btn-secondary">
                <i className="fa-brands fa-android"></i> {t.cta.btn_apk}
              </Link>
              <a
                href={shareWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary btn-share-wa"
                title="Sebarkan Tautan ke Grup WhatsApp Alumni"
              >
                <i className="fa-brands fa-whatsapp"></i> {t.cta.btn_share_wa}
              </a>
            </div>
          </div>
        </section>

        {/* ====== FOOTER (BERBOBOT ALMAMATER) ====== */}
        <footer className="landing-footer">
          <div className="footer-top-grid">
            <div className="footer-brand-col">
              <div className="footer-logo-row">
                <Image
                  src="/images/logo-utuh.webp"
                  alt="Logo Expedient 43"
                  width={40}
                  height={40}
                  className="footer-logo"
                />
                <div>
                  <div className="footer-brand-name">{t.footer.brand_title}</div>
                  <div className="footer-brand-sub">{t.footer.brand_sub}</div>
                </div>
              </div>
              <p className="footer-address">
                <strong>{t.footer.address_title}</strong><br />
                {t.footer.address_desc}
              </p>
              <div className="footer-motto">
                <em>&ldquo;{t.footer.motto}&rdquo;</em>
              </div>
              <div className="footer-ig-box">
                <a
                  href="https://www.instagram.com/expedientgeneration_/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-ig-link"
                  title="Akun Instagram Resmi Angkatan 43: @expedientgeneration_"
                >
                  <i className="fa-brands fa-instagram"></i>
                  <span>@expedientgeneration_</span>
                  <span className="footer-ig-badge">Official</span>
                </a>
              </div>
            </div>

            <div className="footer-links-col">
              <h4>{t.footer.col1_title}</h4>
              <ul>
                <li><a href="#beranda">{t.footer.nav_home}</a></li>
                <li><a href="#sejarah">Sejarah Pondok 1982</a></li>
                <li><a href="#nasehat">Wejangan Asatidz</a></li>
                <li><a href="#almamater">{t.footer.nav_almamater}</a></li>
                <li><a href="#aplikasi">Aplikasi Mobile</a></li>
                <li><a href="#ekosistem">{t.footer.nav_ecosystem}</a></li>
                <li><Link href="/radar">{t.footer.nav_radar}</Link></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4>Utilitas &amp; Fitur Bebas</h4>
              <ul>
                <li><Link href="/quran">Al-Qur&apos;an Al-Hufaz</Link></li>
                <li><Link href="/matsurat">Al-Ma&apos;tsurat Dzikir</Link></li>
                <li><Link href="/asmaul-husna">99 Asmaul Husna</Link></li>
                <li><Link href="/mahfuzhat">Mahfuzhat Santri</Link></li>
                <li><Link href="/photobooth">Photobooth Santri</Link></li>
                <li><Link href="/kiblat">Kiblat &amp; Waktu Sholat</Link></li>
                <li><Link href="/download">{t.footer.srv_apk}</Link></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <div>
              &copy; {currentYear} {locale === "id" ? getCms(cms, "landing_footer_text", t.footer.copy_text) : t.footer.copy_text}
            </div>
            <div className="footer-meta-links">
              <LanguageSwitcher variant="pill" />
              <span>•</span>
              <Link href="/download">{t.footer.link_apk}</Link>
              <span>•</span>
              <Link href="/delete-account">{t.footer.link_privacy}</Link>
            </div>
          </div>
        </footer>
      </main>

      {/* Floating Circular Scroll to Top Indicator */}
      <ScrollToTopIndicator />
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
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
import AnimatedStatsRibbon from "@/components/landing/AnimatedStatsRibbon";
import ScrollyManifesto from "@/components/landing/ScrollyManifesto";
import ScrollRevealInit from "@/components/landing/ScrollRevealInit";
import GlobalMouseSpotlight from "@/components/landing/GlobalMouseSpotlight";
import ArabesqueWatermark from "@/components/landing/ArabesqueWatermark";

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
  const [activeSection, setActiveSection] = useState<string>("beranda");
  const currentYear = new Date().getFullYear();

  // Real-time Scrollspy for Desktop Navigation and Mobile Drawer
  useEffect(() => {
    const sectionIds = ["beranda", "sejarah", "nasehat", "almamater", "aplikasi", "ekosistem"];
    const handleScrollSpy = () => {
      const wrapper = document.querySelector(".landing-wrapper") as HTMLElement | null;
      const scrollPos = (wrapper ? wrapper.scrollTop : window.scrollY) + 160;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el) {
          const top = wrapper ? el.offsetTop : el.getBoundingClientRect().top + window.scrollY;
          if (scrollPos >= top) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    const wrapper = document.querySelector(".landing-wrapper") as HTMLElement | null;
    if (wrapper) wrapper.addEventListener("scroll", handleScrollSpy, { passive: true });
    window.addEventListener("scroll", handleScrollSpy, { passive: true, capture: true });
    handleScrollSpy();

    return () => {
      if (wrapper) wrapper.removeEventListener("scroll", handleScrollSpy);
      window.removeEventListener("scroll", handleScrollSpy, { capture: true });
    };
  }, []);

  const shareWaUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(t.cta.share_wa_text)}`;

  return (
    <>
      {/* Dynamic Ambient Mouse Cursor Glow for Desktop */}
      <GlobalMouseSpotlight />

      {/* Majestic Rotating 8-Point Islamic Star Watermark */}
      <ArabesqueWatermark />

      {/* Scroll Reveal Observer for Dynamic Page Entrances */}
      <ScrollRevealInit />

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

        {/* Desktop Nav Links with Active Indicator */}
        <nav className="nav-links">
          <a href="#sejarah" className={`nav-link ${activeSection === "sejarah" ? "active" : ""}`}>
            {t.nav.sejarah}
          </a>
          <a href="#nasehat" className={`nav-link ${activeSection === "nasehat" ? "active" : ""}`}>
            {t.nav.nasehat}
          </a>
          <a href="#almamater" className={`nav-link ${activeSection === "almamater" ? "active" : ""}`}>
            {t.nav.almamater}
          </a>
          <a href="#aplikasi" className={`nav-link ${activeSection === "aplikasi" ? "active" : ""}`}>
            {t.nav.apk}
          </a>
          <a href="#ekosistem" className={`nav-link ${activeSection === "ekosistem" ? "active" : ""}`}>
            {t.nav.ecosystem}
          </a>
          <Link href="/radar" className="nav-link nav-link-highlight">
            <i className="fa-solid fa-map-location-dot"></i> {t.nav.radar}
          </Link>
        </nav>

        <div className="nav-actions">
          {/* Quick Search Shortcut Trigger (Ctrl+K) */}
          <button
            type="button"
            className="nav-search-trigger"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(8);
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
            }}
            title="Pencarian Instan (Ctrl+K)"
            aria-label="Cari Cepat"
          >
            <i className="fa-solid fa-magnifying-glass"></i>
            <span className="search-shortcut-pill">⌘K</span>
          </button>

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
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(8);
              setIsDrawerOpen(true);
            }}
            aria-label={t.nav.open_nav}
          >
            <i className="fa-solid fa-bars-staggered"></i>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Sheet with Active Section Sync */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeSection={activeSection}
      />

      <main className="landing-wrapper">
        {/* ====== HERO SECTION ====== */}
        <section className="landing-content" id="beranda">
          {/* 60 FPS Lightweight Celestial Canvas Background */}
          <CelestialParticles />

          {/* Almamater Dignified Tag */}
          <div className="tuku-heritage-badge">
            <span className="badge-bullet">⚜️</span>
            <span>{locale === "ar" ? "معهد الرسالة الحديث • دفعة ٢٠٢٥" : locale === "en" ? "ARRISALAH MODERN BOARDING SCHOOL • CLASS OF 2025" : "PONDOK MODERN ARRISALAH • KELAS 2025"}</span>
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
            <div className="tuku-interactive-stamp" title={t.ticker.stamp_title}>
              <svg viewBox="0 0 100 100" className="stamp-svg-ring">
                <path
                  id="stampCurvePath"
                  d="M 50, 50 m -36, 0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0"
                  fill="none"
                />
                <text className="stamp-curved-text">
                  <textPath href="#stampCurvePath" startOffset="0%">
                    {t.ticker.stamp_curved}
                  </textPath>
                </text>
              </svg>
              <div className="stamp-center-emblem">43</div>
            </div>
          </div>

          <p className="landing-eyebrow-tuku">
            {t.hero.badge}
          </p>

          <h1 className="landing-title-tuku">
            Expedient Generation
          </h1>

          <p className="landing-subtitle-tuku">
            {t.hero.subtitle}
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

          {/* Interactive Animated Stats Ribbon (Odometer ticking on scroll) */}
          <AnimatedStatsRibbon
            totalAlumni={totalAlumni}
            alumniLabel={t.hero.stat_alumni_label}
            gradYear={t.hero.stat_grad_year}
            gradLabel={t.hero.stat_grad_label}
            generationLabel={locale === "ar" ? "دفعة" : locale === "en" ? "Generation" : "Generasi"}
            ukhuwahLabel={locale === "ar" ? "أخوة" : locale === "en" ? "Brotherhood" : "Ukhuwah"}
          />

          <div className="scroll-hint">
            <span>{t.hero.scroll_hint}</span>
            <div className="scroll-line"></div>
          </div>
        </section>

        {/* ====== TUKU-STYLE RUNNING TICKER RIBBON (CSS-ONLY, ULTRA LIGHTWEIGHT) ====== */}
        <div className="tuku-running-ribbon" aria-hidden="true">
          <div className="tuku-ticker-track">
            <span className="ticker-segment">⚜️ {t.ticker.seg_expedient}</span>
            <span className="ticker-dot">✦</span>
            <span className="ticker-segment">{t.ticker.seg_pondok}</span>
            <span className="ticker-dot">✦</span>
            <span className="ticker-segment">{t.ticker.seg_pg}</span>
            <span className="ticker-dot">✦</span>
            <span className="ticker-segment">{t.ticker.seg_motto}</span>
            <span className="ticker-dot">✦</span>
            <span className="ticker-segment">{t.ticker.seg_santri}</span>
            <span className="ticker-dot">✦</span>
            <span className="ticker-segment">@expedientgeneration_</span>
            <span className="ticker-dot">✦</span>
            {/* Duplicate for seamless infinite loop */}
            <span className="ticker-segment">⚜️ {t.ticker.seg_expedient}</span>
            <span className="ticker-dot">✦</span>
            <span className="ticker-segment">{t.ticker.seg_pondok}</span>
            <span className="ticker-dot">✦</span>
            <span className="ticker-segment">{t.ticker.seg_pg}</span>
            <span className="ticker-dot">✦</span>
            <span className="ticker-segment">{t.ticker.seg_motto}</span>
            <span className="ticker-dot">✦</span>
            <span className="ticker-segment">{t.ticker.seg_santri}</span>
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
          <div className="section-header reveal-on-scroll">
            <p className="section-eyebrow">{t.almamater.eyebrow}</p>
            <h2 className="section-title">
              {t.almamater.title}
            </h2>
            <p className="section-lead">
              {t.almamater.lead}
            </p>
          </div>

          <div className="heritage-pillars-grid reveal-stagger">
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
          <div className="heritage-video-container reveal-on-scroll">
            <HeritageVideoPlayer />
          </div>
        </section>

        {/* ====== SECTION 4: SHOWCASE APLIKASI MOBILE 3D MOCKUP ====== */}
        <AppMockupShowcase />

        {/* ====== SECTION 5: THE PHILOSOPHY OF EXPEDIENT (IDENTITAS 43) ====== */}
        <section className="philosophy-section" id="filosofi">
          <div className="section-header reveal-on-scroll">
            <p className="section-eyebrow">{t.philosophy.eyebrow}</p>
            <h2 className="section-title">{t.philosophy.title}</h2>
          </div>

          {/* Grand Epigraph Banner with Scrolly-Reading Text Illumination */}
          <div className="epigraph-card reveal-on-scroll">
            <ScrollyManifesto
              text={t.philosophy.epigraph_body}
              sourceText={t.philosophy.epigraph_author}
              isRTL={isRTL}
            />
          </div>

          <div className="philosophy-cards-row reveal-stagger">
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
          <div className="section-header reveal-on-scroll">
            <p className="section-eyebrow">{t.ecosystem.eyebrow}</p>
            <h2 className="section-title">{t.ecosystem.title}</h2>
            <p className="section-lead">{t.ecosystem.lead}</p>
          </div>

          <div className="bento-grid reveal-stagger">
            {/* Bento 1: Radar Alumni (Wide Card with Live Sonar Radar Graphic) */}
            <div className="bento-card bento-wide bento-radar-card">
              {/* Dynamic Radar Sonar Viewport */}
              <div className="bento-sonar-viewport" aria-hidden="true">
                <div className="sonar-ring ring-1"></div>
                <div className="sonar-ring ring-2"></div>
                <div className="sonar-ring ring-3"></div>
                <div className="sonar-sweep-beam"></div>
                <div className="sonar-blip blip-slahung" title="Bumi Slahung">
                  <span className="blip-ping"></span>
                  <span className="blip-label">SLAHUNG</span>
                </div>
                <div className="sonar-blip blip-kairo" title="Kairo, Mesir">
                  <span className="blip-ping"></span>
                  <span className="blip-label">KAIRO</span>
                </div>
                <div className="sonar-blip blip-jakarta" title="Jakarta">
                  <span className="blip-ping"></span>
                  <span className="blip-label">JKT</span>
                </div>
              </div>

              <div className="bento-badge">
                <span className="radar-live-dot"></span>
                <span>{t.ecosystem.b1_badge}</span>
              </div>
              <div className="bento-content">
                <h3 className="bento-title">{t.ecosystem.b1_title}</h3>
                <p className="bento-desc">{t.ecosystem.b1_desc}</p>
                <div className="bento-meta-strip">
                  <span><i className="fa-solid fa-satellite"></i> 7.9892° S, 111.4392° E</span>
                  <span><i className="fa-solid fa-earth-asia"></i> 240+ Alumni Global</span>
                </div>
              </div>
              <div className="bento-action">
                <Link href="/radar" className="bento-link">
                  {t.ecosystem.b1_action} <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </div>

            {/* Bento 2: Sovereign 3D KTA */}
            <TiltCard className="bento-card bento-kta-card">
              <div className="bento-foil-sheen" aria-hidden="true"></div>
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
            <TiltCard className="bento-card bento-amal-card">
              <div className="bento-badge">
                <i className="fa-solid fa-hand-holding-dollar"></i>
                <span>{t.ecosystem.b4_badge}</span>
                <span className="bento-live-pulse-badge">Aktif</span>
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
          <div className="cta-banner-box reveal-on-scroll">
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
                title={t.cta.btn_share_wa}
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
                <li><a href="#sejarah">{t.footer.nav_sejarah}</a></li>
                <li><a href="#nasehat">{t.footer.nav_nasehat}</a></li>
                <li><a href="#almamater">{t.footer.nav_almamater}</a></li>
                <li><a href="#aplikasi">{t.footer.nav_apk}</a></li>
                <li><a href="#ekosistem">{t.footer.nav_ecosystem}</a></li>
                <li><Link href="/radar">{t.footer.nav_radar}</Link></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4>{t.footer.col3_title}</h4>
              <ul>
                <li><Link href="/quran">{t.footer.util_quran}</Link></li>
                <li><Link href="/matsurat">{t.footer.util_matsurat}</Link></li>
                <li><Link href="/asmaul-husna">{t.footer.util_asmaul}</Link></li>
                <li><Link href="/mahfuzhat">{t.footer.util_mahfuzhat}</Link></li>
                <li><Link href="/photobooth">{t.footer.util_photobooth}</Link></li>
                <li><Link href="/kiblat">{t.footer.util_kiblat}</Link></li>
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

"use client";

import Image from "next/image";
import Link from "next/link";
import "@/app/landing.css";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import ThemeToggle from "@/components/layout/ThemeToggle";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import TiltCard from "@/components/features/TiltCard";
import HeritageVideoPlayer from "@/components/features/HeritageVideoPlayer";

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

        <nav className="nav-links">
          <a href="#almamater" className="nav-link">{t.nav.almamater}</a>
          <a href="#filosofi" className="nav-link">{t.nav.philosophy}</a>
          <a href="#ekosistem" className="nav-link">{t.nav.ecosystem}</a>
          <Link href="/radar" className="nav-link nav-link-highlight">
            <i className="fa-solid fa-map-location-dot"></i> {t.nav.radar}
          </Link>
        </nav>

        <div className="nav-actions">
          <LanguageSwitcher variant="pill" />
          <ThemeToggle />
          <Link href="/login" className="nav-link" title={t.hero.cta_login}>
            <i className="fa-solid fa-circle-user"></i>
            <span>{t.nav.login}</span>
          </Link>
          <Link href="/beranda" className="nav-btn-portal" id="navCtaExplore">
            <i className="fa-solid fa-landmark"></i>
            <span>{t.nav.explore_museum}</span>
          </Link>
        </div>
      </header>

      <main className="landing-wrapper">
        {/* ====== HERO SECTION ====== */}
        <section className="landing-content" id="beranda">
          {/* Almamater Prestige Pill Tag */}
          <div className="landing-prestige-badge">
            <span className="badge-shimmer"></span>
            <i className="fa-solid fa-certificate"></i>
            <span>{t.hero.badge}</span>
          </div>

          <div className="landing-logo-container">
            <div className="logo-ring"></div>
            <div className="logo-ring-outer"></div>
            <Image
              src={getCms(cms, "landing_hero_image", "/images/logo-utuh.webp")}
              alt="Expedient Generation"
              width={190}
              height={190}
              priority
              className="logo-img"
              unoptimized={getCms(cms, "landing_hero_image", "/images/logo-utuh.webp").startsWith("data:")}
            />
          </div>

          <p className="landing-eyebrow">
            {locale === "id" ? getCms(cms, "landing_hero_eyebrow", t.hero.eyebrow) : t.hero.eyebrow}
          </p>

          <h1 className="landing-title">
            {locale === "id" ? getCms(cms, "landing_hero_title", t.hero.title) : t.hero.title}
          </h1>

          <p className="landing-subtitle">
            {locale === "id" ? getCms(cms, "landing_hero_subtitle", t.hero.subtitle) : t.hero.subtitle}
          </p>

          {/* Location Origin Anchor */}
          <div className="landing-origin-chip">
            <i className="fa-solid fa-location-dot"></i>
            <span>{t.hero.origin_loc}</span>
            <span className="origin-divider">•</span>
            <span className="origin-coords">{t.hero.origin_coords}</span>
            <span className="origin-divider">➔</span>
            <span className="origin-dest">{t.hero.origin_dest}</span>
          </div>

          {/* Action Button Group */}
          <div className="cta-group">
            <Link href="/beranda" className="btn-primary" id="ctaExplore">
              <i className="fa-solid fa-landmark"></i> {t.hero.cta_explore}
            </Link>
            <Link
              href="/download"
              className="btn-secondary btn-app-download"
              id="ctaDownload"
              title="Unduh Expedient Mobile App (.APK) untuk Android"
            >
              <i className="fa-brands fa-android"></i> {t.hero.cta_download}
            </Link>
            <Link href="/login" className="btn-secondary" id="ctaLogin" title="Khusus Anggota Alumni">
              <i className="fa-solid fa-circle-user"></i> {t.hero.cta_login}
            </Link>
          </div>

          {/* Key Facts Stats Counter Row */}
          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-number" id="counterAlumni">
                {totalAlumni || 240}
              </div>
              <div className="stat-label">{t.hero.stat_alumni_label}</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{t.hero.stat_grad_year}</div>
              <div className="stat-label">{t.hero.stat_grad_label}</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{t.hero.stat_gen_num}</div>
              <div className="stat-label">{t.hero.stat_gen_label}</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{t.hero.stat_ukhuwah_num}</div>
              <div className="stat-label">{t.hero.stat_ukhuwah_label}</div>
            </div>
          </div>

          <div className="scroll-hint">
            <span>{t.hero.scroll_hint}</span>
            <div className="scroll-line"></div>
          </div>
        </section>

        {/* ====== SECTION 1: ALMAMATER HERITAGE (BUMI SLAHUNG) ====== */}
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

        {/* ====== SECTION 2: THE PHILOSOPHY OF EXPEDIENT (IDENTITAS 43) ====== */}
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

        {/* ====== SECTION 3: BENTO GRID EKOSISTEM DIGITAL ====== */}
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

        {/* ====== SECTION 4: CALL TO ACTION ====== */}
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
            </div>

            <div className="footer-links-col">
              <h4>{t.footer.col1_title}</h4>
              <ul>
                <li><a href="#beranda">{t.footer.nav_home}</a></li>
                <li><a href="#almamater">{t.footer.nav_almamater}</a></li>
                <li><a href="#filosofi">{t.footer.nav_philosophy}</a></li>
                <li><a href="#ekosistem">{t.footer.nav_ecosystem}</a></li>
                <li><Link href="/radar">{t.footer.nav_radar}</Link></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4>{t.footer.col2_title}</h4>
              <ul>
                <li><Link href="/login">{t.footer.srv_member}</Link></li>
                <li><Link href="/sovereign">{t.footer.srv_kta}</Link></li>
                <li><Link href="/beranda">{t.footer.srv_museum}</Link></li>
                <li><Link href="/baitul-maal">{t.footer.srv_baitul}</Link></li>
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
    </>
  );
}

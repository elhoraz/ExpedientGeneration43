"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import ThemeToggle from "@/components/layout/ThemeToggle";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import TiltCard from "@/components/features/TiltCard";
import HeritageVideoPlayer from "@/components/features/HeritageVideoPlayer";

interface LandingContentProps {
  totalAlumni: number;
}

export default function LandingContent({ totalAlumni }: LandingContentProps) {
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
          <LanguageSwitcher />
          <ThemeToggle />
          <Link href="/login" className="nav-link" title="Ruang Anggota Khusus Alumni">
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
            <div className="landing-logo-pulse"></div>
            <Image
              src="/images/logo-utuh.webp"
              alt="Lambang Angkatan Expedient 43 Arrisalah"
              width={160}
              height={160}
              priority
              className="landing-emblem-img"
            />
          </div>

          <h1 className="landing-title">
            {t.hero.title_prefix}{" "}
            <span className="title-highlight">{t.hero.title_highlight}</span>
          </h1>

          <p className="landing-subtitle">
            {t.hero.subtitle}
          </p>

          <div className="landing-cta-group">
            <Link href="/beranda" className="btn-expedient-primary" id="btnExplore">
              <span className="btn-beam"></span>
              <i className="fa-solid fa-compass"></i>
              <span>{t.hero.cta_primary}</span>
              <i className="fa-solid fa-arrow-right"></i>
            </Link>

            <Link href="/login" className="btn-expedient-secondary" id="btnLogin">
              <i className="fa-solid fa-lock"></i>
              <span>{t.hero.cta_secondary}</span>
            </Link>
          </div>

          {/* Quick Cohort Stats Strip */}
          <div className="landing-stats-grid">
            <div className="stat-card">
              <div className="stat-icon"><i className="fa-solid fa-layer-group"></i></div>
              <div className="stat-data">
                <span className="stat-num">{t.hero.stat_cohort_val}</span>
                <span className="stat-label">{t.hero.stat_cohort_label}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon"><i className="fa-solid fa-users"></i></div>
              <div className="stat-data">
                <span className="stat-num">{totalAlumni || 240}+</span>
                <span className="stat-label">{t.hero.stat_alumni_label}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon"><i className="fa-solid fa-book-quran"></i></div>
              <div className="stat-data">
                <span className="stat-num">{t.hero.stat_curriculum_val}</span>
                <span className="stat-label">{t.hero.stat_curriculum_label}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon"><i className="fa-solid fa-earth-asia"></i></div>
              <div className="stat-data">
                <span className="stat-num">{t.hero.stat_status_val}</span>
                <span className="stat-label">{t.hero.stat_status_label}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ====== SECTION 1: THE ALMAMATER HERITAGE ====== */}
        <section className="heritage-section" id="almamater">
          <div className="section-header">
            <p className="section-eyebrow">{t.almamater.eyebrow}</p>
            <h2 className="section-title">{t.almamater.title}</h2>
          </div>

          <div className="heritage-quote-banner">
            <div className="quote-mark">&ldquo;</div>
            <p className="quote-body">
              {t.almamater.desc_quote}
            </p>
          </div>

          <div className="heritage-pillars-grid">
            <TiltCard className="pillar-card">
              <div className="pillar-icon">
                <i className="fa-solid fa-monument"></i>
              </div>
              <h3 className="pillar-title">{t.almamater.p1_title}</h3>
              <p className="pillar-desc">{t.almamater.p1_desc}</p>
              <div className="pillar-badge">Est. 1982 • Peresmian 1985</div>
            </TiltCard>

            <TiltCard className="pillar-card">
              <div className="pillar-icon">
                <i className="fa-solid fa-earth-americas"></i>
              </div>
              <h3 className="pillar-title">{t.almamater.p2_title}</h3>
              <p className="pillar-desc">{t.almamater.p2_desc}</p>
              <div className="pillar-badge">Bilingual Immersion</div>
            </TiltCard>

            <TiltCard className="pillar-card">
              <div className="pillar-icon">
                <i className="fa-solid fa-graduation-cap"></i>
              </div>
              <h3 className="pillar-title">{t.almamater.p3_title}</h3>
              <p className="pillar-desc">{t.almamater.p3_desc}</p>
              <div className="pillar-badge">Kurikulum KMI Gontori</div>
            </TiltCard>

            <TiltCard className="pillar-card pillar-card-highlight">
              <div className="pillar-icon">
                <i className="fa-solid fa-hand-holding-heart"></i>
              </div>
              <h3 className="pillar-title">{t.almamater.pillar_title}</h3>
              <p className="pillar-desc">{t.almamater.pillar_desc}</p>
              <div className="pillar-badge">{t.almamater.pillar_badge}</div>
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
            <p className="epigraph-body">{t.philosophy.epigraph_body}</p>
            <div className="epigraph-footer">
              <span className="epigraph-author">{t.philosophy.epigraph_author}</span>
              <span className="epigraph-badge">{t.philosophy.epigraph_badge}</span>
            </div>
          </div>

          {/* 3 Pillars of the Emblem */}
          <div className="philosophy-grid">
            <TiltCard className="philo-card">
              <div className="philo-icon-wrap icon-gold">
                <i className="fa-solid fa-location-crosshairs"></i>
              </div>
              <h3 className="philo-title">{t.philosophy.c1_title}</h3>
              <p className="philo-desc">{t.philosophy.c1_desc}</p>
            </TiltCard>

            <TiltCard className="philo-card">
              <div className="philo-icon-wrap icon-cyan">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <h3 className="philo-title">{t.philosophy.c2_title}</h3>
              <p className="philo-desc">{t.philosophy.c2_desc}</p>
            </TiltCard>

            <TiltCard className="philo-card">
              <div className="philo-icon-wrap icon-purple">
                <i className="fa-solid fa-feather-pointed"></i>
              </div>
              <h3 className="philo-title">{t.philosophy.c3_title}</h3>
              <p className="philo-desc">{t.philosophy.c3_desc}</p>
            </TiltCard>
          </div>

          {/* Emblem Metadata Strip */}
          <div className="emblem-meta-strip">
            <div className="meta-strip-item">
              <span className="meta-label">{t.philosophy.meta_batch_label}</span>
              <span className="meta-val">{t.philosophy.meta_batch_val}</span>
            </div>
            <div className="meta-divider"></div>
            <div className="meta-strip-item">
              <span className="meta-label">{t.philosophy.meta_motto_label}</span>
              <span className="meta-val">{t.philosophy.meta_motto_val}</span>
            </div>
            <div className="meta-divider"></div>
            <div className="meta-strip-item">
              <span className="meta-label">{t.philosophy.meta_campus_label}</span>
              <span className="meta-val">{t.philosophy.meta_campus_val}</span>
            </div>
          </div>
        </section>

        {/* ====== SECTION 3: THE DIGITAL ECOSYSTEM (FITUR INTEGRAL) ====== */}
        <section className="ecosystem-section" id="ekosistem">
          <div className="section-header">
            <p className="section-eyebrow">{t.ecosystem.eyebrow}</p>
            <h2 className="section-title">{t.ecosystem.title}</h2>
            <p className="section-desc">{t.ecosystem.desc}</p>
          </div>

          <div className="features-showcase-grid">
            <TiltCard className="feature-cell">
              <div className="cell-glow glow-gold"></div>
              <div className="cell-icon"><i className="fa-solid fa-monument"></i></div>
              <div className="cell-content">
                <h3 className="cell-title">{t.ecosystem.item_museum_title}</h3>
                <p className="cell-desc">{t.ecosystem.item_museum_desc}</p>
                <Link href="/beranda" className="cell-link">
                  <span>{t.nav.explore_museum}</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </TiltCard>

            <TiltCard className="feature-cell">
              <div className="cell-glow glow-cyan"></div>
              <div className="cell-icon"><i className="fa-solid fa-address-book"></i></div>
              <div className="cell-content">
                <h3 className="cell-title">{t.ecosystem.item_dir_title}</h3>
                <p className="cell-desc">{t.ecosystem.item_dir_desc}</p>
                <Link href="/direktori" className="cell-link">
                  <span>{t.sidebar.directory}</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </TiltCard>

            <TiltCard className="feature-cell">
              <div className="cell-glow glow-blue"></div>
              <div className="cell-icon"><i className="fa-solid fa-map-location-dot"></i></div>
              <div className="cell-content">
                <h3 className="cell-title">{t.ecosystem.item_radar_title}</h3>
                <p className="cell-desc">{t.ecosystem.item_radar_desc}</p>
                <Link href="/radar" className="cell-link">
                  <span>{t.nav.radar}</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </TiltCard>

            <TiltCard className="feature-cell">
              <div className="cell-glow glow-purple"></div>
              <div className="cell-icon"><i className="fa-solid fa-vault"></i></div>
              <div className="cell-content">
                <h3 className="cell-title">{t.ecosystem.item_vault_title}</h3>
                <p className="cell-desc">{t.ecosystem.item_vault_desc}</p>
                <Link href="/galeri" className="cell-link">
                  <span>{t.sidebar.gallery}</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </TiltCard>

            <TiltCard className="feature-cell">
              <div className="cell-glow glow-emerald"></div>
              <div className="cell-icon"><i className="fa-solid fa-comments"></i></div>
              <div className="cell-content">
                <h3 className="cell-title">{t.ecosystem.item_forum_title}</h3>
                <p className="cell-desc">{t.ecosystem.item_forum_desc}</p>
                <Link href="/forum" className="cell-link">
                  <span>{t.sidebar.forum}</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </TiltCard>

            <TiltCard className="feature-cell">
              <div className="cell-glow glow-amber"></div>
              <div className="cell-icon"><i className="fa-solid fa-id-card-clip"></i></div>
              <div className="cell-content">
                <h3 className="cell-title">{t.ecosystem.item_kta_title}</h3>
                <p className="cell-desc">{t.ecosystem.item_kta_desc}</p>
                <Link href="/sovereign" className="cell-link">
                  <span>{t.sidebar.kta}</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </TiltCard>
          </div>
        </section>

        {/* ====== SECTION 4: CALL TO ACTION BANNER ====== */}
        <section className="landing-cta-banner">
          <div className="cta-banner-card">
            <div className="cta-banner-glow"></div>
            <div className="cta-banner-content">
              <h2 className="cta-title">{t.cta.title}</h2>
              <p className="cta-desc">{t.cta.desc}</p>
              <div className="cta-actions">
                <Link href="/beranda" className="btn-cta-gold">
                  <i className="fa-solid fa-landmark"></i>
                  <span>{t.cta.btn_museum}</span>
                </Link>
                <Link href="/login" className="btn-cta-ghost">
                  <i className="fa-solid fa-arrow-right-to-bracket"></i>
                  <span>{t.cta.btn_login}</span>
                </Link>
                <a
                  href={shareWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-cta-wa"
                  title="Bagikan Tautan Website ke Grup WhatsApp Angkatan"
                >
                  <i className="fa-brands fa-whatsapp"></i>
                  <span>{t.cta.btn_share_wa}</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ====== FOOTER ====== */}
        <footer className="landing-footer">
          <div className="footer-content">
            <div className="footer-brand">
              <Image
                src="/images/logo-utuh.webp"
                alt="Logo Expedient 43"
                width={36}
                height={36}
                className="footer-logo"
              />
              <span className="footer-brand-name">EXPEDIENT 43</span>
            </div>
            <p className="footer-motto">{t.footer.desc}</p>
            <div className="footer-bottom">
              <span className="footer-copy">
                &copy; {currentYear} {t.footer.rights}
              </span>
              <span className="footer-tagline">
                <em>&ldquo;{t.footer.tagline}&rdquo;</em>
              </span>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

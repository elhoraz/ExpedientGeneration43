import Link from "next/link";
import "./landing.css";
import { sanitizeHtml } from "@/lib/sanitize";
import ThemeToggle from "@/components/layout/ThemeToggle";
import TiltCard from "@/components/features/TiltCard";

import { createClient } from "@/lib/supabase/server";

// Helper function to get content from array
function getCms(contents: any[], key: string, defaultValue: string) {
  const item = contents.find((c: any) => c.content_key === key);
  return item ? item.content_value : defaultValue;
}

export default async function LandingPage() {
  const supabase = await createClient();
  
  // Fetch dynamic CMS content
  const { data: siteContents } = await supabase.from('site_content').select('*').like('content_key', 'landing_%');
  const cms = siteContents || [];

  const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const totalAlumni = count || 0;
  const currentYear = new Date().getFullYear();

  return (
    <>
      <ThemeToggle />

      <main className="landing-wrapper">
        {/* ====== HERO SECTION ====== */}
        <section className="landing-content">
          <div className="landing-logo-container">
            <div className="logo-ring"></div>
            <img
              src={getCms(cms, 'landing_hero_image', '/images/logo-utuh.webp')}
              alt="Expedient Generation"
              className="logo-img"
            />
          </div>

          <p className="landing-eyebrow">{getCms(cms, 'landing_hero_eyebrow', '42nd Pondok Modern Arrisalah')}</p>
          <h1 className="landing-title">{getCms(cms, 'landing_hero_title', 'Expedient Generation')}</h1>
          <p className="landing-subtitle">
            {getCms(cms, 'landing_hero_subtitle', 'Museum digital eksklusif dan platform komunitas alumni angkatan ke-42. Menjaga warisan, membangun masa depan, mempersatukan barisan.')}
          </p>

          <div className="cta-group">
            <Link href="/login" className="btn-primary" id="ctaLogin">
              <i className="fa-solid fa-right-to-bracket"></i> Masuk ke Portal
            </Link>
            <Link href="/beranda" className="btn-secondary" id="ctaExplore">
              <i className="fa-solid fa-compass"></i> Jelajahi Museum
            </Link>
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-number" id="counterAlumni">
                {totalAlumni}
              </div>
              <div className="stat-label">Entitas</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">2025</div>
              <div className="stat-label">Tahun Kebangkitan</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">12</div>
              <div className="stat-label">Modul VVIP</div>
            </div>
          </div>

          <div className="scroll-hint">
            <span>Gulir</span>
            <div className="scroll-line"></div>
          </div>
        </section>

        {/* ====== ABOUT SECTION ====== */}
        <section className="about-section">
          <p className="about-eyebrow">{getCms(cms, 'landing_about_eyebrow', 'Tentang Kami')}</p>
          <h2 className="about-title">{getCms(cms, 'landing_about_title', 'Kami Bukan Sekadar Angkatan')}</h2>
          <div className="about-text" dangerouslySetInnerHTML={{
             __html: sanitizeHtml(getCms(cms, 'landing_about_text', '<p>Kami adalah barisan pelopor yang lahir dari rahim Arrisalah, dibentuk oleh waktu, dipersatukan oleh takdir. Platform ini adalah monumen digital untuk menjaga silaturahmi, mendokumentasikan jejak langkah, dan membangun masa depan bersama.</p>'))
          }}>
          </div>

          <div className="about-features">
            <TiltCard className="feature-card">
              <div className="feature-icon">
                <i className="fa-solid fa-landmark"></i>
              </div>
              <div className="feature-title">Museum Interaktif</div>
              <div className="feature-desc">
                Beranda dengan galeri kenangan, timeline sejarah, dan arsip
                angkatan.
              </div>
            </TiltCard>
            <TiltCard className="feature-card">
              <div className="feature-icon">
                <i className="fa-solid fa-earth-americas"></i>
              </div>
              <div className="feature-title">Global Radar</div>
              <div className="feature-desc">
                Peta 3D persebaran alumni di seluruh Indonesia dan dunia.
              </div>
            </TiltCard>
            <TiltCard className="feature-card">
              <div className="feature-icon">
                <i className="fa-solid fa-id-card"></i>
              </div>
              <div className="feature-title">Sovereign ID</div>
              <div className="feature-desc">
                Kartu identitas VVIP 3D dengan teknologi Three.js dan WebAuthn.
              </div>
            </TiltCard>
            <TiltCard className="feature-card">
              <div className="feature-icon">
                <i className="fa-solid fa-gem"></i>
              </div>
              <div className="feature-title">12 Modul VVIP</div>
              <div className="feature-desc">
                Oracle Vision, Enigma Vault, Celestial Codex, dan banyak lagi.
              </div>
            </TiltCard>
          </div>
        </section>

        {/* ====== FOOTER ====== */}
        <footer className="landing-footer">
          &copy; {currentYear} {getCms(cms, 'landing_footer_text', 'Expedient Generation — 42nd Pondok Modern Arrisalah')}
        </footer>
      </main>
    </>
  );
}

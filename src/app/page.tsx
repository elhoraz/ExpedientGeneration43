import Image from "next/image";
import Link from "next/link";
import "./landing.css";
import { sanitizeHtml } from "@/lib/sanitize";
import ThemeToggle from "@/components/layout/ThemeToggle";
import TiltCard from "@/components/features/TiltCard";
import HeritageVideoPlayer from "@/components/features/HeritageVideoPlayer";
import { createClient } from "@/lib/supabase/server";

// Helper function to get content from CMS array
function getCms(contents: any[], key: string, defaultValue: string) {
  const item = contents.find((c: any) => c.content_key === key);
  return item ? item.content_value : defaultValue;
}

export default async function LandingPage() {
  const supabase = await createClient();

  // Fetch dynamic CMS content
  const { data: siteContents } = await supabase
    .from("site_content")
    .select("*")
    .like("content_key", "landing_%");
  const cms = siteContents || [];

  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });
  const totalAlumni = count || 0;
  const currentYear = new Date().getFullYear();

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
            <span className="brand-subtitle">ARRISALAH SLAHUNG</span>
          </div>
        </Link>

        <nav className="nav-links">
          <a href="#almamater" className="nav-link">Almamater</a>
          <a href="#filosofi" className="nav-link">Filosofi</a>
          <a href="#ekosistem" className="nav-link">Ekosistem</a>
          <Link href="/radar" className="nav-link nav-link-highlight">
            <i className="fa-solid fa-map-location-dot"></i> Radar Peta
          </Link>
        </nav>

        <div className="nav-actions">
          <ThemeToggle />
          <Link href="/login" className="nav-link" title="Ruang Anggota Khusus Alumni">
            <i className="fa-solid fa-circle-user"></i>
            <span>Masuk</span>
          </Link>
          <Link href="/beranda" className="nav-btn-portal" id="navCtaExplore">
            <i className="fa-solid fa-landmark"></i>
            <span>Jelajahi Museum</span>
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
            <span>43RD COHORT • PONDOK MODERN ARRISALAH PROGRAM INTERNASIONAL</span>
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
            {getCms(cms, "landing_hero_eyebrow", "PONDOK MODERN ARRISALAH SLAHUNG PONOROGO")}
          </p>

          <h1 className="landing-title">
            {getCms(cms, "landing_hero_title", "Expedient Generation")}
          </h1>

          <p className="landing-subtitle">
            {getCms(
              cms,
              "landing_hero_subtitle",
              "Mahakarya digital dan wadah persatuan alumni angkatan ke-43 Pondok Modern Arrisalah Slahung Ponorogo. Dari kawah candradimuka pesantren melangkah menatap masa depan peradaban dunia."
            )}
          </p>

          {/* Location Origin Anchor */}
          <div className="landing-origin-chip">
            <i className="fa-solid fa-location-dot"></i>
            <span>Slahung, Ponorogo, Jawa Timur</span>
            <span className="origin-divider">•</span>
            <span className="origin-coords">-8.0358° LS, 111.4145° BT</span>
            <span className="origin-divider">➔</span>
            <span className="origin-dest">Tersebar ke Seluruh Dunia</span>
          </div>

          {/* Action Button Group */}
          <div className="cta-group">
            <Link href="/beranda" className="btn-primary" id="ctaExplore">
              <i className="fa-solid fa-landmark"></i> Jelajahi Museum
            </Link>
            <Link
              href="/download"
              className="btn-secondary btn-app-download"
              id="ctaDownload"
              title="Unduh Expedient Mobile App (.APK) untuk Android"
            >
              <i className="fa-brands fa-android"></i> Download App Mobile
            </Link>
            <Link href="/login" className="btn-secondary" id="ctaLogin" title="Khusus Anggota Alumni">
              <i className="fa-solid fa-circle-user"></i> Ruang Anggota
            </Link>
          </div>

          {/* Key Facts Stats Counter Row */}
          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-number" id="counterAlumni">
                {totalAlumni}
              </div>
              <div className="stat-label">Alumni Terdata</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">2025</div>
              <div className="stat-label">Tahun Kelulusan</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">43</div>
              <div className="stat-label">Generasi Bersejarah</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">100%</div>
              <div className="stat-label">Ukhuwah Digital</div>
            </div>
          </div>

          <div className="scroll-hint">
            <span>Telusuri Warisan</span>
            <div className="scroll-line"></div>
          </div>
        </section>

        {/* ====== SECTION 1: ALMAMATER HERITAGE (BUMI SLAHUNG) ====== */}
        <section className="heritage-section" id="almamater">
          <div className="section-header">
            <p className="section-eyebrow">SEJARAH &amp; SANAD KEILMUAN</p>
            <h2 className="section-title">
              Lahir dari Rahim Pondok Modern Arrisalah
            </h2>
            <p className="section-lead">
              Dirintis pada tahun 1982 oleh <strong>Drs. KH. Muhammad Ma&apos;shum Yusuf bin Taslim</strong> (Alumnus KMI Pondok Modern Darussalam Gontor) dan diresmikan langsung oleh <strong>KH. Imam Zarkasyi</strong> (Trimurti Pendiri Gontor) pada 26 Februari 1985 dengan nama awal <em>&ldquo;Madinatul Thullab&rdquo;</em> di Desa Gundik, Slahung, Ponorogo. Saat ini kepengasuhan dilanjutkan dengan penuh amanah oleh putra sulung beliau, <strong>KH. Muhammad Azharullah, Lc</strong>.
            </p>
          </div>

          <div className="heritage-pillars-grid">
            <TiltCard className="pillar-card">
              <div className="pillar-icon-wrap">
                <i className="fa-solid fa-globe"></i>
              </div>
              <h3 className="pillar-title">Program Internasional &amp; Dwi Bahasa</h3>
              <p className="pillar-desc">
                Sejak di kawah candradimuka Arrisalah, santri ditempa dengan pembiasaan aktif Bahasa Arab dan Bahasa Inggris sebagai bahasa percakapan harian dan pengantar keilmuan, siap berkiprah di kancah global.
              </p>
              <div className="pillar-badge">Bilingual Fluency</div>
            </TiltCard>

            <TiltCard className="pillar-card">
              <div className="pillar-icon-wrap">
                <i className="fa-solid fa-microchip"></i>
              </div>
              <h3 className="pillar-title">Pelopor Tepat Teknologi Pesantren</h3>
              <p className="pillar-desc">
                Melalui wadah OPTTI (Organisasi Pelajar Pesantren Tepat Teknologi Islam), santri Arrisalah sejak awal diwajibkan menguasai komputasi, sains terapan, dan inovasi digital tanpa menanggalkan adab santri.
              </p>
              <div className="pillar-badge">Techno-Savvy Santri</div>
            </TiltCard>

            <TiltCard className="pillar-card">
              <div className="pillar-icon-wrap">
                <i className="fa-solid fa-mosque"></i>
              </div>
              <h3 className="pillar-title">Panca Jiwa &amp; Falsafah Luhur</h3>
              <p className="pillar-desc">
                Berpijak teguh pada lima pilar: <em>Keikhlasan, Kesederhanaan, Berdikari (Self-Reliance), Ukhuwah Islamiyah,</em> dan <em>Kebebasan Berpikir</em> yang tertanam seumur hidup dalam setiap derap langkah alumni.
              </p>
              <div className="pillar-badge">Panca Jiwa Arrisalah</div>
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
            <p className="section-eyebrow">IDENTITAS &amp; EMBLEM RESMI</p>
            <h2 className="section-title">Mengapa Kami Bernama &ldquo;Expedient&rdquo;?</h2>
          </div>

          {/* Grand Epigraph Banner */}
          <div className="epigraph-card">
            <div className="epigraph-quote-mark">&ldquo;</div>
            <blockquote className="epigraph-text">
              Kami bukan sekadar angkatan.<br className="desktop-br" />
              Kami adalah <span className="highlight-gold">barisan pelopor</span> yang lahir dari rahim Arrisalah,<br className="desktop-br" />
              dibentuk oleh waktu di bumi Slahung, dipersatukan oleh takdir untuk kejayaan peradaban.
            </blockquote>
            <div className="epigraph-author">
              ✦ MAJELIS KEHORMATAN EXPEDIENT GENERATION 43 ✦
            </div>
          </div>

          <div className="philosophy-cards-row">
            <div className="philo-card">
              <div className="philo-icon">
                <i className="fa-solid fa-bolt-lightning"></i>
              </div>
              <h3 className="philo-title">Makna Nama &ldquo;Expedient&rdquo;</h3>
              <p className="philo-desc">
                Secara terminologi, <strong>Expedient</strong> bermakna tangkas, solutif, tepat guna, dan bertindak cepat. Sebagai alumni ke-43 yang resmi lulus pada tahun 2025, nama ini adalah ikrar bahwa kami hadir sebagai pemecah kebuntuan zaman, mandiri, dan berani memimpin perubahan di manapun kami berada.
              </p>
            </div>

            <div className="philo-card">
              <div className="philo-icon">
                <i className="fa-solid fa-ring"></i>
              </div>
              <h3 className="philo-title">Kelopak Blue Marble &amp; List Emas</h3>
              <p className="philo-desc">
                Logo resmi Expedient mengadopsi rona <em>Blue Marble</em> (potret bumi utuh pertama 1972) yang dilingkari list emas murni. Menjadi simbol amanah ilahiah memakmurkan bumi (QS. Al-Baqarah: 56) dan memelihara risalah Nabi Muhammad SAW sebagai duta yang amat berharga.
              </p>
            </div>
          </div>
        </section>

        {/* ====== SECTION 3: BENTO GRID EKOSISTEM DIGITAL ====== */}
        <section className="bento-section" id="ekosistem">
          <div className="section-header">
            <p className="section-eyebrow">INOVASI DIGITAL GENERASI 43</p>
            <h2 className="section-title">Mahakarya Ekosistem Terpadu</h2>
            <p className="section-lead">
              Platform modern berstandar internasional yang menghubungkan seluruh aspek kehidupan alumni dalam satu genggaman.
            </p>
          </div>

          <div className="bento-grid">
            {/* Bento 1: Radar Alumni (Wide Card) */}
            <div className="bento-card bento-wide">
              <div className="bento-badge">
                <span className="radar-live-dot"></span>
                <span>RADAR PERSEBARAN REALTIME</span>
              </div>
              <div className="bento-content">
                <h3 className="bento-title">Peta Persebaran Alumni Interaktif</h3>
                <p className="bento-desc">
                  Memantau titik persebaran seluruh alumni Angkatan 43 dari episentrum Slahung Ponorogo hingga ke berbagai kota, kampus ternama, dan negara di seluruh penjuru bumi secara akurat.
                </p>
                <div className="bento-meta-strip">
                  <span><i className="fa-solid fa-satellite"></i> Flat Map &amp; 3D Globe Engine</span>
                  <span><i className="fa-solid fa-location-crosshairs"></i> GPS Geolocation</span>
                </div>
              </div>
              <div className="bento-action">
                <Link href="/radar" className="bento-link">
                  Buka Radar Peta <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </div>

            {/* Bento 2: Sovereign 3D KTA */}
            <TiltCard className="bento-card">
              <div className="bento-badge">
                <i className="fa-solid fa-cube"></i>
                <span>THREE.JS WEBGL</span>
              </div>
              <div className="bento-content">
                <h3 className="bento-title">The Sovereign: KTA 3D &amp; Hologram</h3>
                <p className="bento-desc">
                  Kartu Tanda Alumni 3D digital interaktif berstandar VVIP dengan sensor giroskopik, kode QR terenkripsi, dan mode Hologram Lite.
                </p>
              </div>
              <div className="bento-action">
                <Link href="/sovereign" className="bento-link">
                  Lihat Sovereign <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </TiltCard>

            {/* Bento 3: Museum Digital */}
            <TiltCard className="bento-card">
              <div className="bento-badge">
                <i className="fa-solid fa-landmark"></i>
              </div>
              <div className="bento-content">
                <h3 className="bento-title">The Vault &amp; Lorong Kenangan</h3>
                <p className="bento-desc">
                  Museum digital yang mengabadikan ribuan arsip kenangan, timeline sejarah perjuangan 6 tahun di pondok, serta manuskrip angkatan.
                </p>
              </div>
              <div className="bento-action">
                <Link href="/beranda" className="bento-link">
                  Jelajahi Museum <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </TiltCard>

            {/* Bento 4: Baitul Maal & Sinergi */}
            <TiltCard className="bento-card">
              <div className="bento-badge">
                <i className="fa-solid fa-hand-holding-dollar"></i>
              </div>
              <div className="bento-content">
                <h3 className="bento-title">Baitul Maal &amp; Direktori Bisnis</h3>
                <p className="bento-desc">
                  Lumbung gotong royong filantropi ukhuwah, program sosial alumni, serta etalase katalog bisnis mandiri untuk kemandirian ekonomi.
                </p>
              </div>
              <div className="bento-action">
                <Link href="/baitul-maal" className="bento-link">
                  Kunjungi Baitul Maal <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </TiltCard>

            {/* Bento 5: Audio Lounge & Realtime */}
            <TiltCard className="bento-card">
              <div className="bento-badge">
                <i className="fa-solid fa-headphones"></i>
              </div>
              <div className="bento-content">
                <h3 className="bento-title">The Lounge &amp; Voice Room</h3>
                <p className="bento-desc">
                  Ruang temu audio langsung bertenaga Agora RTC untuk majlis temu kangen, diskusi ilmiah, dan siaran pengumuman angkatan.
                </p>
              </div>
              <div className="bento-action">
                <Link href="/chat/lounge" className="bento-link">
                  Kunjungi Lounge <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </TiltCard>
          </div>
        </section>

        {/* ====== SECTION 4: CALL TO ACTION ====== */}
        <section className="cta-banner-section">
          <div className="cta-banner-box">
            <div className="cta-glow-circle"></div>
            <p className="cta-banner-eyebrow">IKATAN PERSAUDARAAN ABADI</p>
            <h2 className="cta-banner-title">
              Tautkan Langkah, Bersatu untuk Risalah
            </h2>
            <p className="cta-banner-desc">
              Bagi seluruh alumni Angkatan ke-43 Pondok Modern Arrisalah Slahung Ponorogo di manapun Anda berada, pintu gerbang penjelajahan digital Anda telah siap.
            </p>
            <div className="cta-banner-buttons">
              <Link href="/beranda" className="btn-primary">
                <i className="fa-solid fa-landmark"></i> Jelajahi Museum Sekarang
              </Link>
              <Link href="/login" className="btn-secondary">
                <i className="fa-solid fa-circle-user"></i> Ruang Anggota
              </Link>
              <Link href="/download" className="btn-secondary">
                <i className="fa-brands fa-android"></i> Pasang Aplikasi Android
              </Link>
              <a
                href="https://api.whatsapp.com/send?text=Assalamu%27alaikum%20sahabat%20alumni%20Expedient%2043!%20Mari%20buka%20dan%20jelajahi%20mahakarya%20museum%20digital%20angkatan%20kita%20Pondok%20Modern%20Arrisalah%20Slahung%20di%3A%20https%3A%2F%2Fexpedientgeneration.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary btn-share-wa"
                title="Sebarkan Tautan ke Grup WhatsApp Alumni"
              >
                <i className="fa-brands fa-whatsapp"></i> Ajak Teman Angkatan
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
                  <div className="footer-brand-name">EXPEDIENT GENERATION</div>
                  <div className="footer-brand-sub">ANGKATAN KE-43 ARRISALAH</div>
                </div>
              </div>
              <p className="footer-address">
                <strong>Pondok Modern Arrisalah Program Internasional</strong><br />
                Desa Gundik, Kecamatan Slahung, Kabupaten Ponorogo, Jawa Timur 63463
              </p>
              <div className="footer-motto">
                <em>&ldquo;Berilmu Amaliah, Beramal Ilmiah, Berakhlakul Karimah&rdquo;</em>
              </div>
            </div>

            <div className="footer-links-col">
              <h4>Navigasi Utama</h4>
              <ul>
                <li><a href="#beranda">Beranda</a></li>
                <li><a href="#almamater">Sejarah Almamater</a></li>
                <li><a href="#filosofi">Filosofi Angkatan</a></li>
                <li><a href="#ekosistem">Ekosistem Fitur</a></li>
                <li><Link href="/radar">Radar Persebaran</Link></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4>Layanan Angkatan</h4>
              <ul>
                <li><Link href="/login">Ruang Anggota</Link></li>
                <li><Link href="/sovereign">KTA Digital 3D</Link></li>
                <li><Link href="/beranda">Museum &amp; Arsip</Link></li>
                <li><Link href="/baitul-maal">Baitul Maal</Link></li>
                <li><Link href="/download">Unduh APK Android</Link></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <div>
              &copy; {currentYear} {getCms(cms, "landing_footer_text", "Expedient Generation — 43rd Pondok Modern Arrisalah Program Internasional Slahung Ponorogo.")}
            </div>
            <div className="footer-meta-links">
              <Link href="/download">Unduh Aplikasi Mobile</Link>
              <span>•</span>
              <Link href="/delete-account">Kebijakan Privasi &amp; Hapus Akun</Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

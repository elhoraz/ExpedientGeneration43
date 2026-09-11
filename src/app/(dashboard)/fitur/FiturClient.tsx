"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import "./fitur.css";

export default function FiturClient() {
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    document.body.classList.add("page-fitur");
    const savedScroll = sessionStorage.getItem('vaultScrollPos');
    const mainWrapper = document.querySelector('.main-wrapper') as HTMLElement | null;

    // Simpan posisi scroll saat meninggalkan halaman
    const saveScroll = () => {
      if (mainWrapper) {
        sessionStorage.setItem('vaultScrollPos', String(mainWrapper.scrollTop));
      }
    };
    window.addEventListener('beforeunload', saveScroll);

    const isMobileDevice = typeof window !== 'undefined' && (
      window.innerWidth <= 768 ||
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
    );

    // GSAP context untuk mencegah animation glitch saat navigasi
    const ctx = gsap.context(() => {
      if (savedScroll && parseInt(savedScroll) > 0) {
        gsap.set(".dashboard-header", { opacity: 1, y: 0 });
        gsap.set(".premium-card", { opacity: 1, y: 0, rotationX: 0 });

        setTimeout(() => {
          if (mainWrapper) {
            mainWrapper.scrollTo({ top: parseInt(savedScroll), left: 0, behavior: 'instant' });
          }
        }, 100);
      } else if (isMobileDevice) {
        // Mobile-optimized: entrance ringan tanpa 3D rotationX & tanpa delay stagger panjang
        gsap.from(".dashboard-header", { opacity: 0, y: -20, duration: 0.5, ease: "power2.out", clearProps: "all" });
        gsap.from(".premium-card", {
          opacity: 0, y: 25, duration: 0.4,
          stagger: 0.03, ease: "power2.out", clearProps: "all"
        });
      } else {
        // Desktop cinematic entrance
        gsap.from(".dashboard-header", { opacity: 0, y: -40, duration: 1.2, ease: "expo.out", clearProps: "all" });
        gsap.from(".premium-card", {
          opacity: 0, y: 80, rotationX: -15, duration: 1.1,
          stagger: 0.1, ease: "back.out(1.4)", delay: 0.15, clearProps: "all"
        });
      }
    });

    // JS Tilt Effect (Hanya untuk Desktop / Mouse Pointer)
    const tiltCards = cardsRef.current;
    if (!isMobileDevice && window.innerWidth > 768) {
      tiltCards.forEach(card => {
        if (!card) return;

        const mouseMoveHandler = (e: MouseEvent) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          const centerX = rect.width / 2;
          const centerY = rect.height / 2;

          const rotateX = ((y - centerY) / centerY) * -12;
          const rotateY = ((x - centerX) / centerX) * 12;

          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
          card.style.transition = "none";
        };

        const mouseLeaveHandler = () => {
          card.style.transition = "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)";
          card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
        };

        card.addEventListener('mousemove', mouseMoveHandler);
        card.addEventListener('mouseleave', mouseLeaveHandler);
        
        (card as any)._mouseMoveHandler = mouseMoveHandler;
        (card as any)._mouseLeaveHandler = mouseLeaveHandler;
      });
    } else {
      // Pastikan di mobile tidak ada inline transform yang tertinggal
      tiltCards.forEach(card => {
        if (!card) return;
        card.style.transform = "none";
      });
    }

    return () => {
      document.body.classList.remove("page-fitur");
      saveScroll();
      window.removeEventListener('beforeunload', saveScroll);
      ctx.revert();
      
      tiltCards.forEach(card => {
        if (!card) return;
        card.removeEventListener('mousemove', (card as any)._mouseMoveHandler);
        card.removeEventListener('mouseleave', (card as any)._mouseLeaveHandler);
      });
    };
  }, []);

  return (
    <div className="vault-wrapper">
      <div className="features-dashboard" id="featuresDashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">{t.fitur.title}</h1>
          <p className="dashboard-subtitle">{t.fitur.subtitle}</p>
        </div>

        <div className="cinematic-grid">
          {/* Photobooth Studio */}
          <Link href="/photobooth" className="premium-card js-tilt-card" ref={el => { cardsRef.current[16] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=2564&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-camera-retro card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">{t.fitur.photobooth_title}</h3>
              <p className="card-desc">{t.fitur.photobooth_desc}</p>
              <div className="launch-btn">{t.fitur.photobooth_btn} <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 1. Kartu Alumni (KTA 3D) */}
          <Link href="/sovereign" className="premium-card js-tilt-card" ref={el => { cardsRef.current[0] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-id-card card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">{t.fitur.kta_title}</h3>
              <p className="card-desc">{t.fitur.kta_desc}</p>
              <div className="launch-btn">{t.fitur.kta_btn} <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 2. Pindai QR Kontak */}
          <Link href="/scanner" className="premium-card js-tilt-card" ref={el => { cardsRef.current[1] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-qrcode card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">{t.fitur.scanner_title}</h3>
              <p className="card-desc">{t.fitur.scanner_desc}</p>
              <div className="launch-btn">{t.fitur.scanner_btn} <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 3. Kotak Pesan & Wasiat */}
          <Link href="/wasiat" className="premium-card js-tilt-card" ref={el => { cardsRef.current[2] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1614064641913-a520f596a247?q=80&w=2574&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-scroll card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">{t.fitur.wasiat_title}</h3>
              <p className="card-desc">{t.fitur.wasiat_desc}</p>
              <div className="launch-btn">{t.fitur.wasiat_btn} <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 4. Kas & Donasi (Baitul Maal) */}
          <Link href="/baitul-maal" className="premium-card js-tilt-card" ref={el => { cardsRef.current[3] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1579621970795-87facc2f976d?q=80&w=2670&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-hand-holding-dollar card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">{t.fitur.baitul_title}</h3>
              <p className="card-desc">{t.fitur.baitul_desc}</p>
              <div className="launch-btn">{t.fitur.baitul_btn} <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 5. Majlis Kajian & Suara */}
          <Link href="/majlis" className="premium-card js-tilt-card" ref={el => { cardsRef.current[4] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1594954002661-8f55fc15d7de?q=80&w=2670&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-microphone-lines card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">{t.fitur.majlis_title}</h3>
              <p className="card-desc">{t.fitur.majlis_desc}</p>
              <div className="launch-btn">{t.fitur.majlis_btn} <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 6. Jejaring Karir & Usaha */}
          <Link href="/tarbiyah" className="premium-card js-tilt-card" ref={el => { cardsRef.current[5] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556761175-5973dc0f32b7?q=80&w=2532&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-handshake-angle card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">{t.fitur.tarbiyah_title}</h3>
              <p className="card-desc">{t.fitur.tarbiyah_desc}</p>
              <div className="launch-btn">{t.fitur.tarbiyah_btn} <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 7. Kamera Aura Positif */}
          <Link href="/oracle" className="premium-card js-tilt-card" ref={el => { cardsRef.current[6] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2565&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-camera card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">Kamera Aura Positif</h3>
              <p className="card-desc">Fitur kamera interaktif untuk mendeteksi ekspresi wajah dan membagikan kutipan semangat persaudaraan.</p>
              <div className="launch-btn">Mulai Kamera <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 8. Agenda Acara & Dinding Doa */}
          <Link href="/multazam" className="premium-card js-tilt-card" ref={el => { cardsRef.current[7] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542642510-48227b613eec?q=80&w=2670&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-kaaba card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">{t.fitur.multazam_title}</h3>
              <p className="card-desc">{t.fitur.multazam_desc}</p>
              <div className="launch-btn">{t.fitur.multazam_btn} <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 9. Ruang Dzikir & Ketenangan */}
          <Link href="/kontemplasi" className="premium-card js-tilt-card" ref={el => { cardsRef.current[8] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=2574&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-spa card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">{t.fitur.kontemplasi_title}</h3>
              <p className="card-desc">{t.fitur.kontemplasi_desc}</p>
              <div className="launch-btn">{t.fitur.kontemplasi_btn} <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 10. Mutiara Hikmah & Nasihat */}
          <Link href="/celestial" className="premium-card js-tilt-card" ref={el => { cardsRef.current[9] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=2670&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-star card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">{t.fitur.celestial_title}</h3>
              <p className="card-desc">{t.fitur.celestial_desc}</p>
              <div className="launch-btn">{t.fitur.celestial_btn} <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 11. Ayat & Refleksi Harian */}
          <Link href="/divine" className="premium-card js-tilt-card" ref={el => { cardsRef.current[10] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1606836109968-3e4b37be8079?q=80&w=2574&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-book-open card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">Ayat &amp; Refleksi Harian</h3>
              <p className="card-desc">Tadabbur ayat-ayat suci Al-Qur'an dan hadits pilihan harian sebagai pedoman moral dan bekal amal shalih.</p>
              <div className="launch-btn">Resapi Ayat <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 12. Catatan Kenangan Pribadi */}
          <Link href="/enigma" className="premium-card js-tilt-card" ref={el => { cardsRef.current[11] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-book-bookmark card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">Catatan Kenangan Pribadi</h3>
              <p className="card-desc">Buku catatan pribadi yang aman. Simpan kenangan masa nyantri, catatan perjalanan, dan resolusi masa depan Anda.</p>
              <div className="launch-btn">Buka Catatan <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 13. Sejarah & Filosofi Angkatan */}
          <Link href="/genesis" className="premium-card js-tilt-card" ref={el => { cardsRef.current[12] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-landmark card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">{t.fitur.genesis_title}</h3>
              <p className="card-desc">{t.fitur.genesis_desc}</p>
              <div className="launch-btn">{t.fitur.genesis_btn} <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 14. Pencocok Minat & Domisili */}
          <Link href="/nexus" className="premium-card js-tilt-card special-nexus-card" ref={el => { cardsRef.current[13] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-network-wired card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">{t.fitur.nexus_title}</h3>
              <p className="card-desc">{t.fitur.nexus_desc}</p>
              <div className="launch-btn">{t.fitur.nexus_btn} <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 15. Jadwal Acara & Reuni */}
          <Link href="/event" className="premium-card js-tilt-card" ref={el => { cardsRef.current[14] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2670&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-calendar-days card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">{t.event.title}</h3>
              <p className="card-desc">{t.event.subtitle}</p>
              <div className="launch-btn">{t.fitur.launch_btn} <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 16. Kilas Balik Angkatan (Wrapped) */}
          <Link href="/wrapped" className="premium-card js-tilt-card special-wrapped-card" ref={el => { cardsRef.current[15] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=2670&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-film card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">Kilas Balik Angkatan (Wrapped)</h3>
              <p className="card-desc">Rangkuman jejak aktivitas dan momen interaksi kebersamaan Anda di portal alumni sepanjang tahun ini.</p>
              <div className="launch-btn">Lihat Kilas Balik <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 17. Pusat Panduan & Bantuan Alumni */}
          <Link href="/panduan" className="premium-card js-tilt-card" ref={el => { cardsRef.current[17] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=2573&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-book-bookmark card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">{t.panduan.title}</h3>
              <p className="card-desc">{t.panduan.subtitle}</p>
              <div className="launch-btn">{t.fitur.panduan_btn} <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

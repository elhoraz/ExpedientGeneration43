"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import "./fitur.css";

export default function FiturClient() {
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([]);

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
      } else {
        gsap.from(".dashboard-header", { opacity: 0, y: -40, duration: 1.2, ease: "expo.out", clearProps: "all" });
        gsap.from(".premium-card", {
          opacity: 0, y: 80, rotationX: -15, duration: 1.1,
          stagger: 0.1, ease: "back.out(1.4)", delay: 0.15, clearProps: "all"
        });
      }
    });

    // JS Tilt Effect (Hanya untuk Desktop / Mouse Pointer)
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const tiltCards = cardsRef.current;
    if (!isTouch && window.innerWidth > 768) {
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
          <h1 className="dashboard-title">The Sovereign Vault</h1>
          <p className="dashboard-subtitle">Akses Eksklusif Entitas Expedient Terverifikasi</p>
        </div>

        <div className="cinematic-grid">
          {/* Photobooth Studio */}
          <Link href="/photobooth" className="premium-card js-tilt-card" ref={el => { cardsRef.current[16] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=2564&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-camera-retro card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">Studio Photobooth</h3>
              <p className="card-desc">Studio photostrip virtual interaktif. Ambil 4-pose klasik, filter vintage, stiker digital, dan cetak photostrip HD / IG Story.</p>
              <div className="launch-btn">Masuk Studio <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 1. Sovereign ID */}
          <Link href="/sovereign" className="premium-card js-tilt-card" ref={el => { cardsRef.current[0] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-gem card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">Sovereign ID</h3>
              <p className="card-desc">Modul identitas 5D interaktif. Merender ulang data biometrik dan arsip Anda dalam bentuk holografik.</p>
              <div className="launch-btn">Jelajahi Sekarang <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 2. Omni Scanner */}
          <Link href="/scanner" className="premium-card js-tilt-card" ref={el => { cardsRef.current[1] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-qrcode card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">Omni Scanner</h3>
              <p className="card-desc">Pemindai KTA in-app. Baca kode matriks entitas lain untuk langsung melompat ke bilik profil holografik mereka.</p>
              <div className="launch-btn">Buka Pemindai <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 3. Amanah & Wasiat */}
          <Link href="/wasiat" className="premium-card js-tilt-card" ref={el => { cardsRef.current[2] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1614064641913-a520f596a247?q=80&w=2574&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-vault card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">Amanah & Wasiat</h3>
              <p className="card-desc">Brankas pesan terenkripsi tingkat tinggi. Titipkan pesan rahasia, wasiat, atau data vital yang hanya terbuka dengan pemicu otentikasi spesifik.</p>
              <div className="launch-btn">Buka Brankas <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 4. Baitul Maal */}
          <Link href="/baitul-maal" className="premium-card js-tilt-card" ref={el => { cardsRef.current[3] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1579621970795-87facc2f976d?q=80&w=2670&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-coins card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">Baitul Maal</h3>
              <p className="card-desc">Pusat kontribusi dan wakaf elit. Visualisasi rekam jejak sedekah jariyah angkatan dalam bentuk tabungan cahaya keabadian.</p>
              <div className="launch-btn">Buka Khasanah <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 5. Majlis Syura */}
          <Link href="/majlis" className="premium-card js-tilt-card" ref={el => { cardsRef.current[4] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1594954002661-8f55fc15d7de?q=80&w=2670&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-microphone-lines card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">Majlis Syura</h3>
              <p className="card-desc">Bilik suara VVIP eksklusif. Dengarkan kajian, bertukar pikiran, dan jalin ukhuwah dalam keheningan yang elegan.</p>
              <div className="launch-btn">Masuk Ruang Majlis <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 6. Tarbiyah Nexus */}
          <Link href="/tarbiyah" className="premium-card js-tilt-card" ref={el => { cardsRef.current[5] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556761175-5973dc0f32b7?q=80&w=2532&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-handshake-angle card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">Tarbiyah Nexus</h3>
              <p className="card-desc">Jaringan mentorship elit & ekosistem B2B Halal. Ruang kolaborasi profesional antar entitas untuk memperkuat muamalah dan karir.</p>
              <div className="launch-btn">Bergabung <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 7. The Oracle's Vision */}
          <Link href="/oracle" className="premium-card js-tilt-card" ref={el => { cardsRef.current[6] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2565&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-eye card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">The Oracle's Vision</h3>
              <p className="card-desc">Pemindai kamera interaktif untuk mengekstraksi dan membaca Aura Eksekutif Anda secara langsung.</p>
              <div className="launch-btn">Mulai Pemindaian <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 8. Protokol Multazam */}
          <Link href="/multazam" className="premium-card js-tilt-card" ref={el => { cardsRef.current[7] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542642510-48227b613eec?q=80&w=2670&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-ticket card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">Protokol Multazam</h3>
              <p className="card-desc">Sistem RSVP & Tiket Cerdas untuk acara VVIP. Hadiri kajian akbar dan gala diner angkatan dengan otorisasi pass digital eksklusif.</p>
              <div className="launch-btn">Lihat Jadwal Acara <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 9. Ruang Kontemplasi */}
          <Link href="/kontemplasi" className="premium-card js-tilt-card" ref={el => { cardsRef.current[8] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=2574&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-peace card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">Ruang Kontemplasi</h3>
              <p className="card-desc">Mode sanctuary layar penuh. Temukan kedamaian dari bisingnya dunia dengan keheningan, tata napas, dan audio ambience Islami.</p>
              <div className="launch-btn">Masuki Keheningan <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 10. The Celestial Codex */}
          <Link href="/celestial" className="premium-card js-tilt-card" ref={el => { cardsRef.current[9] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=2670&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-star card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">The Celestial Codex</h3>
              <p className="card-desc">Tarik tiga kartu takdir dari dek misterius. Ungkap ramalan dan kebijaksanaan hari ini.</p>
              <div className="launch-btn">Buka Codex <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 11. Divine Verse */}
          <Link href="/divine" className="premium-card js-tilt-card" ref={el => { cardsRef.current[10] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1606836109968-3e4b37be8079?q=80&w=2574&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-book-open card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">Divine Verse</h3>
              <p className="card-desc">Jelajahi untaian ayat suci dan refleksi harian. Sentuhan spiritual dalam balutan teknologi tingkat tinggi.</p>
              <div className="launch-btn">Resapi Ayat <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 12. Enigma Vault */}
          <Link href="/enigma" className="premium-card js-tilt-card" ref={el => { cardsRef.current[11] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-lock card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">Enigma Vault</h3>
              <p className="card-desc">Brankas digital terenkripsi. Simpan catatan rahasia, memori tersembunyi, dan arsip pribadi yang hanya Anda yang bisa membukanya.</p>
              <div className="launch-btn">Buka Brankas <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 13. Genesis Core */}
          <Link href="/genesis" className="premium-card js-tilt-card" ref={el => { cardsRef.current[12] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-atom card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">Genesis Core</h3>
              <p className="card-desc">Inti dari segalanya. Jelajahi asal-usul, filosofi, dan fondasi spiritual yang membangun identitas Expedient Generation.</p>
              <div className="launch-btn">Jelajahi Asal-Usul <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 14. The Nexus */}
          <Link href="/nexus" className="premium-card js-tilt-card special-nexus-card" ref={el => { cardsRef.current[13] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-network-wired card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">The Nexus</h3>
              <p className="card-desc">Algoritma analitik cerdas yang menghubungkan visi Anda dengan Kolega Strategis. Merajut jaringan eksekutif masa depan.</p>
              <div className="launch-btn">Inisiasi Analitik <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 15. Agenda & Eksibisi */}
          <Link href="/event" className="premium-card js-tilt-card" ref={el => { cardsRef.current[14] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2670&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-calendar-days card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">Agenda & Eksibisi</h3>
              <p className="card-desc">Jadwalkan, kelola, dan hadiri pertemuan eksklusif angkatan. Integrasi sistem RSVP pintar untuk entitas Expedient.</p>
              <div className="launch-btn">Lihat Jadwal <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>

          {/* 16. Expedient Wrapped */}
          <Link href="/wrapped" className="premium-card js-tilt-card special-wrapped-card" ref={el => { cardsRef.current[15] = el; }}>
            <div className="card-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=2670&auto=format&fit=crop')" }}></div>
            <i className="fa-solid fa-film card-icon"></i>
            <div className="card-content">
              <h3 className="card-title">Expedient Wrapped</h3>
              <p className="card-desc">Kilas balik interaktif perjalanan digital Anda di The Vault sepanjang tahun ini.</p>
              <div className="launch-btn">Lihat Kilas Balik <i className="fa-solid fa-arrow-right-long"></i></div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

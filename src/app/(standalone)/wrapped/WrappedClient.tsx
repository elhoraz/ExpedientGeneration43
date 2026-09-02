"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";

export default function WrappedClient({ profile, stats }: { profile: any, stats: { chatCount: number, prestisePoints: number } }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 4;
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
      // Init animation for first slide
      animateSlide(0);
  }, []);

  const animateSlide = (index: number) => {
      const slide = slideRefs.current[index];
      if (!slide) return;

      gsap.fromTo(slide.querySelectorAll('.anim-text'), 
          { y: 50, opacity: 0 }, 
          { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: "power3.out" }
      );
  };

  const nextSlide = () => {
      if (currentSlide < totalSlides - 1) {
          setCurrentSlide(prev => {
              const next = prev + 1;
              animateSlide(next);
              return next;
          });
      }
  };

  const prevSlide = () => {
      if (currentSlide > 0) {
          setCurrentSlide(prev => {
              const next = prev - 1;
              animateSlide(next);
              return next;
          });
      }
  };

  return (
    <div className="wrapped-wrapper">
      <style>{`
        body { margin: 0; overflow: hidden; background: #050505; color: #fff; font-family: 'Inter', sans-serif; }
        .wrapped-wrapper { width: 100vw; height: 100vh; position: relative; display: flex; justify-content: center; align-items: center; }
        
        .progress-bar-container { position: absolute; top: 20px; left: 20px; right: 20px; display: flex; gap: 5px; z-index: 100; }
        .progress-segment { flex: 1; height: 3px; background: rgba(255,255,255,0.2); border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; background: #d4af37; transition: width 0.3s linear; }

        .slide { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 20px; box-sizing: border-box; opacity: 0; pointer-events: none; transition: opacity 0.5s; }
        .slide.active { opacity: 1; pointer-events: auto; }
        
        /* Specific slide backgrounds */
        .slide-0 { background: linear-gradient(135deg, #1a1a1a, #000); }
        .slide-1 { background: radial-gradient(circle at center, #2c1e05, #000); }
        .slide-2 { background: linear-gradient(to bottom, #001a11, #000); }
        .slide-3 { background: radial-gradient(circle at top right, #33001b, #000); }

        .title-huge { font-family: 'Playfair Display', serif; font-size: clamp(2rem, 7vw, 5rem); color: #d4af37; margin: 0 0 20px 0; line-height: 1.1; }
        .subtitle { font-size: clamp(0.9rem, 3vw, 1.3rem); color: #ccc; margin-bottom: 30px; padding: 0 15px; }
        .stat-huge { font-size: clamp(2.5rem, 12vw, 6rem); font-weight: 900; color: transparent; -webkit-text-stroke: 2px #d4af37; font-family: 'Inter', sans-serif; margin: 20px 0; }
        
        .click-zone { position: absolute; top: 0; width: 50%; height: 100%; z-index: 50; cursor: pointer; }
        .click-left { left: 0; }
        .click-right { right: 0; }

        .btn-close { position: absolute; top: 40px; right: 20px; color: #fff; background: rgba(255,255,255,0.1); padding: 8px 15px; border-radius: 20px; text-decoration: none; font-size: 0.8rem; z-index: 100; backdrop-filter: blur(5px); }
        .btn-action-vault { position: relative; z-index: 100; }
      `}</style>

      <div className="progress-bar-container">
          {Array.from({ length: totalSlides }).map((_, i) => (
              <div key={i} className="progress-segment">
                  <div className="progress-fill" style={{ width: i < currentSlide ? '100%' : i === currentSlide ? '100%' : '0%' }}></div>
              </div>
          ))}
      </div>

      <Link href="/fitur" className="btn-close"><i className="fa-solid fa-xmark"></i> Tutup</Link>

      <div className="click-zone click-left" onClick={prevSlide}></div>
      <div className="click-zone click-right" onClick={nextSlide}></div>

      {/* Slide 0: Intro */}
      <div ref={el => { slideRefs.current[0] = el; }} className={`slide slide-0 ${currentSlide === 0 ? 'active' : ''}`}>
          <h1 className="title-huge anim-text">Halo,<br/>{profile?.nama_panggilan || 'Sovereign'}.</h1>
          <p className="subtitle anim-text">Tahun ini adalah tahun yang luar biasa bagi Anda.</p>
          <div className="anim-text" style={{ marginTop: '50px', fontSize: '0.8rem', color: '#888', letterSpacing: '3px' }}>KETUK UNTUK MELANJUTKAN</div>
      </div>

      {/* Slide 1: Stats */}
      <div ref={el => { slideRefs.current[1] = el; }} className={`slide slide-1 ${currentSlide === 1 ? 'active' : ''}`}>
          <p className="subtitle anim-text">Tahun ini Anda berhasil mengumpulkan</p>
          <div className="stat-huge anim-text">{stats.prestisePoints.toLocaleString()}</div>
          <p className="subtitle anim-text">Prestise Points dari berbagai aktivitas.</p>
      </div>

      {/* Slide 2: Top Connect */}
      <div ref={el => { slideRefs.current[2] = el; }} className={`slide slide-2 ${currentSlide === 2 ? 'active' : ''}`}>
          <p className="subtitle anim-text">Anda juga aktif berkomunikasi di Majlis,</p>
          <h1 className="title-huge anim-text" style={{ color: '#00ff88' }}>{stats.chatCount}</h1>
          <p className="subtitle anim-text">Pesan telah Anda kirim ke seluruh jaringan.</p>
      </div>

      {/* Slide 3: Outro */}
      <div ref={el => { slideRefs.current[3] = el; }} className={`slide slide-3 ${currentSlide === 3 ? 'active' : ''}`}>
          <h1 className="title-huge anim-text">Terima Kasih.</h1>
          <p className="subtitle anim-text">Mari buat kenangan baru di Expedient Generation tahun depan.</p>
          <Link href="/fitur" className="anim-text btn-action-vault" style={{ marginTop: '30px', padding: '15px 40px', background: '#d4af37', color: '#000', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold', letterSpacing: '2px', display: 'inline-block' }}>
              KEMBALI KE VAULT
          </Link>
      </div>

    </div>
  );
}

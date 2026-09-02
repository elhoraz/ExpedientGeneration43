"use client";

import { useEffect, useState, useRef } from "react";
import Script from "next/script";
import Link from "next/link";
import "./direktori.css";
// import "swiper/css"; // Provided by CI4 vendor css or we can load it from CDN like CI4 did.

export default function DirektoriClient({ alumni, isLoggedIn }: { alumni: any[], isLoggedIn: boolean }) {
  const [search, setSearch] = useState("");
  const swiperRef = useRef<any>(null);

  const triggerQuest = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("expedient_quest_directory", "true");
      window.dispatchEvent(new CustomEvent("expedient-quest-updated"));
    }
  };

  useEffect(() => {
    document.body.classList.add("page-direktori");
    return () => {
      document.body.classList.remove("page-direktori");
    };
  }, []);

  useEffect(() => {
    // Re-initialize Swiper when filteredAlumni changes (DOM nodes are re-mounted by React)
    const initSwiper = () => {
        if (typeof window !== 'undefined' && (window as any).Swiper) {
            const Swiper = (window as any).Swiper;
            if (swiperRef.current) swiperRef.current.destroy(true, true);
            
            setTimeout(() => {
                const isMobile = window.innerWidth < 768;
                swiperRef.current = new Swiper('.mySwiper', {
                    effect: 'coverflow',
                    grabCursor: true,
                    centeredSlides: true,
                    slidesPerView: 'auto',
                    initialSlide: 0,
                    speed: 600,
                    touchRatio: 1.2,
                    touchAngle: 45,
                    threshold: 5,
                    coverflowEffect: {
                        rotate: isMobile ? 0 : 15,
                        stretch: 0,
                        depth: isMobile ? 80 : 350,
                        modifier: 1,
                        slideShadows: false,
                    },
                    navigation: { nextEl: '#btnNext', prevEl: '#btnPrev' },
                    keyboard: { enabled: true },
                    on: { 
                      slideChangeTransitionStart: () => { 
                        if (navigator.vibrate) navigator.vibrate(10); 
                        triggerQuest();
                      } 
                    },
                    observer: true,
                    observeParents: true
                });
            }, 100); // give React time to flush DOM
        }
    };
    initSwiper();
  }, [search]); // re-run when search changes since filteredAlumni is derived from it

  const filteredAlumni = alumni.filter(user => {
    const searchString = `${user.nama_lengkap} ${user.nama_panggilan}`.toLowerCase();
    return searchString.includes(search.toLowerCase());
  });

  return (
    <div className="direktori-container">
        <div className="ethereal-glow"></div>

        <div className="search-wrapper">
            <div style={{ display: "flex", gap: "8px", width: "100%", maxWidth: "500px", margin: "0 auto" }}>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Temukan Rekam Jejak..." 
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (e.target.value.trim().length >= 2) {
                      triggerQuest();
                    }
                  }}
                />
                <button 
                  onClick={() => { if (search.trim()) triggerQuest(); }}
                  style={{ background: "var(--gold-main, #d4af37)", border: "none", color: "var(--bg-main, #000)", padding: "10px 18px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem", letterSpacing: "1px" }}
                >
                  <i className="fa-solid fa-magnifying-glass"></i>
                </button>
            </div>
            {search && (
                <div style={{ textAlign: "center", marginTop: "10px" }}>
                    <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "0.8rem", cursor: "pointer" }}>
                      <i className="fa-solid fa-times"></i> Reset pencarian
                    </button>
                </div>
            )}
        </div>

        {filteredAlumni.length === 0 ? (
            <div className="text-center text-themeSec font-tech w-full py-12" style={{ textAlign: "center", marginTop: "50px", color: "var(--text-secondary)" }}>
                <i className="fa-solid fa-book-open" style={{ fontSize: "2rem", opacity: 0.5, marginBottom: "15px" }}></i><br/>Arsip belum mencatat histori apapun.
            </div>
        ) : (
            <>
                <div className="mobile-swipe-hint">
                    <i className="fa-solid fa-arrows-left-right" style={{ marginRight: "6px" }}></i> Geser kartu untuk melihat alumni
                </div>
                <div className="swiper mySwiper">
                    <div className="swiper-wrapper" id="swiperWrapper">
                    
                    {filteredAlumni.map((user) => {
                        const foto = user.foto_profil ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profiles/${user.foto_profil}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama_panggilan || 'A')}&background=d4af37&color=000`;
                        // Simple hash simulation for serial (CI4 used md5, we will just use padded id)
                        const serial = `ID-42.${String(user.id).padStart(4, "0")}`;

                        return (
                            <div key={user.id} className="swiper-slide alumni-slide">
                                <div className="luminary-card">
                                    <div className="agent-serial">{serial}</div>
                                    <div className="photo-ring">
                                        <img src={foto} className="card-photo" alt="Photo" />
                                    </div>
                                    <h3 className="card-name">{user.nama_panggilan}</h3>
                                    <div className="card-full-name">{user.nama_lengkap}</div>
                                    
                                    <div className="card-details">
                                        {isLoggedIn ? (
                                            <>
                                                <div className="detail-group reveal-item r-1">
                                                    <div className="d-label">Asal</div>
                                                    <div className="d-value">{(user.tempat_lahir || "-")} {user.tanggal_lahir ? `, ${new Date(user.tanggal_lahir).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' })}` : ''}</div>
                                                </div>
                                                <div className="detail-group reveal-item r-2">
                                                    <div className="d-label">Domisili</div>
                                                    <div className="d-value">{user.alamat_lengkap || "-"}</div>
                                                </div>
                                                <div className="detail-group reveal-item r-3">
                                                    <div className="d-label">Visi & Aspirasi</div>
                                                    <div className="d-value">{user.cita_cita || "Merahasiakan Tujuannya"}</div>
                                                </div>

                                                <div className="card-quote reveal-item r-4">
                                                    "{user.motivasi_hidup || "Belum membagikan kutipan."}"
                                                </div>

                                                <div className="card-socials reveal-item r-4">
                                                    <Link href={`/chat/personal/${user.id}`} className="soc-btn" title="Kirim Pesan"><i className="fa-solid fa-comment-dots"></i></Link>
                                                    {user.akun_ig && <a href={`https://instagram.com/${user.akun_ig.replace('@', '')}`} target="_blank" className="soc-btn" title="Instagram"><i className="fa-brands fa-instagram"></i></a>}
                                                    {user.akun_tiktok && <a href={`https://tiktok.com/@${user.akun_tiktok.replace('@', '')}`} target="_blank" className="soc-btn" title="TikTok"><i className="fa-brands fa-tiktok"></i></a>}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="reveal-item r-1" style={{ textAlign: "center", padding: "15px 0" }}>
                                                <Link href="/login" style={{ color: "var(--gold-main, #d4af37)", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "1px" }}>
                                                    <i className="fa-solid fa-lock" style={{ marginRight: "6px" }}></i> Masuk untuk lihat profil lengkap
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            </>
        )}

        <div className="nav-arrow nav-prev" id="btnPrev"><i className="fa-solid fa-chevron-left"></i></div>
        <div className="nav-arrow nav-next" id="btnNext"><i className="fa-solid fa-chevron-right"></i></div>
        
        {/* Load Script */}
        <Script 
          src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js" 
          strategy="lazyOnload" 
          onLoad={() => {
              if ((window as any).Swiper) {
                  const Swiper = (window as any).Swiper;
                  if (swiperRef.current) swiperRef.current.destroy();
                  const isMobile = window.innerWidth < 768;
                  swiperRef.current = new Swiper('.mySwiper', {
                      effect: 'coverflow',
                      grabCursor: true,
                      centeredSlides: true,
                      slidesPerView: 'auto',
                      initialSlide: 0,
                      speed: 600,
                      touchRatio: 1.2,
                      touchAngle: 45,
                      threshold: 5,
                      coverflowEffect: {
                          rotate: isMobile ? 0 : 15,
                          stretch: 0,
                          depth: isMobile ? 80 : 350,
                          modifier: 1,
                          slideShadows: false,
                      },
                      navigation: { nextEl: '#btnNext', prevEl: '#btnPrev' },
                      keyboard: { enabled: true },
                      on: { slideChangeTransitionStart: () => { if (navigator.vibrate) navigator.vibrate(10); } }
                  });
              }
          }}
        />

        {/* Dynamic Swiper update hook if alumni list length changes via search */}
        <Script id="swiper-update" strategy="afterInteractive">
            {`
               // Handled by useEffect in React
            `}
        </Script>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Swiper from "swiper";
import { EffectCoverflow, Navigation, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import { getAvatarUrl } from "@/lib/avatar";
import "./direktori.css";

export default function DirektoriClient({ alumni, isLoggedIn }: { alumni: any[], isLoggedIn: boolean }) {
  const [search, setSearch] = useState("");
  const [qrModalUser, setQrModalUser] = useState<any | null>(null);
  const swiperRef = useRef<any>(null);

  const triggerQuest = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("expedient_quest_directory", "true");
      window.dispatchEvent(new CustomEvent("expedient-quest-updated"));
    }
  };

  useEffect(() => {
    triggerQuest();
    document.body.classList.add("page-direktori");
    return () => {
      document.body.classList.remove("page-direktori");
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (swiperRef.current) {
      try {
        swiperRef.current.destroy(true, true);
      } catch {}
    }

    const timer = setTimeout(() => {
      const isMobile = window.innerWidth < 768;
      try {
        swiperRef.current = new Swiper(".mySwiper", {
          modules: [EffectCoverflow, Navigation, Keyboard],
          effect: "coverflow",
          grabCursor: true,
          centeredSlides: true,
          slidesPerView: "auto",
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
          navigation: { nextEl: "#btnNext", prevEl: "#btnPrev" },
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
      } catch (err) {
        console.error("Swiper init error:", err);
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      if (swiperRef.current) {
        try {
          swiperRef.current.destroy(true, true);
        } catch {}
      }
    };
  }, [search]);

  const filteredAlumni = alumni.filter(user => {
    const searchString = `${user.nama_lengkap || ''} ${user.nama_panggilan || ''} ${user.alamat_lengkap || ''} ${user.tempat_lahir || ''} ${user.motivasi_hidup || ''}`.toLowerCase();
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
                        const foto = getAvatarUrl(user.foto_profil, user.nama_panggilan || user.nama_lengkap);
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
                                                    <a href={`/api/vcard/${user.id}`} className="soc-btn" title="Simpan Kontak vCard (.vcf)"><i className="fa-solid fa-address-card"></i></a>
                                                    <button type="button" onClick={() => setQrModalUser(user)} className="soc-btn" title="Tampilkan QR Kontak (Scan)"><i className="fa-solid fa-qrcode"></i></button>
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
        {/* QR CODE VCARD MODAL (TASK 20) */}
        {qrModalUser && (
          <div 
            onClick={() => setQrModalUser(null)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999999,
              background: "rgba(0, 0, 0, 0.85)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px"
            }}
          >
            <div 
              onClick={e => e.stopPropagation()}
              style={{
                background: "var(--bg-secondary, #0c120f)",
                border: "1px solid rgba(212, 175, 55, 0.4)",
                borderRadius: "24px",
                padding: "30px 24px",
                maxWidth: "340px",
                width: "100%",
                textAlign: "center",
                boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)"
              }}
            >
              <div style={{ fontSize: "0.75rem", fontFamily: "Courier New, monospace", color: "#d4af37", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>
                KARTU KONTAK DIGITAL
              </div>
              <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.3rem", color: "var(--text-primary)", marginBottom: "4px" }}>
                {qrModalUser.nama_panggilan || qrModalUser.nama_lengkap}
              </h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
                Arahkan kamera smartphone untuk menyimpan nomor langsung ke kontak.
              </p>

              <div style={{ background: "#ffffff", padding: "12px", borderRadius: "16px", display: "inline-block", boxShadow: "0 8px 20px rgba(0,0,0,0.3)", marginBottom: "20px" }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data=${encodeURIComponent(
                    `BEGIN:VCARD\nVERSION:3.0\nFN:${qrModalUser.nama_lengkap || qrModalUser.nama_panggilan}\nNICKNAME:${qrModalUser.nama_panggilan || ''}\nTEL;TYPE=CELL:+${(qrModalUser.no_whatsapp || '').replace(/\\D/g, '')}\nNOTE:Alumni Expedient Generation Angkatan 42\nEND:VCARD`
                  )}`}
                  alt="QR Code Kontak"
                  style={{ width: "190px", height: "190px", display: "block" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <a 
                  href={`/api/vcard/${qrModalUser.id}`}
                  download
                  style={{
                    background: "rgba(212, 175, 55, 0.15)",
                    border: "1px solid #d4af37",
                    color: "#d4af37",
                    padding: "10px",
                    borderRadius: "12px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  <i className="fa-solid fa-download"></i> Unduh File .vcf
                </a>
                <button
                  type="button"
                  onClick={() => setQrModalUser(null)}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--glass-border)",
                    color: "var(--text-secondary)",
                    padding: "8px",
                    borderRadius: "12px",
                    fontSize: "0.8rem",
                    cursor: "pointer"
                  }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

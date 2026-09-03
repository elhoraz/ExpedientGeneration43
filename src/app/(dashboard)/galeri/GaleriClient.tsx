"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import "./galeri.css";

export default function GaleriClient() {
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Bundle Export to Printable PDF (Task B-5)
  const handleOpenPrintView = (dim: "putra" | "putri") => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Harap izinkan pop-up browser untuk mengekspor buku kenangan.");
      return;
    }

    const title = dim === "putra" ? "Buku Kenangan Putra — Expedient 43" : "Buku Kenangan Putri — Expedient 43";
    const totalPages = dim === "putra" ? 75 : 41;
    const folder = dim === "putra" ? "foto_putra" : "foto_putri";

    let imagesHtml = `
      <div class="page-break"><img src="/assets/${folder}/Cover Depan.webp" alt="Cover Depan" /></div>
      <div class="page-break"><img src="/assets/${folder}/Cover Dalem Depan.webp" alt="Cover Dalem Depan" /></div>
    `;

    for (let i = 1; i <= totalPages * 2; i++) {
      imagesHtml += `<div class="page-break"><img src="/assets/${folder}/Hal ${i}.webp" alt="Halaman ${i}" /></div>`;
    }

    imagesHtml += `
      <div class="page-break"><img src="/assets/${folder}/Cover Dalem Belakang.webp" alt="Cover Dalem Belakang" /></div>
      <div class="page-break"><img src="/assets/${folder}/Cover Belakang.webp" alt="Cover Belakang" /></div>
    `;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: A4 portrait; margin: 0; }
          body { margin: 0; padding: 0; background: #000; text-align: center; }
          .page-break { page-break-after: always; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
          img { max-width: 100vw; max-height: 100vh; object-fit: contain; display: block; margin: 0 auto; }
          .no-print { position: fixed; top: 15px; right: 15px; z-index: 9999; background: #d4af37; color: #000; border: none; padding: 12px 24px; border-radius: 30px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
          @media print { .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        <button class="no-print" onclick="window.print()">Simpan Seluruh Buku ke PDF / Cetak</button>
        ${imagesHtml}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 1500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  useEffect(() => {
    document.body.classList.add("page-galeri");

    // Double-click on any page image opens the full-screen lightbox (Task 13)
    const handleImageDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === "IMG" && target.closest(".book-scene")) {
        const src = (target as HTMLImageElement).src || target.getAttribute("data-src");
        if (src) setLightboxImg(src);
      }
    };
    document.addEventListener("dblclick", handleImageDblClick);

    return () => {
      document.body.classList.remove("page-galeri");
      document.removeEventListener("dblclick", handleImageDblClick);
    };
  }, []);

  // Generate array elements for pages
  const sheetsPutra = [];
  let idxPutra = 0;
  sheetsPutra.push(
    <div key={`putra-${idxPutra}`} className="sheet cursor-bind" data-sheet={idxPutra++}>
      <div className="face front cover-material"><img data-src="/assets/foto_putra/Cover Depan.webp" alt="Cover Depan" /></div>
      <div className="face back"><img data-src="/assets/foto_putra/Cover Dalem Depan.webp" alt="Cover Dalem Depan" /></div>
    </div>
  );
  for (let i = 1; i <= 75; i++) {
    sheetsPutra.push(
      <div key={`putra-${idxPutra}`} className="sheet cursor-bind" data-sheet={idxPutra++}>
        <div className="face front"><img data-src={`/assets/foto_putra/Hal ${i * 2 - 1}.webp`} alt={`Hal ${i * 2 - 1}`} /></div>
        <div className="face back"><img data-src={`/assets/foto_putra/Hal ${i * 2}.webp`} alt={`Hal ${i * 2}`} /></div>
      </div>
    );
  }
  sheetsPutra.push(
    <div key={`putra-${idxPutra}`} className="sheet cursor-bind" data-sheet={idxPutra++}>
      <div className="face front"><img data-src="/assets/foto_putra/Cover Dalem Belakang.webp" alt="Cover Dalem Belakang" /></div>
      <div className="face back cover-material"><img data-src="/assets/foto_putra/Cover Belakang.webp" alt="Cover Belakang" /></div>
    </div>
  );

  const sheetsPutri = [];
  let idxPutri = 0;
  sheetsPutri.push(
    <div key={`putri-${idxPutri}`} className="sheet cursor-bind" data-sheet={idxPutri++}>
      <div className="face front cover-material"><img data-src="/assets/foto_putri/Cover Depan.webp" alt="Cover Depan" /></div>
      <div className="face back"><img data-src="/assets/foto_putri/Cover Dalem Depan.webp" alt="Cover Dalem Depan" /></div>
    </div>
  );
  for (let i = 1; i <= 41; i++) {
    sheetsPutri.push(
      <div key={`putri-${idxPutri}`} className="sheet cursor-bind" data-sheet={idxPutri++}>
        <div className="face front"><img data-src={`/assets/foto_putri/Hal ${i * 2 - 1}.webp`} alt={`Hal ${i * 2 - 1}`} /></div>
        <div className="face back"><img data-src={`/assets/foto_putri/Hal ${i * 2}.webp`} alt={`Hal ${i * 2}`} /></div>
      </div>
    );
  }
  sheetsPutri.push(
    <div key={`putri-${idxPutri}`} className="sheet cursor-bind" data-sheet={idxPutri++}>
      <div className="face front"><img data-src="/assets/foto_putri/Cover Dalem Belakang.webp" alt="Cover Dalem Belakang" /></div>
      <div className="face back cover-material"><img data-src="/assets/foto_putri/Cover Belakang.webp" alt="Cover Belakang" /></div>
    </div>
  );

  return (
    <>
        <audio id="bgMusic" loop preload="none">
            <source src="/assets/audio/memori.mp3" type="audio/mpeg" />
        </audio>

        <audio id="whisperAudio" preload="none">
            <source src="/assets/audio/pesan_angkatan.mp3" type="audio/mpeg" />
        </audio>

        <div className="portrait-lock">
            <i className="fa-solid fa-mobile-screen"></i>
            <h2>AKSES TERKUNCI</h2>
            <p>Ruang Kenangan terbaik dinikmati dalam mode Landscape.<br/>Silakan putar perangkat Anda.</p>
            <button 
              id="btnBypassLock" 
              onClick={() => {
                document.body.classList.add("bypass-portrait");
              }}
              style={{
                marginTop: "20px",
                padding: "10px 22px",
                background: "rgba(212,175,55,0.15)",
                border: "1px solid #d4af37",
                color: "#d4af37",
                borderRadius: "50px",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}
            >
              <i className="fa-solid fa-unlock" style={{ marginRight: "6px" }}></i> Tetap Buka dalam Mode Tegak
            </button>
        </div>

        <div className="gallery-stage" id="galleryStage">
            <div className="glitch-overlay" id="glitchOverlay"></div>
            <div className="ethereal-text" id="etherealText" title="Double Click for Epilogue">THE SYNDICATE</div>
            <canvas id="dustCanvas"></canvas>
            <div className="ambient-light" id="ambientLight"></div>
            <button className="dimension-shift-btn hover-trigger" id="btnShift"><i className="fa-solid fa-rotate"></i> SHIFT TO OMEGA (PUTRI)</button>

            <div className="dimension-core" id="dimCore">
                <div className="book-scene" id="bookPutra">
                    {sheetsPutra}
                </div>

                <div className="book-scene" id="bookPutri">
                    {sheetsPutri}
                </div>
            </div>

            <button className="whisper-btn hover-trigger" id="btnWhisper" title="Dengarkan Pesan Memori"><i className="fa-solid fa-microphone-lines"></i></button>

            <div className="gallery-hud">
                <button className="btn-icon hover-trigger" id="btnAudio" title="Nyalakan Musik Kenangan"><i className="fa-solid fa-music"></i></button>
                <button className="btn-icon hover-trigger" id="btnAutoPlay" title="Cinematic Auto-Play"><i className="fa-solid fa-play"></i></button>
                <button className="btn-icon hover-trigger" id="btnIndex" title="Constellation Grid"><i className="fa-solid fa-border-all"></i></button>
                
                <button className="btn-nav hover-trigger" id="btnPrev"><i className="fa-solid fa-arrow-left"></i></button>
                <div className="indicator-wrapper">
                    <div className="page-indicator" id="pageIndicator">COVER DEPAN</div>
                    <div className="progress-bar-container"><div className="progress-bar-fill" id="progressFill"></div></div>
                </div>
                <button className="btn-nav hover-trigger" id="btnNext"><i className="fa-solid fa-arrow-right"></i></button>
                
                <button className="btn-icon hover-trigger" id="btnCloseBook" title="Tutup Buku"><i className="fa-solid fa-book"></i></button>
                <button className="btn-icon hover-trigger" id="btnPin" title="Simpan Halaman Ini"><i className="fa-regular fa-bookmark"></i></button>
                <button className="btn-icon hover-trigger" id="btnGoToPin" title="Teleportasi ke Memori" style={{ display: "none" }}><i className="fa-solid fa-map-location-dot"></i></button>
                <button className="btn-icon hover-trigger" onClick={() => setIsExportModalOpen(true)} title="Unduh Arsip & Ekspor Bundle PDF Buku Kenangan"><i className="fa-solid fa-file-pdf"></i></button>
                <Link href="/photobooth" className="btn-icon hover-trigger" title="Studio Photobooth Angkatan" style={{ color: "#ffd700", display: "flex", alignItems: "center", justifyContent: "center" }}><i className="fa-solid fa-camera-retro"></i></Link>
                <button className="btn-icon hover-trigger" id="btnFullscreen" title="Immersive Mode"><i className="fa-solid fa-expand"></i></button>
            </div>
        </div>

        {/* FULLSCREEN IMAGE LIGHTBOX MODAL (TASK 13) */}
        {lightboxImg && (
          <div 
            onClick={() => setLightboxImg(null)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999999,
              background: "rgba(0, 0, 0, 0.92)",
              backdropFilter: "blur(12px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px"
            }}
          >
            <div style={{ position: "relative", maxWidth: "92vw", maxHeight: "90vh", display: "flex", flexDirection: "column", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
              <img 
                src={lightboxImg} 
                alt="Arsip Kenangan" 
                style={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  objectFit: "contain",
                  borderRadius: "12px",
                  border: "1px solid rgba(212, 175, 55, 0.4)",
                  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.9)"
                }} 
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginTop: "14px", gap: "10px" }}>
                <span style={{ color: "var(--gold-main, #d4af37)", fontFamily: "Courier New, monospace", fontSize: "0.8rem", letterSpacing: "2px" }}>
                  <i className="fa-solid fa-gem" style={{ marginRight: "6px" }}></i> ARSIP FOTO RESMI
                </span>
                <div style={{ display: "flex", gap: "10px" }}>
                  <a 
                    href={lightboxImg} 
                    download 
                    target="_blank" 
                    rel="noreferrer"
                    style={{
                      background: "rgba(212, 175, 55, 0.2)",
                      border: "1px solid #d4af37",
                      color: "#d4af37",
                      padding: "8px 16px",
                      borderRadius: "20px",
                      fontSize: "0.8rem",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontWeight: 600
                    }}
                  >
                    <i className="fa-solid fa-download"></i> Unduh
                  </a>
                  <button
                    type="button"
                    onClick={() => setLightboxImg(null)}
                    style={{
                      background: "rgba(255, 255, 255, 0.12)",
                      border: "1px solid rgba(255, 255, 255, 0.25)",
                      color: "#fff",
                      padding: "8px 16px",
                      borderRadius: "20px",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      fontWeight: 600
                    }}
                  >
                    <i className="fa-solid fa-xmark"></i> Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* YEARBOOK BUNDLE EXPORT MODAL (TASK B-5) */}
        {isExportModalOpen && (
          <div 
            onClick={() => setIsExportModalOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999999,
              background: "rgba(0, 0, 0, 0.88)",
              backdropFilter: "blur(14px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px"
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--bg-secondary, #0c120f)",
                border: "1px solid rgba(212, 175, 55, 0.4)",
                borderRadius: "24px",
                padding: "32px 28px",
                maxWidth: "460px",
                width: "100%",
                boxShadow: "0 25px 60px rgba(0,0,0,0.8)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <span style={{ fontFamily: "Courier New, monospace", color: "#d4af37", fontSize: "0.75rem", letterSpacing: "2px", textTransform: "uppercase" }}>
                    ARSIP RESMI ANGKATAN 43
                  </span>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", color: "var(--text-primary)", margin: "4px 0 0 0" }}>
                    Ekspor Buku Kenangan
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: "1.2rem", cursor: "pointer" }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "22px" }}>
                Pilih edisi buku kenangan yang ingin dicetak atau disimpan sebagai arsip digital resolusi tinggi (High-Definition PDF Pack):
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                {/* Opsi Putra */}
                <div 
                  style={{
                    background: "rgba(212, 175, 55, 0.06)",
                    border: "1px solid rgba(212, 175, 55, 0.3)",
                    borderRadius: "16px",
                    padding: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: "0.95rem", color: "#f3e5ab" }}>
                      <i className="fa-solid fa-mars" style={{ color: "#00bfff", marginRight: "6px" }}></i> Edisi Putra (The Syndicate)
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                      150 Halaman Lengkap (Cover + Hal 1 - 150)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportModalOpen(false);
                      handleOpenPrintView("putra");
                    }}
                    style={{
                      background: "rgba(212, 175, 55, 0.2)",
                      border: "1px solid #d4af37",
                      color: "#d4af37",
                      padding: "8px 16px",
                      borderRadius: "20px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <i className="fa-solid fa-print"></i> Cetak / PDF
                  </button>
                </div>

                {/* Opsi Putri */}
                <div 
                  style={{
                    background: "rgba(212, 175, 55, 0.06)",
                    border: "1px solid rgba(212, 175, 55, 0.3)",
                    borderRadius: "16px",
                    padding: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: "0.95rem", color: "#f3e5ab" }}>
                      <i className="fa-solid fa-venus" style={{ color: "#ff69b4", marginRight: "6px" }}></i> Edisi Putri (Omega Dynasty)
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                      82 Halaman Lengkap (Cover + Hal 1 - 82)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportModalOpen(false);
                      handleOpenPrintView("putri");
                    }}
                    style={{
                      background: "rgba(212, 175, 55, 0.2)",
                      border: "1px solid #d4af37",
                      color: "#d4af37",
                      padding: "8px 16px",
                      borderRadius: "20px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <i className="fa-solid fa-print"></i> Cetak / PDF
                  </button>
                </div>
              </div>

              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textAlign: "center" }}>
                <i className="fa-solid fa-circle-info" style={{ marginRight: "4px" }}></i> Seluruh lembar akan disusun berurutan per halaman A4 portrait siap cetak ke percetakan atau disimpan sebagai PDF.
              </div>
            </div>
          </div>
        )}

        <Script src="/vendor/gsap/gsap.min.js" strategy="beforeInteractive" />
        <Script src="/assets/js/galeri.js" strategy="afterInteractive" />
    </>
  );
}

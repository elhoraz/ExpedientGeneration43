"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import "./galeri.css";

export default function GaleriClient() {
  useEffect(() => {
    document.body.classList.add("page-galeri");
    return () => {
      document.body.classList.remove("page-galeri");
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
        <audio id="bgMusic" loop preload="auto">
            <source src="/assets/audio/memori.mp3" type="audio/mpeg" />
        </audio>

        <audio id="whisperAudio" preload="auto">
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
                <button className="btn-icon hover-trigger" id="btnFullscreen" title="Immersive Mode"><i className="fa-solid fa-expand"></i></button>
            </div>
        </div>

        <Script src="/vendor/gsap/gsap.min.js" strategy="beforeInteractive" />
        <Script src="/assets/js/galeri.js" strategy="afterInteractive" />
    </>
  );
}

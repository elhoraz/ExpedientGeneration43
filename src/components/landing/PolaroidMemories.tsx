"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface MemorySnap {
  id: string;
  imgSrc: string;
  alt: string;
  caption: string;
  sub: string;
  rotation: string;
  tag: string;
}

const MEMORY_ASSETS: Record<string, { imgSrc: string; rotation: string }> = {
  cover: { imgSrc: "/assets/foto_putra/Cover Depan.webp", rotation: "-2deg" },
  pg643: { imgSrc: "/assets/foto_putra/Hal 5.webp", rotation: "1.8deg" },
  kmi: { imgSrc: "/assets/foto_putra/Hal 8.webp", rotation: "-1.5deg" },
  slahung: { imgSrc: "/assets/foto_putra/Hal 6.webp", rotation: "2.2deg" },
  ukhuwah: { imgSrc: "/assets/foto_putra/Hal 9.webp", rotation: "-2.4deg" },
  perjuangan: { imgSrc: "/assets/foto_putra/Hal 4.webp", rotation: "1.2deg" },
};

export default function PolaroidMemories() {
  const { t, locale } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const list = (t.memories_snaps && t.memories_snaps.length > 0 ? t.memories_snaps : []).map(snap => ({
    ...snap,
    imgSrc: MEMORY_ASSETS[snap.id]?.imgSrc || "/assets/foto_putra/Cover Depan.webp",
    rotation: MEMORY_ASSETS[snap.id]?.rotation || "0deg",
    alt: snap.caption,
  }));

  const scrollReel = (direction: "left" | "right") => {
    if (!trackRef.current) return;
    if (navigator.vibrate) navigator.vibrate(10);
    const scrollAmount = 340;
    trackRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  };

  return (
    <section className="polaroid-section" id="kenangan">
      <div className="section-header reveal-on-scroll">
        <div className="tuku-heritage-badge" style={{ marginBottom: "12px" }}>
          <span className="badge-bullet">🎞️</span>
          <span>{t.memories_section.badge}</span>
        </div>
        <h2 className="section-title">
          {t.memories_section.title}
        </h2>
        <p className="section-lead">
          {t.memories_section.lead}
        </p>

        {/* Ambient "Suara Memori Slahung" Audio Player */}
        <div className="tuku-audio-pill-wrap">
          <audio
            ref={audioRef}
            src="/assets/audio/memori.mp3"
            preload="none"
            onEnded={() => setIsPlaying(false)}
          />
          <button
            type="button"
            className={`tuku-audio-btn ${isPlaying ? "playing" : ""}`}
            onClick={toggleAudio}
            title={isPlaying ? "Jeda Musik Memori" : "Putar Musik Kenangan Slahung"}
          >
            <span className="audio-icon-disc">
              <i className={`fa-solid ${isPlaying ? "fa-pause" : "fa-play"}`}></i>
            </span>
            <div className="audio-btn-labels">
              <strong>{isPlaying ? t.memories_section.audio_playing : t.memories_section.audio_idle}</strong>
              <span>{t.memories_section.audio_sub}</span>
            </div>
            {isPlaying && (
              <div className="audio-mini-bars">
                <span className="bar b1"></span>
                <span className="bar b2"></span>
                <span className="bar b3"></span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Swipeable Polaroid Cards Track with Desktop Navigation */}
      <div className="polaroid-wrapper-rel reveal-on-scroll">
        <button
          type="button"
          className="polaroid-nav-btn prev"
          onClick={() => scrollReel("left")}
          aria-label="Foto Sebelumnya"
        >
          <i className="fa-solid fa-chevron-left"></i>
        </button>

        <div className="polaroid-scroll-container" ref={trackRef}>
          <div className="polaroid-track">
            {list.map((item, idx) => (
              <div
                key={item.id}
                className="polaroid-card"
                style={{ "--rotate-deg": item.rotation } as React.CSSProperties}
              >
                {idx % 2 === 0 ? (
                  <div className="polaroid-tape" title={locale === "ar" ? "شريط الذكريات" : locale === "en" ? "Memory Tape" : "Selotip Kenangan Santri"}></div>
                ) : (
                  <div className="polaroid-pin" title={locale === "ar" ? "دبوس ذهبي" : locale === "en" ? "Golden Pin" : "Pin Peniti Emas"}></div>
                )}
                <div className="polaroid-tag">{item.tag}</div>
                <div className="polaroid-photo-frame">
                  <Image
                    src={item.imgSrc}
                    alt={item.alt}
                    width={340}
                    height={240}
                    className="polaroid-img"
                    loading="lazy"
                  />
                </div>
                <div className="polaroid-caption-area">
                  <h3 className="polaroid-caption-title">{item.caption}</h3>
                  <p className="polaroid-caption-sub">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="polaroid-nav-btn next"
          onClick={() => scrollReel("right")}
          aria-label="Foto Berikutnya"
        >
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      {/* Mobile Swipe Guidance Hint */}
      <div className="polaroid-mobile-hint">
        <i className="fa-solid fa-arrows-left-right"></i>
        <span>{locale === "ar" ? "اسحب لمشاهدة الذكريات" : locale === "en" ? "Swipe horizontally to explore" : "Geser layar untuk menelusuri kenangan"}</span>
      </div>

      {/* Footer Callout to Full Digital Museum */}
      <div className="polaroid-footer-cta">
        <Link href="/beranda" className="btn-tuku-album-link">
          <i className="fa-solid fa-book-journal-whills"></i>
          <span>
            {locale === "ar"
              ? "افتح أكثر من 150 صفحة في المتحف الرقمي ➔"
              : locale === "en"
              ? "Open 150+ Full Album Pages in Museum ➔"
              : "Buka 150+ Halaman Album Lengkap di Museum ➔"}
          </span>
        </Link>
      </div>
    </section>
  );
}

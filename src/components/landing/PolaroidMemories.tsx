"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

interface MemorySnap {
  id: string;
  imgSrc: string;
  alt: string;
  caption: string;
  sub: string;
  rotation: string;
  tag: string;
}

const MEMORIES: MemorySnap[] = [
  {
    id: "cover",
    imgSrc: "/assets/foto_putra/Cover Depan.webp",
    alt: "Album Kenangan Expedient 43",
    caption: "The Successor of Islamic Glory",
    sub: "Mahakarya Buku Tahunan Angkatan 43",
    rotation: "-2deg",
    tag: "Dokumen Resmi",
  },
  {
    id: "pg643",
    imgSrc: "/assets/foto_putra/Hal 5.webp",
    alt: "Momen Panggung Gembira 643",
    caption: "Panggung Gembira 643",
    sub: "Kamis Malam, 18 Juli 2024",
    rotation: "1.8deg",
    tag: "Pentas Akbar",
  },
  {
    id: "kmi",
    imgSrc: "/assets/foto_putra/Hal 8.webp",
    alt: "Kawah Candradimuka KMI",
    caption: "Kulliyyatul Mu'allimin",
    sub: "Tarbiyah & Ta'lim 24 Jam",
    rotation: "-1.5deg",
    tag: "Keilmuan",
  },
  {
    id: "slahung",
    imgSrc: "/assets/foto_putra/Hal 6.webp",
    alt: "Bumi Gundik Slahung",
    caption: "Tanah Berkah Gundik",
    sub: "Slahung, Ponorogo, Jawa Timur",
    rotation: "2.2deg",
    tag: "Bumi Santri",
  },
  {
    id: "ukhuwah",
    imgSrc: "/assets/foto_putra/Hal 9.webp",
    alt: "Ikatan Persaudaraan Santri",
    caption: "Ukhuwah Fi Sabilillah",
    sub: "240 Sahabat Seperjuangan",
    rotation: "-2.4deg",
    tag: "Persaudaraan",
  },
  {
    id: "perjuangan",
    imgSrc: "/assets/foto_putra/Hal 4.webp",
    alt: "Derap Langkah Santri",
    caption: "Derap Langkah Alumni",
    sub: "Menatap Masa Depan Peradaban",
    rotation: "1.2deg",
    tag: "Masa Depan",
  },
];

export default function PolaroidMemories() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
      <div className="section-header">
        <div className="tuku-heritage-badge" style={{ marginBottom: "12px" }}>
          <span className="badge-bullet">🎞️</span>
          <span>MEMORABILIA &amp; ARSIP FISIK</span>
        </div>
        <h2 className="section-title">
          Lembaran Foto Kenangan Santri
        </h2>
        <p className="section-lead">
          Nostalgia terekam abadi dari panggung pertunjukan, asrama, hingga tanah merah Slahung. Geser untuk melihat cuplikan album asli angkatan.
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
              <strong>{isPlaying ? "Memutar Nada Memori Santri..." : "Dengarkan Suasana Memori"}</strong>
              <span>Instrumen Nostalgia Slahung (Klik untuk Dengar)</span>
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

      {/* Swipeable Polaroid Cards Track */}
      <div className="polaroid-scroll-container">
        <div className="polaroid-track">
          {MEMORIES.map((item) => (
            <div
              key={item.id}
              className="polaroid-card"
              style={{ "--rotate-deg": item.rotation } as React.CSSProperties}
            >
              <div className="polaroid-pin"></div>
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

      {/* Footer Callout to Full Digital Museum */}
      <div className="polaroid-footer-cta">
        <Link href="/beranda" className="btn-tuku-album-link">
          <i className="fa-solid fa-book-journal-whills"></i>
          <span>Buka 150+ Halaman Album Lengkap di Museum ➔</span>
        </Link>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import TiltCard from "@/components/features/TiltCard";

interface TimelineEra {
  year: string;
  badge: string;
  title: string;
  subtitle: string;
  desc: string[];
  keyFigures?: string;
  location: string;
  highlights: string[];
  icon: string;
}

const HISTORICAL_ERAS: TimelineEra[] = [
  {
    year: "1982",
    badge: "FASE PERINTISAN & PELETAKAN BATU PERTAMA",
    title: "Lahirnya Cahaya di Bumi Slahung",
    subtitle: "Niat Tulus Wakaf Lillahi Ta'ala",
    desc: [
      "Diprakarsai dan dirintis oleh Drs. K.H. M. Ma'shum Sholeh (Alm) bersama Hj. Suwarni (Almh) di Desa Gundik, Kecamatan Slahung, Ponorogo, Jawa Timur.",
      "Dimulai dari surau sederhana dan tekad suci mendirikan lembaga pencetak ulama intelek yang berjiwa ikhlas, mandiri, dan berakhlak mulia di kawasan selatan Ponorogo.",
    ],
    keyFigures: "Drs. K.H. M. Ma'shum Sholeh (Alm) & Hj. Suwarni (Almh)",
    location: "Desa Gundik, Slahung, Ponorogo",
    highlights: ["Peletakan Batu Pertama", "Wakaf Pendidikan Umat", "Pondasi Nilai Keikhlasan"],
    icon: "fa-solid fa-seedling",
  },
  {
    year: "1990 - 2000",
    badge: "FASE KULLIYYATUL MU'ALLIMIN (KMI)",
    title: "Gemblengan Bahasa & Karakter Pemimpin",
    subtitle: "Standar Internasional Bahasa Arab & Inggris",
    desc: [
      "Mengadopsi sistem Kulliyyatul Mu'allimin Al-Islamiyyah (KMI) dengan disiplin totalitas 24 jam berbahasa resmi Arab dan Inggris.",
      "Santri dididik menguasai kitab kuning (turats), ilmu pengetahuan umum kontemporer, dan seni retorika khithabah untuk bekal dakwah global.",
    ],
    keyFigures: "Dewan Guru KMI & Asatidz Senior",
    location: "Kampus Putra & Putri Slahung",
    highlights: ["Dwibahasa 24 Jam", "Sistem KMI Modern", "Pentas Seni Khutbatu-l-'Arsy"],
    icon: "fa-solid fa-book-quran",
  },
  {
    year: "2000 - 2018",
    badge: "FASE EKSPANSI & MODERNISASI",
    title: "Pesatnya Pembangunan Sarana & Prestasi",
    subtitle: "Akreditasi & Jejaring Universitas Dunia",
    desc: [
      "Pembangunan Masjid Jami' Arrisalah, asrama bertingkat, perpustakaan riset, dan laboratorium sains modern di tengah sejuknya panorama Slahung.",
      "Kemitraan almamater meluas hingga pengakuan mu'adalah oleh Al-Azhar University Kairo, universitas Timur Tengah, serta perguruan tinggi terkemuka tanah air.",
    ],
    keyFigures: "Pimpinan Pondok & Yayasan Arrisalah",
    location: "Kampus Terpadu Arrisalah Slahung",
    highlights: ["Masjid Jami' Arrisalah", "Mu'adalah Al-Azhar Kairo", "Alumni Lintas Benua"],
    icon: "fa-solid fa-mosque",
  },
  {
    year: "2018 - 2026",
    badge: "FASE ERA DIGITAL & GENERASI KE-43",
    title: "44 Tahun Khidmat & Lahirnya Expedient 43",
    subtitle: "Integrasi Cyber-Spiritual & Ukhuwah Abadi",
    desc: [
      "Menapaki usia ke-44 tahun penuh keberkahan, Pondok Modern Arrisalah melahirkan ribuan alumni yang memimpin di berbagai lini keumatan.",
      "Lahirnya generasi ke-43 'Expedient Generation' yang mengukir sejarah dengan perpaduan nilai salaf, dedikasi kepesantrenan, dan ekosistem digital terpadu.",
    ],
    keyFigures: "Keluarga Besar Pimpinan, Asatidz & Santri 43",
    location: "Pondok Modern Arrisalah Slahung",
    highlights: ["44 Tahun Berdiri", "Generasi Expedient 43", "Mahakarya Digital Arsip"],
    icon: "fa-solid fa-certificate",
  },
];

export default function HistoryTimeline() {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = HISTORICAL_ERAS[activeIdx];

  return (
    <section className="history-section" id="sejarah">
      <div className="section-header">
        <div className="landing-prestige-badge" style={{ marginBottom: "14px" }}>
          <i className="fa-solid fa-landmark"></i>
          <span>Napak Tilas 44 Tahun Pondok Modern Arrisalah</span>
        </div>
        <h2 className="section-title">
          Sejarah Agung &amp; Jejak Langkah Almamater
        </h2>
        <p className="section-lead">
          Dari sebidang tanah wakaf di Desa Gundik Slahung tahun 1982, hingga menjelma menjadi kawah candradimuka pemimpin umat dan lahirnya angkatan ke-43.
        </p>
      </div>

      {/* Interactive Year Selector Tabs */}
      <div className="history-tabs-track">
        {HISTORICAL_ERAS.map((era, idx) => (
          <button
            key={era.year}
            type="button"
            className={`history-tab-item ${activeIdx === idx ? "active" : ""}`}
            onClick={() => setActiveIdx(idx)}
          >
            <span className="tab-year-pill">{era.year}</span>
            <span className="tab-title-text">{era.badge.split("&")[0]}</span>
            <span className="tab-active-glow"></span>
          </button>
        ))}
      </div>

      {/* Main Active Era Spotlight Card */}
      <div className="history-spotlight-wrapper">
        <div className="history-spotlight-card">
          <div className="history-spotlight-header">
            <div className="history-badge-row">
              <span className="history-badge-gold">
                <i className={active.icon}></i> {active.badge}
              </span>
              <span className="history-location-tag">
                <i className="fa-solid fa-location-dot"></i> {active.location}
              </span>
            </div>
            <div className="history-year-large">{active.year}</div>
          </div>

          <div className="history-content-grid">
            <div className="history-main-text">
              <h3 className="history-card-title">{active.title}</h3>
              <div className="history-card-sub">{active.subtitle}</div>

              <div className="history-desc-paragraphs">
                {active.desc.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              {active.keyFigures && (
                <div className="history-figure-box">
                  <i className="fa-solid fa-feather-pointed"></i>
                  <div>
                    <span className="figure-label">Tokoh Perintis / Pengasuh:</span>
                    <span className="figure-name">{active.keyFigures}</span>
                  </div>
                </div>
              )}

              <div className="history-highlights-row">
                {active.highlights.map((h, i) => (
                  <span key={i} className="highlight-pill">
                    <i className="fa-solid fa-check"></i> {h}
                  </span>
                ))}
              </div>
            </div>

            {/* Special Interactive Photobooth & Memory Callout */}
            <div className="history-photobooth-callout">
              <TiltCard className="photobooth-feature-box">
                <div className="photobooth-box-glow"></div>
                <div className="photobooth-icon-badge">
                  <i className="fa-solid fa-camera-retro"></i>
                </div>
                <h4 className="photobooth-box-title">Studio Photobooth Santri</h4>
                <p className="photobooth-box-desc">
                  Abadikan momen persaudaraan santri dengan cetakan foto strip retro 4-cut berornamen khas Pondok Modern Arrisalah dan Expedient 43.
                </p>

                <div className="photobooth-strip-mini-preview">
                  <div className="mini-photo-cell p1"></div>
                  <div className="mini-photo-cell p2"></div>
                  <div className="mini-photo-cell p3"></div>
                  <div className="mini-strip-footer">
                    <span>ARRISALAH SLAHUNG</span>
                    <span className="gold-text">EXPEDIENT 43</span>
                  </div>
                </div>

                <Link href="/photobooth" className="btn-open-photobooth">
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  <span>Cetak Foto Strip Santri (Bebas Akses)</span>
                </Link>
              </TiltCard>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

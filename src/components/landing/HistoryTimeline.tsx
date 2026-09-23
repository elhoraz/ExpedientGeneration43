"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import TiltCard from "@/components/features/TiltCard";
import { useLanguage } from "@/lib/i18n/LanguageContext";

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
    year: "1982 - 1985",
    badge: "FASE PERINTISAN & PERESMIAN MADINATUL THULLAB",
    title: "Lahirnya Cahaya di Bumi Slahung",
    subtitle: "Dirintis Drs. KH. Muhammad Ma'shum Yusuf & Diresmikan KH. Imam Zarkasyi",
    desc: [
      "Mulai dirintis pada tahun 1982 oleh Drs. KH. Muhammad Ma'shum Yusuf bin Taslim (alumnus KMI Gontor dan mantan sekretaris pribadi KH. Imam Zarkasyi) di Desa Gundik, Kecamatan Slahung, Ponorogo.",
      "Awalnya mendidik anak-anak putus sekolah dan dhuafa, resmi dibuka pada 1 Muharram 1403 H (18 Oktober 1982), dan diresmikan langsung oleh KH. Imam Zarkasyi (Trimurti Pendiri Pondok Modern Darussalam Gontor) pada 26 Februari 1985 dengan nama awal 'Madinatul Thullab' (Kota Santri).",
    ],
    keyFigures: "Drs. KH. Muhammad Ma'shum Yusuf bin Taslim & KH. Imam Zarkasyi",
    location: "Desa Gundik, Slahung, Ponorogo",
    highlights: ["1 Muharram 1403 H (1982)", "Diresmikan KH. Imam Zarkasyi 1985", "Awal Bernama Madinatul Thullab"],
    icon: "fa-solid fa-seedling",
  },
  {
    year: "1990 - 2000",
    badge: "FASE KULLIYYATUL MU'ALLIMIN AL-ISLAMIYYAH (KMI)",
    title: "Kurikulum Terpadu & Program Internasional",
    subtitle: "Penerapan Disiplin Total 24 Jam Bahasa Arab & Inggris",
    desc: [
      "Mengadopsi sistem KMI yang memadukan kedalaman ilmu agama (turats) dan keunggulan sains modern, disertai kewajiban disiplin 24 jam berbicara bahasa resmi Arab dan Inggris.",
      "Pondok berganti nama dan berkembang menjadi Pondok Modern Arrisalah Program Internasional, mencetak kader ulama intelek yang mandiri dan berwawasan luas.",
    ],
    keyFigures: "KH. Muhammad Ma'shum Yusuf & Dewan Guru KMI Arrisalah",
    location: "Kampus Putra & Putri Gundik Slahung",
    highlights: ["Dwibahasa 24 Jam", "Program Internasional", "Panca Jiwa & Khutbatu-l-'Arsy"],
    icon: "fa-solid fa-book-quran",
  },
  {
    year: "2000 - 2020",
    badge: "FASE EKSPANSI SARANA & ESTAFET KEPEMIMPINAN",
    title: "Pembangunan Kampus & Khidmat Penuh Keikhlasan",
    subtitle: "38 Tahun Pengabdian Sang Pendiri & Regenerasi Pimpinan",
    desc: [
      "Pembangunan Masjid Jami' Arrisalah, asrama bertingkat, laboratorium bahasa & sains, serta perluasan jenjang pendidikan dari dasar hingga KMI setingkat Aliyah.",
      "Setelah 38 tahun berkhidmat tulus mendidik umat, sang perintis Drs. KH. Muhammad Ma'shum Yusuf berpulang ke rahmatullah pada 18 Juli 2020. Estafet kepengasuhan dilanjutkan penuh amanah oleh putra sulung beliau, KH. Muhammad Azharullah, Lc.",
    ],
    keyFigures: "Alm. Drs. KH. Muhammad Ma'shum Yusuf & KH. Muhammad Azharullah, Lc.",
    location: "Kampus Terpadu Arrisalah Slahung",
    highlights: ["Masjid Jami' Arrisalah", "Dedikasi 38 Tahun Sang Pendiri", "Estafet KH. Muhammad Azharullah, Lc."],
    icon: "fa-solid fa-mosque",
  },
  {
    year: "2020 - 2026",
    badge: "FASE ANGKATAN 43 'EXPEDIENT GENERATION'",
    title: "The Successor of Islamic Glory",
    subtitle: "Panggung Gembira 643 Akbar (18 Juli 2024) & Ekosistem Digital",
    desc: [
      "Santri angkatan ke-43 menorehkan tinta emas melalui mahakarya seni akbar Panggung Gembira 643 'Expedient Generation' pada 18 Juli 2024 yang menampilkan Reog Ponorogo, Drama Perjuangan Buya Hamka, dan musikal santri mandiri.",
      "Melalui akun resmi Instagram @expedientgeneration_ dengan semboyan 'The Successor of Islamic Glory', alumni angkatan 43 terus merawat ukhuwah abadi dan meluncurkan portal alumni terpadu.",
    ],
    keyFigures: "KH. Muhammad Azharullah, Lc. & Santri Angkatan 43 (@expedientgeneration_)",
    location: "Pondok Modern Arrisalah Slahung",
    highlights: ["Panggung Gembira 643 (18 Juli 2024)", "The Successor of Islamic Glory", "Instagram @expedientgeneration_"],
    icon: "fa-solid fa-certificate",
  },
];

export default function HistoryTimeline() {
  const { t } = useLanguage();
  const [activeIdx, setActiveIdx] = useState(0);
  const active = HISTORICAL_ERAS[activeIdx];

  return (
    <section className="history-section" id="sejarah">
      <div className="section-header">
        <div className="tuku-heritage-badge" style={{ marginBottom: "14px" }}>
          <span className="badge-bullet">🏛️</span>
          <span>{t.history_section.badge}</span>
        </div>
        <h2 className="section-title">
          {t.history_section.title}
        </h2>
        <p className="section-lead">
          {t.history_section.lead}
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
                    <span className="figure-label">{t.history_section.figure_label}</span>
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
                <h4 className="photobooth-box-title">{t.history_section.photobooth_title}</h4>
                <p className="photobooth-box-desc">
                  {t.history_section.photobooth_desc}
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
                  <span>{t.history_section.photobooth_btn}</span>
                </Link>
              </TiltCard>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

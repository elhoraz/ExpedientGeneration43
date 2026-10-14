"use client";

import { useState } from "react";

interface VideoOption {
  id: string;
  category: "pg643" | "arrisalah";
  tabLabel: string;
  badge: string;
  title: string;
  desc: string;
  sourceLabel: string;
  icon: string;
}

const VIDEO_PLAYLIST: VideoOption[] = [
  // ==========================================
  // KATEGORI 1: PANGGUNG GEMBIRA 643 (MAHAKARYA ANGKATAN 43)
  // Channel: @JiilulHashiif
  // ==========================================
  {
    id: "W_BjXJve6ag",
    category: "pg643",
    tabLabel: "Grand Opening PG 643",
    badge: "MAHAKARYA AKBAR ANGKATAN 43",
    title: "Grand Opening Panggung Gembira 643 | Teatrikal Spektakuler",
    desc: "Teatrikal pembuka megah karya santri kelas 6 angkatan 43 (Expedient Generation) dengan tata panggung dan koreografi memukau ribuan pasang mata di panggung Arrisalah.",
    sourceLabel: "Expedient Generation (@JiilulHashiif)",
    icon: "fa-solid fa-masks-theater",
  },
  {
    id: "vVrMNaZtbjE",
    category: "pg643",
    tabLabel: "Tari Saman Spektakuler",
    badge: "KEKOMPAKAN SANTRI EXPEDIENT",
    title: "TARI SAMAN - Gerakan Cepat & Kompak Santri PG 643",
    desc: "Aksi tari saman legendaris dengan sinkronisasi tempo kilat, ketukan dada harmonis, dan kekompakan luar biasa seluruh santri Expedient 43.",
    sourceLabel: "Expedient Generation (@JiilulHashiif)",
    icon: "fa-solid fa-hands-clapping",
  },
  {
    id: "K0UQvLx3HDw",
    category: "pg643",
    tabLabel: "Reog Ponorogo Kolosal",
    badge: "SENI BUDAYA BUMI REOG",
    title: "REOG PONOROGO - Panggung Gembira 643 Ar-Risalah",
    desc: "Pertunjukan seni adiluhung Reog Ponorogo khas bumi Slahung lengkap dengan keperkasaan Dhadhak Merak, warok, dan barisan penari santri.",
    sourceLabel: "Expedient Generation (@JiilulHashiif)",
    icon: "fa-solid fa-crown",
  },
  {
    id: "o9JC8Z8ss0c",
    category: "pg643",
    tabLabel: "Nasyid Menggetarkan Jiwa",
    badge: "HARMONI NADA SANTRI",
    title: "SUARANYA BIKIN MERINDING! Nasyid Panggung Gembira 643",
    desc: "Harmoni vokal acapella dan lantunan nasyid penuh penghayatan karya santri Expedient yang menyentuh hati dan membuat satu panggung terharu.",
    sourceLabel: "Expedient Generation (@JiilulHashiif)",
    icon: "fa-solid fa-music",
  },
  {
    id: "Py1iowu_coc",
    category: "pg643",
    tabLabel: "Drama Buya Hamka",
    badge: "TEATER TRAGEDI & INSPIRASI",
    title: "DRAMA TRAGEDI: KISAH BUYA HAMKA - Panggung Gembira 643",
    desc: "Penghayatan teatrikal mendalam merefleksikan sejarah perjuangan, keteguhan prinsip, dan pengorbanan sang ulama besar Buya Hamka.",
    sourceLabel: "Expedient Generation (@JiilulHashiif)",
    icon: "fa-solid fa-book-quran",
  },
  {
    id: "me2-wPkDqzo",
    category: "pg643",
    tabLabel: "Tari Kecak Kolosal",
    badge: "KREASI NUSANTARA",
    title: "SPEKTAKULER! Penampilan Tari Kecak Kolosal - PG 643",
    desc: "Formasi lingkaran mistis dan ritme cak-cak membahana karya santri yang memadukan kedisiplinan gerak dan kobaran semangat seni tradisi.",
    sourceLabel: "Expedient Generation (@JiilulHashiif)",
    icon: "fa-solid fa-fire",
  },
  {
    id: "dbwjnAd-OTk",
    category: "pg643",
    tabLabel: "Jabbawockeez x Spects Pop",
    badge: "MODERN SHOW SANTRI",
    title: "Jabbawockeez X Spects Pop: Penampilan Dance Paling Spektakuler!",
    desc: "Modern dance bertopeng putih dengan koreografi hip-hop robotik paling enerjik dan tata cahaya spektakuler di panggung PG 643.",
    sourceLabel: "Expedient Generation (@JiilulHashiif)",
    icon: "fa-solid fa-wand-magic-sparkles",
  },

  // ==========================================
  // KATEGORI 2: DOKUMENTER RESMI ALMAMATER
  // Channel: @PondokModernArrisalah
  // ==========================================
  {
    id: "YIyRJISDQtk",
    category: "arrisalah",
    tabLabel: "Apel Tahunan Kampus",
    badge: "DOKUMENTER RESMI ARRISALAH TV",
    title: "Pekan Perkenalan Khutbatu-l-'Arsy 2026",
    desc: "Highlight resmi dinamika santri, apel tahunan, dan atmosfer kehidupan Pondok Modern Arrisalah Program Internasional Slahung Ponorogo.",
    sourceLabel: "Arrisalah TV",
    icon: "fa-solid fa-graduation-cap",
  },
  {
    id: "moGEsxDxUHo",
    category: "arrisalah",
    tabLabel: "Refleksi 44 Tahun",
    badge: "PROFIL ALMAMATER TERCINTA",
    title: "44 Tahun Pondok Modern Arrisalah",
    desc: "Refleksi perjalanan perintisan almamater, sarana kampus, dan gemblengan kader pemimpin dunia di bumi Slahung.",
    sourceLabel: "Refleksi Kampus",
    icon: "fa-solid fa-mosque",
  },
  {
    id: "x8_8NcIKJKA",
    category: "arrisalah",
    tabLabel: "Profil Lengkap Kampus",
    badge: "DOKUMENTER SEJARAH & SANTRI",
    title: "Profil Pondok Modern Arrisalah Slahung",
    desc: "Napak tilas sejarah perintisan, kehidupan asrama, tradisi kepesantrenan, dan memori tak terlupakan seluruh santri.",
    sourceLabel: "Ristec Production",
    icon: "fa-solid fa-book-open-reader",
  },
];

export default function HeritageVideoPlayer() {
  const [activeCategory, setActiveCategory] = useState<"pg643" | "arrisalah">("pg643");
  const filteredPlaylist = VIDEO_PLAYLIST.filter((v) => v.category === activeCategory);
  
  const [selectedId, setSelectedId] = useState<string>("W_BjXJve6ag");

  // Pastikan video terpilih selalu ada di list kategori aktif
  const active = filteredPlaylist.find((v) => v.id === selectedId) || filteredPlaylist[0] || VIDEO_PLAYLIST[0];

  const handleCategoryChange = (cat: "pg643" | "arrisalah") => {
    setActiveCategory(cat);
    const firstInCat = VIDEO_PLAYLIST.find((v) => v.category === cat);
    if (firstInCat) {
      setSelectedId(firstInCat.id);
    }
  };

  return (
    <div className="heritage-video-card">
      {/* Header Card */}
      <div className="heritage-video-header">
        <div className="video-badge">
          <span className="live-pulse-dot"></span>
          <i className="fa-solid fa-play"></i>
          <span>{active.badge}</span>
        </div>

        {/* Category Switcher Pill */}
        <div className="heritage-category-switch" role="group" aria-label="Kategori Video">
          <button
            type="button"
            className={`heritage-cat-btn ${activeCategory === "pg643" ? "active" : ""}`}
            onClick={() => handleCategoryChange("pg643")}
          >
            <i className="fa-brands fa-youtube" style={{ color: "#ff3333" }}></i>
            <span>Mahakarya PG 643</span>
            <span className="cat-counter">7</span>
          </button>
          <button
            type="button"
            className={`heritage-cat-btn ${activeCategory === "arrisalah" ? "active" : ""}`}
            onClick={() => handleCategoryChange("arrisalah")}
          >
            <i className="fa-solid fa-mosque"></i>
            <span>Almamater Arrisalah</span>
            <span className="cat-counter">3</span>
          </button>
        </div>

        <span className="video-loc">
          <i className="fa-solid fa-location-dot"></i> Desa Gundik, Slahung, Ponorogo
        </span>
      </div>

      {/* Video Selector Tabs */}
      <div className="heritage-video-tabs" role="tablist" aria-label="Pilihan Video Pagelaran & Profil">
        {filteredPlaylist.map((vid) => {
          const isActive = vid.id === active.id;
          return (
            <button
              key={vid.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`heritage-tab-btn ${isActive ? "active" : ""}`}
              onClick={() => setSelectedId(vid.id)}
            >
              <i className={vid.icon}></i>
              <span>{vid.tabLabel}</span>
            </button>
          );
        })}
      </div>

      {/* 16:9 Responsive Video Frame */}
      <div className="heritage-video-frame">
        <iframe
          key={active.id}
          src={`https://www.youtube.com/embed/${active.id}?rel=0&modestbranding=1`}
          title={`${active.title} - Pondok Modern Arrisalah Slahung Ponorogo`}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div>

      {/* Video Caption & External Channel Links */}
      <div className="heritage-video-footer">
        <div className="video-meta-block">
          <div className="video-source-pill">
            <i className="fa-solid fa-circle-check"></i>
            <span>Kanal: {active.sourceLabel}</span>
          </div>
          <h4 className="video-meta-title">{active.title}</h4>
          <p className="video-desc">
            <em>&ldquo;{active.desc}&rdquo;</em>
          </p>
        </div>

        <div className="heritage-video-actions">
          <a
            href={`https://www.youtube.com/watch?v=${active.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="video-action-btn btn-watch-yt"
            title="Tonton langsung di YouTube"
          >
            <i className="fa-solid fa-arrow-up-right-from-square"></i>
            <span>Buka di YouTube</span>
          </a>

          {/* Kanal Resmi Angkatan 43 (@JiilulHashiif) */}
          <a
            href="https://www.youtube.com/@JiilulHashiif"
            target="_blank"
            rel="noopener noreferrer"
            className="video-action-btn btn-channel btn-channel-pg"
            title="Kunjungi Kanal YouTube Resmi PG 643: @JiilulHashiif"
          >
            <i className="fa-brands fa-youtube"></i>
            <span>Kanal Resmi PG 643 (@JiilulHashiif)</span>
          </a>

          {/* Kanal Resmi Almamater */}
          <a
            href="https://www.youtube.com/@PondokModernArrisalah"
            target="_blank"
            rel="noopener noreferrer"
            className="video-action-btn btn-channel"
            title="Kunjungi Kanal YouTube Resmi Pondok Modern Arrisalah"
          >
            <i className="fa-brands fa-youtube"></i>
            <span>Kanal Arrisalah TV</span>
          </a>
        </div>
      </div>
    </div>
  );
}


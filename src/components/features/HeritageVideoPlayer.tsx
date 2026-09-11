"use client";

import { useState } from "react";

interface VideoOption {
  id: string;
  tabLabel: string;
  badge: string;
  title: string;
  desc: string;
  sourceLabel: string;
  icon: string;
}

const VIDEO_PLAYLIST: VideoOption[] = [
  {
    id: "YIyRJISDQtk",
    tabLabel: "Apel Tahunan & Suasana Kampus",
    badge: "DOKUMENTER RESMI ARRISALAH TV",
    title: "Pekan Perkenalan Khutbatu-l-'Arsy 2026",
    desc: "Highlight resmi dinamika santri, apel tahunan, dan atmosfer kehidupan Pondok Modern Arrisalah Program Internasional Slahung Ponorogo.",
    sourceLabel: "Arrisalah TV",
    icon: "fa-solid fa-graduation-cap",
  },
  {
    id: "moGEsxDxUHo",
    tabLabel: "Refleksi 44 Tahun Pondok",
    badge: "PROFIL ALMAMATER TERCINTA",
    title: "44 Tahun Pondok Modern Arrisalah",
    desc: "Refleksi perjalanan perintisan almamater, sarana kampus, dan gemblengan kader pemimpin dunia di bumi Slahung.",
    sourceLabel: "Refleksi Kampus",
    icon: "fa-solid fa-mosque",
  },
  {
    id: "x8_8NcIKJKA",
    tabLabel: "Dokumenter Lengkap Kampus",
    badge: "DOKUMENTER SEJARAH & SANTRI",
    title: "Profil Pondok Modern Arrisalah Slahung",
    desc: "Napak tilas sejarah perintisan, kehidupan asrama, tradisi kepesantrenan, dan memori tak terlupakan seluruh santri.",
    sourceLabel: "Ristec Production",
    icon: "fa-solid fa-book-open-reader",
  },
];

export default function HeritageVideoPlayer() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const active = VIDEO_PLAYLIST[selectedIdx];

  return (
    <div className="heritage-video-card">
      <div className="heritage-video-header">
        <div className="video-badge">
          <span className="live-pulse-dot"></span>
          <i className="fa-solid fa-play"></i>
          <span>{active.badge}</span>
        </div>
        <span className="video-loc">
          <i className="fa-solid fa-location-dot"></i> Desa Gundik, Slahung, Ponorogo
        </span>
      </div>

      {/* Video Selector Tabs */}
      <div className="heritage-video-tabs" role="tablist" aria-label="Pilihan Video Profil">
        {VIDEO_PLAYLIST.map((vid, idx) => {
          const isActive = idx === selectedIdx;
          return (
            <button
              key={vid.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`heritage-tab-btn ${isActive ? "active" : ""}`}
              onClick={() => setSelectedIdx(idx)}
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
          src={`https://www.youtube-nocookie.com/embed/${active.id}?rel=0&modestbranding=1`}
          title={`${active.title} - Pondok Modern Arrisalah Slahung Ponorogo`}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div>

      {/* Video Caption & External Channel Links */}
      <div className="heritage-video-footer">
        <div className="video-meta-block">
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

          <a
            href="https://www.youtube.com/@PondokModernArrisalah"
            target="_blank"
            rel="noopener noreferrer"
            className="video-action-btn btn-channel"
            title="Kunjungi Kanal YouTube Resmi Pondok Modern Arrisalah"
          >
            <i className="fa-brands fa-youtube"></i>
            <span>Kanal Resmi Arrisalah</span>
          </a>
        </div>
      </div>
    </div>
  );
}

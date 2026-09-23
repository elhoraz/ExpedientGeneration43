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

const ERA_ICONS = [
  "fa-solid fa-seedling",
  "fa-solid fa-book-quran",
  "fa-solid fa-mosque",
  "fa-solid fa-certificate",
];

export default function HistoryTimeline() {
  const { t } = useLanguage();
  const [activeIdx, setActiveIdx] = useState(0);
  const eras = (t.history_era_items && t.history_era_items.length > 0 ? t.history_era_items : []).map((era, i) => ({
    ...era,
    icon: ERA_ICONS[i % ERA_ICONS.length],
  }));
  const active = eras[activeIdx] || eras[0];

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
        {eras.map((era, idx) => (
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

"use client";

import { useState } from "react";
import Image from "next/image";
import TiltCard from "@/components/features/TiltCard";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const WISDOM_METAS: Record<string, { avatarBg: string; initials: string }> = {
  pendiri: { avatarBg: "linear-gradient(135deg, #ca8a04, #854d0e)", initials: "MY" },
  pimpinan: { avatarBg: "linear-gradient(135deg, #10b981, #064e3b)", initials: "MA" },
  "ibu-pengasuh": { avatarBg: "linear-gradient(135deg, #ec4899, #9d174d)", initials: "IN" },
  kmi: { avatarBg: "linear-gradient(135deg, #0284c7, #075985)", initials: "SR" },
  pengasuhan: { avatarBg: "linear-gradient(135deg, #8b5cf6, #5b21b6)", initials: "SL" },
  angkatan: { avatarBg: "linear-gradient(135deg, #e11d48, #9f1239)", initials: "EG" },
};

export default function WisdomAsatidz() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>("all");

  const list = (t.wisdom_items && t.wisdom_items.length > 0 ? t.wisdom_items : []).map(item => ({
    ...item,
    avatarBg: WISDOM_METAS[item.id]?.avatarBg || "linear-gradient(135deg, #ca8a04, #854d0e)",
    initials: WISDOM_METAS[item.id]?.initials || "AS",
  }));

  const filtered = activeTab === "all" ? list : list.filter(w => w.id.includes(activeTab));

  return (
    <section className="wisdom-section" id="nasehat">
      <div className="section-header">
        <div className="tuku-heritage-badge" style={{ marginBottom: "14px" }}>
          <span className="badge-bullet">📜</span>
          <span>{t.wisdom_section.badge}</span>
        </div>
        <h2 className="section-title">
          {t.wisdom_section.title}
        </h2>
        <p className="section-lead">
          {t.wisdom_section.lead}
        </p>
      </div>

      <div className="wisdom-grid">
        {filtered.map((item) => (
          <TiltCard key={item.id} className="wisdom-card">
            <div className="wisdom-card-glow"></div>
            
            <div className="wisdom-card-top">
              <span className="wisdom-tag-pill">
                <i className="fa-solid fa-star-and-crescent"></i> {item.tag}
              </span>
              <span className="wisdom-quote-mark">&ldquo;</span>
            </div>

            {item.arabicQuote && (
              <div className="wisdom-arabic-lead" dir="rtl">
                {item.arabicQuote}
              </div>
            )}

            <blockquote className="wisdom-quote-text">
              &ldquo;{item.quote}&rdquo;
            </blockquote>

            <div className="wisdom-author-box">
              <div className="wisdom-avatar-circle" style={{ background: item.avatarBg }}>
                <span>{item.initials}</span>
              </div>
              <div className="wisdom-author-info">
                <h4 className="wisdom-author-name">{item.name}</h4>
                <p className="wisdom-author-role">{item.role}</p>
                <span className="wisdom-author-inst">{item.institution}</span>
              </div>
            </div>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}

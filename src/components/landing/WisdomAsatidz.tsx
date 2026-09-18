"use client";

import { useState } from "react";
import Image from "next/image";
import TiltCard from "@/components/features/TiltCard";

interface WisdomItem {
  id: string;
  name: string;
  role: string;
  institution: string;
  quote: string;
  arabicQuote?: string;
  tag: string;
  avatarBg: string;
  initials: string;
}

const WISDOM_LIST: WisdomItem[] = [
  {
    id: "pimpinan",
    name: "Drs. K.H. M. Ma'shum Sholeh (Alm)",
    role: "Perintis & Pendiri Pondok Modern Arrisalah",
    institution: "Pondok Modern Arrisalah Slahung Ponorogo",
    arabicQuote: "خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ",
    quote: "Jadilah pribadi yang berani berjuang di mana pun kakimu berpijak. Santri Arrisalah bukan sekadar penghafal kalam, melainkan obor peradaban yang menerangi umat dengan keikhlasan dan ilmu yang bermanfaat.",
    tag: "Nasehat Agung Perintis",
    avatarBg: "linear-gradient(135deg, #ca8a04, #854d0e)",
    initials: "MS",
  },
  {
    id: "asatidz",
    name: "Dewan Asatidz & Masyayikh KMI",
    role: "Pengasuh & Pembimbing Santri Slahung",
    institution: "Kulliyyatul Mu'allimin Al-Islamiyyah",
    arabicQuote: "العِلْمُ بِلَا عَمَلٍ كَالشَّجَرِ بِلَا ثَمَرٍ",
    quote: "Kekuatan terbesar alumni Expedient 43 bukan terletak pada megahnya dunia yang kalian genggam, melainkan pada keteguhan sujud di sepertiga malam dan ukhuwah yang tak pernah retak diterpa zaman.",
    tag: "Amanat Dewan Guru",
    avatarBg: "linear-gradient(135deg, #10b981, #064e3b)",
    initials: "DA",
  },
  {
    id: "alumni-1",
    name: "Perwakilan Alumni di Al-Azhar Kairo",
    role: "Studi Islam & Turats Internasional",
    institution: "Al-Azhar University, Mesir",
    quote: "Gemblengan dwibahasa dan mentalitas santri Slahung menjadi bekal tak ternilai saat kami bersaing di panggung internasional. Expedient 43 adalah ikatan suci yang terus menyemangati langkah kami.",
    tag: "Kiprah Global",
    avatarBg: "linear-gradient(135deg, #0284c7, #075985)",
    initials: "AZ",
  },
  {
    id: "alumni-2",
    name: "Perwakilan Alumni Sains & Profesional",
    role: "Teknokrat, Pengusaha & Medis",
    institution: "Perguruan Tinggi Negeri & Industri",
    quote: "Nilai keikhlasan dan kemandirian yang ditanamkan sejak subuh di asrama Slahung menjadi kompas moral kami di dunia profesional. Kami bangga menjadi bagian dari keluarga besar Expedient 43.",
    tag: "Inovasi & Karir",
    avatarBg: "linear-gradient(135deg, #e11d48, #9f1239)",
    initials: "EX",
  },
];

export default function WisdomAsatidz() {
  const [activeTab, setActiveTab] = useState<string>("all");

  const filtered = activeTab === "all" ? WISDOM_LIST : WISDOM_LIST.filter(w => w.id.includes(activeTab));

  return (
    <section className="wisdom-section" id="nasehat">
      <div className="section-header">
        <div className="landing-prestige-badge" style={{ marginBottom: "14px" }}>
          <i className="fa-solid fa-feather-pointed"></i>
          <span>Wejangan Guru &amp; Suluh Perjuangan</span>
        </div>
        <h2 className="section-title">
          Kalam Hikmah &amp; Nasehat Asatidz
        </h2>
        <p className="section-lead">
          Pondasi ruhani yang senantiasa menuntun setiap jejak langkah santri dan alumni Expedient 43 di manapun mengabdi.
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

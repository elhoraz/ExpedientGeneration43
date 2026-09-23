"use client";

import { useState } from "react";
import Image from "next/image";
import TiltCard from "@/components/features/TiltCard";
import { useLanguage } from "@/lib/i18n/LanguageContext";

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
    id: "pendiri",
    name: "Drs. K.H. Muhammad Ma'shum Yusuf (Alm)",
    role: "Perintis & Pendiri Pondok Modern Arrisalah (1956 - 2020)",
    institution: "Pondok Modern Arrisalah Slahung Ponorogo",
    arabicQuote: "خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ",
    quote: "Harga dirimu sebesar perjuanganmu. Jangan malu berangkat dari yang kecil dan sederhana, sebab perkara besar bermula dari yang kecil, maka kecil harus baik. Pondok ini berdiri di atas dan untuk semua golongan.",
    tag: "Falsafah Luhur Pendiri",
    avatarBg: "linear-gradient(135deg, #ca8a04, #854d0e)",
    initials: "MY",
  },
  {
    id: "pimpinan",
    name: "K.H. Muhammad Azharullah, Lc.",
    role: "Pimpinan Pondok / Headmaster (Putra & Penerus Pendiri)",
    institution: "Pondok Modern Arrisalah Program Internasional",
    arabicQuote: "إِنَّ الَّذِينَ قَالُوا رَبُّنَا اللَّهُ ثُمَّ اسْتَقَامُوا فَلَا خَوْفٌ عَلَيْهِمْ وَلَا هُمْ يَحْزَنُونَ",
    quote: "Mintalah keistiqomahan agar kamu senantiasa berada di jalan-Nya dan berakhir juga di dalam agama-Nya. Tidak ragu-ragu, tidak takut, dan tidak sedih, karena Allah sudah memberi kabar gembira bagi mereka yang istiqomah.",
    tag: "Amanat Pimpinan Pondok",
    avatarBg: "linear-gradient(135deg, #10b981, #064e3b)",
    initials: "MA",
  },
  {
    id: "ibu-pengasuh",
    name: "Al-Ustadzah Indriatin, S.Pd.I",
    role: "Headmaster of Woman's Arrisalah (Istri Pimpinan Pondok)",
    institution: "Pondok Modern Arrisalah Putri Slahung",
    arabicQuote: "خَيْرُ النَّاسِ أَحْسَنُهُمْ خُلُقًا وَأَنْفَعُهُمْ لِلنَّاسِ",
    quote: "Jagalah Sholatmu, Jagalah Ilmumu, Jagalah Akhlaqmu. Orang sepintar apapun kalau tidak punya akhlaq dan adab yang baik, maka tidak ada gunanya di tengah masyarakat.",
    tag: "Nasehat Ibu Pengasuh",
    avatarBg: "linear-gradient(135deg, #ec4899, #9d174d)",
    initials: "IN",
  },
  {
    id: "kmi",
    name: "Al-Ustadz Sa'roni, Lc.",
    role: "Direktur KMI (KMI Director)",
    institution: "Kulliyyatul Mu'allimin Al-Islamiyyah Arrisalah",
    arabicQuote: "حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ",
    quote: "Dimanapun, kapanpun, menjadi apapun, jangan pernah meninggalkan sholat wajib!",
    tag: "Pesan Direktur KMI",
    avatarBg: "linear-gradient(135deg, #0284c7, #075985)",
    initials: "SR",
  },
  {
    id: "pengasuhan",
    name: "Al-Ustadz Shoiman Lukmanul Hakim",
    role: "Direktur Pengasuhan Santri (Student Director)",
    institution: "Pondok Modern Arrisalah Slahung Ponorogo",
    arabicQuote: "يَا أَيُّهَا الَّذِينَ آمَنُوا اذْكُرُوا اللَّهَ ذِكْرًا كَثِيرًا",
    quote: "Jaga harga dirimu jangan sampai ternoda, jangan jadi pengemis tetapi jadilah pemberi. Berusahalah menjadi orang yang kaya jasa, amal, ilmu dan harta tetapi tetap bertaqwa kepada Allah SWT.",
    tag: "Pesan Pengasuhan Santri",
    avatarBg: "linear-gradient(135deg, #8b5cf6, #5b21b6)",
    initials: "SL",
  },
  {
    id: "angkatan",
    name: "The Successor of Islamic Glory",
    role: "Santri Angkatan ke-43 (@expedientgeneration_)",
    institution: "Panggung Gembira 643 Akbar (18 Juli 2024)",
    arabicQuote: "وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ",
    quote: "Lahir dari kawah candradimuka Arrisalah Slahung, kami berikrar merawat ukhuwah abadi, menjunjung tinggi Panca Jiwa dan Motto Pondok, serta melesat menjadi panah peradaban demi kejayaan Islam.",
    tag: "Ikrar Angkatan 43",
    avatarBg: "linear-gradient(135deg, #e11d48, #9f1239)",
    initials: "EG",
  },
];

export default function WisdomAsatidz() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>("all");

  const filtered = activeTab === "all" ? WISDOM_LIST : WISDOM_LIST.filter(w => w.id.includes(activeTab));

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

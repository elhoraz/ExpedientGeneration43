"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PAGE_GUIDES, CATEGORIES, PageGuide } from "@/data/guideData";
import PageGuideModal from "@/components/guide/PageGuideModal";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import "./panduan.css";

const GENERAL_FAQS = [
  {
    q: "Bagaimana cara mengubah nomor WhatsApp atau foto profil saya?",
    a: "Buka menu 'Profil' dari bilah samping (Sidebar) atau klik foto profil Anda. Di halaman tersebut, Anda dapat mengunggah foto baru, memotong foto avatar, serta memperbarui nomor WhatsApp, kota tinggal, dan profesi Anda lalu tekan 'Simpan Perubahan'.",
  },
  {
    q: "Apakah data kontak alumni aman di portal ini?",
    a: "Sangat aman. Seluruh akses direktori, nomor telepon, dan fitur obrolan dilindungi sistem autentikasi terenkripsi yang hanya dapat diakses oleh anggota resmi angkatan ke-43 yang telah diverifikasi.",
  },
  {
    q: "Bagaimana cara memasang aplikasi ini di layar utama ponsel (Homescreen)?",
    a: "Buka menu 'Fitur' lalu pilih 'Pusat Unduhan (Download)'. Di Android Chrome, tekan tombol 'Pasang Aplikasi'. Di iPhone Safari, tekan tombol Share (ikon kotak panah ke atas) lalu pilih 'Add to Home Screen' (Tambah ke Layar Utama).",
  },
  {
    q: "Bagaimana cara mengunduh Kartu Tanda Anggota (KTA 3D)?",
    a: "Buka menu 'Fitur' > 'Kartu Alumni (KTA 3D)'. Sentuh dan putar kartu digital Anda, lalu tekan tombol ikon unduh (panah ke bawah) di sudut kanan atas untuk menyimpan gambar KTA beresolusi tinggi ke galeri ponsel Anda.",
  },
  {
    q: "Mengapa saya tidak bisa membuka halaman Admin?",
    a: "Menu Administrator hanya dapat diakses oleh akun pengurus resmi yang memiliki role 'admin' atau 'superadmin'. Jika Anda merupakan pengurus angkatan, silakan hubungi tim sekretariat untuk aktivasi hak akses.",
  },
];

export default function PanduanClient() {
  const router = useRouter();
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>("semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeModalGuide, setActiveModalGuide] = useState<PageGuide | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Filter panduan berdasarkan kategori dan kata kunci pencarian
  const filteredGuides = useMemo(() => {
    return PAGE_GUIDES.filter((guide) => {
      const matchCategory =
        selectedCategory === "semua" || guide.category === selectedCategory;

      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        guide.title.toLowerCase().includes(q) ||
        guide.subtitle.toLowerCase().includes(q) ||
        guide.summary.toLowerCase().includes(q) ||
        guide.route.toLowerCase().includes(q) ||
        guide.controls.some((c) => c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)) ||
        guide.tips.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, searchQuery]);

  // Restart onboarding tour
  const handleRestartTour = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("expedient_onboarding_tour_done");
      localStorage.removeItem("expedient_onboarding_welcome_done");
      window.dispatchEvent(new CustomEvent("expedient-restart-tour"));
      router.push("/beranda");
    }
  };

  return (
    <div className="panduan-page">
      {/* 1. HERO SECTION */}
      <section className="panduan-hero">
        <div className="panduan-tagline">
          <i className="fa-solid fa-graduation-cap"></i> Expedient 43
        </div>
        <h1 className="panduan-title">{t.panduan.title}</h1>
        <p className="panduan-subtitle">
          {t.panduan.subtitle}
        </p>

        {/* Live Search Bar */}
        <div className="panduan-search-wrapper">
          <i className="fa-solid fa-magnifying-glass panduan-search-icon"></i>
          <input
            type="text"
            className="panduan-search-input"
            placeholder={t.panduan.search_placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="panduan-search-clear"
              onClick={() => setSearchQuery("")}
              title={t.common.close}
            >
              <i className="fa-solid fa-circle-xmark"></i>
            </button>
          )}
        </div>
      </section>

      {/* 2. RESTART TOUR BANNER */}
      <div className="panduan-quick-banner">
        <div className="quick-banner-content">
          <div className="quick-banner-icon">
            <i className="fa-solid fa-compass"></i>
          </div>
          <div className="quick-banner-text">
            <h4>Butuh Tur Pengenalan Ulang?</h4>
            <p>Jalankan kembali tur panduan langkah-demi-langkah yang menyorot tombol-tombol utama.</p>
          </div>
        </div>
        <button
          type="button"
          className="btn-restart-tour"
          onClick={handleRestartTour}
        >
          <i className="fa-solid fa-play"></i> Mulai Tur Interaktif
        </button>
      </div>

      {/* 3. CATEGORY CHIPS */}
      <div className="panduan-categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`category-chip ${selectedCategory === cat.id ? "active" : ""}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <i className={cat.icon}></i>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* 4. GUIDES GRID */}
      <div className="panduan-grid">
        {filteredGuides.length === 0 ? (
          <div className="panduan-empty-state">
            <i className="fa-solid fa-magnifying-glass-chart"></i>
            <h3>Tidak Ditemukan Panduan</h3>
            <p>Tidak ada panduan yang cocok dengan kata kunci &quot;{searchQuery}&quot;. Silakan coba kata kunci lain.</p>
          </div>
        ) : (
          filteredGuides.map((guide) => (
            <div key={guide.id} className="guide-card">
              <div className="guide-card-top">
                <div className="guide-card-icon">
                  <i className={guide.icon}></i>
                </div>
                <div className="guide-card-badges">
                  <span className="guide-card-category">{guide.categoryLabel}</span>
                  {guide.badge && <span className="guide-card-badge">{guide.badge}</span>}
                </div>
              </div>

              <h3 className="guide-card-title">{guide.title}</h3>
              <p className="guide-card-subtitle">{guide.subtitle}</p>
              <p className="guide-card-summary">{guide.summary}</p>

              {/* Preview Tombol Penting */}
              {guide.controls.length > 0 && (
                <div className="guide-card-controls-preview">
                  <span className="preview-label">Tombol Utama:</span>
                  <div className="preview-chips">
                    {guide.controls.slice(0, 3).map((ctrl, i) => (
                      <span key={i} className="preview-chip">
                        <i className={ctrl.icon}></i> {ctrl.name}
                      </span>
                    ))}
                    {guide.controls.length > 3 && (
                      <span className="preview-chip">+{guide.controls.length - 3} lainnya</span>
                    )}
                  </div>
                </div>
              )}

              {/* Aksi Buka Modal & Kunjungi Halaman */}
              <div className="guide-card-actions">
                <button
                  type="button"
                  className="btn-open-guide-modal"
                  onClick={() => setActiveModalGuide(guide)}
                >
                  <i className="fa-solid fa-book-open-reader"></i> Baca Panduan Lengkap
                </button>
                <Link
                  href={guide.route}
                  className="btn-visit-page"
                  title={`Buka halaman ${guide.title}`}
                >
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 5. FAQ SECTION */}
      <section className="panduan-faq-section">
        <div className="section-heading-center">
          <h2>{t.panduan.faq_title}</h2>
          <p>{t.panduan.faq_subtitle}</p>
        </div>

        <div className="faq-list">
          {GENERAL_FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className={`faq-card ${isOpen ? "open" : ""}`}>
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                >
                  <span>{faq.q}</span>
                  <i className="fa-solid fa-chevron-down"></i>
                </button>
                {isOpen && (
                  <div className="faq-answer-body">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal Popup jika kartu panduan ditekan */}
      <PageGuideModal
        guide={activeModalGuide}
        isOpen={Boolean(activeModalGuide)}
        onClose={() => setActiveModalGuide(null)}
      />
    </div>
  );
}

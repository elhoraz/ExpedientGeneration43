"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getGuideByPath, PAGE_GUIDES, PageGuide } from "@/data/guideData";
import PageGuideModal from "./PageGuideModal";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import "./guide.css";

export default function HelpButtonTrigger() {
  const pathname = usePathname();
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [currentGuide, setCurrentGuide] = useState<PageGuide | null>(null);

  // Cari panduan untuk halaman aktif
  useEffect(() => {
    if (!pathname) return;
    const matched = getGuideByPath(pathname);
    if (matched) {
      setCurrentGuide(matched);
    } else {
      // Fallback guide jika halaman belum terdaftar khusus
      setCurrentGuide({
        id: "general",
        route: pathname,
        title: "Panduan Portal",
        subtitle: "Layanan & Fitur Expedient Generation",
        category: "utama",
        categoryLabel: "Umum",
        icon: "fa-solid fa-circle-question",
        summary:
          "Selamat datang di portal alumni Expedient 43. Anda dapat menelusuri seluruh fitur lewat menu samping (Sidebar) atau membuka Pusat Panduan lengkap.",
        howToUse: [
          "Gunakan bilah navigasi samping untuk berpindah antar halaman.",
          "Buka Pusat Panduan untuk membaca dokumentasi seluruh 30+ fitur portal.",
          "Hubungi pengurus alumni jika memerlukan bantuan tambahan.",
        ],
        controls: [
          { name: "Pusat Panduan", icon: "fa-solid fa-book-bookmark", desc: "Katalog seluruh dokumentasi fitur portal." },
          { name: "Bilah Samping (Sidebar)", icon: "fa-solid fa-bars", desc: "Daftar navigasi menu utama dan fitur alumni." },
        ],
        tips: ["Seluruh fitur dapat diakses optimal melalui ponsel pintar maupun komputer."],
      });
    }
  }, [pathname]);

  const [isSidebarClosed, setIsSidebarClosed] = useState(false);

  // Dengarkan custom event dari tombol lain (misal dari command palette atau checklist)
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("expedient-open-guide", handleOpen);
    return () => window.removeEventListener("expedient-open-guide", handleOpen);
  }, []);

  // Sinkronisasi status buka/tutup navbar/sidebar
  useEffect(() => {
    if (typeof document !== "undefined") {
      setIsSidebarClosed(document.body.classList.contains("sidebar-closed"));
    }
    const handleToggle = (e: any) => {
      if (e.detail && typeof e.detail.isOpen === "boolean") {
        setIsSidebarClosed(!e.detail.isOpen);
      }
    };
    window.addEventListener("expedient-sidebar-toggle", handleToggle);
    return () => window.removeEventListener("expedient-sidebar-toggle", handleToggle);
  }, []);

  // Jangan tampilkan tombol melayang jika pengguna sedang membuka halaman /panduan
  if (pathname === "/panduan") {
    return null;
  }

  return (
    <>
      <button
        type="button"
        id="btnFloatingHelp"
        className="floating-help-btn"
        onClick={() => {
          if (navigator.vibrate) navigator.vibrate(20);
          setIsOpen(true);
        }}
        title={`Bantuan & Bahasa / Help & Language (${locale.toUpperCase()})`}
        aria-label="Bantuan dan Panduan Halaman"
        aria-hidden={isSidebarClosed}
        tabIndex={isSidebarClosed ? -1 : 0}
      >
        <span className="help-btn-icon">
          <i className="fa-solid fa-question"></i>
        </span>
        <span className="help-btn-label">
          {locale === "ar" ? "مساعدة" : locale === "en" ? "Help" : "Bantuan"}
        </span>
        <span className="help-btn-divider"></span>
        <span
          className="help-btn-lang"
          onClick={(e) => {
            e.stopPropagation();
            const nextLocale = locale === "id" ? "ar" : locale === "ar" ? "en" : "id";
            if (navigator.vibrate) navigator.vibrate(15);
            setLocale(nextLocale);
          }}
          title="Klik untuk beralih bahasa / Click to cycle language (ID → AR → EN)"
        >
          <i className="fa-solid fa-globe" style={{ fontSize: "0.72rem", marginRight: "3px" }}></i>
          <span>{locale.toUpperCase()}</span>
        </span>
      </button>

      <PageGuideModal
        guide={currentGuide}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

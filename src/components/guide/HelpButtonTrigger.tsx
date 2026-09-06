"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getGuideByPath, PAGE_GUIDES, PageGuide } from "@/data/guideData";
import PageGuideModal from "./PageGuideModal";
import "./guide.css";

export default function HelpButtonTrigger() {
  const pathname = usePathname();
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

  // Dengarkan custom event dari tombol lain (misal dari command palette atau checklist)
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("expedient-open-guide", handleOpen);
    return () => window.removeEventListener("expedient-open-guide", handleOpen);
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
        title={`Bantuan & Panduan: ${currentGuide?.title || "Halaman Ini"}`}
        aria-label="Bantuan dan Panduan Halaman"
      >
        <span className="help-btn-icon">
          <i className="fa-solid fa-question"></i>
        </span>
        <span className="help-btn-label">Bantuan</span>
      </button>

      <PageGuideModal
        guide={currentGuide}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

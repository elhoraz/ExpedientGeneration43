"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import type { PageGuide } from "@/data/guideData";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import "./guide.css";

const PageGuideModal = dynamic(() => import("./PageGuideModal"), {
  ssr: false,
});

function buildFallbackGuide(pathname: string, locale: string): PageGuide {
  return {
    id: "general",
    route: pathname,
    title: locale === "ar" ? "دليل البوابة" : locale === "en" ? "Portal Guide" : "Panduan Portal",
    subtitle:
      locale === "ar"
        ? "خدمات ومزايا منصة إكسبيدينت 43"
        : locale === "en"
        ? "Expedient 43 Services & Features"
        : "Layanan & Fitur Expedient Generation",
    category: "utama",
    categoryLabel: locale === "ar" ? "عام" : locale === "en" ? "General" : "Umum",
    icon: "fa-solid fa-circle-question",
    summary:
      locale === "ar"
        ? "مرحباً بك في بوابة خريجي إكسبيدينت 43. يمكنك التنقل عبر القائمة الجانبية أو فتح مركز الأدلة الكامل."
        : locale === "en"
        ? "Welcome to the Expedient 43 alumni portal. Browse features via the sidebar navigation or open the complete Guide Center."
        : "Portal alumni Expedient 43 menyediakan seluruh layanan angkatan lewat menu samping dan Pusat Panduan.",
    howToUse:
      locale === "ar"
        ? [
            "استخدم شريط التنقل الجانبي للانتقال بين الصفحات.",
            "افتح مركز الأدلة للاطلاع على شروحات ميزات البوابة.",
            "تواصل مع منسقي الخريجين إذا احتجت إلى مساعدة إضافية.",
          ]
        : locale === "en"
        ? [
            "Use the sidebar navigation to switch between portal pages.",
            "Open the Guide Center to read documentation across portal features.",
            "Contact cohort administrators if you need further assistance.",
          ]
        : [
            "Gunakan bilah navigasi samping untuk berpindah antar halaman.",
            "Buka Pusat Panduan untuk membaca dokumentasi seluruh fitur portal.",
            "Hubungi pengurus alumni jika memerlukan bantuan tambahan.",
          ],
    controls:
      locale === "ar"
        ? [
            { name: "مركز الأدلة", icon: "fa-solid fa-book-bookmark", desc: "دليل شامل لمزايا البوابة." },
            { name: "الشريط الجانبي", icon: "fa-solid fa-bars", desc: "قائمة التنقل الرئيسية لأقسام الخريجين." },
          ]
        : locale === "en"
        ? [
            { name: "Guide Center", icon: "fa-solid fa-book-bookmark", desc: "Directory of portal feature documentation." },
            { name: "Sidebar Navigation", icon: "fa-solid fa-bars", desc: "Primary navigation menu for alumni modules." },
          ]
        : [
            { name: "Pusat Panduan", icon: "fa-solid fa-book-bookmark", desc: "Katalog dokumentasi fitur portal." },
            { name: "Bilah Samping", icon: "fa-solid fa-bars", desc: "Daftar navigasi menu utama alumni." },
          ],
    tips:
      locale === "ar"
        ? ["جميع المزايا مصممة للعمل بسلاسة على الهواتف الذكية وأجهزة الحاسوب."]
        : locale === "en"
        ? ["All features are optimized for both mobile phones and desktop screens."]
        : ["Seluruh fitur dapat diakses dengan nyaman melalui ponsel maupun komputer."],
  };
}

export default function HelpButtonTrigger() {
  const pathname = usePathname();
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [currentGuide, setCurrentGuide] = useState<PageGuide | null>(null);
  const [isSidebarClosed, setIsSidebarClosed] = useState(false);

  // Lazy-load 73 KB guide dictionary ONLY when the user actually opens the help modal
  useEffect(() => {
    if (!isOpen || !pathname) return;
    let active = true;
    const guideLocale = locale === "en" || locale === "ar" ? locale : "id";

    import("@/data/guideLocales")
      .then(({ getLocalizedGuideByPath }) => {
        if (!active) return;
        const matched = getLocalizedGuideByPath(pathname, guideLocale);
        setCurrentGuide(matched || buildFallbackGuide(pathname, locale));
      })
      .catch(() => {
        if (active) setCurrentGuide(buildFallbackGuide(pathname, locale));
      });

    return () => {
      active = false;
    };
  }, [isOpen, pathname, locale]);

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

  // Jangan tampilkan tombol melayang jika pengguna sedang membuka panduan, chat, atau photobooth agar tidak tumpang tindih
  if (pathname === "/panduan" || pathname?.startsWith("/chat") || pathname?.startsWith("/photobooth")) {
    return null;
  }

  return (
    <>
      <div className={`floating-help-pill ${isSidebarClosed ? "is-hidden" : ""}`} aria-hidden={isSidebarClosed}>
        <button
          type="button"
          id="btnFloatingHelp"
          className="floating-help-btn"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(20);
            setIsOpen(true);
          }}
          title={locale === "ar" ? "دليل هذه الصفحة" : locale === "en" ? "Page Help & Guide" : "Bantuan & Panduan Halaman"}
          aria-label={locale === "ar" ? "دليل هذه الصفحة" : locale === "en" ? "Page Help & Guide" : "Bantuan dan Panduan Halaman"}
          tabIndex={isSidebarClosed ? -1 : 0}
        >
          <span className="help-btn-icon" aria-hidden="true">
            <i className="fa-solid fa-question"></i>
          </span>
          <span className="help-btn-label">
            {locale === "ar" ? "مساعدة" : locale === "en" ? "Help" : "Bantuan"}
          </span>
        </button>
        <span className="help-btn-divider" aria-hidden="true"></span>
        <button
          type="button"
          id="btnFloatingLang"
          className="help-btn-lang"
          onClick={() => {
            const nextLocale = locale === "id" ? "ar" : locale === "ar" ? "en" : "id";
            if (navigator.vibrate) navigator.vibrate(15);
            setLocale(nextLocale);
          }}
          title={locale === "ar" ? "تغيير اللغة" : locale === "en" ? "Switch Language" : "Ganti Bahasa (ID / AR / EN)"}
          aria-label={locale === "ar" ? "تغيير اللغة" : locale === "en" ? "Switch Language" : "Ganti Bahasa"}
          tabIndex={isSidebarClosed ? -1 : 0}
        >
          <i className="fa-solid fa-globe" aria-hidden="true" style={{ fontSize: "0.75rem", marginInlineEnd: "4px" }}></i>
          <span>{locale.toUpperCase()}</span>
        </button>
      </div>

      {isOpen && (
        <PageGuideModal
          guide={currentGuide}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

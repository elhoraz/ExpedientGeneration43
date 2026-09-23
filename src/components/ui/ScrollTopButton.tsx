"use client";

import { useLanguage } from "@/lib/i18n";

export default function ScrollTopButton() {
  const { locale } = useLanguage();
  const label = locale === "ar" ? "الرجوع إلى الأعلى" : locale === "en" ? "Scroll to top" : "Kembali ke atas";

  return (
    <button 
      id="scrollTopBtn" 
      className="scroll-top-btn" 
      aria-label={label} 
      title={label}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <i className="fa-solid fa-chevron-up"></i>
    </button>
  );
}

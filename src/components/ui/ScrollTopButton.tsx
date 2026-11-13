"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n";

export default function ScrollTopButton() {
  const { locale } = useLanguage();
  const [visible, setVisible] = useState(false);
  const label =
    locale === "ar"
      ? "الرجوع إلى الأعلى"
      : locale === "en"
      ? "Scroll to top"
      : "Kembali ke atas";

  useEffect(() => {
    const mainWrapper = document.querySelector(".main-wrapper");

    const handleScroll = () => {
      const scrollPos = mainWrapper ? mainWrapper.scrollTop : window.scrollY;
      setVisible(scrollPos > 280);
    };

    if (mainWrapper) {
      mainWrapper.addEventListener("scroll", handleScroll, { passive: true });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (mainWrapper) {
        mainWrapper.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleScrollToTop = () => {
    const mainWrapper = document.querySelector(".main-wrapper");
    if (mainWrapper && mainWrapper.scrollTop > 0) {
      mainWrapper.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      id="scrollTopBtn"
      className={`scroll-top-btn ${visible ? "visible" : ""}`}
      aria-label={label}
      title={label}
      onClick={handleScrollToTop}
    >
      <i className="fa-solid fa-chevron-up"></i>
    </button>
  );
}

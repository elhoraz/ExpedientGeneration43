"use client";

import { useEffect, useState } from "react";

export default function ScrollToTopIndicator() {
  const [showBtn, setShowBtn] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    const getScrollContainer = (): HTMLElement | null => {
      return document.querySelector(".landing-wrapper") as HTMLElement | null;
    };

    const handleScroll = () => {
      const wrapper = getScrollContainer();
      let scrollTop = 0;
      let scrollHeight = 0;

      if (wrapper && wrapper.scrollHeight > wrapper.clientHeight) {
        scrollTop = wrapper.scrollTop;
        scrollHeight = wrapper.scrollHeight - wrapper.clientHeight;
      } else {
        const el = document.documentElement;
        scrollTop = window.scrollY || el.scrollTop || document.body.scrollTop;
        scrollHeight = el.scrollHeight - el.clientHeight;
      }

      const percent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setScrollPercent(Math.min(100, Math.max(0, Math.round(percent))));
      setShowBtn(scrollTop > 260);
    };

    const wrapper = getScrollContainer();
    if (wrapper) {
      wrapper.addEventListener("scroll", handleScroll, { passive: true });
    }
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    
    // Initial calculation
    handleScroll();

    return () => {
      if (wrapper) {
        wrapper.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, []);

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      if (navigator.vibrate) navigator.vibrate(15);
      const wrapper = document.querySelector(".landing-wrapper") as HTMLElement | null;
      if (wrapper && wrapper.scrollTop > 0) {
        wrapper.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  // Circular SVG params for FAB
  const size = 44;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (scrollPercent / 100) * circumference;

  return (
    <>
      {/* ====== 1. TOP GOLD HERITAGE SCROLL PROGRESS BAR ====== */}
      <div
        className="landing-top-progress-line"
        style={{
          transform: `scaleX(${scrollPercent / 100})`,
          opacity: scrollPercent > 0.5 ? 1 : 0,
        }}
        aria-hidden="true"
      />

      {/* ====== 2. CIRCULAR FLOATING BACK TO TOP BUTTON ====== */}
      {showBtn && (
        <button
          type="button"
          className="scroll-progress-fab"
          onClick={scrollToTop}
          title={`Kembali ke atas (${scrollPercent}%)`}
          aria-label="Scroll ke atas"
        >
          <svg className="scroll-svg-ring" width={size} height={size}>
            <circle
              className="scroll-ring-bg"
              stroke="rgba(212, 175, 55, 0.2)"
              strokeWidth={strokeWidth}
              fill="transparent"
              r={radius}
              cx={size / 2}
              cy={size / 2}
            />
            <circle
              className="scroll-ring-fill"
              stroke="#d4af37"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="transparent"
              r={radius}
              cx={size / 2}
              cy={size / 2}
            />
          </svg>
          <span className="scroll-fab-icon">
            <i className="fa-solid fa-chevron-up"></i>
          </span>
        </button>
      )}
    </>
  );
}

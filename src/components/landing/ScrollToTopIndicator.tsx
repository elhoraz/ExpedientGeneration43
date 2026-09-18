"use client";

import { useEffect, useState } from "react";

export default function ScrollToTopIndicator() {
  const [showBtn, setShowBtn] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const scrollTop = window.scrollY || el.scrollTop || document.body.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      const percent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

      setScrollPercent(Math.min(100, Math.max(0, Math.round(percent))));
      setShowBtn(scrollTop > 260);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      if (navigator.vibrate) navigator.vibrate(15);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!showBtn) return null;

  // Circular SVG params
  const size = 44;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (scrollPercent / 100) * circumference;

  return (
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
  );
}

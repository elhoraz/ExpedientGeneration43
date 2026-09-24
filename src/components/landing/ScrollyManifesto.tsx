"use client";

import { useEffect, useRef, useState } from "react";

interface ScrollyManifestoProps {
  text: string;
  sourceText?: string;
  isRTL?: boolean;
}

export default function ScrollyManifesto({
  text,
  sourceText,
  isRTL = false,
}: ScrollyManifestoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Start highlighting when top enters 85% of screen
      // Finish when bottom is at 30% of screen
      const startTrigger = windowHeight * 0.85;
      const endTrigger = windowHeight * 0.25;

      const current = startTrigger - rect.top;
      const totalDistance = startTrigger - endTrigger + rect.height;

      const rawProgress = current / totalDistance;
      const clamped = Math.max(0, Math.min(1, rawProgress));

      setScrollProgress(clamped);
    };

    const wrapper = document.querySelector(".landing-wrapper") as HTMLElement | null;
    if (wrapper) {
      wrapper.addEventListener("scroll", handleScroll, { passive: true });
    }
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    
    handleScroll();

    return () => {
      if (wrapper) wrapper.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, []);

  const words = text.split(" ");
  const totalWords = words.length;

  return (
    <div
      ref={containerRef}
      className={`scrolly-manifesto-container ${isRTL ? "dir-rtl" : ""}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="epigraph-quote-mark">&ldquo;</div>
      <blockquote className="scrolly-manifesto-text">
        {words.map((word, idx) => {
          // Word threshold from 0 to 1
          const wordThreshold = idx / totalWords;
          const isLit = scrollProgress >= wordThreshold;
          
          return (
            <span
              key={`${word}-${idx}`}
              className={`scrolly-word ${isLit ? "lit" : ""}`}
              style={{
                transitionDelay: `${(idx % 4) * 20}ms`,
              }}
            >
              {word}{" "}
            </span>
          );
        })}
      </blockquote>

      {sourceText && (
        <div className="scrolly-source-tag">
          <span className="source-emblem">⚜️</span>
          <span>{sourceText}</span>
        </div>
      )}
    </div>
  );
}

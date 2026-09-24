"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedStatsRibbonProps {
  totalAlumni: number;
  alumniLabel: string;
  gradYear: string;
  gradLabel: string;
  generationLabel: string;
  ukhuwahLabel: string;
}

export default function AnimatedStatsRibbon({
  totalAlumni,
  alumniLabel,
  gradYear,
  gradLabel,
  generationLabel,
  ukhuwahLabel,
}: AnimatedStatsRibbonProps) {
  const ribbonRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Targets
  const targetAlumni = totalAlumni || 240;
  const targetYear = parseInt(gradYear, 10) || 2025;
  const targetGen = 43;
  const targetUkhuwah = 100;

  // Display states
  const [dispAlumni, setDispAlumni] = useState(0);
  const [dispYear, setDispYear] = useState(2000);
  const [dispGen, setDispGen] = useState(0);
  const [dispUkhuwah, setDispUkhuwah] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const el = ribbonRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          const duration = 1800; // ms
          const startTime = performance.now();
          const startYear = 2000;

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Exponential ease-out curve for natural deceleration
            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            setDispAlumni(Math.round(targetAlumni * ease));
            setDispYear(Math.round(startYear + (targetYear - startYear) * ease));
            setDispGen(Math.round(targetGen * ease));
            setDispUkhuwah(Math.round(targetUkhuwah * ease));

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setDispAlumni(targetAlumni);
              setDispYear(targetYear);
              setDispGen(targetGen);
              setDispUkhuwah(targetUkhuwah);
              setIsFinished(true);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [hasAnimated, targetAlumni, targetYear]);

  return (
    <div
      ref={ribbonRef}
      className={`tuku-stats-ribbon ${isFinished ? "stats-glow-complete" : "stats-animating"}`}
    >
      <div className="tuku-stat-item">
        <span className="tuku-stat-num" id="counterAlumni">
          {dispAlumni}
        </span>
        <span className="tuku-stat-lbl">{alumniLabel}</span>
      </div>

      <div className="tuku-stat-divider">/</div>

      <div className="tuku-stat-item">
        <span className="tuku-stat-num">{dispYear}</span>
        <span className="tuku-stat-lbl">{gradLabel}</span>
      </div>

      <div className="tuku-stat-divider">/</div>

      <div className="tuku-stat-item">
        <span className="tuku-stat-num">{dispGen}</span>
        <span className="tuku-stat-lbl">{generationLabel}</span>
      </div>

      <div className="tuku-stat-divider">/</div>

      <div className="tuku-stat-item">
        <span className="tuku-stat-num">{dispUkhuwah}%</span>
        <span className="tuku-stat-lbl">{ukhuwahLabel}</span>
      </div>
    </div>
  );
}

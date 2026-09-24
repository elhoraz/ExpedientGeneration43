"use client";

import { useEffect, useRef } from "react";
import { usePerformanceTier } from "@/lib/performance";
import { triggerHaptic } from "@/lib/haptic";

interface LandingInteractivityProps {
  totalAlumni: number;
}

export default function LandingInteractivity({ totalAlumni }: LandingInteractivityProps) {
  const { isLowPerf } = usePerformanceTier();
  const spotlightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // =========================================================================
    // 1. STATS COUNT-UP ANIMATION (ON SCROLL INTO VIEW)
    // =========================================================================
    const animateValue = (el: HTMLElement, start: number, end: number, duration: number, suffix = "") => {
      let startTimestamp: number | null = null;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        // Easing: easeOutExpo
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = Math.floor(easeProgress * (end - start) + start);
        el.innerText = `${current}${suffix}`;
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          el.innerText = `${end}${suffix}`;
        }
      };
      window.requestAnimationFrame(step);
    };

    const ribbonEl = document.querySelector(".tuku-stats-ribbon");
    if (ribbonEl) {
      if (isLowPerf) {
        // Low-spec: Immediately set numbers without requestAnimationFrame churn
        const alumniEl = document.getElementById("counterAlumni");
        if (alumniEl) alumniEl.innerText = `${totalAlumni || 240}`;
      } else {
        const statsObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const alumniEl = document.getElementById("counterAlumni");
                if (alumniEl) {
                  animateValue(alumniEl, 0, totalAlumni || 240, 1600);
                }
                statsObserver.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.2 }
        );
        statsObserver.observe(ribbonEl);
      }
    }

    // =========================================================================
    // 2. SCROLL REVEAL (STAGGERED ENTRANCES)
    // =========================================================================
    const revealTargets = document.querySelectorAll(
      ".section-header, .history-spotlight-card, .wisdom-card, .mockup-showcase-wrap, .polaroid-tape-card, .tuku-wisdom-card, .heritage-video-container"
    );

    if (isLowPerf) {
      // Low-spec: Immediately reveal all elements without transition lag
      revealTargets.forEach((el) => {
        el.classList.add("landing-revealed-instant");
      });
    } else {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("landing-revealed");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
      );

      revealTargets.forEach((el) => {
        el.classList.add("landing-reveal-init");
        revealObserver.observe(el);
      });
    }

    // =========================================================================
    // 3. INTERACTIVE MOUSE SPOTLIGHT (DESKTOP HIGH-PERF ONLY)
    // =========================================================================
    const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    const spotlight = spotlightRef.current;

    let mouseX = -9999;
    let mouseY = -9999;
    let currentX = -9999;
    let currentY = -9999;
    let rafId: number | null = null;

    if (!isLowPerf && !isTouch && spotlight) {
      const onMouseMove = (e: MouseEvent) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      };

      const animateSpotlight = () => {
        if (mouseX > 0 && mouseY > 0) {
          currentX += (mouseX - currentX) * 0.12;
          currentY += (mouseY - currentY) * 0.12;
          if (spotlight) {
            spotlight.style.transform = `translate3d(${currentX - 250}px, ${currentY - 250}px, 0)`;
            spotlight.style.opacity = "1";
          }
        }
        rafId = requestAnimationFrame(animateSpotlight);
      };

      window.addEventListener("mousemove", onMouseMove, { passive: true });
      rafId = requestAnimationFrame(animateSpotlight);

      return () => {
        window.removeEventListener("mousemove", onMouseMove);
        if (rafId) cancelAnimationFrame(rafId);
      };
    }
  }, [isLowPerf, totalAlumni]);

  // ===========================================================================
  // 4. INTERACTIVE STAMP CLICK BURST & HAPTIC
  // ===========================================================================
  useEffect(() => {
    const stampEl = document.querySelector(".tuku-interactive-stamp") as HTMLElement | null;
    if (!stampEl) return;

    const handleStampClick = (e: MouseEvent) => {
      triggerHaptic([15, 40, 20]);
      stampEl.classList.remove("stamp-pulse-active");
      void stampEl.offsetWidth; // Trigger reflow
      stampEl.classList.add("stamp-pulse-active");

      // Spawn golden burst sparks if not low performance
      if (!isLowPerf) {
        const rect = stampEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 10; i++) {
          const spark = document.createElement("div");
          spark.className = "stamp-gold-spark";
          const angle = (i / 10) * Math.PI * 2;
          const dist = 30 + Math.random() * 40;
          const tx = Math.cos(angle) * dist;
          const ty = Math.sin(angle) * dist;

          spark.style.left = `${centerX}px`;
          spark.style.top = `${centerY}px`;
          spark.style.setProperty("--tx", `${tx}px`);
          spark.style.setProperty("--ty", `${ty}px`);
          document.body.appendChild(spark);

          setTimeout(() => spark.remove(), 700);
        }
      }
    };

    stampEl.addEventListener("click", handleStampClick);
    return () => stampEl.removeEventListener("click", handleStampClick);
  }, [isLowPerf]);

  // ===========================================================================
  // 5. MAGNETIC BUTTON EFFECT (DESKTOP HIGH-PERF ONLY)
  // ===========================================================================
  useEffect(() => {
    if (isLowPerf) return;
    const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    if (isTouch) return;

    const buttons = document.querySelectorAll(".btn-tuku-primary, .btn-tuku-secondary");

    buttons.forEach((btn) => {
      const el = btn as HTMLElement;
      let rect = el.getBoundingClientRect();

      const onEnter = () => {
        rect = el.getBoundingClientRect();
      };

      const onMove = (e: MouseEvent) => {
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        el.style.transform = `translate3d(${x * 0.18}px, ${y * 0.18}px, 0) scale(1.02)`;
      };

      const onLeave = () => {
        el.style.transform = `translate3d(0, 0, 0) scale(1)`;
      };

      el.addEventListener("mouseenter", onEnter, { passive: true });
      el.addEventListener("mousemove", onMove, { passive: true });
      el.addEventListener("mouseleave", onLeave, { passive: true });
    });
  }, [isLowPerf]);

  return (
    <>
      {/* Dynamic Cursor Ambient Spotlight (Hidden on low performance or touch devices) */}
      {!isLowPerf && (
        <div
          ref={spotlightRef}
          className="landing-ambient-spotlight"
          aria-hidden="true"
        />
      )}
    </>
  );
}

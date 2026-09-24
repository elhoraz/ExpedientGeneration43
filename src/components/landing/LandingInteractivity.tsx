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

  // 1. STATS COUNT-UP ANIMATION
  useEffect(() => {
    const ribbonEl = document.querySelector(".tuku-stats-ribbon");
    if (!ribbonEl) return;

    const alumniEl = document.getElementById("counterAlumni");
    if (!alumniEl) return;

    const targetVal = totalAlumni || 240;

    if (isLowPerf) {
      alumniEl.innerText = `${targetVal}`;
      return;
    }

    const animateValue = (el: HTMLElement, start: number, end: number, duration: number) => {
      let startTimestamp: number | null = null;
      let frameId: number;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = Math.floor(easeProgress * (end - start) + start);
        el.innerText = `${current}`;
        if (progress < 1) {
          frameId = window.requestAnimationFrame(step);
        } else {
          el.innerText = `${end}`;
        }
      };
      frameId = window.requestAnimationFrame(step);
      return () => window.cancelAnimationFrame(frameId);
    };

    let cancelAnim: (() => void) | undefined;
    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            cancelAnim = animateValue(alumniEl, 0, targetVal, 1600);
            statsObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    statsObserver.observe(ribbonEl);

    return () => {
      statsObserver.disconnect();
      if (cancelAnim) cancelAnim();
    };
  }, [isLowPerf, totalAlumni]);

  // 2. INTERACTIVE MOUSE SPOTLIGHT (DESKTOP HIGH-PERF ONLY)
  useEffect(() => {
    if (isLowPerf) return;
    const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    if (isTouch) return;

    const spotlight = spotlightRef.current;
    if (!spotlight) return;

    let mouseX = -9999;
    let mouseY = -9999;
    let currentX = -9999;
    let currentY = -9999;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const animateSpotlight = () => {
      if (mouseX > 0 && mouseY > 0) {
        currentX += (mouseX - currentX) * 0.12;
        currentY += (mouseY - currentY) * 0.12;
        spotlight.style.transform = `translate3d(${currentX - 250}px, ${currentY - 250}px, 0)`;
        spotlight.style.opacity = "1";
      }
      rafId = requestAnimationFrame(animateSpotlight);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    rafId = requestAnimationFrame(animateSpotlight);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [isLowPerf]);

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

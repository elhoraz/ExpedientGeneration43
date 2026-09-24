"use client";

import { useEffect, useRef } from "react";

export default function GlobalMouseSpotlight() {
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only enable on desktop with fine pointer (mouse/trackpad)
    if (typeof window === "undefined") return;
    const isTouch =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

    if (window.innerWidth <= 768 || isTouch) return;

    const el = spotlightRef.current;
    if (!el) return;

    let targetX = -1000;
    let targetY = -1000;
    let currentX = -1000;
    let currentY = -1000;
    let isRunning = true;
    let rafId: number;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const render = () => {
      if (!isRunning) return;

      // Smooth lerp (linear interpolation) for fluid light trailing
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;

      el.style.setProperty("--spot-x", `${currentX.toFixed(1)}px`);
      el.style.setProperty("--spot-y", `${currentY.toFixed(1)}px`);

      rafId = requestAnimationFrame(render);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    rafId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={spotlightRef}
      className="global-ambient-spotlight"
      aria-hidden="true"
    />
  );
}

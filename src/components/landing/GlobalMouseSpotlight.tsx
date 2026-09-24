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
    let isMoving = false;
    let rafId: number | null = null;

    const render = () => {
      const dx = targetX - currentX;
      const dy = targetY - currentY;

      // When settled, update one last time and sleep RAF loop to save GPU
      if (Math.abs(dx) < 0.25 && Math.abs(dy) < 0.25) {
        currentX = targetX;
        currentY = targetY;
        el.style.setProperty("--spot-x", `${currentX.toFixed(1)}px`);
        el.style.setProperty("--spot-y", `${currentY.toFixed(1)}px`);
        isMoving = false;
        rafId = null;
        return;
      }

      // Smooth lerp (linear interpolation)
      currentX += dx * 0.18;
      currentY += dy * 0.18;

      el.style.setProperty("--spot-x", `${currentX.toFixed(1)}px`);
      el.style.setProperty("--spot-y", `${currentY.toFixed(1)}px`);

      rafId = requestAnimationFrame(render);
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isMoving) {
        isMoving = true;
        rafId = requestAnimationFrame(render);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
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

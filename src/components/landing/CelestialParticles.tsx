"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  r: number;
  alpha: number;
  baseAlpha: number;
  vx: number;
  vy: number;
  pulseSpeed: number;
  pulseStep: number;
}

export default function CelestialParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId: number | null = null;
    let isVisible = true;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const count = isMobile ? 16 : 32;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const baseAlpha = 0.15 + Math.random() * 0.45;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.8 + Math.random() * (isMobile ? 1.4 : 2.0),
        alpha: baseAlpha,
        baseAlpha,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -0.1 - Math.random() * 0.3, // Soft upward drift
        pulseSpeed: 0.015 + Math.random() * 0.02,
        pulseStep: Math.random() * Math.PI * 2,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    window.addEventListener("resize", handleResize, { passive: true });

    // Pause rendering when scrolled out of view to save 100% CPU/GPU on mobile
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !animId && !prefersReducedMotion) {
          animId = requestAnimationFrame(render);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const render = () => {
      if (!isVisible) {
        animId = null;
        return;
      }

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          p.pulseStep += p.pulseSpeed;
          p.alpha = p.baseAlpha + Math.sin(p.pulseStep) * 0.15;

          // Wrap edges
          if (p.y < -10) p.y = height + 10;
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
        }

        // Draw soft golden celestial stardust
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${Math.max(0.05, p.alpha)})`;
        ctx.shadowBlur = p.r > 1.5 ? 8 : 4;
        ctx.shadowColor = "rgba(212, 175, 55, 0.6)";
        ctx.fill();
      }

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="celestial-canvas-wrap" aria-hidden="true">
      <canvas ref={canvasRef} className="celestial-canvas" />
    </div>
  );
}

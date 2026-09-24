"use client";

import { useEffect, useRef } from "react";
import { usePerformanceTier } from "@/lib/performance";

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
  const { isLowPerf } = usePerformanceTier();

  useEffect(() => {
    // If low performance device or reduced motion is detected, do not run canvas loop
    if (isLowPerf) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId: number | null = null;
    let isVisible = true;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const count = isMobile ? 18 : 36;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Mouse tracking for interactive cosmic repulsion
    let mouseX = -9999;
    let mouseY = -9999;
    let targetMouseX = -9999;
    let targetMouseY = -9999;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      targetMouseX = -9999;
      targetMouseY = -9999;
    };

    if (!isMobile) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      window.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    }

    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const baseAlpha = 0.2 + Math.random() * 0.45;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.8 + Math.random() * (isMobile ? 1.5 : 2.2),
        alpha: baseAlpha,
        baseAlpha,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -0.15 - Math.random() * 0.35, // Gentle upward cosmic drift
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

    // Pause rendering when scrolled out of view to preserve 100% CPU/GPU
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !animId) {
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

      // Smooth mouse interpolation
      mouseX += (targetMouseX - mouseX) * 0.1;
      mouseY += (targetMouseY - mouseY) * 0.1;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.pulseStep += p.pulseSpeed;
        p.alpha = p.baseAlpha + Math.sin(p.pulseStep) * 0.18;

        // Interactive Cosmic Mouse Repulsion
        if (mouseX > 0 && mouseY > 0) {
          const dx = p.x - mouseX;
          const dy = p.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 130;

          if (dist < maxDist && dist > 0) {
            const force = (1 - dist / maxDist) * 2.2;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
            p.alpha = Math.min(1, p.alpha + 0.3); // Brighten on proximity
          }
        }

        // Wrap edges smoothly
        if (p.y < -15) p.y = height + 15;
        if (p.x < -15) p.x = width + 15;
        if (p.x > width + 15) p.x = -15;

        // Draw soft glowing golden stardust
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${Math.max(0.08, p.alpha)})`;
        ctx.shadowBlur = p.r > 1.4 ? 10 : 5;
        ctx.shadowColor = "rgba(212, 175, 55, 0.75)";
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (!isMobile) {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseleave", handleMouseLeave);
      }
      observer.disconnect();
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isLowPerf]);

  if (isLowPerf) {
    return <div className="celestial-canvas-wrap low-spec-bg" aria-hidden="true" />;
  }

  return (
    <div className="celestial-canvas-wrap" aria-hidden="true">
      <canvas ref={canvasRef} className="celestial-canvas" />
    </div>
  );
}

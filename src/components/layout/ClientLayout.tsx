"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import LoadingScreen from "./LoadingScreen";
import { ToastProvider } from "./AegisToast";
import { ConfirmProvider } from "./AegisConfirm";
import gsap from "gsap";

if (typeof window !== "undefined") {
  (window as any).gsap = gsap;
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();



  // Handle global visual effects
  useEffect(() => {
    const savedTheme = localStorage.getItem("expedient_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);

    // Update meta theme-color based on theme
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", savedTheme === "light" ? "#fcfbf8" : "#030504");
    }

    // ===== CUSTOM CURSOR =====
    const cursorDot = document.getElementById("cursorDot");
    const cursorRing = document.getElementById("cursorRing");

    if (cursorDot && cursorRing && window.innerWidth > 768) {
      const moveCursor = (e: MouseEvent) => {
        cursorDot.style.left = e.clientX + "px";
        cursorDot.style.top = e.clientY + "px";
        cursorRing.style.left = e.clientX + "px";
        cursorRing.style.top = e.clientY + "px";
      };
      document.addEventListener("mousemove", moveCursor);

      // Hover effect on interactive elements
      const interactiveEls = document.querySelectorAll("a, button, .hover-trigger, .cursor-bind, input, textarea, select");
      interactiveEls.forEach((el) => {
        el.addEventListener("mouseenter", () => {
          cursorRing.style.transform = "translate(-50%, -50%) scale(1.5)";
          cursorRing.style.borderColor = "#d4af37";
        });
        el.addEventListener("mouseleave", () => {
          cursorRing.style.transform = "translate(-50%, -50%) scale(1)";
          cursorRing.style.borderColor = "rgba(212,175,55,0.5)";
        });
      });

      return () => {
        document.removeEventListener("mousemove", moveCursor);
      };
    }

    // ===== PARTICLES =====
    const canvas = document.getElementById("particles-js") as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: Array<{
          x: number; y: number; size: number; speedY: number; speedX: number;
          opacity: number; life: number; maxLife: number;
        }> = [];

        for (let i = 0; i < 40; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speedY: -(Math.random() * 0.3 + 0.1),
            speedX: (Math.random() - 0.5) * 0.2,
            opacity: Math.random() * 0.4 + 0.1,
            life: Math.random() * 200 + 100,
            maxLife: 300,
          });
        }

        let animId: number;
        const animate = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          particles.forEach((p) => {
            p.y += p.speedY;
            p.x += p.speedX;
            p.life--;
            if (p.life <= 0 || p.y < -10) {
              p.x = Math.random() * canvas.width;
              p.y = canvas.height + 10;
              p.life = p.maxLife;
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(212, 175, 55, ${p.opacity})`;
            ctx.fill();
          });
          animId = requestAnimationFrame(animate);
        };
        animate();

        const handleResize = () => {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", handleResize);

        return () => {
          cancelAnimationFrame(animId);
          window.removeEventListener("resize", handleResize);
        };
      }
    }
  }, []);

  return (
    <ConfirmProvider>
      <ToastProvider>
        <LoadingScreen />
        {children}
      </ToastProvider>
    </ConfirmProvider>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function LoadingScreen() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      if (typeof window !== "undefined" && sessionStorage.getItem("aegis_transit")) {
        return;
      }

      setVisible(true);

      const timer = setTimeout(() => {
        setIsFading(true);
        setTimeout(() => {
          setVisible(false);
          try {
            sessionStorage.setItem("aegis_transit", "1");
          } catch {}
        }, 180);
      }, 240);

      return () => clearTimeout(timer);
    } catch {
      setVisible(false);
    }
  }, []);

  if (!mounted || !visible) return null;

  return (
    <div
      id="loadingScreen"
      onClick={() => setVisible(false)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999990,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-main, #070d0d)",
        transition: "opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.2s",
        opacity: isFading ? 0 : 1,
        pointerEvents: isFading ? "none" : "auto",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
        <Image
          src="/images/logo-utuh.webp"
          alt="Expedient Generation 43"
          width={72}
          height={72}
          priority
          style={{ width: "auto", height: "72px", objectFit: "contain", filter: "drop-shadow(0 4px 16px rgba(212, 175, 55, 0.3))" }}
        />
        <div style={{
          fontFamily: "var(--font-playfair), Georgia, serif",
          fontSize: "0.95rem",
          letterSpacing: "3px",
          color: "var(--gold-main, #d4af37)",
          fontWeight: 700,
          textTransform: "uppercase"
        }}>
          Expedient Generation
        </div>
        <div style={{
          width: "140px",
          height: "2px",
          background: "rgba(212, 175, 55, 0.15)",
          borderRadius: "2px",
          overflow: "hidden",
          position: "relative"
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: "50%",
            background: "#d4af37",
            borderRadius: "2px",
            animation: "subtleLoadBar 0.8s ease-in-out infinite alternate"
          }} />
        </div>
      </div>
      <style jsx>{`
        @keyframes subtleLoadBar {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

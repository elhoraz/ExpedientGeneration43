"use client";

import { useState, useEffect } from "react";

const loaderVariants = ["v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8", "v9", "v10"];

export default function LoadingScreen() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [variant, setVariant] = useState("v1");

  useEffect(() => {
    setMounted(true);

    try {
      // Skip loader if user is navigating between pages (Aegis Transit)
      if (typeof window !== "undefined" && sessionStorage.getItem("aegis_transit")) {
        return;
      }

      setVariant(loaderVariants[Math.floor(Math.random() * loaderVariants.length)]);
      setVisible(true);

      // Quick smooth dismiss
      const timer = setTimeout(() => {
        setIsFading(true);
        setTimeout(() => {
          setVisible(false);
          try {
            sessionStorage.setItem("aegis_transit", "1");
          } catch {}
        }, 300);
      }, 500);

      return () => clearTimeout(timer);
    } catch {
      setVisible(false);
    }
  }, []);

  if (!mounted || !visible) return null;

  return (
    <div
      id="loadingScreen"
      className={`load-${variant}`}
      onClick={() => setVisible(false)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-main, #030504)",
        transition: "opacity 0.3s ease-out",
        opacity: isFading ? 0 : 1,
        pointerEvents: isFading ? "none" : "auto",
        cursor: "pointer",
      }}
    >
      <div className="loader-logo-wrap">
        {variant === "v1" && (
          <>
            <div className="pure-ripple"></div>
            <div className="pure-ripple"></div>
          </>
        )}
        {variant === "v2" && (
          <>
            <div className="cosmos-orbit orbit-1"></div>
            <div className="cosmos-orbit orbit-2"></div>
          </>
        )}
        {variant === "v5" && <div className="lunar-eclipse"></div>}
        {variant === "v6" && <div className="solar-crown"></div>}
        {variant === "v7" && <div className="sacred-lattice"></div>}
        {variant === "v8" && <div className="prismatic-pulse"></div>}
        {variant === "v9" && (
          <div className="flowing-veils">
            <div className="veil"></div>
            <div className="veil"></div>
            <div className="veil"></div>
            <div className="veil"></div>
            <div className="veil"></div>
          </div>
        )}
        {variant === "v10" && (
          <>
            <div className="stellar-orbit">
              <div className="stellar-dot"></div>
            </div>
            <div className="stellar-orbit reverse">
              <div className="stellar-dot"></div>
            </div>
          </>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo-utuh.webp"
          className="loader-logo"
          alt="Loading Expedient"
          width={80}
          height={80}
          style={{ width: "auto", height: "80px", objectFit: "contain" }}
        />
      </div>
      {variant === "v3" && (
        <div className="gilded-reveal">EXPEDIENT GENERATION</div>
      )}
    </div>
  );
}

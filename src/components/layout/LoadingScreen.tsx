"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

/**
 * Renders an optional lightweight transition overlay only when explicitly triggered
 * via the `expedient-loading` event, rather than blocking first SSR page load.
 */
export default function LoadingScreen() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleTrigger = (event: Event) => {
      const detail = (event as CustomEvent<{ active?: boolean }>).detail;
      setVisible(Boolean(detail?.active));
    };

    window.addEventListener("expedient-loading", handleTrigger);
    return () => window.removeEventListener("expedient-loading", handleTrigger);
  }, []);

  if (!visible) return null;

  return (
    <div
      id="loadingScreen"
      role="status"
      aria-live="polite"
      onClick={() => setVisible(false)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-main, #060b14)",
        cursor: "pointer",
      }}
    >
      <div className="loader-logo-wrap">
        <Image
          src="/images/logo-utuh.webp"
          className="loader-logo"
          alt="Expedient 43"
          width={80}
          height={80}
          priority
          style={{ width: "auto", height: "80px", objectFit: "contain" }}
        />
      </div>
    </div>
  );
}

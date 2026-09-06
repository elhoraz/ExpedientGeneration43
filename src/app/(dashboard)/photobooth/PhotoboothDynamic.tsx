"use client";

import dynamic from "next/dynamic";

const PhotoboothClient = dynamic(() => import("./PhotoboothClient"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "75vh",
        color: "var(--gold-main, #d4af37)",
        gap: "16px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          border: "3px solid rgba(212, 175, 55, 0.2)",
          borderTopColor: "var(--gold-main, #d4af37)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <div
        style={{
          fontFamily: "'Cinzel', serif",
          letterSpacing: "2px",
          fontSize: "0.9rem",
          fontWeight: 600,
          textTransform: "uppercase",
        }}
      >
        Menyiapkan Studio Photobooth & Canvas...
      </div>
    </div>
  ),
});

export default function PhotoboothDynamic() {
  return <PhotoboothClient />;
}

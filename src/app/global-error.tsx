"use client";
import { useEffect } from "react";
import { sendTelemetryAlert } from "@/lib/sentinel/clientWatcher";

export default function GlobalRootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root Crash Error:", error);
    sendTelemetryAlert({
      category: "react_error_boundary",
      message: `Root HTML Crash: ${error?.message || "Critical layout rendering failure"}`,
      detail: error?.digest ? `Digest ID: ${error.digest}` : undefined,
      stack: error?.stack,
    });
  }, [error]);
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          background: "#060b14",
          color: "#e6edf3",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          display: "flex",
          minHeight: "100dvh",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            background: "rgba(18, 10, 12, 0.94)",
            border: "1px solid rgba(225, 29, 72, 0.45)",
            borderRadius: "16px",
            padding: "40px 30px",
            maxWidth: "480px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.75)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: "#fb7185" }} aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h1 style={{ fontSize: "1.3rem", color: "#ffffff", margin: "0 0 10px 0" }}>Terjadi Kesalahan Sistem</h1>
          <p style={{ color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.6, margin: "0 0 24px 0" }}>
            Sistem mendeteksi kendala pada tata letak utama. Silakan muat ulang halaman.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              minHeight: "44px",
              padding: "10px 24px",
              borderRadius: "12px",
              border: "1px solid #d4af37",
              background: "#d4af37",
              color: "#060b14",
              fontSize: "0.88rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Muat Ulang
          </button>
        </div>
      </body>
    </html>
  );
}

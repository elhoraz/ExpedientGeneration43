"use client";

export default function GlobalRootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          background: "#030504",
          color: "#e6edf3",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            background: "rgba(18, 10, 12, 0.9)",
            border: "1px solid rgba(255, 51, 102, 0.4)",
            borderRadius: "20px",
            padding: "40px 30px",
            maxWidth: "480px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)",
          }}
        >
          <div style={{ fontSize: "2.5rem", color: "#ff3366", marginBottom: "16px" }}>⚠️</div>
          <h2 style={{ fontSize: "1.3rem", color: "#ffffff", margin: "0 0 10px 0" }}>Terjadi Kesalahan Sistem</h2>
          <p style={{ color: "#8b9ba8", fontSize: "0.85rem", lineHeight: 1.6, margin: "0 0 24px 0" }}>
            Sistem mendeteksi kendala pada root layout. Silakan muat ulang halaman.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "10px 24px",
              borderRadius: "24px",
              border: "1px solid #d4af37",
              background: "#d4af37",
              color: "#030504",
              fontSize: "0.85rem",
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

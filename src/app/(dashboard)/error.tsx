"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard Boundary Error:", error);
  }, [error]);

  return (
    <div style={{
      width: "100%",
      minHeight: "calc(100vh - 80px)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      background: "var(--bg-main)",
      color: "var(--text-primary)",
      padding: "20px",
      textAlign: "center"
    }}>
      <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: "3rem", color: "#ff3366", marginBottom: "20px" }}></i>
      <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#ff3366", marginBottom: "10px" }}>Terjadi Kesalahan Sistem</h2>
      <p style={{ color: "var(--text-secondary)", maxWidth: "500px", marginBottom: "30px", fontSize: "0.9rem" }}>
        {error.message || "Komponen tidak dapat dirender atau koneksi database terputus. Silakan coba muat ulang halaman."}
      </p>
      <div style={{ display: "flex", gap: "15px" }}>
        <button 
          onClick={() => reset()}
          style={{
            background: "rgba(255, 51, 102, 0.1)",
            border: "1px solid rgba(255, 51, 102, 0.3)",
            color: "#ff3366",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          <i className="fa-solid fa-rotate-right" style={{ marginRight: "8px" }}></i> Coba Lagi
        </button>
        <Link href="/beranda" style={{
            background: "rgba(212, 175, 55, 0.1)",
            border: "1px solid rgba(212, 175, 55, 0.3)",
            color: "#d4af37",
            padding: "10px 20px",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600
          }}>
          <i className="fa-solid fa-house" style={{ marginRight: "8px" }}></i> Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}

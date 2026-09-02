"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px 20px",
        textAlign: "center",
        position: "relative",
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: "rgba(10, 16, 13, 0.75)",
          border: "1px solid rgba(212, 175, 55, 0.25)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "48px 36px",
          maxWidth: "540px",
          width: "100%",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "18px",
        }}
      >
        <Image
          src="/images/logo-utuh.webp"
          width={80}
          height={80}
          alt="Expedient Generation"
          style={{ opacity: 0.9, filter: "drop-shadow(0 0 15px rgba(212,175,55,0.4))" }}
        />

        <div
          style={{
            display: "inline-block",
            fontSize: "4rem",
            fontWeight: 900,
            letterSpacing: "4px",
            lineHeight: 1,
            background: "linear-gradient(135deg, #d4af37 0%, #f3e5ab 50%, #997a15 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: "'Playfair Display', serif",
            marginTop: "8px",
          }}
        >
          404
        </div>

        <h2
          style={{
            fontSize: "1.35rem",
            color: "#ffffff",
            fontWeight: 600,
            margin: 0,
            fontFamily: "'Playfair Display', serif",
          }}
        >
          Arsip Tidak Ditemukan
        </h2>

        <p
          style={{
            color: "#8b9ba8",
            fontSize: "0.9rem",
            lineHeight: 1.6,
            margin: 0,
            maxWidth: "420px",
          }}
        >
          Koordinat atau halaman yang Anda tuju berada di luar jangkauan radar galeri digital Expedient Generation.
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: "12px",
            width: "100%",
          }}
        >
          <button
            onClick={() => router.back()}
            style={{
              padding: "12px 24px",
              borderRadius: "30px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              background: "rgba(255, 255, 255, 0.05)",
              color: "#e6edf3",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            <i className="fa-solid fa-arrow-left" style={{ marginRight: "8px" }}></i>
            Kembali
          </button>

          <Link
            href="/beranda"
            style={{
              padding: "12px 28px",
              borderRadius: "30px",
              border: "1px solid #d4af37",
              background: "linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%)",
              color: "#d4af37",
              fontSize: "0.85rem",
              fontWeight: 700,
              textDecoration: "none",
              letterSpacing: "1px",
              transition: "all 0.3s ease",
            }}
          >
            <i className="fa-solid fa-landmark" style={{ marginRight: "8px" }}></i>
            Beranda Utama
          </Link>
        </div>
      </div>
    </div>
  );
}

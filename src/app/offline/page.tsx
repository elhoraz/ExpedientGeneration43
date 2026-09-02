import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline | Expedient Generation",
  description: "Anda sedang tidak terhubung ke jaringan internet.",
};

export default function OfflinePage() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", 
      justifyContent: "center", minHeight: "100vh", padding: "40px 20px", 
      textAlign: "center", background: "#050505", color: "#fff"
    }}>
      <i className="fa-solid fa-wifi" style={{ fontSize: "4rem", color: "#888", marginBottom: "20px", opacity: 0.5 }}></i>
      <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#d4af37", marginBottom: "15px", fontSize: "2.5rem" }}>Koneksi Terputus</h1>
      <p style={{ color: "#aaa", maxWidth: "500px", lineHeight: 1.6, marginBottom: "30px" }}>
        Anda sedang tidak terhubung ke jaringan internet. Aplikasi ini dapat terus berjalan secara luring (offline) namun beberapa fitur mungkin terbatas.
      </p>
      
      <div style={{ display: "flex", gap: "15px" }}>
        <a href="/" style={{
          background: "linear-gradient(135deg, #d4af37, #aa8529)", border: "none", color: "#000",
          padding: "12px 30px", borderRadius: "30px", fontSize: "0.9rem", fontWeight: 600,
          letterSpacing: "1px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", textDecoration: "none"
        }}>
          <i className="fa-solid fa-rotate-right"></i> Coba Lagi
        </a>
        <Link href="/beranda" style={{
          background: "transparent", border: "1px solid #d4af37", color: "#d4af37", textDecoration: "none",
          padding: "12px 30px", borderRadius: "30px", fontSize: "0.9rem", fontWeight: 600,
          letterSpacing: "1px", display: "flex", alignItems: "center", gap: "10px"
        }}>
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Penghapusan Akun & Data Pribadi - Expedient 43",
  description: "Kebijakan dan formulir permintaan penghapusan akun serta data pribadi pengguna platform Expedient Generation 43 sesuai regulasi Google Play Store.",
};

export default function DeleteAccountPage() {
  return (
    <div style={{
      minHeight: "100dvh",
      backgroundColor: "#030504",
      color: "#e6edf3",
      padding: "2rem 1rem",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "var(--font-inter, sans-serif)",
    }}>
      <div style={{
        maxWidth: "680px",
        width: "100%",
        background: "rgba(18, 24, 20, 0.8)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(212, 175, 55, 0.25)",
        borderRadius: "16px",
        padding: "2.5rem 2rem",
        boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
            fontSize: "24px",
            marginBottom: "1rem"
          }}>
            <i className="fa-solid fa-user-xmark" />
          </div>
          <h1 style={{
            fontFamily: "var(--font-playfair, serif)",
            fontSize: "1.85rem",
            color: "#f3ba2f",
            margin: "0 0 0.5rem 0"
          }}>
            Penghapusan Akun & Data Pribadi
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "0.95rem", margin: 0 }}>
            Panduan & Prosedur Hak Penghapusan Data (Google Play Data Safety Compliance)
          </p>
        </div>

        {/* Section 1: Cara Menghapus Akun */}
        <div style={{ marginBottom: "1.75rem" }}>
          <h2 style={{ fontSize: "1.1rem", color: "#f3ba2f", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="fa-solid fa-mobile-screen-button" /> 1. Penghapusan Langsung dari Aplikasi
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>
            Jika Anda telah menginstal aplikasi atau mengakses platform di web, Anda dapat menghapus akun Anda secara instan:
          </p>
          <ol style={{ fontSize: "0.9rem", color: "#cbd5e1", lineHeight: 1.6, marginTop: "0.5rem", paddingLeft: "1.25rem" }}>
            <li>Buka menu <strong>Profil</strong> di navigasi utama.</li>
            <li>Gulir ke bawah menuju bagian <strong>Zona Bahaya</strong>.</li>
            <li>Klik tombol <strong>Hapus Akun & Data Pribadi</strong>.</li>
            <li>Ketik kata <code>HAPUS</code> pada kotak konfirmasi untuk memverifikasi permintaan Anda.</li>
          </ol>
        </div>

        {/* Section 2: Data yang Dihapus */}
        <div style={{ marginBottom: "1.75rem" }}>
          <h2 style={{ fontSize: "1.1rem", color: "#f3ba2f", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="fa-solid fa-trash-can" /> 2. Data Apa Saja yang Dihapus?
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>
            Saat akun dihapus, sistem kami akan segera memusnahkan data berikut secara permanen:
          </p>
          <ul style={{ fontSize: "0.9rem", color: "#cbd5e1", lineHeight: 1.6, marginTop: "0.5rem", paddingLeft: "1.25rem" }}>
            <li>Kredensial login, email, nomor WhatsApp, dan data biometrik/face recognition.</li>
            <li>Profil alumni, foto profil, dan titik koordinat domisili pada Radar Alumni.</li>
            <li>Listing usaha Anda pada Direktori Bisnis (Syndicate).</li>
            <li>Pesan wasiat digital dan seluruh log aktivitas pribadi.</li>
          </ul>
        </div>

        {/* Section 3: Data yang Ditahan */}
        <div style={{ marginBottom: "2rem", padding: "1rem", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "8px" }}>
          <h3 style={{ fontSize: "0.95rem", color: "#fbbf24", margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="fa-solid fa-shield-halved" /> Kebijakan Retensi Finansial (Baitul Maal)
          </h3>
          <p style={{ fontSize: "0.85rem", color: "#e2e8f0", lineHeight: 1.5, margin: 0 }}>
            Catatan transaksi keuangan (Baitul Maal) yang sah secara hukum akuntansi akan dianonimkan menjadi <em>&quot;Hamba Allah&quot;</em> untuk menjaga transparansi dan integritas buku kas angkatan, namun seluruh identitas dan tautan profil Anda akan dihapus sepenuhnya.
          </p>
        </div>

        {/* CTA & Support Contact */}
        <div style={{ textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1.5rem" }}>
          <p style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "1rem" }}>
            Perlu bantuan manual atau sudah tidak bisa login ke akun Anda?
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/profil"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #d4af37, #aa820a)",
                color: "#030504",
                fontWeight: 600,
                fontSize: "0.9rem",
                textDecoration: "none"
              }}
            >
              <i className="fa-solid fa-arrow-right-to-bracket" /> Masuk ke Profil untuk Hapus Akun
            </Link>
            <a
              href="mailto:admin@expedientgeneration.com?subject=Permintaan%20Penghapusan%20Akun%20Expedient%2043"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "0.75rem 1.25rem",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.08)",
                color: "#e2e8f0",
                fontSize: "0.9rem",
                border: "1px solid rgba(255,255,255,0.15)",
                textDecoration: "none"
              }}
            >
              <i className="fa-solid fa-envelope" /> Hubungi Admin via Email
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}

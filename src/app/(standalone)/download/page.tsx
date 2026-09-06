import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Download Aplikasi Resmi Expedient 43 (Android APK & PWA)",
  description: "Unduh dan pasang aplikasi mobile resmi komunitas alumni Expedient Generation 43 (Pondok Modern Arrisalah) untuk perangkat Android dan iOS.",
};

export default function DownloadPage() {
  const apkDownloadUrl = process.env.NEXT_PUBLIC_APK_DOWNLOAD_URL || "/Expedient43-v1.0.apk";

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
        maxWidth: "760px",
        width: "100%",
        background: "rgba(18, 24, 20, 0.85)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(212, 175, 55, 0.3)",
        borderRadius: "20px",
        padding: "2.5rem 2rem",
        boxShadow: "0 25px 60px rgba(0,0,0,0.7)",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.25rem" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212, 175, 55, 0.25) 0%, rgba(3, 5, 4, 0.6) 80%)",
            border: "1px solid rgba(212, 175, 55, 0.4)",
            color: "#f3ba2f",
            fontSize: "32px",
            marginBottom: "1rem",
            boxShadow: "0 0 25px rgba(212, 175, 55, 0.25)",
          }}>
            <i className="fa-brands fa-android" />
          </div>
          <h1 style={{
            fontFamily: "var(--font-playfair, serif)",
            fontSize: "2rem",
            color: "#f3ba2f",
            margin: "0 0 0.5rem 0",
            letterSpacing: "0.5px",
          }}>
            Download Aplikasi Expedient 43
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "0.95rem", margin: "0 auto", maxWidth: "520px" }}>
            Aplikasi mobile resmi jejaring dan direktori alumni ke-43 Pondok Modern Arrisalah.
          </p>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "12px",
            padding: "4px 14px",
            borderRadius: "999px",
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#10b981",
            fontSize: "0.8rem",
            fontWeight: 500,
          }}>
            <i className="fa-solid fa-shield-check" /> Versi 1.0.0 Produksi &bull; Aman & Bebas Iklan
          </div>
        </div>

        {/* Download Options Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2.5rem",
        }}>
          {/* Card 1: Android APK */}
          <div style={{
            background: "linear-gradient(145deg, rgba(26, 36, 30, 0.8), rgba(12, 18, 14, 0.9))",
            border: "1px solid rgba(212, 175, 55, 0.35)",
            borderRadius: "14px",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              background: "rgba(212, 175, 55, 0.2)",
              color: "#f3ba2f",
              padding: "2px 8px",
              borderRadius: "6px",
              fontSize: "0.72rem",
              fontWeight: 600,
            }}>
              Rekomendasi
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem" }}>
                <i className="fa-brands fa-android" style={{ fontSize: "1.5rem", color: "#10b981" }} />
                <h2 style={{ fontSize: "1.15rem", margin: 0, color: "#f8fafc" }}>File APK Android</h2>
              </div>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
                Paket instalasi mandiri untuk smartphone Android (Samsung, Xiaomi, Oppo, Vivo, dll).
              </p>
              <ul style={{ fontSize: "0.8rem", color: "#cbd5e1", paddingLeft: "1.2rem", margin: "0 0 1.25rem 0", lineHeight: 1.6 }}>
                <li>Nama File: <code>Expedient43-v1.0.apk</code></li>
                <li>Ukuran: <strong>~98.7 MB</strong></li>
                <li>Mendukung: Android 7.0 hingga Android 15 (SDK 35)</li>
              </ul>
            </div>
            <a
              href={apkDownloadUrl}
              download="Expedient43-v1.0.apk"
              id="btnDownloadApk"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "0.85rem 1rem",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #d4af37, #aa820a)",
                color: "#030504",
                fontWeight: 700,
                fontSize: "0.95rem",
                textDecoration: "none",
                boxShadow: "0 8px 20px rgba(212, 175, 55, 0.3)",
                transition: "all 0.2s ease",
              }}
            >
              <i className="fa-solid fa-download" /> Unduh Expedient43-v1.0.apk
            </a>
          </div>

          {/* Card 2: PWA Web App */}
          <div style={{
            background: "linear-gradient(145deg, rgba(20, 26, 23, 0.7), rgba(10, 15, 12, 0.8))",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "14px",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem" }}>
                <i className="fa-brands fa-apple" style={{ fontSize: "1.5rem", color: "#cbd5e1" }} />
                <h2 style={{ fontSize: "1.15rem", margin: 0, color: "#f8fafc" }}>iPhone (iOS) & PWA</h2>
              </div>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
                Instalasi instan langsung dari browser tanpa perlu mengunduh file besar (0 MB).
              </p>
              <ul style={{ fontSize: "0.8rem", color: "#cbd5e1", paddingLeft: "1.2rem", margin: "0 0 1.25rem 0", lineHeight: 1.6 }}>
                <li>Kompatibel dengan iOS (iPhone) & Android</li>
                <li>Langsung muncul ikon aplikasi di layar HP</li>
                <li>Tampilan full-screen tanpa address bar</li>
              </ul>
            </div>
            <Link
              href="/login"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "0.85rem 1rem",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#e2e8f0",
                fontWeight: 600,
                fontSize: "0.95rem",
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
            >
              <i className="fa-solid fa-mobile-screen" /> Buka & Pasang di Layar
            </Link>
          </div>
        </div>

        {/* Installation Steps Guide */}
        <div style={{
          background: "rgba(0, 0, 0, 0.35)",
          border: "1px solid rgba(212, 175, 55, 0.2)",
          borderRadius: "16px",
          padding: "1.75rem 1.5rem",
          marginBottom: "2rem",
        }}>
          <h2 style={{
            fontSize: "1.2rem",
            color: "#f3ba2f",
            margin: "0 0 1.25rem 0",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}>
            <i className="fa-solid fa-list-check" /> Panduan Cara Memasang APK di HP Android
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Step 1 */}
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "#d4af37",
                color: "#030504",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.95rem",
                flexShrink: 0,
              }}>
                1
              </div>
              <div>
                <h3 style={{ fontSize: "0.95rem", color: "#f8fafc", margin: "0 0 4px 0" }}>
                  Unduh File APK
                </h3>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                  Klik tombol emas <strong>&quot;Unduh Expedient43-v1.0.apk&quot;</strong> di atas. Tunggu hingga proses unduhan di browser selesai.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "#d4af37",
                color: "#030504",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.95rem",
                flexShrink: 0,
              }}>
                2
              </div>
              <div>
                <h3 style={{ fontSize: "0.95rem", color: "#f8fafc", margin: "0 0 4px 0" }}>
                  Buka File Hasil Unduhan
                </h3>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                  Tarik bar notifikasi di bagian atas layar HP Anda, lalu ketuk notifikasi unduhan selesai, atau buka aplikasi <em>Pengelola File / File Manager</em> &gt; folder <em>Download</em>.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "#d4af37",
                color: "#030504",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.95rem",
                flexShrink: 0,
              }}>
                3
              </div>
              <div>
                <h3 style={{ fontSize: "0.95rem", color: "#f8fafc", margin: "0 0 4px 0" }}>
                  Izinkan Penginstalan dari Sumber Ini
                </h3>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                  Jika muncul pop-up peringatan: <em>&quot;Demi keamanan, ponsel Anda tidak diizinkan memasang aplikasi yang tidak dikenal dari sumber ini&quot;</em>, ketuk <strong>Setelan (Settings)</strong> lalu aktifkan tombol <strong>Izinkan dari sumber ini (Allow from this source)</strong>.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "#d4af37",
                color: "#030504",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.95rem",
                flexShrink: 0,
              }}>
                4
              </div>
              <div>
                <h3 style={{ fontSize: "0.95rem", color: "#f8fafc", margin: "0 0 4px 0" }}>
                  Ketuk Instal &amp; Selesai
                </h3>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                  Kembali ke layar pemasangan dan klik <strong>Instal</strong>. Begitu selesai, ikon <strong>Expedient 43</strong> akan langsung muncul di menu smartphone Anda!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div style={{
          background: "rgba(245, 158, 11, 0.08)",
          border: "1px solid rgba(245, 158, 11, 0.25)",
          borderRadius: "12px",
          padding: "1.25rem",
          marginBottom: "2rem",
        }}>
          <h3 style={{ fontSize: "0.95rem", color: "#fbbf24", margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="fa-solid fa-circle-question" /> Pertanyaan yang Sering Diajukan (FAQ)
          </h3>
          <p style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.5, margin: "0 0 0.5rem 0" }}>
            <strong>Q: Mengapa Android menampilkan peringatan keamanan saat menginstal?</strong><br />
            A: Peringatan tersebut adalah mekanisme perlindungan standar sistem Android untuk aplikasi apa pun yang diunduh langsung di luar Google Play Store. File APK ini 100% aman, bersih dari kode pihak ketiga, dan ditandatangani dengan kunci resmi angkatan.
          </p>
          <p style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.5, margin: 0 }}>
            <strong>Q: Bagaimana cara pengguna iPhone (iOS) menggunakan aplikasi?</strong><br />
            A: Cukup buka tautan web di browser Safari, ketuk tombol <strong>Bagikan (Share)</strong> di bagian bawah layar, lalu pilih <strong>&quot;Tambah ke Layar Utama (Add to Home Screen)&quot;</strong>.
          </p>
        </div>

        {/* Footer Navigation */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          paddingTop: "1.5rem",
        }}>
          <Link
            href="/"
            style={{
              color: "#94a3b8",
              textDecoration: "none",
              fontSize: "0.85rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <i className="fa-solid fa-arrow-left" /> Beranda Utama
          </Link>
          <div style={{ display: "flex", gap: "1rem" }}>
            <Link
              href="/login"
              style={{
                color: "#f3ba2f",
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              Masuk ke Akun <i className="fa-solid fa-arrow-right" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

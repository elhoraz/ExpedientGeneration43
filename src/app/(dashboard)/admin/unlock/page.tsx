"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "../../../login/login.css";

export default function AdminUnlockPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Berhasil, redirect ke admin dashboard
        router.push("/admin");
        router.refresh(); // Untuk memastikan middleware membaca cookie baru
      } else {
        setError(data.message || "Sandi Akses tidak valid.");
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric = () => {
    // Fitur Biometric Unlock Placeholder
    setError("Fitur FaceID / Sidik Jari untuk Admin sedang dalam pengembangan.");
  };

  return (
    <div className="login-page">
      <div className="ambient-field">
        <div className="core-orb orb-1"></div>
        <div className="core-orb orb-2"></div>
        <div className="core-orb orb-3"></div>
      </div>

      <div className="scene-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="auth-prism" style={{ maxWidth: "400px", width: "90%" }}>
          <div className="prism-header">
            <i className="fa-solid fa-user-shield" style={{ fontSize: "3rem", color: "#d4af37", marginBottom: "20px", textShadow: "0 0 20px rgba(212,175,55,0.5)" }}></i>
            <h1 className="title-holo" style={{ fontSize: "1.8rem" }}>Akses Terbatas</h1>
            <div className="subtitle-spec">Otorisasi Administrator Diperlukan</div>
          </div>

          {error && (
            <div style={{ background: "rgba(255, 51, 102, 0.1)", border: "1px solid rgba(255, 51, 102, 0.3)", color: "#ff3366", padding: "10px", borderRadius: "8px", marginBottom: "20px", fontSize: "0.85rem", textAlign: "left" }}>
              <i className="fa-solid fa-triangle-exclamation"></i> {error}
            </div>
          )}

          <form onSubmit={handleUnlock}>
            <div className="input-group">
              <input
                type="password"
                className="input-control"
                placeholder="Kata Sandi Master"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="input-neon-line"></div>
            </div>

            <div className="btn-rack" style={{ marginBottom: "20px" }}>
              <div className="magnetic-wrap" style={{ width: "100%" }}>
                <button type="submit" className="btn-prime magnetic-btn" disabled={loading} style={{ width: "100%" }}>
                  {loading ? (
                    <><i className="fa-solid fa-circle-notch fa-spin"></i> Memproses...</>
                  ) : (
                    <><i className="fa-solid fa-unlock-keyhole"></i> Verifikasi</>
                  )}
                </button>
              </div>
            </div>
          </form>

          <div style={{ margin: "20px 0", display: "flex", alignItems: "center", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600 }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }}></div>
            <span style={{ padding: "0 15px", letterSpacing: "2px" }}>ATAU</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }}></div>
          </div>

          <div className="btn-rack">
            <div className="magnetic-wrap" style={{ width: "100%" }}>
              <button type="button" className="btn-prime magnetic-btn" onClick={handleBiometric} style={{ width: "100%", background: "linear-gradient(135deg, #00ff88, #008844)", color: "#fff" }}>
                <i className="fa-solid fa-fingerprint"></i> Gunakan FaceID / Sidik Jari
              </button>
            </div>
          </div>

          <div className="register-link" style={{ marginTop: "20px" }}>
            <Link href="/beranda" style={{ color: "var(--text-muted)" }}>
              <i className="fa-solid fa-arrow-left"></i> Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import "../../login/login.css";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [toastData, setToastData] = useState<{title: string, message: string, isError: boolean} | null>(null);

  useEffect(() => {
    const savedTheme = (localStorage.getItem("expedient_theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("expedient_theme", nextTheme);
  };

  const showToast = (title: string, message: string, isError: boolean) => {
    setToastData({ title, message, isError });
    setTimeout(() => setToastData(null), 5000);
  };

  useEffect(() => {
    // Supabase will automatically handle the token from the URL hash
    // when the page loads via the email reset link
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (newPassword.length < 8) {
      showToast("Gagal", "Kata sandi baru minimal 8 karakter.", true);
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Gagal", "Konfirmasi kata sandi tidak cocok.", true);
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      showToast("Gagal", updateError.message, true);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Redirect to beranda after 3 seconds
    setTimeout(() => {
      router.push("/beranda");
    }, 3000);
  };

  return (
    <div className="login-page">
      <div className="ambient-field">
        <div className="core-orb orb-1"></div>
        <div className="core-orb orb-2"></div>
        <div className="core-orb orb-3"></div>
      </div>

      <button className="toggle-widget" id="btnTheme" title="Ganti Mode" onClick={toggleTheme}>
        <div className="icon-orb">
          <i className={`fa-solid ${theme === "dark" ? "fa-moon" : "fa-sun"}`} id="toggleIcon"></i>
        </div>
        <span className="widget-text" id="themeText">
          {theme === "dark" ? "Malam" : "Siang"}
        </span>
      </button>

      {toastData && (
        <div id="toastAlert" className={`quantum-toast ${toastData.isError ? 'toast-error' : 'toast-success'} show`}>
          <div className="toast-icon"><i className={`fa-solid ${toastData.isError ? 'fa-shield-virus' : 'fa-check-double'}`}></i></div>
          <div style={{ transform: "translateZ(10px)" }}>
            <strong style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem" }}>{toastData.title}</strong><br/>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{toastData.message}</span>
          </div>
        </div>
      )}

      <div className="scene-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="auth-prism" style={{ maxWidth: "480px", width: "90%" }}>
          <div className="prism-header">
            <div style={{ marginBottom: "20px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo-utuh.webp" alt="Expedient" style={{ width: "80px", filter: "drop-shadow(0 0 20px rgba(212,175,55,0.4))" }} />
            </div>
            <div className="subtitle-spec">Expedient Generation</div>
            <h1 className="title-holo" style={{ fontSize: "clamp(1.2rem, 3vw, 1.6rem)" }}>
              {success ? "Sandi Dipulihkan" : "Atur Sandi Baru"}
            </h1>
          </div>

          {success ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "rgba(76,175,80,0.1)", border: "2px solid rgba(76,175,80,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 25px", fontSize: "1.8rem", color: "#4caf50" }}>
                <i className="fa-solid fa-check-circle"></i>
              </div>
              <p style={{ color: "var(--text-primary, #fff)", fontSize: "0.95rem", fontWeight: 600, marginBottom: "10px" }}>
                Kata sandi berhasil diperbarui!
              </p>
              <p style={{ color: "var(--text-muted, #7b8e9b)", fontSize: "0.85rem", lineHeight: 1.7 }}>
                Anda akan dialihkan ke beranda dalam beberapa detik...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ color: "var(--text-muted, #7b8e9b)", fontSize: "0.85rem", lineHeight: 1.7, marginBottom: "25px", textAlign: "center" }}>
                Masukkan kata sandi baru Anda. Pastikan minimal 8 karakter.
              </p>

              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-control"
                  required
                  placeholder=" "
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <label className="input-label">Kata Sandi Baru</label>
                <div className="input-neon-line"></div>
                <i
                  className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} icon-eye`}
                  onClick={() => setShowPassword(!showPassword)}
                ></i>
              </div>

              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-control"
                  required
                  placeholder=" "
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <label className="input-label">Konfirmasi Kata Sandi</label>
                <div className="input-neon-line"></div>
              </div>

              <div className="btn-rack">
                <div className="magnetic-wrap">
                  <button type="submit" className="btn-prime magnetic-btn" disabled={loading}>
                    {loading ? (
                      <><i className="fa-solid fa-circle-notch fa-spin"></i> Memproses...</>
                    ) : (
                      <>Perbarui Kata Sandi <i className="fa-solid fa-shield-halved"></i></>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="register-link" style={{ marginTop: "20px" }}>
            <Link href="/login"><i className="fa-solid fa-arrow-left" style={{ marginRight: "5px" }}></i> Kembali ke Portal Utama</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

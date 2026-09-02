"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import "../login/login.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"request" | "sent">("request");
  const [loading, setLoading] = useState(false);
  
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

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (resetError) {
      showToast("Gagal", resetError.message, true);
      setLoading(false);
      return;
    }

    setStep("sent");
    setLoading(false);
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
              <img src="/images/logo-utuh.webp" alt="Expedient" style={{ width: "80px", filter: "drop-shadow(0 0 20px rgba(212,175,55,0.4))", animation: "floatLogo 6s ease-in-out infinite" }} />
            </div>
            <div className="subtitle-spec">Expedient Generation</div>
            <h1 className="title-holo" style={{ fontSize: "clamp(1.2rem, 3vw, 1.6rem)" }}>
              {step === "request" ? "Pemulihan Kata Sandi" : "Instruksi Terkirim"}
            </h1>
          </div>

          {step === "request" ? (
            <form onSubmit={handleSubmit}>
              <p style={{ color: "var(--text-muted, #7b8e9b)", fontSize: "0.85rem", lineHeight: 1.7, marginBottom: "25px", textAlign: "center" }}>
                Masukkan alamat surel yang terdaftar. Kami akan mengirimkan tautan pemulihan ke kotak masuk Anda.
              </p>

              <div className="input-group">
                <input
                  type="email"
                  name="email"
                  className="input-control"
                  required
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <label className="input-label">Surel Resmi</label>
                <div className="input-neon-line"></div>
              </div>

              <div className="btn-rack">
                <div className="magnetic-wrap">
                  <button type="submit" className="btn-prime magnetic-btn" disabled={loading}>
                    {loading ? (
                      <><i className="fa-solid fa-circle-notch fa-spin"></i> Mengirim...</>
                    ) : (
                      <>Kirim Tautan Pemulihan <i className="fa-solid fa-paper-plane"></i></>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "rgba(212,175,55,0.1)", border: "2px solid rgba(212,175,55,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 25px", fontSize: "1.8rem", color: "#d4af37" }}>
                <i className="fa-solid fa-envelope-circle-check"></i>
              </div>
              <p style={{ color: "var(--text-primary, #fff)", fontSize: "0.95rem", fontWeight: 600, marginBottom: "10px" }}>
                Tautan pemulihan telah dikirim
              </p>
              <p style={{ color: "var(--text-muted, #7b8e9b)", fontSize: "0.85rem", lineHeight: 1.7, marginBottom: "30px" }}>
                Periksa kotak masuk <strong style={{ color: "#d4af37" }}>{email}</strong> untuk instruksi selanjutnya.
                Jika tidak ditemukan, cek folder spam Anda.
              </p>
              <div className="btn-rack">
                <div className="magnetic-wrap">
                  <button type="button" className="btn-prime magnetic-btn" onClick={() => { setStep("request"); setEmail(""); }}>
                    <i className="fa-solid fa-rotate-left" style={{ marginRight: "8px" }}></i> Kirim Ulang
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="register-link" style={{ marginTop: "20px" }}>
            <Link href="/login"><i className="fa-solid fa-arrow-left" style={{ marginRight: "5px" }}></i> Kembali ke Portal Utama</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

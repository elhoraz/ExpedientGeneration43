"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { executeThemeTransition } from "@/lib/theme/executeThemeTransition";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import "../../login/login.css";

export default function ResetPasswordPage() {
  const { locale, t } = useLanguage();
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
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = (e?: React.MouseEvent) => {
    if (navigator.vibrate) navigator.vibrate(50);
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    executeThemeTransition(nextTheme, e);
  };

  const showToast = (title: string, message: string, isError: boolean) => {
    setToastData({ title, message, isError });
    setTimeout(() => setToastData(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (newPassword.length < 8) {
      showToast(t.common.error, t.reset_password.toast_min_length, true);
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast(t.common.error, t.reset_password.toast_mismatch, true);
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      showToast(t.common.error, updateError.message, true);
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

      <div className="login-top-bar">
        <LanguageSwitcher variant="pill" />
        <button type="button" className="toggle-widget" id="btnTheme" title={t.common.theme_toggle} onClick={toggleTheme}>
          <div className="icon-orb">
            <i className={`fa-solid ${theme === "dark" ? "fa-moon" : "fa-sun"}`} id="toggleIcon" aria-hidden="true"></i>
          </div>
          <span className="widget-text" id="themeText">
            {theme === "dark" ? t.common.theme_dark : t.common.theme_light}
          </span>
        </button>
      </div>

      {toastData && (
        <div
          id="toastAlert"
          role={toastData.isError ? "alert" : "status"}
          aria-live="polite"
          className={`quantum-toast ${toastData.isError ? 'toast-error' : 'toast-success'} show`}
        >
          <div className="toast-icon"><i className={`fa-solid ${toastData.isError ? 'fa-shield-virus' : 'fa-check-double'}`} aria-hidden="true"></i></div>
          <div style={{ flex: 1 }}>
            <strong style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem" }}>{toastData.title}</strong><br/>
            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{toastData.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastData(null)}
            aria-label={t.common.close || "Close"}
            style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
      )}

      <div className="scene-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="auth-prism" style={{ maxWidth: "480px", width: "90%" }}>
          <div className="prism-header">
            <div style={{ marginBottom: "20px" }}>
              <Image src="/images/logo-utuh.webp" alt="Expedient" width={80} height={80} priority style={{ width: "80px", height: "auto", filter: "drop-shadow(0 0 20px rgba(212,175,55,0.4))" }} />
            </div>
            <div className="subtitle-spec">Expedient Generation</div>
            <h1 className="title-holo" style={{ fontSize: "clamp(1.2rem, 3vw, 1.6rem)" }}>
              {t.reset_password.title}
            </h1>
          </div>

          {success ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.14)", border: "2px solid #047857", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 25px", fontSize: "1.8rem", color: "#047857" }} aria-hidden="true">
                <i className="fa-solid fa-check-circle"></i>
              </div>
              <p style={{ color: "var(--text-main, #fff)", fontSize: "0.95rem", fontWeight: 600, marginBottom: "10px" }}>
                {t.reset_password.toast_success}
              </p>
              <p style={{ color: "var(--text-secondary, #94a3b8)", fontSize: "0.88rem", lineHeight: 1.7 }}>
                {t.reset_password.toast_redirecting}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ color: "var(--text-secondary, #94a3b8)", fontSize: "0.88rem", lineHeight: 1.7, marginBottom: "25px", textAlign: "center" }}>
                {t.reset_password.subtitle}
              </p>

              <div className="input-group">
                <input
                  id="resetNewPassword"
                  type={showPassword ? "text" : "password"}
                  className="input-control"
                  required
                  placeholder=" "
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <label htmlFor="resetNewPassword" className="input-label">
                  {t.reset_password.new_password_label}
                </label>
                <div className="input-neon-line"></div>
                <button
                  type="button"
                  className="icon-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                  aria-pressed={showPassword}
                >
                  <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} aria-hidden="true"></i>
                </button>
              </div>

              <div className="input-group">
                <input
                  id="resetConfirmPassword"
                  type={showPassword ? "text" : "password"}
                  className="input-control"
                  required
                  placeholder=" "
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <label htmlFor="resetConfirmPassword" className="input-label">
                  {t.reset_password.confirm_password_label}
                </label>
                <div className="input-neon-line"></div>
              </div>

              <div className="btn-rack">
                <div className="magnetic-wrap">
                  <button type="submit" className="btn-prime magnetic-btn" disabled={loading}>
                    {loading ? (
                      <><i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i> {t.reset_password.btn_submitting}</>
                    ) : (
                      <>
                        {t.reset_password.btn_submit}{" "}
                        <i className="fa-solid fa-shield-halved" aria-hidden="true" style={{ marginInlineStart: "6px" }}></i>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="register-link" style={{ marginTop: "20px" }}>
            <Link href="/login">
              <i className={`fa-solid ${locale === "ar" ? "fa-arrow-right" : "fa-arrow-left"}`} aria-hidden="true" style={{ marginInlineEnd: "6px" }}></i>
              {t.reset_password.back_to_login}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { executeThemeTransition } from "@/lib/theme/executeThemeTransition";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import "../login/login.css";

export default function ForgotPasswordPage() {
  const { locale, t } = useLanguage();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"request" | "sent">("request");
  const [loading, setLoading] = useState(false);
  
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

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (resetError) {
      showToast(t.forgot_password.toast_failed, resetError.message, true);
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

      <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 100, display: "flex", alignItems: "center", gap: "10px" }}>
        <LanguageSwitcher />
        <button className="toggle-widget" id="btnTheme" title={t.common.theme_toggle} onClick={toggleTheme}>
          <div className="icon-orb">
            <i className={`fa-solid ${theme === "dark" ? "fa-moon" : "fa-sun"}`} id="toggleIcon"></i>
          </div>
          <span className="widget-text" id="themeText">
            {theme === "dark" ? t.common.theme_dark : t.common.theme_light}
          </span>
        </button>
      </div>

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
              <Image src="/images/logo-utuh.webp" alt="Expedient" width={80} height={80} priority style={{ width: "80px", height: "auto", filter: "drop-shadow(0 0 20px rgba(212,175,55,0.4))", animation: "floatLogo 6s ease-in-out infinite" }} />
            </div>
            <div className="subtitle-spec">Expedient Generation</div>
            <h1 className="title-holo" style={{ fontSize: "clamp(1.2rem, 3vw, 1.6rem)" }}>
              {step === "request" ? t.forgot_password.title_request : t.forgot_password.title_sent}
            </h1>
          </div>

          {step === "request" ? (
            <form onSubmit={handleSubmit}>
              <p style={{ color: "var(--text-muted, #7b8e9b)", fontSize: "0.85rem", lineHeight: 1.7, marginBottom: "25px", textAlign: "center" }}>
                {t.forgot_password.sent_notice_desc}
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
                <label className="input-label">
                  {t.forgot_password.email_label}
                </label>
                <div className="input-neon-line"></div>
              </div>

              <div className="btn-rack">
                <div className="magnetic-wrap">
                  <button type="submit" className="btn-prime magnetic-btn" disabled={loading}>
                    {loading ? (
                      <><i className="fa-solid fa-circle-notch fa-spin"></i> {t.forgot_password.btn_sending}</>
                    ) : (
                      <>
                        {t.forgot_password.btn_send_reset}{" "}
                        <i className={`fa-solid ${locale === "ar" ? "fa-paper-plane fa-flip-horizontal" : "fa-paper-plane"}`} style={{ marginInlineStart: "6px" }}></i>
                      </>
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
                {t.forgot_password.sent_notice_title}
              </p>
              <p style={{ color: "var(--text-muted, #7b8e9b)", fontSize: "0.85rem", lineHeight: 1.7, marginBottom: "30px" }}>
                {t.forgot_password.sent_check_spam}{" "}
                <strong style={{ color: "#d4af37" }}>{email}</strong>
              </p>
              <div className="btn-rack">
                <div className="magnetic-wrap">
                  <button type="button" className="btn-prime magnetic-btn" onClick={() => { setStep("request"); setEmail(""); }}>
                    <i className="fa-solid fa-rotate-left" style={{ marginInlineEnd: "8px" }}></i>
                    {t.forgot_password.btn_send_reset}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="register-link" style={{ marginTop: "20px" }}>
            <Link href="/login">
              <i className={`fa-solid ${locale === "ar" ? "fa-arrow-right" : "fa-arrow-left"}`} style={{ marginInlineEnd: "6px" }}></i>
              {t.forgot_password.back_to_login}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCms } from "@/components/layout/CmsProvider";
import "./login.css";

function LoginContent() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [logoState, setLogoState] = useState<"exploding" | "united">("united");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [isBioLoading, setIsBioLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const prismRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useCms();
  
  const searchParams = useSearchParams();
  const errorMsg = searchParams.get("error");
  const successMsg = searchParams.get("success");
  const verifyMsg = searchParams.get("verify");
  const emailParam = searchParams.get("email");
  const expiredParam = searchParams.get("expired");
  
  const [toastData, setToastData] = useState<{title: string, message: string, isError: boolean} | null>(null);
  const [showSelfActivation, setShowSelfActivation] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (emailParam && !email) {
      setEmail(emailParam);
    }
    if (
      expiredParam === "true" ||
      (errorMsg && (
        errorMsg.toLowerCase().includes("kedaluwarsa") ||
        errorMsg.toLowerCase().includes("expired") ||
        errorMsg.toLowerCase().includes("invalid") ||
        errorMsg.toLowerCase().includes("belum diverifikasi") ||
        errorMsg.toLowerCase().includes("not confirmed")
      ))
    ) {
      setShowSelfActivation(true);
    }
  }, [errorMsg, emailParam, expiredParam]);

  useEffect(() => {
    if (errorMsg) {
      setToastData({ title: "Akses Ditolak", message: errorMsg, isError: true });
      setTimeout(() => setToastData(null), 5000);
    } else if (successMsg) {
      setToastData({ title: "Akses Diverifikasi", message: successMsg, isError: false });
      setTimeout(() => setToastData(null), 5000);
    } else if (verifyMsg === "true") {
      setToastData({ title: "Registrasi Berhasil", message: "Silakan periksa email Anda (juga folder spam) untuk verifikasi akun, serta pesan WhatsApp yang dikirimkan.", isError: false });
      setTimeout(() => setToastData(null), 10000);
    }
  }, [errorMsg, successMsg, verifyMsg]);

  const showToast = (title: string, message: string, isError: boolean) => {
    setToastData({ title, message, isError });
    setTimeout(() => setToastData(null), 5000);
  };

  const handleVerificationAction = async (mode: "resend_email" | "direct_activate") => {
    const targetEmail = email.trim();
    if (!targetEmail) {
      showToast("Email Diperlukan", "Silakan masukkan alamat email Anda terlebih dahulu pada kolom surel.", true);
      emailInputRef.current?.focus();
      return;
    }

    if (mode === "resend_email" && resendCooldown > 0) {
      showToast("Mohon Tunggu", `Tunggu ${resendCooldown} detik sebelum meminta pengiriman ulang berikutnya.`, true);
      return;
    }

    try {
      if (mode === "resend_email") {
        setIsResending(true);
      } else {
        setIsActivating(true);
      }

      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, mode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (mode === "resend_email") {
          setResendCooldown(60);
          showToast("Tautan Terkirim!", data.message || "Tautan verifikasi baru berhasil dikirimkan ke email Anda! Periksa kotak masuk atau spam.", false);
        } else {
          showToast("Akses Disahkan!", data.message || "Akun Anda berhasil disahkan dan aktif! Silakan masukkan kata sandi dan klik Masuk.", false);
          setShowSelfActivation(false);
        }
      } else {
        showToast("Gagal", data.error || "Gagal memproses permintaan verifikasi.", true);
      }
    } catch (e: any) {
      showToast("Gagal", e.message || "Terjadi kesalahan koneksi.", true);
    } finally {
      setIsResending(false);
      setIsActivating(false);
    }
  };

  useEffect(() => {
    const savedTheme = (localStorage.getItem("expedient_theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    triggerLogoExplosion();
  }, []);

  const triggerLogoExplosion = () => {
    setLogoState("exploding");
    setTimeout(() => {
      setLogoState("united");
    }, 1000);
  };

  const toggleTheme = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    triggerLogoExplosion();
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("expedient_theme", nextTheme);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (window.innerWidth > 768 && wrapperRef.current && prismRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -4;
      const rotateY = ((x - centerX) / centerX) * 4;

      prismRef.current.style.transform = `perspective(2000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
  };

  const handleMouseLeave = () => {
    if (prismRef.current) {
      prismRef.current.style.transform = `perspective(2000px) rotateX(0deg) rotateY(0deg)`;
    }
  };

  const handleLoginBiometric = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      showToast("Gagal", "Masukkan email Anda terlebih dahulu.", true);
      emailInputRef.current?.focus();
      return;
    }

    try {
      setIsBioLoading(true);

      const { startAuthentication } = await import("@simplewebauthn/browser");

      // 1. Ambil opsi login dari server
      const optResp = await fetch("/api/biometric/login-options?email=" + encodeURIComponent(trimmedEmail));
      let options: any = null;
      try {
        options = await optResp.json();
      } catch {
        const errText = await optResp.text().catch(() => "");
        throw new Error(errText || "Gagal mengambil opsi biometrik dari server.");
      }

      if (!optResp.ok || options?.error) {
        throw new Error(options?.error || "Gagal mengambil opsi biometrik");
      }

      // 2. Mulai autentikasi
      const authResp = await startAuthentication({ optionsJSON: options });

      // 3. Verifikasi
      const verifyResp = await fetch("/api/biometric/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authResp)
      });

      let verifyJSON: any = null;
      try {
        verifyJSON = await verifyResp.json();
      } catch {
        const errText = await verifyResp.text().catch(() => "");
        throw new Error(errText || "Gagal memverifikasi biometrik ke server.");
      }

      if (verifyJSON?.verified) {
        showToast("Sukses", "Autentikasi biometrik berhasil! Mengalihkan...", false);
        window.location.href = verifyJSON.redirect_url || verifyJSON.action_link || "/beranda";
      } else {
        throw new Error(verifyJSON?.error || "Gagal verifikasi biometrik");
      }
    } catch (e: any) {
      console.error(e);
      showToast("Biometrik", e.message || "Biometrik Error", true);
    } finally {
      setIsBioLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="ambient-field" id="ambientField">
        <div className="core-orb orb-1"></div>
        <div className="core-orb orb-2"></div>
        <div className="core-orb orb-3"></div>
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

      <button className="toggle-widget" id="btnTheme" title="Ganti Mode" onClick={toggleTheme}>
        <div className="icon-orb">
          <i className={`fa-solid ${theme === "dark" ? "fa-moon" : "fa-sun"}`} id="toggleIcon"></i>
        </div>
        <span className="widget-text" id="themeText">
          {theme === "dark" ? "Malam" : "Siang"}
        </span>
      </button>

      <button className="toggle-widget install-app-btn" onClick={() => setIsModalOpen(true)} title="Panduan Install">
        <div className="icon-orb" style={{ color: "#d4af37", background: "rgba(212,175,55,0.1)" }}>
          <i className="fa-solid fa-download"></i>
        </div>
        <span className="widget-text" style={{ color: "#d4af37" }}>
          Install App
        </span>
      </button>

      <div
        className="scene-wrapper"
        ref={wrapperRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="auth-prism" ref={prismRef}>
          <div className="prism-header">
            <div className={`logo-container ${logoState}`} id="logoContainer">
              <img src="/images/kristal-puncak.webp" className="logo-part part-1" alt="Part" />
              <img src="/images/tanduk-perak.webp" className="logo-part part-2" alt="Part" />
              <img src="/images/zamrud-hijau.webp" className="logo-part part-3" alt="Part" />
              <img src="/images/cincin-emas.webp" className="logo-part part-4" alt="Part" />
              <img src="/images/mahkota-emas.webp" className="logo-part part-5" alt="Part" />
              <img src={t('login_hero_image', '/images/logo-utuh.webp')} className="logo-utuh" alt="Expedient Logo" />
            </div>
            <div className="subtitle-spec">{t('login_subtitle', 'Expedient Generation')}</div>
            <h1 className="title-holo">{t('login_title', 'Portal Utama')}</h1>
          </div>

          <form action="/auth/login" method="POST">
            {showSelfActivation && (
              <div className="self-activation-banner">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ color: "#ffd700", fontSize: "1rem" }}></i>
                  <strong style={{ fontSize: "0.85rem", color: "#ffd700", letterSpacing: "0.5px" }}>
                    Verifikasi Kedaluwarsa / Belum Terverifikasi
                  </strong>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0 0 12px 0", lineHeight: 1.4 }}>
                  Tautan verifikasi email Anda kedaluwarsa atau belum masuk? Pastikan surel di bawah sudah sesuai, lalu klik tombol untuk mengirimkan tautan verifikasi baru:
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button
                    type="button"
                    className="btn-self-activate"
                    onClick={() => handleVerificationAction("resend_email")}
                    disabled={isResending || isActivating || resendCooldown > 0}
                  >
                    <i className={isResending ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-paper-plane"}></i>
                    <span>
                      {isResending
                        ? "Mengirimkan Tautan Baru..."
                        : resendCooldown > 0
                        ? `Kirim Lagi Verifikasi (${resendCooldown}s)`
                        : "Kirim Lagi Verifikasinya ke Email"}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="btn-self-activate-outline"
                    onClick={() => handleVerificationAction("direct_activate")}
                    disabled={isResending || isActivating}
                    title="Opsi cadangan cepat jika email terkendala atau tidak masuk"
                  >
                    <i className={isActivating ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-bolt"}></i>
                    <span>{isActivating ? "Mengesahkan Akun..." : "⚡ Sahkan Akun Langsung (Cadangan Cepat)"}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="input-group">
              <input
                type="email"
                name="email"
                id="email"
                className="input-control"
                required
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                ref={emailInputRef}
              />
              <label htmlFor="email" className="input-label">{t('login_label_email', 'Surel Resmi')}</label>
              <div className="input-neon-line"></div>
            </div>

            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                id="inputPw"
                name="password"
                className="input-control"
                required
                placeholder=" "
              />
              <label htmlFor="inputPw" className="input-label">{t('login_label_password', 'Kata Sandi Akses')}</label>
              <div className="input-neon-line"></div>
              <i
                className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} icon-eye`}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "-10px", marginBottom: "15px", transform: "translateZ(25px)" }}>
              <label style={{ color: "var(--text-muted)", fontSize: "clamp(0.7rem,1.3vh,0.8rem)", display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                <input type="checkbox" name="remember" style={{ accentColor: "#d4af37", cursor: "pointer" }} />
                Ingat Saya
              </label>
              <Link href="/forgot-password" style={{ color: "var(--text-muted)", fontSize: "clamp(0.7rem,1.3vh,0.8rem)", textDecoration: "none", transition: "0.3s", borderBottom: "1px solid transparent" }}>
                <i className="fa-solid fa-key" style={{ fontSize: "0.65rem", marginRight: "4px" }}></i>Lupa Sandi?
              </Link>
            </div>

            <div className="btn-rack">
              <div className="magnetic-wrap">
                <button type="submit" className="btn-prime magnetic-btn">
                  {t('login_btn_submit', 'Inisiasi Masuk')} <i className="fa-solid fa-arrow-right-long"></i>
                </button>
              </div>

              <div className="divider">
                <hr /><span>ALTERNATIF</span><hr />
              </div>

              <div className="magnetic-wrap">
                <button
                  type="button"
                  className="btn-bio magnetic-btn"
                  onClick={handleLoginBiometric}
                  disabled={isBioLoading}
                >
                  {isBioLoading ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i> Proses...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-fingerprint" style={{ fontSize: "1.1rem" }}></i> {t('login_btn_biometric', 'Pemindaian Biometrik')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          <div style={{ textAlign: "center", marginTop: "14px", marginBottom: "6px" }}>
            <button
              type="button"
              onClick={() => setShowSelfActivation(!showSelfActivation)}
              style={{
                background: "none",
                border: "none",
                color: showSelfActivation ? "#ffd700" : "var(--text-muted)",
                fontSize: "0.75rem",
                cursor: "pointer",
                textDecoration: "underline",
                padding: "4px 8px",
                transition: "color 0.2s ease"
              }}
            >
              {showSelfActivation ? "Tutup panel verifikasi" : "Tautan verifikasi kedaluwarsa? Kirim lagi verifikasinya"}
            </button>
          </div>

          <div className="register-link">
            {t('login_text_register', 'Identitas belum terdaftar?')} <Link href="/register">{t('login_link_register', 'Ajukan Registrasi')}</Link>
          </div>

          <div className="register-link" style={{ marginTop: "10px", paddingTop: "15px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <Link href="/"><i className="fa-solid fa-arrow-left"></i> Kembali ke Gerbang Utama</Link>
          </div>
        </div>
      </div>

      <div className={`install-modal ${isModalOpen ? "active" : ""}`} id="installModal">
        <div className="install-content">
          <h2 className="install-title">Instalasi VVIP App</h2>
          <div className="install-step">
            <div className="step-icon"><i className="fa-brands fa-android"></i></div>
            <div className="step-text">
              <h4>Android (Chrome)</h4>
              <p>Ketuk ikon <b>Titik Tiga</b> di pojok kanan atas browser, lalu pilih <b>"Tambahkan ke Layar Utama"</b>.</p>
            </div>
          </div>
          <div className="install-step">
            <div className="step-icon"><i className="fa-brands fa-apple"></i></div>
            <div className="step-text">
              <h4>iOS / iPhone (Safari)</h4>
              <p>Ketuk ikon <b>Bagikan/Share</b> (kotak dengan panah) di bawah layar, geser ke bawah, lalu pilih <b>"Tambah ke Layar Utama"</b>.</p>
            </div>
          </div>
          <button type="button" className="btn-prime magnetic-btn" style={{ marginTop: "20px", width: "100%", borderRadius: "10px", fontSize: "0.8rem" }} onClick={() => setIsModalOpen(false)}>SAYA MENGERTI</button>
        </div>
      </div>
    </div>
  );
}

export default function LoginClient() {
  return (
    <Suspense fallback={<div style={{ width: "100%", minHeight: "100vh", background: "#010302" }}></div>}>
      <LoginContent />
    </Suspense>
  );
}

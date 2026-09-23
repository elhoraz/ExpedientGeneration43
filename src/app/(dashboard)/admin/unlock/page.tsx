"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import "../../../login/login.css";

export default function AdminUnlockPage() {
  const { locale, t } = useLanguage();
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
        setError(
          data.message ||
            (locale === "ar"
              ? "رمز المرور غير صالح."
              : locale === "en"
              ? "Invalid access password."
              : "Sandi Akses tidak valid.")
        );
      }
    } catch (err: any) {
      setError(
        err.message ||
          (locale === "ar"
            ? "حدث خطأ في الاتصال."
            : locale === "en"
            ? "A connection error occurred."
            : "Terjadi kesalahan koneksi.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric = () => {
    // Fitur Biometric Unlock Placeholder
    setError(
      locale === "ar"
        ? "ميزة التحقق ببصمة الوجه / الإصبع للمسؤول قيد التطوير حالياً."
        : locale === "en"
        ? "FaceID / Fingerprint feature for Admin is currently under development."
        : "Fitur FaceID / Sidik Jari untuk Admin sedang dalam pengembangan."
    );
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
            <h1 className="title-holo" style={{ fontSize: "1.8rem" }}>
              {locale === "ar" ? "منطقة محظورة" : locale === "en" ? "Restricted Access" : "Akses Terbatas"}
            </h1>
            <div className="subtitle-spec">
              {locale === "ar" ? "مطلوب تصريح المسؤول" : locale === "en" ? "Administrator Authorization Required" : "Otorisasi Administrator Diperlukan"}
            </div>
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
                placeholder={locale === "ar" ? "كلمة المرور الرئيسية" : locale === "en" ? "Master Password" : "Kata Sandi Master"}
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
                    <><i className="fa-solid fa-circle-notch fa-spin"></i> {locale === "ar" ? "جاري المعالجة..." : locale === "en" ? "Processing..." : "Memproses..."}</>
                  ) : (
                    <><i className="fa-solid fa-unlock-keyhole"></i> {locale === "ar" ? "تحقق" : locale === "en" ? "Verify" : "Verifikasi"}</>
                  )}
                </button>
              </div>
            </div>
          </form>

          <div style={{ margin: "20px 0", display: "flex", alignItems: "center", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600 }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }}></div>
            <span style={{ padding: "0 15px", letterSpacing: "2px" }}>
              {locale === "ar" ? "أو" : locale === "en" ? "OR" : "ATAU"}
            </span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }}></div>
          </div>

          <div className="btn-rack">
            <div className="magnetic-wrap" style={{ width: "100%" }}>
              <button type="button" className="btn-prime magnetic-btn" onClick={handleBiometric} style={{ width: "100%", background: "linear-gradient(135deg, #00c853, #008844)", color: "#fff" }}>
                <i className="fa-solid fa-fingerprint"></i> {locale === "ar" ? "استخدام بصمة الوجه / الإصبع" : locale === "en" ? "Use FaceID / Fingerprint" : "Gunakan FaceID / Sidik Jari"}
              </button>
            </div>
          </div>

          <div className="register-link" style={{ marginTop: "20px" }}>
            <Link href="/beranda" style={{ color: "var(--text-muted)" }}>
              <i className="fa-solid fa-arrow-left"></i> {locale === "ar" ? "العودة إلى الرئيسية" : locale === "en" ? "Back to Home" : "Kembali ke Beranda"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

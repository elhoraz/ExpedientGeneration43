"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

export default function DeleteAccountClient() {
  const { t, isRTL: isRtl, dir } = useLanguage();

  return (
    <div
      dir={dir}
      style={{
        minHeight: "100dvh",
        backgroundColor: "#060b14",
        color: "#e6edf3",
        padding: "2rem 1rem",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: isRtl ? "var(--font-amiri, serif), var(--font-inter, sans-serif)" : "var(--font-inter, sans-serif)",
      }}
    >
      <div
        style={{
          maxWidth: "680px",
          width: "100%",
          background: "rgba(12, 21, 38, 0.8)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(212, 175, 55, 0.25)",
          borderRadius: "16px",
          padding: "2.5rem 2rem",
          boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
        }}
      >
        {/* Top Bar with Back Button & Language Switcher */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "#94a3b8",
              textDecoration: "none",
              fontSize: "0.9rem",
              transition: "color 0.2s ease",
            }}
          >
            <i className={`fa-solid ${isRtl ? "fa-arrow-right" : "fa-arrow-left"}`} />
            <span>{t.delete_account.back_home}</span>
          </Link>
          <LanguageSwitcher variant="pill" />
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
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
              marginBottom: "1rem",
            }}
          >
            <i className="fa-solid fa-user-xmark" />
          </div>
          <h1
            style={{
              fontFamily: isRtl ? "inherit" : "var(--font-playfair, serif)",
              fontSize: "1.85rem",
              color: "#f3ba2f",
              margin: "0 0 0.5rem 0",
            }}
          >
            {t.delete_account.title}
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "0.95rem", margin: "0 0 0.75rem 0" }}>
            {t.delete_account.subtitle}
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "999px",
              background: "rgba(212, 175, 55, 0.12)",
              border: "1px solid rgba(212, 175, 55, 0.3)",
              color: "#f3ba2f",
              fontSize: "0.78rem",
              fontWeight: 600,
            }}
          >
            <i className="fa-solid fa-shield-check" />
            <span>{t.delete_account.compliance_badge}</span>
          </div>
        </div>

        {/* Notice Box */}
        <div
          style={{
            marginBottom: "1.75rem",
            padding: "1rem 1.25rem",
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            borderRadius: "10px",
          }}
        >
          <h3
            style={{
              fontSize: "0.95rem",
              color: "#f87171",
              margin: "0 0 0.35rem 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <i className="fa-solid fa-triangle-exclamation" /> {t.delete_account.notice_title}
          </h3>
          <p style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.55, margin: 0 }}>
            {t.delete_account.notice_desc}
          </p>
        </div>

        {/* Section 1: Cara Menghapus Akun */}
        <div style={{ marginBottom: "1.75rem" }}>
          <h2
            style={{
              fontSize: "1.1rem",
              color: "#f3ba2f",
              marginBottom: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <i className="fa-solid fa-mobile-screen-button" /> {t.delete_account.how_to_delete_title}
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>
            {t.delete_account.step_app}
          </p>
          <ol
            style={{
              fontSize: "0.9rem",
              color: "#cbd5e1",
              lineHeight: 1.6,
              marginTop: "0.5rem",
              paddingInlineStart: "1.25rem",
            }}
          >
            {t.delete_account.delete_steps.map((step, idx) => (
              <li key={idx} style={{ marginBottom: "0.25rem" }}>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Section 2: Data yang Dihapus */}
        <div style={{ marginBottom: "1.75rem" }}>
          <h2
            style={{
              fontSize: "1.1rem",
              color: "#f3ba2f",
              marginBottom: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <i className="fa-solid fa-trash-can" /> {t.delete_account.policy_scope_title}
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>
            {t.delete_account.policy_scope_desc}
          </p>
          <ul
            style={{
              fontSize: "0.9rem",
              color: "#cbd5e1",
              lineHeight: 1.6,
              marginTop: "0.5rem",
              paddingInlineStart: "1.25rem",
            }}
          >
            {t.delete_account.data_deleted_list.map((item, idx) => (
              <li key={idx} style={{ marginBottom: "0.25rem" }}>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Section 3: Data yang Ditahan */}
        <div
          style={{
            marginBottom: "2rem",
            padding: "1rem",
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "8px",
          }}
        >
          <h3
            style={{
              fontSize: "0.95rem",
              color: "#fbbf24",
              margin: "0 0 0.5rem 0",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <i className="fa-solid fa-shield-halved" /> {t.delete_account.data_retained_title}
          </h3>
          <p style={{ fontSize: "0.85rem", color: "#e2e8f0", lineHeight: 1.5, margin: 0 }}>
            {t.delete_account.data_retained_desc}
          </p>
        </div>

        {/* CTA & Support Contact */}
        <div
          style={{
            textAlign: "center",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: "1.5rem",
          }}
        >
          <p style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "1rem" }}>
            {t.delete_account.step_manual_desc}
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
                color: "#060b14",
                fontWeight: 600,
                fontSize: "0.9rem",
                textDecoration: "none",
              }}
            >
              <i className="fa-solid fa-arrow-right-to-bracket" /> {t.delete_account.btn_confirm_delete}
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
                textDecoration: "none",
              }}
            >
              <i className="fa-solid fa-envelope" /> {t.delete_account.contact_admin_btn}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

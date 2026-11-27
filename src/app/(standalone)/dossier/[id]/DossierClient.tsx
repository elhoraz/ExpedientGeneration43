"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getAvatarUrl, getAvatarFallback } from "@/lib/avatar";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function DossierClient({ targetUser, age }: { targetUser: any, age: string | number }) {
  const { t, locale, dir, isRTL } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const card = document.getElementById("tilt-card");
    if (!card || reducedMotion || window.innerWidth <= 768) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      const rotateY = (x / rect.width) * 6;
      const rotateX = -(y / rect.height) * 6;
      card.style.transform = `perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
    };

    const handleMouseLeave = () => {
      card.style.transition = "transform 0.4s ease";
      card.style.transform = "perspective(1000px) rotateY(0deg) rotateX(0deg)";
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const [avatarSrc, setAvatarSrc] = useState(() =>
    getAvatarUrl(targetUser.foto_profil, targetUser.nama_panggilan || targetUser.nama_lengkap || "U")
  );

  const displayName = targetUser.nama_lengkap || targetUser.nama_panggilan || "Alumni Arrisalah";
  const instagramHandle = typeof targetUser.akun_ig === "string" ? targetUser.akun_ig.replace(/^@/, "").trim() : "";

  return (
    <main className="dossier-page" dir={dir}>
      <style>{`
        .dossier-page {
          min-height: 100dvh;
          background: var(--bg-main, #060b14);
          color: var(--text-primary, #f2efe9);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 28px 16px;
          font-family: ${isRTL ? "var(--font-amiri, serif), var(--font-sans, sans-serif)" : "var(--font-sans, 'Inter', sans-serif)"};
        }
        .dossier-shell {
          width: 100%;
          max-width: 520px;
        }
        .dossier-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .dossier-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          padding: 8px 14px;
          border-radius: 10px;
          background: var(--bg-card, #0f141e);
          border: 1px solid var(--border-strong, rgba(212, 175, 55, 0.28));
          color: var(--gold-main, #d4af37);
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }
        .dossier-back-btn:hover {
          background: var(--surface-raised, #171e2c);
          border-color: var(--gold-main, #d4af37);
        }
        .dossier-verified {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          background: rgba(76, 195, 138, 0.12);
          border: 1px solid rgba(76, 195, 138, 0.3);
          color: #4cc38a;
          font-size: 0.78rem;
          font-weight: 600;
        }
        .dossier-card {
          background: var(--bg-card, #0f141e);
          border: 1px solid var(--border-strong, rgba(212, 175, 55, 0.26));
          border-radius: 20px;
          padding: 36px 28px 30px;
          text-align: center;
          box-shadow: var(--glass-shadow, 0 20px 44px rgba(0, 0, 0, 0.45));
          transition: transform 0.25s ease;
        }
        .dossier-avatar-wrap {
          width: 128px;
          height: 128px;
          margin: 0 auto 20px;
          border-radius: 50%;
          padding: 4px;
          border: 2px solid var(--gold-main, #d4af37);
          background: var(--surface-raised, #171e2c);
        }
        .dossier-avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          display: block;
        }
        .dossier-cohort {
          display: inline-block;
          color: var(--gold-main, #d4af37);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .dossier-name {
          font-family: ${isRTL ? "inherit" : "var(--font-playfair, 'Playfair Display', serif)"};
          font-size: clamp(1.65rem, 4.5vw, 2.05rem);
          color: var(--text-primary, #f2efe9);
          margin: 0 0 8px 0;
          line-height: 1.25;
        }
        .dossier-meta-row {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px 16px;
          color: var(--text-secondary, #a1a8b5);
          font-size: 0.85rem;
          margin-bottom: 22px;
        }
        .dossier-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .dossier-quote {
          font-style: italic;
          color: var(--text-secondary, #a1a8b5);
          line-height: 1.65;
          margin: 0 auto 28px;
          max-width: 42ch;
          font-size: 0.96rem;
        }
        .dossier-actions {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        .dossier-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 46px;
          padding: 12px 18px;
          border-radius: 12px;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
        }
        .dossier-btn-primary {
          background: var(--gold-main, #d4af37);
          border: 1px solid var(--gold-main, #d4af37);
          color: #060b14;
          font-weight: 700;
        }
        .dossier-btn-primary:hover {
          opacity: 0.93;
          transform: translateY(-1px);
        }
        .dossier-btn-secondary {
          background: var(--surface-raised, #171e2c);
          border: 1px solid var(--border-strong, rgba(255, 255, 255, 0.14));
          color: var(--text-primary, #f2efe9);
        }
        .dossier-btn-secondary:hover {
          border-color: var(--gold-main, #d4af37);
        }
        .dossier-btn-disabled {
          background: var(--surface-inset, #090d16);
          border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
          color: var(--text-muted, #8890a0);
          cursor: not-allowed;
          opacity: 0.65;
        }
        .dossier-back-btn:focus-visible,
        .dossier-btn:focus-visible {
          outline: 2px solid var(--focus-ring, #d4af37);
          outline-offset: 2px;
        }

        :root[data-theme="light"] .dossier-page { background: #f6f5f1; color: #18181b; }
        :root[data-theme="light"] .dossier-back-btn { background: #ffffff; border-color: rgba(124, 82, 10, 0.3); color: #7c520a; }
        :root[data-theme="light"] .dossier-verified { background: rgba(6, 95, 70, 0.1); border-color: rgba(6, 95, 70, 0.28); color: #065f46; }
        :root[data-theme="light"] .dossier-card { background: #ffffff; border-color: rgba(24, 24, 27, 0.14); box-shadow: 0 18px 40px rgba(24, 24, 27, 0.08); }
        :root[data-theme="light"] .dossier-avatar-wrap { border-color: #7c520a; background: #ebe9e1; }
        :root[data-theme="light"] .dossier-cohort { color: #7c520a; }
        :root[data-theme="light"] .dossier-name { color: #18181b; }
        :root[data-theme="light"] .dossier-meta-row,
        :root[data-theme="light"] .dossier-quote { color: #52525b; }
        :root[data-theme="light"] .dossier-btn-primary { background: #7c520a; border-color: #7c520a; color: #ffffff; }
        :root[data-theme="light"] .dossier-btn-secondary { background: #ebe9e1; border-color: rgba(24, 24, 27, 0.14); color: #18181b; }
        :root[data-theme="light"] .dossier-btn-disabled { background: #f0eee7; color: #676770; border-color: rgba(24, 24, 27, 0.1); }

        @media (min-width: 560px) {
          .dossier-actions { grid-template-columns: 1fr 1fr; }
          .dossier-btn-primary { grid-column: 1 / -1; }
        }
        @media (max-width: 480px) {
          .dossier-card { padding: 28px 20px 24px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .dossier-card, .dossier-btn { transition: none; transform: none !important; }
        }
      `}</style>

      <div className="dossier-shell">
        <div className="dossier-header">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push("/direktori"))}
            className="dossier-back-btn"
          >
            <i className={`fa-solid ${isRTL ? "fa-arrow-right" : "fa-arrow-left"}`} aria-hidden="true"></i>
            <span>{t.common.back}</span>
          </button>

          <div className="dossier-verified">
            <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
            <span>{locale === "ar" ? "خريج معتمد" : locale === "en" ? "Verified Alumni" : "Alumni Terverifikasi"}</span>
          </div>
        </div>

        <div className="dossier-card" id="tilt-card">
          <div className="dossier-avatar-wrap">
            <Image
              src={avatarSrc}
              width={128}
              height={128}
              priority
              className="dossier-avatar"
              alt={displayName}
              onError={() => setAvatarSrc(getAvatarFallback(targetUser.nama_panggilan || targetUser.nama_lengkap))}
              unoptimized={avatarSrc.startsWith("data:") || avatarSrc.includes("ui-avatars.com") || avatarSrc.includes("supabase.co")}
            />
          </div>

          <div className="dossier-cohort">
            {locale === "ar" ? "الدفعة ٤٣ · معهد الرسالة" : locale === "en" ? "Cohort 43 · Pondok Modern Arrisalah" : "Angkatan 43 · Pondok Modern Arrisalah"}
          </div>

          <h1 className="dossier-name">{displayName}</h1>

          <div className="dossier-meta-row">
            {targetUser.nama_panggilan && targetUser.nama_panggilan !== displayName && (
              <span className="dossier-meta-item">
                <i className="fa-regular fa-id-badge" aria-hidden="true"></i> {targetUser.nama_panggilan}
              </span>
            )}
            {targetUser.kota_domisili && (
              <span className="dossier-meta-item">
                <i className="fa-solid fa-location-dot" aria-hidden="true"></i> {targetUser.kota_domisili}
              </span>
            )}
            {age && age !== "N/A" && (
              <span className="dossier-meta-item">
                <i className="fa-regular fa-calendar" aria-hidden="true"></i> {age} {locale === "ar" ? "سنة" : locale === "en" ? "yrs" : "thn"}
              </span>
            )}
          </div>

          <p className="dossier-quote">
            “{targetUser.motivasi_hidup || (locale === "ar" ? "نسعى للخير ونبني المستقبل معاً." : locale === "en" ? "Growing in faith and friendship together." : "Merangkai kebaikan dan menjaga silaturahmi bersama.")}”
          </p>

          <div className="dossier-actions">
            <Link href={`/chat/personal/${targetUser.id}`} className="dossier-btn dossier-btn-primary">
              <i className="fa-solid fa-comment-dots" aria-hidden="true"></i>
              <span>{locale === "ar" ? "إرسال رسالة" : locale === "en" ? "Send Message" : "Kirim Pesan"}</span>
            </Link>

            {instagramHandle ? (
              <a
                href={`https://instagram.com/${encodeURIComponent(instagramHandle)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="dossier-btn dossier-btn-secondary"
              >
                <i className="fa-brands fa-instagram" aria-hidden="true"></i>
                <span>Instagram</span>
              </a>
            ) : (
              <button type="button" className="dossier-btn dossier-btn-disabled" disabled>
                <i className="fa-brands fa-instagram" aria-hidden="true"></i>
                <span>Instagram</span>
              </button>
            )}

            <a href={`/api/vcard/${targetUser.public_token || targetUser.id}`} className="dossier-btn dossier-btn-secondary">
              <i className="fa-solid fa-address-card" aria-hidden="true"></i>
              <span>{locale === "ar" ? "حفظ جهة الاتصال" : locale === "en" ? "Save Contact" : "Simpan Kontak"}</span>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

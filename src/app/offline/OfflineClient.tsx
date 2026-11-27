"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

export default function OfflineClient() {
  const { t, dir } = useLanguage();

  return (
    <main className="offline-page" dir={dir}>
      <style>{`
        .offline-page {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100dvh;
          padding: 40px 20px;
          text-align: center;
          background: var(--bg-main, #060b14);
          color: var(--text-primary, #f2efe9);
          position: relative;
        }
        .offline-lang {
          position: absolute;
          top: max(20px, env(safe-area-inset-top, 20px));
          inset-inline-end: 20px;
        }
        .offline-card {
          max-width: 480px;
          width: 100%;
          padding: 36px 28px;
          border-radius: 18px;
          background: var(--bg-card, #0f141e);
          border: 1px solid var(--border-strong, rgba(212, 175, 55, 0.24));
          box-shadow: var(--glass-shadow, 0 18px 40px rgba(0, 0, 0, 0.45));
        }
        .offline-icon-wrap {
          width: 64px;
          height: 64px;
          margin: 0 auto 20px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(212, 175, 55, 0.12);
          border: 1px solid rgba(212, 175, 55, 0.25);
          color: var(--gold-main, #d4af37);
          font-size: 1.75rem;
        }
        .offline-title {
          font-family: var(--font-playfair, 'Playfair Display', serif);
          color: var(--gold-main, #d4af37);
          margin: 0 0 10px 0;
          font-size: clamp(1.75rem, 5vw, 2.3rem);
          line-height: 1.2;
        }
        .offline-subtitle {
          color: var(--text-primary, #f2efe9);
          font-size: 0.85rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 12px;
          font-weight: 700;
        }
        .offline-desc {
          color: var(--text-secondary, #a1a8b5);
          line-height: 1.65;
          margin: 0 auto 28px;
          font-size: 0.94rem;
        }
        .offline-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .offline-btn-retry {
          min-height: 44px;
          background: var(--gold-main, #d4af37);
          border: 1px solid var(--gold-main, #d4af37);
          color: #060b14;
          padding: 11px 24px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .offline-btn-retry:hover { opacity: 0.92; transform: translateY(-1px); }
        .offline-btn-home {
          min-height: 44px;
          background: transparent;
          border: 1px solid var(--border-strong, rgba(212, 175, 55, 0.4));
          color: var(--gold-main, #d4af37);
          text-decoration: none;
          padding: 11px 24px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background-color 0.2s ease;
        }
        .offline-btn-home:hover { background: rgba(212, 175, 55, 0.1); }
        .offline-btn-retry:focus-visible,
        .offline-btn-home:focus-visible {
          outline: 2px solid var(--focus-ring, #d4af37);
          outline-offset: 2px;
        }

        :root[data-theme="light"] .offline-page { background: #f6f5f1; color: #18181b; }
        :root[data-theme="light"] .offline-card { background: #ffffff; border-color: rgba(24, 24, 27, 0.14); box-shadow: 0 16px 36px rgba(24, 24, 27, 0.08); }
        :root[data-theme="light"] .offline-icon-wrap { background: rgba(124, 82, 10, 0.1); border-color: rgba(124, 82, 10, 0.24); color: #7c520a; }
        :root[data-theme="light"] .offline-title { color: #7c520a; }
        :root[data-theme="light"] .offline-subtitle { color: #18181b; }
        :root[data-theme="light"] .offline-desc { color: #52525b; }
        :root[data-theme="light"] .offline-btn-retry { background: #7c520a; border-color: #7c520a; color: #ffffff; }
        :root[data-theme="light"] .offline-btn-home { border-color: rgba(124, 82, 10, 0.45); color: #7c520a; }
        :root[data-theme="light"] .offline-btn-home:hover { background: rgba(124, 82, 10, 0.08); }

        @media (max-width: 480px) {
          .offline-card { padding: 28px 20px; }
          .offline-actions { flex-direction: column; }
          .offline-btn-retry, .offline-btn-home { width: 100%; }
        }
      `}</style>

      <div className="offline-lang">
        <LanguageSwitcher variant="pill" />
      </div>

      <div className="offline-card">
        <div className="offline-icon-wrap" aria-hidden="true">
          <i className="fa-solid fa-wifi"></i>
        </div>
        <h1 className="offline-title">{t.offline.title}</h1>
        <div className="offline-subtitle">{t.offline.subtitle}</div>
        <p className="offline-desc">{t.offline.desc}</p>

        <div className="offline-actions">
          <button type="button" className="offline-btn-retry" onClick={() => window.location.reload()}>
            <i className="fa-solid fa-rotate-right" aria-hidden="true"></i> {t.offline.try_again}
          </button>
          <Link href="/beranda" className="offline-btn-home">
            {t.offline.back_home}
          </Link>
        </div>
      </div>
    </main>
  );
}

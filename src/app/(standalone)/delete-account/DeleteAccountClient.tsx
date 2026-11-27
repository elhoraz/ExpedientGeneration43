"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

export default function DeleteAccountClient() {
  const { t, isRTL: isRtl, dir } = useLanguage();

  return (
    <main className="delacc-page" dir={dir}>
      <style>{`
        .delacc-page {
          min-height: 100dvh;
          background: var(--bg-main, #060b14);
          color: var(--text-primary, #f2efe9);
          padding: 2rem 1rem;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: ${isRtl ? "var(--font-amiri, serif), var(--font-sans, sans-serif)" : "var(--font-sans, 'Inter', sans-serif)"};
        }
        .delacc-card {
          max-width: 680px;
          width: 100%;
          background: var(--bg-card, #0f141e);
          border: 1px solid var(--border-strong, rgba(212, 175, 55, 0.25));
          border-radius: 16px;
          padding: 2.25rem 2rem;
          box-shadow: var(--glass-shadow, 0 20px 44px rgba(0, 0, 0, 0.45));
        }
        .delacc-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .delacc-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          padding: 0 4px;
          color: var(--text-secondary, #a1a8b5);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.2s ease;
        }
        .delacc-back:hover { color: var(--text-primary, #f2efe9); }
        .delacc-back:focus-visible,
        .delacc-btn-primary:focus-visible,
        .delacc-btn-secondary:focus-visible {
          outline: 2px solid var(--focus-ring, #d4af37);
          outline-offset: 2px;
        }
        .delacc-header { text-align: center; margin-bottom: 2rem; }
        .delacc-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 54px;
          height: 54px;
          border-radius: 14px;
          background: rgba(239, 68, 68, 0.14);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
          font-size: 22px;
          margin-bottom: 1rem;
        }
        .delacc-title {
          font-family: ${isRtl ? "inherit" : "var(--font-playfair, serif)"};
          font-size: clamp(1.5rem, 3.5vw, 1.85rem);
          color: var(--gold-main, #d4af37);
          margin: 0 0 0.5rem 0;
        }
        .delacc-subtitle {
          color: var(--text-secondary, #a1a8b5);
          font-size: 0.94rem;
          margin: 0 0 0.85rem 0;
          line-height: 1.5;
        }
        .delacc-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 8px;
          background: rgba(212, 175, 55, 0.12);
          border: 1px solid rgba(212, 175, 55, 0.3);
          color: var(--gold-main, #d4af37);
          font-size: 0.78rem;
          font-weight: 600;
        }
        .delacc-alert {
          margin-bottom: 1.75rem;
          padding: 1rem 1.25rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.28);
          border-radius: 12px;
        }
        .delacc-alert h3 {
          font-size: 0.95rem;
          color: #f87171;
          margin: 0 0 0.4rem 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .delacc-alert p { font-size: 0.88rem; color: var(--text-primary, #f2efe9); line-height: 1.55; margin: 0; }
        .delacc-section { margin-bottom: 1.75rem; }
        .delacc-section h2 {
          font-size: 1.08rem;
          color: var(--gold-main, #d4af37);
          margin: 0 0 0.55rem 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .delacc-section p,
        .delacc-section ol,
        .delacc-section ul {
          font-size: 0.9rem;
          color: var(--text-secondary, #a1a8b5);
          line-height: 1.65;
          margin: 0;
        }
        .delacc-section ol,
        .delacc-section ul {
          margin-top: 0.5rem;
          padding-inline-start: 1.35rem;
        }
        .delacc-section li { margin-bottom: 0.3rem; }
        .delacc-retain {
          margin-bottom: 2rem;
          padding: 1rem 1.25rem;
          background: rgba(212, 175, 55, 0.08);
          border: 1px solid rgba(212, 175, 55, 0.28);
          border-radius: 10px;
        }
        .delacc-retain h3 {
          font-size: 0.95rem;
          color: var(--gold-main, #d4af37);
          margin: 0 0 0.45rem 0;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .delacc-retain p { font-size: 0.87rem; color: var(--text-primary, #f2efe9); line-height: 1.55; margin: 0; }
        .delacc-footer {
          text-align: center;
          border-top: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
          padding-top: 1.5rem;
        }
        .delacc-footer p { font-size: 0.9rem; color: var(--text-secondary, #a1a8b5); margin: 0 0 1rem 0; }
        .delacc-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .delacc-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          background: var(--gold-main, #d4af37);
          color: #060b14;
          font-weight: 700;
          font-size: 0.9rem;
          text-decoration: none;
          cursor: pointer;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .delacc-btn-primary:hover { opacity: 0.92; transform: translateY(-1px); }
        .delacc-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
          padding: 0.75rem 1.25rem;
          border-radius: 10px;
          background: var(--surface-raised, #171e2c);
          color: var(--text-primary, #f2efe9);
          font-size: 0.9rem;
          font-weight: 600;
          border: 1px solid var(--border-strong, rgba(255, 255, 255, 0.16));
          text-decoration: none;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }
        .delacc-btn-secondary:hover { border-color: var(--gold-main, #d4af37); }

        :root[data-theme="light"] .delacc-page { background: #f6f5f1; color: #18181b; }
        :root[data-theme="light"] .delacc-card { background: #ffffff; border-color: rgba(24, 24, 27, 0.14); box-shadow: 0 16px 40px rgba(24, 24, 27, 0.08); }
        :root[data-theme="light"] .delacc-icon { background: #fef2f2; border-color: rgba(153, 27, 27, 0.25); color: #991b1b; }
        :root[data-theme="light"] .delacc-title,
        :root[data-theme="light"] .delacc-section h2 { color: #7c520a; }
        :root[data-theme="light"] .delacc-badge { background: rgba(124, 82, 10, 0.1); border-color: rgba(124, 82, 10, 0.28); color: #7c520a; }
        :root[data-theme="light"] .delacc-alert { background: #fef2f2; border-color: rgba(153, 27, 27, 0.24); }
        :root[data-theme="light"] .delacc-alert h3 { color: #991b1b; }
        :root[data-theme="light"] .delacc-alert p { color: #18181b; }
        :root[data-theme="light"] .delacc-retain { background: #fffbeb; border-color: rgba(146, 64, 14, 0.26); }
        :root[data-theme="light"] .delacc-retain h3 { color: #92400e; }
        :root[data-theme="light"] .delacc-retain p { color: #18181b; }
        :root[data-theme="light"] .delacc-btn-primary { background: #7c520a; color: #ffffff; }
        :root[data-theme="light"] .delacc-btn-secondary { background: #ebe9e1; color: #18181b; border-color: rgba(24, 24, 27, 0.16); }

        @media (max-width: 600px) {
          .delacc-card { padding: 1.5rem 1.25rem; }
          .delacc-actions { flex-direction: column; }
          .delacc-btn-primary, .delacc-btn-secondary { width: 100%; }
        }
      `}</style>

      <div className="delacc-card">
        <div className="delacc-topbar">
          <Link href="/" className="delacc-back">
            <i className={`fa-solid ${isRtl ? "fa-arrow-right" : "fa-arrow-left"}`} aria-hidden="true" />
            <span>{t.delete_account.back_home}</span>
          </Link>
          <LanguageSwitcher variant="pill" />
        </div>

        <div className="delacc-header">
          <div className="delacc-icon" aria-hidden="true">
            <i className="fa-solid fa-user-xmark" />
          </div>
          <h1 className="delacc-title">{t.delete_account.title}</h1>
          <p className="delacc-subtitle">{t.delete_account.subtitle}</p>
          <div className="delacc-badge">
            <i className="fa-solid fa-shield-check" aria-hidden="true" />
            <span>{t.delete_account.compliance_badge}</span>
          </div>
        </div>

        <div className="delacc-alert">
          <h3>
            <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {t.delete_account.notice_title}
          </h3>
          <p>{t.delete_account.notice_desc}</p>
        </div>

        <section className="delacc-section">
          <h2>
            <i className="fa-solid fa-mobile-screen-button" aria-hidden="true" /> {t.delete_account.how_to_delete_title}
          </h2>
          <p>{t.delete_account.step_app}</p>
          <ol>
            {t.delete_account.delete_steps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="delacc-section">
          <h2>
            <i className="fa-solid fa-trash-can" aria-hidden="true" /> {t.delete_account.policy_scope_title}
          </h2>
          <p>{t.delete_account.policy_scope_desc}</p>
          <ul>
            {t.delete_account.data_deleted_list.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </section>

        <div className="delacc-retain">
          <h3>
            <i className="fa-solid fa-shield-halved" aria-hidden="true" /> {t.delete_account.data_retained_title}
          </h3>
          <p>{t.delete_account.data_retained_desc}</p>
        </div>

        <div className="delacc-footer">
          <p>{t.delete_account.step_manual_desc}</p>
          <div className="delacc-actions">
            <Link href="/profil" className="delacc-btn-primary">
              <i className="fa-solid fa-arrow-right-to-bracket" aria-hidden="true" /> {t.delete_account.btn_confirm_delete}
            </Link>
            <a
              href="mailto:admin@expedientgeneration.com?subject=Permintaan%20Penghapusan%20Akun%20Expedient%2043"
              className="delacc-btn-secondary"
            >
              <i className="fa-solid fa-envelope" aria-hidden="true" /> {t.delete_account.contact_admin_btn}
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

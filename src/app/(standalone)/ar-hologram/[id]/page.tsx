"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAvatarUrl } from "@/lib/avatar";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type PreviewProfile = {
  id: string;
  nama_lengkap?: string | null;
  nama_panggilan?: string | null;
  kota_domisili?: string | null;
  motivasi_hidup?: string | null;
  foto_profil?: string | null;
};

export default function AlumniCardPreviewPage() {
  const params = useParams();
  const id = String(params?.id || "demo");
  const isDemo = id === "demo";
  const { locale, dir, isRTL } = useLanguage();

  const [profile, setProfile] = useState<PreviewProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "not_found">(isDemo ? "ready" : "loading");
  const [flipped, setFlipped] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (!reduced) {
      setAutoRotate(true);
    }
  }, []);

  useEffect(() => {
    if (isDemo) return;
    let active = true;
    const supabase = createClient();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const query = supabase
      .from("profiles")
      .select("id, nama_lengkap, nama_panggilan, kota_domisili, motivasi_hidup, foto_profil");

    (isUuid ? query.eq("id", id) : query.eq("public_token", id))
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        if (data) {
          setProfile(data);
          setStatus("ready");
        } else {
          setStatus("not_found");
        }
      });

    return () => {
      active = false;
    };
  }, [id, isDemo]);

  const cardName = isDemo
    ? locale === "ar"
      ? "بطاقة خريج نموذجية"
      : locale === "en"
      ? "Sample Alumni Card"
      : "Contoh Kartu Alumni"
    : profile?.nama_lengkap || profile?.nama_panggilan || "Alumni Arrisalah";

  const cardLocation = isDemo
    ? "Ponorogo · Angkatan 43"
    : profile?.kota_domisili || (locale === "ar" ? "معهد الرسالة الحديث" : "Pondok Modern Arrisalah");

  return (
    <main className="card3d-page" dir={dir}>
      <style>{`
        .card3d-page {
          min-height: 100dvh;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 76px 16px 32px;
          background: var(--bg-main, #060b14);
          color: var(--text-primary, #f2efe9);
          position: relative;
        }
        .card3d-back {
          position: fixed;
          top: max(18px, env(safe-area-inset-top, 18px));
          left: 20px;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 10px;
          background: var(--bg-card, #0f141e);
          border: 1px solid var(--border-strong, rgba(212, 175, 55, 0.35));
          color: var(--gold-main, #d4af37);
          font-size: 0.88rem;
          font-weight: 600;
          text-decoration: none;
          z-index: 20;
        }
        .card3d-scene {
          perspective: 1100px;
          width: min(310px, 86vw);
          height: 410px;
          margin-bottom: 24px;
        }
        .card3d-inner {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .card3d-inner.is-spinning {
          animation: cardSlowTurn 14s linear infinite;
        }
        .card3d-inner.is-flipped {
          animation: none;
          transform: rotateY(180deg);
        }
        @keyframes cardSlowTurn {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }
        .card3d-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          border-radius: 20px;
          background: var(--bg-card, #0f141e);
          border: 1px solid var(--border-strong, rgba(212, 175, 55, 0.4));
          box-shadow: var(--glass-shadow, 0 22px 44px rgba(0, 0, 0, 0.45));
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 28px 22px;
        }
        .card3d-backface {
          transform: rotateY(180deg);
        }
        .card3d-avatar {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          border: 2px solid var(--gold-main, #d4af37);
          background: var(--surface-raised, #171e2c);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
          overflow: hidden;
        }
        .card3d-badge {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--gold-main, #d4af37);
          margin-bottom: 6px;
        }
        .card3d-name {
          font-family: var(--font-playfair, 'Playfair Display', serif);
          font-size: 1.45rem;
          color: var(--text-primary, #f2efe9);
          margin: 0 0 8px 0;
          line-height: 1.25;
        }
        .card3d-meta {
          font-size: 0.86rem;
          color: var(--text-secondary, #a1a8b5);
          margin: 0;
        }
        .card3d-motto {
          font-style: italic;
          color: var(--text-secondary, #a1a8b5);
          font-size: 0.92rem;
          line-height: 1.6;
          margin: 14px 0 0 0;
        }
        .card3d-controls {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
        }
        .card3d-btn {
          min-height: 44px;
          padding: 10px 18px;
          border-radius: 10px;
          border: 1px solid var(--border-strong, rgba(212, 175, 55, 0.3));
          background: var(--bg-card, #0f141e);
          color: var(--text-primary, #f2efe9);
          font-size: 0.86rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }
        .card3d-btn-primary {
          background: var(--gold-main, #d4af37);
          border-color: var(--gold-main, #d4af37);
          color: #060b14;
          font-weight: 700;
        }
        .card3d-back:focus-visible,
        .card3d-btn:focus-visible {
          outline: 2px solid var(--focus-ring, #d4af37);
          outline-offset: 2px;
        }
        .card3d-state-box {
          max-width: 380px;
          text-align: center;
          padding: 32px 24px;
          border-radius: 16px;
          background: var(--bg-card, #0f141e);
          border: 1px solid var(--border-strong, rgba(212, 175, 55, 0.28));
        }

        :root[data-theme="light"] .card3d-page { background: #f6f5f1; color: #18181b; }
        :root[data-theme="light"] .card3d-back { background: #ffffff; border-color: rgba(124, 82, 10, 0.3); color: #7c520a; }
        :root[data-theme="light"] .card3d-face,
        :root[data-theme="light"] .card3d-state-box { background: #ffffff; border-color: rgba(24, 24, 27, 0.14); box-shadow: 0 18px 40px rgba(24, 24, 27, 0.08); }
        :root[data-theme="light"] .card3d-avatar { border-color: #7c520a; background: #ebe9e1; }
        :root[data-theme="light"] .card3d-badge { color: #7c520a; }
        :root[data-theme="light"] .card3d-name { color: #18181b; }
        :root[data-theme="light"] .card3d-meta,
        :root[data-theme="light"] .card3d-motto { color: #52525b; }
        :root[data-theme="light"] .card3d-btn { background: #ffffff; border-color: rgba(24, 24, 27, 0.16); color: #18181b; }
        :root[data-theme="light"] .card3d-btn-primary { background: #7c520a; border-color: #7c520a; color: #ffffff; }

        @media (prefers-reduced-motion: reduce) {
          .card3d-inner.is-spinning { animation: none; }
          .card3d-inner { transition: none; }
        }
      `}</style>

      <Link href="/direktori" className="card3d-back">
        <i className={`fa-solid ${isRTL ? "fa-arrow-right" : "fa-arrow-left"}`} aria-hidden="true"></i>
        <span>{locale === "ar" ? "العودة للدليل" : locale === "en" ? "Back to Directory" : "Kembali ke Direktori"}</span>
      </Link>

      {status === "loading" ? (
        <div className="card3d-state-box" role="status">
          <i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true" style={{ fontSize: "1.5rem", marginBottom: "12px" }}></i>
          <p className="card3d-meta">{locale === "ar" ? "جارٍ تحميل البطاقة..." : locale === "en" ? "Loading alumni card..." : "Memuat kartu alumni..."}</p>
        </div>
      ) : status === "not_found" ? (
        <div className="card3d-state-box">
          <h1 className="card3d-name">{locale === "ar" ? "البيانات غير موجودة" : locale === "en" ? "Profile Not Found" : "Data Tidak Ditemukan"}</h1>
          <p className="card3d-meta" style={{ marginBottom: "18px" }}>
            {locale === "ar" ? "تعذر العثور على بطاقة هذا الخريج." : locale === "en" ? "Could not locate an alumni record for this code." : "Kartu alumni untuk kode ini tidak ditemukan."}
          </p>
          <Link href="/scanner" className="card3d-btn card3d-btn-primary">
            <i className="fa-solid fa-qrcode" aria-hidden="true"></i>
            <span>{locale === "ar" ? "الماسح الضوئي" : locale === "en" ? "Open Scanner" : "Pindai Ulang"}</span>
          </Link>
        </div>
      ) : (
        <>
          <div className="card3d-scene">
            <div className={`card3d-inner ${flipped ? "is-flipped" : autoRotate ? "is-spinning" : ""}`}>
              <div className="card3d-face">
                <div className="card3d-avatar">
                  {profile ? (
                    <img
                      src={getAvatarUrl(profile.foto_profil, profile.nama_panggilan || profile.nama_lengkap || undefined)}
                      alt={cardName}
                      width={96}
                      height={96}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <Image src="/images/logo-utuh.webp" alt="Expedient 43" width={68} height={68} />
                  )}
                </div>
                <div className="card3d-badge">
                  {isDemo
                    ? locale === "ar"
                      ? "معاينة نموذجية"
                      : locale === "en"
                      ? "Sample Preview"
                      : "Pratinjau Contoh"
                    : "Expedient Generation 43"}
                </div>
                <h1 className="card3d-name">{cardName}</h1>
                <p className="card3d-meta">{cardLocation}</p>
              </div>

              <div className="card3d-face card3d-backface">
                <Image src="/images/logo-utuh.webp" alt="Logo Arrisalah 43" width={64} height={64} style={{ marginBottom: "14px" }} />
                <div className="card3d-badge">Pondok Modern Arrisalah</div>
                <p className="card3d-motto">
                  “{profile?.motivasi_hidup || (locale === "ar" ? "الأخوة الإسلامية أساس مسيرتنا." : locale === "en" ? "Rooted in Panca Jiwa, united in brotherhood." : "Tumbuh dalam nilai Panca Jiwa, menjaga ukhuwah sepanjang masa.")}”
                </p>
              </div>
            </div>
          </div>

          <div className="card3d-controls">
            <button type="button" className="card3d-btn" onClick={() => setFlipped((prev) => !prev)} aria-pressed={flipped}>
              <i className="fa-solid fa-repeat" aria-hidden="true"></i>
              <span>{flipped ? (locale === "ar" ? "الوجه الأمامي" : locale === "en" ? "Show Front" : "Sisi Depan") : (locale === "ar" ? "قلب البطاقة" : locale === "en" ? "Flip Card" : "Balik Kartu")}</span>
            </button>

            {!flipped && (
              <button type="button" className="card3d-btn" onClick={() => setAutoRotate((prev) => !prev)} aria-pressed={autoRotate}>
                <i className={`fa-solid ${autoRotate ? "fa-pause" : "fa-play"}`} aria-hidden="true"></i>
                <span>{autoRotate ? (locale === "ar" ? "إيقاف الدوران" : locale === "en" ? "Pause Spin" : "Hentikan Putar") : (locale === "ar" ? "تدوير تلقائي" : locale === "en" ? "Auto Rotate" : "Putar Otomatis")}</span>
              </button>
            )}

            {profile && (
              <Link href={`/dossier/${profile.id}`} className="card3d-btn card3d-btn-primary">
                <i className="fa-solid fa-user" aria-hidden="true"></i>
                <span>{locale === "ar" ? "عرض الملف الكامل" : locale === "en" ? "Open Full Profile" : "Buka Profil Lengkap"}</span>
              </Link>
            )}
          </div>
        </>
      )}
    </main>
  );
}

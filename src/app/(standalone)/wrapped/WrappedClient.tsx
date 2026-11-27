"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function WrappedClient({ profile, stats }: { profile: any, stats: { chatCount: number, prestisePoints: number } }) {
  const { locale, dir, isRTL } = useLanguage();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 4;
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  const animateSlide = useCallback((index: number) => {
    const slide = slideRefs.current[index];
    if (!slide) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const items = slide.querySelectorAll(".anim-text");
    if (reduced) {
      gsap.set(items, { y: 0, opacity: 1 });
      return;
    }
    gsap.fromTo(
      items,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.65, stagger: 0.12, ease: "power3.out" }
    );
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => {
      if (prev >= totalSlides - 1) return prev;
      const next = prev + 1;
      animateSlide(next);
      return next;
    });
  }, [animateSlide]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => {
      if (prev <= 0) return prev;
      const next = prev - 1;
      animateSlide(next);
      return next;
    });
  }, [animateSlide]);

  useEffect(() => {
    document.body.classList.add("page-wrapped");
    animateSlide(0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      else if (e.key === "ArrowLeft") prevSlide();
      else if (e.key === "Escape") router.push("/fitur");
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("page-wrapped");
    };
  }, [animateSlide, nextSlide, prevSlide, router]);

  const numberLocale = locale === "ar" ? "ar-SA" : locale === "en" ? "en-US" : "id-ID";
  const formattedPoints = new Intl.NumberFormat(numberLocale).format(stats.prestisePoints);
  const formattedChats = new Intl.NumberFormat(numberLocale).format(stats.chatCount);

  return (
    <main className="wrapped-wrapper" dir={dir}>
      <style>{`
        body.page-wrapped { margin: 0; overflow: hidden; }
        .wrapped-wrapper {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100dvh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: var(--bg-main, #060b14);
          color: var(--text-primary, #f2efe9);
          padding: 20px 16px;
        }
        .wrapped-topbar {
          position: fixed;
          top: max(16px, env(safe-area-inset-top, 16px));
          left: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          z-index: 100;
        }
        .wrapped-progress {
          flex: 1;
          display: flex;
          gap: 6px;
        }
        .wrapped-seg-btn {
          flex: 1;
          height: 28px;
          background: transparent;
          border: none;
          padding: 12px 0;
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .wrapped-seg-track {
          width: 100%;
          height: 4px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.16);
          overflow: hidden;
        }
        .wrapped-seg-fill {
          height: 100%;
          background: var(--gold-main, #d4af37);
          transition: width 0.25s ease;
        }
        .wrapped-close {
          min-height: 44px;
          padding: 8px 16px;
          border-radius: 10px;
          background: var(--bg-card, #0f141e);
          border: 1px solid var(--border-strong, rgba(255, 255, 255, 0.16));
          color: var(--text-primary, #f2efe9);
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          flex-shrink: 0;
        }
        .wrapped-stage {
          width: min(560px, 100%);
          min-height: 360px;
          position: relative;
        }
        .wrapped-slide {
          width: 100%;
          min-height: 360px;
          padding: 40px 28px;
          border-radius: 20px;
          background: var(--bg-card, #0f141e);
          border: 1px solid var(--border-strong, rgba(212, 175, 55, 0.28));
          box-shadow: var(--glass-shadow, 0 20px 44px rgba(0, 0, 0, 0.45));
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }
        .wrapped-slide.active {
          display: flex;
        }
        .wrapped-title {
          font-family: ${isRTL ? "inherit" : "var(--font-playfair, 'Playfair Display', serif)"};
          font-size: clamp(2rem, 6vw, 3.25rem);
          color: var(--gold-main, #d4af37);
          margin: 0 0 14px 0;
          line-height: 1.15;
        }
        .wrapped-subtitle {
          font-size: clamp(0.95rem, 2.8vw, 1.12rem);
          color: var(--text-secondary, #a1a8b5);
          line-height: 1.6;
          margin: 0;
          max-width: 38ch;
        }
        .wrapped-stat {
          font-family: var(--font-playfair, 'Playfair Display', serif);
          font-size: clamp(2.8rem, 11vw, 4.75rem);
          font-weight: 800;
          color: var(--text-primary, #f2efe9);
          margin: 18px 0;
          line-height: 1;
        }
        .wrapped-stat.is-emerald {
          color: #4cc38a;
        }
        .wrapped-cta {
          margin-top: 26px;
          min-height: 44px;
          padding: 12px 28px;
          background: var(--gold-main, #d4af37);
          color: #060b14;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.92rem;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .wrapped-nav {
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .wrapped-nav-btn {
          min-width: 44px;
          min-height: 44px;
          padding: 10px 18px;
          border-radius: 10px;
          border: 1px solid var(--border-strong, rgba(255, 255, 255, 0.16));
          background: var(--bg-card, #0f141e);
          color: var(--text-primary, #f2efe9);
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .wrapped-nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .wrapped-nav-count {
          color: var(--text-secondary, #a1a8b5);
          font-size: 0.85rem;
          min-width: 52px;
          text-align: center;
        }
        .wrapped-close:focus-visible,
        .wrapped-seg-btn:focus-visible,
        .wrapped-nav-btn:focus-visible,
        .wrapped-cta:focus-visible {
          outline: 2px solid var(--focus-ring, #d4af37);
          outline-offset: 2px;
        }

        :root[data-theme="light"] .wrapped-wrapper { background: #f6f5f1; color: #18181b; }
        :root[data-theme="light"] .wrapped-seg-track { background: rgba(24, 24, 27, 0.14); }
        :root[data-theme="light"] .wrapped-seg-fill { background: #7c520a; }
        :root[data-theme="light"] .wrapped-close,
        :root[data-theme="light"] .wrapped-nav-btn { background: #ffffff; border-color: rgba(24, 24, 27, 0.16); color: #18181b; }
        :root[data-theme="light"] .wrapped-slide { background: #ffffff; border-color: rgba(24, 24, 27, 0.14); box-shadow: 0 18px 40px rgba(24, 24, 27, 0.08); }
        :root[data-theme="light"] .wrapped-title { color: #7c520a; }
        :root[data-theme="light"] .wrapped-subtitle,
        :root[data-theme="light"] .wrapped-nav-count { color: #52525b; }
        :root[data-theme="light"] .wrapped-stat { color: #18181b; }
        :root[data-theme="light"] .wrapped-stat.is-emerald { color: #065f46; }
        :root[data-theme="light"] .wrapped-cta { background: #7c520a; color: #ffffff; }

        @media (max-width: 480px) {
          .wrapped-slide { padding: 32px 20px; min-height: 310px; }
        }
      `}</style>

      <div className="wrapped-topbar">
        <div className="wrapped-progress" role="tablist" aria-label={locale === "ar" ? "شرائح الملخص" : locale === "en" ? "Summary slides" : "Slide ringkasan"}>
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              type="button"
              className="wrapped-seg-btn"
              onClick={() => {
                setCurrentSlide(i);
                animateSlide(i);
              }}
              aria-label={`Slide ${i + 1}`}
              aria-selected={currentSlide === i}
            >
              <span className="wrapped-seg-track">
                <span className="wrapped-seg-fill" style={{ display: "block", width: i <= currentSlide ? "100%" : "0%" }}></span>
              </span>
            </button>
          ))}
        </div>

        <Link href="/fitur" className="wrapped-close">
          <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          <span>{locale === "ar" ? "إغلاق" : locale === "en" ? "Close" : "Tutup"}</span>
        </Link>
      </div>

      <div className="wrapped-stage">
        <div ref={(el) => { slideRefs.current[0] = el; }} className={`wrapped-slide ${currentSlide === 0 ? "active" : ""}`}>
          <h1 className="wrapped-title anim-text">
            {locale === "ar" ? "أهلاً،" : locale === "en" ? "Hello," : "Halo,"}
            <br />
            {profile?.nama_panggilan || (locale === "ar" ? "رفيق الدفعة" : locale === "en" ? "Friend" : "Kawan")}.
          </h1>
          <p className="wrapped-subtitle anim-text">
            {locale === "ar"
              ? "إليك لمحة عن حضورك وتفاعلك مع إخوانك في منصة الدفعة ٤٣."
              : locale === "en"
              ? "Here is a brief look at your activity with fellow Cohort 43 alumni."
              : "Ini ringkasan singkat aktivitas dan silaturahmi Anda bersama kawan Angkatan 43."}
          </p>
        </div>

        <div ref={(el) => { slideRefs.current[1] = el; }} className={`wrapped-slide ${currentSlide === 1 ? "active" : ""}`}>
          <p className="wrapped-subtitle anim-text">
            {locale === "ar" ? "رصيدك الحالي من نقاط التفاعل:" : locale === "en" ? "Your accumulated activity points:" : "Total poin keaktifan yang Anda kumpulkan:"}
          </p>
          <div className="wrapped-stat anim-text">{formattedPoints}</div>
          <p className="wrapped-subtitle anim-text">
            {locale === "ar" ? "نقطة من مشاركتك في البوابة." : locale === "en" ? "points from your participation in the portal." : "Poin Keaktifan dari berbagai partisipasi di portal."}
          </p>
        </div>

        <div ref={(el) => { slideRefs.current[2] = el; }} className={`wrapped-slide ${currentSlide === 2 ? "active" : ""}`}>
          <p className="wrapped-subtitle anim-text">
            {locale === "ar" ? "مساهمتك في محادثات الخريجين:" : locale === "en" ? "Messages you shared with fellow alumni:" : "Jejak sapaan Anda di ruang obrolan:"}
          </p>
          <div className="wrapped-stat is-emerald anim-text">{formattedChats}</div>
          <p className="wrapped-subtitle anim-text">
            {locale === "ar" ? "رسالة أرسلتها للتواصل مع زملائك." : locale === "en" ? "messages sent across cohort chats." : "Pesan yang telah Anda kirim untuk menyambung silaturahmi."}
          </p>
        </div>

        <div ref={(el) => { slideRefs.current[3] = el; }} className={`wrapped-slide ${currentSlide === 3 ? "active" : ""}`}>
          <h2 className="wrapped-title anim-text">
            {locale === "ar" ? "جزاكم الله خيراً." : locale === "en" ? "Thank You." : "Terima Kasih."}
          </h2>
          <p className="wrapped-subtitle anim-text">
            {locale === "ar"
              ? "نواصل الحفاظ على أواصر الأخوة في دفعة ٤٣ بمشيئة الله."
              : locale === "en"
              ? "Let us keep building brotherhood and shared memories in Expedient Generation 43."
              : "Mari terus jaga silaturahmi dan kenangan bersama di Expedient Generation 43."}
          </p>
          <Link href="/fitur" className="anim-text wrapped-cta">
            <i className={`fa-solid ${isRTL ? "fa-arrow-right" : "fa-arrow-left"}`} aria-hidden="true"></i>
            <span>{locale === "ar" ? "العودة إلى الميزات" : locale === "en" ? "Back to Features" : "Kembali ke Fitur"}</span>
          </Link>
        </div>
      </div>

      <div className="wrapped-nav">
        <button type="button" className="wrapped-nav-btn" onClick={prevSlide} disabled={currentSlide === 0}>
          <i className={`fa-solid ${isRTL ? "fa-chevron-right" : "fa-chevron-left"}`} aria-hidden="true"></i>
          <span>{locale === "ar" ? "السابق" : locale === "en" ? "Prev" : "Sebelumnya"}</span>
        </button>
        <span className="wrapped-nav-count">
          {currentSlide + 1} / {totalSlides}
        </span>
        <button type="button" className="wrapped-nav-btn" onClick={nextSlide} disabled={currentSlide === totalSlides - 1}>
          <span>{locale === "ar" ? "التالي" : locale === "en" ? "Next" : "Berikutnya"}</span>
          <i className={`fa-solid ${isRTL ? "fa-chevron-left" : "fa-chevron-right"}`} aria-hidden="true"></i>
        </button>
      </div>
    </main>
  );
}

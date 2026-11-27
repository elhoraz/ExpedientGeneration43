"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useDialogEscape } from "@/hooks/useDialogEscape";
import "./onboarding.css";

export default function WelcomeModal({
  userName,
  onStartTour,
  onSkip,
}: {
  userName?: string;
  onStartTour: () => void;
  onSkip: () => void;
}) {
  const { locale, isRTL } = useLanguage();
  const displayName = userName || (locale === "ar" ? "أيها الرفيق" : locale === "en" ? "Friend" : "Kawan");

  useDialogEscape(true, onSkip);

  return (
    <div
      className="welcome-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      onClick={onSkip}
    >
      <div className="welcome-modal" dir={isRTL ? "rtl" : "ltr"} onClick={(e) => e.stopPropagation()}>
        <div className="welcome-crest" aria-hidden="true">
          <i className="fa-solid fa-star-and-crescent"></i>
        </div>

        <h2 id="welcome-modal-title" className="welcome-title">
          {locale === "ar"
            ? `أهلاً وسهلاً، ${displayName}`
            : locale === "en"
              ? `Welcome, ${displayName}`
              : `Ahlan wa Sahlan, ${displayName}`}
        </h2>

        <p className="welcome-subtitle">
          {locale === "ar" ? (
            <>
              مرحباً بك في البوابة الرسمية لخريجي دفعة{" "}
              <strong>Expedient Generation</strong> · معهد الرسالة الحديث
              الدفعة ٤٣. صُممت هذه المنصة لتوطيد أواصر الأخوة وحفظ الذكريات المشتركة.
            </>
          ) : locale === "en" ? (
            <>
              Official alumni portal of{" "}
              <strong>Expedient Generation</strong> · Pondok Modern Arrisalah
              Cohort 43, built for cohort connection and shared memory archives.
            </>
          ) : (
            <>
              Portal resmi alumni angkatan{" "}
              <strong>Expedient Generation</strong> · Pondok Modern Arrisalah
              ke-43 untuk menjalin silaturahmi dan menyimpan dokumentasi bersama.
            </>
          )}
        </p>

        <div className="welcome-features">
          <div className="welcome-feature-item">
            <div className="welcome-feature-icon" aria-hidden="true">
              <i className="fa-solid fa-landmark"></i>
            </div>
            <div className="welcome-feature-text">
              <strong>
                {locale === "ar" ? "المتحف والذكريات" : locale === "en" ? "Museum & Memories" : "Museum & Kenangan"}
              </strong>
              {locale === "ar"
                ? "أرشيف الصور والفيديو والجدول التاريخي وشعار الدفعة ثلاثي الأبعاد"
                : locale === "en"
                  ? "Archive of photos, videos, cohort timeline, and 3D emblem"
                  : "Arsip foto, video, linimasa sejarah, dan emblem 3D angkatan"}
            </div>
          </div>
          <div className="welcome-feature-item">
            <div className="welcome-feature-icon" aria-hidden="true">
              <i className="fa-solid fa-users"></i>
            </div>
            <div className="welcome-feature-text">
              <strong>
                {locale === "ar" ? "العثور على الزملاء" : locale === "en" ? "Find Cohort Friends" : "Temukan Kawan Lama"}
              </strong>
              {locale === "ar"
                ? "البحث في سجل الزملاء وخريطة الانتشار الجغرافي والتواصل المباشر"
                : locale === "en"
                  ? "Search the alumni directory, regional map, and direct chat"
                  : "Cari kontak alumni, lihat peta persebaran, dan pesan langsung"}
            </div>
          </div>
          <div className="welcome-feature-item">
            <div className="welcome-feature-icon" aria-hidden="true">
              <i className="fa-solid fa-handshake"></i>
            </div>
            <div className="welcome-feature-text">
              <strong>
                {locale === "ar" ? "التعاون والتآزر" : locale === "en" ? "Synergy & Mutual Aid" : "Sinergi & Gotong Royong"}
              </strong>
              {locale === "ar"
                ? "شبكة الأعمال والمهن وبيت المال وجداول اللقاءات"
                : locale === "en"
                  ? "Career directory, cohort treasury, and reunion schedules"
                  : "Jejaring karier, kas angkatan, dan agenda reuni"}
            </div>
          </div>
        </div>

        <div className="welcome-actions">
          <button type="button" className="welcome-btn-tour" onClick={onStartTour}>
            <i className="fa-solid fa-compass" aria-hidden="true"></i>
            {locale === "ar" ? "جولة في المنصة" : locale === "en" ? "Take a Quick Tour" : "Tunjukkan Isi Portal"}
          </button>
          <button type="button" className="welcome-btn-skip" onClick={onSkip}>
            {locale === "ar" ? "لاحقاً" : locale === "en" ? "Maybe Later" : "Nanti Saja"}
          </button>
        </div>
      </div>
    </div>
  );
}

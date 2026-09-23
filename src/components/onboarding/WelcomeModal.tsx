"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
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
  const { locale } = useLanguage();
  const displayName = userName || (locale === "ar" ? "أيها الرفيق" : locale === "en" ? "Friend" : "Kawan");

  return (
    <div className="welcome-modal-backdrop" onClick={onSkip}>
      <div className="welcome-modal" onClick={(e) => e.stopPropagation()}>
        <span className="welcome-emoji">👋</span>

        <h2 className="welcome-title">
          {locale === "ar"
            ? `أهلاً وسهلاً، ${displayName}!`
            : locale === "en"
            ? `Welcome, ${displayName}!`
            : `Ahlan wa Sahlan, ${displayName}!`}
        </h2>

        <p className="welcome-subtitle">
          {locale === "ar" ? (
            <>
              مرحباً بك في البوابة الرسمية لخريجي دفعة{" "}
              <strong>Expedient Generation</strong> — معهد الرسالة الحديث
              الدفعة ٤٣. تم تصميم هذه المنصة لتوطيد أواصر الأخوة وحفظ الذكريات المشتركة.
            </>
          ) : locale === "en" ? (
            <>
              Welcome to the official alumni portal of{" "}
              <strong>Expedient Generation</strong> — Pondok Modern Arrisalah
              Cohort 43. Built to strengthen our ties and preserve our shared memories.
            </>
          ) : (
            <>
              Selamat datang di portal resmi alumni angkatan{" "}
              <strong>Expedient Generation</strong> — Pondok Modern Arrisalah
              ke-43. Portal ini dibuat untuk mempermudah silaturahmi dan
              mendokumentasikan kenangan bersama.
            </>
          )}
        </p>

        <div className="welcome-features">
          <div className="welcome-feature-item">
            <div className="welcome-feature-icon">
              <i className="fa-solid fa-landmark"></i>
            </div>
            <div className="welcome-feature-text">
              <strong>
                {locale === "ar" ? "المتحف والذكريات" : locale === "en" ? "Museum & Memories" : "Museum & Kenangan"}
              </strong>
              {locale === "ar"
                ? "أرشيف الصور، الفيديو، خط التاريخ الزمني، وشعار الدفعة ثلاثي الأبعاد."
                : locale === "en"
                ? "Archive of photos, videos, timeline history, and interactive 3D cohort emblem."
                : "Arsip foto, video, timeline sejarah, dan logo 3D interaktif angkatan."}
            </div>
          </div>
          <div className="welcome-feature-item">
            <div className="welcome-feature-icon">
              <i className="fa-solid fa-users"></i>
            </div>
            <div className="welcome-feature-text">
              <strong>
                {locale === "ar" ? "العثور على الزملاء" : locale === "en" ? "Find Old Friends" : "Temukan Kawan Lama"}
              </strong>
              {locale === "ar"
                ? "ابحث عن بيانات الزملاء، خريطة الانتشار الجغرافي، والتواصل المباشر."
                : locale === "en"
                ? "Search alumni directory, see regional distribution map, and direct messaging."
                : "Cari kontak alumni, lihat peta persebaran, dan ngobrol langsung."}
            </div>
          </div>
          <div className="welcome-feature-item">
            <div className="welcome-feature-icon">
              <i className="fa-solid fa-handshake"></i>
            </div>
            <div className="welcome-feature-text">
              <strong>
                {locale === "ar" ? "التعاون والتآزر" : locale === "en" ? "Synergy & Mutual Aid" : "Sinergi & Gotong Royong"}
              </strong>
              {locale === "ar"
                ? "شبكة الأعمال والمهن، بيت المال، جداول اللقاءات، والمزيد."
                : locale === "en"
                ? "Career networking, cohort treasury, reunion schedules, and much more."
                : "Jejaring karir, kas angkatan, jadwal reuni, dan banyak lagi."}
            </div>
          </div>
        </div>

        <div className="welcome-actions">
          <button className="welcome-btn-tour" onClick={onStartTour}>
            <i className="fa-solid fa-compass"></i>
            {locale === "ar" ? "جولة في المنصة" : locale === "en" ? "Take a Quick Tour" : "Tunjukkan Isi Portal"}
          </button>
          <button className="welcome-btn-skip" onClick={onSkip}>
            {locale === "ar" ? "لاحقاً" : locale === "en" ? "Maybe Later" : "Nanti Saja"}
          </button>
        </div>
      </div>
    </div>
  );
}

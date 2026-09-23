"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import "./khatam.css";

const ARABIC_NUMS = ["", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩", "١٠",
  "١١", "١٢", "١٣", "١٤", "١٥", "١٦", "١٧", "١٨", "١٩", "٢٠",
  "٢١", "٢٢", "٢٣", "٢٤", "٢٥", "٢٦", "٢٧", "٢٨", "٢٩", "٣٠"
];

interface KhatamClientProps {
  initialSession: any;
  initialAllocations: any[];
  currentUser: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export default function KhatamClient({
  initialSession,
  initialAllocations,
  currentUser,
}: KhatamClientProps) {
  const { t, locale } = useLanguage();
  const [session, setSession] = useState(initialSession);
  const [allocations, setAllocations] = useState<any[]>(initialAllocations || []);
  const [filter, setFilter] = useState<"all" | "available" | "my" | "completed">("all");
  const [loadingJuz, setLoadingJuz] = useState<number | null>(null);
  const [showDoaModal, setShowDoaModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Statistics
  const completedCount = allocations.filter((a) => a.status === "completed").length;
  const readingCount = allocations.filter((a) => a.status === "reading").length;
  const availableCount = allocations.filter((a) => a.status === "available").length;
  const progressPercent = Math.round((completedCount / 30) * 100);

  const triggerHaptic = (pattern: number | number[] = 30) => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  const showToast = (msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(null), 3500);
  };

  const handleAction = async (action: "claim" | "complete" | "unclaim", juzNumber: number) => {
    setLoadingJuz(juzNumber);
    triggerHaptic( action === "complete" ? [30, 50, 40] : 30 );

    try {
      const res = await fetch("/api/khatam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          juz_number: juzNumber,
          user_name: currentUser.name,
          user_avatar: currentUser.avatar,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(
          data.error ||
            (locale === "ar"
              ? "فشلت معالجة الإجراء."
              : locale === "en"
              ? "Failed to process action."
              : "Gagal memproses aksi.")
        );
        return;
      }

      if (data.allocations) {
        setAllocations(data.allocations);
      }
      if (data.session) {
        setSession(data.session);
      }

      if (action === "claim") {
        showToast(
          locale === "ar"
            ? `الحمد لله! لقد حجزت الجزء ${juzNumber}. قراءة مباركة.`
            : locale === "en"
            ? `Alhamdulillah! You claimed Juz ${juzNumber}. Happy reading.`
            : `Alhamdulillah! Anda telah mengambil Juz ${juzNumber}. Selamat membaca.`
        );
      } else if (action === "complete") {
        showToast(
          locale === "ar"
            ? `ما شاء الله! اكتملت قراءة الجزء ${juzNumber}. أُضيفت 25 نقطة رفعة.`
            : locale === "en"
            ? `Masha Allah! Juz ${juzNumber} completed. +25 Prestige points added.`
            : `Masya Allah! Juz ${juzNumber} selesai dibaca. +25 Poin Prestise ditambahkan.`
        );
        if (data.allocations?.filter((a: any) => a.status === "completed").length === 30) {
          setShowDoaModal(true);
        }
      } else if (action === "unclaim") {
        showToast(
          locale === "ar"
            ? `تم إلغاء حجز الجزء ${juzNumber}.`
            : locale === "en"
            ? `Claim for Juz ${juzNumber} was cancelled.`
            : `Klaim Juz ${juzNumber} telah dibatalkan.`
        );
      }
    } catch (e) {
      console.error(e);
      showToast(
        locale === "ar"
          ? "حدث خطأ في الاتصال بالشبكة."
          : locale === "en"
          ? "Network issue occurred."
          : "Terjadi kendala jaringan."
      );
    } finally {
      setLoadingJuz(null);
    }
  };

  const handleQuickClaim = () => {
    const firstAvailable = allocations.find((a) => a.status === "available");
    if (!firstAvailable) {
      showToast(
        locale === "ar"
          ? "تم حجز جميع الأجزاء من قبل الإخوة!"
          : locale === "en"
          ? "All Juz have been claimed by cohort companions!"
          : "Semua Juz sudah diambil sahabat angkatan!"
      );
      return;
    }
    handleAction("claim", firstAvailable.juz_number);
  };

  const filteredAllocations = allocations.filter((item) => {
    if (filter === "available") return item.status === "available";
    if (filter === "completed") return item.status === "completed";
    if (filter === "my") return item.user_id === currentUser.id;
    return true;
  });

  return (
    <div className="khatam-page-wrapper">
      <div className="khatam-bg-ambient"></div>

      <div className="khatam-container">
        {/* Navigation & Header */}
        <div className="khatam-nav-bar">
          <Link href="/fitur" className="btn-khatam-back">
            <i className="fa-solid fa-chevron-left"></i> {t.common.back}
          </Link>
        </div>

        <div className="khatam-header-box">
          <div className="khatam-badge-sup">
            <i className="fa-solid fa-kaaba"></i> {t.khatam.active_period}
          </div>
          <h1 className="khatam-title">{t.khatam.title}</h1>
          <p className="khatam-subtitle">
            {t.khatam.subtitle}
          </p>
        </div>

        {/* Toast Alert */}
        {alertMessage && (
          <div
            style={{
              padding: "12px 20px",
              borderRadius: "14px",
              background: "rgba(212, 175, 55, 0.2)",
              border: "1px solid var(--gold-main)",
              color: "var(--gold-main)",
              fontSize: "0.85rem",
              fontWeight: 600,
              textAlign: "center",
              boxShadow: "0 0 20px rgba(212, 175, 55, 0.3)",
              animation: "fadeIn 0.3s ease",
            }}
          >
            {alertMessage}
          </div>
        )}

        {/* Hero Progress Card */}
        <div className="khatam-hero-card">
          <div className="khatam-stats-row">
            <div className="khatam-stat-item">
              <span className="khatam-stat-label">{t.khatam.session_title}</span>
              <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--gold-main)" }}>
                {session?.title || t.khatam.default_session}
              </span>
            </div>

            <div className="khatam-stat-item">
              <span className="khatam-stat-label">{t.khatam.khatam_progress}</span>
              <div className="khatam-stat-value">
                <span>{completedCount}</span>
                <span className="khatam-stat-total">/ 30 Juz ({progressPercent}%)</span>
              </div>
            </div>

            <div className="khatam-stat-item">
              <span className="khatam-stat-label">{t.khatam.allocation_status}</span>
              <div style={{ display: "flex", gap: "10px", fontSize: "0.82rem", fontWeight: 600 }}>
                <span style={{ color: "#2bb97c" }}>{completedCount} {t.khatam.stat_completed}</span>
                <span style={{ color: "#ffb300" }}>• {readingCount} {t.khatam.stat_reading}</span>
                <span style={{ color: "var(--text-secondary)" }}>• {availableCount} {t.khatam.stat_available}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="khatam-progress-wrapper">
            <div className="khatam-progress-meta">
              <span>{completedCount === 30 ? t.khatam.all_completed : `${30 - completedCount} ${t.khatam.juz_to_khatam}`}</span>
              <span style={{ fontWeight: 700, color: "var(--gold-main)" }}>{progressPercent}%</span>
            </div>
            <div className="khatam-progress-track">
              <div
                className="khatam-progress-bar"
                style={{ width: `${Math.max(progressPercent, completedCount > 0 ? 5 : 0)}%` }}
              ></div>
            </div>
          </div>

          {/* Actions */}
          <div className="khatam-hero-actions">
            {availableCount > 0 && (
              <button type="button" className="btn-khatam-quick" onClick={handleQuickClaim}>
                <i className="fa-solid fa-bolt-lightning"></i> {t.khatam.quick_claim}
              </button>
            )}

            <button
              type="button"
              className="btn-khatam-doa-modal"
              onClick={() => setShowDoaModal(true)}
            >
              <i className="fa-solid fa-book-quran"></i> {t.khatam.doa_modal_btn}
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="khatam-filter-bar">
          <button
            type="button"
            className={`khatam-filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            {t.khatam.filter_all} (30)
          </button>
          <button
            type="button"
            className={`khatam-filter-btn ${filter === "available" ? "active" : ""}`}
            onClick={() => setFilter("available")}
          >
            {t.khatam.filter_available} ({availableCount})
          </button>
          <button
            type="button"
            className={`khatam-filter-btn ${filter === "my" ? "active" : ""}`}
            onClick={() => setFilter("my")}
          >
            {t.khatam.filter_my} ({allocations.filter((a) => a.user_id === currentUser.id).length})
          </button>
          <button
            type="button"
            className={`khatam-filter-btn ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            {t.khatam.filter_completed} ({completedCount})
          </button>
        </div>

        {/* 30 Juz Grid */}
        <div className="khatam-grid">
          {filteredAllocations.map((item) => {
            const isMyJuz = item.user_id === currentUser.id;
            const isBusy = loadingJuz === item.juz_number;

            return (
              <div
                key={item.juz_number}
                className={`juz-card status-${item.status} ${isMyJuz ? "is-my-juz" : ""}`}
              >
                {/* Header: Numeral & Status */}
                <div className="juz-card-header">
                  <div className="juz-number-badge">
                    <span className="juz-arabic-num">{ARABIC_NUMS[item.juz_number]}</span>
                    <span className="juz-latin-num">Juz {item.juz_number}</span>
                  </div>
                  <span className="juz-status-pill">
                    {item.status === "available" && t.khatam.status_available}
                    {item.status === "reading" && t.khatam.status_reading}
                    {item.status === "completed" && t.khatam.status_completed}
                  </span>
                </div>

                {/* Surah Range */}
                <div className="juz-surah-range">
                  <i className="fa-regular fa-bookmark" style={{ color: "var(--gold-main)", marginRight: "5px" }}></i>
                  {item.surah_range}
                </div>

                {/* Reader Info */}
                {item.status !== "available" ? (
                  <div className="juz-reader-box">
                    {item.user_avatar ? (
                      <Image
                        src={item.user_avatar}
                        alt={item.user_name || "Pembaca"}
                        width={26}
                        height={26}
                        className="juz-reader-avatar"
                      />
                    ) : (
                      <div className="juz-reader-fallback">
                        {(item.user_name || "A")[0].toUpperCase()}
                      </div>
                    )}
                    <span className="juz-reader-name">
                      {isMyJuz ? t.khatam.you : item.user_name || t.khatam.cohort_peer}
                    </span>
                  </div>
                ) : (
                  <div className="juz-reader-box" style={{ opacity: 0.5 }}>
                    <span style={{ fontSize: "0.72rem", fontStyle: "italic" }}>
                      {t.khatam.no_reader}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="juz-card-actions">
                  {item.status === "available" && (
                    <button
                      type="button"
                      disabled={isBusy}
                      className="btn-juz-claim"
                      onClick={() => handleAction("claim", item.juz_number)}
                    >
                      <i className="fa-solid fa-hand-holding-heart"></i>
                      {isBusy ? t.common.loading : t.khatam.claim_juz}
                    </button>
                  )}

                  {item.status === "reading" && isMyJuz && (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        className="btn-juz-complete"
                        onClick={() => handleAction("complete", item.juz_number)}
                      >
                        <i className="fa-solid fa-check"></i>
                        {isBusy ? t.common.loading : t.khatam.read_confirmation}
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        className="btn-juz-unclaim"
                        onClick={() => handleAction("unclaim", item.juz_number)}
                      >
                        {t.common.cancel}
                      </button>
                    </>
                  )}

                  {item.status === "reading" && !isMyJuz && (
                    <div style={{ textAlign: "center", fontSize: "0.72rem", color: "#ffb300", padding: "6px 0" }}>
                      <i className="fa-solid fa-hourglass-half" style={{ marginRight: "4px" }}></i>
                      {t.khatam.under_reading}
                    </div>
                  )}

                  {item.status === "completed" && (
                    <div className="juz-completed-stamp">
                      <i className="fa-solid fa-circle-check"></i>
                      {t.khatam.khatam_badge}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Doa Khatam Al-Qur'an Modal */}
      {showDoaModal && (
        <div className="khatam-modal-backdrop" onClick={() => setShowDoaModal(false)}>
          <div className="khatam-modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="btn-modal-close"
              onClick={() => setShowDoaModal(false)}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="modal-header-text">
              <div className="khatam-badge-sup" style={{ margin: "0 auto" }}>
                <i className="fa-solid fa-star-and-crescent"></i> {t.khatam.doa_badge}
              </div>
              <h2>{t.khatam.doa_title}</h2>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
                اللَّهُمَّ ارْحَمْنَا بِالقُرْءَانِ
              </p>
            </div>

            <div className="modal-doa-content">
              <div className="doa-arabic">
                اللَّهُمَّ ارْحَمْنِي بِالْقُرْآنِ وَاجْعَلْهُ لِي إِمَامًا وَنُورًا وَهُدًى وَرَحْمَةً، اللَّهُمَّ ذَكِّرْنِي مِنْهُ مَا نَسِيتُ وَعَلِّمْنِي مِنْهُ مَا جَهِلْتُ وَارْزُقْنِي تِلَاوَتَهُ آنَاءَ اللَّيْلِ وَأَطْرَافَ النَّهَارِ وَاجْعَلْهُ لِي حُجَّةً يَا رَبَّ الْعَالَمِينَ
              </div>
              <div className="doa-latin">
                &ldquo;Allāhummarhamnā bil-qur&apos;ān, waj&apos;alhu lanā imāman wa nūran wa hudan wa rahmah. Allāhumma żakkirnā minhu mā nasīnā, wa &apos;allimnā minhu mā jahilnā, warzuqnā tilāwatahu ānā&apos;al-layli wa aṭrāfan-nahār, waj&apos;alhu lanā hujjatan yā rabbal-&apos;ālamīn.&rdquo;
              </div>
              <div className="doa-meaning">
                &ldquo;{t.khatam.doa_meaning}&rdquo;
              </div>
            </div>

            <button
              type="button"
              className="btn-khatam-quick"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => setShowDoaModal(false)}
            >
              {t.khatam.amin_button}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

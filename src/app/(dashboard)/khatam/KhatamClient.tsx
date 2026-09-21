"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
        showToast(data.error || "Gagal memproses aksi.");
        return;
      }

      if (data.allocations) {
        setAllocations(data.allocations);
      }
      if (data.session) {
        setSession(data.session);
      }

      if (action === "claim") {
        showToast(`Alhamdulillah! Anda telah mengambil Juz ${juzNumber}. Selamat membaca.`);
      } else if (action === "complete") {
        showToast(`Masya Allah! Juz ${juzNumber} selesai dibaca. +25 Poin Prestise ditambahkan.`);
        if (data.allocations?.filter((a: any) => a.status === "completed").length === 30) {
          setShowDoaModal(true);
        }
      } else if (action === "unclaim") {
        showToast(`Klaim Juz ${juzNumber} telah dibatalkan.`);
      }
    } catch (e) {
      console.error(e);
      showToast("Terjadi kendala jaringan.");
    } finally {
      setLoadingJuz(null);
    }
  };

  const handleQuickClaim = () => {
    const firstAvailable = allocations.find((a) => a.status === "available");
    if (!firstAvailable) {
      showToast("Semua Juz sudah diambil sahabat angkatan!");
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
            <i className="fa-solid fa-chevron-left"></i> Fitur
          </Link>
        </div>

        <div className="khatam-header-box">
          <div className="khatam-badge-sup">
            <i className="fa-solid fa-kaaba"></i> Protokol Spiritual Angkatan
          </div>
          <h1 className="khatam-title">Khatam Bersama Real-Time</h1>
          <p className="khatam-subtitle">
            One Member One Juz — Sinergi 30 Juz Al-Qur&apos;an secara serentak untuk keberkahan keluarga besar Expedient Generation 43.
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
              <span className="khatam-stat-label">Sesi Khataman</span>
              <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--gold-main)" }}>
                {session?.title || "Khataman Pekanan Angkatan 43"}
              </span>
            </div>

            <div className="khatam-stat-item">
              <span className="khatam-stat-label">Progres Khatam</span>
              <div className="khatam-stat-value">
                <span>{completedCount}</span>
                <span className="khatam-stat-total">/ 30 Juz ({progressPercent}%)</span>
              </div>
            </div>

            <div className="khatam-stat-item">
              <span className="khatam-stat-label">Status Alokasi</span>
              <div style={{ display: "flex", gap: "10px", fontSize: "0.82rem", fontWeight: 600 }}>
                <span style={{ color: "#2bb97c" }}>{completedCount} Selesai</span>
                <span style={{ color: "#ffb300" }}>• {readingCount} Dibaca</span>
                <span style={{ color: "var(--text-secondary)" }}>• {availableCount} Kosong</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="khatam-progress-wrapper">
            <div className="khatam-progress-meta">
              <span>{completedCount === 30 ? "🎉 30/30 Juz Selesai — Khatam!" : `${30 - completedCount} Juz Menuju Khatam`}</span>
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
                <i className="fa-solid fa-bolt-lightning"></i> Ambil Juz Acak
              </button>
            )}

            <button
              type="button"
              className="btn-khatam-doa-modal"
              onClick={() => setShowDoaModal(true)}
            >
              <i className="fa-solid fa-book-quran"></i> Doa Khatam Al-Qur&apos;an
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
            Semua Juz (30)
          </button>
          <button
            type="button"
            className={`khatam-filter-btn ${filter === "available" ? "active" : ""}`}
            onClick={() => setFilter("available")}
          >
            Tersedia ({availableCount})
          </button>
          <button
            type="button"
            className={`khatam-filter-btn ${filter === "my" ? "active" : ""}`}
            onClick={() => setFilter("my")}
          >
            Juz Saya ({allocations.filter((a) => a.user_id === currentUser.id).length})
          </button>
          <button
            type="button"
            className={`khatam-filter-btn ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            Selesai ({completedCount})
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
                    {item.status === "available" && "Tersedia"}
                    {item.status === "reading" && "Dibaca"}
                    {item.status === "completed" && "Selesai"}
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
                      {isMyJuz ? "Anda" : item.user_name || "Sahabat 43"}
                    </span>
                  </div>
                ) : (
                  <div className="juz-reader-box" style={{ opacity: 0.5 }}>
                    <span style={{ fontSize: "0.72rem", fontStyle: "italic" }}>
                      Belum ada pembaca
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
                      {isBusy ? "Memproses..." : "Klaim Juz"}
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
                        {isBusy ? "Menyimpan..." : "Tandai Selesai"}
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        className="btn-juz-unclaim"
                        onClick={() => handleAction("unclaim", item.juz_number)}
                      >
                        Batalkan Klaim
                      </button>
                    </>
                  )}

                  {item.status === "reading" && !isMyJuz && (
                    <div style={{ textAlign: "center", fontSize: "0.72rem", color: "#ffb300", padding: "6px 0" }}>
                      <i className="fa-solid fa-hourglass-half" style={{ marginRight: "4px" }}></i>
                      Sedang Ditadarus
                    </div>
                  )}

                  {item.status === "completed" && (
                    <div className="juz-completed-stamp">
                      <i className="fa-solid fa-circle-check"></i>
                      Khatam
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
                <i className="fa-solid fa-star-and-crescent"></i> Doa Mustajab
              </div>
              <h2>Doa Khatam Al-Qur&apos;an</h2>
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
                &ldquo;Ya Allah, rahmatilah kami dengan Al-Qur&apos;an. Jadikanlah ia bagi kami sebagai panutan, cahaya, petunjuk, dan rahmat. Ya Allah, ingatkanlah kami dari apa yang kami lupakan darinya, ajarkanlah kami apa yang belum kami ketahui darinya, anugerahilah kami kemampuan membacanya di sepanjang malam dan siang hari, serta jadikanlah ia sebagai pembela kami, wahai Tuhan semesta alam.&rdquo;
              </div>
            </div>

            <button
              type="button"
              className="btn-khatam-quick"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => setShowDoaModal(false)}
            >
              Aamiin Ya Rabbal &apos;Alamin
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

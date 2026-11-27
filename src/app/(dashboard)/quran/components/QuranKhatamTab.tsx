"use client";

import Image from "next/image";
import { JUZ_START_PAGES } from "@/lib/data/alhufazData";
import { ARABIC_NUMS } from "../types";
import "@/app/(dashboard)/khatam/khatam.css";

interface QuranKhatamTabProps {
  currentUserId: string;
  khatamSession: any;
  khatamAllocations: any[];
  filteredKhatamAllocations: any[];
  khatamFilter: "all" | "available" | "my" | "completed";
  setKhatamFilter: (filter: "all" | "available" | "my" | "completed") => void;
  khatamCompletedCount: number;
  khatamReadingCount: number;
  khatamAvailableCount: number;
  khatamProgressPercent: number;
  khatamLoadingJuz: number | null;
  onQuickClaim: () => void;
  onOpenDoaModal: () => void;
  onOpenMushaf: () => void;
  onKhatamAction: (action: "claim" | "complete" | "unclaim", juzNumber: number) => void;
  onOpenJuzInMushaf: (juzNumber: number) => void;
}

export function QuranKhatamTab({
  currentUserId,
  khatamSession,
  khatamAllocations,
  filteredKhatamAllocations,
  khatamFilter,
  setKhatamFilter,
  khatamCompletedCount,
  khatamReadingCount,
  khatamAvailableCount,
  khatamProgressPercent,
  khatamLoadingJuz,
  onQuickClaim,
  onOpenDoaModal,
  onOpenMushaf,
  onKhatamAction,
  onOpenJuzInMushaf,
}: QuranKhatamTabProps) {
  return (
    <div className="khatam-page-wrapper" style={{ padding: 0, minHeight: "auto" }}>
      <div className="khatam-container" style={{ maxWidth: "1380px", margin: "0 auto", padding: 0 }}>
        {/* Header Box */}
        <div className="khatam-header-box">
          <div className="khatam-badge-sup">
            <i className="fa-solid fa-kaaba"></i> Khatam Bersama Angkatan
          </div>
          <h1 className="khatam-title">Khatam Bersama Real-Time</h1>
          <p className="khatam-subtitle">
            One Member One Juz: pembagian 30 Juz Al-Qur&apos;an secara serentak yang terhubung dengan Mushaf Al-Hufaz untuk keluarga besar Expedient Generation 43.
          </p>
        </div>

        {/* Hero Progress Card */}
        <div className="khatam-hero-card">
          <div className="khatam-stats-row">
            <div className="khatam-stat-item">
              <span className="khatam-stat-label">Sesi Khataman</span>
              <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--gold-main)" }}>
                {khatamSession?.title || "Khataman Pekanan Angkatan 43"}
              </span>
            </div>

            <div className="khatam-stat-item">
              <span className="khatam-stat-label">Progres Khatam</span>
              <div className="khatam-stat-value">
                <span>{khatamCompletedCount}</span>
                <span className="khatam-stat-total">/ 30 Juz ({khatamProgressPercent}%)</span>
              </div>
            </div>

            <div className="khatam-stat-item">
              <span className="khatam-stat-label">Status Alokasi</span>
              <div style={{ display: "flex", gap: "10px", fontSize: "0.82rem", fontWeight: 600 }}>
                <span style={{ color: "#2bb97c" }}>{khatamCompletedCount} Selesai</span>
                <span style={{ color: "#ffb300" }}>• {khatamReadingCount} Dibaca</span>
                <span style={{ color: "var(--text-secondary)" }}>• {khatamAvailableCount} Kosong</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="khatam-progress-wrapper">
            <div className="khatam-progress-meta">
              <span>
                {khatamCompletedCount === 30
                  ? "30/30 Juz Selesai - Khatam Bersama Berhasil!"
                  : `${30 - khatamCompletedCount} Juz Menuju Khatam`}
              </span>
              <span style={{ fontWeight: 700, color: "var(--gold-main)" }}>{khatamProgressPercent}%</span>
            </div>
            <div className="khatam-progress-track">
              <div
                className="khatam-progress-bar"
                style={{ width: `${Math.max(khatamProgressPercent, khatamCompletedCount > 0 ? 5 : 0)}%` }}
              ></div>
            </div>
          </div>

          {/* Actions */}
          <div className="khatam-hero-actions">
            {khatamAvailableCount > 0 && (
              <button type="button" className="btn-khatam-quick" onClick={onQuickClaim}>
                <i className="fa-solid fa-bolt-lightning"></i> Ambil Juz Acak
              </button>
            )}

            <button type="button" className="btn-khatam-doa-modal" onClick={onOpenDoaModal}>
              <i className="fa-solid fa-book-quran"></i> Doa Khatam Al-Qur&apos;an
            </button>

            <button
              type="button"
              className="btn-khatam-doa-modal"
              style={{ background: "rgba(16, 185, 129, 0.15)", borderColor: "#10b981", color: "#34d399" }}
              onClick={onOpenMushaf}
            >
              <i className="fa-solid fa-book-open"></i> Buka Mushaf Al-Hufaz
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="khatam-filter-bar">
          <button
            type="button"
            className={`khatam-filter-btn ${khatamFilter === "all" ? "active" : ""}`}
            onClick={() => setKhatamFilter("all")}
          >
            Semua Juz (30)
          </button>
          <button
            type="button"
            className={`khatam-filter-btn ${khatamFilter === "available" ? "active" : ""}`}
            onClick={() => setKhatamFilter("available")}
          >
            Tersedia ({khatamAvailableCount})
          </button>
          <button
            type="button"
            className={`khatam-filter-btn ${khatamFilter === "my" ? "active" : ""}`}
            onClick={() => setKhatamFilter("my")}
          >
            Juz Saya ({khatamAllocations.filter((a) => a.user_id === currentUserId).length})
          </button>
          <button
            type="button"
            className={`khatam-filter-btn ${khatamFilter === "completed" ? "active" : ""}`}
            onClick={() => setKhatamFilter("completed")}
          >
            Selesai ({khatamCompletedCount})
          </button>
        </div>

        {/* 30 Juz Grid */}
        <div className="khatam-grid">
          {filteredKhatamAllocations.map((item) => {
            const isMyJuz = item.user_id === currentUserId;
            const isBusy = khatamLoadingJuz === item.juz_number;

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
                      onClick={() => onKhatamAction("claim", item.juz_number)}
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
                        onClick={() => onKhatamAction("complete", item.juz_number)}
                      >
                        <i className="fa-solid fa-check"></i>
                        {isBusy ? "Menyimpan..." : "Tandai Selesai"}
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        className="btn-juz-unclaim"
                        onClick={() => onKhatamAction("unclaim", item.juz_number)}
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

                  {/* Direct 1-Click Jump to Authentic Mushaf */}
                  <button
                    type="button"
                    className="btn-juz-read-mushaf"
                    onClick={() => onOpenJuzInMushaf(item.juz_number)}
                    title={`Buka Juz ${item.juz_number} langsung di Mushaf Al-Hufaz 15 Baris`}
                  >
                    <i className="fa-solid fa-book-open"></i>
                    <span>Baca di Mushaf (Hal. {JUZ_START_PAGES[item.juz_number] || 1})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function QuranKhatamDoaModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="khatam-modal-backdrop" onClick={onClose}>
      <div className="khatam-modal-box" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="btn-modal-close" onClick={onClose}>
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
          onClick={onClose}
        >
          Aamiin Ya Rabbal &apos;Alamin
        </button>
      </div>
    </div>
  );
}

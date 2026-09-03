"use client";

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
  const displayName = userName || "Kawan";

  return (
    <div className="welcome-modal-backdrop" onClick={onSkip}>
      <div className="welcome-modal" onClick={(e) => e.stopPropagation()}>
        <span className="welcome-emoji">👋</span>

        <h2 className="welcome-title">Ahlan wa Sahlan, {displayName}!</h2>

        <p className="welcome-subtitle">
          Selamat datang di portal resmi alumni angkatan{" "}
          <strong>Expedient Generation</strong> — Pondok Modern Arrisalah
          ke-43. Portal ini dibuat untuk mempermudah silaturahmi dan
          mendokumentasikan kenangan bersama.
        </p>

        <div className="welcome-features">
          <div className="welcome-feature-item">
            <div className="welcome-feature-icon">
              <i className="fa-solid fa-landmark"></i>
            </div>
            <div className="welcome-feature-text">
              <strong>Museum & Kenangan</strong>
              Arsip foto, video, timeline sejarah, dan logo 3D interaktif angkatan.
            </div>
          </div>
          <div className="welcome-feature-item">
            <div className="welcome-feature-icon">
              <i className="fa-solid fa-users"></i>
            </div>
            <div className="welcome-feature-text">
              <strong>Temukan Kawan Lama</strong>
              Cari kontak alumni, lihat peta persebaran, dan ngobrol langsung.
            </div>
          </div>
          <div className="welcome-feature-item">
            <div className="welcome-feature-icon">
              <i className="fa-solid fa-handshake"></i>
            </div>
            <div className="welcome-feature-text">
              <strong>Sinergi & Gotong Royong</strong>
              Jejaring karir, kas angkatan, jadwal reuni, dan banyak lagi.
            </div>
          </div>
        </div>

        <div className="welcome-actions">
          <button className="welcome-btn-tour" onClick={onStartTour}>
            <i className="fa-solid fa-compass"></i>
            Tunjukkan Isi Portal
          </button>
          <button className="welcome-btn-skip" onClick={onSkip}>
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  );
}

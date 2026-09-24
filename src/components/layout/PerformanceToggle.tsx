"use client";

import { useState } from "react";
import { usePerformanceTier, PerformancePreference } from "@/lib/performance";
import { triggerHaptic } from "@/lib/haptic";

export default function PerformanceToggle() {
  const { tier, isLowPerf, setManualTier } = usePerformanceTier();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (pref: PerformancePreference) => {
    triggerHaptic(20);
    setManualTier(pref);
    setIsOpen(false);
  };

  return (
    <div className="perf-toggle-container">
      <button
        type="button"
        className={`perf-toggle-btn ${isLowPerf ? "is-low" : "is-high"}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isLowPerf ? "Mode Kinerja Ringan Aktif (0 Lag)" : "Efek Sinematik Aktif"}
        aria-label="Pengaturan Kinerja Grafis"
      >
        <i className={isLowPerf ? "fa-solid fa-bolt" : "fa-solid fa-wand-magic-sparkles"}></i>
        <span className="perf-label-text">{isLowPerf ? "0 Lag" : "HD"}</span>
      </button>

      {isOpen && (
        <>
          <div className="perf-backdrop" onClick={() => setIsOpen(false)} />
          <div className="perf-menu-dropdown">
            <div className="perf-menu-header">
              <span className="perf-menu-title">Mode Kinerja Web</span>
              <span className="perf-menu-desc">Sesuaikan dengan spesifikasi perangkat Anda</span>
            </div>

            <button
              type="button"
              className={`perf-option-item ${tier === "high" ? "active" : ""}`}
              onClick={() => handleSelect("high")}
            >
              <div className="perf-option-icon gold">
                <i className="fa-solid fa-wand-magic-sparkles"></i>
              </div>
              <div className="perf-option-text">
                <div className="perf-option-name">Sinematik Penuh</div>
                <div className="perf-option-sub">Animasi halus, partikel kosmik, efek 3D & spotlight</div>
              </div>
              {tier === "high" && <i className="fa-solid fa-check perf-check"></i>}
            </button>

            <button
              type="button"
              className={`perf-option-item ${tier === "low" ? "active" : ""}`}
              onClick={() => handleSelect("low")}
            >
              <div className="perf-option-icon green">
                <i className="fa-solid fa-bolt-lightning"></i>
              </div>
              <div className="perf-option-text">
                <div className="perf-option-name">Mode Ringan (0 Lag)</div>
                <div className="perf-option-sub">Matikan partikel berat, 3D tilt, & blur untuk HP/PC spek rendah</div>
              </div>
              {tier === "low" && <i className="fa-solid fa-check perf-check"></i>}
            </button>

            <button
              type="button"
              className="perf-option-item"
              onClick={() => handleSelect("auto")}
            >
              <div className="perf-option-icon blue">
                <i className="fa-solid fa-microchip"></i>
              </div>
              <div className="perf-option-text">
                <div className="perf-option-name">Deteksi Otomatis (Default)</div>
                <div className="perf-option-sub">Sistem otomatis menyesuaikan RAM & prosesor perangkat</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

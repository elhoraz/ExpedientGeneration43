import React from "react";
import { Skeleton } from "./SkeletonCore";

/* ============================================================================
   11. INTERACTIVE STUDIOS & MAPS (Radar, Photobooth, Majlis, QiblaMap, Oracle)
   ============================================================================ */
export function RadarSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat global radar alumni"
      style={{
        position: "relative",
        minHeight: "100svh",
        width: "100%",
        padding: "20px 16px 90px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        boxSizing: "border-box",
      }}
    >
      {/* Top Floating Search & Stats Bar */}
      <div style={{ width: "100%", maxWidth: 820, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Skeleton pill width="min(280px, 100%)" height={44} />
        <div style={{ display: "flex", gap: 8 }}>
          <Skeleton pill width={96} height={38} />
          <Skeleton pill width={96} height={38} />
        </div>
      </div>

      {/* Center Radar Rings Motif */}
      <div style={{ position: "relative", width: 220, height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Skeleton circle width={220} height={220} style={{ position: "absolute", opacity: 0.35 }} />
        <Skeleton circle width={145} height={145} style={{ position: "absolute", opacity: 0.55 }} />
        <Skeleton circle width={72} height={72} />
      </div>

      {/* Bottom 2D/3D Switcher Pill */}
      <Skeleton pill width="min(300px, 90%)" height={48} />
    </div>
  );
}

export function PhotoboothSkeleton() {
  return (
    <div className="sk-shell sk-shell-1100" role="status" aria-label="Memuat studio photobooth">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <Skeleton pill width={210} height={30} />
        <Skeleton width="min(320px, 80%)" height={36} borderRadius={10} />
        <Skeleton width="min(420px, 90%)" height={14} borderRadius={6} />
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <Skeleton pill width={145} height={38} />
          <Skeleton pill width={145} height={38} />
        </div>
      </div>

      <div className="sk-studio-grid">
        {/* Left: Viewfinder + Shutter Strip */}
        <div className="skeleton-card" style={{ padding: 18 }}>
          <Skeleton width="100%" height={380} borderRadius={16} style={{ marginBottom: 16 }} />
          <div style={{ display: "flex", justifyContent: "center", gap: 12, alignItems: "center" }}>
            <Skeleton circle width={42} height={42} />
            <Skeleton circle width={64} height={64} />
            <Skeleton circle width={42} height={42} />
          </div>
        </div>

        {/* Right: Frame & Filter Controls Panel */}
        <div className="skeleton-card" style={{ padding: 18 }}>
          <Skeleton width="60%" height={18} borderRadius={6} style={{ marginBottom: 14 }} />
          <div className="sk-grid-2-fixed" style={{ marginBottom: 16 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} width="100%" height={68} borderRadius={12} />
            ))}
          </div>
          <Skeleton width="55%" height={16} borderRadius={5} style={{ marginBottom: 10 }} />
          <Skeleton width="100%" height={42} borderRadius={10} style={{ marginBottom: 10 }} />
          <Skeleton pill width="100%" height={44} />
        </div>
      </div>
    </div>
  );
}

export function MajlisSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat ruang audio majlis"
      style={{
        minHeight: "100svh",
        width: "100%",
        padding: "24px 20px 88px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        boxSizing: "border-box",
      }}
    >
      {/* Top Room Header */}
      <div style={{ width: "100%", maxWidth: 960, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <Skeleton pill width={118} height={40} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <Skeleton width={170} height={24} borderRadius={6} />
          <Skeleton pill width={110} height={18} />
        </div>
      </div>

      {/* Center Speaker Orb */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <Skeleton circle width={175} height={175} />
        <div className="skeleton-card" style={{ padding: "14px 28px", minWidth: 220, textAlign: "center" }}>
          <Skeleton width={145} height={18} borderRadius={6} style={{ margin: "0 auto 6px" }} />
          <Skeleton width={105} height={12} borderRadius={4} style={{ margin: "0 auto" }} />
        </div>
      </div>

      {/* Listeners Nodes + Control Dock */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} circle width={46} height={46} />
          ))}
        </div>
        <Skeleton pill width="min(320px, 90%)" height={54} />
      </div>
    </div>
  );
}

export function OracleSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat asisten pintar oracle"
      style={{
        minHeight: "100dvh",
        width: "100%",
        padding: "24px 20px 36px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Skeleton pill width={115} height={38} />
        <Skeleton pill width={140} height={38} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <Skeleton width="min(360px, 82vw)" height="min(420px, 50vh)" borderRadius={20} />
        <Skeleton pill width={220} height={28} />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <Skeleton pill width={135} height={46} />
        <Skeleton circle width={46} height={46} />
      </div>
    </div>
  );
}

export function KontemplasiSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat ruang kontemplasi"
      style={{
        minHeight: "100svh",
        width: "100%",
        padding: "24px 20px 40px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Skeleton pill width={105} height={38} />
        <Skeleton circle width={40} height={40} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <Skeleton circle width={210} height={210} />
        <Skeleton width="min(260px, 75%)" height={26} borderRadius={8} />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <Skeleton pill width={130} height={44} />
        <Skeleton pill width={130} height={44} />
      </div>
    </div>
  );
}

import React from "react";
import { Skeleton, SkChipRow } from "./SkeletonCore";

/* ============================================================================
   10. AL-QUR'AN & CORDOBA MUSHAF (/quran, /khatam) + INLINE LOADERS
   ============================================================================ */
export function CordobaSpreadSkeleton() {
  return (
    <div className="skeleton-card" style={{ padding: 20 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, marginBottom: 18, alignItems: "center" }}>
        <SkChipRow widths={[110, 96, 84]} />
        <div style={{ display: "flex", gap: 8 }}>
          <Skeleton circle width={36} height={36} />
          <Skeleton pill width={86} height={36} />
          <Skeleton circle width={36} height={36} />
        </div>
      </div>

      {/* Spread: 2 mushaf pages on desktop, 1 on mobile via .sk-grid-2 */}
      <div className="sk-grid-2">
        {[1, 2].map((page) => (
          <div
            key={page}
            className={page === 2 ? "hide-mobile" : ""}
            style={{
              padding: 18,
              borderRadius: 16,
              border: "1px solid var(--glass-border, rgba(212,175,55,0.22))",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <Skeleton pill width={72} height={22} />
              <Skeleton pill width={95} height={22} />
            </div>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((line) => (
              <Skeleton
                key={line}
                width={line === 8 ? "65%" : line === 1 ? "88%" : "100%"}
                height={18}
                borderRadius={6}
                style={{ marginBottom: 12, marginLeft: "auto" }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function QuranSurahReaderSkeleton() {
  return (
    <div className="skeleton-card" style={{ padding: 20, marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <Skeleton pill width={110} height={34} />
        <Skeleton width="min(200px, 50%)" height={26} borderRadius={8} />
        <Skeleton pill width={84} height={34} />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            padding: "16px 0",
            borderBottom: i < 4 ? "1px solid var(--glass-border, rgba(212,175,55,0.12))" : "none",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <Skeleton circle width={32} height={32} />
            <Skeleton pill width={90} height={28} />
          </div>
          <Skeleton width="90%" height={24} borderRadius={6} style={{ marginLeft: "auto", marginBottom: 10 }} />
          <Skeleton width="78%" height={13} borderRadius={4} style={{ marginBottom: 6 }} />
          <Skeleton width="92%" height={14} borderRadius={4} />
        </div>
      ))}
    </div>
  );
}

export function QuranTafsirSkeleton() {
  return (
    <div style={{ padding: "8px 0" }}>
      <div className="skeleton-card" style={{ padding: 16, marginBottom: 16 }}>
        <Skeleton width="85%" height={24} borderRadius={6} style={{ marginLeft: "auto", marginBottom: 12 }} />
        <Skeleton width="92%" height={14} borderRadius={4} />
      </div>
      <Skeleton width="45%" height={18} borderRadius={6} style={{ marginBottom: 10 }} />
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton
          key={i}
          width={i === 5 ? "72%" : "100%"}
          height={14}
          borderRadius={4}
          style={{ marginBottom: 8 }}
        />
      ))}
    </div>
  );
}

export function QuranSkeleton() {
  return (
    <div className="sk-shell sk-shell-1100" role="status" aria-label="Memuat Al-Qur'an digital">
      {/* Top 3-Tab Mushaf Switcher */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <Skeleton pill width="min(620px, 100%)" height={48} />
      </div>

      {/* Khataman Live Ribbon Strip */}
      <Skeleton width="100%" height={46} borderRadius={12} style={{ marginBottom: 18 }} />

      <CordobaSpreadSkeleton />
    </div>
  );
}

export function QiblaMapSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat peta arah kiblat"
      className="skeleton-card"
      style={{
        height: 360,
        borderRadius: 14,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Skeleton pill width={165} height={28} />
        <Skeleton circle width={34} height={34} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <Skeleton circle width={68} height={68} />
        <Skeleton pill width={190} height={24} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Skeleton pill width={115} height={24} />
        <Skeleton pill width={90} height={24} />
      </div>
    </div>
  );
}

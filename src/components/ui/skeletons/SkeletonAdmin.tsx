import React from "react";
import { Skeleton, SkChipRow } from "./SkeletonCore";

/* ============================================================================
   12. ADMIN PANEL (/admin & /admin/(protected)/*)
   ============================================================================ */
export function AdminDashboardSkeleton() {
  return (
    <div className="sk-shell sk-shell-1200" role="status" aria-label="Memuat panel admin">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 24 }}>
        <div>
          <Skeleton width={230} height={34} borderRadius={10} style={{ marginBottom: 12 }} />
          <SkChipRow widths={[96, 82, 92, 104]} />
        </div>
        <Skeleton pill width={130} height={38} />
      </div>

      <div className="sk-grid-3" style={{ marginBottom: 22 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-card" style={{ padding: 20 }}>
            <Skeleton width="50%" height={14} borderRadius={5} style={{ marginBottom: 12 }} />
            <Skeleton width="65%" height={32} borderRadius={8} />
          </div>
        ))}
      </div>

      <div className="sk-admin-charts" style={{ marginBottom: 22 }}>
        <div className="skeleton-card" style={{ padding: 20 }}>
          <Skeleton width="42%" height={18} borderRadius={6} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={220} borderRadius={12} />
        </div>
        <div className="skeleton-card" style={{ padding: 20 }}>
          <Skeleton width="55%" height={18} borderRadius={6} style={{ marginBottom: 16 }} />
          <Skeleton circle width={175} height={175} style={{ margin: "20px auto" }} />
        </div>
      </div>
    </div>
  );
}

export function AdminProtectedSkeleton() {
  return (
    <div className="sk-shell sk-shell-1200" role="status" aria-label="Memuat halaman manajemen admin">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 22 }}>
        <div>
          <Skeleton width={220} height={34} borderRadius={10} style={{ marginBottom: 12 }} />
          <SkChipRow widths={[92, 82, 92, 102]} />
        </div>
        <Skeleton pill width={125} height={38} />
      </div>

      <div className="skeleton-card" style={{ padding: 18 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", marginBottom: 18 }}>
          <Skeleton pill width="min(280px, 100%)" height={40} />
          <div style={{ display: "flex", gap: 8 }}>
            <Skeleton pill width={110} height={38} />
            <Skeleton pill width={96} height={38} className="hide-mobile" />
          </div>
        </div>

        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "13px 0",
              borderBottom: i < 6 ? "1px solid var(--glass-border, rgba(212,175,55,0.1))" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
              <Skeleton circle width={36} height={36} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Skeleton width="52%" height={15} borderRadius={5} style={{ marginBottom: 5 }} />
                <Skeleton width="36%" height={11} borderRadius={4} />
              </div>
            </div>
            <Skeleton pill width={82} height={26} className="hide-mobile" />
            <Skeleton pill width={94} height={32} style={{ flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

import React from "react";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  circle?: boolean;
  pill?: boolean;
}

/** Base Golden Shimmer primitive safe for both Server (loading.tsx) & Client components */
export function Skeleton({
  className = "",
  style = {},
  width,
  height,
  borderRadius,
  circle = false,
  pill = false,
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer ${circle ? "skeleton-circle" : ""} ${pill ? "skeleton-pill" : ""} ${className}`.trim()}
      style={{
        width: width ?? undefined,
        height: height ?? undefined,
        borderRadius: borderRadius ?? undefined,
        ...style,
      }}
    />
  );
}

/* Shared internal building blocks to keep route skeletons DRY & consistent */
export function SkHeroHeader({
  badgeWidth = 170,
  titleWidth = "min(300px, 78%)",
  subtitleWidth = "min(440px, 92%)",
  centered = true,
}: {
  badgeWidth?: number;
  titleWidth?: string;
  subtitleWidth?: string;
  centered?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: centered ? "center" : "flex-start",
        marginBottom: 24,
        gap: 10,
      }}
    >
      <Skeleton pill width={badgeWidth} height={28} />
      <Skeleton width={titleWidth} height={36} borderRadius={10} />
      <Skeleton width={subtitleWidth} height={15} borderRadius={6} />
    </div>
  );
}

export function SkChipRow({ widths = [82, 98, 76, 108, 90] }: { widths?: number[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {widths.map((w, idx) => (
        <Skeleton key={idx} pill width={w} height={34} />
      ))}
    </div>
  );
}

/* ============================================================================
   13. AUTH (/login, /register) & DEFAULT DASHBOARD FALLBACK
   ============================================================================ */
export function AuthCardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat formulir autentikasi"
      style={{
        minHeight: "100dvh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <div className="skeleton-card" style={{ width: "100%", maxWidth: 420, padding: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <Skeleton circle width={72} height={72} />
          <Skeleton width={210} height={26} borderRadius={8} />
          <Skeleton width={250} height={14} borderRadius={5} />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <Skeleton width={90} height={12} borderRadius={4} style={{ marginBottom: 6 }} />
            <Skeleton width="100%" height={44} borderRadius={10} />
          </div>
        ))}
        <Skeleton pill width="100%" height={46} style={{ marginTop: 18 }} />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="sk-shell sk-shell-1100" role="status" aria-label="Memuat halaman">
      <SkHeroHeader badgeWidth={155} titleWidth="min(260px, 74%)" subtitleWidth="min(390px, 90%)" centered={false} />
      <Skeleton pill width="min(360px, 100%)" height={44} style={{ marginBottom: 24 }} />
      <div className="sk-grid-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton-card" style={{ padding: 18 }}>
            <Skeleton width="100%" height={135} borderRadius={12} style={{ marginBottom: 14 }} />
            <Skeleton width="76%" height={18} borderRadius={6} style={{ marginBottom: 8 }} />
            <Skeleton width="52%" height={13} borderRadius={5} />
          </div>
        ))}
      </div>
    </div>
  );
}

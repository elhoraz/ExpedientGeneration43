import React from "react";

export function Skeleton({
  className = "",
  style = {},
  width,
  height,
}: {
  className?: string;
  style?: React.CSSProperties;
  width?: string | number;
  height?: string | number;
}) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined,
        ...style,
      }}
    />
  );
}

// 1. Direktori / Dossier Swiper Card Skeleton
export function DossierSkeleton() {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "calc(100vh - 140px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "100px 20px 40px",
      }}
    >
      {/* Search Pill Skeleton */}
      <div style={{ width: "90%", maxWidth: "500px", marginBottom: "35px" }}>
        <Skeleton height={56} className="skeleton-pill" style={{ width: "100%" }} />
      </div>

      {/* Center Card Skeleton */}
      <div
        className="skeleton-card"
        style={{
          width: "320px",
          maxWidth: "90vw",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "35px 25px",
        }}
      >
        {/* Photo Ring */}
        <Skeleton width={140} height={140} className="skeleton-circle" style={{ marginBottom: "25px" }} />
        {/* Name */}
        <Skeleton width={180} height={28} style={{ marginBottom: "12px", borderRadius: "6px" }} />
        <Skeleton width={120} height={16} style={{ marginBottom: "28px", borderRadius: "4px" }} />
        {/* Detail Lines */}
        <Skeleton width="80%" height={14} style={{ marginBottom: "10px", borderRadius: "4px" }} />
        <Skeleton width="60%" height={14} style={{ marginBottom: "25px", borderRadius: "4px" }} />
        {/* Quote */}
        <Skeleton width="90%" height={20} style={{ marginBottom: "25px", borderRadius: "4px" }} />
        {/* Action Button */}
        <Skeleton width={48} height={48} className="skeleton-circle" />
      </div>
    </div>
  );
}

// 2. Profile Page Skeleton
export function ProfileSkeleton() {
  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "100px 20px 50px",
      }}
    >
      {/* Header Profile Box */}
      <div
        className="skeleton-card"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "40px 20px",
          marginBottom: "30px",
        }}
      >
        <Skeleton width={130} height={130} className="skeleton-circle" style={{ marginBottom: "20px" }} />
        <Skeleton width={200} height={28} style={{ marginBottom: "10px", borderRadius: "6px" }} />
        <Skeleton width={140} height={16} style={{ marginBottom: "20px", borderRadius: "4px" }} />
        <div style={{ display: "flex", gap: "10px" }}>
          <Skeleton width={100} height={36} className="skeleton-pill" />
          <Skeleton width={100} height={36} className="skeleton-pill" />
        </div>
      </div>

      {/* Grid of Profile Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
        <div className="skeleton-card" style={{ height: "180px" }}>
          <Skeleton width={120} height={20} style={{ marginBottom: "15px" }} />
          <Skeleton width="100%" height={14} style={{ marginBottom: "8px" }} />
          <Skeleton width="80%" height={14} />
        </div>
        <div className="skeleton-card" style={{ height: "180px" }}>
          <Skeleton width={120} height={20} style={{ marginBottom: "15px" }} />
          <Skeleton width="100%" height={14} style={{ marginBottom: "8px" }} />
          <Skeleton width="80%" height={14} />
        </div>
      </div>
    </div>
  );
}

// 3. Galeri Page Skeleton
export function GaleriSkeleton() {
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "100px 20px 50px" }}>
      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <Skeleton width={220} height={32} style={{ margin: "0 auto 12px", borderRadius: "6px" }} />
        <Skeleton width={320} height={16} style={{ margin: "0 auto", borderRadius: "4px" }} />
      </div>

      {/* Grid of Gallery Photos */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "24px",
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton-card" style={{ padding: "12px", height: "300px" }}>
            <Skeleton width="100%" height="210px" style={{ borderRadius: "14px", marginBottom: "12px" }} />
            <Skeleton width="70%" height={18} style={{ marginBottom: "6px" }} />
            <Skeleton width="40%" height={12} />
          </div>
        ))}
      </div>
    </div>
  );
}

// 4. Fitur Page Skeleton
export function FiturSkeleton() {
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "100px 20px 50px" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <Skeleton width={260} height={36} style={{ margin: "0 auto 12px" }} />
        <Skeleton width={360} height={16} style={{ margin: "0 auto" }} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "20px",
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="skeleton-card" style={{ height: "220px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <Skeleton width={50} height={50} className="skeleton-circle" style={{ marginBottom: "15px" }} />
              <Skeleton width="80%" height={22} style={{ marginBottom: "10px" }} />
              <Skeleton width="100%" height={14} style={{ marginBottom: "6px" }} />
              <Skeleton width="60%" height={14} />
            </div>
            <Skeleton width={100} height={28} className="skeleton-pill" />
          </div>
        ))}
      </div>
    </div>
  );
}

// 5. Chat Inbox Skeleton
export function ChatSkeleton() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "100px 20px 50px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <Skeleton width={180} height={32} style={{ marginBottom: "8px" }} />
          <Skeleton width={240} height={16} />
        </div>
        <Skeleton width={130} height={42} className="skeleton-pill" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="skeleton-card"
            style={{
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <Skeleton width={52} height={52} className="skeleton-circle" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <Skeleton width="35%" height={18} />
                <Skeleton width={50} height={12} />
              </div>
              <Skeleton width="75%" height={14} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 6. Generic Adaptive Dashboard Skeleton Fallback
export function DashboardSkeleton() {
  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "100px 20px 60px" }}>
      <div style={{ marginBottom: "35px" }}>
        <Skeleton width={220} height={32} style={{ marginBottom: "10px" }} />
        <Skeleton width={340} height={16} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-card" style={{ height: "240px", padding: "24px" }}>
            <Skeleton width="40%" height={20} style={{ marginBottom: "16px" }} />
            <Skeleton width="100%" height={14} style={{ marginBottom: "8px" }} />
            <Skeleton width="90%" height={14} style={{ marginBottom: "8px" }} />
            <Skeleton width="60%" height={14} style={{ marginBottom: "20px" }} />
            <Skeleton width="100%" height={60} style={{ borderRadius: "12px" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

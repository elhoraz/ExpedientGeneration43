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

// 1. Direktori Alumni (Horizontal Coverflow Swiper Simulator)
export function DossierSkeleton() {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "calc(100vh - 100px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 20px 40px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Search Pill Skeleton */}
      <div style={{ width: "90%", maxWidth: "480px", marginBottom: "40px" }}>
        <Skeleton height={52} className="skeleton-pill" style={{ width: "100%" }} />
      </div>

      {/* Horizontal Carousel Peek (Left Card, Center Card, Right Card) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          width: "100%",
          maxWidth: "1100px",
          position: "relative",
        }}
      >
        {/* Left Peek Card (desktop only) */}
        <div
          className="skeleton-card hide-mobile"
          style={{
            width: "280px",
            height: "440px",
            opacity: 0.35,
            transform: "scale(0.85) rotateY(15deg)",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "30px 20px",
          }}
        >
          <Skeleton width={110} height={110} className="skeleton-circle" style={{ marginBottom: "20px" }} />
          <Skeleton width={150} height={22} style={{ marginBottom: "10px" }} />
          <Skeleton width={90} height={14} style={{ marginBottom: "20px" }} />
          <Skeleton width="80%" height={12} style={{ marginBottom: "8px" }} />
          <Skeleton width="60%" height={12} />
        </div>

        {/* Center Main Card */}
        <div
          className="skeleton-card"
          style={{
            width: "320px",
            maxWidth: "88vw",
            height: "470px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "35px 25px",
            zIndex: 10,
            boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 35px rgba(212,175,55,0.15)",
          }}
        >
          {/* Photo Ring */}
          <Skeleton width={130} height={130} className="skeleton-circle" style={{ marginBottom: "20px" }} />
          {/* Name & Nick */}
          <Skeleton width={200} height={26} style={{ marginBottom: "8px", borderRadius: "6px" }} />
          <Skeleton width={110} height={16} style={{ marginBottom: "24px", borderRadius: "4px" }} />
          {/* Details (City, Gender) */}
          <Skeleton width="75%" height={14} style={{ marginBottom: "8px" }} />
          <Skeleton width="55%" height={14} style={{ marginBottom: "20px" }} />
          {/* Quote Bar */}
          <Skeleton width="90%" height={32} style={{ marginBottom: "24px", borderRadius: "8px" }} />
          {/* Action Row */}
          <div style={{ display: "flex", gap: "12px", marginTop: "auto" }}>
            <Skeleton width={42} height={42} className="skeleton-circle" />
            <Skeleton width={42} height={42} className="skeleton-circle" />
            <Skeleton width={42} height={42} className="skeleton-circle" />
          </div>
        </div>

        {/* Right Peek Card (desktop only) */}
        <div
          className="skeleton-card hide-mobile"
          style={{
            width: "280px",
            height: "440px",
            opacity: 0.35,
            transform: "scale(0.85) rotateY(-15deg)",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "30px 20px",
          }}
        >
          <Skeleton width={110} height={110} className="skeleton-circle" style={{ marginBottom: "20px" }} />
          <Skeleton width={150} height={22} style={{ marginBottom: "10px" }} />
          <Skeleton width={90} height={14} style={{ marginBottom: "20px" }} />
          <Skeleton width="80%" height={12} style={{ marginBottom: "8px" }} />
          <Skeleton width="60%" height={12} />
        </div>
      </div>

      {/* Pagination dots */}
      <div style={{ display: "flex", gap: "8px", marginTop: "30px" }}>
        <Skeleton width={10} height={10} className="skeleton-circle" />
        <Skeleton width={24} height={10} className="skeleton-pill" />
        <Skeleton width={10} height={10} className="skeleton-circle" />
      </div>
    </div>
  );
}

// 2. Baitul Maal (3-Pillar Finance & Ledger Shimmer)
export function BaitulMaalSkeleton() {
  return (
    <div style={{ maxWidth: "1150px", margin: "0 auto", padding: "80px 20px 60px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "35px", flexWrap: "wrap", gap: "16px" }}>
        <Skeleton width={140} height={38} className="skeleton-pill" />
        <div style={{ textAlign: "right" }}>
          <Skeleton width={200} height={32} style={{ marginBottom: "8px", marginLeft: "auto" }} />
          <Skeleton width={280} height={16} style={{ marginLeft: "auto" }} />
        </div>
      </div>

      {/* 3-Pillar Financial Dashboard */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        {/* Total Saldo (Primary) */}
        <div className="skeleton-card" style={{ padding: "26px", border: "1px solid rgba(212,175,55,0.3)" }}>
          <Skeleton width={40} height={40} className="skeleton-circle" style={{ marginBottom: "16px" }} />
          <Skeleton width={130} height={14} style={{ marginBottom: "10px" }} />
          <Skeleton width={220} height={36} style={{ marginBottom: "16px" }} />
          <Skeleton width="85%" height={12} />
        </div>
        {/* Pemasukan */}
        <div className="skeleton-card" style={{ padding: "26px" }}>
          <Skeleton width={40} height={40} className="skeleton-circle" style={{ marginBottom: "16px" }} />
          <Skeleton width={120} height={14} style={{ marginBottom: "10px" }} />
          <Skeleton width={190} height={32} style={{ marginBottom: "16px" }} />
          <Skeleton width="60%" height={12} />
        </div>
        {/* Pengeluaran */}
        <div className="skeleton-card" style={{ padding: "26px" }}>
          <Skeleton width={40} height={40} className="skeleton-circle" style={{ marginBottom: "16px" }} />
          <Skeleton width={120} height={14} style={{ marginBottom: "10px" }} />
          <Skeleton width={190} height={32} style={{ marginBottom: "16px" }} />
          <Skeleton width="60%" height={12} />
        </div>
      </div>

      {/* Program Cards Preview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", marginBottom: "45px" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "15px" }}>
              <Skeleton width={44} height={44} className="skeleton-circle" />
              <div>
                <Skeleton width={140} height={18} style={{ marginBottom: "6px" }} />
                <Skeleton width={90} height={12} />
              </div>
            </div>
            <Skeleton width="100%" height={8} className="skeleton-pill" style={{ marginBottom: "12px" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Skeleton width={100} height={12} />
              <Skeleton width={35} height={12} />
            </div>
          </div>
        ))}
      </div>

      {/* Ledger Section */}
      <div className="skeleton-card" style={{ padding: "28px" }}>
        {/* Ledger Header & Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <Skeleton width={160} height={24} style={{ marginBottom: "8px" }} />
            <Skeleton width={260} height={14} />
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Skeleton width={90} height={36} className="skeleton-pill" />
            <Skeleton width={100} height={36} className="skeleton-pill" />
          </div>
        </div>

        {/* Ledger Table Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 18px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(212,175,55,0.08)",
                gap: "15px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <Skeleton width={42} height={42} className="skeleton-circle" style={{ flexShrink: 0 }} />
                <div>
                  <Skeleton width={200} height={16} style={{ marginBottom: "6px" }} />
                  <Skeleton width={130} height={12} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Skeleton width={110} height={20} />
                <Skeleton width={70} height={30} className="skeleton-pill hide-mobile" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 3. Beranda / Home Feed Skeleton
export function BerandaSkeleton() {
  return (
    <div style={{ maxWidth: "1150px", margin: "0 auto", padding: "80px 20px 60px" }}>
      {/* Hero / Crest Shimmer */}
      <div
        className="skeleton-card"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "50px 20px",
          marginBottom: "35px",
          textAlign: "center",
        }}
      >
        <Skeleton width={110} height={110} className="skeleton-circle" style={{ marginBottom: "25px" }} />
        <Skeleton width={260} height={34} style={{ marginBottom: "12px" }} />
        <Skeleton width={380} height={18} style={{ maxWidth: "90%", marginBottom: "25px" }} />
        <div style={{ display: "flex", gap: "12px" }}>
          <Skeleton width={130} height={42} className="skeleton-pill" />
          <Skeleton width={130} height={42} className="skeleton-pill" />
        </div>
      </div>

      {/* Lore Banner */}
      <div className="skeleton-card" style={{ padding: "20px 25px", marginBottom: "35px" }}>
        <Skeleton width="85%" height={16} style={{ margin: "0 auto 8px" }} />
        <Skeleton width="45%" height={14} style={{ margin: "0 auto" }} />
      </div>

      {/* Grid Features */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card" style={{ height: "200px", padding: "22px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <Skeleton width={46} height={46} className="skeleton-circle" style={{ marginBottom: "14px" }} />
              <Skeleton width="70%" height={20} style={{ marginBottom: "8px" }} />
              <Skeleton width="90%" height={14} />
            </div>
            <Skeleton width={90} height={26} className="skeleton-pill" />
          </div>
        ))}
      </div>
    </div>
  );
}

// 4. Profile Page Skeleton (Accurately Matching ProfilClient)
export function ProfileSkeleton() {
  return (
    <div style={{ maxWidth: "850px", margin: "0 auto", padding: "80px 20px 60px" }}>
      {/* Nav Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <Skeleton width={110} height={38} className="skeleton-pill" />
        <div style={{ display: "flex", gap: "10px" }}>
          <Skeleton width={120} height={38} className="skeleton-pill" />
          <Skeleton width={90} height={38} className="skeleton-pill" />
        </div>
      </div>

      {/* Dashboard Header */}
      <div style={{ textAlign: "center", marginBottom: "35px" }}>
        <Skeleton width={240} height={36} style={{ margin: "0 auto 10px" }} />
        <Skeleton width={200} height={16} style={{ margin: "0 auto 18px" }} />
        <Skeleton width={180} height={36} className="skeleton-pill" style={{ margin: "0 auto" }} />
      </div>

      {/* Tab Switcher Pills */}
      <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "35px" }}>
        <Skeleton width={140} height={44} className="skeleton-pill" />
        <Skeleton width={140} height={44} className="skeleton-pill" />
      </div>

      {/* Profile Form Card */}
      <div className="skeleton-card" style={{ padding: "35px 28px" }}>
        {/* Avatar Upload Ring */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "35px" }}>
          <Skeleton width={120} height={120} className="skeleton-circle" style={{ marginBottom: "15px" }} />
          <Skeleton width={140} height={32} className="skeleton-pill" />
        </div>

        {/* Form Inputs Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", marginBottom: "30px" }}>
          <div>
            <Skeleton width={100} height={14} style={{ marginBottom: "8px" }} />
            <Skeleton width="100%" height={48} style={{ borderRadius: "10px" }} />
          </div>
          <div>
            <Skeleton width={100} height={14} style={{ marginBottom: "8px" }} />
            <Skeleton width="100%" height={48} style={{ borderRadius: "10px" }} />
          </div>
          <div>
            <Skeleton width={100} height={14} style={{ marginBottom: "8px" }} />
            <Skeleton width="100%" height={48} style={{ borderRadius: "10px" }} />
          </div>
          <div>
            <Skeleton width={100} height={14} style={{ marginBottom: "8px" }} />
            <Skeleton width="100%" height={48} style={{ borderRadius: "10px" }} />
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ textAlign: "center" }}>
          <Skeleton width={200} height={48} className="skeleton-pill" style={{ margin: "0 auto" }} />
        </div>
      </div>
    </div>
  );
}

// 5. Galeri Page Skeleton
export function GaleriSkeleton() {
  return (
    <div style={{ maxWidth: "1150px", margin: "0 auto", padding: "80px 20px 60px" }}>
      {/* Title & Floating Music Pill */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "35px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <Skeleton width={220} height={34} style={{ marginBottom: "8px" }} />
          <Skeleton width={320} height={16} />
        </div>
        <Skeleton width={150} height={42} className="skeleton-pill" />
      </div>

      {/* Filter Chips Row */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "35px", overflowX: "hidden" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} width={i === 1 ? 80 : 110} height={36} className="skeleton-pill" />
        ))}
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
          <div key={i} className="skeleton-card" style={{ padding: "14px", height: "310px" }}>
            <Skeleton width="100%" height="220px" style={{ borderRadius: "14px", marginBottom: "12px" }} />
            <Skeleton width="75%" height={18} style={{ marginBottom: "6px" }} />
            <Skeleton width="45%" height={12} />
          </div>
        ))}
      </div>
    </div>
  );
}

// 6. Fitur Page Skeleton
export function FiturSkeleton() {
  return (
    <div style={{ maxWidth: "1150px", margin: "0 auto", padding: "80px 20px 60px" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <Skeleton width={260} height={38} style={{ margin: "0 auto 12px" }} />
        <Skeleton width={340} height={16} style={{ margin: "0 auto" }} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "22px",
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="skeleton-card" style={{ height: "230px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <Skeleton width={48} height={48} className="skeleton-circle" style={{ marginBottom: "16px" }} />
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

// 7. Chat Inbox Skeleton
export function ChatSkeleton() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "80px 20px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <Skeleton width={180} height={32} style={{ marginBottom: "8px" }} />
          <Skeleton width={240} height={16} />
        </div>
        <Skeleton width={130} height={40} className="skeleton-pill" />
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
            <Skeleton width={50} height={50} className="skeleton-circle" style={{ flexShrink: 0 }} />
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

// 8. Generic Adaptive Dashboard Skeleton Fallback
export function DashboardSkeleton() {
  return (
    <div style={{ maxWidth: "1050px", margin: "0 auto", padding: "80px 20px 60px" }}>
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
            <Skeleton width="100%" height={50} style={{ borderRadius: "12px" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

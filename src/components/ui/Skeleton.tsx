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
function SkHeroHeader({
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

function SkChipRow({ widths = [82, 98, 76, 108, 90] }: { widths?: number[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {widths.map((w, idx) => (
        <Skeleton key={idx} pill width={w} height={34} />
      ))}
    </div>
  );
}

/* ============================================================================
   1. DIREKTORI ALUMNI (/direktori)
   ============================================================================ */
export function DossierSkeleton() {
  return (
    <div className="sk-shell sk-shell-1280" role="status" aria-label="Memuat direktori alumni">
      {/* Compact Header + Tab Switcher */}
      <div className="sk-direktori-header">
        <div>
          <Skeleton width="min(230px, 68%)" height={28} borderRadius={8} style={{ marginBottom: 8 }} />
          <Skeleton width="min(200px, 55%)" height={14} borderRadius={5} />
        </div>
        <Skeleton width="min(340px, 100%)" height={46} borderRadius={12} />
      </div>

      {/* Control Deck: Search + Filter Chips + Sort & View Bar */}
      <div className="skeleton-card" style={{ padding: 14, marginBottom: 16, borderRadius: 14 }}>
        <Skeleton width="100%" height={44} borderRadius={12} style={{ marginBottom: 10 }} />
        <SkChipRow widths={[84, 72, 72, 68, 68]} />
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 10 }}>
          <Skeleton width={116} height={16} borderRadius={5} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Skeleton width={108} height={40} borderRadius={10} />
            <Skeleton width={120} height={40} borderRadius={10} />
          </div>
        </div>
      </div>

      {/* Responsive Contact Cards (mobile horizontal row -> desktop 2/3/4-col cards) */}
      <div className="sk-direktori-grid">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="skeleton-card sk-direktori-card">
            <div className="sk-direktori-card-main">
              <Skeleton circle width={52} height={52} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Skeleton width="72%" height={16} borderRadius={6} style={{ marginBottom: 6 }} />
                <Skeleton width="54%" height={13} borderRadius={5} style={{ marginBottom: 6 }} />
                <Skeleton width="44%" height={12} borderRadius={5} />
              </div>
            </div>
            <div className="sk-direktori-card-actions">
              <Skeleton width={40} height={40} borderRadius={10} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   2. FITUR HUB (/fitur) — Mobile Widget Hub vs Desktop Vault Grid
   ============================================================================ */
export function FiturSkeleton() {
  return (
    <div role="status" aria-label="Memuat pusat fitur">
      {/* MOBILE <= 900px: .mobile-widget-hub */}
      <div className="sk-fitur-mobile">
        {/* Profile Greeting Widget Card */}
        <div className="skeleton-card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Skeleton circle width={58} height={58} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Skeleton width="46%" height={12} borderRadius={4} style={{ marginBottom: 6 }} />
              <Skeleton width="76%" height={18} borderRadius={6} style={{ marginBottom: 6 }} />
              <Skeleton pill width={104} height={20} />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Skeleton circle width={34} height={34} />
              <Skeleton circle width={34} height={34} />
            </div>
          </div>
        </div>

        {/* Row 1: Kas & Birthday 2-col Bento */}
        <div className="sk-fitur-bento-2" style={{ marginBottom: 12 }}>
          {[1, 2].map((i) => (
            <div key={i} className="skeleton-card" style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <Skeleton width={34} height={34} borderRadius={10} />
                <Skeleton pill width={52} height={20} />
              </div>
              <Skeleton width="65%" height={12} borderRadius={4} style={{ marginBottom: 6 }} />
              <Skeleton width="88%" height={20} borderRadius={6} />
            </div>
          ))}
        </div>

        {/* Full-width Agenda Event Card */}
        <div className="skeleton-card" style={{ padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Skeleton width={46} height={46} borderRadius={12} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Skeleton width="42%" height={12} borderRadius={4} style={{ marginBottom: 6 }} />
              <Skeleton width="82%" height={17} borderRadius={6} />
            </div>
            <Skeleton circle width={30} height={30} />
          </div>
        </div>

        {/* Row 2: Chat & Photobooth 2-col Bento */}
        <div className="sk-fitur-bento-2" style={{ marginBottom: 12 }}>
          {[3, 4].map((i) => (
            <div key={i} className="skeleton-card" style={{ padding: 14 }}>
              <Skeleton width={32} height={32} borderRadius={10} style={{ marginBottom: 10 }} />
              <Skeleton width="74%" height={15} borderRadius={5} style={{ marginBottom: 6 }} />
              <Skeleton width="55%" height={12} borderRadius={4} />
            </div>
          ))}
        </div>

        {/* Khatam Progress Card */}
        <div className="skeleton-card" style={{ padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <Skeleton width="52%" height={16} borderRadius={5} />
            <Skeleton pill width={68} height={22} />
          </div>
          <Skeleton pill width="100%" height={10} style={{ marginBottom: 10 }} />
          <Skeleton width="70%" height={12} borderRadius={4} />
        </div>

        {/* Quick Search Bar */}
        <Skeleton pill width="100%" height={44} style={{ marginBottom: 16 }} />

        {/* App Drawer 4-col Icon Grid */}
        <div className="sk-fitur-apps-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Skeleton width={56} height={56} borderRadius={16} />
              <Skeleton width={48} height={11} borderRadius={4} />
            </div>
          ))}
        </div>
      </div>

      {/* DESKTOP > 900px: .desktop-vault-view */}
      <div className="sk-fitur-desktop">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28, gap: 12 }}>
          <Skeleton width={58} height={58} borderRadius={16} />
          <Skeleton width={280} height={36} borderRadius={10} />
          <Skeleton width={430} height={15} borderRadius={6} />
          <div style={{ marginTop: 8 }}>
            <SkChipRow widths={[86, 108, 104, 118, 96]} />
          </div>
        </div>

        <div className="sk-fitur-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="skeleton-card" style={{ padding: 20, height: 290, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Skeleton width={46} height={46} borderRadius={14} />
                <Skeleton pill width={86} height={24} />
              </div>
              <div>
                <Skeleton width="74%" height={22} borderRadius={6} style={{ marginBottom: 10 }} />
                <Skeleton width="100%" height={13} borderRadius={5} style={{ marginBottom: 6 }} />
                <Skeleton width="80%" height={13} borderRadius={5} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Skeleton pill width={110} height={34} />
                <Skeleton circle width={32} height={32} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   3. GALERI & MEMORI (/galeri)
   ============================================================================ */
export function GaleriSkeleton() {
  const masonryHeights = [220, 165, 255, 185, 235, 175, 245, 200];
  return (
    <div className="sk-galeri-wrap" role="status" aria-label="Memuat galeri angkatan">
      {/* Top Mode Switcher Dock */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
        <Skeleton pill width="min(310px, 100%)" height={44} />
      </div>

      {/* Stories Ring Track */}
      <div style={{ display: "flex", gap: 16, overflow: "hidden", marginBottom: 22, paddingBottom: 4 }}>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <Skeleton circle width={64} height={64} />
            <Skeleton width={50} height={11} borderRadius={4} />
          </div>
        ))}
      </div>

      {/* Vault Filter Control Bar */}
      <div className="skeleton-card" style={{ padding: 14, marginBottom: 22, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
        <Skeleton pill width="min(260px, 100%)" height={38} />
        <SkChipRow widths={[62, 68, 68, 68, 128]} />
      </div>

      {/* 2 / 3 / 4 Column Masonry Placeholder */}
      <div className="sk-masonry-grid">
        {masonryHeights.map((h, i) => (
          <div key={i} className="sk-masonry-item">
            <Skeleton width="100%" height={h} borderRadius={16} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   4. PROFIL SAYA (/profil)
   ============================================================================ */
export function ProfileSkeleton() {
  return (
    <div className="sk-shell sk-shell-1150" role="status" aria-label="Memuat profil pengguna">
      {/* Top Quick Nav Pills + Prestise Badge */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Skeleton pill width={110} height={36} />
          <Skeleton pill width={120} height={36} />
          <Skeleton pill width={104} height={36} className="hide-mobile" />
        </div>
        <Skeleton pill width={140} height={38} />
      </div>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Skeleton width="min(250px, 70%)" height={34} borderRadius={10} style={{ marginBottom: 8 }} />
        <Skeleton width="min(360px, 90%)" height={15} borderRadius={6} />
      </div>

      {/* Mobile Tab Navigation (hidden > 900px) */}
      <div className="sk-profil-tabs" style={{ marginBottom: 18 }}>
        <Skeleton pill width={96} height={36} style={{ flexShrink: 0 }} />
        <Skeleton pill width={96} height={36} style={{ flexShrink: 0 }} />
        <Skeleton pill width={96} height={36} style={{ flexShrink: 0 }} />
        <Skeleton pill width={96} height={36} style={{ flexShrink: 0 }} />
      </div>

      {/* Main 1.5fr / 1fr Grid */}
      <div className="sk-profil-grid">
        {/* Left: Avatar & Profile Form */}
        <div className="skeleton-card">
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
            <Skeleton circle width={84} height={84} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Skeleton width="64%" height={22} borderRadius={8} style={{ marginBottom: 8 }} />
              <Skeleton width="44%" height={14} borderRadius={6} style={{ marginBottom: 10 }} />
              <Skeleton pill width={132} height={32} />
            </div>
          </div>

          <div className="sk-grid-2" style={{ marginBottom: 14 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton width={95} height={12} borderRadius={4} style={{ marginBottom: 6 }} />
                <Skeleton width="100%" height={42} borderRadius={10} />
              </div>
            ))}
          </div>

          <Skeleton width={110} height={12} borderRadius={4} style={{ marginBottom: 6 }} />
          <Skeleton width="100%" height={84} borderRadius={10} style={{ marginBottom: 18 }} />
          <Skeleton pill width={160} height={44} />
        </div>

        {/* Right: Digital ID Card + Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="skeleton-card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Skeleton width={115} height={16} borderRadius={6} />
              <Skeleton pill width={72} height={24} />
            </div>
            <Skeleton width="100%" height={165} borderRadius={14} style={{ marginBottom: 14 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <Skeleton pill width="50%" height={36} />
              <Skeleton pill width="50%" height={36} />
            </div>
          </div>

          <div className="skeleton-card" style={{ padding: 20 }}>
            <Skeleton width="55%" height={18} borderRadius={6} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={42} borderRadius={10} style={{ marginBottom: 10 }} />
            <Skeleton width="100%" height={42} borderRadius={10} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   5. BERANDA (/beranda) — Fullscreen Mecha Hero Stage + 3-Col Stats + Hall
   ============================================================================ */
export function BerandaSkeleton() {
  return (
    <div role="status" aria-label="Memuat beranda angkatan">
      {/* Stage 1: Full-height Hero matching .mecha-stage */}
      <div className="sk-beranda-hero">
        <Skeleton pill width={190} height={30} />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%", maxWidth: 460 }}>
          <Skeleton circle width={150} height={150} />
          <Skeleton width="min(300px, 85%)" height={40} borderRadius={12} />
          <Skeleton width="min(360px, 92%)" height={16} borderRadius={6} />
        </div>

        {/* Bottom HUD Pill Controls */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, maxWidth: "100%" }}>
          <Skeleton pill width={132} height={42} />
          <Skeleton pill width={120} height={42} />
          <Skeleton pill width={112} height={42} className="hide-mobile" />
        </div>
      </div>

      {/* Stage 2: Museum Epigraph & 3-Column Metrics */}
      <div className="sk-shell sk-shell-960">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <Skeleton width="min(420px, 92%)" height={20} borderRadius={8} />
          <Skeleton width="min(300px, 78%)" height={14} borderRadius={6} />
        </div>

        {/* Always 3 Columns even on mobile (matches .stats-grid in beranda.css) */}
        <div className="sk-beranda-stats" style={{ marginBottom: 24 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card" style={{ padding: 14, textAlign: "center" }}>
              <Skeleton width="55%" height={28} borderRadius={8} style={{ margin: "0 auto 8px" }} />
              <Skeleton width="80%" height={12} borderRadius={4} style={{ margin: "0 auto" }} />
            </div>
          ))}
        </div>

        {/* Khatam Banner */}
        <div className="skeleton-card" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Skeleton width="48%" height={20} borderRadius={6} />
            <Skeleton pill width={92} height={28} />
          </div>
          <Skeleton pill width="100%" height={12} style={{ marginBottom: 12 }} />
          <Skeleton width="65%" height={13} borderRadius={5} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   6. BAITUL MAAL (/baitul-maal)
   ============================================================================ */
export function BaitulMaalSkeleton() {
  return (
    <div className="sk-shell sk-shell-1100" role="status" aria-label="Memuat data Baitul Maal">
      {/* Header left-aligned */}
      <div style={{ marginBottom: 24 }}>
        <Skeleton width="min(260px, 75%)" height={36} borderRadius={10} style={{ marginBottom: 8 }} />
        <Skeleton width="min(410px, 92%)" height={15} borderRadius={6} />
      </div>

      {/* 3 KPI Summary Cards */}
      <div className="sk-grid-3" style={{ marginBottom: 22 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <Skeleton width="44%" height={13} borderRadius={5} />
              <Skeleton circle width={36} height={36} />
            </div>
            <Skeleton width="72%" height={30} borderRadius={8} style={{ marginBottom: 8 }} />
            <Skeleton width="54%" height={12} borderRadius={5} />
          </div>
        ))}
      </div>

      {/* Action Dock Pills */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, marginBottom: 28 }}>
        <Skeleton pill width={150} height={42} />
        <Skeleton pill width={145} height={42} />
        <Skeleton pill width={125} height={42} />
      </div>

      {/* 3 Program Donasi Campaigns */}
      <div className="sk-grid-3" style={{ marginBottom: 28 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-card" style={{ padding: 18 }}>
            <Skeleton width="100%" height={124} borderRadius={12} style={{ marginBottom: 14 }} />
            <Skeleton width="78%" height={18} borderRadius={6} style={{ marginBottom: 8 }} />
            <Skeleton pill width="100%" height={8} style={{ marginBottom: 10 }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Skeleton width="42%" height={12} borderRadius={4} />
              <Skeleton width="32%" height={12} borderRadius={4} />
            </div>
          </div>
        ))}
      </div>

      {/* Transaction Ledger Rows (Zero mobile horizontal overflow) */}
      <div className="skeleton-card" style={{ padding: 18 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", marginBottom: 16 }}>
          <Skeleton pill width="min(260px, 100%)" height={38} />
          <SkChipRow widths={[72, 86, 86]} />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "12px 0",
              borderBottom: i < 4 ? "1px solid var(--glass-border, rgba(212,175,55,0.1))" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
              <Skeleton circle width={42} height={42} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Skeleton width="70%" height={16} borderRadius={5} style={{ marginBottom: 6 }} />
                <Skeleton width="48%" height={12} borderRadius={4} />
              </div>
            </div>
            <Skeleton pill width={96} height={26} style={{ flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   7. CHAT INBOX (/chat) & CHAT ROOMS (/chat/lounge, /chat/personal/[id])
   ============================================================================ */
export function ChatSkeleton() {
  return (
    <div className="sk-shell sk-shell-850" role="status" aria-label="Memuat kotak masuk chat">
      <div style={{ marginBottom: 20 }}>
        <Skeleton width="min(210px, 65%)" height={34} borderRadius={10} style={{ marginBottom: 8 }} />
        <Skeleton width="min(320px, 85%)" height={14} borderRadius={6} />
      </div>

      {/* Featured Lounge Angkatan Entry Card */}
      <div className="skeleton-card" style={{ padding: 16, marginBottom: 18, display: "flex", alignItems: "center", gap: 14 }}>
        <Skeleton circle width={50} height={50} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Skeleton width="58%" height={18} borderRadius={6} style={{ marginBottom: 6 }} />
          <Skeleton width="40%" height={12} borderRadius={4} />
        </div>
        <Skeleton pill width={76} height={30} style={{ flexShrink: 0 }} />
      </div>

      <Skeleton pill width="100%" height={44} style={{ marginBottom: 14 }} />
      <div style={{ marginBottom: 18 }}>
        <SkChipRow widths={[74, 108, 92]} />
      </div>

      {/* DM Thread List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton-card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <Skeleton circle width={48} height={48} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 7 }}>
                <Skeleton width="46%" height={16} borderRadius={5} />
                <Skeleton width={42} height={11} borderRadius={4} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                <Skeleton width="76%" height={13} borderRadius={4} />
                {i <= 2 && <Skeleton circle width={20} height={20} style={{ flexShrink: 0 }} />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChatRoomSkeleton({ isLounge = false }: { isLounge?: boolean }) {
  const bubbles = [
    { own: false, w: "58%", h: 48 },
    { own: true, w: "44%", h: 40 },
    { own: false, w: "68%", h: 66 },
    { own: true, w: "52%", h: 46 },
    { own: false, w: "42%", h: 40 },
    { own: true, w: "62%", h: 52 },
  ];

  return (
    <div className="sk-chat-room" role="status" aria-label={isLounge ? "Memuat ruang obrolan angkatan" : "Memuat ruang obrolan"}>
      {/* Sticky Header mirroring .chat-room-header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 18px",
          borderBottom: "1px solid var(--glass-border, rgba(212,175,55,0.2))",
          background: "var(--glass-bg, rgba(10,14,12,0.8))",
          flexShrink: 0,
        }}
      >
        <Skeleton circle width={40} height={40} style={{ flexShrink: 0 }} />
        <Skeleton circle width={42} height={42} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Skeleton width={isLounge ? 185 : 155} height={18} borderRadius={6} style={{ marginBottom: 6 }} />
          <Skeleton width={110} height={12} borderRadius={4} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Skeleton circle width={36} height={36} />
          <Skeleton circle width={36} height={36} className="hide-mobile" />
        </div>
      </div>

      {/* Alternating Bubbles */}
      <div style={{ flex: 1, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14, overflow: "hidden" }}>
        <div style={{ alignSelf: "center", marginBottom: 4 }}>
          <Skeleton pill width={110} height={22} />
        </div>
        {bubbles.map((b, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
              alignSelf: b.own ? "flex-end" : "flex-start",
              width: "100%",
              justifyContent: b.own ? "flex-end" : "flex-start",
            }}
          >
            {!b.own && <Skeleton circle width={30} height={30} style={{ flexShrink: 0 }} />}
            <Skeleton width={b.w} height={b.h} borderRadius={16} />
          </div>
        ))}
      </div>

      {/* Sticky Composer Bar */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--glass-border, rgba(212,175,55,0.16))",
          background: "var(--glass-bg, rgba(10,14,12,0.85))",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <Skeleton circle width={40} height={40} style={{ flexShrink: 0 }} />
        <Skeleton pill width="100%" height={42} style={{ flex: 1 }} />
        <Skeleton circle width={42} height={42} style={{ flexShrink: 0 }} />
      </div>
    </div>
  );
}

/* ============================================================================
   8. SYNDICATE (/syndicate, /syndicate/[id], /syndicate/create, /syndicate/edit)
   ============================================================================ */
export function SyndicateSkeleton() {
  return (
    <div className="sk-shell sk-shell-1200" role="status" aria-label="Memuat direktori bisnis alumni">
      <SkHeroHeader badgeWidth={185} titleWidth="min(320px, 80%)" subtitleWidth="min(460px, 92%)" />

      <div className="skeleton-card" style={{ padding: 16, marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
        <Skeleton pill width="min(280px, 100%)" height={40} />
        <SkChipRow widths={[78, 92, 84, 96, 138]} />
      </div>

      <div className="sk-grid-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton-card" style={{ padding: 16 }}>
            <Skeleton width="100%" height={140} borderRadius={12} style={{ marginBottom: 14 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <Skeleton circle width={48} height={48} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Skeleton width="76%" height={18} borderRadius={6} style={{ marginBottom: 6 }} />
                <Skeleton width="48%" height={12} borderRadius={4} />
              </div>
            </div>
            <Skeleton width="94%" height={13} borderRadius={4} style={{ marginBottom: 6 }} />
            <Skeleton width="66%" height={13} borderRadius={4} style={{ marginBottom: 14 }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Skeleton pill width={96} height={26} />
              <Skeleton pill width={82} height={32} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SyndicateDetailSkeleton() {
  return (
    <div className="sk-shell sk-shell-1100" role="status" aria-label="Memuat detail usaha">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
        <Skeleton pill width={135} height={36} />
        <Skeleton pill width={110} height={36} />
      </div>

      <div className="skeleton-card" style={{ padding: 20, marginBottom: 22 }}>
        <Skeleton width="100%" height={220} borderRadius={14} style={{ marginBottom: 18 }} />
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <Skeleton width={76} height={76} borderRadius={16} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <Skeleton width="min(280px, 82%)" height={28} borderRadius={8} style={{ marginBottom: 8 }} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Skeleton pill width={92} height={24} />
              <Skeleton pill width={110} height={24} />
            </div>
          </div>
          <Skeleton pill width={145} height={42} />
        </div>
        <Skeleton width="100%" height={14} borderRadius={5} style={{ marginBottom: 8 }} />
        <Skeleton width="88%" height={14} borderRadius={5} />
      </div>

      <div className="sk-grid-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-card" style={{ padding: 14 }}>
            <Skeleton width="100%" height={150} borderRadius={12} style={{ marginBottom: 10 }} />
            <Skeleton width="72%" height={16} borderRadius={5} style={{ marginBottom: 6 }} />
            <Skeleton width="44%" height={14} borderRadius={5} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SyndicateFormSkeleton() {
  return (
    <div className="sk-shell sk-shell-850" role="status" aria-label="Memuat formulir usaha">
      <Skeleton pill width={130} height={36} style={{ marginBottom: 18 }} />
      <Skeleton width="min(280px, 78%)" height={34} borderRadius={10} style={{ marginBottom: 8 }} />
      <Skeleton width="min(390px, 90%)" height={14} borderRadius={5} style={{ marginBottom: 22 }} />

      <div className="skeleton-card" style={{ padding: 22 }}>
        <div className="sk-grid-2" style={{ marginBottom: 16 }}>
          <div>
            <Skeleton width={100} height={12} borderRadius={4} style={{ marginBottom: 6 }} />
            <Skeleton width="100%" height={120} borderRadius={14} />
          </div>
          <div>
            <Skeleton width={100} height={12} borderRadius={4} style={{ marginBottom: 6 }} />
            <Skeleton width="100%" height={120} borderRadius={14} />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <Skeleton width={120} height={12} borderRadius={4} style={{ marginBottom: 6 }} />
            <Skeleton width="100%" height={44} borderRadius={10} />
          </div>
        ))}
        <Skeleton width="100%" height={96} borderRadius={10} style={{ marginBottom: 20 }} />
        <Skeleton pill width={185} height={46} />
      </div>
    </div>
  );
}

/* Public Standalone Microsite (/b/[slug]) */
export function MicrositePublicSkeleton() {
  return (
    <div className="standalone-microsite-viewport" role="status" aria-label="Memuat halaman usaha">
      <header className="biz-topbar">
        <div className="biz-shell">
          <div className="biz-topbar-inner">
            <Skeleton width={185} height={24} borderRadius={6} />
            <div style={{ display: "flex", gap: 8 }}>
              <Skeleton pill width={104} height={36} />
              <Skeleton pill width={88} height={36} className="hide-mobile" />
            </div>
          </div>
        </div>
      </header>

      <main className="biz-main" style={{ padding: "18px 0 64px" }}>
        <div className="biz-shell">
          <div className="sk-grid-2" style={{ alignItems: "center", marginBottom: 32 }}>
            <div>
              <Skeleton pill width={125} height={26} style={{ marginBottom: 14 }} />
              <Skeleton width="88%" height={42} borderRadius={10} style={{ marginBottom: 12 }} />
              <Skeleton width="95%" height={16} borderRadius={5} style={{ marginBottom: 8 }} />
              <Skeleton width="72%" height={16} borderRadius={5} style={{ marginBottom: 20 }} />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Skeleton pill width={155} height={44} />
                <Skeleton pill width={125} height={44} />
              </div>
            </div>
            <Skeleton width="100%" height={280} borderRadius={18} />
          </div>

          <div className="sk-grid-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card" style={{ padding: 16 }}>
                <Skeleton width="100%" height={150} borderRadius={12} style={{ marginBottom: 12 }} />
                <Skeleton width="70%" height={18} borderRadius={6} style={{ marginBottom: 6 }} />
                <Skeleton width="42%" height={14} borderRadius={5} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ============================================================================
   9. EVENT, TARBIYAH, BUKU TAMU, BIRTHDAY, WASIAT, NEXUS, MULTAZAM
   ============================================================================ */
export function EventSkeleton() {
  return (
    <div className="sk-shell sk-shell-1100" role="status" aria-label="Memuat agenda dan event">
      <SkHeroHeader badgeWidth={160} titleWidth="min(270px, 75%)" subtitleWidth="min(420px, 90%)" />
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <SkChipRow widths={[96, 110, 96]} />
      </div>
      <div className="sk-grid-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card" style={{ padding: 18 }}>
            <Skeleton width="100%" height={170} borderRadius={12} style={{ marginBottom: 14 }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Skeleton pill width={110} height={24} />
              <Skeleton pill width={74} height={24} />
            </div>
            <Skeleton width="82%" height={22} borderRadius={6} style={{ marginBottom: 8 }} />
            <Skeleton width="62%" height={14} borderRadius={5} style={{ marginBottom: 16 }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Skeleton width={90} height={14} borderRadius={4} />
              <Skeleton pill width={118} height={36} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TarbiyahSkeleton() {
  return (
    <div className="sk-shell sk-shell-1100" role="status" aria-label="Memuat pustaka tarbiyah">
      <SkHeroHeader badgeWidth={155} titleWidth="min(280px, 75%)" subtitleWidth="min(430px, 90%)" />
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <SkChipRow widths={[72, 92, 98, 86, 102]} />
      </div>
      <div className="sk-grid-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton-card" style={{ padding: 16 }}>
            <Skeleton width="100%" height={155} borderRadius={12} style={{ marginBottom: 12 }} />
            <Skeleton pill width={86} height={22} style={{ marginBottom: 10 }} />
            <Skeleton width="88%" height={18} borderRadius={6} style={{ marginBottom: 6 }} />
            <Skeleton width="60%" height={13} borderRadius={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BukuTamuSkeleton() {
  return (
    <div className="sk-shell sk-shell-900" role="status" aria-label="Memuat buku tamu">
      <SkHeroHeader badgeWidth={150} titleWidth="min(250px, 72%)" subtitleWidth="min(390px, 90%)" />

      {/* Composer Box */}
      <div className="skeleton-card" style={{ padding: 18, marginBottom: 24 }}>
        <Skeleton width="100%" height={92} borderRadius={12} style={{ marginBottom: 12 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Skeleton pill width={110} height={32} />
          <Skeleton pill width={135} height={40} />
        </div>
      </div>

      {/* Feed Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card" style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <Skeleton circle width={44} height={44} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Skeleton width="45%" height={16} borderRadius={5} style={{ marginBottom: 6 }} />
                <Skeleton width="28%" height={11} borderRadius={4} />
              </div>
            </div>
            <Skeleton width="95%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
            <Skeleton width="76%" height={14} borderRadius={4} style={{ marginBottom: 12 }} />
            <Skeleton pill width={86} height={28} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BirthdayListSkeleton() {
  return (
    <div className="sk-shell sk-shell-1100" role="status" aria-label="Memuat radar milad alumni">
      <SkHeroHeader badgeWidth={165} titleWidth="min(280px, 76%)" subtitleWidth="min(420px, 90%)" />

      {/* Highlight Banner */}
      <div className="skeleton-card" style={{ padding: 20, marginBottom: 22, display: "flex", alignItems: "center", gap: 16 }}>
        <Skeleton circle width={68} height={68} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Skeleton pill width={115} height={22} style={{ marginBottom: 8 }} />
          <Skeleton width="66%" height={22} borderRadius={6} style={{ marginBottom: 6 }} />
          <Skeleton width="48%" height={14} borderRadius={4} />
        </div>
        <Skeleton pill width={108} height={38} className="hide-mobile" />
      </div>

      <div style={{ marginBottom: 20 }}>
        <SkChipRow widths={[84, 72, 72, 72, 72, 72]} />
      </div>

      <div className="sk-grid-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton-card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
            <Skeleton circle width={56} height={56} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Skeleton width="68%" height={17} borderRadius={5} style={{ marginBottom: 6 }} />
              <Skeleton width="44%" height={13} borderRadius={4} style={{ marginBottom: 8 }} />
              <Skeleton pill width={96} height={24} />
            </div>
            <Skeleton circle width={36} height={36} style={{ flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BirthdayCardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat kartu ucapan milad"
      style={{
        minHeight: "100svh",
        width: "100%",
        maxWidth: 540,
        margin: "0 auto",
        padding: "48px 20px 80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        boxSizing: "border-box",
      }}
    >
      <Skeleton circle width={144} height={144} style={{ marginBottom: 22 }} />
      <Skeleton pill width={150} height={22} style={{ marginBottom: 14 }} />
      <Skeleton width="min(320px, 85%)" height={44} borderRadius={12} style={{ marginBottom: 10 }} />
      <Skeleton width="min(200px, 65%)" height={18} borderRadius={6} style={{ marginBottom: 26 }} />

      <div className="skeleton-card" style={{ width: "100%", padding: 20, marginBottom: 18 }}>
        <Skeleton width="90%" height={14} borderRadius={4} style={{ margin: "0 auto 8px" }} />
        <Skeleton width="76%" height={14} borderRadius={4} style={{ margin: "0 auto 14px" }} />
        <Skeleton pill width={160} height={40} style={{ margin: "0 auto" }} />
      </div>

      <div className="skeleton-card" style={{ width: "100%", padding: 18 }}>
        <Skeleton width="50%" height={18} borderRadius={6} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={56} borderRadius={10} style={{ marginBottom: 10 }} />
        <Skeleton width="100%" height={56} borderRadius={10} />
      </div>
    </div>
  );
}

export function WasiatSkeleton() {
  return (
    <div className="sk-shell sk-shell-960" role="status" aria-label="Memuat kapsul waktu wasiat">
      <Skeleton pill width={125} height={36} style={{ marginBottom: 18 }} />
      <SkHeroHeader badgeWidth={165} titleWidth="min(275px, 76%)" subtitleWidth="min(420px, 90%)" />

      <div className="skeleton-card" style={{ padding: 20, marginBottom: 24 }}>
        <Skeleton width="42%" height={18} borderRadius={6} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={90} borderRadius={12} style={{ marginBottom: 12 }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
          <Skeleton pill width={180} height={38} />
          <Skeleton pill width={145} height={42} />
        </div>
      </div>

      <div className="sk-grid-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card" style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <Skeleton pill width={110} height={24} />
              <Skeleton circle width={32} height={32} />
            </div>
            <Skeleton width="76%" height={18} borderRadius={6} style={{ marginBottom: 8 }} />
            <Skeleton width="100%" height={13} borderRadius={4} style={{ marginBottom: 6 }} />
            <Skeleton width="64%" height={13} borderRadius={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function NexusSkeleton() {
  return (
    <div className="sk-shell sk-shell-1100" role="status" aria-label="Memuat bursa karir dan mentoring">
      <SkHeroHeader badgeWidth={170} titleWidth="min(290px, 78%)" subtitleWidth="min(440px, 92%)" />

      <div className="skeleton-card" style={{ padding: 16, marginBottom: 22, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
        <Skeleton pill width="min(280px, 100%)" height={40} />
        <SkChipRow widths={[84, 96, 98, 128]} />
      </div>

      <div className="sk-grid-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card" style={{ padding: 18 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
              <Skeleton circle width={50} height={50} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Skeleton width="74%" height={18} borderRadius={6} style={{ marginBottom: 6 }} />
                <Skeleton width="48%" height={13} borderRadius={4} />
              </div>
              <Skeleton pill width={78} height={24} />
            </div>
            <Skeleton width="95%" height={13} borderRadius={4} style={{ marginBottom: 6 }} />
            <Skeleton width="72%" height={13} borderRadius={4} style={{ marginBottom: 14 }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <SkChipRow widths={[68, 76]} />
              <Skeleton pill width={104} height={34} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MultazamSkeleton() {
  return (
    <div className="sk-shell sk-shell-900" role="status" aria-label="Memuat majelis doa multazam">
      <SkHeroHeader badgeWidth={160} titleWidth="min(260px, 75%)" subtitleWidth="min(400px, 90%)" />

      <div className="skeleton-card" style={{ padding: 18, marginBottom: 20 }}>
        <Skeleton width="100%" height={86} borderRadius={12} style={{ marginBottom: 12 }} />
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10 }}>
          <SkChipRow widths={[78, 90, 96]} />
          <Skeleton pill width={135} height={40} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card" style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <Skeleton circle width={42} height={42} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Skeleton width="42%" height={16} borderRadius={5} style={{ marginBottom: 5 }} />
                <Skeleton width="26%" height={11} borderRadius={4} />
              </div>
              <Skeleton pill width={80} height={22} />
            </div>
            <Skeleton width="96%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
            <Skeleton width="84%" height={14} borderRadius={4} style={{ marginBottom: 14 }} />
            <Skeleton pill width={120} height={34} />
          </div>
        ))}
      </div>
    </div>
  );
}

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

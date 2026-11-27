import React from "react";
import { Skeleton, SkChipRow } from "./SkeletonCore";

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

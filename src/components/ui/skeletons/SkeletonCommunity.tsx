import React from "react";
import { Skeleton, SkHeroHeader, SkChipRow } from "./SkeletonCore";

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

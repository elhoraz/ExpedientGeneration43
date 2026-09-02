"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

// Roman Numeral Helper
function toRoman(num: number): string {
  const lookup: { [key: string]: number } = { X: 10, IX: 9, V: 5, IV: 4, I: 1 };
  let roman = '';
  for (let i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman || 'I';
}

type GalleryStyleMode = 'monolith' | 'ring' | 'mosaic';

// Hook to detect mobile screen
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export default function LorongKenangan({ galeri }: { galeri: any[] }) {
  const [activeStyle, setActiveStyle] = useState<GalleryStyleMode>('monolith');
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const isMobile = useIsMobile();
  const total = galeri ? galeri.length : 0;

  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScroll = useRef(0);
  const currentScroll = useRef(0);
  const targetScroll = useRef(0);
  const animFrameId = useRef<number | null>(null);
  const lastPointerX = useRef(0);
  const lastPointerTime = useRef(0);
  const pointerVelocity = useRef(0);
  const hasMoved = useRef(false);

  const isMobileRef = useRef(isMobile);
  useEffect(() => {
    isMobileRef.current = isMobile;
  }, [isMobile]);

  const activeStyleRef = useRef(activeStyle);
  useEffect(() => {
    activeStyleRef.current = activeStyle;
  }, [activeStyle]);

  // Responsive card dimensions
  const cardW = isMobile ? 240 : 320;
  const cardH = isMobile ? 320 : 430;
  const imgH  = isMobile ? 210 : 305;

  // --- HIGH PERFORMANCE 3D GPU TRANSFORM RENDERER ---
  const apply3DTransforms = useCallback((scroll: number) => {
    if (activeStyleRef.current === 'mosaic') return;
    const isRing = activeStyleRef.current === 'ring';
    const mobile = isMobileRef.current;
    const spacing = mobile ? 140 : 210;
    const sideAngle = mobile ? 30 : 38;
    const radius = mobile ? 220 : 430;
    const anglePerCard = 360 / Math.max(8, total);

    itemRefs.current.forEach((el, idx) => {
      if (!el) return;
      const offset = idx - scroll;
      const absOffset = Math.abs(offset);
      const isCenter = absOffset < 0.5;

      let rotateY = 0;
      let translateZ = 0;
      let translateX = 0;
      let opacity = Math.max(0, 1 - absOffset * 0.28);
      let zIndex = Math.round(100 - absOffset * 10);

      if (!isRing) {
        // Monolith Mode (Imperial 3D Cover Flow)
        const clampedOffset = Math.max(-1, Math.min(1, offset));
        rotateY = -clampedOffset * sideAngle;
        translateZ = isCenter
          ? (mobile ? 70 : 130) * (1 - absOffset * 0.9)
          : -absOffset * 80;
        translateX = offset * spacing;
      } else {
        // Ring 360 Mode
        const cardAngle = offset * (anglePerCard * 0.65);
        const rad = (cardAngle * Math.PI) / 180;
        translateX = Math.sin(rad) * radius;
        translateZ = Math.cos(rad) * radius - radius + (isCenter ? (mobile ? 60 : 120) * (1 - absOffset * 0.9) : 0);
        rotateY = -cardAngle;
      }

      el.style.transform = `translate3d(${translateX.toFixed(2)}px, 0, ${translateZ.toFixed(2)}px) rotateY(${rotateY.toFixed(2)}deg)`;
      el.style.opacity = opacity.toFixed(3);
      el.style.zIndex = `${zIndex}`;

      // Visual spotlight & border styling
      const frame = el.querySelector('.echo-frame') as HTMLElement | null;
      if (frame) {
        if (isCenter) {
          frame.style.borderColor = "#ffd700";
          frame.style.boxShadow = "0 25px 60px rgba(0,0,0,0.9), 0 0 50px rgba(212,175,55,0.45)";
        } else {
          frame.style.borderColor = "rgba(255,255,255,0.15)";
          frame.style.boxShadow = "0 15px 35px rgba(0,0,0,0.6)";
        }
      }
    });
  }, [total]);

  // --- 120 FPS RAF PHYSICS LOOP ---
  const updateLoop = useCallback(() => {
    if (isDragging.current) {
      // 1:1 Instant Tracking with minor lerp for silky feel
      currentScroll.current += (targetScroll.current - currentScroll.current) * 0.35;
    } else {
      // Snapping & Smooth Glide
      currentScroll.current += (targetScroll.current - currentScroll.current) * 0.16;
    }

    apply3DTransforms(currentScroll.current);

    const diff = Math.abs(currentScroll.current - targetScroll.current);
    if (diff > 0.0005 || isDragging.current) {
      animFrameId.current = requestAnimationFrame(updateLoop);
    } else {
      currentScroll.current = targetScroll.current;
      apply3DTransforms(currentScroll.current);
      animFrameId.current = null;
      const rounded = Math.round(currentScroll.current);
      const clamped = Math.max(0, Math.min(rounded, total - 1));
      setActiveIndex(clamped);
    }
  }, [apply3DTransforms, total]);

  const wakeEngine = useCallback(() => {
    if (!animFrameId.current) {
      animFrameId.current = requestAnimationFrame(updateLoop);
    }
  }, [updateLoop]);

  // Jump or Slide to specific index
  const goToIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(index, total - 1));
    targetScroll.current = clamped;
    wakeEngine();
  };

  // Re-apply transforms when mode or total items change
  useEffect(() => {
    apply3DTransforms(currentScroll.current);
  }, [activeStyle, isMobile, apply3DTransforms]);

  // --- GESTURE & DRAG HANDLERS ---
  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeStyle === 'mosaic') return;
    isDragging.current = true;
    hasMoved.current = false;
    startX.current = e.clientX;
    startScroll.current = currentScroll.current;
    lastPointerX.current = e.clientX;
    lastPointerTime.current = Date.now();
    pointerVelocity.current = 0;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    wakeEngine();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || activeStyle === 'mosaic') return;

    const deltaX = startX.current - e.clientX;
    if (Math.abs(deltaX) > 4) {
      hasMoved.current = true;
    }

    // Velocity tracking
    const now = Date.now();
    const dt = now - lastPointerTime.current;
    if (dt > 10) {
      const dx = lastPointerX.current - e.clientX;
      pointerVelocity.current = dx / dt;
      lastPointerX.current = e.clientX;
      lastPointerTime.current = now;
    }

    const stepWidth = isMobile ? 150 : 230;
    const deltaScroll = deltaX / stepWidth;
    let nextTarget = startScroll.current + deltaScroll;

    // Rubber banding at bounds
    if (nextTarget < 0) {
      nextTarget = nextTarget * 0.3;
    } else if (nextTarget > total - 1) {
      const over = nextTarget - (total - 1);
      nextTarget = (total - 1) + over * 0.3;
    }

    targetScroll.current = nextTarget;
    wakeEngine();
  };

  const handlePointerUp = () => {
    if (!isDragging.current || activeStyle === 'mosaic') return;
    isDragging.current = false;

    const vel = pointerVelocity.current;
    let snapIndex = Math.round(currentScroll.current);

    // Flick gesture velocity momentum
    if (Math.abs(vel) > 0.4) {
      if (vel > 0.4) snapIndex = Math.ceil(currentScroll.current + 0.1);
      else if (vel < -0.4) snapIndex = Math.floor(currentScroll.current - 0.1);
    }

    snapIndex = Math.max(0, Math.min(snapIndex, total - 1));
    targetScroll.current = snapIndex;
    wakeEngine();
  };

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeStyle === 'mosaic') return;
      if (e.key === "ArrowLeft") {
        goToIndex(Math.max(0, Math.round(currentScroll.current) - 1));
      } else if (e.key === "ArrowRight") {
        goToIndex(Math.min(total - 1, Math.round(currentScroll.current) + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [total, activeStyle]);

  // Wheel horizontal gliding on desktop
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isMobile || activeStyle === 'mosaic') return;

    let wheelTimeout: NodeJS.Timeout | null = null;

    const handleWheel = (e: WheelEvent) => {
      // Only handle if horizontal scroll or with shiftKey, or inside container
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        targetScroll.current += e.deltaX * 0.003;
        targetScroll.current = Math.max(0, Math.min(targetScroll.current, total - 1));
        wakeEngine();

        if (wheelTimeout) clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
          targetScroll.current = Math.round(targetScroll.current);
          wakeEngine();
        }, 150);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
      if (wheelTimeout) clearTimeout(wheelTimeout);
    };
  }, [total, isMobile, activeStyle, wakeEngine]);

  if (!galeri || galeri.length === 0) {
    return (
      <div className="coverflow-container reveal-up" style={{ height: isMobile ? "320px" : "450px", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div className="echo-frame polaroid" style={{ width: isMobile ? "220px" : "300px", height: isMobile ? "260px" : "360px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <i className="fa-solid fa-ghost" style={{ fontSize: "2.5rem", marginBottom: "15px", opacity: 0.4, color: "var(--gold-premium, #d4af37)" }}></i>
          <div style={{ color: "#222", fontSize: "0.85rem", fontFamily: "monospace" }}>Belum ada memori yang terekam.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", overflow: "hidden" }}>

      {/* ===== STYLE SWITCHER BAR ===== */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: isMobile ? "8px" : "10px",
        marginBottom: isMobile ? "16px" : "25px",
        flexWrap: "wrap",
        padding: isMobile ? "0 8px" : "0"
      }}>
        {(
          [
            { key: 'monolith', icon: 'fa-landmark', emoji: '🏛️', label: isMobile ? 'Monolit' : 'Monolit Emas Imperial' },
            { key: 'ring',     icon: 'fa-circle-notch', emoji: '💫', label: isMobile ? 'Kubah 360°' : 'Kubah Melingkar 360°' },
            { key: 'mosaic',   icon: 'fa-border-all',   emoji: '👑', label: isMobile ? 'Polaroid' : 'Dinding Polaroid Royal' },
          ] as const
        ).map(({ key, icon, emoji, label }) => (
          <button
            key={key}
            onClick={() => {
              setActiveStyle(key);
              if (key !== 'mosaic') {
                setTimeout(() => apply3DTransforms(currentScroll.current), 50);
              }
            }}
            className="hover-trigger"
            style={{
              background: activeStyle === key ? "var(--gold-premium, #d4af37)" : "rgba(3,5,4,0.85)",
              color: activeStyle === key ? "#000" : "var(--gold-premium, #d4af37)",
              border: "1px solid var(--gold-premium, #d4af37)",
              padding: isMobile ? "7px 12px" : "8px 18px",
              borderRadius: "20px",
              fontSize: isMobile ? "0.72rem" : "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: isMobile ? "0.5px" : "1px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: activeStyle === key ? "0 0 20px rgba(212,175,55,0.5)" : "none",
              transition: "all 0.3s ease",
              whiteSpace: "nowrap"
            }}
          >
            <i className={`fa-solid ${icon}`}></i> {emoji} {label}
          </button>
        ))}
      </div>

      {/* ===== MODE 1 & 2: MONOLITH / RING ===== */}
      {(activeStyle === 'monolith' || activeStyle === 'ring') && (
        <div
          ref={containerRef}
          className="coverflow-container reveal-up"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{
            position: "relative",
            overflow: "hidden",
            minHeight: isMobile ? `${cardH + 90}px` : "560px",
            touchAction: "pan-y",
            userSelect: "none",
            cursor: "grab"
          }}
        >
          {/* SPOTLIGHT HALO */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: isMobile ? "320px" : "650px",
            height: isMobile ? "280px" : "480px",
            background: "radial-gradient(ellipse at center, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.05) 50%, transparent 75%)",
            pointerEvents: "none",
            zIndex: 2,
          }} />

          {/* 3D TRACK */}
          <div className="coverflow-track" style={{ zIndex: 10, pointerEvents: "none" }}>
            {galeri.map((g, idx) => {
              const imageUrl = g.image_url || g.foto_url || "/images/default-avatar.webp";

              return (
                <div
                  key={idx}
                  ref={(el) => { itemRefs.current[idx] = el; }}
                  className="coverflow-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasMoved.current) return;
                    const offset = Math.abs(idx - currentScroll.current);
                    if (offset > 0.4) {
                      goToIndex(idx);
                    } else {
                      setSelectedItem(g);
                    }
                  }}
                  style={{
                    left: "50%",
                    top: "50%",
                    marginLeft: `${-cardW / 2}px`,
                    marginTop: `${-cardH / 2}px`,
                    width: `${cardW}px`,
                    height: `${cardH}px`,
                    position: "absolute",
                    transformStyle: "preserve-3d",
                    willChange: "transform, opacity",
                    pointerEvents: "auto",
                    cursor: "pointer"
                  }}
                >
                  <div
                    className="echo-frame polaroid hover-trigger"
                    style={{
                      transition: "border-color 0.25s ease, box-shadow 0.25s ease",
                      position: "relative"
                    }}
                  >
                    {/* PHOTO */}
                    <div style={{ width: "100%", height: `${imgH}px`, overflow: "hidden", borderRadius: "3px", background: "#050706", position: "relative" }}>
                      <img
                        src={imageUrl}
                        alt={g.caption || "Kenangan Museum"}
                        loading="lazy"
                        draggable={false}
                        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", pointerEvents: "none" }}
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.onerror = null;
                          target.src = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&q=80";
                        }}
                      />

                      {/* MEMORI Badge */}
                      <div style={{
                        position: "absolute", top: "10px", left: "10px",
                        background: "rgba(3,5,4,0.85)", color: "#ffd700",
                        fontSize: isMobile ? "0.6rem" : "0.68rem",
                        fontFamily: "'Playfair Display', serif", fontWeight: 700,
                        padding: "3px 8px", borderRadius: "6px",
                        border: "1px solid rgba(212,175,55,0.5)", letterSpacing: "1px"
                      }}>
                        MEMORI {toRoman(idx + 1)}
                      </div>

                      {/* Gold Stamp */}
                      <div style={{
                        position: "absolute", bottom: "8px", right: "8px",
                        width: isMobile ? "28px" : "36px", height: isMobile ? "28px" : "36px",
                        borderRadius: "50%", border: "1px solid rgba(212,175,55,0.6)",
                        background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
                        justifyContent: "center", color: "#ffd700",
                        fontSize: isMobile ? "0.65rem" : "0.75rem"
                      }}>
                        <i className="fa-solid fa-stamp"></i>
                      </div>
                    </div>

                    {/* Caption */}
                    <div className="echo-caption" style={{
                      color: "#111",
                      fontSize: isMobile ? "0.78rem" : undefined,
                      padding: isMobile ? "10px 8px 4px" : undefined
                    }}>
                      {g.caption || "Memori Angkatan Expedient"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* VVIP HUD CONTROLS */}
          <div style={{
            position: "absolute",
            bottom: isMobile ? "12px" : "25px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: isMobile ? "10px" : "16px",
            zIndex: 500,
            width: "max-content",
            pointerEvents: "auto"
          }}>
            <button
              onClick={() => goToIndex(activeIndex - 1)}
              disabled={activeIndex === 0}
              aria-label="Sebelumnya"
              style={{
                background: "rgba(3,5,4,0.88)", border: "1px solid rgba(212,175,55,0.4)",
                color: activeIndex === 0 ? "rgba(255,255,255,0.2)" : "#ffd700",
                width: isMobile ? "36px" : "42px", height: isMobile ? "36px" : "42px",
                borderRadius: "50%", cursor: activeIndex === 0 ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: isMobile ? "0.8rem" : "0.95rem",
                boxShadow: "0 10px 25px rgba(0,0,0,0.8)",
                backdropFilter: "blur(12px)", transition: "all 0.3s ease"
              }}
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>

            <div style={{
              background: "rgba(3,5,4,0.88)", border: "1px solid rgba(212,175,55,0.5)",
              padding: isMobile ? "7px 14px" : "9px 26px", borderRadius: "30px",
              fontSize: isMobile ? "0.72rem" : "0.82rem",
              color: "var(--gold-premium, #d4af37)", fontFamily: "monospace",
              letterSpacing: isMobile ? "1.5px" : "3px", fontWeight: 700,
              boxShadow: "0 12px 30px rgba(0,0,0,0.9)", backdropFilter: "blur(12px)",
              display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap"
            }}>
              <i className="fa-solid fa-gem" style={{ color: "#ffd700", fontSize: "0.85rem" }}></i>
              <span>MEMORI {toRoman(activeIndex + 1)} / {toRoman(total)}</span>
            </div>

            <button
              onClick={() => goToIndex(activeIndex + 1)}
              disabled={activeIndex === total - 1}
              aria-label="Selanjutnya"
              style={{
                background: "rgba(3,5,4,0.88)", border: "1px solid rgba(212,175,55,0.4)",
                color: activeIndex === total - 1 ? "rgba(255,255,255,0.2)" : "#ffd700",
                width: isMobile ? "36px" : "42px", height: isMobile ? "36px" : "42px",
                borderRadius: "50%", cursor: activeIndex === total - 1 ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: isMobile ? "0.8rem" : "0.95rem",
                boxShadow: "0 10px 25px rgba(0,0,0,0.8)",
                backdropFilter: "blur(12px)", transition: "all 0.3s ease"
              }}
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>

          {/* SWIPE HINT (mobile only) */}
          {isMobile && total > 1 && (
            <div style={{
              position: "absolute", top: "12px", left: "50%", transform: "translateX(-50%)",
              background: "rgba(3,5,4,0.75)", border: "1px solid rgba(212,175,55,0.3)",
              color: "rgba(212,175,55,0.8)", fontSize: "0.65rem", fontFamily: "monospace",
              padding: "4px 12px", borderRadius: "20px", letterSpacing: "1px",
              pointerEvents: "none", zIndex: 500, whiteSpace: "nowrap"
            }}>
              ← GESER →
            </div>
          )}
        </div>
      )}

      {/* ===== MODE 3: ROYAL MOSAIC GRID ===== */}
      {activeStyle === 'mosaic' && (
        <div style={{ padding: isMobile ? "6px 0 30px" : "10px 0 40px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "repeat(2, 1fr)"
              : "repeat(auto-fill, minmax(280px, 1fr))",
            gap: isMobile ? "12px" : "24px",
            maxWidth: "1200px",
            margin: "0 auto",
            padding: isMobile ? "0 4px" : "0"
          }}>
            {galeri.map((g, idx) => {
              const imageUrl = g.image_url || g.foto_url || "/images/default-avatar.webp";
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedItem(g)}
                  className="hover-trigger"
                  style={{
                    background: "rgba(10,13,11,0.9)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: isMobile ? "12px" : "16px",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "transform 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.6)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
                    e.currentTarget.style.borderColor = "var(--gold-premium, #d4af37)";
                    e.currentTarget.style.boxShadow = "0 20px 40px rgba(212,175,55,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.borderColor = "var(--glass-border)";
                    e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.6)";
                  }}
                >
                  <div style={{ height: isMobile ? "150px" : "240px", overflow: "hidden", position: "relative", background: "#000" }}>
                    <img
                      src={imageUrl}
                      alt={g.caption || "Foto Museum"}
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    <div style={{
                      position: "absolute", top: "8px", left: "8px",
                      background: "rgba(3,5,4,0.85)", color: "#ffd700",
                      fontSize: "0.6rem", fontFamily: "monospace",
                      padding: "2px 8px", borderRadius: "6px",
                      border: "1px solid rgba(212,175,55,0.4)"
                    }}>
                      MEMORI {toRoman(idx + 1)}
                    </div>
                  </div>
                  <div style={{ padding: isMobile ? "10px 12px" : "16px 20px" }}>
                    <div style={{
                      color: "var(--gold-premium, #d4af37)",
                      fontFamily: "'Playfair Display', serif",
                      fontSize: isMobile ? "0.8rem" : "1.05rem",
                      fontWeight: 700, whiteSpace: "nowrap",
                      overflow: "hidden", textOverflow: "ellipsis"
                    }}>
                      {g.caption || "Memori Angkatan Expedient"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== SOVEREIGN LIGHTBOX MODAL ===== */}
      {selectedItem && (
        <div className="archive-modal active" style={{ opacity: 1, pointerEvents: "auto", zIndex: 99999 }}>
          <div className="archive-backdrop" onClick={() => setSelectedItem(null)} />
          <div
            className="archive-paper"
            style={{
              maxWidth: isMobile ? "calc(100vw - 24px)" : "850px",
              width: isMobile ? "calc(100vw - 24px)" : undefined,
              background: "rgba(10,13,11,0.96)",
              border: "1px solid var(--gold-premium, #d4af37)",
              borderRadius: isMobile ? "16px" : "24px",
              padding: isMobile ? "20px 16px" : "35px",
              boxShadow: "0 30px 80px rgba(0,0,0,0.95), 0 0 50px rgba(212,175,55,0.3)",
              margin: isMobile ? "0" : undefined,
              maxHeight: isMobile ? "90dvh" : undefined,
              overflowY: isMobile ? "auto" : undefined
            }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              style={{
                position: "absolute", top: isMobile ? "14px" : "24px", right: isMobile ? "14px" : "24px",
                background: "rgba(255,255,255,0.08)", border: "1px solid var(--glass-border)",
                color: "#fff", width: isMobile ? "34px" : "40px", height: isMobile ? "34px" : "40px",
                borderRadius: "50%", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: isMobile ? "0.95rem" : "1.1rem", transition: "0.3s"
              }}
              className="hover-trigger"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              color: "var(--gold-premium, #d4af37)", fontFamily: "monospace",
              fontSize: isMobile ? "0.65rem" : "0.82rem", letterSpacing: isMobile ? "1.5px" : "3px",
              marginBottom: "14px", flexWrap: "wrap"
            }}>
              <i className="fa-solid fa-landmark" style={{ color: "#ffd700" }}></i>
              <span>SOVEREIGN ARCHIVE — MEMORI ARRISALAH</span>
            </div>

            {/* Photo */}
            <div style={{
              width: "100%", maxHeight: isMobile ? "55vw" : "500px",
              borderRadius: isMobile ? "10px" : "16px", overflow: "hidden",
              border: "1px solid rgba(212,175,55,0.4)", marginBottom: isMobile ? "14px" : "24px",
              background: "#000"
            }}>
              <img
                src={selectedItem.image_url || selectedItem.foto_url}
                alt={selectedItem.caption}
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              />
            </div>

            {/* Caption */}
            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? "1.1rem" : "1.6rem",
              color: "#ffffff", margin: "0 0 10px 0",
              letterSpacing: "0.5px"
            }}>
              {selectedItem.caption || "Memori Kenangan Angkatan Expedient"}
            </h3>

            {/* Footer */}
            <div style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between",
              alignItems: isMobile ? "flex-start" : "center",
              gap: isMobile ? "12px" : "0",
              marginTop: isMobile ? "12px" : "24px",
              borderTop: "1px solid var(--glass-border)",
              paddingTop: isMobile ? "12px" : "18px"
            }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", letterSpacing: "0.5px" }}>
                Arsip Visual Resmi Museum Angkatan Expedient
              </span>
              <a
                href={selectedItem.image_url || selectedItem.foto_url}
                target="_blank" rel="noreferrer"
                style={{
                  background: "var(--gold-premium, #d4af37)", color: "#000",
                  padding: isMobile ? "9px 18px" : "10px 24px",
                  borderRadius: "12px", fontWeight: 800,
                  fontSize: isMobile ? "0.78rem" : "0.85rem",
                  textDecoration: "none", display: "inline-flex",
                  alignItems: "center", gap: "8px",
                  boxShadow: "0 6px 20px rgba(212,175,55,0.4)",
                  alignSelf: isMobile ? "stretch" : undefined,
                  justifyContent: isMobile ? "center" : undefined
                }}
                className="hover-trigger"
              >
                <i className="fa-solid fa-arrow-down-long"></i> Unduh Ukuran Asli (HD)
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

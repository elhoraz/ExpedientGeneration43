"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";

export default function EnigmaClient({ isCompleted, userId }: { isCompleted: boolean, userId: string }) {
  const vaultContainerRef = useRef<HTMLDivElement>(null);
  const ringOuterRef = useRef<HTMLDivElement>(null);
  const ringMiddleRef = useRef<HTMLDivElement>(null);
  const ringInnerRef = useRef<HTMLDivElement>(null);
  const [completed, setCompleted] = useState(isCompleted);
  const [errorMsg, setErrorMsg] = useState(false);
  const [btnText, setBtnText] = useState("INISIASI PEMBUKAAN");
  const completedRef = useRef(completed);
  completedRef.current = completed;
  const unlockTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const triggerUnlock = () => {
    completedRef.current = true;
    setCompleted(true);
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    vaultContainerRef.current?.classList.add('unlocked');

    gsap.to(ringOuterRef.current, { scale: 1.2, opacity: 0, duration: 1.5, ease: "power2.inOut", delay: 0.5 });
    gsap.to(ringMiddleRef.current, { scale: 1.4, opacity: 0, duration: 1.5, ease: "power2.inOut", delay: 0.8 });
    gsap.to(ringInnerRef.current, { scale: 1.6, opacity: 0, duration: 1.5, ease: "power2.inOut", delay: 1.1 });

    const overlayTimer = setTimeout(() => {
      const overlay = document.getElementById('successOverlay');
      if (!overlay) return;
      overlay.classList.add('show');
      gsap.to('.clearance-title', { opacity: 1, y: 0, duration: 1.5, ease: "power3.out", delay: 0.5 });
      gsap.to('.secret-quote', { opacity: 1, y: 0, duration: 1.5, ease: "power3.out", delay: 1.5 });
      gsap.to('.btn-return', { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 2.5 });
    }, 2000);
    unlockTimersRef.current.push(overlayTimer);
  };

  useEffect(() => {
    const rings = [ringOuterRef.current, ringMiddleRef.current, ringInnerRef.current];
    if (!rings[0] || !rings[1] || !rings[2]) return;

    const symbols = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    const sectionAngle = 360 / symbols.length;

    const targetIndices = [3, 1, 9];
    const ringRotations = [
      Math.floor(Math.random() * 10) * 36,
      Math.floor(Math.random() * 10) * 36,
      Math.floor(Math.random() * 10) * 36
    ];

    for (let i = 0; i < 3; i++) {
      const currentIndex = (10 - Math.round(ringRotations[i] / 36) % 10) % 10;
      if (currentIndex === targetIndices[i]) {
        ringRotations[i] += 36;
      }
    }

    rings.forEach((ring, rIndex) => {
      const radius = ring!.offsetWidth / 2 - 25;

      symbols.forEach((sym, i) => {
        const el = document.createElement('div');
        el.className = 'symbol';
        el.innerText = sym;
        ring!.appendChild(el);

        const angleRad = (i * sectionAngle - 90) * (Math.PI / 180);
        el.style.left = `calc(50% + ${Math.cos(angleRad) * radius}px)`;
        el.style.top = `calc(50% + ${Math.sin(angleRad) * radius}px)`;
        el.style.transform = `translate(-50%, -50%) rotate(${i * sectionAngle}deg)`;
      });

      gsap.set(ring, { rotation: ringRotations[rIndex] });
    });

    let activeRing: number | null = null;
    let lastAngle = 0;

    function getAngle(x: number, y: number, rect: DOMRect) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      return Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
    }

    const onPointerDown = (e: any) => {
      if (completedRef.current) return;
      e.preventDefault();
      const ring = e.currentTarget as HTMLElement;
      activeRing = parseInt(ring.getAttribute('data-ring') || "0");

      const rect = ring.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      lastAngle = getAngle(clientX, clientY, rect);
      ring.style.cursor = 'grabbing';
      e.stopPropagation();
    };

    const onPointerMove = (e: any) => {
      if (activeRing === null || completedRef.current) return;
      e.preventDefault();

      const ringElement = rings[activeRing];
      const rect = ringElement!.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const currentAngle = getAngle(clientX, clientY, rect);
      let deltaAngle = currentAngle - lastAngle;

      if (deltaAngle > 180) deltaAngle -= 360;
      if (deltaAngle < -180) deltaAngle += 360;

      const currentRot = gsap.getProperty(ringElement, "rotation") as number;
      const newRotation = currentRot + deltaAngle;

      gsap.set(ringElement, { rotation: newRotation });
      lastAngle = currentAngle;
    };

    const onPointerUp = () => {
      if (activeRing === null || completedRef.current) return;

      const currentRingIndex = activeRing;
      const ringElement = rings[currentRingIndex];
      ringElement!.style.cursor = 'grab';

      const finalRot = gsap.getProperty(ringElement, "rotation") as number;
      const snappedRot = Math.round(finalRot / 36) * 36;
      ringRotations[currentRingIndex] = snappedRot;

      gsap.to(ringElement, {
        rotation: snappedRot,
        duration: 0.3,
        ease: "back.out(1.5)"
      });

      if (navigator.vibrate) navigator.vibrate(15);
      activeRing = null;
    };

    rings.forEach(ring => {
      ring!.addEventListener('mousedown', onPointerDown);
      ring!.addEventListener('touchstart', onPointerDown, { passive: false });
    });

    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchend', onPointerUp);

    let initUnlockTimer: ReturnType<typeof setTimeout> | null = null;
    if (completedRef.current) {
      initUnlockTimer = setTimeout(() => triggerUnlock(), 500);
    }

    const timers = unlockTimersRef.current;
    return () => {
      if (initUnlockTimer) clearTimeout(initUnlockTimer);
      timers.forEach((id) => clearTimeout(id));
      timers.length = 0;
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchend', onPointerUp);
      rings.forEach(ring => {
        if (ring) {
          ring.removeEventListener('mousedown', onPointerDown);
          ring.removeEventListener('touchstart', onPointerDown);
          ring.innerHTML = '';
        }
      });
    };
  }, []);

  const getTopIndex = (rotation: number) => {
    const norm = ((rotation % 360) + 360) % 360;
    let steps = Math.round(norm / 36);
    if (steps >= 10) steps = 0;
    return (10 - steps) % 10;
  };

  const handleVerify = async () => {
    setErrorMsg(false);
    const r0 = gsap.getProperty(ringOuterRef.current, "rotation") as number;
    const r1 = gsap.getProperty(ringMiddleRef.current, "rotation") as number;
    const r2 = gsap.getProperty(ringInnerRef.current, "rotation") as number;

    const combo = [getTopIndex(r0), getTopIndex(r1), getTopIndex(r2)];

    setBtnText("MEMVERIFIKASI...");

    try {
      const res = await fetch("/api/enigma/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ combination: combo })
      });
      const data = await res.json();

      if (data.success) {
        setBtnText("AKSES DIBERIKAN");
        triggerUnlock();
      } else {
        setBtnText("INISIASI PEMBUKAAN");
        setErrorMsg(true);
        gsap.to('#vaultContainer', {
          x: -10, duration: 0.1, yoyo: true, repeat: 5, ease: "linear",
          onComplete: () => { gsap.set('#vaultContainer', { x: 0 }); }
        });
        if (navigator.vibrate) navigator.vibrate(200);
      }
    } catch (err) {
      setBtnText("INISIASI PEMBUKAAN");
      setErrorMsg(true);
    }
  };

  const handleReset = async () => {
    await fetch("/api/enigma/reset", { method: "POST" });
    window.location.reload();
  };

  return (
    <>
      <style>{`
        :root { --enigma-gold: #d4af37; --enigma-dark: var(--bg-main, #060b14); }
        body { margin: 0; background-color: var(--bg-main, #060b14); color: var(--text-primary, #f2efe9); user-select: text; font-family: var(--font-sans, inherit); overflow-x: hidden; min-height: 100dvh; }
        .btn-back-vault {
            position: absolute; top: max(20px, calc(env(safe-area-inset-top, 16px) + 6px)); inset-inline-start: max(20px, env(safe-area-inset-left, 16px)); z-index: 100;
            display: inline-flex; align-items: center; gap: 10px;
            min-height: 44px;
            padding: 10px 20px; background: var(--surface-raised, rgba(12, 18, 28, 0.92));
            border: 1px solid rgba(212,175,55,0.35); border-radius: 10px;
            color: var(--gold-main, #d4af37); font-size: 0.78rem; font-weight: 600; 
            letter-spacing: 0.06em; text-decoration: none; text-transform: uppercase;
            transition: border-color 0.25s ease, transform 0.25s ease, color 0.25s ease;
        }
        .btn-back-vault:focus-visible, .btn-return:focus-visible, .ring:focus-visible {
            outline: 2px solid var(--gold-main, #d4af37);
            outline-offset: 2px;
        }

        .enigma-wrapper { position: relative; width: 100%; max-width: 100vw; min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; box-sizing: border-box; }
        .vault-container { position: relative; width: clamp(280px, 80vw, 450px); aspect-ratio: 1; display: flex; justify-content: center; align-items: center; touch-action: none; }
        .ring { position: absolute; border-radius: 50%; border: 2px solid rgba(212,175,55,0.25); box-shadow: inset 0 0 24px rgba(0,0,0,0.6), 0 0 18px rgba(0,0,0,0.45), inset 0 0 5px var(--enigma-gold); background: radial-gradient(circle at center, #0c182b 0%, #060b14 100%); display: flex; justify-content: center; align-items: center; cursor: grab; transition: filter 0.3s ease; touch-action: none; user-select: none; }
        .ring:active { cursor: grabbing; }
        .ring.outer { width: 100%; height: 100%; z-index: 10; }
        .ring.middle { width: 75%; height: 75%; z-index: 20; }
        .ring.inner { width: 50%; height: 50%; z-index: 30; }

        .vault-core { position: absolute; width: 25%; height: 25%; border-radius: 50%; background: #060b14; z-index: 40; box-shadow: inset 0 0 10px rgba(0,0,0,0.9), 0 0 24px rgba(212,175,55,0.2); border: 2px solid var(--enigma-gold); display: flex; justify-content: center; align-items: center; transition: transform 0.6s ease, box-shadow 0.6s ease; }
        .core-logo { width: 60%; opacity: 0.15; filter: grayscale(1); transition: opacity 0.6s ease; }

        .symbol { position: absolute; color: rgba(212,175,55,0.75); font-family: 'Playfair Display', serif; font-weight: 700; font-size: clamp(14px, 4vw, 22px); text-shadow: 0 0 10px rgba(0,0,0,0.8); transform-origin: center center; pointer-events: none; user-select: none; }
        .selection-marker { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 15px solid transparent; border-right: 15px solid transparent; border-top: 25px solid var(--enigma-gold); z-index: 50; }

        .riddle-box { margin-top: 40px; text-align: center; width: 85%; max-width: 600px; z-index: 100; }
        .riddle-title { font-family: 'Playfair Display', serif; color: var(--gold-main, #d4af37); font-size: 1.45rem; letter-spacing: 0.06em; margin-bottom: 10px; text-transform: uppercase; }
        .riddle-text { font-family: var(--font-manrope), sans-serif; color: var(--text-secondary, #a1a8b5); font-size: 0.92rem; line-height: 1.65; letter-spacing: 0.02em; }

        .vault-container.unlocked .ring { filter: brightness(1.4) drop-shadow(0 0 18px var(--enigma-gold)); pointer-events: none; }
        .vault-container.unlocked .vault-core { background: radial-gradient(circle at center, #d4af37 0%, #8c6a12 100%); box-shadow: 0 0 60px var(--enigma-gold); transform: scale(1.08); }
        .vault-container.unlocked .core-logo { opacity: 1; filter: grayscale(0); }

        .success-overlay { position: absolute; inset: 0; background: var(--surface-scrim, rgba(6,11,20,0.94)); z-index: 999; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.8s ease; }
        .success-overlay.show { opacity: 1; pointer-events: auto; }
        .clearance-title { font-family: 'Playfair Display', serif; color: var(--gold-main, #d4af37); font-size: clamp(1.8rem, 6vw, 3.5rem); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 20px; text-align: center; transform: translateY(30px); opacity: 0; }
        .secret-quote { font-family: var(--font-manrope), sans-serif; color: var(--text-primary, #f2efe9); font-size: 1rem; text-align: center; max-width: 85%; line-height: 1.75; letter-spacing: 0.02em; transform: translateY(20px); opacity: 0; }
        .btn-return { margin-top: 30px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; padding: 12px 28px; border: 1px solid var(--gold-main, #d4af37); background: rgba(212,175,55,0.12); color: var(--gold-main, #d4af37); font-family: var(--font-sans, inherit); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; border-radius: 30px; cursor: pointer; transition: background 0.25s ease, color 0.25s ease; text-decoration: none; transform: translateY(20px); opacity: 0; }

        @media (hover: hover) and (pointer: fine) {
            .btn-back-vault:hover { transform: translateX(-3px); border-color: #d4af37; color: var(--text-primary, #fff); }
            .btn-return:hover { background: var(--gold-main, #d4af37); color: #060b14; }
        }

        :root[data-theme="light"] .btn-back-vault {
            background: #ffffff;
            color: #7c520a;
            border-color: rgba(124, 82, 10, 0.38);
        }
        :root[data-theme="light"] .riddle-title,
        :root[data-theme="light"] .clearance-title {
            color: #7c520a;
        }
        :root[data-theme="light"] .riddle-text {
            color: #3f3f46;
        }
        :root[data-theme="light"] .btn-return {
            color: #7c520a;
            border-color: #7c520a;
            background: rgba(124, 82, 10, 0.08);
        }

        @media (max-width: 768px) { 
            .btn-back-vault { top: max(14px, calc(env(safe-area-inset-top, 14px) + 6px)); inset-inline-start: max(14px, env(safe-area-inset-left, 14px)); padding: 8px 14px; font-size: 0.75rem; }
            .enigma-wrapper { min-height: 100dvh; padding: max(65px, calc(env(safe-area-inset-top, 14px) + 50px)) 15px calc(30px + env(safe-area-inset-bottom, 16px)) 15px; justify-content: center; } 
            .vault-container { width: clamp(250px, 82vw, 330px); margin-bottom: 15px; } 
            .riddle-box { margin-top: 15px; width: 100%; }
        }
        @media (min-width: 769px) { .enigma-wrapper { flex-direction: row; gap: 60px; } .riddle-box { text-align: start; } .riddle-text { text-align: start !important; } .vault-container { width: 450px; } }
        @media (prefers-reduced-motion: reduce) {
            .ring, .vault-core, .core-logo, .success-overlay, .btn-back-vault, .btn-return {
                transition: none !important;
                animation: none !important;
            }
        }
      `}</style>

      <Link href="/fitur" className="btn-back-vault">
        <i className="fa-solid fa-chevron-left" aria-hidden="true"></i> Kembali ke Fitur
      </Link>

      <div className="enigma-wrapper">
        <div className="vault-container" id="vaultContainer" ref={vaultContainerRef}>
          <div className="selection-marker" aria-hidden="true"></div>
          <div className="ring outer" ref={ringOuterRef} data-ring="0" tabIndex={0} aria-label="Cincin luar"></div>
          <div className="ring middle" ref={ringMiddleRef} data-ring="1" tabIndex={0} aria-label="Cincin tengah"></div>
          <div className="ring inner" ref={ringInnerRef} data-ring="2" tabIndex={0} aria-label="Cincin dalam"></div>
          <div className="vault-core" id="vaultCore">
            <Image src="/images/logo-utuh.webp" className="core-logo" id="coreLogo" alt="" aria-hidden="true" width={100} height={100} priority style={{ width: "60%", height: "auto" }} />
          </div>
        </div>

        <div className="riddle-box">
          <div className="riddle-title">The Grand Alignment</div>

          {completed ? (
            <>
              <div style={{ marginTop: '20px', color: '#10b981', fontWeight: 'bold', letterSpacing: '0.04em' }}>
                SIMPUL TELAH TERPECAHKAN.
              </div>
              <div style={{ marginTop: '20px' }}>
                <button type="button" onClick={handleReset} className="btn-return" style={{ opacity: 1, transform: 'none', display: 'inline-flex', padding: '10px 25px', marginTop: 0, background: 'transparent', borderColor: '#ef4444', color: '#ef4444', fontSize: '0.82rem' }}>KUNCI ULANG BRANKAS</button>
              </div>
            </>
          ) : (
            <>
              <div className="riddle-text" style={{ textAlign: 'start', display: 'inline-block', marginTop: '15px' }}>
                <em>Selaraskan cincin untuk membuka gerbang:</em><br /><br />
                <strong>Lapis Luar:</strong> Bintang kejayaan peradaban. (IV)<br />
                <strong>Lapis Tengah:</strong> Perisai waktu lima waktu. (II)<br />
                <strong>Lapis Dalam:</strong> Yang Maha Esa. (X)<br />
              </div>
              <div style={{ marginTop: '30px' }}>
                <button type="button" onClick={handleVerify} className="btn-return" style={{ opacity: 1, transform: 'none', display: 'inline-flex', padding: '12px 30px', marginTop: 0, background: btnText === "AKSES DIBERIKAN" ? "#10b981" : "var(--gold-main, #d4af37)", color: '#060b14', fontWeight: 'bold' }}>{btnText}</button>
              </div>
              <div id="errorMsg" role="alert" style={{ marginTop: '15px', color: '#ef4444', fontSize: '0.85rem', letterSpacing: '0.02em', display: errorMsg ? 'block' : 'none' }}>Kombinasi tidak selaras. Getaran ditolak.</div>
            </>
          )}
        </div>

        <div className="success-overlay" id="successOverlay">
          <div className="clearance-title">Clearance: Apex</div>
          <div className="secret-quote">&ldquo;Intelijen sejati bukanlah mengetahui segalanya,<br />melainkan melihat apa yang disembunyikan oleh dunia.&rdquo;</div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }} className="action-buttons">
            <Link href="/fitur" className="btn-return">Kembali ke Menu Fitur</Link>
            <button type="button" onClick={handleReset} className="btn-return" style={{ background: 'transparent', borderColor: '#ef4444', color: '#ef4444' }}>Kunci Ulang</button>
          </div>
        </div>
      </div>
    </>
  );
}

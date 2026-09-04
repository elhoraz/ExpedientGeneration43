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

  useEffect(() => {
    const rings = [ringOuterRef.current, ringMiddleRef.current, ringInnerRef.current];
    if (!rings[0] || !rings[1] || !rings[2]) return;

    const symbols = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    const sectionAngle = 360 / symbols.length;

    const targetIndices = [3, 1, 9]; 
    let ringRotations = [
      Math.floor(Math.random()*10)*36, 
      Math.floor(Math.random()*10)*36, 
      Math.floor(Math.random()*10)*36
    ];

    for(let i=0; i<3; i++) {
      let currentIndex = (10 - Math.round(ringRotations[i] / 36) % 10) % 10;
      if(currentIndex === targetIndices[i]) {
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
      if(completed) return;
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
      if (activeRing === null || completed) return;
      e.preventDefault();
      
      const ringElement = rings[activeRing];
      const rect = ringElement!.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      const currentAngle = getAngle(clientX, clientY, rect);
      let deltaAngle = currentAngle - lastAngle;
      
      if (deltaAngle > 180) deltaAngle -= 360;
      if (deltaAngle < -180) deltaAngle += 360;

      let currentRot = gsap.getProperty(ringElement, "rotation") as number;
      let newRotation = currentRot + deltaAngle;
      
      gsap.set(ringElement, { rotation: newRotation });
      lastAngle = currentAngle;
    };

    const onPointerUp = (e: any) => {
      if (activeRing === null || completed) return;
      
      const currentRingIndex = activeRing;
      const ringElement = rings[currentRingIndex];
      ringElement!.style.cursor = 'grab';
      
      let finalRot = gsap.getProperty(ringElement, "rotation") as number;
      let snappedRot = Math.round(finalRot / 36) * 36;
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
      ring!.addEventListener('touchstart', onPointerDown, {passive: false});
    });

    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('touchmove', onPointerMove, {passive: false});
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchend', onPointerUp);

    if (completed) {
      setTimeout(() => triggerUnlock(), 500);
    }

    return () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchend', onPointerUp);
      rings.forEach(ring => {
          if (ring) {
              ring.innerHTML = '';
          }
      });
    };
  }, [completed]);

  const getTopIndex = (rotation: number) => {
    let norm = ((rotation % 360) + 360) % 360;
    let steps = Math.round(norm / 36);
    if (steps >= 10) steps = 0;
    return (10 - steps) % 10;
  };

  const handleVerify = async () => {
    setErrorMsg(false);
    let r0 = gsap.getProperty(ringOuterRef.current, "rotation") as number;
    let r1 = gsap.getProperty(ringMiddleRef.current, "rotation") as number;
    let r2 = gsap.getProperty(ringInnerRef.current, "rotation") as number;

    let combo = [getTopIndex(r0), getTopIndex(r1), getTopIndex(r2)];

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
                onComplete: () => { gsap.set('#vaultContainer', {x: 0}); }
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

  const triggerUnlock = () => {
    setCompleted(true);
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
    
    const vaultContainer = vaultContainerRef.current!;
    vaultContainer.classList.add('unlocked');

    gsap.to(ringOuterRef.current, { scale: 1.2, opacity: 0, duration: 1.5, ease: "power2.inOut", delay: 0.5 });
    gsap.to(ringMiddleRef.current, { scale: 1.4, opacity: 0, duration: 1.5, ease: "power2.inOut", delay: 0.8 });
    gsap.to(ringInnerRef.current, { scale: 1.6, opacity: 0, duration: 1.5, ease: "power2.inOut", delay: 1.1 });

    setTimeout(() => {
        const overlay = document.getElementById('successOverlay');
        overlay!.classList.add('show');
        gsap.to('.clearance-title', { opacity: 1, y: 0, duration: 1.5, ease: "power3.out", delay: 0.5 });
        gsap.to('.secret-quote', { opacity: 1, y: 0, duration: 1.5, ease: "power3.out", delay: 1.5 });
        gsap.to('.btn-return', { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 2.5 });
    }, 2000);
  };

  return (
    <>
      <style>{`
        :root { --enigma-gold: #d4af37; --enigma-dark: #020403; }
        body { margin: 0; background-color: var(--enigma-dark); user-select: none; font-family: 'Inter', sans-serif; overflow-x: hidden; min-height: 100vh; }
        .btn-back-vault {
            position: absolute; top: 30px; left: 30px; z-index: 100;
            display: flex; align-items: center; gap: 10px;
            padding: 10px 20px; background: rgba(0,0,0,0.6);
            border: 1px solid rgba(212,175,55,0.3); border-radius: 8px;
            color: #d4af37; font-size: 11px; font-weight: 600; 
            letter-spacing: 3px; text-decoration: none; text-transform: uppercase;
            backdrop-filter: blur(10px); transition: all 0.3s ease;
        }
        .btn-back-vault:hover { transform: translateX(-5px); box-shadow: 0 0 20px rgba(212,175,55,0.5); border-color: #ffd700; color: #fff; }

        .enigma-wrapper { position: relative; width: 100vw; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .vault-container { position: relative; width: clamp(300px, 80vw, 500px); aspect-ratio: 1; display: flex; justify-content: center; align-items: center; }
        .ring { position: absolute; border-radius: 50%; border: 2px solid rgba(212,175,55,0.2); box-shadow: inset 0 0 30px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.8), inset 0 0 5px var(--enigma-gold); background: radial-gradient(circle at center, #0a0f0c 0%, #030504 100%); display: flex; justify-content: center; align-items: center; cursor: grab; transition: filter 0.3s ease; }
        .ring:active { cursor: grabbing; }
        .ring.outer { width: 100%; height: 100%; z-index: 10; }
        .ring.middle { width: 75%; height: 75%; z-index: 20; }
        .ring.inner { width: 50%; height: 50%; z-index: 30; }

        .vault-core { position: absolute; width: 25%; height: 25%; border-radius: 50%; background: #000; z-index: 40; box-shadow: inset 0 0 10px rgba(0,0,0,0.9), 0 0 30px rgba(212,175,55,0.2); border: 2px solid var(--enigma-gold); display: flex; justify-content: center; align-items: center; transition: all 1s ease; }
        .core-logo { width: 60%; opacity: 0.1; filter: grayscale(1); transition: all 1s ease; }

        .symbol { position: absolute; color: rgba(212,175,55,0.6); font-family: 'Playfair Display', serif; font-weight: 700; font-size: clamp(14px, 4vw, 22px); text-shadow: 0 0 10px rgba(0,0,0,0.8); transform-origin: center center; pointer-events: none; }
        .selection-marker { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 15px solid transparent; border-right: 15px solid transparent; border-top: 25px solid var(--enigma-gold); z-index: 50; filter: drop-shadow(0 0 10px var(--enigma-gold)); }

        .riddle-box { margin-top: 50px; text-align: center; width: 80%; max-width: 600px; z-index: 100; }
        .riddle-title { font-family: 'Playfair Display', serif; color: var(--enigma-gold); font-size: 1.5rem; letter-spacing: 4px; margin-bottom: 10px; text-transform: uppercase; }
        .riddle-text { font-family: 'Courier New', monospace; color: #8b9ba8; font-size: 0.9rem; line-height: 1.6; letter-spacing: 2px; }

        .vault-container.unlocked .ring { filter: brightness(1.5) drop-shadow(0 0 20px var(--enigma-gold)); pointer-events: none; }
        .vault-container.unlocked .vault-core { background: radial-gradient(circle at center, #d4af37 0%, #aa771c 100%); box-shadow: 0 0 100px var(--enigma-gold); transform: scale(1.1); }
        .vault-container.unlocked .core-logo { opacity: 1; filter: grayscale(0) drop-shadow(0 0 15px #fff); }

        .success-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.9); z-index: 999; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 1.5s ease; }
        .success-overlay.show { opacity: 1; pointer-events: auto; }
        .clearance-title { font-family: 'Playfair Display', serif; color: var(--enigma-gold); font-size: clamp(2rem, 6vw, 4rem); letter-spacing: 5px; text-transform: uppercase; margin-bottom: 20px; text-align: center; transform: translateY(30px); opacity: 0; }
        .secret-quote { font-family: 'Courier New', monospace; color: #fff; font-size: 1rem; text-align: center; max-width: 80%; line-height: 1.8; letter-spacing: 3px; transform: translateY(20px); opacity: 0; }
        .btn-return { margin-top: 40px; padding: 12px 30px; border: 1px solid var(--enigma-gold); background: rgba(212,175,55,0.1); color: var(--enigma-gold); font-family: 'Inter', sans-serif; text-transform: uppercase; letter-spacing: 3px; border-radius: 30px; cursor: pointer; transition: 0.3s; text-decoration: none; transform: translateY(20px); opacity: 0; }
        .btn-return:hover { background: var(--enigma-gold); color: #000; }

        @media (max-width: 768px) { 
            .btn-back-vault { top: 15px; left: 15px; padding: 8px 14px; font-size: 10px; }
            .enigma-wrapper { height: auto; min-height: 100vh; padding: 70px 15px 30px 15px; justify-content: flex-start; } 
            .vault-container { width: clamp(260px, 85vw, 340px); margin-bottom: 15px; } 
            .riddle-box { margin-top: 20px; width: 100%; }
        }
        @media (min-width: 769px) { .enigma-wrapper { flex-direction: row; gap: 60px; } .riddle-box { text-align: left; } .riddle-text { text-align: left !important; } .vault-container { width: 450px; } }
      `}</style>

      <Link href="/fitur" className="btn-back-vault">
        <i className="fa-solid fa-chevron-left"></i> Exit Enigma
      </Link>

      <div className="enigma-wrapper">
        <div className="vault-container" id="vaultContainer" ref={vaultContainerRef}>
          <div className="selection-marker"></div>
          <div className="ring outer" ref={ringOuterRef} data-ring="0"></div>
          <div className="ring middle" ref={ringMiddleRef} data-ring="1"></div>
          <div className="ring inner" ref={ringInnerRef} data-ring="2"></div>
          <div className="vault-core" id="vaultCore">
              <Image src="/images/logo-utuh.webp" className="core-logo" id="coreLogo" alt="Logo" width={100} height={100} priority style={{ width: "60%", height: "auto" }} />
          </div>
        </div>

        <div className="riddle-box">
          <div className="riddle-title">The Grand Alignment</div>
          
          {completed ? (
            <>
              <div style={{ marginTop: '20px', color: '#00ff88', fontWeight: 'bold', letterSpacing: '2px' }}>
                  SIMPUL TELAH TERPECAHKAN.
              </div>
              <div style={{ marginTop: '20px' }}>
                  <button onClick={handleReset} className="btn-return" style={{ opacity: 1, transform: 'none', display: 'inline-block', padding: '10px 25px', marginTop: 0, background: 'transparent', borderColor: '#ff3366', color: '#ff3366', fontSize: '0.8rem' }}>KUNCI ULANG BRANKAS</button>
              </div>
            </>
          ) : (
            <>
              <div className="riddle-text" style={{ textAlign: 'left', display: 'inline-block', marginTop: '15px' }}>
                  <em>Selaraskan cincin untuk membuka gerbang:</em><br/><br/>
                  <strong>Lapis Luar:</strong> Bintang kejayaan peradaban. (IV)<br/>
                  <strong>Lapis Tengah:</strong> Perisai waktu lima waktu. (II)<br/>
                  <strong>Lapis Dalam:</strong> Yang Maha Esa. (X)<br/>
              </div>
              <div style={{ marginTop: '30px' }}>
                  <button onClick={handleVerify} className="btn-return" style={{ opacity: 1, transform: 'none', display: 'inline-block', padding: '12px 30px', marginTop: 0, background: btnText === "AKSES DIBERIKAN" ? "#00ff88" : "var(--enigma-gold)", color: '#000', fontWeight: 'bold' }}>{btnText}</button>
              </div>
              <div id="errorMsg" style={{ marginTop: '15px', color: '#ff3366', fontSize: '0.85rem', letterSpacing: '1px', display: errorMsg ? 'block' : 'none' }}>Kombinasi tidak selaras. Getaran ditolak.</div>
            </>
          )}
        </div>

        <div className="success-overlay" id="successOverlay">
          <div className="clearance-title">Clearance: Apex</div>
          <div className="secret-quote">"Intelijen sejati bukanlah mengetahui segalanya,<br/>melainkan melihat apa yang disembunyikan oleh dunia."</div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }} className="action-buttons">
              <Link href="/fitur" className="btn-return">Kembali ke Vault</Link>
              <button onClick={handleReset} className="btn-return" style={{ background: 'transparent', borderColor: '#ff3366', color: '#ff3366' }}>Kunci Ulang</button>
          </div>
        </div>
      </div>
    </>
  );
}

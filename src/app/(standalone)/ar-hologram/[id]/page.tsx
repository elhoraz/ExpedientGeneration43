"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import gsap from "gsap";

export default function ARHologramClient() {
  const params = useParams();
  const id = params.id as string;
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 3D Rotation Animation simulating AR tracking
    gsap.to(cardRef.current, {
        rotationY: 360,
        duration: 20,
        repeat: -1,
        ease: "linear"
    });

    gsap.to(cardRef.current, {
        y: -20,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });
  }, []);

  return (
    <div className="ar-wrapper">
      <style>{`
        body { background-color: #000; margin: 0; overflow: hidden; font-family: 'Inter', sans-serif; }
        .ar-wrapper { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 1000; background: radial-gradient(circle at center, rgba(0,255,136,0.1) 0%, #000 70%); }
        
        .ar-scene { perspective: 1000px; width: 300px; height: 400px; position: relative; }
        
        .hologram-card { width: 100%; height: 100%; position: absolute; transform-style: preserve-3d; }
        .holo-face { position: absolute; width: 100%; height: 100%; background: rgba(0, 255, 136, 0.1); border: 2px solid #00ff88; border-radius: 20px; backdrop-filter: blur(5px); display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 0 30px rgba(0,255,136,0.3), inset 0 0 20px rgba(0,255,136,0.2); }
        .holo-face.front { transform: translateZ(20px); }
        .holo-face.back { transform: rotateY(180deg) translateZ(20px); }
        
        .holo-glow { position: absolute; bottom: -50px; left: 50%; transform: translateX(-50%) rotateX(90deg); width: 200px; height: 200px; background: radial-gradient(circle, rgba(0,255,136,0.5) 0%, transparent 70%); filter: blur(20px); }

        .holo-avatar { width: 100px; height: 100px; border-radius: 50%; border: 2px solid #00ff88; margin-bottom: 20px; box-shadow: 0 0 15px #00ff88; background: #000; display: flex; justify-content: center; align-items: center; }
        .holo-name { font-family: 'Playfair Display', serif; color: #fff; font-size: 1.5rem; text-shadow: 0 0 10px #00ff88; margin: 0; }
        .holo-id { color: #00ff88; font-family: monospace; font-size: 0.9rem; margin-top: 5px; }

        .scanlines { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,255,136,0.1) 50%, rgba(0,255,136,0.1)); background-size: 100% 4px; pointer-events: none; z-index: 50; mix-blend-mode: overlay; }

        .btn-close { position: absolute; top: 40px; left: 20px; background: rgba(0,0,0,0.5); color: #00ff88; border: 1px solid rgba(0,255,136,0.5); padding: 10px 20px; border-radius: 30px; font-size: 0.85rem; text-decoration: none; z-index: 100; backdrop-filter: blur(10px); }
      `}</style>

      <div className="scanlines"></div>

      <Link href="/direktori" className="btn-close">
        <i className="fa-solid fa-arrow-left"></i> Tutup Hologram
      </Link>

      <div className="ar-scene">
        <div className="hologram-card" ref={cardRef}>
            <div className="holo-face front">
                <div className="holo-avatar">
                    <i className="fa-solid fa-user-astronaut" style={{ fontSize: '3rem', color: '#00ff88' }}></i>
                </div>
                <h2 className="holo-name">Alumni Data</h2>
                <div className="holo-id">ID: {id}</div>
                <div style={{ marginTop: '20px', fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '2px' }}>Aegis AR Core</div>
            </div>
            <div className="holo-face back">
                <i className="fa-solid fa-fingerprint" style={{ fontSize: '4rem', color: 'rgba(0,255,136,0.3)' }}></i>
                <div style={{ marginTop: '20px', fontSize: '0.8rem', color: '#00ff88', textTransform: 'uppercase', letterSpacing: '2px' }}>Verified Asset</div>
            </div>
        </div>
        <div className="holo-glow"></div>
      </div>

      <div style={{ position: 'absolute', bottom: '50px', color: '#00ff88', fontFamily: 'monospace', fontSize: '0.8rem', opacity: 0.5 }}>
        [ MENSIMULASIKAN KONEKSI AR_CORE ]
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";

export default function ScannerClient() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Request camera access
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                    setScanning(true);
                }
            })
            .catch(err => {
                console.error("Camera error:", err);
            });
    }

    // Scanner animation
    gsap.fromTo(".scan-line", 
        { top: "0%" }, 
        { top: "100%", duration: 2, repeat: -1, yoyo: true, ease: "linear" }
    );

    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
        }
    };
  }, []);

  const simulateScan = () => {
    // Simulate successful scan
    gsap.to(".scanner-frame", { borderColor: "#00ff88", boxShadow: "0 0 50px #00ff88", duration: 0.3 });
    setTimeout(() => {
        router.push("/ar-hologram/demo"); // Redirect to holographic AR view
    }, 1000);
  };

  return (
    <div className="scanner-wrapper">
      <style>{`
        body { background-color: #000; margin: 0; overflow: hidden; font-family: 'Inter', sans-serif; }
        .scanner-wrapper { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 1000; background: #000; }
        
        .video-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1; opacity: 0.5; }
        
        .scanner-ui { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; display: flex; flex-direction: column; justify-content: center; align-items: center; pointer-events: none; }
        
        .scanner-frame { width: clamp(240px, 75vw, 300px); height: clamp(240px, 75vw, 300px); border: 2px solid rgba(212,175,55,0.5); position: relative; border-radius: 20px; overflow: hidden; pointer-events: auto; cursor: crosshair; }
        .scanner-frame::before, .scanner-frame::after { content: ''; position: absolute; width: 35px; height: 35px; border-color: #d4af37; border-style: solid; }
        .scanner-frame::before { top: -2px; left: -2px; border-width: 4px 0 0 4px; border-top-left-radius: 20px; }
        .scanner-frame::after { bottom: -2px; right: -2px; border-width: 0 4px 4px 0; border-bottom-right-radius: 20px; }
        
        .scan-line { position: absolute; left: 0; width: 100%; height: 2px; background: #d4af37; box-shadow: 0 0 15px #d4af37, 0 0 30px #d4af37; z-index: 15; }
        
        .scan-text { margin-top: 40px; color: #d4af37; font-family: 'Playfair Display', serif; font-size: 1.2rem; letter-spacing: 3px; text-transform: uppercase; text-align: center; }
        
        .btn-close { position: absolute; top: 40px; left: 20px; background: rgba(0,0,0,0.5); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 30px; font-size: 0.85rem; text-decoration: none; pointer-events: auto; z-index: 50; backdrop-filter: blur(10px); display: flex; align-items: center; gap: 8px; }
      `}</style>

      <video ref={videoRef} autoPlay playsInline muted className="video-container"></video>

      <div className="scanner-ui">
        <Link href="/fitur" className="btn-close">
          <i className="fa-solid fa-xmark"></i> Tutup Scanner
        </Link>

        <div className="scanner-frame" onClick={simulateScan}>
            <div className="scan-line"></div>
        </div>

        <div className="scan-text">
            {scanning ? "MENGIDENTIFIKASI ARTEFAK..." : "MEMBUKA KAMERA..."}
            <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '10px', fontFamily: 'Inter', letterSpacing: '1px' }}>
                Arahkan kamera ke Sovereign ID atau QR Code
            </div>
            <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '10px' }}>(Klik kotak untuk simulasi scan sukses)</div>
        </div>
      </div>
    </div>
  );
}

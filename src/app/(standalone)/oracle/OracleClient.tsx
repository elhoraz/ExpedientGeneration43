"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { createClient } from "@/lib/supabase/client";
import { getAvatarUrl } from "@/lib/avatar";

// @ts-ignore
// Let faceapi be accessible globally after script loads
declare global {
  interface Window {
    faceapi: any;
  }
}

export default function OracleClient({ userId, initialVisions, userProfile }: { userId: string, initialVisions: any[], userProfile: any }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [statusText, setStatusText] = useState("MEMUAT NEURAL NETWORKS...");
  const [isScanning, setIsScanning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [capsuleOpen, setCapsuleOpen] = useState(false);
  const [visions, setVisions] = useState(initialVisions);
  const [unlockedVision, setUnlockedVision] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isFetchingAi, setIsFetchingAi] = useState(false);
  const [referenceDescriptor, setReferenceDescriptor] = useState<Float32Array | null>(null);
  const [isMatch, setIsMatch] = useState<boolean | null>(null);

  const supabase = createClient();

  useEffect(() => {
    // Attempt to load models after script is loaded
    const checkFaceApi = setInterval(async () => {
      if (window.faceapi) {
        clearInterval(checkFaceApi);
        try {
          const FACE_MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
          // It's possible we need to load tinyFaceDetector instead of faceLandmark68Net
          await Promise.all([
            window.faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODEL_URL),
            window.faceapi.nets.faceLandmark68Net.loadFromUri(FACE_MODEL_URL),
            window.faceapi.nets.faceExpressionNet.loadFromUri(FACE_MODEL_URL),
            window.faceapi.nets.faceRecognitionNet.loadFromUri(FACE_MODEL_URL)
          ]);
          setModelsLoaded(true);
          setStatusText("MEMUAT DATA BIOMETRIK...");

          if (userProfile?.foto_profil) {
            try {
              const fotoUrl = getAvatarUrl(userProfile.foto_profil);
              const img = await window.faceapi.fetchImage(fotoUrl);
              const det = await window.faceapi.detectSingleFace(img, new window.faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
              if (det) setReferenceDescriptor(det.descriptor);
            } catch (err) {
              console.warn("Gagal mengekstrak biometrik foto profil", err);
            }
          }

          setStatusText("SYSTEM STANDBY");
          initCamera();
        } catch (e) {
          console.error("Gagal memuat model:", e);
          setStatusText("GAGAL MEMUAT SISTEM AI. Pastikan model tersedia.");
        }
      }
    }, 500);

    return () => {
      clearInterval(checkFaceApi);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error(err);
      setStatusText("AKSES KAMERA DITOLAK. Mohon berikan izin pada browser.");
    }
  };

  const handleScan = async () => {
    if (!modelsLoaded || !videoRef.current || !canvasRef.current) return;
    setIsScanning(true);
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

    const messages = [
      "MENGKALKULASI LANDMARK WAJAH...",
      "MENGANALISIS NAFSHIYAH (STATE OF SOUL)...",
      "MENGUKUR SYMMETRY INDEX...",
      "MENYINKRONISASI IDENTITAS SOVEREIGN..."
    ];
    let msgIndex = 0;
    setStatusText(messages[0]);

    const msgInterval = setInterval(() => {
      msgIndex++;
      if (msgIndex < messages.length) {
        setStatusText(messages[msgIndex]);
      }
    }, 800);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.style.display = 'block';

    let isScanningActive = true;
    let finalDetections: any = null;

    // Real-time Visual Loop
    const drawFrame = () => {
      if (!isScanningActive) return;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (finalDetections) {
        const dims = window.faceapi.matchDimensions(canvas, video);
        const resizedDets = window.faceapi.resizeResults(finalDetections, dims);
        
        // Draw cybernetic lines
        window.faceapi.draw.drawFaceLandmarks(canvas, resizedDets, { drawLines: true, color: 'rgba(212, 175, 55, 0.7)', lineWidth: 1.5 });
        
        // Draw tech HUD text
        const nose = resizedDets.landmarks.getNose()[0];
        const leftEye = resizedDets.landmarks.getLeftEye()[0];
        ctx.fillStyle = '#d4af37';
        ctx.font = '12px Courier New';
        ctx.fillText(`AXIS-N: ${Math.round(nose.x)}, ${Math.round(nose.y)}`, nose.x + 15, nose.y);
        ctx.fillText(`OCULAR-L: LOCKED`, leftEye.x - 50, leftEye.y - 15);
      }
      requestAnimationFrame(drawFrame);
    };
    drawFrame();

    // Background Detection Loop
    const detectLoop = async () => {
      if (!isScanningActive) return;
      const det = await window.faceapi.detectSingleFace(video, new window.faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withFaceDescriptor();
      if (det) finalDetections = det;
      if (isScanningActive) setTimeout(detectLoop, 150);
    };
    detectLoop();

    setTimeout(() => {
      isScanningActive = false;
      clearInterval(msgInterval);
      setIsScanning(false);

      if (!finalDetections) {
        setStatusText("PEMINDAIAN GAGAL: WAJAH TIDAK DITEMUKAN. SILAKAN COBA LAGI.");
        canvas.style.display = 'none';
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        return; 
      }

      let matchFound = false;
      if (!referenceDescriptor) {
        // Jika gagal mengekstrak wajah dari foto profil, kita asumsikan ini adalah pemilik (fallback)
        // agar tidak memblokir user yang foto profilnya burem/tidak terdeteksi
        matchFound = true; 
      } else if (finalDetections.descriptor) {
        const distance = window.faceapi.euclideanDistance(referenceDescriptor, finalDetections.descriptor);
        // Loosen threshold to 0.65 for better match rate in varying lighting
        if (distance < 0.65) {
          matchFound = true;
        } else {
          console.log("Face distance too high:", distance);
        }
      }
      setIsMatch(matchFound);

      setStatusText(matchFound ? "FIRASAT TERVERIFIKASI" : "TAMU TAK DIKENAL");
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

      let maqam = "Tawakkul (Berserah Diri)";
      let symmetryIndex = (90 + Math.random() * 8).toFixed(1);
      let dominantEmotion = "neutral";
      let filterStr = matchFound ? "sepia(0.6) hue-rotate(-10deg) brightness(0.8) contrast(1.2)" : "grayscale(0.8) sepia(0.3) hue-rotate(180deg) brightness(0.7) contrast(1.4)";
      let tintColor = matchFound ? "rgba(212, 175, 55, 0.4)" : "rgba(100, 150, 200, 0.4)"; 

      const leftEye = finalDetections.landmarks.getLeftEye();
      const rightEye = finalDetections.landmarks.getRightEye();
      const diffY = Math.abs(leftEye[0].y - rightEye[0].y);
      symmetryIndex = Math.max(80, 99.9 - (diffY * 0.5)).toFixed(1);

      const expr = finalDetections.expressions;
      dominantEmotion = Object.keys(expr).reduce((a, b) => expr[a as keyof typeof expr] > expr[b as keyof typeof expr] ? a : b);

      switch(dominantEmotion) {
          case 'happy': 
              maqam = "Tasyakkur (Bersyukur)"; 
              tintColor = "rgba(0, 255, 136, 0.4)"; 
              filterStr = "sepia(0.3) hue-rotate(90deg) brightness(0.9) contrast(1.3)";
              break;
          case 'sad': 
              maqam = "Muhasabah (Introspeksi)"; 
              tintColor = "rgba(0, 162, 255, 0.4)"; 
              filterStr = "sepia(0.5) hue-rotate(180deg) brightness(0.9) contrast(1.1)";
              break;
          case 'angry':
          case 'disgusted':
              maqam = "Mujahadah (Berjuang)"; 
              tintColor = "rgba(255, 69, 0, 0.4)"; 
              filterStr = "sepia(0.6) hue-rotate(10deg) brightness(0.8) contrast(1.3)";
              break;
          case 'fearful':
          case 'surprised':
              maqam = "Yaqza (Terjaga/Waspada)"; 
              tintColor = "rgba(180, 100, 255, 0.4)"; 
              filterStr = "sepia(0.3) hue-rotate(260deg) brightness(0.85) contrast(1.2)";
              break;
      }

      const ctx = canvas.getContext("2d")!;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.filter = filterStr;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = tintColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      setResultData({ maqam, symmetryIndex, dominantEmotion });
      setShowResult(true);

    }, 3500);
  };

  const handleAskGemini = async () => {
    setIsFetchingAi(true);
    try {
      const payload = {
        name: isMatch ? (userProfile?.nama_lengkap || userProfile?.nama_panggilan) : "Tamu Tak Dikenal",
        origin: isMatch ? (userProfile?.tempat_lahir) : "Tidak diketahui",
        vision: isMatch ? (userProfile?.cita_cita) : "Mencari petunjuk di masa depan",
        motivation: isMatch ? (userProfile?.motivasi_hidup) : "Tersesat namun mencari arah",
        isGuest: !isMatch
      };

      const res = await fetch("/api/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setAiInsight(data.insight);
      } else {
        setAiInsight("Sistem Gagal Menghubungi Nalar Eksternal: " + data.error);
      }
    } catch (err) {
      setAiInsight("Interferensi Jaringan. Gagal menyelaraskan pandangan.");
    }
    setIsFetchingAi(false);
  };

  const handleReset = () => {
    setShowResult(false);
    setAiInsight(null);
    setIsMatch(null);
    setStatusText("SYSTEM STANDBY");
  };

  const handleSealMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const vision_text = formData.get("vision_text") as string;
    const unlock_date = formData.get("unlock_date") as string;

    const { data, error } = await supabase.from("oracle_visions").insert({
      user_id: userId,
      vision_text,
      unlock_date,
      is_unlocked: false
    }).select().single();

    if (!error && data) {
      setVisions(prev => [...prev, data]);
      e.currentTarget.reset();
    }
  };

  const handleUnlock = async (id: string, text: string) => {
    await supabase.from("oracle_visions").update({ is_unlocked: true }).eq("id", id);
    setVisions(prev => prev.map(v => v.id === id ? { ...v, is_unlocked: true } : v));
    setUnlockedVision(text);
  };

  const baseTitles = [
    "Al-Amin (Sang Terpercaya)", "Al-Fatih (Sang Pembuka)", "Al-Karim (Sang Dermawan)", "Al-Adil (Sang Adil)", "Al-Hafidz (Sang Penjaga)", 
    "Al-Muhsin (Sang Pembuat Kebaikan)", "As-Siddiq (Sang Pembenar)", "Al-Hakim (Sang Bijaksana)", "Al-Mujahid (Sang Pejuang)", "Al-Qawi (Sang Kuat)"
  ];
  
  const descriptors = [
    "Menjaga amanah dalam setiap langkah.",
    "Membawa kemenangan dan pencerahan.",
    "Kebaikan yang mengalir tanpa henti.",
    "Menempatkan segala sesuatu pada porsinya.",
    "Melindungi warisan dan nilai-nilai luhur."
  ];

  let seedNum = 0;
  for (let i = 0; i < userId.length; i++) {
    seedNum += userId.charCodeAt(i);
  }
  const myTitle = isMatch === false ? "TAMU TAK DIKENAL" : baseTitles[seedNum % baseTitles.length];
  const myDesc = isMatch === false ? "Wajah yang tak tercatat dalam kronik masa lalu." : descriptors[(seedNum * 3) % descriptors.length];

  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.min.js" strategy="afterInteractive" />
      <style>{`
        :root {
            --oracle-gold: #d4af37;
            --oracle-dark: #020202;
            --text-secondary: #8b9ba8;
        }
        body { background: var(--oracle-dark); color: #fff; margin: 0; font-family: 'Inter', sans-serif; overflow: hidden; }
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
        .btn-time-capsule {
            position: absolute; top: 30px; right: 30px; z-index: 100;
            display: flex; align-items: center; gap: 10px;
            padding: 10px 20px; background: rgba(0,0,0,0.6);
            border: 1px solid rgba(212,175,55,0.3); border-radius: 8px;
            color: #d4af37; font-size: 11px; font-weight: 600; 
            letter-spacing: 3px; cursor: pointer; text-transform: uppercase;
        }
        .time-capsule-panel {
            position: absolute; top: 0; right: -400px; width: 400px; height: 100vh;
            background: rgba(5,5,5,0.95); border-left: 1px solid var(--oracle-gold);
            z-index: 90; padding: 100px 30px 30px; transition: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            overflow-y: auto;
        }
        .time-capsule-panel.open { right: 0; }
        .capsule-form textarea {
            width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(212,175,55,0.3);
            color: #fff; padding: 15px; border-radius: 8px; font-family: 'Courier New'; resize: vertical; margin-bottom: 15px;
        }
        .capsule-form input[type=date] {
            width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(212,175,55,0.3);
            color: #fff; padding: 10px; border-radius: 8px; margin-bottom: 20px;
        }
        .capsule-btn {
            width: 100%; padding: 12px; background: var(--oracle-gold); color: #000;
            border: none; border-radius: 8px; font-weight: bold; letter-spacing: 2px; cursor: pointer;
        }
        .oracle-wrapper {
            width: 100vw; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;
        }
        .vision-container {
            position: relative; width: clamp(300px, 90vw, 500px); aspect-ratio: 3/4;
            border: 2px solid rgba(212,175,55,0.3); border-radius: 20px; overflow: hidden;
            box-shadow: 0 0 50px rgba(0,0,0,0.8); background: #0a0a0a;
        }
        .vision-container video, .vision-container canvas {
            width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0;
        }
        .logo-reticle { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60%; opacity: 0.15; filter: grayscale(1); pointer-events: none; transition: 0.5s; }
        .scanner-laser { position: absolute; top: 0; left: 0; width: 100%; height: 2px; background: var(--oracle-gold); box-shadow: 0 0 20px var(--oracle-gold); display: none; z-index: 10; }
        .hud-text { position: absolute; bottom: 30px; left: 0; width: 100%; text-align: center; font-family: 'Courier New'; color: var(--oracle-gold); font-size: 0.8rem; letter-spacing: 3px; z-index: 10; }
        
        .result-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); z-index: 20; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 30px; opacity: 0; pointer-events: none; transition: 0.5s; }
        .result-overlay.show { opacity: 1; pointer-events: auto; }
        
        .controls-panel { margin-top: 40px; display: flex; gap: 20px; }
        .btn-initiate { padding: 15px 40px; background: rgba(212,175,55,0.1); border: 1px solid var(--oracle-gold); color: var(--oracle-gold); font-family: 'Inter'; text-transform: uppercase; letter-spacing: 4px; border-radius: 50px; cursor: pointer; transition: 0.3s; }
        .btn-initiate:hover { background: var(--oracle-gold); color: #000; }
        .btn-initiate:disabled { opacity: 0.5; pointer-events: none; }
        
        .capsule-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; }
        .unseal-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 9999; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(5px); }
        .unseal-box { background: var(--oracle-dark); border: 1px solid var(--oracle-gold); padding: 30px; border-radius: 10px; max-width: 600px; width: 90%; }
        
        /* Premium AI Insight Modal */
        .oracle-insight-modal {
          position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999;
          display: flex; justify-content: center; align-items: center; padding: 20px;
          backdrop-filter: blur(10px); animation: fadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .oracle-insight-paper {
          background: linear-gradient(145deg, #111, #080808);
          border: 1px solid rgba(212,175,55,0.4); border-radius: 16px;
          padding: 40px; max-width: 650px; width: 100%; max-height: 85vh; overflow-y: auto;
          box-shadow: 0 20px 50px rgba(0,0,0,0.9), inset 0 0 40px rgba(212,175,55,0.05);
          color: #dcdcdc; font-family: 'Inter', sans-serif; line-height: 1.8;
          position: relative; animation: slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .oracle-insight-paper::-webkit-scrollbar { width: 4px; }
        .oracle-insight-paper::-webkit-scrollbar-thumb { background: var(--oracle-gold); border-radius: 10px; }
        .oi-header { text-align: center; margin-bottom: 30px; border-bottom: 1px dashed rgba(212,175,55,0.2); padding-bottom: 25px; }
        .oi-title { color: var(--oracle-gold); font-family: 'Playfair Display', serif; font-size: 2rem; letter-spacing: 5px; margin: 0; text-transform: uppercase; }
        .oi-subtitle { color: var(--text-secondary); font-size: 0.8rem; letter-spacing: 2px; margin-top: 10px; text-transform: uppercase; }
        .oi-quote-box {
          margin-top: 35px; padding: 30px; background: rgba(212,175,55,0.03);
          border-left: 3px solid var(--oracle-gold); border-radius: 0 12px 12px 0;
          font-family: 'Playfair Display', serif; font-size: 1.15rem; color: var(--oracle-gold);
          position: relative; line-height: 1.7; text-align: center;
        }
        .oi-quote-icon { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); color: var(--oracle-gold); background: #080808; padding: 0 15px; font-size: 1.5rem; }
        .oi-close {
          display: block; margin: 40px auto 0; padding: 12px 40px; background: transparent;
          border: 1px solid var(--oracle-gold); color: var(--oracle-gold);
          border-radius: 30px; font-family: 'Inter'; letter-spacing: 3px; font-size: 0.85rem; text-transform: uppercase;
          cursor: pointer; transition: 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .oi-close:hover { background: var(--oracle-gold); color: #000; box-shadow: 0 0 20px rgba(212,175,55,0.4); transform: translateY(-3px); }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>

      <Link href="/fitur" className="btn-back-vault">
        <i className="fa-solid fa-chevron-left"></i> Exit Vision
      </Link>

      <button className="btn-time-capsule" onClick={() => setCapsuleOpen(!capsuleOpen)}>
        <i className="fa-solid fa-hourglass-half"></i> Pesan Masa Depan
      </button>

      <div className={`time-capsule-panel ${capsuleOpen ? 'open' : ''}`}>
        <div style={{color:'var(--oracle-gold)', marginBottom:'20px', fontWeight:'bold', letterSpacing:'2px'}}>TULIS PESAN MASA DEPAN</div>
        <form className="capsule-form" onSubmit={handleSealMessage}>
          <textarea name="vision_text" rows={4} placeholder="Tuliskan visi atau pesan rahasia untuk diri Anda di masa depan..." required></textarea>
          <label style={{fontSize:'0.8rem', color:'#888', marginBottom:'5px', display:'block'}}>Tanggal Dibuka:</label>
          <input type="date" name="unlock_date" required min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} />
          <button type="submit" className="capsule-btn">SEGEL PESAN</button>
        </form>

        <div style={{color:'var(--oracle-gold)', marginTop:'40px', marginBottom:'20px', fontWeight:'bold', letterSpacing:'2px'}}>ARSIP PESAN ANDA</div>
        {visions.length > 0 ? visions.map(v => (
          <div key={v.id} className="capsule-card">
            <div style={{fontSize:'0.8rem', color:'var(--oracle-gold)', marginBottom:'10px'}}>
              <i className={`fa-solid fa-lock${v.is_unlocked ? '-open' : ''}`}></i> Terjadwal: {new Date(v.unlock_date).toLocaleDateString()}
            </div>
            {v.is_unlocked ? (
              <div style={{fontFamily:'Courier New', fontSize:'0.9rem', color:'#fff', whiteSpace:'pre-wrap'}}>{v.vision_text}</div>
            ) : (
              new Date(v.unlock_date) <= new Date() ? (
                <button onClick={() => handleUnlock(v.id, v.vision_text)} style={{background:'transparent', border:'1px solid #d4af37', color:'#d4af37', padding:'5px 10px', cursor:'pointer', fontSize:'0.8rem', borderRadius:'3px'}}>BUKA SEGEL</button>
              ) : (
                <div style={{fontSize:'0.8rem', color:'#888'}}>Segel Waktu Aktif. Menunggu takdir.</div>
              )
            )}
          </div>
        )) : (
          <div style={{fontSize:'0.8rem', color:'#777', fontStyle:'italic'}}>Belum ada pesan yang tersegel.</div>
        )}
      </div>

      {unlockedVision && (
        <div className="unseal-modal">
          <div className="unseal-box">
            <h2 style={{color:'var(--oracle-gold)', fontFamily:'Playfair Display', marginBottom:'20px'}}><i className="fa-solid fa-envelope-open-text"></i> PESAN TERBUKA</h2>
            <div style={{fontFamily:'Courier New', color:'#fff', padding:'20px', background:'rgba(0,0,0,0.5)', border:'1px dashed rgba(212,175,55,0.3)', borderRadius:'5px'}}>
              {unlockedVision}
            </div>
            <div style={{marginTop:'30px', textAlign:'right'}}>
              <button onClick={() => setUnlockedVision(null)} style={{background:'transparent', color:'var(--oracle-gold)', border:'1px solid var(--oracle-gold)', padding:'10px 25px', cursor:'pointer'}}>TUTUP DOKUMEN</button>
            </div>
          </div>
        </div>
      )}

      <div className="oracle-wrapper">
        <div className={`vision-container ${isScanning ? 'scanning' : ''}`}>
          <video ref={videoRef} autoPlay playsInline style={{ opacity: showResult ? 0 : 1 }}></video>
          <canvas ref={canvasRef} style={{ display: showResult ? 'block' : 'none' }}></canvas>
          
          <img src="/images/logo-utuh.webp" className="logo-reticle" style={{ opacity: showResult ? 0 : 0.15 }} alt="Scanner" />
          
          {isScanning && (
            <div className="scanner-laser" style={{ display: 'block', animation: 'scan 1.2s linear infinite alternate' }}></div>
          )}
          
          {!showResult && <div style={{position:'absolute', top:'20px', left:'20px', color:'rgba(212,175,55,0.7)', fontFamily:'serif', fontSize:'1.2rem', direction:'rtl'}}>وُجُوهٌ يَوْمَئِذٍ مُّسْفِرَةٌ</div>}
          
          <div className="hud-text">{statusText}</div>

          <div className={`result-overlay ${showResult ? 'show' : ''}`}>
            <h2 style={{fontFamily:'Playfair Display', color:'var(--oracle-gold)', fontSize:'2rem', marginBottom:'10px'}}>{myTitle}</h2>
            <div style={{color:'#fff', marginBottom:'20px'}}>{myDesc}</div>
            {resultData && (
              <div style={{fontFamily:'monospace', fontSize:'0.85rem', color:'#8b9ba8', background:'rgba(0,0,0,0.5)', padding:'15px', borderRadius:'8px', textAlign:'left', marginBottom: '15px'}}>
                  <span style={{color:'#d4af37'}}>&gt;</span> RESONANCE STABILITY : {resultData.symmetryIndex}%<br/>
                  <span style={{color:'#d4af37'}}>&gt;</span> DOMINANT EMOTION  : {resultData.dominantEmotion.toUpperCase()}<br/>
                  <span style={{color:'#d4af37'}}>&gt;</span> CURRENT MAQAM     : <b style={{color:'#fff'}}>{resultData.maqam}</b>
              </div>
            )}
            
            {showResult && !aiInsight && (
              <button 
                onClick={handleAskGemini}
                disabled={isFetchingAi}
                style={{ width: "100%", background: "linear-gradient(45deg, #d4af37, #b8860b)", border: "none", color: "#000", padding: "10px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "2px" }}
              >
                {isFetchingAi ? <><i className="fa-solid fa-circle-notch fa-spin"></i> MEMPROSES NASIHAT AI...</> : <><i className="fa-solid fa-bolt"></i> BACA NASIHAT MASA DEPAN</>}
              </button>
            )}
          </div>
        </div>

        {/* AI Insight Modal (Moved outside vision-container) */}
        {aiInsight && (
          <div className="oracle-insight-modal">
            <div className="oracle-insight-paper">
                <div className="oi-header">
                    <h2 className="oi-title"><i className="fa-solid fa-sparkles" style={{ fontSize: '1.2rem', verticalAlign: 'middle', marginRight: '10px' }}></i> Pesan Masa Depan</h2>
                    <div className="oi-subtitle">{myTitle}</div>
                </div>
                
                {aiInsight.includes('---') ? (
                  <>
                    <div style={{ textAlign: "justify", fontSize: "1rem" }}>
                      {aiInsight.split('---')[0].trim()}
                    </div>
                    <div className="oi-quote-box">
                      <i className="fa-solid fa-quote-left oi-quote-icon"></i>
                      {aiInsight.split('---')[1].trim()}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: "justify", fontSize: "1rem" }}>{aiInsight}</div>
                )}
                
                <button className="oi-close" onClick={() => setAiInsight(null)}>
                  Tutup Dokumen
                </button>
            </div>
          </div>
        )}

        <div className="controls-panel">
          {!showResult ? (
            <button className="btn-initiate" onClick={handleScan} disabled={!modelsLoaded || isScanning}>
              <i className="fa-solid fa-eye"></i> Mulai Pemindaian
            </button>
          ) : (
            <button className="btn-initiate" onClick={handleReset}>
              Pindai Ulang
            </button>
          )}
        </div>
      </div>
      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </>
  );
}

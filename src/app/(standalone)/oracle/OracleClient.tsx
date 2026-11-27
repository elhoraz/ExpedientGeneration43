"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { createClient } from "@/lib/supabase/client";
import { getAvatarUrl } from "@/lib/avatar";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useDialogEscape } from "@/hooks/useDialogEscape";

// @ts-ignore
// Let faceapi be accessible globally after script loads
declare global {
  interface Window {
    faceapi: any;
  }
}

export default function OracleClient({ userId, initialVisions, userProfile }: { userId: string, initialVisions: any[], userProfile: any }) {
  const { locale, dir, isRTL } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [statusText, setStatusText] = useState("MEMUAT ASISTEN ALUMNI...");
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

  useDialogEscape(capsuleOpen, () => setCapsuleOpen(false));
  useDialogEscape(Boolean(unlockedVision), () => setUnlockedVision(null));
  useDialogEscape(Boolean(aiInsight), () => setAiInsight(null));

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

    document.body.classList.add("page-oracle");

    return () => {
      document.body.classList.remove("page-oracle");
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
      "MENGANALISIS EKSPRESI WAJAH...",
      "MEMBACA REFLEKSI SUASANA HATI...",
      "MENGHITUNG TINGKAT KETENANGAN...",
      "MENYIAPKAN HASIL REFLEKSI POSITIF..."
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
        ctx.font = '12px var(--font-jetbrains-mono), monospace';
        ctx.fillText(`TITIK HIDUNG: ${Math.round(nose.x)}, ${Math.round(nose.y)}`, nose.x + 15, nose.y);
        ctx.fillText(`MATA KIRI: TERKUNCI`, leftEye.x - 50, leftEye.y - 15);
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
      let symmetryIndex = "95.0";
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
              tintColor = "rgba(0, 200, 83, 0.4)"; 
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
            --oracle-dark: var(--bg-main, #060b14);
            --text-secondary: var(--text-secondary, #8b9ba8);
        }
        body.page-oracle { background: var(--bg-main, #060b14); color: var(--text-primary, #fff); margin: 0; font-family: var(--font-sans, inherit); overflow: hidden; }
        .btn-back-vault {
            position: absolute; top: max(20px, calc(env(safe-area-inset-top, 16px) + 6px)); inset-inline-start: max(16px, env(safe-area-inset-left, 16px)); z-index: 100;
            display: inline-flex; align-items: center; gap: 8px;
            min-height: 44px;
            padding: 10px 18px; background: var(--surface-raised, rgba(12, 18, 28, 0.92));
            border: 1px solid rgba(212,175,55,0.35); border-radius: 10px;
            color: var(--gold-main, #d4af37); font-size: 0.78rem; font-weight: 600; 
            letter-spacing: 0.06em; text-decoration: none; text-transform: uppercase;
            transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
        }
        .btn-time-capsule {
            position: absolute; top: max(20px, calc(env(safe-area-inset-top, 16px) + 6px)); inset-inline-end: max(16px, env(safe-area-inset-right, 16px)); z-index: 100;
            display: inline-flex; align-items: center; gap: 8px;
            min-height: 44px;
            padding: 10px 18px; background: var(--surface-raised, rgba(12, 18, 28, 0.92));
            border: 1px solid rgba(212,175,55,0.35); border-radius: 10px;
            color: var(--gold-main, #d4af37); font-size: 0.78rem; font-weight: 600; 
            letter-spacing: 0.06em; cursor: pointer; text-transform: uppercase;
            transition: border-color 0.2s ease, background 0.2s ease;
        }
        .btn-back-vault:focus-visible,
        .btn-time-capsule:focus-visible,
        .btn-initiate:focus-visible,
        .oi-close:focus-visible,
        .capsule-btn:focus-visible {
            outline: 2px solid var(--gold-main, #d4af37);
            outline-offset: 2px;
        }
        @media (hover: hover) and (pointer: fine) {
            .btn-back-vault:hover { transform: translateX(-2px); border-color: #d4af37; color: var(--text-primary, #fff); }
            .btn-time-capsule:hover { border-color: #d4af37; color: var(--text-primary, #fff); }
            .btn-initiate:hover { background: var(--gold-main, #d4af37); color: #060b14; }
            .oi-close:hover { background: var(--gold-main, #d4af37); color: #060b14; box-shadow: 0 0 20px rgba(212,175,55,0.4); transform: translateY(-2px); }
        }
        .time-capsule-panel {
            position: fixed; top: 0; inset-inline-end: -420px; width: min(400px, 92vw); height: 100dvh;
            background: var(--bg-card, #0a111d); border-inline-start: 1px solid rgba(212, 175, 55, 0.35);
            z-index: 90; padding: 90px 24px 24px; transition: inset-inline-end 0.35s cubic-bezier(0.4, 0, 0.2, 1);
            overflow-y: auto; -webkit-overflow-scrolling: touch; color: var(--text-primary, #f2efe9);
        }
        .time-capsule-panel.open { inset-inline-end: 0; }
        .capsule-form textarea {
            width: 100%; background: var(--surface-raised, rgba(255,255,255,0.05)); border: 1px solid rgba(212,175,55,0.3);
            color: var(--text-primary, #fff); padding: 14px; border-radius: 8px; font-family: inherit; resize: vertical; margin-bottom: 15px;
        }
        .capsule-form input[type=date] {
            width: 100%; min-height: 44px; background: var(--surface-raised, rgba(255,255,255,0.05)); border: 1px solid rgba(212,175,55,0.3);
            color: var(--text-primary, #fff); padding: 10px; border-radius: 8px; margin-bottom: 20px;
        }
        .capsule-btn {
            width: 100%; min-height: 44px; padding: 12px; background: var(--gold-main, #d4af37); color: #060b14;
            border: none; border-radius: 8px; font-weight: 700; letter-spacing: 0.06em; cursor: pointer;
        }
        .oracle-wrapper {
            position: fixed; inset: 0; width: 100%; height: 100dvh; max-width: 100vw;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            overflow: hidden; background: var(--bg-main, #060b14);
        }
        .vision-container {
            position: relative; width: clamp(280px, 86vw, 440px); max-height: 52dvh; aspect-ratio: 3/4;
            border: 2px solid rgba(212,175,55,0.3); border-radius: 20px; overflow: hidden;
            box-shadow: 0 20px 50px rgba(0,0,0,0.55); background: #0c182b;
        }
        .vision-container video, .vision-container canvas {
            width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0;
        }
        .logo-reticle { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60%; opacity: 0.15; filter: grayscale(1); pointer-events: none; transition: 0.5s; }
        .scanner-laser { position: absolute; top: 0; left: 0; width: 100%; height: 2px; background: var(--gold-main, #d4af37); box-shadow: 0 0 20px var(--gold-main, #d4af37); display: none; z-index: 10; }
        .hud-text { position: absolute; bottom: 25px; left: 0; width: 100%; text-align: center; font-family: inherit; color: #f3d267; font-size: 0.84rem; font-weight: 600; letter-spacing: 0.04em; z-index: 10; padding: 0 15px; }
        
        .result-overlay { position: absolute; inset: 0; background: rgba(6, 11, 20, 0.82); z-index: 20; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 24px; opacity: 0; pointer-events: none; transition: opacity 0.4s ease; }
        .result-overlay.show { opacity: 1; pointer-events: auto; }
        
        .controls-panel { margin-top: 28px; display: flex; gap: 15px; }
        .btn-initiate { min-height: 46px; padding: 12px 32px; background: rgba(212,175,55,0.12); border: 1px solid var(--gold-main, #d4af37); color: var(--gold-main, #d4af37); font-family: inherit; text-transform: uppercase; letter-spacing: 0.08em; border-radius: 50px; cursor: pointer; transition: background 0.25s ease, color 0.25s ease; font-size: 0.85rem; font-weight: 700; }
        .btn-initiate:disabled { opacity: 0.5; pointer-events: none; }
        
        .capsule-card { background: var(--surface-raised, rgba(255,255,255,0.04)); border: 1px solid var(--border-subtle, rgba(255,255,255,0.12)); padding: 15px; border-radius: 8px; margin-bottom: 15px; }
        .unseal-modal { position: fixed; inset: 0; background: var(--surface-scrim, rgba(6,11,20,0.88)); z-index: 9999; display: flex; justify-content: center; align-items: center; padding: 16px; }
        .unseal-box { background: var(--bg-card, #0a111d); border: 1px solid rgba(212, 175, 55, 0.45); padding: 28px; border-radius: 14px; max-width: 600px; width: 100%; color: var(--text-primary, #f2efe9); }
        
        .oracle-insight-modal {
          position: fixed; inset: 0; background: var(--surface-scrim, rgba(6,11,20,0.88)); z-index: 9999;
          display: flex; justify-content: center; align-items: center; padding: 20px;
          animation: fadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .oracle-insight-paper {
          background: var(--bg-card, #0c182b);
          border: 1px solid rgba(212,175,55,0.4); border-radius: 16px;
          padding: 36px; max-width: 650px; width: 100%; max-height: 85dvh; overflow-y: auto;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          color: var(--text-primary, #e2e8f0); font-family: inherit; line-height: 1.8;
          position: relative; animation: slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .oracle-insight-paper::-webkit-scrollbar { width: 4px; }
        .oracle-insight-paper::-webkit-scrollbar-thumb { background: var(--gold-main, #d4af37); border-radius: 10px; }
        .oi-header { text-align: center; margin-bottom: 26px; border-bottom: 1px dashed rgba(212,175,55,0.25); padding-bottom: 22px; }
        .oi-title { color: var(--gold-main, #d4af37); font-family: 'Playfair Display', serif; font-size: clamp(1.4rem, 4vw, 1.9rem); letter-spacing: 0.04em; margin: 0; text-transform: uppercase; }
        .oi-subtitle { color: var(--text-secondary); font-size: 0.85rem; letter-spacing: 0.04em; margin-top: 8px; text-transform: uppercase; }
        .oi-quote-box {
          margin-top: 30px; padding: 26px; background: rgba(212,175,55,0.06);
          border: 1px solid rgba(212,175,55,0.28); border-radius: 12px;
          font-family: 'Playfair Display', serif; font-size: 1.1rem; color: var(--gold-main, #d4af37);
          position: relative; line-height: 1.7; text-align: center;
        }
        .oi-quote-icon { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); color: var(--gold-main, #d4af37); background: var(--bg-card, #0c182b); padding: 0 15px; font-size: 1.4rem; }
        .oi-close {
          display: block; margin: 32px auto 0; min-height: 44px; padding: 10px 34px; background: transparent;
          border: 1px solid var(--gold-main, #d4af37); color: var(--gold-main, #d4af37);
          border-radius: 30px; font-family: inherit; letter-spacing: 0.06em; font-size: 0.85rem; font-weight: 700; text-transform: uppercase;
          cursor: pointer; transition: background 0.25s ease, color 0.25s ease;
        }

        :root[data-theme="light"] .btn-back-vault,
        :root[data-theme="light"] .btn-time-capsule {
          background: #ffffff;
          border-color: rgba(124, 82, 10, 0.35);
          color: #7c520a;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }
        :root[data-theme="light"] .btn-initiate,
        :root[data-theme="light"] .oi-close,
        :root[data-theme="light"] .oi-title,
        :root[data-theme="light"] .oi-quote-box,
        :root[data-theme="light"] .oi-quote-icon {
          color: #7c520a;
          border-color: rgba(124, 82, 10, 0.45);
        }
        :root[data-theme="light"] .vision-container {
          border-color: rgba(124, 82, 10, 0.35);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.14);
        }
        :root[data-theme="light"] .capsule-card {
          background: #f8fafc;
          border-color: rgba(24, 24, 27, 0.12);
        }

        @media (max-width: 640px) {
          .btn-back-vault,
          .btn-time-capsule {
            top: max(14px, calc(env(safe-area-inset-top, 14px) + 6px));
            padding: 8px 14px;
            font-size: 0.75rem;
            letter-spacing: 0.02em;
          }
          .vision-container {
            width: clamp(240px, 84vw, 340px);
            max-height: 48dvh;
          }
          .controls-panel {
            margin-top: 18px;
          }
          .btn-initiate {
            padding: 12px 26px;
            font-size: 0.8rem;
          }
          .time-capsule-panel {
            padding: 75px 18px 18px;
          }
          .oracle-insight-paper {
            padding: 24px 16px;
            max-height: 82dvh;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .scanner-laser,
          .oracle-insight-modal,
          .oracle-insight-paper {
            animation: none !important;
          }
          .time-capsule-panel,
          .result-overlay,
          .btn-back-vault,
          .btn-time-capsule,
          .btn-initiate,
          .oi-close {
            transition: none !important;
          }
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>

      <Link href="/fitur" className="btn-back-vault">
        <i className="fa-solid fa-chevron-left" aria-hidden="true"></i> Kembali ke Fitur
      </Link>

      <button type="button" className="btn-time-capsule" onClick={() => setCapsuleOpen(!capsuleOpen)} aria-expanded={capsuleOpen}>
        <i className="fa-solid fa-hourglass-half" aria-hidden="true"></i> Pesan Masa Depan
      </button>

      <div className={`time-capsule-panel ${capsuleOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ color: 'var(--gold-main, #d4af37)', fontWeight: 700, letterSpacing: '0.04em' }}>TULIS PESAN MASA DEPAN</div>
          <button type="button" onClick={() => setCapsuleOpen(false)} aria-label="Tutup panel" style={{ minWidth: 44, minHeight: 44, background: 'transparent', border: '1px solid rgba(212,175,55,0.35)', borderRadius: 8, color: 'var(--text-primary)', cursor: 'pointer' }}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <form className="capsule-form" onSubmit={handleSealMessage}>
          <textarea name="vision_text" rows={4} placeholder="Tuliskan visi atau pesan untuk diri Anda di masa depan..." required></textarea>
          <label htmlFor="oracle-unlock-date" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Tanggal Dibuka:</label>
          <input id="oracle-unlock-date" type="date" name="unlock_date" required min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} />
          <button type="submit" className="capsule-btn">SEGEL PESAN</button>
        </form>

        <div style={{ color: 'var(--gold-main, #d4af37)', marginTop: '36px', marginBottom: '16px', fontWeight: 700, letterSpacing: '0.04em' }}>ARSIP PESAN ANDA</div>
        {visions.length > 0 ? visions.map(v => (
          <div key={v.id} className="capsule-card">
            <div style={{ fontSize: '0.82rem', color: 'var(--gold-main, #d4af37)', marginBottom: '10px' }}>
              <i className={`fa-solid fa-lock${v.is_unlocked ? '-open' : ''}`} aria-hidden="true"></i> Terjadwal: {new Date(v.unlock_date).toLocaleDateString('id-ID')}
            </div>
            {v.is_unlocked ? (
              <div style={{ fontSize: '0.92rem', color: 'var(--text-primary, #f2efe9)', whiteSpace: 'pre-wrap' }}>{v.vision_text}</div>
            ) : (
              new Date(v.unlock_date) <= new Date() ? (
                <button type="button" onClick={() => handleUnlock(v.id, v.vision_text)} style={{ minHeight: 44, background: 'transparent', border: '1px solid var(--gold-main, #d4af37)', color: 'var(--gold-main, #d4af37)', padding: '8px 16px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, borderRadius: '8px' }}>Buka Segel</button>
              ) : (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Segel Waktu Aktif. Menunggu waktu buka.</div>
              )
            )}
          </div>
        )) : (
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Belum ada pesan yang tersegel.</div>
        )}
      </div>

      {unlockedVision && (
        <div className="unseal-modal" role="dialog" aria-modal="true" aria-labelledby="oracleUnsealTitle" onClick={() => setUnlockedVision(null)}>
          <div className="unseal-box" onClick={(e) => e.stopPropagation()}>
            <h2 id="oracleUnsealTitle" style={{ color: 'var(--gold-main, #d4af37)', fontFamily: 'Playfair Display, serif', marginBottom: '20px' }}><i className="fa-solid fa-envelope-open-text" aria-hidden="true"></i> Pesan Terbuka</h2>
            <div style={{ color: 'var(--text-primary, #f2efe9)', padding: '20px', background: 'var(--surface-raised, rgba(0,0,0,0.35))', border: '1px dashed rgba(212,175,55,0.35)', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
              {unlockedVision}
            </div>
            <div style={{ marginTop: '24px', textAlign: 'end' }}>
              <button type="button" onClick={() => setUnlockedVision(null)} style={{ minHeight: 44, background: 'transparent', color: 'var(--gold-main, #d4af37)', border: '1px solid var(--gold-main, #d4af37)', borderRadius: '8px', padding: '10px 25px', cursor: 'pointer', fontWeight: 600 }}>Tutup Dokumen</button>
            </div>
          </div>
        </div>
      )}

      <div className="oracle-wrapper">
        <div className={`vision-container ${isScanning ? 'scanning' : ''}`}>
          <video ref={videoRef} autoPlay playsInline style={{ opacity: showResult ? 0 : 1 }}></video>
          <canvas ref={canvasRef} style={{ display: showResult ? 'block' : 'none' }}></canvas>
          
          <Image src="/images/logo-utuh.webp" className="logo-reticle" width={180} height={180} priority style={{ opacity: showResult ? 0 : 0.15, width: "60%", height: "auto" }} alt="" aria-hidden="true" />
          
          {isScanning && (
            <div className="scanner-laser" style={{ display: 'block', animation: 'scan 1.2s linear infinite alternate' }}></div>
          )}
          
          {!showResult && <div style={{ position: 'absolute', top: '20px', insetInlineStart: '20px', color: 'rgba(212,175,55,0.85)', fontFamily: 'var(--font-amiri, serif)', fontSize: '1.2rem', direction: 'rtl' }}>وُجُوهٌ يَوْمَئِذٍ مُّسْفِرَةٌ</div>}
          
          <div className="hud-text">{statusText}</div>

          <div className={`result-overlay ${showResult ? 'show' : ''}`}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#f3d267', fontSize: '1.75rem', marginBottom: '10px' }}>{myTitle}</h2>
            <div style={{ color: '#f8fafc', marginBottom: '18px', fontSize: '0.92rem' }}>{myDesc}</div>
            {resultData && (
              <div style={{ fontSize: '0.86rem', color: '#cbd5e1', background: 'rgba(6, 11, 20, 0.72)', border: '1px solid rgba(212, 175, 55, 0.25)', padding: '14px 16px', borderRadius: '10px', textAlign: 'start', marginBottom: '15px', width: '100%' }}>
                  <div><strong style={{ color: '#d4af37' }}>Stabilitas Resonansi:</strong> {resultData.symmetryIndex}%</div>
                  <div><strong style={{ color: '#d4af37' }}>Ekspresi Dominan:</strong> {resultData.dominantEmotion}</div>
                  <div><strong style={{ color: '#d4af37' }}>Maqam Saat Ini:</strong> <b style={{ color: '#ffffff' }}>{resultData.maqam}</b></div>
              </div>
            )}
            
            {showResult && !aiInsight && (
              <button 
                type="button"
                onClick={handleAskGemini}
                disabled={isFetchingAi}
                style={{ width: "100%", minHeight: 44, background: "linear-gradient(45deg, #d4af37, #b8860b)", border: "none", color: "#060b14", padding: "10px 16px", borderRadius: "10px", cursor: "pointer", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}
              >
                {isFetchingAi ? <><i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i> MEMPROSES NASIHAT...</> : <><i className="fa-solid fa-bolt" aria-hidden="true"></i> BACA NASIHAT MASA DEPAN</>}
              </button>
            )}
          </div>
        </div>

        {/* AI Insight Modal */}
        {aiInsight && (
          <div className="oracle-insight-modal" role="dialog" aria-modal="true" aria-labelledby="oracleInsightTitle" onClick={() => setAiInsight(null)}>
            <div className="oracle-insight-paper" onClick={(e) => e.stopPropagation()}>
                <div className="oi-header">
                    <h2 id="oracleInsightTitle" className="oi-title"><i className="fa-solid fa-sparkles" style={{ fontSize: '1.15rem', verticalAlign: 'middle', marginInlineEnd: '10px' }} aria-hidden="true"></i> Pesan Masa Depan</h2>
                    <div className="oi-subtitle">{myTitle}</div>
                </div>
                
                {aiInsight.includes('---') ? (
                  <>
                    <div style={{ textAlign: "start", fontSize: "1rem" }}>
                      {aiInsight.split('---')[0].trim()}
                    </div>
                    <div className="oi-quote-box">
                      <i className="fa-solid fa-quote-left oi-quote-icon" aria-hidden="true"></i>
                      {aiInsight.split('---')[1].trim()}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: "start", fontSize: "1rem" }}>{aiInsight}</div>
                )}
                
                <button type="button" className="oi-close" onClick={() => setAiInsight(null)}>
                  Tutup Dokumen
                </button>
            </div>
          </div>
        )}

        <div className="controls-panel">
          {!showResult ? (
            <button type="button" className="btn-initiate" onClick={handleScan} disabled={!modelsLoaded || isScanning}>
              <i className="fa-solid fa-eye" aria-hidden="true"></i> Mulai Pemindaian
            </button>
          ) : (
            <button type="button" className="btn-initiate" onClick={handleReset}>
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

"use client";

import { useEffect, useRef, useState } from "react";

interface VideoNoteRecorderProps {
  onCancel: () => void;
  onSend: (videoBlob: Blob, duration: number) => void;
}

export default function VideoNoteRecorder({ onCancel, onSend }: VideoNoteRecorderProps) {
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initCamera(facingMode);

    return () => {
      stopTracks();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [facingMode]);

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const initCamera = async (mode: "user" | "environment") => {
    stopTracks();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 480 },
          height: { ideal: 480 },
          aspectRatio: 1,
        },
        audio: true,
      });
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error("Gagal mengakses kamera/mikrofon:", err);
      alert("Tidak dapat mengakses kamera. Pastikan izin kamera & mikrofon telah diberikan.");
      onCancel();
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    try {
      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm",
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 59) {
            handleStopAndSend();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Error starting video recording:", err);
    }
  };

  const handleStopAndSend = () => {
    if (!mediaRecorderRef.current || !isRecording) {
      onCancel();
      return;
    }

    const duration = recordingTime;
    mediaRecorderRef.current.onstop = () => {
      const mimeType = mediaRecorderRef.current?.mimeType || "video/webm";
      const videoBlob = new Blob(chunksRef.current, { type: mimeType });
      stopTracks();
      onSend(videoBlob, duration);
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleCancel = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    stopTracks();
    if (timerRef.current) clearInterval(timerRef.current);
    onCancel();
  };

  const switchCamera = () => {
    if (isRecording) return;
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const progress = (recordingTime / 60) * 100;
  const radius = 95;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="video-note-recorder-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: "rgba(3, 5, 4, 0.92)",
        backdropFilter: "blur(25px)",
        WebkitBackdropFilter: "blur(25px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeInModal 0.2s ease-out",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#d4af37", margin: 0, fontSize: "1.3rem" }}>
          Video Note
        </h3>
        <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", margin: "4px 0 0" }}>
          {isRecording ? `Merekam... ${recordingTime}s / 60s` : "Tekan tombol rekam untuk mulai"}
        </p>
      </div>

      {/* Circular Viewfinder */}
      <div
        style={{
          position: "relative",
          width: "210px",
          height: "210px",
          borderRadius: "50%",
          overflow: "hidden",
          border: isRecording ? "3px solid #ff4757" : "3px solid #d4af37",
          boxShadow: isRecording ? "0 0 35px rgba(255, 71, 87, 0.6)" : "0 0 30px rgba(212, 175, 55, 0.4)",
          transition: "0.3s",
        }}
      >
        <video
          ref={videoPreviewRef}
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: facingMode === "user" ? "scaleX(-1)" : "none",
          }}
        />

        {/* SVG Progress Ring */}
        {isRecording && (
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              transform: "rotate(-90deg)",
            }}
            viewBox="0 0 210 210"
          >
            <circle
              cx="105"
              cy="105"
              r={radius}
              fill="none"
              stroke="#ff4757"
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      {/* Action Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "25px", marginTop: "35px" }}>
        {/* Cancel Button */}
        <button
          type="button"
          onClick={handleCancel}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "rgba(255, 85, 85, 0.2)",
            border: "1px solid rgba(255, 85, 85, 0.4)",
            color: "#ff5555",
            fontSize: "1.2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "0.2s",
          }}
          title="Batal"
        >
          <i className="fa-solid fa-times"></i>
        </button>

        {/* Start / Stop Record Button */}
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ff4757 0%, #c0392b 100%)",
              border: "3px solid #ffffff",
              color: "#ffffff",
              fontSize: "1.6rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 0 25px rgba(255, 71, 87, 0.6)",
              transition: "0.2s",
            }}
            title="Mulai Rekam"
          >
            <i className="fa-solid fa-circle"></i>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStopAndSend}
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #d4af37 0%, #aa771c 100%)",
              border: "3px solid #ffffff",
              color: "#030504",
              fontSize: "1.6rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 0 25px rgba(212, 175, 55, 0.6)",
              transition: "0.2s",
            }}
            title="Kirim Video Note"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        )}

        {/* Switch Camera Button */}
        <button
          type="button"
          onClick={switchCamera}
          disabled={isRecording}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: isRecording ? "rgba(255,255,255,0.3)" : "#ffffff",
            fontSize: "1.1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: isRecording ? "not-allowed" : "pointer",
            transition: "0.2s",
          }}
          title="Balik Kamera"
        >
          <i className="fa-solid fa-camera-rotate"></i>
        </button>
      </div>

      <style jsx global>{`
        @keyframes fadeInModal {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

interface VideoNotePlayerProps {
  videoUrl: string;
  isMine?: boolean;
}

export default function VideoNotePlayer({ videoUrl }: VideoNotePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.muted = isMuted;
      video.play().catch((err) => console.error("Video play error:", err));
      setIsPlaying(true);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  // SVG circle circumference for radius = 46 (size = 100)
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="video-note-wrapper"
      style={{
        position: "relative",
        display: "inline-block",
        padding: "4px",
        margin: "4px 0",
      }}
    >
      {/* 1. Circular Video Card Container (with overflow: hidden) */}
      <div
        className="video-note-circle"
        style={{
          position: "relative",
          width: "190px",
          height: "190px",
          borderRadius: "50%",
          overflow: "hidden",
          cursor: "pointer",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
          border: "2.5px solid var(--gold-main, #d4af37)",
          background: "#000000",
        }}
        onClick={togglePlay}
        title={isPlaying ? "Klik untuk jeda" : "Klik untuk putar"}
      >
        {/* Video element */}
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          muted={isMuted}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "50%",
          }}
        />

        {/* SVG Circular Progress Ring */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            transform: "rotate(-90deg)",
          }}
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgba(212, 175, 55, 0.25)"
            strokeWidth="3"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--gold-main, #d4af37)"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.1s linear" }}
          />
        </svg>

        {/* Play/Pause Overlay Indicator */}
        {!isPlaying && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0, 0, 0, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "2.2rem",
              backdropFilter: "blur(2px)",
            }}
          >
            <i className="fa-solid fa-play" style={{ marginLeft: "6px", filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.8))" }}></i>
          </div>
        )}
      </div>

      {/* 2. Sound Toggle Button: Placed OUTSIDE the clipped circle so it is NEVER truncated */}
      <button
        type="button"
        onClick={toggleMute}
        style={{
          position: "absolute",
          bottom: "2px",
          right: "2px",
          background: isMuted ? "rgba(255, 71, 87, 0.9)" : "var(--gold-main, #d4af37)",
          border: "2px solid #ffffff",
          color: isMuted ? "#ffffff" : "#030504",
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.95rem",
          cursor: "pointer",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.4)",
          zIndex: 10,
          transition: "0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        title={isMuted ? "Suara mati (Klik untuk bunyikan)" : "Suara aktif (Klik untuk bisukan)"}
      >
        <i className={`fa-solid ${isMuted ? "fa-volume-xmark" : "fa-volume-high"}`}></i>
      </button>
    </div>
  );
}

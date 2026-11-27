"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useConfirm } from "@/components/layout/AegisConfirm";

interface VideoNoteRecorderProps {
  onCancel: () => void;
  onSend: (videoBlob: Blob, duration: number) => void;
}

export default function VideoNoteRecorder({ onCancel, onSend }: VideoNoteRecorderProps) {
  const { showAlert } = useConfirm();
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const onCancelRef = useRef(onCancel);
  const mountedRef = useRef(true);
  const cameraEpochRef = useRef(0);
  const isRecordingRef = useRef(false);
  const recordingTimeRef = useRef(0);
  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const initCamera = useCallback(async (mode: "user" | "environment") => {
    stopTracks();
    const epoch = ++cameraEpochRef.current;
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
      if (!mountedRef.current || epoch !== cameraEpochRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }
    } catch (err) {
      if (!mountedRef.current || epoch !== cameraEpochRef.current) return;
      console.error("Gagal mengakses kamera/mikrofon:", err);
      await showAlert("Akses Kamera Ditolak", "Tidak dapat mengakses kamera. Pastikan izin kamera & mikrofon telah diberikan.");
      onCancelRef.current();
    }
  }, [stopTracks, showAlert]);

  useEffect(() => {
    mountedRef.current = true;
    initCamera(facingMode);
    const activeTimerRef = timerRef;

    return () => {
      mountedRef.current = false;
      cameraEpochRef.current += 1;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.onstop = null;
          mediaRecorderRef.current.stop();
        } catch {}
      }
      stopTracks();
      if (activeTimerRef.current) clearInterval(activeTimerRef.current);
    };
  }, [facingMode, initCamera, stopTracks]);

  const handleStopAndSend = useCallback(() => {
    if (!mediaRecorderRef.current || !isRecordingRef.current) {
      onCancelRef.current();
      return;
    }

    isRecordingRef.current = false;
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const duration = recordingTimeRef.current;
    const recorder = mediaRecorderRef.current;
    recorder.onstop = () => {
      const mimeType = recorder.mimeType || "video/mp4";
      const videoBlob = new Blob(chunksRef.current, { type: mimeType });
      stopTracks();
      if (mountedRef.current) {
        onSend(videoBlob, duration);
      }
    };

    if (recorder.state !== "inactive") {
      recorder.stop();
    }
  }, [onSend, stopTracks]);

  const startRecording = () => {
    if (!streamRef.current) return;
    try {
      chunksRef.current = [];

      // Deteksi format video yang didukung browser (iOS Safari WebKit vs Chrome/Firefox/Android)
      const candidateTypes = [
        "video/mp4;codecs=avc1",
        "video/mp4",
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
      ];
      let selectedMime = "";
      if (typeof MediaRecorder !== "undefined" && typeof MediaRecorder.isTypeSupported === "function") {
        for (const type of candidateTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            selectedMime = type;
            break;
          }
        }
      }

      const recorderOptions: MediaRecorderOptions = selectedMime ? { mimeType: selectedMime } : {};
      const mediaRecorder = new MediaRecorder(streamRef.current, recorderOptions);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100);
      isRecordingRef.current = true;
      recordingTimeRef.current = 0;
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        const next = recordingTimeRef.current + 1;
        recordingTimeRef.current = next;
        setRecordingTime(next);
        if (next >= 60) {
          handleStopAndSend();
        }
      }, 1000);
    } catch (err) {
      console.error("Error starting video recording:", err);
    }
  };

  const handleCancel = () => {
    isRecordingRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    stopTracks();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
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
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: "rgba(3, 5, 4, 0.96)",
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
              color: "#060b14",
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

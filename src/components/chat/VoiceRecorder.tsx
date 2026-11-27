"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useConfirm } from "@/components/layout/AegisConfirm";

interface VoiceRecorderProps {
  onCancel: () => void;
  onSend: (audioBlob: Blob, duration: number) => void;
}

export default function VoiceRecorder({ onCancel, onSend }: VoiceRecorderProps) {
  const { showAlert } = useConfirm();
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const onCancelRef = useRef(onCancel);
  const mountedRef = useRef(true);
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

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;

      const options: MediaRecorderOptions = {};
      if (typeof MediaRecorder.isTypeSupported === "function") {
        if (MediaRecorder.isTypeSupported("audio/mp4")) {
          options.mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          options.mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
          options.mimeType = "audio/ogg;codecs=opus";
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      // START WITHOUT TIMESLICE — produces a single valid audio file blob
      // Previously start(100) caused fragmented chunks that couldn't be played back
      mediaRecorder.start();
      setIsRecording(true);
      recordingTimeRef.current = 0;

      timerRef.current = setInterval(() => {
        const next = recordingTimeRef.current + 1;
        recordingTimeRef.current = next;
        setRecordingTime(next);
      }, 1000);
    } catch (err) {
      if (!mountedRef.current) return;
      console.error("Gagal mengakses mikrofon:", err);
      await showAlert("Akses Mikrofon Ditolak", "Tidak dapat mengakses mikrofon. Pastikan izin mikrofon telah diberikan.");
      onCancelRef.current();
    }
  }, [showAlert]);

  useEffect(() => {
    mountedRef.current = true;
    startRecording();
    const activeTimerRef = timerRef;

    return () => {
      mountedRef.current = false;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.onstop = null;
          mediaRecorderRef.current.stop();
        } catch {}
      }
      stopTracks();
      if (activeTimerRef.current) clearInterval(activeTimerRef.current);
    };
  }, [startRecording, stopTracks]);

  const handleCancel = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    stopTracks();
    if (timerRef.current) clearInterval(timerRef.current);
    onCancel();
  };

  const handleSend = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      onCancel();
      return;
    }

    const currentDuration = recordingTimeRef.current;

    recorder.onstop = () => {
      const mimeType = recorder.mimeType || "audio/mp4";
      const audioBlob = new Blob(chunksRef.current, { type: mimeType });
      stopTracks();
      if (mountedRef.current) {
        onSend(audioBlob, currentDuration);
      }
    };

    recorder.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      className="voice-recording-bar"
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(212, 175, 55, 0.12)",
        border: "1px solid rgba(212, 175, 55, 0.35)",
        borderRadius: "25px",
        padding: "6px 14px",
        gap: "12px",
        animation: "pulseRecorder 2s infinite ease-in-out",
      }}
    >
      {/* Cancel button */}
      <button
        type="button"
        onClick={handleCancel}
        style={{
          background: "rgba(255, 85, 85, 0.2)",
          border: "1px solid rgba(255, 85, 85, 0.3)",
          color: "#ff5555",
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: "0.9rem",
          transition: "0.2s",
        }}
        title="Batalkan Rekaman"
      >
        <i className="fa-solid fa-trash"></i>
      </button>

      {/* Pulsing Recording Indicator & Timer */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, justifyContent: "center" }}>
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: "#ff4757",
            boxShadow: "0 0 10px #ff4757",
            animation: "blinkRed 1s infinite alternate",
          }}
        />
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "1rem",
            fontWeight: "bold",
            color: "var(--text-primary, #ffffff)",
          }}
        >
          {formatTime(recordingTime)}
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary, rgba(255, 255, 255, 0.6))" }}>
          Merekam suara...
        </span>
      </div>

      {/* Send Voice Note button */}
      <button
        type="button"
        onClick={handleSend}
        style={{
          background: "linear-gradient(135deg, #d4af37 0%, #aa771c 100%)",
          border: "none",
          color: "#060b14",
          width: "38px",
          height: "38px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: "1rem",
          boxShadow: "0 4px 15px rgba(212, 175, 55, 0.4)",
          transition: "0.2s",
        }}
        title="Kirim Voice Note"
      >
        <i className="fa-solid fa-paper-plane"></i>
      </button>

      <style jsx>{`
        @keyframes blinkRed {
          from { opacity: 0.3; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

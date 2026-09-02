"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface VoiceNotePlayerProps {
  audioUrl: string;
  isMine?: boolean;
  initialDuration?: number;
}

export default function VoiceNotePlayer({ audioUrl, isMine = false, initialDuration }: VoiceNotePlayerProps) {
  // --- State ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Extract duration from ?d= param or prop
  const extractDuration = useCallback(() => {
    if (initialDuration && initialDuration > 0) return initialDuration;
    if (!audioUrl) return 0;
    try {
      const match = audioUrl.match(/[?&]d=(\d+)/);
      if (match?.[1]) return Number(match[1]);
    } catch { /* ignore */ }
    return 0;
  }, [audioUrl, initialDuration]);

  const [duration, setDuration] = useState<number>(extractDuration());

  // Refs
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef(false);

  // Clean URL (remove ?d= param)
  const cleanUrl = useCallback(() => {
    if (!audioUrl) return "";
    try {
      const u = new URL(audioUrl, window.location.origin);
      u.searchParams.delete("d");
      u.searchParams.delete("duration");
      return u.toString();
    } catch {
      return audioUrl.replace(/[?&]d=\d+/, "");
    }
  }, [audioUrl]);

  // Sync initial duration
  useEffect(() => {
    const d = extractDuration();
    if (d > 0) setDuration(d);
  }, [extractDuration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current = null;
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  // --- Helpers ---
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // ========================================
  // Core Strategy:
  // 1. Fetch audio as raw bytes
  // 2. Create a Blob with the correct MIME type
  // 3. Create a blob: URL from that Blob
  // 4. Play via native <audio> element using blob: URL
  //
  // This avoids CORS issues, content-type mismatches,
  // and ensures the browser gets clean data to decode.
  // ========================================
  const ensureAudioElement = async (): Promise<HTMLAudioElement> => {
    // If already prepared, return existing
    if (audioElRef.current && blobUrlRef.current) {
      return audioElRef.current;
    }

    const url = cleanUrl();
    console.log("[VoiceNotePlayer] Fetching:", url);

    const resp = await fetch(url);
    console.log("[VoiceNotePlayer] Response status:", resp.status, resp.statusText);

    if (!resp.ok) {
      throw new Error(`Server returned ${resp.status} ${resp.statusText}`);
    }

    const serverContentType = resp.headers.get("content-type") || "";
    const contentLength = resp.headers.get("content-length") || "unknown";
    console.log("[VoiceNotePlayer] Content-Type:", serverContentType, "Content-Length:", contentLength);

    const arrayBuffer = await resp.arrayBuffer();
    console.log("[VoiceNotePlayer] Downloaded bytes:", arrayBuffer.byteLength);

    if (arrayBuffer.byteLength === 0) {
      throw new Error("File audio kosong (0 bytes)");
    }

    // Determine MIME type from URL extension or server header
    let mimeType = serverContentType.split(";")[0].trim(); // strip params like charset
    if (!mimeType || mimeType === "application/octet-stream") {
      // Guess from file extension
      if (url.includes(".mp4")) mimeType = "audio/mp4";
      else if (url.includes(".ogg")) mimeType = "audio/ogg";
      else if (url.includes(".wav")) mimeType = "audio/wav";
      else mimeType = "audio/webm"; // default for our recordings
    }
    console.log("[VoiceNotePlayer] Using MIME type:", mimeType);

    // Create blob + blob URL
    const blob = new Blob([arrayBuffer], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);

    // Revoke old if exists
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    blobUrlRef.current = blobUrl;

    // Create Audio element
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = blobUrl;
    audioElRef.current = audio;

    // Wait for the audio to be ready
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timeout: audio gagal dimuat dalam 15 detik"));
      }, 15000);

      audio.oncanplaythrough = () => {
        clearTimeout(timeout);
        resolve();
      };
      audio.onerror = () => {
        clearTimeout(timeout);
        const mediaError = audio.error;
        const code = mediaError?.code;
        const msg = mediaError?.message || "Unknown";
        console.error("[VoiceNotePlayer] Audio element error code:", code, "message:", msg);
        
        let userMsg = "Gagal memuat audio";
        if (code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
          userMsg = `Format ${mimeType} tidak didukung browser`;
        } else if (code === MediaError.MEDIA_ERR_DECODE) {
          userMsg = "File audio rusak / tidak bisa di-decode";
        } else if (code === MediaError.MEDIA_ERR_NETWORK) {
          userMsg = "Gagal mengunduh audio";
        }
        reject(new Error(userMsg));
      };

      // Trigger loading
      audio.load();
    });

    // Update duration from actual audio metadata
    if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
      setDuration(Math.round(audio.duration));
      console.log("[VoiceNotePlayer] Actual duration:", audio.duration);
    }

    return audio;
  };

  // --- Start / Resume ---
  const startPlayback = async (fromSeconds: number) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      const audio = await ensureAudioElement();
      audio.playbackRate = playbackRate;
      audio.currentTime = fromSeconds;

      await audio.play();
      
      setIsPlaying(true);
      isPlayingRef.current = true;
      setIsLoading(false);

      // Progress timer
      stopTimer();
      timerRef.current = setInterval(() => {
        if (!isPlayingRef.current || !audioElRef.current) return;
        setCurrentTime(audioElRef.current.currentTime);
      }, 80);

      // Handle end
      audio.onended = () => {
        setIsPlaying(false);
        isPlayingRef.current = false;
        setCurrentTime(0);
        stopTimer();
      };

    } catch (err: any) {
      console.error("[VoiceNotePlayer] Playback failed:", err);
      setErrorMsg(err?.message || "Gagal memutar audio");
      setIsLoading(false);
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
  };

  // --- Pause ---
  const pausePlayback = () => {
    if (audioElRef.current) {
      audioElRef.current.pause();
    }
    stopTimer();
    setIsPlaying(false);
    isPlayingRef.current = false;
  };

  // --- Toggle ---
  const togglePlay = () => {
    if (isPlaying) {
      pausePlayback();
    } else {
      const resumeFrom = audioElRef.current ? audioElRef.current.currentTime : 0;
      startPlayback(resumeFrom);
    }
  };

  // --- Seek ---
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    setCurrentTime(t);
    if (audioElRef.current) {
      audioElRef.current.currentTime = t;
    }
  };

  // --- Playback Rate ---
  const cyclePlaybackRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rates = [1, 1.5, 2];
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(next);
    if (audioElRef.current) {
      audioElRef.current.playbackRate = next;
    }
  };

  // --- Format ---
  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || !isFinite(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // ====== RENDER ======
  return (
    <div
      className="voice-note-player"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        minWidth: "220px",
        maxWidth: "290px",
        padding: "4px 0",
      }}
    >
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        disabled={isLoading}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: isMine
            ? "linear-gradient(135deg, #d4af37 0%, #aa771c 100%)"
            : "rgba(212, 175, 55, 0.2)",
          border: "1px solid rgba(212, 175, 55, 0.4)",
          color: isMine ? "#030504" : "var(--gold-main, #d4af37)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: "1rem",
          flexShrink: 0,
          transition: "0.2s",
          boxShadow: isMine ? "0 4px 12px rgba(212, 175, 55, 0.3)" : "none",
          opacity: isLoading ? 0.7 : 1,
        }}
        title={isPlaying ? "Jeda" : "Putar Pesan Suara"}
      >
        {isLoading ? (
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "0.9rem" }}></i>
        ) : (
          <i
            className={`fa-solid ${isPlaying ? "fa-pause" : "fa-play"}`}
            style={{ marginLeft: isPlaying ? 0 : "2px" }}
          ></i>
        )}
      </button>

      {/* Progress & Waveform */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ position: "relative", height: "18px", display: "flex", alignItems: "center" }}>
          {/* Simulated Waveform Bars */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              gap: "2px",
              pointerEvents: "none",
            }}
          >
            {[10, 16, 8, 22, 14, 26, 18, 12, 24, 16, 8, 20, 14, 26, 12, 18, 22, 10, 14, 20].map((h, i) => {
              const barProgress = (i / 20) * 100;
              const isPassed = barProgress <= progress;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${h}px`,
                    borderRadius: "2px",
                    background: isPassed ? "var(--gold-main, #d4af37)" : "rgba(255, 255, 255, 0.25)",
                    transition: "background 0.1s",
                  }}
                />
              );
            })}
          </div>

          {/* Range Seeker Slider */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            style={{
              width: "100%",
              height: "100%",
              opacity: 0,
              cursor: "pointer",
              position: "relative",
              zIndex: 2,
            }}
          />
        </div>

        {/* Time Info & Speed Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.72rem",
            color: "var(--text-secondary, rgba(255, 255, 255, 0.6))",
            fontFamily: "monospace",
          }}
        >
          <span>
            {errorMsg ? (
              <span style={{ color: "#ff5555", fontSize: "0.65rem" }}>⚠ {errorMsg}</span>
            ) : isPlaying || currentTime > 0 ? (
              formatTime(currentTime)
            ) : (
              formatTime(duration)
            )}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              type="button"
              onClick={cyclePlaybackRate}
              style={{
                background: "rgba(212, 175, 55, 0.15)",
                border: "1px solid rgba(212, 175, 55, 0.35)",
                color: "var(--gold-main, #d4af37)",
                borderRadius: "10px",
                padding: "1px 6px",
                fontSize: "0.68rem",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "0.2s",
              }}
              title="Kecepatan pemutaran"
            >
              {playbackRate}x
            </button>
            <i
              className="fa-solid fa-microphone"
              style={{ color: "var(--gold-main, #d4af37)", fontSize: "0.75rem" }}
            ></i>
          </div>
        </div>
      </div>
    </div>
  );
}

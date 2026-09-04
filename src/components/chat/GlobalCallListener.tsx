"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getAvatarUrl } from "@/lib/avatar";

/**
 * GlobalCallListener — mounted in dashboard layout.
 * Listens on a user-specific Supabase Realtime channel for incoming call notifications.
 * Shows a fullscreen ringing overlay when a call comes in, even if the user
 * is on a completely different page (e.g., Profil, Beranda, etc.)
 */
export default function GlobalCallListener() {
  const [incomingCall, setIncomingCall] = useState<{
    callerId: string;
    callerName: string;
    callerAvatar: string;
    callType: "voice" | "video";
  } | null>(null);

  const supabase = createClient();
  const router = useRouter();
  const channelRef = useRef<any>(null);
  const userIdRef = useRef<string | null>(null);
  const ringtoneRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Ringtone
  const startRingtone = useCallback(() => {
    try {
      if (audioCtxRef.current) return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.setValueAtTime(480, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc2.start();

      ringtoneRef.current = { osc1, osc2, ctx };
    } catch { /* ignore */ }
  }, []);

  const stopRingtone = useCallback(() => {
    try {
      if (ringtoneRef.current) {
        ringtoneRef.current.osc1.stop();
        ringtoneRef.current.osc2.stop();
        ringtoneRef.current.ctx.close();
        ringtoneRef.current = null;
      }
      audioCtxRef.current = null;
    } catch { /* ignore */ }
  }, []);

  // Subscribe to user-specific call notification channel
  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      userIdRef.current = user.id;

      const channel = supabase
        .channel(`user_call_notify_${user.id}`)
        .on("broadcast", { event: "incoming_call" }, async (payload) => {
          const data = payload?.payload;
          if (!data || !mounted) return;

          console.log("[GlobalCallListener] Incoming call:", data);

          // Check if we're already on the caller's chat page
          if (typeof window !== "undefined") {
            const path = window.location.pathname;
            if (path.includes(`/chat/personal/${data.callerId}`)) {
              // Already on the right chat page — ChatCallModal handles it
              return;
            }
          }

          // Fetch caller profile info
          let callerName = data.callerName || "Seseorang";
          let callerAvatar = "";
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("nama_panggilan, foto_profil")
              .eq("id", data.callerId)
              .single();
            if (profile) {
              callerName = profile.nama_panggilan || callerName;
              callerAvatar = getAvatarUrl(profile.foto_profil, callerName);
            }
          } catch { /* use defaults */ }

          if (!callerAvatar) {
            callerAvatar = getAvatarUrl(null, callerName);
          }

          setIncomingCall({
            callerId: data.callerId,
            callerName,
            callerAvatar,
            callType: data.callType || "voice",
          });
          startRingtone();
        })
        .on("broadcast", { event: "cancel_call" }, (payload) => {
          const data = payload?.payload;
          if (!data) return;
          // Caller cancelled or hangup
          stopRingtone();
          setIncomingCall(null);
        })
        .subscribe();

      channelRef.current = channel;
    };

    setup();

    return () => {
      mounted = false;
      stopRingtone();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss after 45 seconds
  useEffect(() => {
    if (!incomingCall) return;
    const timer = setTimeout(() => {
      stopRingtone();
      setIncomingCall(null);
    }, 45000);
    return () => clearTimeout(timer);
  }, [incomingCall, stopRingtone]);

  const handleAccept = () => {
    if (!incomingCall) return;
    stopRingtone();
    const { callerId, callType } = incomingCall;
    setIncomingCall(null);
    router.push(`/chat/personal/${callerId}?callAction=accept&type=${callType}`);
  };

  const handleReject = () => {
    if (!incomingCall) return;
    stopRingtone();

    // Notify caller that we rejected
    if (channelRef.current) {
      // Broadcast hangup on the shared chat channel
      const chatChannelName = [userIdRef.current, incomingCall.callerId].sort().join("_");
      const chatChannel = supabase.channel(`personal_chat_${chatChannelName}`);
      chatChannel.send({
        type: "broadcast",
        event: "call_signal",
        payload: { type: "hangup", senderId: userIdRef.current },
      });
      // Also notify on the caller's notification channel
      const callerNotifyChannel = supabase.channel(`user_call_notify_${incomingCall.callerId}`);
      callerNotifyChannel.send({
        type: "broadcast",
        event: "cancel_call",
        payload: { rejected: true },
      });
    }

    setIncomingCall(null);
  };

  if (!incomingCall) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999998,
        background: "linear-gradient(180deg, #08100d 0%, #0d1b15 50%, #08100d 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "20px",
        animation: "fadeInCall 0.3s ease-out",
        color: "#ffffff",
      }}
    >
      {/* Encryption badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "0.72rem",
          color: "var(--gold-main, #d4af37)",
          background: "rgba(212, 175, 55, 0.15)",
          border: "1px solid rgba(212, 175, 55, 0.3)",
          padding: "3px 12px",
          borderRadius: "15px",
          marginBottom: "10px",
        }}
      >
        <i className="fa-solid fa-lock" style={{ fontSize: "0.65rem" }}></i>
        <span>Terenkripsi Ujung-ke-Ujung</span>
      </div>

      {/* Call type indicator */}
      <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", marginBottom: "5px" }}>
        <i className={`fa-solid ${incomingCall.callType === "video" ? "fa-video" : "fa-phone"}`} style={{ marginRight: "6px" }}></i>
        Panggilan {incomingCall.callType === "video" ? "Video" : "Suara"} Masuk
      </div>

      {/* Avatar with pulse rings */}
      <div style={{ position: "relative", marginBottom: "10px" }}>
        <div
          style={{
            position: "absolute",
            inset: "-20px",
            borderRadius: "50%",
            border: "2px solid rgba(212, 175, 55, 0.5)",
            animation: "pulseCallRing 2s infinite cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "-40px",
            borderRadius: "50%",
            border: "1px solid rgba(212, 175, 55, 0.25)",
            animation: "pulseCallRing 2s infinite 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
        <Image
          src={incomingCall.callerAvatar}
          alt={incomingCall.callerName}
          width={130}
          height={130}
          priority
          style={{
            width: "130px",
            height: "130px",
            borderRadius: "50%",
            border: "3.5px solid var(--gold-main, #d4af37)",
            objectFit: "cover",
            boxShadow: "0 15px 50px rgba(0, 0, 0, 0.8)",
          }}
          unoptimized={incomingCall.callerAvatar.startsWith("data:") || incomingCall.callerAvatar.includes("ui-avatars.com")}
        />
      </div>

      {/* Caller name */}
      <h2 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "1.75rem",
        margin: "10px 0 5px",
        color: "#ffffff",
        textAlign: "center",
      }}>
        {incomingCall.callerName}
      </h2>

      <div style={{
        fontSize: "0.92rem",
        color: "var(--gold-main, #d4af37)",
        fontWeight: 500,
        animation: "pulse 1.5s infinite",
      }}>
        Panggilan Masuk...
      </div>

      {/* Accept / Reject buttons */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "60px",
        marginTop: "40px",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={handleReject}
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ff4757, #c0392b)",
              border: "none",
              color: "#ffffff",
              fontSize: "1.6rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 8px 25px rgba(255, 71, 87, 0.5)",
              transition: "transform 0.2s",
            }}
            title="Tolak"
          >
            <i className="fa-solid fa-phone-slash"></i>
          </button>
          <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.7)" }}>Tolak</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={handleAccept}
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #2ed573, #26af5f)",
              border: "none",
              color: "#ffffff",
              fontSize: "1.6rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 8px 25px rgba(46, 213, 115, 0.5)",
              transition: "transform 0.2s",
            }}
            title="Terima"
          >
            <i className="fa-solid fa-phone"></i>
          </button>
          <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.7)" }}>Terima</span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeInCall {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulseCallRing {
          0% { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

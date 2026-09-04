"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getAvatarUrl } from "@/lib/avatar";

interface GlobalCallReceiverProps {
  userId: string;
}

export default function GlobalCallReceiver({ userId }: GlobalCallReceiverProps) {
  const [incomingCall, setIncomingCall] = useState<{
    callerId: string;
    callerName: string;
    callerAvatar?: string;
    callType: "voice" | "video";
  } | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringOscillatorRef = useRef<any>(null);
  const router = useRouter();
  const supabase = createClient();

  const startRingtone = useCallback(() => {
    try {
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
      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      ringOscillatorRef.current = { osc1, osc2, gain, ctx };
    } catch {
      // ignore
    }
  }, []);

  const stopRingtone = useCallback(() => {
    try {
      if (ringOscillatorRef.current) {
        ringOscillatorRef.current.osc1.stop();
        ringOscillatorRef.current.osc2.stop();
        ringOscillatorRef.current.ctx.close();
        ringOscillatorRef.current = null;
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Listen on user-specific incoming call notification channel
    const channel = supabase
      .channel(`user_call_notification_${userId}`)
      .on("broadcast", { event: "incoming_call_notify" }, async (payload) => {
        const data = payload?.payload;
        if (!data || data.receiverId !== userId) return;

        // Fetch caller profile info
        const { data: profile } = await supabase
          .from("profiles")
          .select("nama_panggilan, nama_lengkap, foto_profil")
          .eq("id", data.callerId)
          .single();

        setIncomingCall({
          callerId: data.callerId,
          callerName: profile?.nama_panggilan || profile?.nama_lengkap || "Seseorang",
          callerAvatar: getAvatarUrl(profile?.foto_profil, profile?.nama_panggilan || profile?.nama_lengkap || "Seseorang"),
          callType: data.callType || "voice",
        });

        startRingtone();
      })
      .on("broadcast", { event: "cancel_call_notify" }, () => {
        stopRingtone();
        setIncomingCall(null);
      })
      .subscribe();

    return () => {
      stopRingtone();
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, startRingtone, stopRingtone]);

  const handleReject = () => {
    if (incomingCall) {
      const channel = supabase.channel(`user_call_notification_${incomingCall.callerId}`);
      channel.send({
        type: "broadcast",
        event: "cancel_call_notify",
        payload: { callerId: userId },
      });
    }
    stopRingtone();
    setIncomingCall(null);
  };

  const handleAccept = () => {
    if (!incomingCall) return;
    stopRingtone();
    const caller = incomingCall;
    setIncomingCall(null);
    router.push(`/chat/personal/${caller.callerId}?callAction=accept&type=${caller.callType}`);
  };

  if (!incomingCall) return null;

  const avatarSrc = incomingCall.callerAvatar
    ? `/uploads/profiles/${incomingCall.callerAvatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(incomingCall.callerName)}&background=d4af37&color=000`;

  return (
    <div
      className="global-call-notification-banner"
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99999999,
        background: "rgba(10, 17, 14, 0.96)",
        backdropFilter: "blur(25px)",
        WebkitBackdropFilter: "blur(25px)",
        border: "1.5px solid var(--gold-main, #d4af37)",
        borderRadius: "24px",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        boxShadow: "0 15px 45px rgba(0, 0, 0, 0.7), 0 0 30px rgba(212, 175, 55, 0.3)",
        animation: "slideDownNotif 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        maxWidth: "90vw",
        width: "360px",
      }}
    >
      <Image
        src={avatarSrc}
        alt={incomingCall.callerName}
        width={50}
        height={50}
        style={{
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          border: "2px solid var(--gold-main, #d4af37)",
          objectFit: "cover",
          flexShrink: 0,
        }}
        unoptimized={avatarSrc.startsWith("data:") || avatarSrc.includes("ui-avatars.com")}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{ margin: 0, fontSize: "1rem", color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {incomingCall.callerName}
        </h4>
        <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "var(--gold-main, #d4af37)", display: "flex", alignItems: "center", gap: "5px" }}>
          <i className={`fa-solid ${incomingCall.callType === "video" ? "fa-video" : "fa-phone"}`}></i>
          {incomingCall.callType === "video" ? "Panggilan Video Masuk..." : "Panggilan Suara Masuk..."}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Reject Button */}
        <button
          type="button"
          onClick={handleReject}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #ff4757, #c0392b)",
            border: "none",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "1rem",
            boxShadow: "0 4px 15px rgba(255, 71, 87, 0.4)",
          }}
          title="Tolak"
        >
          <i className="fa-solid fa-phone-slash"></i>
        </button>

        {/* Accept Button */}
        <button
          type="button"
          onClick={handleAccept}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #2ed573, #26af5f)",
            border: "none",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "1rem",
            boxShadow: "0 4px 15px rgba(46, 213, 115, 0.4)",
          }}
          title="Terima"
        >
          <i className="fa-solid fa-phone"></i>
        </button>
      </div>

      <style jsx global>{`
        @keyframes slideDownNotif {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}

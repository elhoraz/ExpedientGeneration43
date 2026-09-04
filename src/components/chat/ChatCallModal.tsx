"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getAvatarUrl } from "@/lib/avatar";

interface ChatCallModalProps {
  isOpen: boolean;
  callType: "voice" | "video";
  userId: string;
  contact: {
    id: string;
    nama_lengkap: string;
    nama_panggilan: string;
    foto_profil: string | null;
  };
  isIncoming?: boolean;
  autoAccept?: boolean;
  pendingOffer?: RTCSessionDescriptionInit | null; // Offer SDP from caller
  channel: any; // Supabase Realtime Channel
  onEndCall: (callDuration?: number) => void;
  onAcceptCall?: () => void;
}

// TURN + STUN for NAT traversal reliability
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // Free TURN relay servers for testing (OpenRelay project)
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
};

export default function ChatCallModal({
  isOpen,
  callType,
  userId,
  contact,
  isIncoming = false,
  autoAccept = false,
  pendingOffer = null,
  channel,
  onEndCall,
  onAcceptCall,
}: ChatCallModalProps) {
  const supabase = createClient();
  // ─── State ───
  const [callStatus, setCallStatus] = useState<"calling" | "ringing" | "connected" | "ended">(
    isIncoming && !autoAccept ? "ringing" : "calling"
  );
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === "voice");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [isSwappedViews, setIsSwappedViews] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // ─── Refs ───
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const callDurationRef = useRef(0); // Mirror for stale closure fix
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(pendingOffer);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const hasInitiatedRef = useRef(false);
  const isAliveRef = useRef(true); // Track if component is still mounted

  // Ringtone refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringOscillatorRef = useRef<any>(null);

  // Keep pendingOfferRef in sync
  useEffect(() => {
    if (pendingOffer) {
      pendingOfferRef.current = pendingOffer;
    }
  }, [pendingOffer]);

  const contactAvatar = getAvatarUrl(contact.foto_profil, contact.nama_panggilan || contact.nama_lengkap);

  // ─── Ringtone ───
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
      audioCtxRef.current = null;
    } catch {
      // ignore
    }
  }, []);

  // ─── Call Timer ───
  const startCallTimer = useCallback(() => {
    if (timerRef.current) return;
    callDurationRef.current = 0;
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      callDurationRef.current += 1;
      setCallDuration(callDurationRef.current);
    }, 1000);
  }, []);

  // ─── Cleanup ───
  const cleanUpAll = useCallback(() => {
    console.log("[Call] cleanUpAll");
    stopRingtone();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop all local media tracks (camera + mic)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => {
        t.stop();
        console.log("[Call] Stopped track:", t.kind, t.label);
      });
      localStreamRef.current = null;
    }

    // Null out video/audio element srcObjects so browser releases hardware
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    hasInitiatedRef.current = false;
    pendingCandidatesRef.current = [];
  }, [stopRingtone]);

  // ─── End Call ───
  const handleEnd = useCallback(() => {
    cleanUpAll();
    setCallStatus("ended");

    if (channel) {
      channel.send({
        type: "broadcast",
        event: "call_signal",
        payload: { type: "hangup", senderId: userId },
      });
    }

    // Cancel global notification on callee's side
    try {
      const notifyChannel = supabase.channel(`user_call_notify_${contact.id}`);
      notifyChannel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await notifyChannel.send({
            type: "broadcast",
            event: "cancel_call",
            payload: { callerId: userId },
          });
          // Cleanup after sending
          setTimeout(() => supabase.removeChannel(notifyChannel), 1000);
        }
      });
    } catch { /* ignore */ }

    // Use ref for accurate duration (avoids stale closure)
    onEndCall(callDurationRef.current);
  }, [cleanUpAll, channel, userId, contact.id, supabase, onEndCall]);

  // ─── Get Local Media ───
  const getLocalMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === "video"
          ? { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
          : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Guard: if cleanup happened while getUserMedia was pending, stop immediately
      if (!isAliveRef.current) {
        console.log("[Call] Component unmounted during getUserMedia, stopping tracks");
        stream.getTracks().forEach((t) => t.stop());
        return null;
      }

      localStreamRef.current = stream;

      if (localVideoRef.current && callType === "video") {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }
      console.log("[Call] Got local media:", stream.getTracks().map(t => `${t.kind}:${t.label}`));
      return stream;
    } catch (err) {
      console.warn("[Call] Camera unavailable, fallback to audio-only:", err);
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isAliveRef.current) {
          audioStream.getTracks().forEach((t) => t.stop());
          return null;
        }
        localStreamRef.current = audioStream;
        return audioStream;
      } catch (errAudio) {
        console.error("[Call] Microphone inaccessible:", errAudio);
        return null;
      }
    }
  }, [callType]);

  // ─── Create PeerConnection ───
  const createPeerConnection = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    console.log("[Call] Creating PeerConnection");
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    // ICE Candidate → send to remote
    pc.onicecandidate = (event) => {
      if (event.candidate && channel) {
        channel.send({
          type: "broadcast",
          event: "call_signal",
          payload: {
            type: "ice_candidate",
            senderId: userId,
            candidate: event.candidate.toJSON(),
          },
        });
      }
    };

    // Remote track received → attach to video/audio elements
    pc.ontrack = (event) => {
      console.log("[Call] ontrack:", event.track.kind, "streams:", event.streams.length);
      stopRingtone();

      if (event.streams[0]) {
        // Assign the full remote stream to both video and audio elements
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteVideoRef.current.play().catch(() => {});
        }
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.volume = 1.0;
          remoteAudioRef.current.play().catch(() => {});
        }
        if (event.track.kind === "video") {
          setHasRemoteVideo(true);
        }
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      console.log("[Call] connectionState:", pc.connectionState);
      if (pc.connectionState === "connected") {
        stopRingtone();
        setCallStatus("connected");
        startCallTimer();
      } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        if (isAliveRef.current) {
          handleEnd();
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[Call] iceConnectionState:", pc.iceConnectionState);
    };

    pc.onsignalingstatechange = () => {
      console.log("[Call] signalingState:", pc.signalingState);
    };

    return pc;
  }, [channel, userId, stopRingtone, startCallTimer, handleEnd]);

  // ─── Flush buffered ICE candidates ───
  const flushCandidates = useCallback(async (pc: RTCPeerConnection) => {
    const pending = [...pendingCandidatesRef.current];
    pendingCandidatesRef.current = [];
    for (const cand of pending) {
      try {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        }
      } catch (e) {
        console.warn("[Call] Failed to add buffered ICE candidate:", e);
      }
    }
  }, []);

  // ═══════════════════════════════════════════════════
  // CALLER FLOW: getUserMedia → createOffer → send offer
  // ═══════════════════════════════════════════════════
  const initiateCall = useCallback(async () => {
    if (hasInitiatedRef.current) return;
    hasInitiatedRef.current = true;

    console.log("[Call] Caller: initiating call");
    try {
      const stream = await getLocalMedia();
      const pc = createPeerConnection();

      // Add tracks to peer connection
      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      }

      // Create and send offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
      });
      await pc.setLocalDescription(offer);
      console.log("[Call] Caller: offer created & set as local description");

      if (channel) {
        channel.send({
          type: "broadcast",
          event: "call_signal",
          payload: {
            type: "offer",
            senderId: userId,
            callType,
            sdp: offer,
          },
        });
        console.log("[Call] Caller: offer sent via chat channel");
      }

      // ── Also broadcast to callee's global notification channel ──
      const notifyChannel = supabase.channel(`user_call_notify_${contact.id}`);
      notifyChannel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await notifyChannel.send({
            type: "broadcast",
            event: "incoming_call",
            payload: {
              callerId: userId,
              callerName: "", // GlobalCallListener will fetch profile
              callType,
            },
          });
          console.log("[Call] Caller: global notification sent to", contact.id);
        }
      });

      // ── Send push notification for offline callee ──
      try {
        await fetch("/api/push/call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetUserId: contact.id,
            callerName: "", // API uses auth user context
            callType,
          }),
        });
        console.log("[Call] Push notification sent");
      } catch (e) {
        console.warn("[Call] Push notification failed:", e);
      }
    } catch (err) {
      console.error("[Call] Caller: failed to initiate:", err);
      handleEnd();
    }
  }, [getLocalMedia, createPeerConnection, callType, channel, userId, handleEnd]);

  // ═══════════════════════════════════════════════════
  // CALLEE FLOW: Accept → getUserMedia → setRemoteDesc(offer) → createAnswer → send answer
  // ═══════════════════════════════════════════════════
  const handleAccept = useCallback(async () => {
    stopRingtone();
    setCallStatus("calling"); // Show "Menghubungkan..."

    console.log("[Call] Callee: accepting call");
    try {
      const stream = await getLocalMedia();
      const pc = createPeerConnection();

      // Add local tracks
      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      }

      // Process the buffered offer
      const offer = pendingOfferRef.current;
      if (!offer) {
        console.error("[Call] Callee: No pending offer to process!");
        // Send "accepted" to trigger caller to re-send offer
        if (channel) {
          channel.send({
            type: "broadcast",
            event: "call_signal",
            payload: { type: "call_accepted", senderId: userId },
          });
        }
        if (onAcceptCall) onAcceptCall();
        return;
      }

      console.log("[Call] Callee: setting remote description (offer)");
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await flushCandidates(pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log("[Call] Callee: answer created & set as local description");

      if (channel) {
        channel.send({
          type: "broadcast",
          event: "call_signal",
          payload: {
            type: "answer",
            senderId: userId,
            sdp: answer,
          },
        });
        console.log("[Call] Callee: answer sent via channel");
      }

      if (onAcceptCall) onAcceptCall();
    } catch (err) {
      console.error("[Call] Callee: failed to accept:", err);
      handleEnd();
    }
  }, [stopRingtone, getLocalMedia, createPeerConnection, channel, userId, onAcceptCall, flushCandidates, handleEnd]);

  // ═══════════════════════════════════════════════════
  // LIFECYCLE: Init on mount
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    if (!isOpen) return;
    isAliveRef.current = true;

    if (!isIncoming) {
      // CALLER: Start ringtone + initiate WebRTC
      startRingtone();
      initiateCall();

      // Auto-timeout after 45s
      const timeout = setTimeout(() => {
        if (isAliveRef.current) {
          handleEnd();
        }
      }, 45000);

      return () => {
        clearTimeout(timeout);
        isAliveRef.current = false;
        cleanUpAll();
      };
    } else {
      // CALLEE: Show ringing UI
      if (autoAccept) {
        handleAccept();
      } else {
        startRingtone();
      }

      return () => {
        isAliveRef.current = false;
        cleanUpAll();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ═══════════════════════════════════════════════════
  // SIGNALING LISTENER (Single consolidated listener)
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    if (!isOpen || !channel) return;

    const handleSignal = async (payload: any) => {
      const data = payload?.payload;
      if (!data || data.senderId === userId) return; // Ignore own messages

      console.log("[Call] Signal received:", data.type);

      // ── Caller receives ANSWER from callee ──
      if (data.type === "answer") {
        const pc = pcRef.current;
        if (!pc) {
          console.warn("[Call] No PC for answer");
          return;
        }
        try {
          if (pc.signalingState === "have-local-offer") {
            console.log("[Call] Caller: setting remote description (answer)");
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            await flushCandidates(pc);
            stopRingtone();
            setCallStatus("connected");
            startCallTimer();
          } else {
            console.warn("[Call] Caller: received answer in wrong state:", pc.signalingState);
          }
        } catch (err) {
          console.error("[Call] Caller: failed to set answer:", err);
        }
      }

      // ── Callee receives a NEW/UPDATED OFFER (e.g. re-negotiation or late offer) ──
      else if (data.type === "offer") {
        pendingOfferRef.current = data.sdp;
        console.log("[Call] Buffered offer SDP");

        // If callee already accepted (PC exists with tracks), process immediately
        const pc = pcRef.current;
        if (pc && pc.signalingState === "stable" && localStreamRef.current) {
          console.log("[Call] Callee: processing late offer immediately");
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            await flushCandidates(pc);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            channel.send({
              type: "broadcast",
              event: "call_signal",
              payload: { type: "answer", senderId: userId, sdp: answer },
            });
          } catch (err) {
            console.error("[Call] Callee: failed to handle late offer:", err);
          }
        }
      }

      // ── Caller receives CALL_ACCEPTED (fallback for when offer wasn't received) ──
      else if (data.type === "call_accepted" && !isIncoming) {
        console.log("[Call] Caller: callee accepted but had no offer, re-sending");
        // Re-initiate if we haven't already
        const pc = pcRef.current;
        if (pc && pc.localDescription) {
          channel.send({
            type: "broadcast",
            event: "call_signal",
            payload: {
              type: "offer",
              senderId: userId,
              callType,
              sdp: pc.localDescription,
            },
          });
        }
      }

      // ── ICE Candidate ──
      else if (data.type === "ice_candidate") {
        const pc = pcRef.current;
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (e) {
            console.warn("[Call] ICE add error:", e);
          }
        } else {
          pendingCandidatesRef.current.push(data.candidate);
        }
      }

      // ── Hangup ──
      else if (data.type === "hangup") {
        console.log("[Call] Remote hangup received");
        cleanUpAll();
        setCallStatus("ended");
        onEndCall(callDurationRef.current);
      }
    };

    channel.on("broadcast", { event: "call_signal" }, handleSignal);

    return () => {
      // Supabase channels don't have a clean .off() for broadcast, 
      // but the channel cleanup happens when modal closes
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, channel]);

  // ═══════════════════════════════════════════════════
  // CONTROLS
  // ═══════════════════════════════════════════════════
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted; // Toggle: if muted, enable; if not muted, disable
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const switchCamera = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!localStreamRef.current) return;
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextMode },
        audio: false,
      });
      const newVideoTrack = newStream.getVideoTracks()[0];

      if (pcRef.current && newVideoTrack) {
        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      }

      if (localVideoRef.current && newVideoTrack) {
        const oldTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldTrack) {
          oldTrack.stop();
          localStreamRef.current.removeTrack(oldTrack);
        }
        localStreamRef.current.addTrack(newVideoTrack);
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    } catch (err) {
      console.warn("[Call] Switch camera error:", err);
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (!isOpen) return null;

  const isVideoCall = callType === "video";
  const isConnected = callStatus === "connected";

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════
  return (
    <div
      className="whatsapp-call-screen"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999999,
        background: "#08100d",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        animation: "fadeInCall 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        overflow: "hidden",
        userSelect: "none",
      }}
      onClick={() => setShowControls((prev) => !prev)}
    >
      {/* Hidden audio element for remote voice stream */}
      <audio ref={remoteAudioRef} playsInline />

      {/* ========================================================================= */}
      {/* 1. VIDEO CALL STREAMS (Full-screen + PiP Floating Layer)                  */}
      {/* ========================================================================= */}
      {isVideoCall && (
        <div style={{ position: "absolute", inset: 0, zIndex: 0, background: "#000000" }}>
          {/* Remote Video Stream */}
          <video
            ref={remoteVideoRef}
            playsInline
            style={{
              position: "absolute",
              ...(isSwappedViews
                ? {
                    top: "80px",
                    right: "18px",
                    width: "115px",
                    height: "165px",
                    borderRadius: "18px",
                    border: "2px solid var(--gold-main, #d4af37)",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(212, 175, 55, 0.3)",
                    zIndex: 20,
                    cursor: "pointer",
                  }
                : {
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 1,
                  }),
              objectFit: "cover",
              display: hasRemoteVideo ? "block" : "none",
            }}
            onClick={(e) => {
              if (isSwappedViews) {
                e.stopPropagation();
                setIsSwappedViews(false);
              }
            }}
          />

          {/* Local Video Stream */}
          <video
            ref={localVideoRef}
            playsInline
            muted
            style={{
              position: "absolute",
              ...(isSwappedViews || !isConnected
                ? {
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 1,
                  }
                : {
                    top: "80px",
                    right: "18px",
                    width: "115px",
                    height: "165px",
                    borderRadius: "18px",
                    border: "2px solid var(--gold-main, #d4af37)",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(212, 175, 55, 0.3)",
                    zIndex: 20,
                    cursor: "pointer",
                  }),
              objectFit: "cover",
              transform: facingMode === "user" ? "scaleX(-1)" : "none",
              display: isVideoOff ? "none" : "block",
            }}
            onClick={(e) => {
              if (!isSwappedViews && isConnected) {
                e.stopPropagation();
                setIsSwappedViews(true);
              }
            }}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. HEADER BAR (WhatsApp Top Navigation & Caller Info)                    */}
      {/* ========================================================================= */}
      <div
        style={{
          position: "relative",
          zIndex: 15,
          padding: "25px 20px",
          paddingTop: "max(30px, env(safe-area-inset-top, 30px))",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: isVideoCall ? "linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)" : "transparent",
          opacity: showControls ? 1 : 0,
          transition: "opacity 0.25s",
          pointerEvents: showControls ? "auto" : "none",
        }}
      >
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
            marginBottom: "8px",
            letterSpacing: "0.5px",
          }}
        >
          <i className="fa-solid fa-lock" style={{ fontSize: "0.65rem" }}></i>
          <span>Terenkripsi Ujung-ke-Ujung</span>
        </div>

        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", margin: "2px 0", color: "#ffffff", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.8))" }}>
          {contact.nama_panggilan}
        </h2>

        <div style={{ fontSize: "0.92rem", color: "var(--gold-main, #d4af37)", fontWeight: 500, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.8))" }}>
          {callStatus === "calling" && "Menghubungkan..."}
          {callStatus === "ringing" && (isIncoming ? "Panggilan Masuk..." : "Berdering...")}
          {callStatus === "connected" && formatDuration(callDuration)}
          {callStatus === "ended" && "Panggilan Selesai"}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CENTER AVATAR (For Voice Call or Waiting Screen)                      */}
      {/* ========================================================================= */}
      {(!isVideoCall || !isConnected) && (
        <div
          style={{
            position: "relative",
            zIndex: 10,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ position: "relative" }}>
            {!isConnected && (
              <>
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
              </>
            )}

            <Image
              src={contactAvatar}
              alt={contact.nama_panggilan || "Avatar"}
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
              unoptimized={contactAvatar.startsWith("data:") || contactAvatar.includes("ui-avatars.com")}
            />
          </div>

          {!isVideoCall && isConnected && (
            <div style={{ marginTop: "30px", display: "flex", alignItems: "center", gap: "6px" }}>
              {[12, 24, 16, 32, 20, 36, 18, 28, 14, 22].map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: "4px",
                    height: `${h}px`,
                    background: "var(--gold-main, #d4af37)",
                    borderRadius: "2px",
                    animation: `audioWave 0.8s infinite alternate ${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BOTTOM CONTROL BAR (WhatsApp Action Icons with Labels)                */}
      {/* ========================================================================= */}
      <div
        style={{
          position: "relative",
          zIndex: 25,
          padding: "25px 20px",
          paddingBottom: "max(35px, env(safe-area-inset-bottom, 35px))",
          background: isVideoCall ? "linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 100%)" : "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          opacity: showControls ? 1 : 0,
          transition: "opacity 0.25s",
          pointerEvents: showControls ? "auto" : "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isIncoming && callStatus === "ringing" ? (
          <div style={{ display: "flex", alignItems: "center", gap: "50px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                onClick={handleEnd}
                style={{
                  width: "65px",
                  height: "65px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #ff4757, #c0392b)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 8px 25px rgba(255, 71, 87, 0.5)",
                }}
                title="Tolak"
              >
                <i className="fa-solid fa-phone-slash"></i>
              </button>
              <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.7)" }}>Tolak</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                onClick={handleAccept}
                style={{
                  width: "65px",
                  height: "65px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #2ed573, #26af5f)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 8px 25px rgba(46, 213, 115, 0.5)",
                }}
                title="Terima"
              >
                <i className="fa-solid fa-phone"></i>
              </button>
              <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.7)" }}>Terima</span>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            {/* 1. Mute Button */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <button
                type="button"
                onClick={toggleMute}
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: isMuted ? "rgba(255, 85, 85, 0.3)" : "rgba(255, 255, 255, 0.15)",
                  border: isMuted ? "1.5px solid #ff5555" : "1.5px solid rgba(255, 255, 255, 0.25)",
                  color: isMuted ? "#ff5555" : "#ffffff",
                  fontSize: "1.15rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "0.2s",
                }}
                title={isMuted ? "Aktifkan Mikrofon" : "Bisukan Mikrofon"}
              >
                <i className={`fa-solid ${isMuted ? "fa-microphone-slash" : "fa-microphone"}`}></i>
              </button>
              <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.7)" }}>
                {isMuted ? "Mute Aktif" : "Mute"}
              </span>
            </div>

            {/* 2. Video Toggle */}
            {isVideoCall && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <button
                  type="button"
                  onClick={toggleVideo}
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    background: isVideoOff ? "rgba(255, 85, 85, 0.3)" : "rgba(255, 255, 255, 0.15)",
                    border: isVideoOff ? "1.5px solid #ff5555" : "1.5px solid rgba(255, 255, 255, 0.25)",
                    color: isVideoOff ? "#ff5555" : "#ffffff",
                    fontSize: "1.15rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "0.2s",
                  }}
                  title={isVideoOff ? "Nyalakan Kamera" : "Matikan Kamera"}
                >
                  <i className={`fa-solid ${isVideoOff ? "fa-video-slash" : "fa-video"}`}></i>
                </button>
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.7)" }}>
                  {isVideoOff ? "Kamera Mati" : "Kamera"}
                </span>
              </div>
            )}

            {/* 3. Switch Camera Flip */}
            {isVideoCall && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <button
                  type="button"
                  onClick={switchCamera}
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.15)",
                    border: "1.5px solid rgba(255, 255, 255, 0.25)",
                    color: "#ffffff",
                    fontSize: "1.15rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "0.2s",
                  }}
                  title="Balik Kamera Depan / Belakang"
                >
                  <i className="fa-solid fa-camera-rotate"></i>
                </button>
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.7)" }}>Balik</span>
              </div>
            )}

            {/* 4. End Call Button */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <button
                type="button"
                onClick={handleEnd}
                style={{
                  width: "58px",
                  height: "58px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #ff4757, #c0392b)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "1.4rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 8px 25px rgba(255, 71, 87, 0.5)",
                  transition: "0.2s",
                }}
                title="Akhiri Panggilan"
              >
                <i className="fa-solid fa-phone-slash"></i>
              </button>
              <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.7)" }}>Akhiri</span>
            </div>
          </div>
        )}
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
        @keyframes audioWave {
          0% { transform: scaleY(0.4); }
          100% { transform: scaleY(1.4); }
        }
      `}</style>
    </div>
  );
}

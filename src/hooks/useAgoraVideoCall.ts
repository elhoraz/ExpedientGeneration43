"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface CallModalState {
  isOpen: boolean;
  type: "voice" | "video";
  isIncoming?: boolean;
  autoAccept?: boolean;
  pendingOffer?: RTCSessionDescriptionInit | null;
}

interface UseAgoraVideoCallProps {
  userId: string;
  contactId: string;
  channel: any;
}

export function useAgoraVideoCall({
  userId,
  contactId,
  channel,
}: UseAgoraVideoCallProps) {
  const [callModal, setCallModal] = useState<CallModalState | null>(null);
  const supabase = createClient();

  // Handle URL deep linking for incoming/auto calls
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("callAction") === "accept" || urlParams.get("autoCall") === "true") {
      const type = (urlParams.get("type") as "voice" | "video") || "voice";
      setCallModal({
        isOpen: true,
        type,
        isIncoming: true,
        autoAccept: true,
      });

      // Clean URL params to prevent re-triggering on refresh
      urlParams.delete("callAction");
      urlParams.delete("autoCall");
      urlParams.delete("type");
      const cleanUrl = urlParams.toString()
        ? `${window.location.pathname}?${urlParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, []);

  // Listen to realtime signaling events on the active channel
  useEffect(() => {
    if (!channel) return;

    const subscription = channel.on(
      "broadcast",
      { event: "call_signal" },
      (payload: any) => {
        const data = payload?.payload;
        if (!data || data.senderId === userId) return;
        // Only respond to signals from the current contact
        if (data.senderId !== contactId) return;

        if (data.type === "offer") {
          setCallModal((prev) => {
            if (prev?.isOpen) {
              return { ...prev, pendingOffer: data.sdp };
            }
            return {
              isOpen: true,
              type: data.callType || "voice",
              isIncoming: true,
              autoAccept: false,
              pendingOffer: data.sdp,
            };
          });
        } else if (data.type === "hangup") {
          setCallModal(null);
        }
      }
    );

    return () => {
      // Broadcast listener is automatically cleaned when channel is unsubscribed
    };
  }, [channel, userId, contactId]);

  // Start outgoing call
  const startCall = useCallback((type: "voice" | "video") => {
    setCallModal({
      isOpen: true,
      type,
      isIncoming: false,
      pendingOffer: null,
    });
  }, []);

  // End call & record audit message
  const endCall = useCallback(
    async (duration: number = 0) => {
      setCallModal(null);

      if (duration > 0) {
        const m = Math.floor(duration / 60);
        const s = duration % 60;
        const timeStr = `${m > 0 ? `${m}m ` : ""}${s}d`;
        const callLog = `📞 Panggilan selesai (${timeStr})`;

        try {
          const { error } = await supabase.from("chat_messages").insert([
            {
              sender_id: userId,
              receiver_id: contactId,
              message: callLog,
              message_type: "call",
              is_lounge: false,
            },
          ]);
          if (error) console.error("[useAgoraVideoCall] Gagal mengirim log panggilan:", error);
        } catch (err) {
          console.error("[useAgoraVideoCall] Call log error:", err);
        }
      }
    },
    [supabase, userId, contactId]
  );

  return {
    callModal,
    setCallModal,
    startCall,
    endCall,
  };
}

// Alias for semantic clarity
export const usePersonalCall = useAgoraVideoCall;

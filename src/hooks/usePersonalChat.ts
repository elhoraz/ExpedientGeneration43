"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface SendMessageOptions {
  content?: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  messageType?: string;
}

interface UsePersonalChatProps {
  userId: string;
  contactId: string;
  initialMessages: any[];
  showAlert?: (title: string, message: string) => void | Promise<void>;
}

export function usePersonalChat({
  userId,
  contactId,
  initialMessages,
  showAlert,
}: UsePersonalChatProps) {
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [offset, setOffset] = useState(initialMessages.length);
  const [hasMore, setHasMore] = useState(initialMessages.length === 50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const supabase = createClient();
  const channelRef = useRef<any>(null);
  const [channelReady, setChannelReady] = useState<any>(null);

  // Mark all unread messages from this contact as read
  const markAsRead = useCallback(async () => {
    try {
      await supabase
        .from("chat_messages")
        .update({ is_read: true })
        .eq("receiver_id", userId)
        .eq("sender_id", contactId)
        .eq("is_read", false);
    } catch (err) {
      console.warn("[usePersonalChat] Gagal update is_read:", err);
    }
  }, [supabase, userId, contactId]);

  // Realtime subscription setup
  useEffect(() => {
    markAsRead();

    // Setup deterministic realtime channel for chat and WebRTC signaling
    const channelRoomName = [userId, contactId].sort().join("_");
    const channel = supabase
      .channel(`personal_chat_${channelRoomName}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: "is_lounge=eq.false",
        },
        (payload) => {
          const newMsg = payload.new;
          const isRelevant =
            (newMsg.sender_id === userId && newMsg.receiver_id === contactId) ||
            (newMsg.sender_id === contactId && newMsg.receiver_id === userId);

          if (isRelevant) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

            // If message from contact, mark as read & trigger subtle vibration
            if (newMsg.sender_id === contactId) {
              markAsRead();
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate([40, 40, 40]);
              }
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: "is_lounge=eq.false",
        },
        (payload) => {
          const updated = payload.new;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
          );
        }
      )
      .subscribe();

    channelRef.current = channel;
    setChannelReady(channel);

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setChannelReady(null);
    };
  }, [supabase, userId, contactId, markAsRead]);

  // Load older messages for pagination
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const { data: olderMessages, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("is_lounge", false)
        .eq("is_deleted", false)
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${userId})`)
        .order("created_at", { ascending: false })
        .range(offset, offset + 49);

      if (!error && olderMessages) {
        const reversed = [...olderMessages].reverse();
        setMessages((prev) => [...reversed, ...prev]);
        setOffset((prev) => prev + olderMessages.length);
        if (olderMessages.length < 50) setHasMore(false);
      }
    } catch (err) {
      console.error("[usePersonalChat] Error loading more messages:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Send message (text or media)
  const sendMessage = async (options: SendMessageOptions) => {
    const { content, imageUrl, audioUrl, videoUrl, messageType = "text" } = options;
    if (!content?.trim() && !imageUrl && !audioUrl && !videoUrl) return;

    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: any = {
      id: tempId,
      sender_id: userId,
      receiver_id: contactId,
      message: content || null,
      image_url: imageUrl || null,
      audio_url: audioUrl || null,
      video_url: videoUrl || null,
      message_type: messageType,
      is_lounge: false,
      is_deleted: false,
      is_read: false,
      isSending: true,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    const { data, error } = await supabase
      .from("chat_messages")
      .insert([
        {
          sender_id: userId,
          receiver_id: contactId,
          message: content || null,
          image_url: imageUrl || null,
          audio_url: audioUrl || null,
          video_url: videoUrl || null,
          message_type: messageType,
          is_lounge: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("[usePersonalChat] Gagal mengirim pesan:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      showAlert?.("Gagal", "Pesan gagal terkirim. Silakan coba lagi.");
    } else if (data) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));

      // Real-time in-app & push notification
      fetch("/api/chat/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: contactId,
          message:
            content ||
            (imageUrl
              ? "📷 Mengirim gambar"
              : audioUrl
              ? "🎤 Mengirim pesan suara"
              : "🎥 Mengirim video"),
        }),
      }).catch((err) => console.warn("[usePersonalChat] Chat notify error:", err));
    }
  };

  // Delete message
  const deleteMessage = async (msgId: string) => {
    const { error } = await supabase
      .from("chat_messages")
      .update({ is_deleted: true })
      .eq("id", msgId)
      .eq("sender_id", userId);

    if (error) {
      console.error("[usePersonalChat] Gagal menghapus pesan:", error);
      showAlert?.("Gagal", "Gagal menghapus pesan.");
    } else {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, is_deleted: true } : m))
      );
    }
  };

  // Image Upload helper
  const uploadImage = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      showAlert?.("Peringatan", "Ukuran gambar maksimal 5MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("chat-attachments").getPublicUrl(filePath);

      await sendMessage({ imageUrl: publicUrl, messageType: "image" });
    } catch (err) {
      console.error("[usePersonalChat] Upload image error:", err);
      showAlert?.("Gagal", "Gagal mengunggah gambar.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Voice Note send helper
  const sendVoiceNote = async (audioBlob: Blob, duration: number) => {
    try {
      const mimeType = audioBlob.type || "audio/webm";
      const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
      const fileName = `voice_notes/${userId}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(fileName, audioBlob, { contentType: mimeType });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("chat-attachments").getPublicUrl(fileName);

      const urlWithDuration = `${publicUrl}?d=${duration}`;
      await sendMessage({ audioUrl: urlWithDuration, messageType: "voice" });
    } catch (err) {
      console.error("[usePersonalChat] Gagal mengirim Voice Note:", err);
      showAlert?.("Gagal", "Gagal mengirim pesan suara.");
    }
  };

  // Video Note send helper
  const sendVideoNote = async (videoBlob: Blob) => {
    try {
      const mimeType = videoBlob.type || "video/mp4";
      const ext = mimeType.includes("webm") ? "webm" : "mp4";
      const fileName = `video_notes/${userId}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(fileName, videoBlob, { contentType: mimeType });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("chat-attachments").getPublicUrl(fileName);

      await sendMessage({ videoUrl: publicUrl, messageType: "video_note" });
    } catch (err) {
      console.error("[usePersonalChat] Gagal mengirim Video Note:", err);
      showAlert?.("Gagal", "Gagal mengirim video pesan.");
    }
  };

  return {
    messages,
    setMessages,
    hasMore,
    isLoadingMore,
    uploadingImage,
    channel: channelReady || channelRef.current,
    channelRef,
    handleLoadMore,
    sendMessage,
    deleteMessage,
    uploadImage,
    sendVoiceNote,
    sendVideoNote,
    markAsRead,
  };
}

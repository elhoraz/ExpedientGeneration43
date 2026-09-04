"use client";

import { useEffect, useRef, useState, FormEvent, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/layout/AegisConfirm";
import ChatImageViewer from "@/components/ui/ChatImageViewer";
import VoiceNotePlayer from "@/components/chat/VoiceNotePlayer";
import VideoNotePlayer from "@/components/chat/VideoNotePlayer";
import VoiceRecorder from "@/components/chat/VoiceRecorder";
import VideoNoteRecorder from "@/components/chat/VideoNoteRecorder";
import ChatCallModal from "@/components/chat/ChatCallModal";
import { getAvatarUrl, getAvatarFallback } from "@/lib/avatar";
import "../../chat.css";

type Contact = {
  id: string;
  nama_lengkap: string;
  nama_panggilan: string;
  foto_profil: string | null;
};

const EMOJI_DATA = {
  'Wajah': ['😀','😂','🤣','😍','😎','🥰','😢','😭','🤔','😱','🥺','😤','🤝','🙏','💪','👍','👎','❤️','🔥','✨','💯','🎉','🎊'],
  'Islami': ['☪️','🕌','📿','🤲','🌙','⭐','🕋','📖','🌹','🫶'],
  'Aktivitas': ['🎓','📚','⚽','🏀','🎯','🏆','💼','🎵','🎤','📸'],
  'Lainnya': ['👀','💬','📌','🚀','💎','🌍','☕','🍕','👑','⚡','🌈','💡']
};

export default function PersonalChatClient({ 
  initialMessages, 
  userId, 
  contact 
}: { 
  initialMessages: any[]; 
  userId: string; 
  contact: Contact;
}) {
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialMessages.length === 50);
  const [offset, setOffset] = useState(initialMessages.length);
  const [activeImage, setActiveImage] = useState<{ url: string; sender: string; time: string } | null>(null);
  
  // WhatsApp-like Call & Recording states
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showVideoNoteRecorder, setShowVideoNoteRecorder] = useState(false);
  const [callModal, setCallModal] = useState<{
    isOpen: boolean;
    type: "voice" | "video";
    isIncoming?: boolean;
    autoAccept?: boolean;
    pendingOffer?: RTCSessionDescriptionInit | null;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const supabase = createClient();
  const { showAlert, showConfirm } = useConfirm();

  // Mark all unread messages from this contact as read
  const markAsRead = useCallback(async () => {
    try {
      await supabase
        .from("chat_messages")
        .update({ is_read: true })
        .eq("receiver_id", userId)
        .eq("sender_id", contact.id)
        .eq("is_read", false);
    } catch (err) {
      console.warn("Gagal update is_read:", err);
    }
  }, [supabase, userId, contact.id]);

  useEffect(() => {
    document.body.classList.add("page-chat");
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("callAction") === "accept" || urlParams.get("autoCall") === "true") {
        const type = (urlParams.get("type") as any) || "voice";
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
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    markAsRead();

    // Setup deterministic realtime channel for chat and WebRTC signaling
    const channelRoomName = [userId, contact.id].sort().join("_");
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
            (newMsg.sender_id === userId && newMsg.receiver_id === contact.id) ||
            (newMsg.sender_id === contact.id && newMsg.receiver_id === userId);

          if (isRelevant) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            
            // If message from contact, mark as read & vibrate
            if (newMsg.sender_id === contact.id) {
              markAsRead();
              if (navigator.vibrate) {
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
      // Real WebRTC Call signaling listener — buffer offer SDP for callee
      .on("broadcast", { event: "call_signal" }, (payload) => {
        const data = payload?.payload;
        if (!data || data.senderId === userId) return;
        // IMPORTANT: Only respond to signals from the current chat contact
        if (data.senderId !== contact.id) return;

        if (data.type === "offer") {
          // Caller sent an offer — open ringing modal with the offer buffered
          setCallModal((prev) => {
            if (prev?.isOpen) {
              // Modal already open, just update the pending offer
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
          // Remote ended call before we accepted
          setCallModal(null);
        }
      })
      .subscribe();

    channelRef.current = channel;

    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.body.classList.remove("page-chat");
      supabase.removeChannel(channel);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [supabase, userId, contact.id, markAsRead]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    const { data: olderMessages, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("is_lounge", false)
      .eq("is_deleted", false)
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${contact.id}),and(sender_id.eq.${contact.id},receiver_id.eq.${userId})`)
      .order("created_at", { ascending: false })
      .range(offset, offset + 49);

    if (!error && olderMessages) {
      const reversed = [...olderMessages].reverse();
      setMessages(prev => [...reversed, ...prev]);
      setOffset(prev => prev + olderMessages.length);
      if (olderMessages.length < 50) setHasMore(false);
    }
    setIsLoadingMore(false);
  };

  const handleSendMessage = async (
    e?: FormEvent, 
    media?: { imageUrl?: string; audioUrl?: string; videoUrl?: string; messageType?: string }
  ) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() && !media?.imageUrl && !media?.audioUrl && !media?.videoUrl) return;

    const messageText = inputMessage;
    setInputMessage(""); // Optimistic clear
    setShowEmoji(false);

    // Optimistic message
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: any = {
      id: tempId,
      sender_id: userId,
      receiver_id: contact.id,
      message: messageText || null,
      image_url: media?.imageUrl || null,
      audio_url: media?.audioUrl || null,
      video_url: media?.videoUrl || null,
      message_type: media?.messageType || "text",
      is_lounge: false,
      is_deleted: false,
      is_read: false,
      isSending: true,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    const { data, error } = await supabase.from("chat_messages").insert([
      {
        sender_id: userId,
        receiver_id: contact.id,
        message: messageText || null,
        image_url: media?.imageUrl || null,
        audio_url: media?.audioUrl || null,
        video_url: media?.videoUrl || null,
        message_type: media?.messageType || "text",
        is_lounge: false,
      },
    ]).select().single();

    if (error) {
      console.error("Gagal mengirim pesan:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      showAlert("Gagal", "Pesan gagal terkirim. Silakan coba lagi.");
    } else if (data) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
      // Send real-time in-app & push notification to recipient
      fetch("/api/chat/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: contact.id,
          message: messageText || (media?.imageUrl ? "📷 Mengirim gambar" : media?.audioUrl ? "🎤 Mengirim pesan suara" : "🎥 Mengirim video"),
        }),
      }).catch((err) => console.warn("Failed to send chat notification:", err));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      await showAlert("Peringatan", "Ukuran gambar maksimal 5MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(filePath);

      await handleSendMessage(undefined, { imageUrl: publicUrl, messageType: "image" });
    } catch (error) {
      await showAlert("Gagal", "Gagal mengunggah gambar.");
      console.error(error);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Voice Note Send Handler
  const handleSendVoiceNote = async (audioBlob: Blob, duration: number) => {
    setIsRecordingVoice(false);
    try {
      const mimeType = audioBlob.type || "audio/webm";
      const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
      const fileName = `voice_notes/${userId}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(fileName, audioBlob, { contentType: mimeType });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(fileName);

      // Attach ?d=duration for immediate & accurate duration display
      const urlWithDuration = `${publicUrl}?d=${duration}`;
      await handleSendMessage(undefined, { audioUrl: urlWithDuration, messageType: "voice" });
    } catch (err) {
      console.error("Gagal mengirim Voice Note:", err);
      showAlert("Gagal", "Gagal mengirim pesan suara.");
    }
  };

  // Video Note Send Handler
  const handleSendVideoNote = async (videoBlob: Blob, duration: number) => {
    setShowVideoNoteRecorder(false);
    try {
      const fileName = `video_notes/${userId}_${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(fileName, videoBlob, { contentType: "video/webm" });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(fileName);

      await handleSendMessage(undefined, { videoUrl: publicUrl, messageType: "video_note" });
    } catch (err) {
      console.error("Gagal mengirim Video Note:", err);
      showAlert("Gagal", "Gagal mengirim video pesan.");
    }
  };

  // Call Initiation — uses the existing shared channel (no separate unsubscribed channel)
  const handleStartCall = (type: "voice" | "video") => {
    // Open call modal locally — the ChatCallModal will handle sending the offer
    // via the shared channel (channelRef.current)
    setCallModal({
      isOpen: true,
      type,
      isIncoming: false,
      pendingOffer: null,
    });
  };

  const handleEndCall = async (duration = 0) => {
    setCallModal(null);

    if (duration > 0) {
      const m = Math.floor(duration / 60);
      const s = duration % 60;
      const timeStr = `${m > 0 ? `${m}m ` : ""}${s}d`;
      const callLog = `📞 Panggilan selesai (${timeStr})`;

      // Auto-send call log message directly
      const { error } = await supabase.from("chat_messages").insert([{
        sender_id: userId,
        receiver_id: contact.id,
        message: callLog,
        message_type: "call",
        is_lounge: false,
      }]);
      if (error) console.error("Gagal mengirim log panggilan:", error);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    const confirmed = await showConfirm("Hapus Pesan", "Hapus pesan ini?");
    if (!confirmed) return;

    await supabase
      .from("chat_messages")
      .update({ is_deleted: true })
      .eq("id", msgId)
      .eq("sender_id", userId);
  };

  const addEmoji = (emoji: string) => {
    setInputMessage(prev => prev + emoji);
  };

  const contactAvatar = getAvatarUrl(contact.foto_profil, contact.nama_panggilan || contact.nama_lengkap);

  return (
    <div className="chat-room-container">
      {/* HEADER WITH CALL BUTTONS */}
      <div className="chat-room-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 0 }}>
          <Link href="/chat" className="back-btn" title="Kembali ke Kotak Pesan">
            <i className="fa-solid fa-arrow-left"></i>
          </Link>
          <div className="contact-info">
            <img 
              src={contactAvatar} 
              alt={contact.nama_panggilan} 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = getAvatarFallback(contact.nama_panggilan);
              }}
            />
            <div>
              <h3>{contact.nama_panggilan}</h3>
              <div className="contact-fullname">{contact.nama_lengkap}</div>
            </div>
          </div>
        </div>

        {/* Action Call Buttons (Voice Call & Video Call) */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={() => handleStartCall("voice")}
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              background: "rgba(212, 175, 55, 0.15)",
              border: "1px solid rgba(212, 175, 55, 0.35)",
              color: "var(--gold-main, #d4af37)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "0.95rem",
              transition: "0.2s",
            }}
            title="Panggilan Suara"
          >
            <i className="fa-solid fa-phone"></i>
          </button>

          <button
            type="button"
            onClick={() => handleStartCall("video")}
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              background: "rgba(212, 175, 55, 0.15)",
              border: "1px solid rgba(212, 175, 55, 0.35)",
              color: "var(--gold-main, #d4af37)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "0.95rem",
              transition: "0.2s",
            }}
            title="Panggilan Video"
          >
            <i className="fa-solid fa-video"></i>
          </button>
        </div>
      </div>

      {/* CHAT MESSAGES AREA */}
      <div className="chat-messages-area">
        {hasMore && (
          <div style={{ textAlign: "center", marginBottom: "10px" }}>
            <button 
              onClick={handleLoadMore} 
              disabled={isLoadingMore}
              style={{
                background: "rgba(212, 175, 55, 0.1)",
                border: "1px solid rgba(212, 175, 55, 0.4)",
                color: "var(--gold-main, #d4af37)",
                padding: "8px 20px",
                borderRadius: "20px",
                cursor: "pointer",
                fontSize: "0.8rem",
                transition: "0.3s"
              }}
            >
              {isLoadingMore ? "Memuat..." : "Muat Lebih Lama"}
            </button>
          </div>
        )}

        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-secondary)" }}>
            <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--gold-main, #d4af37)", fontSize: "1.4rem" }}>
              <i className="fa-solid fa-handshake-angle"></i>
            </div>
            <h4 style={{ color: "var(--text-primary)", fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", marginBottom: "8px" }}>
              Mulai Silaturahmi dengan {contact.nama_panggilan}
            </h4>
            <p style={{ fontSize: "0.85rem", maxWidth: "340px", margin: "0 auto 20px", lineHeight: 1.5 }}>
              Kirim salam atau sapaan pertama untuk menyambung kembali tali ukhuwah masa pondok:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px", maxWidth: "420px", margin: "0 auto" }}>
              {[
                `Assalamu'alaikum, antum di mana sekarang?`,
                `Ahlan ya akhi! Gimana kabarnya?`,
                `Kapan ada waktu luang untuk ngopi santai?`,
                `Assalamu'alaikum, salam rindu dari kawan pondok!`
              ].map((greeting, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInputMessage(greeting)}
                  style={{
                    background: "rgba(212, 175, 55, 0.08)",
                    border: "1px solid rgba(212, 175, 55, 0.25)",
                    color: "var(--gold-main, #d4af37)",
                    borderRadius: "16px",
                    padding: "8px 14px",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(212, 175, 55, 0.2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(212, 175, 55, 0.08)")}
                >
                  "{greeting}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.is_deleted) return null;
          
          const isMine = msg.sender_id === userId;
          const timeString = new Date(msg.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={msg.id} className={`msg-bubble-wrapper ${isMine ? 'mine' : 'other'}`}>
              <div className="msg-bubble-content">
                {/* 1. Gambar */}
                {msg.image_url && (
                  <div 
                    className="msg-image-container"
                    onClick={() => setActiveImage({
                      url: msg.image_url,
                      sender: isMine ? "Anda" : contact.nama_panggilan,
                      time: timeString
                    })}
                    title="Klik untuk memperbesar & mengunduh"
                  >
                    <img src={msg.image_url} alt="Attachment" className="msg-image" />
                    <div className="msg-image-overlay-hint">
                      <i className="fa-solid fa-expand"></i> Buka
                    </div>
                  </div>
                )}

                {/* 2. Voice Note (Audio) */}
                {msg.audio_url && (
                  <VoiceNotePlayer audioUrl={msg.audio_url} isMine={isMine} />
                )}

                {/* 3. Circular Video Note */}
                {msg.video_url && (
                  <VideoNotePlayer videoUrl={msg.video_url} isMine={isMine} />
                )}
                
                {/* 4. Teks Pesan Biasa */}
                {msg.message && <div>{msg.message}</div>}
                
                {/* Meta Row: Waktu, Hapus & Status Tanda Read (WhatsApp Ticks) */}
                <div className="msg-meta-row">
                  {isMine && (
                    <button className="btn-delete-msg" onClick={() => handleDeleteMessage(msg.id)} title="Hapus pesan">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  )}
                  <span className="msg-time">{timeString}</span>

                  {/* Status Centang Pengiriman WhatsApp (Hanya untuk pesan pengirim) */}
                  {isMine && (
                    <span style={{ display: "inline-flex", alignItems: "center" }}>
                      {msg.isSending ? (
                        <i className="fa-regular fa-clock" style={{ fontSize: "0.68rem", opacity: 0.6 }} title="Mengirim..."></i>
                      ) : msg.is_read ? (
                        <i 
                          className="fa-solid fa-check-double" 
                          style={{ 
                            fontSize: "0.78rem", 
                            color: "var(--gold-main, #d4af37)",
                            filter: "drop-shadow(0 0 4px rgba(212, 175, 55, 0.5))"
                          }} 
                          title="Sudah dibaca"
                        ></i>
                      ) : (
                        <i 
                          className="fa-solid fa-check" 
                          style={{ fontSize: "0.78rem", color: "var(--text-secondary)", opacity: 0.7 }} 
                          title="Sudah terkirim ke server"
                        ></i>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {messages.length === 0 && (
          <div className="inbox-empty-state" style={{ marginTop: "auto", marginBottom: "auto" }}>
            Mulai obrolan privat dengan {contact.nama_panggilan}.
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA / RECORDING BAR */}
      <div className="chat-input-bar">
        {isRecordingVoice ? (
          <VoiceRecorder
            onCancel={() => setIsRecordingVoice(false)}
            onSend={handleSendVoiceNote}
          />
        ) : (
          <>
            {/* Action Tools: Emoji, Image, Video Note, Voice Note */}
            <div className="chat-input-actions" ref={emojiRef}>
              <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="btn-chat-tool" title="Emoji">
                <i className="fa-solid fa-face-smile"></i>
              </button>
              {showEmoji && (
                <div className="emoji-picker-container">
                  {Object.entries(EMOJI_DATA).map(([cat, emojis]) => (
                    <div key={cat}>
                      <div className="emoji-category">{cat}</div>
                      <div className="emoji-grid">
                        {emojis.map((e, idx) => (
                          <button key={idx} className="emoji-btn" type="button" onClick={() => addEmoji(e)}>
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                style={{ display: "none" }} 
                onChange={handleImageUpload} 
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()} 
                disabled={uploadingImage}
                className="btn-chat-tool"
                title="Kirim Gambar"
              >
                {uploadingImage ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-paperclip"></i>}
              </button>

              {/* Video Note Button */}
              <button
                type="button"
                onClick={() => setShowVideoNoteRecorder(true)}
                className="btn-chat-tool"
                title="Kirim Video Note Bulat"
              >
                <i className="fa-solid fa-video"></i>
              </button>
            </div>

            {/* Input Teks */}
            <form onSubmit={(e) => handleSendMessage(e)} className="chat-form">
              <input 
                type="text" 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Tulis pesan..." 
                className="chat-text-input"
              />

              {inputMessage.trim() ? (
                <button 
                  type="submit" 
                  className="btn-chat-send"
                  title="Kirim Pesan"
                >
                  <i className="fa-solid fa-paper-plane"></i>
                </button>
              ) : (
                /* Voice Note Trigger when input text is empty */
                <button 
                  type="button"
                  onClick={() => setIsRecordingVoice(true)}
                  className="btn-chat-send"
                  title="Tekan untuk Rekam Voice Note"
                >
                  <i className="fa-solid fa-microphone"></i>
                </button>
              )}
            </form>
          </>
        )}
      </div>

      {/* Video Note Recorder Modal */}
      {showVideoNoteRecorder && (
        <VideoNoteRecorder
          onCancel={() => setShowVideoNoteRecorder(false)}
          onSend={handleSendVideoNote}
        />
      )}

      {/* WhatsApp-Style Fullscreen Call Modal (Real WebRTC P2P Voice & Video) */}
      {callModal?.isOpen && (
        <ChatCallModal
          isOpen={callModal.isOpen}
          callType={callModal.type}
          userId={userId}
          contact={contact}
          isIncoming={callModal.isIncoming}
          autoAccept={callModal.autoAccept}
          pendingOffer={callModal.pendingOffer || null}
          channel={channelRef.current}
          onEndCall={handleEndCall}
        />
      )}

      {/* WhatsApp-Style Fullscreen Image Lightbox Viewer */}
      <ChatImageViewer
        imageUrl={activeImage?.url || null}
        senderName={activeImage?.sender}
        timestamp={activeImage?.time}
        onClose={() => setActiveImage(null)}
      />
    </div>
  );
}

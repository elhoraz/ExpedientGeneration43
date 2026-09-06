"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
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
import { usePersonalChat } from "@/hooks/usePersonalChat";
import { useAgoraVideoCall } from "@/hooks/useAgoraVideoCall";
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
  const { showAlert, showConfirm } = useConfirm();
  const supabase = createClient();

  // Custom hook for messaging, pagination, storage uploads, and realtime
  const {
    messages,
    hasMore,
    isLoadingMore,
    uploadingImage,
    channel,
    handleLoadMore,
    sendMessage,
    deleteMessage,
    uploadImage,
    sendVoiceNote,
    sendVideoNote,
  } = usePersonalChat({
    userId,
    contactId: contact.id,
    initialMessages,
    showAlert,
  });

  // Custom hook for video & audio calling lifecycle and signaling
  const {
    callModal,
    startCall,
    endCall,
  } = useAgoraVideoCall({
    userId,
    contactId: contact.id,
    channel,
  });

  const [inputMessage, setInputMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [activeImage, setActiveImage] = useState<{ url: string; sender: string; time: string } | null>(null);
  
  // WhatsApp-like Call & Recording states
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showVideoNoteRecorder, setShowVideoNoteRecorder] = useState(false);

  // UGC Moderation States (Google Play Store compliance)
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("Spam atau Pelecehan");
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Check if contact is blocked on mount
  useEffect(() => {
    const checkBlock = async () => {
      const { data } = await supabase
        .from("user_blocks")
        .select("id")
        .eq("blocker_id", userId)
        .eq("blocked_user_id", contact.id)
        .maybeSingle();
      if (data) setIsBlocked(true);
    };
    checkBlock();
  }, [supabase, userId, contact.id]);

  // Handle page layout and auto-scroll
  useEffect(() => {
    document.body.classList.add("page-chat");
    return () => {
      document.body.classList.remove("page-chat");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Click outside to close options dropdown and emoji drawer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptionsDropdown(false);
      }
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleBlock = async () => {
    setShowOptionsDropdown(false);
    const action = isBlocked ? "unblock" : "block";
    const promptMsg = isBlocked 
      ? `Buka blokir kontak ${contact.nama_panggilan}? Anda akan kembali menerima pesan dari mereka.`
      : `Blokir kontak ${contact.nama_panggilan}? Pengguna ini tidak akan dapat mengirim pesan atau melakukan panggilan kepada Anda.`;

    const confirmed = await showConfirm(isBlocked ? "Buka Blokir" : "Blokir Kontak", promptMsg);
    if (!confirmed) return;

    try {
      const res = await fetch("/api/moderation/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: contact.id, action }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        showAlert("Gagal", data.error || "Gagal mengubah status blokir.");
        return;
      }
      setIsBlocked(!isBlocked);
      showAlert("Status Diperbarui", data.message);
    } catch {
      showAlert("Error", "Gagal menghubungi server.");
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReport(true);
    try {
      const res = await fetch("/api/moderation/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reported_user_id: contact.id,
          reason: reportReason,
          details: reportDetails,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        showAlert("Gagal", data.error || "Gagal mengirim laporan.");
        return;
      }
      setShowReportModal(false);
      setReportDetails("");
      showAlert("Laporan Terkirim", data.message);
    } catch {
      showAlert("Error", "Gagal mengirim laporan ke server.");
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;

    const messageText = inputMessage;
    setInputMessage("");
    setShowEmoji(false);
    await sendMessage({ content: messageText, messageType: "text" });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadImage(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendVoiceNote = async (audioBlob: Blob, duration: number) => {
    setIsRecordingVoice(false);
    await sendVoiceNote(audioBlob, duration);
  };

  const handleSendVideoNote = async (videoBlob: Blob, _duration: number) => {
    setShowVideoNoteRecorder(false);
    await sendVideoNote(videoBlob);
  };

  const handleStartCall = (type: "voice" | "video") => {
    startCall(type);
  };

  const handleEndCall = async (duration = 0) => {
    await endCall(duration);
  };

  const handleDeleteMessage = async (msgId: string) => {
    const confirmed = await showConfirm("Hapus Pesan", "Hapus pesan ini?");
    if (confirmed) {
      await deleteMessage(msgId);
    }
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

          {/* UGC Moderation Options (Report & Block) */}
          <div style={{ position: "relative" }} ref={optionsRef}>
            <button
              type="button"
              onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "0.95rem",
                transition: "0.2s",
              }}
              title="Opsi Kontak"
            >
              <i className="fa-solid fa-ellipsis-vertical"></i>
            </button>

            {showOptionsDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "8px",
                  background: "rgba(18, 24, 20, 0.98)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(212, 175, 55, 0.3)",
                  borderRadius: "10px",
                  padding: "6px",
                  minWidth: "180px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                  zIndex: 100,
                }}
              >
                <button
                  type="button"
                  onClick={() => { setShowOptionsDropdown(false); setShowReportModal(true); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "8px 12px",
                    background: "none",
                    border: "none",
                    color: "#f59e0b",
                    fontSize: "0.85rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <i className="fa-solid fa-flag" /> Laporkan Pengguna
                </button>
                <button
                  type="button"
                  onClick={handleToggleBlock}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "8px 12px",
                    background: "none",
                    border: "none",
                    color: isBlocked ? "#10b981" : "#ef4444",
                    fontSize: "0.85rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <i className={isBlocked ? "fa-solid fa-user-check" : "fa-solid fa-user-slash"} />
                  {isBlocked ? "Buka Blokir Kontak" : "Blokir Kontak"}
                </button>
              </div>
            )}
          </div>
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

            {/* Input Teks or Blocked Notice */}
            {isBlocked ? (
              <div style={{ flex: 1, padding: "12px", textAlign: "center", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "12px" }}>
                <span style={{ color: "#ef4444", fontSize: "0.85rem", fontWeight: 500, marginRight: "12px" }}>
                  <i className="fa-solid fa-ban" style={{ marginRight: "6px" }} /> Anda memblokir kontak ini.
                </span>
                <button
                  type="button"
                  onClick={handleToggleBlock}
                  style={{
                    background: "rgba(239, 68, 68, 0.2)",
                    color: "#fca5a5",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    borderRadius: "6px",
                    padding: "4px 10px",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                  }}
                >
                  Buka Blokir
                </button>
              </div>
            ) : (
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
            )}
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
          channel={channel}
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

      {/* UGC User Report Modal Dialog */}
      {showReportModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={() => setShowReportModal(false)}
        >
          <div
            style={{
              maxWidth: "480px",
              width: "100%",
              background: "#121814",
              border: "1px solid rgba(212, 175, 55, 0.3)",
              borderRadius: "16px",
              padding: "1.75rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, color: "#f3ba2f", fontSize: "1.15rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fa-solid fa-flag" style={{ color: "#f59e0b" }} /> Laporkan {contact.nama_panggilan}
              </h3>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "1.2rem" }}
              >
                &times;
              </button>
            </div>

            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "1.25rem", lineHeight: 1.5 }}>
              Laporan Anda akan ditinjau secara rahasia oleh tim moderator sesuai Pedoman Komunitas Expedient 43.
            </p>

            <form onSubmit={handleSubmitReport}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", color: "#e2e8f0", fontSize: "0.85rem", marginBottom: "0.5rem", fontWeight: 500 }}>
                  Alasan Pelaporan:
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                >
                  <option value="Spam atau Penipuan" style={{ background: "#121814" }}>Spam atau Penipuan</option>
                  <option value="Pelecehan atau Ujaran Kebencian" style={{ background: "#121814" }}>Pelecehan atau Ujaran Kebencian</option>
                  <option value="Konten Tidak Pantas / Asusila" style={{ background: "#121814" }}>Konten Tidak Pantas / Asusila</option>
                  <option value="Peniruan Identitas (Impersonation)" style={{ background: "#121814" }}>Peniruan Identitas (Impersonation)</option>
                  <option value="Lainnya" style={{ background: "#121814" }}>Lainnya</option>
                </select>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", color: "#e2e8f0", fontSize: "0.85rem", marginBottom: "0.5rem", fontWeight: 500 }}>
                  Keterangan Tambahan (Opsional):
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Jelaskan detail pelanggaran yang terjadi..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "0.85rem",
                    resize: "none",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  style={{
                    padding: "0.6rem 1.2rem",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "8px",
                    color: "#e2e8f0",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  style={{
                    padding: "0.6rem 1.2rem",
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#030504",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  {submittingReport ? "Mengirim..." : "Kirim Laporan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

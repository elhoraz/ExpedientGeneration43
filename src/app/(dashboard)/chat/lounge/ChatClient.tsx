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
import "../chat.css";

const EMOJI_DATA = {
  'Wajah': ['😀','😂','🤣','😍','😎','🥰','😢','😭','🤔','😱','🥺','😤','🤝','🙏','💪','👍','👎','❤️','🔥','✨','💯','🎉','🎊'],
  'Islami': ['☪️','🕌','📿','🤲','🌙','⭐','🕋','📖','🌹','🫶'],
  'Aktivitas': ['🎓','📚','⚽','🏀','🎯','🏆','💼','🎵','🎤','📸'],
  'Lainnya': ['👀','💬','📌','🚀','💎','🌍','☕','🍕','👑','⚡','🌈','💡']
};

export default function ChatClient({ initialMessages, userId }: { initialMessages: any[]; userId: string }) {
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [hasMore, setHasMore] = useState(initialMessages.length === 50);
  const [offset, setOffset] = useState(initialMessages.length);
  const [activeImage, setActiveImage] = useState<{ url: string; sender: string; time: string } | null>(null);
  
  // Voice & Video note recording states
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showVideoNoteRecorder, setShowVideoNoteRecorder] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const { showAlert, showConfirm } = useConfirm();

  useEffect(() => {
    document.body.classList.add("page-chat");
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    const channel = supabase
      .channel("public:chat_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: "is_lounge=eq.true",
        },
        async (payload) => {
          const { data: senderData } = await supabase
            .from("profiles")
            .select("nama_lengkap, nama_panggilan, foto_profil")
            .eq("id", payload.new.sender_id)
            .single();

          const newMessage: any = {
            ...payload.new,
            profiles: senderData,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: "is_deleted=eq.true",
        },
        (payload) => {
          setMessages((prev) => prev.map((m) => m.id === payload.new.id ? { ...m, is_deleted: true } : m));
        }
      )
      .subscribe();

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
  }, [supabase]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    const { data: olderMessages, error } = await supabase
      .from("chat_messages")
      .select("*, profiles!chat_messages_sender_id_fkey(nama_lengkap, nama_panggilan, foto_profil)")
      .eq("is_lounge", true)
      .eq("is_deleted", false)
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
    setInputMessage("");
    setShowEmoji(false);

    const { error } = await supabase.from("chat_messages").insert([
      {
        sender_id: userId,
        message: messageText || null,
        image_url: media?.imageUrl || null,
        audio_url: media?.audioUrl || null,
        video_url: media?.videoUrl || null,
        message_type: media?.messageType || "text",
        is_lounge: true,
      },
    ]);

    if (error) console.error("Failed to send lounge message:", error);
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
      const fileName = `lounge/${userId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(fileName);

      await handleSendMessage(undefined, { imageUrl: publicUrl, messageType: "image" });
    } catch (error) {
      await showAlert("Gagal", "Gagal mengunggah gambar.");
      console.error(error);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Lounge Voice Note Send Handler
  const handleSendVoiceNote = async (audioBlob: Blob, duration: number) => {
    setIsRecordingVoice(false);
    try {
      const mimeType = audioBlob.type || "audio/webm";
      const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
      const fileName = `lounge_voice/${userId}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(fileName, audioBlob, { contentType: mimeType });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(fileName);

      const urlWithDuration = `${publicUrl}?d=${duration}`;
      await handleSendMessage(undefined, { audioUrl: urlWithDuration, messageType: "voice" });
    } catch (err) {
      console.error("Gagal mengirim Voice Note Lounge:", err);
      showAlert("Gagal", "Gagal mengirim pesan suara.");
    }
  };

  // Lounge Video Note Send Handler
  const handleSendVideoNote = async (videoBlob: Blob, duration: number) => {
    setShowVideoNoteRecorder(false);
    try {
      const fileName = `lounge_video/${userId}_${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(fileName, videoBlob, { contentType: "video/webm" });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(fileName);

      await handleSendMessage(undefined, { videoUrl: publicUrl, messageType: "video_note" });
    } catch (err) {
      console.error("Gagal mengirim Video Note Lounge:", err);
      showAlert("Gagal", "Gagal mengirim video pesan.");
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    const confirmed = await showConfirm("Hapus Pesan", "Hapus pesan ini?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("chat_messages")
      .update({ is_deleted: true })
      .eq("id", msgId)
      .eq("sender_id", userId);

    if (error) console.error("Failed to delete message:", error);
  };

  const addEmoji = (emoji: string) => {
    setInputMessage(prev => prev + emoji);
  };

  return (
    <div className="chat-room-container" style={{ padding: "clamp(70px, 10vh, 95px) 12px 18px", maxWidth: "900px" }}>
      <div className="lounge-header-container">
        <h2 className="lounge-title">
          The Lounge
        </h2>
        <div className="lounge-subtitle">
          RUANG DISKUSI ANGKATAN
        </div>
        <Link href="/direktori" style={{ position: "absolute", right: "5px", top: "5px", color: "var(--text-secondary)", textDecoration: "none", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} title="Tutup">
          <i className="fa-solid fa-times"></i>
        </Link>
      </div>

      <div style={{
        flex: 1,
        background: "var(--glass-bg)",
        backdropFilter: "blur(20px)",
        border: "1px solid var(--glass-border)",
        borderRadius: "18px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
      }}>
        <div className="chat-messages-area">
          {hasMore && (
            <div style={{ textAlign: "center", marginBottom: "10px" }}>
              <button 
                onClick={handleLoadMore} 
                disabled={isLoadingMore}
                style={{
                  background: "rgba(212,175,55,0.1)",
                  border: "1px solid rgba(212,175,55,0.4)",
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
          {messages.map((msg) => {
            if (msg.is_deleted) return null;
            const isMine = msg.sender_id === userId;
            const senderName = msg.profiles?.nama_panggilan || msg.profiles?.nama_lengkap || "Unknown";
            const avatarUrl = msg.profiles?.foto_profil 
              ? `/uploads/profiles/${msg.profiles.foto_profil}` 
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=d4af37&color=000`;
            const timeString = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={msg.id} className={`msg-bubble-wrapper ${isMine ? 'mine' : 'other'}`}>
                {!isMine && (
                  <img src={avatarUrl} alt="Avatar" className="msg-avatar" />
                )}
                <div className="msg-bubble-content">
                  {!isMine && (
                    <span className="msg-sender-name">
                      {senderName}
                    </span>
                  )}

                  {/* 1. Image */}
                  {msg.image_url && (
                    <div 
                      className="msg-image-container"
                      onClick={() => setActiveImage({
                        url: msg.image_url,
                        sender: isMine ? "Anda" : senderName,
                        time: timeString
                      })}
                      title="Klik untuk memperbesar & mengunduh"
                    >
                      <img src={msg.image_url} className="msg-image" alt="Gambar" />
                      <div className="msg-image-overlay-hint">
                        <i className="fa-solid fa-expand"></i> Buka
                      </div>
                    </div>
                  )}

                  {/* 2. Voice Note */}
                  {msg.audio_url && (
                    <VoiceNotePlayer audioUrl={msg.audio_url} isMine={isMine} />
                  )}

                  {/* 3. Video Note */}
                  {msg.video_url && (
                    <VideoNotePlayer videoUrl={msg.video_url} isMine={isMine} />
                  )}

                  {/* 4. Teks Pesan */}
                  {msg.message && <div>{msg.message}</div>}

                  <div className="msg-meta-row">
                    {isMine && (
                      <button 
                        className="btn-delete-msg"
                        onClick={() => handleDeleteMessage(msg.id)}
                        title="Hapus"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    )}
                    <span className="msg-time">{timeString}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {messages.length === 0 && (
            <div className="inbox-empty-state" style={{ margin: "auto" }}>
              Belum ada diskusi. Jadilah yang pertama.
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
              <div className="chat-input-actions" ref={emojiRef}>
                <button type="button" className="btn-chat-tool" onClick={() => setShowEmoji(!showEmoji)} title="Emoji">
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
                  className="btn-chat-tool" 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={uploadingImage}
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

              <form onSubmit={handleSendMessage} className="chat-form">
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Tulis pesan ke Lounge..." 
                  className="chat-text-input"
                  maxLength={1000}
                />
                {inputMessage.trim() ? (
                  <button type="submit" className="btn-chat-send" title="Kirim">
                    <i className="fa-solid fa-paper-plane"></i>
                  </button>
                ) : (
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
      </div>

      {/* Video Note Recorder Modal */}
      {showVideoNoteRecorder && (
        <VideoNoteRecorder
          onCancel={() => setShowVideoNoteRecorder(false)}
          onSend={handleSendVideoNote}
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

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AdminLockBtn from "../../AdminLockBtn";
import "../admin.css";
import "./inbox.css";
import { Conversation } from "@/lib/whatsapp-inbox";

export default function InboxClient({
  initialConversations = [],
}: {
  initialConversations?: Conversation[];
}) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activePhone, setActivePhone] = useState<string | null>(
    initialConversations.length > 0 ? initialConversations[0].phoneNumber : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal Kirim Pesan Baru
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState("");
  const [newChatMessage, setNewChatMessage] = useState("");
  const [sendingNewChat, setSendingNewChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.body.classList.add("page-admin");

    // Auto-poll setiap 10 detik untuk sinkronisasi pesan baru secara berkala
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 10000);

    return () => {
      document.body.classList.remove("page-admin");
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (activePhone) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activePhone, conversations]);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchMessages = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp/messages");
      if (res.ok) {
        const data = await res.json();
        const convs: Conversation[] = data.conversations || [];
        setConversations(convs);

        if (!activePhone && convs.length > 0) {
          setActivePhone(convs[0].phoneNumber);
        }
      }
    } catch (err) {
      console.error("Gagal menyinkronkan pesan:", err);
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  };

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activePhone || !replyText.trim() || sending) return;

    setSending(true);
    const textToSend = replyText.trim();

    try {
      const res = await fetch("/api/admin/whatsapp/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: activePhone,
          message: textToSend,
        }),
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        setReplyText("");
        showToast("success", "Pesan balasan berhasil terkirim via Meta Cloud API!");

        // Optimistic UI Update
        setConversations((prev) =>
          prev.map((c) => {
            if (c.phoneNumber === activePhone) {
              return {
                ...c,
                lastMessage: textToSend,
                lastTimestamp: new Date().toISOString(),
                messages: [
                  ...c.messages,
                  {
                    id: Date.now(),
                    direction: "outgoing",
                    message: textToSend,
                    status: "sent",
                    timestamp: new Date().toISOString(),
                  },
                ],
              };
            }
            return c;
          })
        );
      } else {
        showToast("error", data.error || "Gagal mengirim balasan.");
      }
    } catch (err: any) {
      showToast("error", err.message || "Koneksi terputus.");
    } finally {
      setSending(false);
    }
  };

  const handleStartNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatPhone.trim() || !newChatMessage.trim() || sendingNewChat) return;

    setSendingNewChat(true);
    const cleanNum = newChatPhone.replace(/\D/g, "");
    let target = cleanNum;
    if (target.startsWith("0")) target = "62" + target.substring(1);
    else if (!target.startsWith("62")) target = "62" + target;

    try {
      const res = await fetch("/api/admin/whatsapp/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: target,
          message: newChatMessage.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        showToast("success", `Pesan berhasil dikirim ke +${target}!`);
        setIsNewChatModalOpen(false);
        setNewChatPhone("");
        setNewChatMessage("");
        await fetchMessages(false);
        setActivePhone(target);
      } else {
        showToast("error", data.error || "Gagal mengirim pesan.");
      }
    } catch (err: any) {
      showToast("error", err.message || "Gagal menghubungi server.");
    } finally {
      setSendingNewChat(false);
    }
  };

  const activeConversation = conversations.find((c) => c.phoneNumber === activePhone);

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.displayName.toLowerCase().includes(q) ||
      c.phoneNumber.includes(q) ||
      c.lastMessage.toLowerCase().includes(q)
    );
  });

  const quickReplies = [
    "Halo, ada yang bisa kami bantu seputar portal alumni?",
    "Akun Anda telah kami verifikasi dan sudah aktif.",
    "Silakan coba login kembali menggunakan email dan password Anda.",
    "Terima kasih atas konfirmasinya!",
  ];

  return (
    <div className="admin-wrapper" style={{ maxWidth: "1400px" }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            background: toastMessage.type === "success" ? "rgba(0, 255, 136, 0.95)" : "rgba(239, 68, 68, 0.95)",
            color: "#030504",
            fontWeight: 700,
            padding: "14px 20px",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.9rem",
          }}
        >
          <i className={toastMessage.type === "success" ? "fa-solid fa-circle-check" : "fa-solid fa-circle-exclamation"}></i>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Modal Mulai Obrolan / Kirim Pesan Baru */}
      {isNewChatModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(10px)",
            zIndex: 9998,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#0a130e",
              border: "1px solid rgba(212,175,55,0.4)",
              borderRadius: "18px",
              padding: "30px",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#ffd700", margin: 0, fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fa-brands fa-whatsapp"></i> Mulai Obrolan Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleStartNewChat}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", color: "#d4af37", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
                  Nomor WhatsApp Tujuan:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 08123456789 atau 628123456789"
                  value={newChatPhone}
                  onChange={(e) => setNewChatPhone(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", padding: "12px 16px", color: "#fff", outline: "none", boxSizing: "border-box" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", color: "#d4af37", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
                  Isi Pesan WhatsApp:
                </label>
                <textarea
                  rows={4}
                  placeholder="Ketikkan pesan resmi yang ingin dikirimkan..."
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", padding: "12px 16px", color: "#fff", outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "sans-serif" }}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setIsNewChatModalOpen(false)}
                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)", padding: "10px 18px", borderRadius: "10px", cursor: "pointer", fontSize: "0.85rem" }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sendingNewChat}
                  style={{ background: "linear-gradient(135deg, #00ff88, #059669)", border: "none", color: "#030504", fontWeight: 700, padding: "10px 22px", borderRadius: "10px", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {sendingNewChat ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Mengirim...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane"></i> Kirim via Meta API
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="admin-header">
        <div style={{ position: "absolute", top: 0, right: 0, zIndex: 10 }}>
          <AdminLockBtn />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.05))",
              border: "1px solid rgba(0,255,136,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#00ff88",
              fontSize: "1.5rem",
            }}
          >
            <i className="fa-brands fa-whatsapp"></i>
          </div>
          <div>
            <h1 className="admin-title" style={{ marginBottom: "0", fontSize: "1.6rem" }}>
              WhatsApp Inbox & Chat Bot
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: "4px 0 0 0", letterSpacing: "1px", textTransform: "uppercase" }}>
              Kotak Masuk & Manajemen Chat Asisten Resmi (Meta Cloud API)
            </p>
          </div>
        </div>

        <nav className="admin-nav" style={{ marginTop: "15px" }}>
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/users">Users</Link>
          <Link href="/admin/broadcast">Broadcast</Link>
          <Link href="/admin/inbox" className="active">
            WhatsApp Inbox
          </Link>
        </nav>
      </div>

      {/* Official Status Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(0, 255, 136, 0.08), rgba(212, 175, 55, 0.05))",
          border: "1px solid rgba(0, 255, 136, 0.25)",
          borderRadius: "14px",
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#00ff88",
              boxShadow: "0 0 10px #00ff88",
            }}
          ></div>
          <div style={{ fontSize: "0.85rem", color: "#fff" }}>
            <span style={{ fontWeight: 700, color: "#00ff88" }}>Bot Resmi Aktif:</span>{" "}
            <span style={{ fontFamily: "monospace", color: "#ffd700" }}>+62 851-5177-1289</span> · Expedient Generation 43
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            style={{
              background: "rgba(212,175,55,0.15)",
              border: "1px solid rgba(212,175,55,0.4)",
              color: "#ffd700",
              padding: "7px 14px",
              borderRadius: "8px",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <i className="fa-solid fa-paper-plane"></i> Kirim Pesan Baru
          </button>
          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginLeft: "8px" }}>
            Total Kontak: <b style={{ color: "#ffd700" }}>{conversations.length}</b>
          </div>
        </div>
      </div>

      {/* Main Inbox Container */}
      <div className={`inbox-container ${activePhone ? "has-active-chat" : ""}`}>
        {/* Left Sidebar */}
        <div className="inbox-sidebar">
          <div className="inbox-search-bar">
            <input
              type="text"
              placeholder="Cari nama atau nomor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="inbox-search-input"
            />
            <button onClick={() => fetchMessages(true)} title="Segarkan Pesan" className="inbox-refresh-btn">
              <i className="fa-solid fa-rotate-right"></i>
            </button>
          </div>

          <div className="inbox-contacts-list">
            {loading && conversations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "8px" }}></i> Memuat percakapan...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                <i className="fa-solid fa-comments" style={{ fontSize: "2rem", color: "rgba(255,255,255,0.1)", marginBottom: "10px", display: "block" }}></i>
                Belum ada percakapan. Kirim pesan ke nomor <b>085151771289</b> atau klik <b>"Kirim Pesan Baru"</b> di atas.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.phoneNumber === activePhone;
                const formattedTime = new Date(conv.lastTimestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={conv.phoneNumber}
                    onClick={() => setActivePhone(conv.phoneNumber)}
                    className={`inbox-contact-card ${isActive ? "active" : ""}`}
                  >
                    <div className="inbox-avatar">
                      {conv.avatarUrl ? (
                        <img src={conv.avatarUrl} alt={conv.displayName} />
                      ) : (
                        <span>{conv.displayName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="inbox-contact-info">
                      <div className="inbox-contact-top">
                        <span className="inbox-contact-name">{conv.displayName}</span>
                        <span className="inbox-contact-time">{formattedTime}</span>
                      </div>
                      <div className="inbox-contact-sub">
                        <span className="inbox-contact-msg">{conv.lastMessage}</span>
                        {conv.unreadCount > 0 && <span className="inbox-badge">{conv.unreadCount}</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Chat Area */}
        <div className="inbox-chat-area">
          {activeConversation ? (
            <>
              {/* Chat Header with Mobile Back Button */}
              <div className="inbox-chat-header">
                <div className="inbox-header-contact">
                  <button
                    type="button"
                    onClick={() => setActivePhone(null)}
                    className="inbox-mobile-back-btn"
                    title="Kembali ke Daftar Kontak"
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                  </button>
                  <div className="inbox-avatar">
                    {activeConversation.avatarUrl ? (
                      <img src={activeConversation.avatarUrl} alt={activeConversation.displayName} />
                    ) : (
                      <span>{activeConversation.displayName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <div className="inbox-header-name">{activeConversation.displayName}</div>
                    <div className="inbox-header-meta">
                      <span>+{activeConversation.phoneNumber}</span>
                      <span className="inbox-header-badge">{activeConversation.userRole}</span>
                    </div>
                  </div>
                </div>

                <div className="inbox-header-actions">
                  <a
                    href={`https://wa.me/${activeConversation.phoneNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inbox-action-btn"
                    title="Buka Obrolan WhatsApp Langsung"
                  >
                    <i className="fa-brands fa-whatsapp"></i> WhatsApp Web
                  </a>
                </div>
              </div>

              {/* Message Stream */}
              <div className="inbox-messages-stream">
                {activeConversation.messages.map((m, idx) => {
                  const isIncoming = m.direction === "incoming";
                  const time = new Date(m.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div key={m.id || idx} className={`inbox-bubble-wrap ${isIncoming ? "incoming" : "outgoing"}`}>
                      <div className="inbox-bubble">{m.message}</div>
                      <div className="inbox-bubble-meta">
                        <span>{time}</span>
                        {!isIncoming && (
                          <i className="fa-solid fa-check-double" style={{ color: "#00ff88", fontSize: "0.7rem" }}></i>
                        )}
                        {isIncoming && m.senderNote && (
                          <span style={{ fontSize: "0.65rem", opacity: 0.8 }}>· {m.senderNote}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Chips */}
              <div className="inbox-quick-replies">
                {quickReplies.map((chip, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setReplyText(chip)}
                    className="inbox-quick-chip"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendReply} className="inbox-input-area">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  placeholder={`Ketik balasan untuk ${activeConversation.displayName} (Tekan Enter untuk kirim)...`}
                  className="inbox-textarea"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sending}
                  className="inbox-send-btn"
                >
                  {sending ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Mengirim...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane"></i> Kirim
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="inbox-empty-state">
              <i className="fa-solid fa-comments inbox-empty-icon"></i>
              <h3 style={{ color: "#fff", marginBottom: "8px" }}>Pilih Percakapan</h3>
              <p style={{ maxWidth: "380px", fontSize: "0.85rem", lineHeight: 1.6 }}>
                Pilih kontak di sebelah kiri untuk melihat riwayat pesan WhatsApp atau klik <b>"Kirim Pesan Baru"</b> di atas untuk memulai obrolan resmi via Meta API.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

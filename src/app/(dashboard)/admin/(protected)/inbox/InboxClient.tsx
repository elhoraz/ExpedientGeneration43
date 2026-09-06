"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AdminLockBtn from "../../AdminLockBtn";
import "../admin.css";
import "./inbox.css";

type MessageItem = {
  id: number;
  direction: "incoming" | "outgoing";
  message: string;
  status: string;
  timestamp: string;
  senderNote?: string;
};

type Conversation = {
  phoneNumber: string;
  displayName: string;
  userRole: string;
  avatarUrl?: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  messages: MessageItem[];
};

export default function InboxClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePhone, setActivePhone] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.body.classList.add("page-admin");
    fetchMessages();

    // Auto-poll every 12 seconds for incoming messages
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 12000);

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

        // Auto select first conversation if none selected
        if (!activePhone && convs.length > 0) {
          setActivePhone(convs[0].phoneNumber);
        }
      }
    } catch (err) {
      console.error("Gagal memuat pesan:", err);
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

        // Optimistic update
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
              WhatsApp Inbox
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: "4px 0 0 0", letterSpacing: "1px", textTransform: "uppercase" }}>
              Kotak Masuk & Manajemen Chat Langsung Resmi (Meta Cloud API)
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
          padding: "12px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
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
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
          <span>
            🛡️ <b style={{ color: "#00ff88" }}>100% Anti-Banned</b> (Meta Cloud API)
          </span>
          <span>
            Total Percakapan: <b style={{ color: "#ffd700" }}>{conversations.length}</b>
          </span>
        </div>
      </div>

      {/* Main Inbox Container */}
      <div className="inbox-container">
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
                Belum ada pesan masuk. Kirim chat ke nomor <b>085151771289</b> untuk melihat pesan tampil di sini!
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
              {/* Chat Header */}
              <div className="inbox-chat-header">
                <div className="inbox-header-contact">
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
                    title="Buka WhatsApp Web Langsung"
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
                Pilih kontak di sebelah kiri untuk melihat riwayat pesan WhatsApp masuk dan mengetik balasan langsung dari Command Center.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

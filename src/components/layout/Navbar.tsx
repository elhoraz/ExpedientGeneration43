"use client";

import { useState, useEffect, useRef } from "react";
import ThemeToggle from "./ThemeToggle";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useDialogEscape } from "@/hooks/useDialogEscape";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import NotificationBell from "./NotificationBell";
import "./navbar-chat.css";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function Navbar() {
  const { t, locale } = useLanguage();
  const { userId, supabase } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useDialogEscape(chatOpen, () => setChatOpen(false));
  
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [inputChat, setInputChat] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [hasNewNotif, setHasNewNotif] = useState(false);

  const chatOpenRef = useRef(chatOpen);
  const senderCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    chatOpenRef.current = chatOpen;
  }, [chatOpen]);

  useEffect(() => {
    if (!userId) {
      setRecentChats([]);
      return;
    }

    // 1. Service Worker & Push Notification Subscription (Hanya subscribe otomatis jika izin sudah diberikan pengguna)
    if ('serviceWorker' in navigator && 'PushManager' in window && VAPID_PUBLIC_KEY) {
      if (typeof window !== "undefined" && 'Notification' in window && Notification.permission === 'granted') {
        navigator.serviceWorker.register('/sw.js').then(async () => {
          try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            // Send subscription to server
            await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(subscription),
            });
          } catch (error) {
            console.error('Push subscription sync failed:', error);
          }
        });
      }
    }
    // Fetch recent lounge chats
    const fetchChats = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("id, sender_id, message, created_at, profiles!sender_id(nama_panggilan)")
        .eq("is_lounge", true)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(5);
      if (data) {
        data.forEach((row: any) => {
          const nick = row.profiles?.nama_panggilan;
          if (row.sender_id && nick) {
            senderCacheRef.current.set(row.sender_id, nick);
          }
        });
        setRecentChats(data.reverse());
      }
    };
    fetchChats();

    // Subscribe to chat_messages (uses refs so toggling chatOpen never tears down channel or SW registration)
    const channel = supabase
      .channel("public:navbar_events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: "is_lounge=eq.true" },
        async (payload) => {
          const senderId = payload.new?.sender_id;
          let senderName = senderId ? senderCacheRef.current.get(senderId) : undefined;

          if (!senderName && senderId) {
            const { data: sender } = await supabase
              .from("profiles")
              .select("nama_panggilan")
              .eq("id", senderId)
              .single();
            if (sender?.nama_panggilan) {
              senderName = sender.nama_panggilan;
              senderCacheRef.current.set(senderId, sender.nama_panggilan);
            }
          }

          const newMsg: any = {
            ...payload.new,
            profiles: senderName ? { nama_panggilan: senderName } : null,
          };
          setRecentChats((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg].slice(-5); // keep only last 5
          });

          const onLoungePage =
            typeof window !== "undefined" && window.location.pathname === "/chat/lounge";
          if (!chatOpenRef.current && !onLoungePage) {
            setHasNewNotif(true);
            if (navigator.vibrate) navigator.vibrate(30);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  // Close open dropdowns when sidebar panel is collapsed/hidden
  useEffect(() => {
    const handleSidebarToggle = (e: any) => {
      if (e.detail && !e.detail.isOpen) {
        setChatOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener("expedient-sidebar-toggle", handleSidebarToggle);
    return () => window.removeEventListener("expedient-sidebar-toggle", handleSidebarToggle);
  }, []);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputChat.trim();
    if (!trimmed || !userId || isSendingChat) return;

    setIsSendingChat(true);
    try {
      const { error } = await supabase.from("chat_messages").insert([{
        sender_id: userId,
        message: trimmed,
        is_lounge: true
      }]);

      if (!error) {
        setInputChat("");
      }
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <>
      <div className="top-utility-dock">
        {/* Command Palette / Quick Search Trigger */}
        <button
          type="button"
          className="search-widget hover-trigger"
          id="btnSearchWidget"
          title={`${t.navbar.search_palette} (Ctrl+K)`}
          aria-label={t.navbar.search_palette}
          onClick={() => {
            if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(12);
            window.dispatchEvent(new CustomEvent("expedient-open-command-palette"));
          }}
        >
          <div className="icon-orb">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          </div>
        </button>

        {/* Obrolan Angkatan - Hanya untuk anggota terautentikasi */}
        {userId && (
          <button
            type="button"
            className="chat-widget hover-trigger"
            id="btnChatWidget"
            title={t.navbar.chat_title}
            aria-label={t.navbar.chat_title}
            aria-expanded={chatOpen}
            aria-controls="chatDropdownPanel"
            onClick={() => {
              setChatOpen(!chatOpen);
              setNotifOpen(false);
              setHasNewNotif(false);
            }}
          >
            <div className="icon-orb">
              <i className="fa-solid fa-comment-dots" aria-hidden="true"></i>
            </div>
            {hasNewNotif && (
              <span
                id="chatBadge"
                className="chat-badge"
                aria-hidden="true"
                style={{
                  display: "block", position: "absolute", top: "4px", insetInlineEnd: "4px",
                  width: "10px", height: "10px", background: "var(--ruby-gem, #dc2626)", borderRadius: "50%",
                  border: "2px solid var(--bg-card)"
                }}
              ></span>
            )}
          </button>
        )}

        {/* Notification Bell Widget */}
        {userId && <NotificationBell userId={userId} />}

        {/* Theme Toggle Widget */}
        <ThemeToggle />
      </div>

      {userId && chatOpen && (
        <div
          id="chatDropdownPanel"
          className="chat-dropdown"
          role="dialog"
          aria-label={t.navbar.chat_title}
        >
          <div className="chat-dropdown-header">
            <div className="chat-dropdown-title">
              {t.navbar.chat_title}
            </div>
            <div className="chat-dropdown-actions">
              <Link
                href="/chat/lounge"
                onClick={() => setChatOpen(false)}
                title={t.navbar.chat_open_full}
                aria-label={t.navbar.chat_open_full}
                className="chat-dropdown-btn-action"
              >
                <i className="fa-solid fa-expand" aria-hidden="true"></i>
              </Link>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="chat-dropdown-btn-action"
                title={t.navbar.chat_close}
                aria-label={t.navbar.chat_close}
              >
                <i className="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>
            </div>
          </div>
          <div className="chat-dropdown-body">
            {recentChats.length === 0 ? (
              <div className="chat-dropdown-empty">{t.navbar.no_notif}</div>
            ) : (
              recentChats.map((c) => (
                <div key={c.id} className="chat-dropdown-item">
                  <strong className="chat-dropdown-sender">{c.profiles?.nama_panggilan || (locale === "ar" ? "عضو" : locale === "en" ? "Member" : "Anggota")}: </strong>
                  <span className="chat-dropdown-text">{c.message}</span>
                </div>
              ))
            )}
          </div>
          <div className="chat-dropdown-footer">
            <form className="chat-dropdown-form" onSubmit={handleSendChat}>
              <input
                type="text"
                value={inputChat}
                onChange={(e) => setInputChat(e.target.value)}
                placeholder={t.navbar.chat_input_placeholder}
                aria-label={t.navbar.chat_input_placeholder}
                className="chat-dropdown-input"
                required
              />
              <button
                type="submit"
                disabled={isSendingChat || !inputChat.trim()}
                className="chat-dropdown-send-btn"
                title={t.navbar.chat_send}
                aria-label={t.navbar.chat_send}
              >
                <i className={`fa-solid ${isSendingChat ? "fa-spinner fa-spin" : "fa-paper-plane"}`} aria-hidden="true"></i>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

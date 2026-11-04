"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import ThemeToggle from "./ThemeToggle";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "./NotificationBell";
import GlobalCallReceiver from "@/components/chat/GlobalCallReceiver";
import LanguageSwitcher from "./LanguageSwitcher";
import "@/app/(dashboard)/chat/chat.css";

function getPageTitle(pathname: string | null): string {
  if (!pathname) return "Portal Alumni";
  if (pathname === "/beranda") return "Museum Digital";
  if (pathname.startsWith("/direktori")) return "Direktori Santri";
  if (pathname.startsWith("/galeri")) return "Galeri Kenangan";
  if (pathname.startsWith("/quran")) return "Al-Qur'an & Doa";
  if (pathname.startsWith("/tarbiyah")) return "Tarbiyah & Nilai";
  if (pathname.startsWith("/mahfuzhat")) return "Mahfuzhat & Hikmah";
  if (pathname.startsWith("/sirah")) return "Sirah Nabawiyah";
  if (pathname.startsWith("/radar")) return "Radar Persebaran";
  if (pathname.startsWith("/syndicate")) return "Syndicate Bisnis";
  if (pathname.startsWith("/fitur")) return "Semua Fitur";
  if (pathname.startsWith("/panduan")) return "Panduan Portal";
  if (pathname.startsWith("/profil")) return "Profil Santri";
  if (pathname.startsWith("/admin")) return "Konsol Admin";
  if (pathname.startsWith("/chat")) return "Obrolan Angkatan";
  if (pathname.startsWith("/khatam")) return "Khatam Bersama";
  if (pathname.startsWith("/tasbih")) return "Tasbih Digital";
  if (pathname.startsWith("/kiblat")) return "Arah Kiblat";
  if (pathname.startsWith("/baitul-maal")) return "Baitul Maal";
  return "Expedient Generation 43";
}

export default function Navbar() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [chatOpen, setChatOpen] = useState(false);
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [inputChat, setInputChat] = useState("");
  const [hasNewNotif, setHasNewNotif] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const chatDropdownRef = useRef<HTMLDivElement | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window && VAPID_PUBLIC_KEY) {
      if (typeof window !== "undefined" && 'Notification' in window && Notification.permission === 'granted') {
        navigator.serviceWorker.register('/sw.js').then(async () => {
          try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
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

    const fetchChatsAndUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      const { data } = await supabase
        .from("chat_messages")
        .select("id, message, created_at, profiles!sender_id(nama_panggilan)")
        .eq("is_lounge", true)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(5);
      if (data) setRecentChats(data.reverse());
    };
    fetchChatsAndUser();

    const channel = supabase
      .channel("public:navbar_events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: "is_lounge=eq.true" },
        async (payload) => {
          const { data: sender } = await supabase
            .from("profiles")
            .select("nama_panggilan")
            .eq("id", payload.new.sender_id)
            .single();

          const newMsg: any = { ...payload.new, profiles: sender };
          setRecentChats((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg].slice(-5);
          });

          if (!chatOpen) {
            setHasNewNotif(true);
            if (navigator.vibrate) navigator.vibrate(30);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, chatOpen]);

  // Click outside to close chat dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (chatDropdownRef.current && !chatDropdownRef.current.contains(e.target as Node)) {
        const btn = document.getElementById("btnChatWidget");
        if (btn && !btn.contains(e.target as Node)) {
          setChatOpen(false);
        }
      }
    };
    if (chatOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [chatOpen]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputChat.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("chat_messages").insert([{
      sender_id: user.id,
      message: inputChat,
      is_lounge: true
    }]);

    if (!error) {
      setInputChat("");
    }
  };

  const openSearch = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
    }
  };

  return (
    <header className="top-navbar" id="topNavbar">
      {/* Left: Breadcrumbs on Desktop, Brand on Mobile */}
      <div className="top-navbar-left">
        <Link href="/beranda" className="top-navbar-brand mobile-only">
          <img src="/icon-48.png" alt="Expedient 43" width={28} height={28} />
          <span>EXPEDIENT 43</span>
        </Link>
        <div className="top-breadcrumb desktop-only">
          <span className="breadcrumb-batch">Expedient 43</span>
          <span className="breadcrumb-divider">/</span>
          <span className="breadcrumb-current">{getPageTitle(pathname)}</span>
        </div>
      </div>

      {/* Center: Command Palette Search Bar */}
      <div className="top-navbar-center">
        <button
          type="button"
          className="topbar-search-trigger"
          onClick={openSearch}
          title="Cari alumni, fitur, khazanah... (Ctrl+K)"
          aria-label="Buka pencarian cepat"
        >
          <i className="fa-solid fa-magnifying-glass"></i>
          <span className="search-text">{t.navbar?.search_palette || "Cari alumni, fitur, khazanah..."}</span>
          <span className="search-kbd">Ctrl K</span>
        </button>
      </div>

      {/* Right: Actions (Chat, Notifications, Language, Theme) */}
      <div className="top-navbar-right">
        {userId && (
          <div className="top-action-wrap" style={{ position: "relative" }}>
            <button 
              type="button"
              className={`chat-widget ${chatOpen ? "active" : ""}`} 
              id="btnChatWidget"
              title={t.navbar?.chat_title || "Obrolan Angkatan"} 
              onClick={() => { 
                setChatOpen(!chatOpen); 
                setHasNewNotif(false); 
              }}
              aria-label={t.navbar?.chat_title || "Obrolan Angkatan"}
            >
              <div className="icon-orb">
                <i className="fa-solid fa-comment-dots"></i>
              </div>
              {hasNewNotif && (
                <span id="chatBadge" className="chat-badge" style={{
                  display: "block", position: "absolute", top: "2px", right: "2px",
                  width: "10px", height: "10px", background: "#f43f5e", borderRadius: "50%",
                  boxShadow: "0 0 8px rgba(244, 63, 94, 0.8)"
                }}></span>
              )}
            </button>

            {chatOpen && (
              <div className="chat-dropdown" ref={chatDropdownRef} style={{ top: "48px", right: "0" }}>
                <div className="chat-dropdown-header">
                  <div className="chat-dropdown-title">
                    {t.navbar?.chat_title || "Obrolan Angkatan"}
                  </div>
                  <div className="chat-dropdown-actions">
                    <Link
                      href="/chat/lounge"
                      onClick={() => setChatOpen(false)}
                      title={t.navbar?.chat_open_full || "Perbesar"}
                      className="chat-dropdown-btn-action"
                    >
                      <i className="fa-solid fa-expand"></i>
                    </Link>
                    <button 
                      type="button"
                      onClick={() => setChatOpen(false)}
                      className="chat-dropdown-btn-action"
                      title={t.navbar?.chat_close || "Tutup"}
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                </div>
                <div className="chat-dropdown-body">
                  {recentChats.length === 0 ? (
                    <div className="chat-dropdown-empty">{t.navbar?.no_notif || "Belum ada obrolan terbaru."}</div>
                  ) : (
                    recentChats.map((c) => (
                      <div key={c.id} className="chat-dropdown-item">
                        <strong className="chat-dropdown-sender">{c.profiles?.nama_panggilan || "Santri"}: </strong>
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
                      placeholder={t.navbar?.chat_input_placeholder || "Ketik pesan..."}
                      className="chat-dropdown-input"
                      required
                    />
                    <button
                      type="submit"
                      className="chat-dropdown-send-btn"
                      title={t.navbar?.chat_send || "Kirim"}
                    >
                      <i className="fa-solid fa-paper-plane"></i>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {userId && <NotificationBell userId={userId} />}

        <LanguageSwitcher variant="minimal" className="top-lang-switch" />

        <ThemeToggle />

        {userId && <GlobalCallReceiver userId={userId} />}
      </div>
    </header>
  );
}

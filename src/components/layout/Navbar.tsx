"use client";

import { useState, useEffect, useMemo } from "react";
import ThemeToggle from "./ThemeToggle";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "./NotificationBell";
import GlobalCallReceiver from "@/components/chat/GlobalCallReceiver";
import "@/app/(dashboard)/chat/chat.css";

export default function Navbar() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [inputChat, setInputChat] = useState("");
  const [hasNewNotif, setHasNewNotif] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

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

  useEffect(() => {
    // 1. Service Worker & Push Notification Subscription
    if ('serviceWorker' in navigator && 'PushManager' in window && VAPID_PUBLIC_KEY) {
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
          console.error('Push subscription failed:', error);
        }
      });
    }
    // Fetch recent lounge chats
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

    // Subscribe to chat_messages
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
            return [...prev, newMsg].slice(-5); // keep only last 5
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

  return (
    <>
      <>
        <a 
          href="#"
          className="chat-widget hover-trigger" 
          id="btnChatWidget"
          title="Executive Chat (Lounge)" 
          onClick={(e) => { 
            e.preventDefault(); 
            setChatOpen(!chatOpen); 
            setNotifOpen(false); 
            setHasNewNotif(false); 
          }}
        >
          <div className="icon-orb">
            <i className="fa-solid fa-comment-dots"></i>
          </div>
          {hasNewNotif && (
            <span id="chatBadge" className="chat-badge" style={{
              display: "block", position: "absolute", top: "2px", right: "2px",
              width: "12px", height: "12px", background: "#ff5555", borderRadius: "50%"
            }}></span>
          )}
        </a>

        {/* Theme Toggle Widget */}
        <ThemeToggle />
        
        {/* Notification Bell Widget */}
        {userId && <NotificationBell userId={userId} />}

        {/* Global Incoming Call Receiver Widget */}
        {userId && <GlobalCallReceiver userId={userId} />}
      </>

      {chatOpen && (
        <div className="chat-dropdown">
          <div className="chat-dropdown-header">
            <div className="chat-dropdown-title">
              The Lounge
            </div>
            <div className="chat-dropdown-actions">
              <Link
                href="/chat/lounge"
                onClick={() => setChatOpen(false)}
                title="Perbesar / Buka Full"
                className="chat-dropdown-btn-action"
              >
                <i className="fa-solid fa-expand"></i>
              </Link>
              <button 
                type="button"
                onClick={() => setChatOpen(false)}
                className="chat-dropdown-btn-action"
                title="Tutup"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
          <div className="chat-dropdown-body">
            {recentChats.length === 0 ? (
              <div className="chat-dropdown-empty">Belum ada obrolan terbaru.</div>
            ) : (
              recentChats.map((c) => (
                <div key={c.id} className="chat-dropdown-item">
                  <strong className="chat-dropdown-sender">{c.profiles?.nama_panggilan || "Unknown"}: </strong>
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
                placeholder="Kirim ke Lounge..."
                className="chat-dropdown-input"
                required
              />
              <button
                type="submit"
                className="chat-dropdown-send-btn"
                title="Kirim"
              >
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

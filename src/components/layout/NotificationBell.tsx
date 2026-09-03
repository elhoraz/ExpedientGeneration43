"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import "./notifications.css";

type Notification = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

type QuestItem = {
  id: string;
  icon: string;
  label: string;
  href: string;
  actionText: string;
  storageKey: string;
};

const INITIAL_QUESTS: QuestItem[] = [
  {
    id: "login",
    icon: "fa-solid fa-right-to-bracket",
    label: "Login ke portal alumni",
    href: "#",
    actionText: "Selesai ✓",
    storageKey: "expedient_quest_login",
  },
  {
    id: "profile",
    icon: "fa-solid fa-user-pen",
    label: "Lengkapi foto & data profil",
    href: "/profil",
    actionText: "Buka Profil →",
    storageKey: "expedient_quest_profile",
  },
  {
    id: "radar",
    icon: "fa-solid fa-map-location-dot",
    label: "Perbarui lokasi tinggal di radar",
    href: "/radar",
    actionText: "Buka Radar →",
    storageKey: "expedient_quest_radar",
  },
  {
    id: "directory",
    icon: "fa-solid fa-address-book",
    label: "Cari kawan lama di direktori",
    href: "/direktori",
    actionText: "Buka Direktori →",
    storageKey: "expedient_quest_directory",
  },
];

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"quest" | "notif">("quest");
  const [completedQuests, setCompletedQuests] = useState<Set<string>>(new Set(["login"]));
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Re-evaluate completed quests from storage and database
  const evaluateQuests = useCallback(async () => {
    const done = new Set<string>();
    done.add("login");
    if (typeof window !== "undefined") {
      localStorage.setItem("expedient_quest_login", "true");

      INITIAL_QUESTS.forEach((q) => {
        if (localStorage.getItem(q.storageKey) === "true") {
          done.add(q.id);
        }
      });
    }

    if (typeof window !== "undefined" && window.location.pathname.includes("direktori")) {
      done.add("directory");
      localStorage.setItem("expedient_quest_directory", "true");
    }

    // Fetch profile from Supabase to auto-verify if already done in DB
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("foto_profil, no_whatsapp, no_hp, lat, lng, motivasi_hidup")
        .eq("id", userId)
        .maybeSingle();

      if (profile) {
        // Radar quest is ONLY complete if user has actual non-null, non-zero GPS coordinates
        const hasGps = profile.lat !== null && profile.lng !== null && Number(profile.lat) !== 0 && Number(profile.lng) !== 0;
        if (hasGps) {
          done.add("radar");
          if (typeof window !== "undefined") {
            localStorage.setItem("expedient_quest_radar", "true");
          }
        }
        // Profile quest is complete if user has a custom uploaded photo or updated WhatsApp/bio
        const hasCustomPhoto = profile.foto_profil && !profile.foto_profil.includes("ui-avatars.com");
        const hasPhone = profile.no_whatsapp || profile.no_hp;
        if (hasCustomPhoto || (hasPhone && profile.motivasi_hidup)) {
          done.add("profile");
          if (typeof window !== "undefined") {
            localStorage.setItem("expedient_quest_profile", "true");
          }
        }
      }
    } catch {
      // ignore fetch error
    }

    setCompletedQuests(new Set(done));
  }, [supabase, userId]);

  useEffect(() => {
    evaluateQuests();

    const playNotificationChime = () => {
      try {
        if (typeof window === "undefined") return;
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(587.33, now); // D5
        gain1.gain.setValueAtTime(0.08, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.3);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880, now + 0.1); // A5
        gain2.gain.setValueAtTime(0.1, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.5);
      } catch {
        // audio context blocked or unsupported
      }
    };

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(15);
        
      if (data) {
        setNotifications(data);
        const unread = data.filter((n) => !n.is_read).length;
        if (unread > 0) setActiveTab("notif");
      }
    };

    fetchNotifications();

    // 1. Channel for in-app notifications
    const channel = supabase
      .channel(`notif_channel_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev.filter(n => n.id !== newNotif.id)].slice(0, 15));
          setActiveTab("notif");
          playNotificationChime();
          if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          if (newMsg && !newMsg.is_lounge) {
            // If already in that exact personal chat, skip alert
            if (typeof window !== "undefined" && window.location.pathname === `/chat/personal/${newMsg.sender_id}`) {
              return;
            }
            fetchNotifications();
            playNotificationChime();
            if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
          }
        }
      )
      .subscribe();

    const handleQuestUpdate = () => evaluateQuests();
    window.addEventListener("expedient-quest-updated", handleQuestUpdate);
    window.addEventListener("storage", handleQuestUpdate);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("expedient-quest-updated", handleQuestUpdate);
      window.removeEventListener("storage", handleQuestUpdate);
    };
  }, [userId, supabase, evaluateQuests]);

  // Click outside and ESC key to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const completedCount = completedQuests.size;
  const totalCount = INITIAL_QUESTS.length;
  const isAllQuestsDone = completedCount >= totalCount;

  // Dynamic unread dot on favicon
  useEffect(() => {
    if (typeof window === "undefined") return;
    const faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!faviconLink) return;

    const originalHref = "/icon-32.png";

    if (unreadCount > 0) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = originalHref;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 32, 32);

        // Draw notification badge dot at top-right
        ctx.beginPath();
        ctx.arc(24, 8, 6, 0, 2 * Math.PI);
        ctx.fillStyle = "#ff3366";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        faviconLink.href = canvas.toDataURL("image/png");
      };
    } else {
      faviconLink.href = originalHref;
    }
  }, [unreadCount]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
  };

  const restartTour = () => {
    setIsOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("expedient-restart-tour"));
    }
  };

  return (
    <div className="notif-wrapper" style={{ position: "relative", zIndex: 1001 }}>
      <button 
        ref={buttonRef}
        type="button"
        className="notif-widget hover-trigger" 
        id="btnNotifWidget"
        title="Pengumuman & Misi Alumni"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        style={{ cursor: "pointer", pointerEvents: "auto" }}
      >
        <div className="icon-orb">
          <i className="fa-solid fa-bell"></i>
        </div>
        {(unreadCount > 0 || !isAllQuestsDone) && (
          <span id="notifBadge" style={{
            position: "absolute", top: "2px", right: "2px", 
            width: "12px", height: "12px", 
            background: unreadCount > 0 ? "#ff5555" : "#d4af37", 
            borderRadius: "50%", 
            boxShadow: `0 0 10px ${unreadCount > 0 ? "#ff5555" : "#d4af37"}`
          }}></span>
        )}
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="notif-dropdown" 
          style={{ 
            display: "block", 
            opacity: 1, 
            transform: "none", 
            pointerEvents: "auto",
            zIndex: 10002 
          }}
        >
          {/* Tabs header */}
          <div className="notif-tabs">
            <button
              type="button"
              className={`notif-tab-btn ${activeTab === "quest" ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab("quest");
              }}
            >
              <i className="fa-solid fa-scroll"></i>
              <span>Misi Awal</span>
              <span className={`tab-badge ${isAllQuestsDone ? "done" : ""}`}>
                {isAllQuestsDone ? "✓" : `${completedCount}/${totalCount}`}
              </span>
            </button>
            <button
              type="button"
              className={`notif-tab-btn ${activeTab === "notif" ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab("notif");
              }}
            >
              <i className="fa-solid fa-bell"></i>
              <span>Pemberitahuan</span>
              {unreadCount > 0 && (
                <span className="tab-badge unread">{unreadCount}</span>
              )}
            </button>
          </div>

          {/* TAB 1: QUEST / MISI ALUMNI */}
          {activeTab === "quest" && (
            <div className="quest-tab-content">
              <div className="quest-header-bar">
                <div className="quest-header-info">
                  <span className="quest-header-title">Misi Langkah Awal</span>
                  <span className="quest-header-progress">{completedCount} dari {totalCount} selesai</span>
                </div>
                <div className="quest-mini-progress">
                  <div 
                    className="quest-mini-progress-fill" 
                    style={{ width: `${(completedCount / totalCount) * 100}%` }}
                  />
                </div>
              </div>

              <div className="quest-list">
                {INITIAL_QUESTS.map((q) => {
                  const isDone = completedQuests.has(q.id);
                  return (
                    <Link
                      key={q.id}
                      href={q.href}
                      className={`quest-tab-item ${isDone ? "completed" : ""}`}
                      onClick={(e) => {
                        if (q.href === "#") e.preventDefault();
                        else setIsOpen(false);
                      }}
                    >
                      <div className="quest-tab-icon">
                        {isDone ? (
                          <i className="fa-solid fa-circle-check"></i>
                        ) : (
                          <i className={q.icon}></i>
                        )}
                      </div>
                      <div className="quest-tab-details">
                        <span className="quest-tab-label">{q.label}</span>
                        {!isDone && (
                          <span className="quest-tab-action">{q.actionText}</span>
                        )}
                      </div>
                      {isDone && <span className="quest-tab-check">✓</span>}
                    </Link>
                  );
                })}
              </div>

              <div className="quest-tab-footer">
                <button type="button" className="btn-tour-restart" onClick={restartTour}>
                  <i className="fa-solid fa-compass"></i> Ulangi Tur Panduan Portal
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: NOTIFIKASI & PENGUMUMAN */}
          {activeTab === "notif" && (
            <div className="notif-body-wrap">
              <div className="notif-header">
                <h4>Pemberitahuan</h4>
                {unreadCount > 0 && (
                  <button type="button" onClick={markAllAsRead} className="btn-mark-all">Tandai Semua Dibaca</button>
                )}
              </div>
              <div className="notif-body">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                      onClick={() => {
                        if (!n.is_read) markAsRead(n.id);
                        setIsOpen(false);
                      }}
                    >
                      <div className="notif-content">
                        {n.link ? (
                          <Link href={n.link} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <h5>{n.title}</h5>
                            <p>{n.message}</p>
                          </Link>
                        ) : (
                          <>
                            <h5>{n.title}</h5>
                            <p>{n.message}</p>
                          </>
                        )}
                        <span className="notif-time">
                          {new Date(n.created_at).toLocaleDateString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {!n.is_read && <div className="unread-dot"></div>}
                    </div>
                  ))
                ) : (
                  <div className="notif-empty">Belum ada pemberitahuan baru.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

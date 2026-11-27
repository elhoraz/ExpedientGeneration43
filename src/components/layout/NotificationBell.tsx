"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  requestSystemNotificationPermission,
  isAndroidNativeApp,
  hasSystemNotificationPermission,
  sendSystemNotification,
} from "@/lib/notificationHelper";
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

const QUEST_STORAGE_KEYS: ReadonlyArray<{ id: string; storageKey: string }> = [
  { id: "login", storageKey: "expedient_quest_login" },
  { id: "profile", storageKey: "expedient_quest_profile" },
  { id: "radar", storageKey: "expedient_quest_radar" },
  { id: "directory", storageKey: "expedient_quest_directory" },
];

export default function NotificationBell({ userId }: { userId: string }) {
  const { t, locale } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"quest" | "notif">("quest");
  const [completedQuests, setCompletedQuests] = useState<Set<string>>(new Set(["login"]));
  const [pushStatus, setPushStatus] = useState<"granted" | "default" | "denied" | "unsupported">("granted");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isAndroidNativeApp()) {
        const granted = hasSystemNotificationPermission();
        setPushStatus(granted ? "granted" : "default");
      } else if ("Notification" in window) {
        setPushStatus(Notification.permission);
      } else {
        setPushStatus("unsupported");
      }
    }
  }, []);

  const enablePush = async () => {
    try {
      const permission = await requestSystemNotificationPermission();
      setPushStatus(permission);

      if (permission === "granted" && typeof window !== "undefined" && "serviceWorker" in navigator) {
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (vapidKey) {
          const reg = await navigator.serviceWorker.ready;
          const padding = "=".repeat((4 - (vapidKey.length % 4)) % 4);
          const base64 = (vapidKey + padding).replace(/-/g, "+").replace(/_/g, "/");
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);

          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: outputArray,
          });
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sub),
          });
        }
      }
    } catch (err) {
      console.error("Enable push error:", err);
    }
  };

  const quests: QuestItem[] = [
    {
      id: "login",
      icon: "fa-solid fa-right-to-bracket",
      label: t.notification_quests?.quest_login || "Login ke portal alumni",
      href: "#",
      actionText: t.notification_quests?.action_done || "Selesai ✓",
      storageKey: "expedient_quest_login",
    },
    {
      id: "profile",
      icon: "fa-solid fa-user-pen",
      label: t.notification_quests?.quest_profile || "Lengkapi foto & data profil",
      href: "/profil",
      actionText: t.notification_quests?.action_open_profile || "Buka Profil →",
      storageKey: "expedient_quest_profile",
    },
    {
      id: "radar",
      icon: "fa-solid fa-map-location-dot",
      label: t.notification_quests?.quest_radar || "Perbarui lokasi tinggal di radar",
      href: "/radar",
      actionText: t.notification_quests?.action_open_radar || "Buka Radar →",
      storageKey: "expedient_quest_radar",
    },
    {
      id: "directory",
      icon: "fa-solid fa-address-book",
      label: t.notification_quests?.quest_directory || "Cari kawan lama di direktori",
      href: "/direktori",
      actionText: t.notification_quests?.action_open_directory || "Buka Direktori →",
      storageKey: "expedient_quest_directory",
    },
  ];
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  // Re-evaluate completed quests from storage and database
  const evaluateQuests = useCallback(async () => {
    const done = new Set<string>();
    done.add("login");
    if (typeof window !== "undefined") {
      localStorage.setItem("expedient_quest_login", "true");

      QUEST_STORAGE_KEYS.forEach((q) => {
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
        .select("foto_profil, no_whatsapp, lat, lng, motivasi_hidup")
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
        const hasPhone = profile.no_whatsapp;
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

          // Trigger high-priority native system heads-up notification
          sendSystemNotification({
            title: newNotif.title || "Pemberitahuan Baru",
            message: newNotif.message || "Ada pemberitahuan baru di portal alumni.",
            url: newNotif.link || "/beranda",
            tag: `notif-${newNotif.id}`,
          });
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
        async (payload) => {
          const newMsg = payload.new as any;
          if (newMsg && !newMsg.is_lounge) {
            // If already in that exact personal chat, skip alert
            if (typeof window !== "undefined" && window.location.pathname === `/chat/personal/${newMsg.sender_id}`) {
              return;
            }
            fetchNotifications();
            playNotificationChime();
            if (navigator.vibrate) navigator.vibrate([120, 60, 120]);

            // Trigger instant system heads-up notification with sender name preview
            try {
              const { data: profile } = await supabase
                .from("profiles")
                .select("nama_panggilan, nama_lengkap")
                .eq("id", newMsg.sender_id)
                .maybeSingle();

              const senderName = profile?.nama_panggilan || profile?.nama_lengkap || "Rekan Alumni";
              const preview = newMsg.message || (newMsg.image_url ? "Mengirim gambar" : newMsg.audio_url ? "Pesan suara" : "Mengirim lampiran");

              sendSystemNotification({
                title: `Pesan Baru: ${senderName}`,
                message: preview,
                url: `/chat/personal/${newMsg.sender_id}`,
                tag: `chat-${newMsg.sender_id}`,
              });
            } catch {
              sendSystemNotification({
                title: "Pesan Chat Baru",
                message: newMsg.message || "Anda menerima pesan obrolan baru.",
                url: `/chat/personal/${newMsg.sender_id}`,
                tag: `chat-${newMsg.sender_id}`,
              });
            }
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
  const totalCount = quests.length;
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
        title={locale === "ar" ? "الإعلانات والمهام" : locale === "en" ? "Announcements & Quests" : "Pengumuman & Misi Alumni"}
        aria-label={locale === "ar" ? "الإعلانات والمهام" : locale === "en" ? "Announcements & Quests" : "Pengumuman & Misi Alumni"}
        aria-expanded={isOpen}
        aria-controls="notifDropdownPanel"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        style={{ cursor: "pointer", pointerEvents: "auto" }}
      >
        <div className="icon-orb">
          <i className="fa-solid fa-bell" aria-hidden="true"></i>
        </div>
        {(unreadCount > 0 || !isAllQuestsDone) && (
          <span
            id="notifBadge"
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "4px",
              insetInlineEnd: "4px",
              width: "10px",
              height: "10px",
              background: unreadCount > 0 ? "var(--ruby-gem, #dc2626)" : "var(--gold-main, #d4af37)",
              borderRadius: "50%",
              border: "2px solid var(--bg-card)",
            }}
          ></span>
        )}
      </button>

      {isOpen && (
        <div
          id="notifDropdownPanel"
          ref={dropdownRef}
          className="notif-dropdown"
          role="dialog"
          aria-label={locale === "ar" ? "الإعلانات والمهام" : locale === "en" ? "Announcements & Quests" : "Pengumuman & Misi Alumni"}
          style={{
            display: "block",
            opacity: 1,
            transform: "none",
            pointerEvents: "auto",
            zIndex: 10002,
          }}
        >
          {/* Tabs header */}
          <div className="notif-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "quest"}
              className={`notif-tab-btn ${activeTab === "quest" ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab("quest");
              }}
            >
              <i className="fa-solid fa-scroll" aria-hidden="true"></i>
              <span>{t.notification_quests?.tab_quests || "Misi Awal"}</span>
              <span className={`tab-badge ${isAllQuestsDone ? "done" : ""}`}>
                {isAllQuestsDone ? <i className="fa-solid fa-check" aria-hidden="true"></i> : `${completedCount}/${totalCount}`}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "notif"}
              className={`notif-tab-btn ${activeTab === "notif" ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab("notif");
              }}
            >
              <i className="fa-solid fa-bell" aria-hidden="true"></i>
              <span>{t.notification_quests?.tab_notifications || "Pemberitahuan"}</span>
              {unreadCount > 0 && (
                <span className="tab-badge unread">{unreadCount}</span>
              )}
            </button>
          </div>

          {/* TAB 1: QUEST / MISI ALUMNI */}
          {activeTab === "quest" && (
            <div className="quest-tab-content" role="tabpanel">
              <div className="quest-header-bar">
                <div className="quest-header-info">
                  <span className="quest-header-title">{t.notification_quests?.tab_quests || "Misi Langkah Awal"}</span>
                  <span className="quest-header-progress">
                    {locale === "ar"
                      ? `${completedCount} من ${totalCount} مكتمل`
                      : locale === "en"
                      ? `${completedCount} of ${totalCount} completed`
                      : `${completedCount} dari ${totalCount} selesai`}
                  </span>
                </div>
                <div className="quest-mini-progress">
                  <div
                    className="quest-mini-progress-fill"
                    style={{ width: `${(completedCount / totalCount) * 100}%` }}
                  />
                </div>
              </div>

              <div className="quest-list">
                {quests.map((q) => {
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
                      <div className="quest-tab-icon" aria-hidden="true">
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
                      {isDone && (
                        <span className="quest-tab-check" aria-hidden="true">
                          <i className="fa-solid fa-check"></i>
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="quest-tab-footer">
                <button type="button" className="btn-tour-restart" onClick={restartTour}>
                  <i className="fa-solid fa-compass" aria-hidden="true"></i> {locale === "ar" ? "إعادة الجولة التعريفية" : locale === "en" ? "Restart Portal Tour" : "Ulangi Tur Panduan Portal"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: NOTIFIKASI & PENGUMUMAN */}
          {activeTab === "notif" && (
            <div className="notif-body-wrap" role="tabpanel">
              <div className="notif-header">
                <h3>{t.notification_quests?.tab_notifications || "Pemberitahuan"}</h3>
                {unreadCount > 0 && (
                  <button type="button" onClick={markAllAsRead} className="btn-mark-all">
                    {t.notification_quests?.mark_all_read || "Tandai Semua Dibaca"}
                  </button>
                )}
              </div>

              {pushStatus === "default" && (
                <div className="push-enable-banner">
                  <div className="push-enable-label">
                    <i className="fa-solid fa-bell" aria-hidden="true"></i>
                    <span>{locale === "ar" ? "تفعيل التنبيهات على الجهاز" : locale === "en" ? "Enable push notifications" : "Aktifkan notifikasi perangkat"}</span>
                  </div>
                  <button
                    type="button"
                    className="push-enable-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      enablePush();
                    }}
                  >
                    {locale === "ar" ? "تفعيل" : locale === "en" ? "Enable" : "Aktifkan"}
                  </button>
                </div>
              )}

              <div className="notif-body">
                {notifications.length > 0 ? (
                  notifications.map((n) => {
                    const bodyContent = (
                      <>
                        <div className="notif-content">
                          <span className="notif-item-title">{n.title}</span>
                          <p>{n.message}</p>
                          <span className="notif-time">
                            {new Date(n.created_at).toLocaleDateString(locale === "ar" ? "ar-SA" : locale === "en" ? "en-US" : "id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        {!n.is_read && <span className="unread-dot" aria-hidden="true"></span>}
                      </>
                    );

                    if (n.link) {
                      return (
                        <Link
                          key={n.id}
                          href={n.link}
                          className={`notif-item ${!n.is_read ? "unread" : ""}`}
                          onClick={() => {
                            if (!n.is_read) markAsRead(n.id);
                            setIsOpen(false);
                          }}
                        >
                          {bodyContent}
                        </Link>
                      );
                    }

                    return (
                      <button
                        key={n.id}
                        type="button"
                        className={`notif-item ${!n.is_read ? "unread" : ""}`}
                        onClick={() => {
                          if (!n.is_read) markAsRead(n.id);
                          setIsOpen(false);
                        }}
                      >
                        {bodyContent}
                      </button>
                    );
                  })
                ) : (
                  <div className="notif-empty">
                    {t.notification_quests?.empty_notif || "Belum ada pemberitahuan baru."}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { triggerHaptic } from "@/lib/haptic";
import "./notifications.css";

type Notification = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Baru saja";
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay === 1) return "Kemarin";
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function getNotificationIcon(title: string, message: string) {
  const text = `${title} ${message}`.toLowerCase();
  if (text.includes("pengumuman") || text.includes("edar") || text.includes("info")) {
    return { icon: "fa-solid fa-bullhorn", color: "#d4af37", bg: "rgba(212,175,55,0.15)" };
  }
  if (text.includes("panggilan") || text.includes("telepon") || text.includes("call")) {
    return { icon: "fa-solid fa-phone-volume", color: "#2ecc71", bg: "rgba(46,204,113,0.15)" };
  }
  if (text.includes("acara") || text.includes("event") || text.includes("reuni") || text.includes("agenda")) {
    return { icon: "fa-solid fa-calendar-check", color: "#3498db", bg: "rgba(52,152,219,0.15)" };
  }
  if (text.includes("maal") || text.includes("kas") || text.includes("donasi") || text.includes("infaq")) {
    return { icon: "fa-solid fa-hand-holding-dollar", color: "#00ff88", bg: "rgba(0,255,136,0.15)" };
  }
  if (text.includes("syndicate") || text.includes("bisnis") || text.includes("tender")) {
    return { icon: "fa-solid fa-briefcase", color: "#f39c12", bg: "rgba(243,156,18,0.15)" };
  }
  if (text.includes("pesan") || text.includes("chat")) {
    return { icon: "fa-solid fa-comment-dots", color: "#9b59b6", bg: "rgba(155,89,182,0.15)" };
  }
  return { icon: "fa-solid fa-bell", color: "#d4af37", bg: "rgba(212,175,55,0.15)" };
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data);
      }
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    fetchNotifications();

    // Supabase Realtime Subscription for new incoming notifications
    const channel = supabase
      .channel(`notifications_user_${userId}`)
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
          setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)].slice(0, 20));
          triggerHaptic("notification");
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updatedNotif = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, supabase, userId]);

  // Click outside & Escape handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
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

  // Favicon dynamic indicator
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
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    triggerHaptic("light");
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    return true;
  });

  return (
    <div className="notif-wrapper" style={{ position: "relative", zIndex: 1001 }}>
      <button
        ref={buttonRef}
        type="button"
        className="notif-widget hover-trigger"
        id="btnNotifWidget"
        title={unreadCount > 0 ? `${unreadCount} pemberitahuan belum dibaca` : "Pemberitahuan"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
          triggerHaptic("selection");
        }}
        style={{ cursor: "pointer", pointerEvents: "auto" }}
      >
        <div className="icon-orb">
          <i className="fa-solid fa-bell"></i>
        </div>
        {unreadCount > 0 && (
          <span
            id="notifBadge"
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              minWidth: unreadCount > 9 ? "18px" : "14px",
              height: "14px",
              padding: "0 3px",
              background: "linear-gradient(135deg, #ff3366, #d90429)",
              color: "#fff",
              fontSize: "0.6rem",
              fontWeight: 800,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 10px rgba(255, 51, 102, 0.7)",
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
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
            zIndex: 10002,
          }}
        >
          {/* Header */}
          <div className="notif-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="fa-solid fa-bell" style={{ color: "var(--gold-main, #d4af37)", fontSize: "0.9rem" }}></i>
              <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Pemberitahuan
              </h4>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: "0.65rem",
                    padding: "2px 7px",
                    borderRadius: "12px",
                    background: "rgba(255, 51, 102, 0.15)",
                    color: "#ff3366",
                    fontWeight: 700,
                    border: "1px solid rgba(255, 51, 102, 0.3)",
                  }}
                >
                  {unreadCount} baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="btn-mark-all"
                title="Tandai semua sudah dibaca"
              >
                <i className="fa-solid fa-check-double" style={{ marginRight: "4px" }}></i>
                Tandai Dibaca
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="notif-filter-bar">
            <button
              type="button"
              className={`notif-filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setFilter("all");
              }}
            >
              Semua ({notifications.length})
            </button>
            <button
              type="button"
              className={`notif-filter-btn ${filter === "unread" ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setFilter("unread");
              }}
            >
              Belum Dibaca ({unreadCount})
            </button>
          </div>

          {/* Body / List of Notifications */}
          <div className="notif-body">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((n) => {
                const iconMeta = getNotificationIcon(n.title, n.message);
                const isUnread = !n.is_read;

                const content = (
                  <div
                    key={n.id}
                    className={`notif-item ${isUnread ? "unread" : ""}`}
                    onClick={() => {
                      if (isUnread) markAsRead(n.id);
                      if (n.link) setIsOpen(false);
                    }}
                  >
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "10px",
                        background: iconMeta.bg,
                        color: iconMeta.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: "0.85rem",
                        marginTop: "2px",
                      }}
                    >
                      <i className={iconMeta.icon}></i>
                    </div>

                    <div className="notif-content" style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", marginBottom: "2px" }}>
                        <h5
                          style={{
                            margin: 0,
                            fontSize: "0.83rem",
                            fontWeight: isUnread ? 700 : 500,
                            color: isUnread ? "var(--text-primary)" : "var(--text-secondary)",
                          }}
                        >
                          {n.title}
                        </h5>
                        <span className="notif-time" style={{ flexShrink: 0 }}>
                          {formatTimeAgo(n.created_at)}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.76rem",
                          color: isUnread ? "var(--text-primary)" : "var(--text-secondary)",
                          opacity: isUnread ? 0.95 : 0.75,
                          lineHeight: 1.35,
                        }}
                      >
                        {n.message}
                      </p>
                    </div>

                    {isUnread && <div className="unread-dot" title="Belum dibaca"></div>}
                  </div>
                );

                if (n.link) {
                  return (
                    <Link
                      key={n.id}
                      href={n.link}
                      style={{ textDecoration: "none", color: "inherit", display: "block" }}
                    >
                      {content}
                    </Link>
                  );
                }

                return content;
              })
            ) : (
              <div className="notif-empty-state">
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "rgba(212, 175, 55, 0.08)",
                    border: "1px solid rgba(212, 175, 55, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                    color: "var(--gold-main, #d4af37)",
                    fontSize: "1.4rem",
                  }}
                >
                  <i className="fa-regular fa-bell"></i>
                </div>
                <h5 style={{ margin: "0 0 4px 0", color: "var(--text-primary)", fontSize: "0.9rem", fontWeight: 600 }}>
                  {filter === "unread" ? "Tidak Ada Notifikasi Baru" : "Kotak Pemberitahuan Bersih"}
                </h5>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.76rem", lineHeight: 1.4 }}>
                  {filter === "unread"
                    ? "Semua pemberitahuan telah Anda baca."
                    : "Kabar, agenda, dan pengumuman terbaru akan otomatis muncul di sini."}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "9px 14px",
              background: "rgba(0, 0, 0, 0.2)",
              borderTop: "1px solid var(--glass-border, rgba(255, 255, 255, 0.05))",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.7rem",
              color: "var(--text-secondary, #888)",
            }}
          >
            <span>
              <i className="fa-solid fa-satellite-dish" style={{ color: "#2ecc71", marginRight: "6px" }}></i>
              Realtime Sinkron
            </span>
            <span style={{ fontFamily: "monospace", fontSize: "0.68rem" }}>Expedient Portal</span>
          </div>
        </div>
      )}
    </div>
  );
}

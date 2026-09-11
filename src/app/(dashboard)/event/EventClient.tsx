"use client";

import { useState, useEffect } from "react";
import { useCms } from "@/components/layout/CmsProvider";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import Link from "next/link";
import "./event.css";

interface EventItem {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string | null;
  creator_name: string;
  my_rsvp: string | null;
  stats: {
    Hadir: number;
    Tentatif: number;
    Tidak: number;
  };
}

export default function EventClient({ initialEvents }: { initialEvents: EventItem[]; userId?: string }) {
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const { t } = useCms();
  const { t: tLang, locale } = useLanguage();
  
  useEffect(() => {
    document.body.classList.add("page-event");
    return () => {
      document.body.classList.remove("page-event");
    };
  }, []);
  


  const [toastMsg, setToastMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const showToast = (text: string, isError = false) => {
    setToastMsg({ text, isError });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleRsvp = async (eventId: string, status: string) => {
    // 1. Haptic tap feedback for mobile devices
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // Haptic not supported or denied
      }
    }

    const prevEvents = [...events];
    const target = events.find((e) => e.id === eventId);
    if (!target) return;

    const oldStatus = target.my_rsvp;
    if (oldStatus === status) return; // Already on this RSVP status

    // 2. Optimistic local state calculation
    const updatedEvents = events.map((ev) => {
      if (ev.id !== eventId) return ev;

      const newStats = {
        Hadir: ev.stats?.Hadir || 0,
        Tentatif: ev.stats?.Tentatif || 0,
        Tidak: ev.stats?.Tidak || 0,
      };

      // Decrement old status count
      if (oldStatus === "Hadir" && newStats.Hadir > 0) newStats.Hadir -= 1;
      else if (oldStatus === "Tentatif" && newStats.Tentatif > 0) newStats.Tentatif -= 1;
      else if ((oldStatus === "Tidak Hadir" || oldStatus === "Tidak") && newStats.Tidak > 0) newStats.Tidak -= 1;

      // Increment new status count
      if (status === "Hadir") newStats.Hadir += 1;
      else if (status === "Tentatif") newStats.Tentatif += 1;
      else if (status === "Tidak Hadir" || status === "Tidak") newStats.Tidak += 1;

      return {
        ...ev,
        my_rsvp: status,
        stats: newStats,
      };
    });

    // 3. Immediately set state without waiting for network
    setEvents(updatedEvents);
    setSubmittingId(eventId);
    showToast(`${tLang.common.success}: ${status}`);

    try {
      const res = await fetch("/api/events/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, status }),
      });

      if (!res.ok) {
        setEvents(prevEvents);
        showToast(tLang.common.error, true);
      }
    } catch {
      setEvents(prevEvents);
      showToast(tLang.common.error, true);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="event-wrapper">
      {/* OPTIMISTIC FLOATING TOAST (UX-03) */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            top: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 99999,
            background: "var(--glass-bg, rgba(10, 15, 12, 0.95))",
            backdropFilter: "blur(20px)",
            border: `1px solid ${toastMsg.isError ? "rgba(255,50,50,0.4)" : "rgba(212,175,55,0.4)"}`,
            borderRadius: "16px",
            padding: "12px 24px",
            color: "var(--text-primary, #fff)",
            fontSize: "0.85rem",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            animation: "fadeInUp 0.3s ease-out",
          }}
        >
          <i
            className={`fa-solid ${toastMsg.isError ? "fa-circle-exclamation" : "fa-circle-check"}`}
            style={{ color: toastMsg.isError ? "#ff5555" : "var(--gold-main, #d4af37)" }}
          ></i>
          <span>{toastMsg.text}</span>
        </div>
      )}

      <Link href="/fitur" className="btn-back">
        <i className="fa-solid fa-arrow-left"></i> {tLang.common.back}
      </Link>

      <div className="event-header">
        <h1 className="event-title">{tLang.event.title}</h1>
        <div className="event-subtitle">{tLang.event.subtitle}</div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "80px" }}>
        

        {/* Timeline Events */}
        {events.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: "50px", fontStyle: "italic", background: "var(--glass-bg)", borderRadius: "16px", border: "1px dashed rgba(212,175,55,0.3)" }}>
            {tLang.event.empty_events}
          </div>
        ) : (
          <div className="event-timeline">
            {events.map((ev, index) => (
              <div key={ev.id} className="event-card" style={{ animationDelay: `${index * 0.15}s` }}>
                <div className="timeline-dot"></div>
                
                <div className="event-date">
                  {new Date(ev.event_date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'en' ? 'en-US' : 'id-ID')} 
                  <span className="event-time"><i className="fa-regular fa-clock"></i> {new Date(ev.event_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                
                <div className="event-name">{ev.title}</div>
                <div className="event-desc">{ev.description}</div>
                
                <div className="event-meta">
                  <div className="meta-item"><i className="fa-solid fa-location-dot"></i> {ev.location || (locale === 'ar' ? 'الموقع يُحدد لاحقاً' : locale === 'en' ? 'Location TBD' : 'Lokasi belum ditentukan')}</div>
                  <div className="meta-item"><i className="fa-solid fa-user-pen"></i> {locale === 'ar' ? 'بواسطة' : locale === 'en' ? 'Scheduled by' : 'Dijadwalkan oleh'} {ev.creator_name}</div>
                </div>

                <div className="event-footer">
                  <div className="rsvp-stats">
                    <div className="stat-badge stat-hadir"><i className="fa-solid fa-check"></i> {ev.stats.Hadir} {tLang.event.rsvp_yes}</div>
                    <div className="stat-badge stat-tentatif"><i className="fa-solid fa-question"></i> {ev.stats.Tentatif} {tLang.event.rsvp_maybe}</div>
                    <div className="stat-badge stat-absen"><i className="fa-solid fa-xmark"></i> {ev.stats.Tidak} {tLang.event.rsvp_no}</div>
                  </div>

                  <div className="rsvp-actions">
                    <span className="rsvp-label">{locale === 'ar' ? 'تأكيد الحضور:' : locale === 'en' ? 'Your RSVP:' : 'Konfirmasi Anda:'}</span>
                    <button 
                      onClick={() => handleRsvp(ev.id, "Hadir")} 
                      disabled={submittingId === ev.id}
                      className={`btn-rsvp ${ev.my_rsvp === "Hadir" ? "active" : ""}`}
                    >
                      {tLang.event.rsvp_yes}
                    </button>
                    <button 
                      onClick={() => handleRsvp(ev.id, "Tentatif")} 
                      disabled={submittingId === ev.id}
                      className={`btn-rsvp ${ev.my_rsvp === "Tentatif" ? "active" : ""}`}
                    >
                      {tLang.event.rsvp_maybe}
                    </button>
                    <button 
                      onClick={() => handleRsvp(ev.id, "Tidak Hadir")} 
                      disabled={submittingId === ev.id}
                      className={`btn-rsvp ${ev.my_rsvp === "Tidak Hadir" ? "active" : ""}`}
                    >
                      {tLang.event.rsvp_no}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

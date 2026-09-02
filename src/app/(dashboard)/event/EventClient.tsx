"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/layout/AegisConfirm";
import { useCms } from "@/components/layout/CmsProvider";
import Link from "next/link";
import "./event.css";

export default function EventClient({ initialEvents, userId }: { initialEvents: any[]; userId: string }) {
  const [events, setEvents] = useState<any[]>(initialEvents);
  const { t } = useCms();
  
  useEffect(() => {
    document.body.classList.add("page-event");
    return () => {
      document.body.classList.remove("page-event");
    };
  }, []);
  


  const handleRsvp = async (eventId: string, status: string) => {
    const res = await fetch("/api/events/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: eventId, status })
    });

    if (res.ok) {
      window.location.reload();
    }
  };

  return (
    <div className="event-wrapper">
      <Link href="/fitur" className="btn-back">
        <i className="fa-solid fa-arrow-left"></i> {t('event_btn_back', 'Kembali')}
      </Link>

      <div className="event-header">
        <h1 className="event-title">{t('event_title', 'Agenda & Eksibisi')}</h1>
        <div className="event-subtitle">{t('event_subtitle', 'Pertemuan Para Pelopor Peradaban')}</div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "80px" }}>
        

        {/* Timeline Events */}
        {events.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: "50px", fontStyle: "italic", background: "var(--glass-bg)", borderRadius: "16px", border: "1px dashed rgba(212,175,55,0.3)" }}>
            {t('event_empty_msg', 'Belum ada agenda yang dijadwalkan di masa mendatang.')}
          </div>
        ) : (
          <div className="event-timeline">
            {events.map((ev, index) => (
              <div key={ev.id} className="event-card" style={{ animationDelay: `${index * 0.15}s` }}>
                <div className="timeline-dot"></div>
                
                <div className="event-date">
                  {new Date(ev.event_date).toLocaleDateString()} 
                  <span className="event-time"><i className="fa-regular fa-clock"></i> {new Date(ev.event_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} WIB</span>
                </div>
                
                <div className="event-name">{ev.title}</div>
                <div className="event-desc">{ev.description}</div>
                
                <div className="event-meta">
                  <div className="meta-item"><i className="fa-solid fa-location-dot"></i> {ev.location || t('event_loc_empty', 'Lokasi belum ditentukan')}</div>
                  <div className="meta-item"><i className="fa-solid fa-user-pen"></i> {t('event_creator_label', 'Dijadwalkan oleh')} {ev.creator_name}</div>
                </div>

                <div className="event-footer">
                  <div className="rsvp-stats">
                    <div className="stat-badge stat-hadir"><i className="fa-solid fa-check"></i> {ev.stats.Hadir} {t('event_stat_hadir', 'Hadir')}</div>
                    <div className="stat-badge stat-tentatif"><i className="fa-solid fa-question"></i> {ev.stats.Tentatif} {t('event_stat_tentatif', 'Tentatif')}</div>
                    <div className="stat-badge stat-absen"><i className="fa-solid fa-xmark"></i> {ev.stats.Tidak} {t('event_stat_absen', 'Absen')}</div>
                  </div>

                  <div className="rsvp-actions">
                    <span className="rsvp-label">{t('event_rsvp_label', 'Konfirmasi Anda:')}</span>
                    <button onClick={() => handleRsvp(ev.id, "Hadir")} className={`btn-rsvp ${ev.my_rsvp === "Hadir" ? "active" : ""}`}>{t('event_btn_hadir', 'Hadir')}</button>
                    <button onClick={() => handleRsvp(ev.id, "Tentatif")} className={`btn-rsvp ${ev.my_rsvp === "Tentatif" ? "active" : ""}`}>{t('event_btn_tentatif', 'Tentatif')}</button>
                    <button onClick={() => handleRsvp(ev.id, "Tidak Hadir")} className={`btn-rsvp ${ev.my_rsvp === "Tidak Hadir" ? "active" : ""}`}>{t('event_btn_absen', 'Absen')}</button>
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

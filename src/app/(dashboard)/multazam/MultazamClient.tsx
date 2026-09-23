"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/layout/AegisConfirm";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import "./multazam.css";

export default function MultazamClient({ activeTicket, initialPrayers, userId }: { activeTicket: any, initialPrayers: any[], userId: string }) {
  const { t, locale } = useLanguage();
  const [prayers, setPrayers] = useState(initialPrayers);
  const [newPrayer, setNewPrayer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const { showAlert } = useConfirm();

  useEffect(() => {
    document.body.classList.add("page-multazam");
    // Intro Animations
    gsap.from(".vip-ticket", { y: 100, opacity: 0, rotationX: 20, duration: 1.5, ease: "back.out(1.2)" });
    gsap.from(".action-buttons button, .action-buttons a", { y: 30, opacity: 0, duration: 0.8, stagger: 0.2, delay: 0.5, ease: "power2.out" });

    // 3D Tilt Effect
    const ticket = ticketRef.current;
    if (ticket) {
        ticket.addEventListener('mousemove', (e: MouseEvent) => {
            const rect = ticket.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -15;
            const rotateY = ((x - centerX) / centerX) * 15;

            ticket.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            ticket.style.transition = "none";
        });

        ticket.addEventListener('mouseleave', () => {
            ticket.style.transition = "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)";
            ticket.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
        });
    }

    return () => {
      document.body.classList.remove("page-multazam");
    };
  }, []);

  const handlePrayerSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPrayer.trim()) return;

      setIsSubmitting(true);
      const { data, error } = await supabase.from("prayers").insert([{
          user_id: userId,
          prayer_text: newPrayer,
          status: 'Terkirim'
      }]).select();

      if (!error && data) {
          setPrayers([data[0], ...prayers]);
          setNewPrayer("");
          await showAlert("Berhasil", t.multazam.prayer_success);
      } else if (error) {
          await showAlert("Gagal", error.message);
      }
      setIsSubmitting(false);
  };

  const togglePanel = () => {
      if (navigator.vibrate) navigator.vibrate(20);
      setPanelOpen(!panelOpen);
  };

  const dateLocale = locale === "ar" ? "ar-SA" : locale === "en" ? "en-US" : "id-ID";

  const handleAppleWallet = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const btn = e.currentTarget;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${t.multazam.wallet_processing}`;
      btn.style.pointerEvents = 'none';
      
      setTimeout(() => {
          btn.innerHTML = `<i class="fa-solid fa-check"></i> ${t.multazam.wallet_saved}`;
          btn.style.background = 'var(--neon-green, #39ff14)';
          btn.style.color = '#000';
      }, 1500);
  };

  return (
    <div className="multazam-page-wrapper">
      <div className="multazam-wrapper">
          <header className="multazam-header">
              <Link href="/fitur" className="btn-back">
                  <i className="fa-solid fa-chevron-left"></i> {t.common.back}
              </Link>
              <div className="header-titles">
                  <h1 className="page-title">{t.multazam.title}</h1>
                  <div className="page-subtitle">{t.multazam.subtitle}</div>
              </div>
          </header>

          <div className="ticket-container">
              {activeTicket ? (
              <div className="vip-ticket" ref={ticketRef}>
                  <div className="ticket-top">
                      <div className="ticket-badge">VVIP PASS</div>
                      <div className="cutout cutout-left"></div>
                      <div className="cutout cutout-right"></div>
                  </div>
                  <div className="ticket-body">
                      <div>
                          <h2 className="event-title">{activeTicket.title}</h2>
                          <p className="event-desc">{activeTicket.description}</p>
                          
                          <div className="ticket-details">
                              <div className="detail-item">
                                  <span className="detail-label">{t.multazam.ticket_date}</span>
                                  <span className="detail-value">{new Date(activeTicket.event_date).toLocaleDateString(dateLocale, {day: '2-digit', month: 'short', year: 'numeric'})}</span>
                              </div>
                              <div className="detail-item">
                                  <span className="detail-label">{t.multazam.ticket_time}</span>
                                  <span className="detail-value">{new Date(activeTicket.event_date).toLocaleTimeString(dateLocale, {hour: '2-digit', minute: '2-digit'})}</span>
                              </div>
                              <div className="detail-item">
                                  <span className="detail-label">{t.multazam.ticket_location}</span>
                                  <span className="detail-value">{activeTicket.location}</span>
                              </div>
                              <div className="detail-item">
                                  <span className="detail-label">{t.multazam.ticket_dresscode}</span>
                                  <span className="detail-value">{activeTicket.dresscode}</span>
                              </div>
                          </div>
                      </div>
                      
                      <div className="qr-section">
                          <div className="qr-code"></div>
                          <div className="seat-info">
                              <span className="detail-label">{t.multazam.ticket_vip_table}</span>
                              <div className="seat-number">{activeTicket.seat_number}</div>
                          </div>
                      </div>
                  </div>
              </div>
              ) : (
              <div style={{ textAlign: 'center', padding: '50px 20px', background: 'rgba(212,175,55,0.05)', border: '1px dashed rgba(212,175,55,0.3)', borderRadius: '20px', color: 'var(--gold-main)' }}>
                  <i className="fa-solid fa-ticket-simple" style={{ fontSize: '3rem', opacity: 0.5, marginBottom: '20px' }}></i>
                  <h3 style={{ color: 'var(--text-primary)' }}>{t.multazam.no_tickets_title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t.multazam.no_tickets_desc}</p>
              </div>
              )}
          </div>

          <div className="action-buttons">
              {activeTicket && (
              <a href="#" className="btn-wallet" onClick={handleAppleWallet}>
                  <i className="fa-brands fa-apple"></i> Apple / Universal Pass (.pkpass)
              </a>
              )}
              <button className="btn-secondary" onClick={togglePanel}>
                  <i className="fa-solid fa-hands-praying"></i> {t.multazam.multazam_wall}
              </button>
          </div>
      </div>

      <div className={`prayer-panel ${panelOpen ? 'open' : ''}`}>
          <button type="button" className="btn-close-panel" onClick={togglePanel}><i className="fa-solid fa-xmark"></i></button>
          <div className="panel-title">{t.multazam.pray_header}</div>
          <form className="prayer-form" onSubmit={handlePrayerSubmit}>
              <textarea value={newPrayer} onChange={e => setNewPrayer(e.target.value)} rows={4} placeholder={t.multazam.pray_placeholder} required disabled={isSubmitting}></textarea>
              <button type="submit" className="btn-submit-prayer" disabled={isSubmitting || !newPrayer.trim()}>{isSubmitting ? t.multazam.pray_sending : t.multazam.pray_submit}</button>
          </form>

          <div className="panel-title" style={{ marginTop: '20px' }}>{t.multazam.hope_wall}</div>
          {prayers.length > 0 ? (
              prayers.map(p => (
                  <div key={p.id || Math.random()} className="prayer-card">
                      <div className="prayer-date">{new Date(p.created_at).toLocaleDateString(dateLocale, {day: '2-digit', month: 'short', year: 'numeric'})}</div>
                      <div className="prayer-content">"{p.prayer_text}"</div>
                      <div className="prayer-status"><i className="fa-solid fa-check-double" style={{ color: 'var(--gold-main)' }}></i> {p.status}</div>
                  </div>
              ))
          ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic' }}>{t.multazam.empty_prayers}</div>
          )}
      </div>
    </div>
  );
}

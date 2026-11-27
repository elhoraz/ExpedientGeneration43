"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import html2canvas from "html2canvas";
import QRCode from "qrcode";
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
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [walletStatus, setWalletStatus] = useState<"idle" | "processing" | "saved">("idle");
  const ticketRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const { showAlert } = useConfirm();

  useEffect(() => {
    document.body.classList.add("page-multazam");
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (!reducedMotion) {
      gsap.from(".vip-ticket", { y: 40, opacity: 0, duration: 0.9, ease: "power3.out" });
      gsap.from(".action-buttons button", { y: 20, opacity: 0, duration: 0.6, stagger: 0.12, delay: 0.25, ease: "power2.out" });
    }

    const ticket = ticketRef.current;
    if (ticket && !reducedMotion && window.innerWidth > 768) {
      const handleMove = (e: MouseEvent) => {
        const rect = ticket.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        ticket.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
        ticket.style.transition = "none";
      };
      const handleLeave = () => {
        ticket.style.transition = "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)";
        ticket.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
      };
      ticket.addEventListener("mousemove", handleMove);
      ticket.addEventListener("mouseleave", handleLeave);

      return () => {
        ticket.removeEventListener("mousemove", handleMove);
        ticket.removeEventListener("mouseleave", handleLeave);
        document.body.classList.remove("page-multazam");
      };
    }

    return () => {
      document.body.classList.remove("page-multazam");
    };
  }, []);

  useEffect(() => {
    if (!activeTicket) return;
    const payload = `EXP43-TICKET:${activeTicket.id || activeTicket.title}|SEAT:${activeTicket.seat_number || "-"}`;
    QRCode.toDataURL(payload, {
      width: 160,
      margin: 1,
      color: { dark: "#18181b", light: "#ffffff" },
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => {});
  }, [activeTicket]);

  useEffect(() => {
    if (!panelOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [panelOpen]);

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

  const handleSavePass = async () => {
      if (walletStatus === "processing" || !ticketRef.current) return;
      setWalletStatus("processing");
      try {
          const canvas = await html2canvas(ticketRef.current, {
              backgroundColor: null,
              scale: 2,
              useCORS: true,
          });
          const dataUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.download = `Multazam_Pass_${activeTicket?.badgeNumber || "43"}.png`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setWalletStatus("saved");
          setTimeout(() => setWalletStatus("idle"), 2500);
      } catch (err) {
          console.error("Gagal mengekspor tiket Multazam:", err);
          setWalletStatus("idle");
      }
  };

  return (
    <div className="multazam-page-wrapper">
      <div className="multazam-wrapper">
          <header className="multazam-header">
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
                          <div className="qr-code">
                              {qrDataUrl ? (
                                <img src={qrDataUrl} alt={`QR ${activeTicket.title}`} width={70} height={70} style={{ display: 'block', borderRadius: '4px' }} />
                              ) : (
                                <i className="fa-solid fa-qrcode" aria-hidden="true" style={{ fontSize: '2.2rem', color: '#18181b' }}></i>
                              )}
                          </div>
                          <div className="seat-info">
                              <span className="detail-label">{t.multazam.ticket_vip_table}</span>
                              <div className="seat-number">{activeTicket.seat_number}</div>
                          </div>
                      </div>
                  </div>
              </div>
              ) : (
              <div className="multazam-empty-ticket">
                  <i className="fa-solid fa-ticket-simple" aria-hidden="true" style={{ fontSize: '2.5rem', opacity: 0.65, marginBottom: '16px', display: 'block' }}></i>
                  <h3>{t.multazam.no_tickets_title}</h3>
                  <p>{t.multazam.no_tickets_desc}</p>
              </div>
              )}
          </div>

          <div className="action-buttons">
              {activeTicket && (
              <button
                type="button"
                className={`btn-wallet ${walletStatus === "saved" ? "is-saved" : ""}`}
                onClick={handleSavePass}
                disabled={walletStatus === "processing"}
              >
                  {walletStatus === "processing" ? (
                    <><i className="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> {t.multazam.wallet_processing}</>
                  ) : walletStatus === "saved" ? (
                    <><i className="fa-solid fa-check" aria-hidden="true"></i> {t.multazam.wallet_saved}</>
                  ) : (
                    <><i className="fa-solid fa-download" aria-hidden="true"></i> {locale === "ar" ? "تحميل البطاقة (PNG)" : locale === "en" ? "Download Pass (PNG)" : "Unduh Tiket (PNG)"}</>
                  )}
              </button>
              )}
              <button type="button" className="btn-secondary" onClick={togglePanel}>
                  <i className="fa-solid fa-hands-praying" aria-hidden="true"></i> {t.multazam.multazam_wall}
              </button>
          </div>
      </div>

      <div className={`prayer-panel ${panelOpen ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label={t.multazam.multazam_wall} aria-hidden={!panelOpen}>
          <button type="button" className="btn-close-panel" onClick={togglePanel} aria-label={t.common.close}><i className="fa-solid fa-xmark" aria-hidden="true"></i></button>
          <div className="panel-title">{t.multazam.pray_header}</div>
          <form className="prayer-form" onSubmit={handlePrayerSubmit}>
              <label htmlFor="multazamPrayerInput" className="sr-only">{t.multazam.pray_header}</label>
              <textarea id="multazamPrayerInput" value={newPrayer} onChange={e => setNewPrayer(e.target.value)} rows={4} placeholder={t.multazam.pray_placeholder} required disabled={isSubmitting}></textarea>
              <button type="submit" className="btn-submit-prayer" disabled={isSubmitting || !newPrayer.trim()}>{isSubmitting ? t.multazam.pray_sending : t.multazam.pray_submit}</button>
          </form>

          <div className="panel-title" style={{ marginTop: '20px' }}>{t.multazam.hope_wall}</div>
          {prayers.length > 0 ? (
              prayers.map((p, idx) => (
                  <div key={p.id || idx} className="prayer-card">
                      <div className="prayer-date">{new Date(p.created_at).toLocaleDateString(dateLocale, {day: '2-digit', month: 'short', year: 'numeric'})}</div>
                      <div className="prayer-content">"{p.prayer_text}"</div>
                      <div className="prayer-status"><i className="fa-solid fa-check-double" aria-hidden="true" style={{ color: 'var(--gold-main)' }}></i> {p.status}</div>
                  </div>
              ))
          ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t.multazam.empty_prayers}</div>
          )}
      </div>
    </div>
  );
}

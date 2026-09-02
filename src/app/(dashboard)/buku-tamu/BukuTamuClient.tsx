"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/layout/AegisConfirm";
import "./buku-tamu.css";

export default function BukuTamuClient({ initialMessages, userId }: { initialMessages: any[], userId: string }) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();
  const { showAlert } = useConfirm();

  useEffect(() => {
    document.body.classList.add("page-buku-tamu");
    return () => {
      document.body.classList.remove("page-buku-tamu");
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim()) return;

      setIsSubmitting(true);
      const res = await fetch("/api/buku-tamu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: newMessage }),
      });

      if (res.ok) {
          const data = await res.json();
          setMessages([data, ...messages]);
          setNewMessage("");
          await showAlert("Berhasil", "Pesan buku tamu terkirim.");
      } else {
          await showAlert("Gagal", "Gagal mengirim pesan");
      }
      setIsSubmitting(false);
  };

  return (
    <div className="buku-tamu-wrapper">

      <Link href="/fitur" className="btn-back" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--gold-premium)', textDecoration: 'none', position: 'absolute', top: '40px', left: '20px' }}>
        <i className="fa-solid fa-arrow-left"></i> Kembali
      </Link>

      <h1 className="bt-title">Arsip Kehadiran</h1>
      <p className="bt-subtitle">Jejak Sejarah Yang Ditinggalkan Oleh Entitas Expedient</p>

      <form className="bt-form" onSubmit={handleSubmit}>
          <textarea 
            className="bt-textarea" 
            placeholder="Tuliskan pesan atau kesan Anda di sini..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isSubmitting}
          ></textarea>
          <div style={{ clear: 'both', overflow: 'hidden' }}>
            <button type="submit" className="bt-submit" disabled={isSubmitting || !newMessage.trim()}>
                {isSubmitting ? "Mengirim..." : "Kirim Pesan"}
            </button>
          </div>
      </form>

      <div className="msg-list">
          {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888', padding: '30px' }}>Belum ada pesan. Jadilah yang pertama mengisi buku tamu.</div>
          ) : (
              messages.map(msg => (
                  <div key={msg.id} className="msg-card">
                      <div className="msg-header">
                          <div className="msg-author">{msg.nama || msg.profiles?.nama_panggilan || 'Hamba Allah'}</div>
                          <div className="msg-date">{new Date(msg.created_at).toLocaleString('id-ID')}</div>
                      </div>
                      <div className="msg-body">"{msg.pesan || msg.message}"</div>
                  </div>
              ))
          )}
      </div>
    </div>
  );
}

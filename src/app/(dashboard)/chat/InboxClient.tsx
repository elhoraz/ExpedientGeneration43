"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function InboxClient({ 
  initialInbox, 
  userId 
}: { 
  initialInbox: any[]; 
  userId: string;
}) {
  const [inboxList, setInboxList] = useState<any[]>(initialInbox);
  const supabase = createClient();

  useEffect(() => {
    document.body.classList.add("page-chat");
    // Subscribe to new personal messages
    const channel = supabase
      .channel("inbox_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: "is_lounge=eq.false",
        },
        async (payload) => {
          const msg = payload.new;
          // Cek apakah pesan ini relevan dengan user
          if (msg.sender_id !== userId && msg.receiver_id !== userId) return;

          const isSender = msg.sender_id === userId;
          const contactId = isSender ? msg.receiver_id : msg.sender_id;

          setInboxList(prev => {
            const existingIdx = prev.findIndex(item => item.contact.id === contactId);
            
            if (existingIdx >= 0) {
              const updatedItem = { ...prev[existingIdx] };
              updatedItem.lastMessage = msg.message;
              updatedItem.lastTime = msg.created_at;
              if (!isSender && !msg.is_read) {
                updatedItem.unreadCount += 1;
              }
              // Move to top
              const newList = [...prev];
              newList.splice(existingIdx, 1);
              newList.unshift(updatedItem);
              return newList;
            } else {
              // Jika kontak baru, fetch profilnya
              fetchContactAndAdd(contactId, msg, isSender);
              return prev;
            }
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: "is_lounge=eq.false",
        },
        (payload) => {
          const msg = payload.new;
          if (msg.sender_id !== userId && msg.receiver_id !== userId) return;
          
          // Jika pesan dibaca, reset badge
          if (msg.is_read) {
            const contactId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
            setInboxList(prev => {
              const newList = [...prev];
              const idx = newList.findIndex(item => item.contact.id === contactId);
              if (idx >= 0 && msg.receiver_id === userId) {
                // If I am the receiver and I just read it, decrement unread count or reset
                // Usually we just read the whole conversation, so we can reset it to 0
                newList[idx].unreadCount = 0;
              }
              return newList;
            });
          }
        }
      )
      .subscribe();

    return () => {
      document.body.classList.remove("page-chat");
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const fetchContactAndAdd = async (contactId: string, msg: any, isSender: boolean) => {
    const { data: contact } = await supabase
      .from("profiles")
      .select("id, nama_panggilan, foto_profil")
      .eq("id", contactId)
      .single();

    if (contact) {
      setInboxList(prev => {
        if (prev.some(item => item.contact.id === contactId)) return prev;
        const newItem = {
          contact,
          lastMessage: msg.message,
          lastTime: msg.created_at,
          unreadCount: !isSender && !msg.is_read ? 1 : 0
        };
        return [newItem, ...prev];
      });
    }
  };

  return (
    <div className="inbox-list">
      {inboxList.length > 0 ? (
        inboxList.map((item) => {
          const avatarUrl = item.contact.foto_profil 
            ? `/uploads/profiles/${item.contact.foto_profil}` 
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.contact.nama_panggilan)}&background=d4af37&color=000`;
          
          return (
            <Link href={`/chat/personal/${item.contact.id}`} key={item.contact.id} className="inbox-item">
              <img src={avatarUrl} alt="Avatar" className="inbox-avatar" />
              <div className="inbox-content">
                <div className="inbox-top">
                  <h4>{item.contact.nama_panggilan}</h4>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {item.unreadCount > 0 && (
                      <span style={{ background: "#ff5555", color: "#fff", fontSize: "0.7rem", padding: "2px 6px", borderRadius: "10px", fontWeight: "bold" }}>
                        {item.unreadCount}
                      </span>
                    )}
                    <span className="inbox-time">
                      {new Date(item.lastTime).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
                <p className="inbox-preview">{item.lastMessage || "Membagikan gambar"}</p>
              </div>
            </Link>
          );
        })
      ) : (
        <div className="empty-state">
          <i className="fa-solid fa-ghost" style={{ fontSize: "3rem", color: "rgba(255,255,255,0.1)", marginBottom: "1rem", display: "block" }}></i>
          Belum ada obrolan personal. Cari kontak di <Link href="/direktori" style={{ color: "#d4af37" }}>Direktori</Link>.
        </div>
      )}
    </div>
  );
}

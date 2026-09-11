"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getAvatarUrl, getAvatarFallback } from "@/lib/avatar";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function InboxClient({ 
  initialInbox, 
  userId 
}: { 
  initialInbox: any[]; 
  userId: string;
}) {
  const { t, locale } = useLanguage();
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
            const existingIdx = prev.findIndex(item => item.contact?.id === contactId);
            
            if (existingIdx >= 0) {
              const updatedItem = { ...prev[existingIdx] };
              updatedItem.lastMessage = msg.message || (msg.image_url ? "📷" : "✉️");
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
          
          if (msg.is_read) {
            const contactId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
            setInboxList(prev => {
              const newList = [...prev];
              const idx = newList.findIndex(item => item.contact?.id === contactId);
              if (idx >= 0 && msg.receiver_id === userId) {
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
        if (prev.some(item => item.contact?.id === contactId)) return prev;
        const newItem = {
          contact,
          lastMessage: msg.message || (msg.image_url ? "📷" : "✉️"),
          lastTime: msg.created_at,
          unreadCount: !isSender && !msg.is_read ? 1 : 0
        };
        return [newItem, ...prev];
      });
    }
  };

  const dateLocale = locale === "ar" ? "ar-SA" : locale === "en" ? "en-US" : "id-ID";

  return (
    <div className="inbox-container">
      <div className="inbox-header">
        <div className="inbox-header-row">
          <div>
            <h1>{t.chat.inbox_title}</h1>
            <p>{t.chat.inbox_subtitle}</p>
          </div>
          <Link href="/direktori" className="inbox-btn-new">
            <i className="fa-solid fa-address-book"></i> {t.chat.new_contact}
          </Link>
        </div>
      </div>

      <div className="inbox-list">
        {inboxList.length > 0 ? (
          inboxList.map((item) => {
            const contactName = item.contact?.nama_panggilan || item.contact?.nama_lengkap || "Alumni";
            const avatarUrl = getAvatarUrl(item.contact?.foto_profil, contactName);
            
            return (
              <Link href={`/chat/personal/${item.contact?.id}`} key={item.contact?.id} className="inbox-item">
                <Image
                  src={avatarUrl}
                  alt={contactName}
                  width={54}
                  height={54}
                  className="inbox-avatar"
                  unoptimized={avatarUrl.startsWith("data:") || avatarUrl.includes("ui-avatars.com") || avatarUrl.includes("supabase.co")}
                />
                <div className="inbox-content">
                  <div className="inbox-top">
                    <h4>{contactName}</h4>
                    <div className="inbox-meta">
                      {item.unreadCount > 0 && (
                        <span className="inbox-badge">
                          {item.unreadCount}
                        </span>
                      )}
                      <span className="inbox-time">
                        {new Date(item.lastTime).toLocaleDateString(dateLocale, { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <p className="inbox-preview">{item.lastMessage || "📷"}</p>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="inbox-empty-state">
            <i className="fa-solid fa-ghost" style={{ fontSize: "2.8rem", color: "rgba(212,175,55,0.25)", marginBottom: "1rem", display: "block" }}></i>
            {t.chat.no_chats}{" "}
            <Link href="/direktori" style={{ color: "var(--gold-main, #d4af37)", fontWeight: 600 }}>
              {t.sidebar.directory}
            </Link>.
          </div>
        )}
      </div>
    </div>
  );
}

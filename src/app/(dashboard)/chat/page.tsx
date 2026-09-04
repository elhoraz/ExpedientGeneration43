import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAvatarUrl } from "@/lib/avatar";
import "./chat.css";

export const metadata = {
  title: "Inbox | Personal Chat",
};

export default async function ChatInboxPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Ambil daftar chat personal di mana user adalah pengirim atau penerima
  // Karena keterbatasan Supabase RPC, kita ambil pesan terakhir untuk setiap kontak,
  // tapi cara termudah di Next.js server adalah ambil semua personal chat user ini,
  // lalu di-group berdasarkan kontak.

  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select(`
      id, message, image_url, audio_url, video_url, message_type, created_at, sender_id, receiver_id, is_read,
      sender:profiles!sender_id(id, nama_panggilan, foto_profil),
      receiver:profiles!receiver_id(id, nama_panggilan, foto_profil)
    `)
    .eq("is_lounge", false)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  // Group by contact (the other person)
  const contactsMap = new Map();

  if (messages) {
    for (const msg of messages) {
      const isSender = msg.sender_id === user.id;
      const contact = (isSender ? msg.receiver : msg.sender) as any;
      
      if (!contact) continue;

      let previewText = msg.message;
      if (!previewText) {
        if (msg.audio_url || msg.message_type === 'voice') previewText = '🎤 Pesan Suara';
        else if (msg.video_url || msg.message_type === 'video_note') previewText = '📹 Video Note';
        else if (msg.image_url || msg.message_type === 'image') previewText = '📷 Gambar';
        else if (msg.message_type === 'call') previewText = '📞 Panggilan';
        else previewText = 'Pesan baru';
      }

      if (!contactsMap.has(contact.id)) {
        contactsMap.set(contact.id, {
          contact,
          lastMessage: previewText,
          lastTime: msg.created_at,
          unreadCount: 0
        });
      }

      // Hitung unread (jika pesan ini dikirim oleh kontak dan belum dibaca)
      if (!isSender && msg.is_read === false) {
        contactsMap.get(contact.id).unreadCount += 1;
      }
    }
  }

  const inboxList = Array.from(contactsMap.values());

  return (
    <div className="inbox-container">
      <div className="inbox-header">
        <div className="inbox-header-row">
          <div>
            <h1>Kotak Pesan</h1>
            <p>Obrolan privat terenkripsi antar entitas.</p>
          </div>
          <Link href="/direktori" className="inbox-btn-new">
            <i className="fa-solid fa-address-book"></i> Kontak Baru
          </Link>
        </div>
      </div>

      <div className="inbox-list">
        {inboxList.length > 0 ? (
          inboxList.map((item) => {
            const avatarUrl = getAvatarUrl(item.contact.foto_profil, item.contact.nama_panggilan || 'Alumni');
            
            return (
              <Link href={`/chat/personal/${item.contact.id}`} key={item.contact.id} className="inbox-item">
                <Image
                  src={avatarUrl}
                  alt={item.contact.nama_panggilan || "Avatar"}
                  width={54}
                  height={54}
                  className="inbox-avatar"
                  unoptimized={avatarUrl.startsWith("data:") || avatarUrl.includes("ui-avatars.com")}
                />
                <div className="inbox-content">
                  <div className="inbox-top">
                    <h4>{item.contact.nama_panggilan}</h4>
                    <div className="inbox-meta">
                      {item.unreadCount > 0 && (
                        <span className="inbox-badge">
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
          <div className="inbox-empty-state">
            <i className="fa-solid fa-ghost" style={{ fontSize: "2.8rem", color: "rgba(212,175,55,0.25)", marginBottom: "1rem", display: "block" }}></i>
            Belum ada obrolan personal. Cari kontak di <Link href="/direktori" style={{ color: "var(--gold-main, #d4af37)", fontWeight: 600 }}>Direktori</Link>.
          </div>
        )}
      </div>
    </div>
  );
}

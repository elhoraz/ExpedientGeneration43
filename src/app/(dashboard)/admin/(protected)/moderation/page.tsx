import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";
import "../admin.css";
import AdminLockBtn from "../../AdminLockBtn";

// Server Action for deleting content
import { deleteAdminContent } from "./actions";

export const metadata = {
  title: "Moderasi Konten - Expedient",
};

export default async function ModerationPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use Service Role to bypass RLS for Admin
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  // Fetch recent contents
  const [
    { data: chats },
    { data: majlisRaw },
    { data: syndicate },
    { data: bukuTamu },
  ] = await Promise.all([
    supabase
      .from("chat_messages")
      .select("id, message, created_at, is_deleted, sender:profiles(nama_panggilan)")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("majlis_topics")
      .select("id, title, status, created_at, created_by")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("syndicate")
      .select("id, nama_bisnis, kategori, created_at, owner:profiles(nama_panggilan)")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("buku_tamu")
      .select("id, nama, pesan, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Fetch creator names for majlis
  const majlisCreatorIds = Array.from(new Set(majlisRaw?.map((t: any) => t.created_by).filter(Boolean)));
  const majlisProfileMap = new Map<string, string>();
  if (majlisCreatorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nama_panggilan")
      .in("id", majlisCreatorIds);
    profiles?.forEach((p: any) => majlisProfileMap.set(p.id, p.nama_panggilan));
  }

  const majlis = (majlisRaw || []).map((t: any) => ({
    ...t,
    author_name: majlisProfileMap.get(t.created_by) || "Unknown",
  }));

  return (
    <div className="admin-wrapper">
      <div className="admin-header" style={{ position: "relative" , paddingRight: "160px"}}>
        <div style={{ position: "absolute", top: 0, right: 0, zIndex: 10 }}>
          <AdminLockBtn />
        </div>
        <h1 className="admin-title">Moderasi Konten</h1>
        <nav className="admin-nav">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/users">Users</Link>
          <Link href="/admin/moderation" className="active">Moderasi</Link>
          <Link href="/admin/announcements">Pengumuman</Link>
        </nav>
      </div>

      {/* CHAT MESSAGES */}
      <div className="mod-section">
        <div className="mod-title"><i className="fa-solid fa-comments"></i> Chat Terbaru</div>
        {chats && chats.length > 0 ? (
          chats.map((c) => (
            <div key={c.id} className={`mod-card ${c.is_deleted ? 'deleted' : ''}`}>
              <div className="mod-info">
                <div className="mod-author">{(c.sender as any)?.nama_panggilan || "Unknown"}</div>
                <div className="mod-text">{c.message}</div>
                <div className="mod-date">{new Date(c.created_at).toLocaleString('id-ID')}</div>
              </div>
              {!c.is_deleted ? (
                <form action={deleteAdminContent}>
                  <input type="hidden" name="type" value="chat" />
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" className="btn-del">
                    <i className="fa-solid fa-trash"></i> Hapus
                  </button>
                </form>
              ) : (
                <span style={{ fontSize: "0.7rem", color: "#ff5555" }}>DIHAPUS</span>
              )}
            </div>
          ))
        ) : (
          <div className="empty-state">Belum ada pesan chat.</div>
        )}
      </div>

      {/* MAJLIS TOPICS */}
      <div className="mod-section">
        <div className="mod-title"><i className="fa-solid fa-gavel"></i> Mosi Majlis</div>
        {majlis && majlis.length > 0 ? (
          majlis.map((t) => (
            <div key={t.id} className="mod-card">
              <div className="mod-info">
                <div className="mod-author">{t.author_name}</div>
                <div className="mod-text">{t.title}</div>
                <div className="mod-date">
                  {new Date(t.created_at).toLocaleString('id-ID')}
                  <span className={`mod-badge ${t.status === 'Open' ? 'mod-badge-open' : 'mod-badge-closed'}`}>
                    {t.status}
                  </span>
                </div>
              </div>
              <form action={deleteAdminContent}>
                <input type="hidden" name="type" value="majlis" />
                <input type="hidden" name="id" value={t.id} />
                <button type="submit" className="btn-del">
                  <i className="fa-solid fa-trash"></i> Hapus
                </button>
              </form>
            </div>
          ))
        ) : (
          <div className="empty-state">Belum ada mosi.</div>
        )}
      </div>

      {/* SYNDICATE */}
      <div className="mod-section">
        <div className="mod-title"><i className="fa-solid fa-briefcase"></i> Bisnis Syndicate</div>
        {syndicate && syndicate.length > 0 ? (
          syndicate.map((b) => (
            <div key={b.id} className="mod-card">
              <div className="mod-info">
                <div className="mod-author">{(b.owner as any)?.nama_panggilan || "Unknown"}</div>
                <div className="mod-text">{b.nama_bisnis} <span style={{ color: "var(--text-secondary)" }}>— {b.kategori}</span></div>
                <div className="mod-date">{new Date(b.created_at).toLocaleString('id-ID')}</div>
              </div>
              <form action={deleteAdminContent}>
                <input type="hidden" name="type" value="syndicate" />
                <input type="hidden" name="id" value={b.id} />
                <button type="submit" className="btn-del">
                  <i className="fa-solid fa-trash"></i> Hapus
                </button>
              </form>
            </div>
          ))
        ) : (
          <div className="empty-state">Belum ada bisnis.</div>
        )}
      </div>

      {/* BUKU TAMU */}
      <div className="mod-section">
        <div className="mod-title"><i className="fa-solid fa-book"></i> Buku Tamu</div>
        {bukuTamu && bukuTamu.length > 0 ? (
          bukuTamu.map((bt) => (
            <div key={bt.id} className="mod-card">
              <div className="mod-info">
                <div className="mod-author">{bt.nama}</div>
                <div className="mod-text">{bt.pesan}</div>
                <div className="mod-date">{new Date(bt.created_at).toLocaleString('id-ID')}</div>
              </div>
              <form action={deleteAdminContent}>
                <input type="hidden" name="type" value="bukutamu" />
                <input type="hidden" name="id" value={bt.id} />
                <button type="submit" className="btn-del">
                  <i className="fa-solid fa-trash"></i> Hapus
                </button>
              </form>
            </div>
          ))
        ) : (
          <div className="empty-state">Belum ada pesan buku tamu.</div>
        )}
      </div>
    </div>
  );
}

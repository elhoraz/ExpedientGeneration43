import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { deleteAnnouncement } from "./actions";
import Link from "next/link";
import "../admin.css";
import AdminLockBtn from "../../AdminLockBtn";

export const metadata = {
  title: "Pengumuman | Admin",
};

export default async function AnnouncementsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: announcements } = await supabase
    .from("announcements")
    .select("*, author:profiles(nama_panggilan)")
    .order("created_at", { ascending: false });

  return (
    <div className="admin-wrapper">
      <div className="admin-header" style={{ position: "relative", paddingRight: "160px" }}>
        <div style={{ position: "absolute", top: 0, right: 0, zIndex: 10 }}>
          <AdminLockBtn />
        </div>
        <div>
          <h1 className="admin-title">Kelola Pengumuman</h1>
          <nav className="admin-nav" style={{ marginTop: "10px" }}>
            <Link href="/admin">Dashboard</Link>
            <Link href="/admin/users">Users</Link>
            <Link href="/admin/moderation">Moderasi</Link>
            <Link href="/admin/cms">CMS Strings</Link>
          </nav>
        </div>
        <Link href="/admin/announcements/create" className="btn-create hover-trigger">
          <i className="fa-solid fa-plus"></i> Buat Baru
        </Link>
      </div>

      <div className="table-panel">
        {announcements && announcements.length > 0 ? (
          <>
            {/* DESKTOP TABLE */}
            <div className="cms-table-wrapper">
              <table className="announcement-table">
                <thead>
                  <tr>
                    <th>Judul</th>
                    <th>Kategori</th>
                    <th>Tanggal</th>
                    <th>Pin</th>
                    <th style={{ textAlign: "right" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((a) => (
                    <tr key={a.id}>
                      <td><div className="ann-title">{a.title}</div></td>
                      <td>
                        <span className={`ann-category cat-${a.category}`}>
                          {a.category}
                        </span>
                      </td>
                      <td className="ann-date">{new Date(a.published_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td>
                        {a.is_pinned ? (
                          <i className="fa-solid fa-thumbtack ann-pinned"></i>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={{ textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <Link href={`/admin/announcements/edit/${a.id}`} className="btn-action btn-edit-action hover-trigger">
                          <i className="fa-solid fa-pen"></i> Edit
                        </Link>
                        <form action={deleteAnnouncement} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={a.id} />
                          <button type="submit" className="btn-action btn-delete-action hover-trigger">
                            <i className="fa-solid fa-trash"></i> Hapus
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="ann-mobile-card-list">
              {announcements.map((a) => (
                <div key={a.id} className="ann-mobile-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.4 }}>
                      {a.is_pinned && <i className="fa-solid fa-thumbtack ann-pinned" style={{ marginRight: "6px" }}></i>}
                      {a.title}
                    </div>
                    <span className={`ann-category cat-${a.category}`} style={{ fontSize: "0.65rem", padding: "2px 8px", flexShrink: 0 }}>
                      {a.category}
                    </span>
                  </div>

                  <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                    <i className="fa-regular fa-calendar" style={{ marginRight: "5px" }}></i>
                    {new Date(a.published_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "4px" }}>
                    <Link href={`/admin/announcements/edit/${a.id}`} className="btn-action btn-edit-action hover-trigger" style={{ textAlign: "center", justifyContent: "center", display: "flex", alignItems: "center", gap: "6px" }}>
                      <i className="fa-solid fa-pen"></i> Edit
                    </Link>
                    <form action={deleteAnnouncement} style={{ width: "100%" }}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="btn-action btn-delete-action hover-trigger" style={{ width: "100%", textAlign: "center", justifyContent: "center", display: "flex", alignItems: "center", gap: "6px" }}>
                        <i className="fa-solid fa-trash"></i> Hapus
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <i className="fa-solid fa-bullhorn" style={{ fontSize: "3rem", color: "rgba(212,175,55,0.3)", marginBottom: "20px", display: "block" }}></i>
            <p>Belum ada pengumuman. Buat pengumuman pertama!</p>
          </div>
        )}
      </div>
    </div>
  );
}

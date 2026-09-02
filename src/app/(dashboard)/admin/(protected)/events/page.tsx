import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { broadcastWhatsAppMessage } from "@/lib/whatsapp";
import Link from "next/link";
import AdminLockBtn from "../../AdminLockBtn";
import "../admin.css";

export const metadata = {
  title: "Event Manager | Admin",
};

// Server Actions inline
async function addEvent(formData: FormData) {
  "use server";
  const cookieStore = await cookies();
  if (cookieStore.get("expedient_admin_session")?.value !== "unlocked") throw new Error("Unauthorized");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const event_date = formData.get("event_date") as string;

  if (title && event_date) {
    await supabase.from("events").insert([{ title, description, event_date }]);
    
    // Notifications
    const { data: profiles } = await supabase.from("profiles").select("id, no_whatsapp");
    if (profiles && profiles.length > 0) {
      const notifs = profiles.map(p => ({
        user_id: p.id,
        title: `Acara Baru: ${title}`,
        message: `Admin telah menjadwalkan acara baru pada ${new Date(event_date).toLocaleString("id-ID")}.`,
        link: "/beranda",
      }));
      await supabase.from("notifications").insert(notifs);

      const waTargets = profiles.map(p => p.no_whatsapp).filter(Boolean);
      if (waTargets.length > 0) {
        const waMessage = `📅 *Undangan Acara Baru*\n\n*${title}*\nTanggal: ${new Date(event_date).toLocaleString("id-ID")}\n\n${description ? `Detail: ${description}\n\n` : ''}Jangan lewatkan acara ini. Silakan cek detailnya di Sovereign Nexus.`;
        await broadcastWhatsAppMessage(waTargets as string[], waMessage);
      }
    }

    revalidatePath("/admin/events");
  }
}

async function deleteEvent(formData: FormData) {
  "use server";
  const cookieStore = await cookies();
  if (cookieStore.get("expedient_admin_session")?.value !== "unlocked") throw new Error("Unauthorized");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const id = formData.get("id") as string;
  if (id) {
    await supabase.from("events").delete().eq("id", id);
    revalidatePath("/admin/events");
  }
}

export default async function EventsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: true });

  return (
    <div className="admin-wrapper" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      
      <div className="admin-header" style={{ position: "relative", marginBottom: "30px", paddingRight: "160px" }}>
        <div style={{ position: "absolute", top: 0, right: 0, zIndex: 10 }}>
          <AdminLockBtn />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(106, 90, 205, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", color: "#8a2be2" }}>
                <i className="fa-solid fa-calendar-star"></i>
            </div>
            <div>
                <h1 className="admin-title" style={{ marginBottom: "0", fontSize: "1.4rem" }}>Event Manager</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", margin: "4px 0 0 0", letterSpacing: "1px", textTransform: "uppercase" }}>Kelola agenda & kegiatan angkatan</p>
            </div>
        </div>
        <nav className="admin-nav" style={{ marginTop: "15px" }}>
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/users">Users</Link>
          <Link href="/admin/events" className="active">Events</Link>
          <Link href="/admin/wallet-generator">Wallet</Link>
        </nav>
      </div>

      <div className="form-panel" style={{ marginBottom: "35px" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "10px" }}>
          <i className="fa-solid fa-calendar-plus" style={{ color: "#8a2be2" }}></i> Tambah Acara Baru
        </h2>
        <form action={addEvent} style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ display: "block", marginBottom: "6px", color: "var(--text-secondary)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px" }}>Nama Acara</label>
            <input type="text" name="title" required placeholder="Contoh: Gala Dinner 2027" style={{ width: "100%", padding: "10px 14px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--glass-border)", color: "#fff", borderRadius: "10px", outline: "none", fontSize: "0.85rem" }} />
          </div>
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ display: "block", marginBottom: "6px", color: "var(--text-secondary)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px" }}>Tanggal & Waktu</label>
            <input type="datetime-local" name="event_date" required style={{ width: "100%", padding: "10px 14px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--glass-border)", color: "#fff", borderRadius: "10px", outline: "none", fontSize: "0.85rem" }} />
          </div>
          <div style={{ flex: "2 1 260px" }}>
            <label style={{ display: "block", marginBottom: "6px", color: "var(--text-secondary)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px" }}>Deskripsi Singkat</label>
            <input type="text" name="description" placeholder="Deskripsi atau lokasi acara..." style={{ width: "100%", padding: "10px 14px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--glass-border)", color: "#fff", borderRadius: "10px", outline: "none", fontSize: "0.85rem" }} />
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <button type="submit" style={{ width: "100%", padding: "10px 16px", background: "linear-gradient(135deg, #8a2be2, #4b0082)", border: "none", color: "#fff", borderRadius: "10px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", letterSpacing: "1px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }} className="hover-trigger">
               <i className="fa-solid fa-paper-plane"></i> Publikasikan
            </button>
          </div>
        </form>
        <div style={{ marginTop: "12px", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
          *Menyimpan acara baru otomatis mengirimkan notifikasi ke seluruh anggota (In-App & WhatsApp).
        </div>
      </div>

      <div className="table-panel">
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1rem", margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }}>
            <i className="fa-solid fa-list-ul" style={{ color: "var(--text-secondary)" }}></i> Daftar Agenda Acara
          </h2>
          <span style={{ background: "rgba(138,43,226,0.15)", color: "#8a2be2", padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700 }}>
            {events?.length || 0} Total
          </span>
        </div>

        {events && events.length > 0 ? (
          <>
            {/* DESKTOP TABLE */}
            <div className="cms-table-wrapper">
              <table className="cms-table">
                <thead>
                  <tr>
                    <th style={{ width: "30%" }}>Informasi Acara</th>
                    <th style={{ width: "20%" }}>Jadwal</th>
                    <th style={{ width: "35%" }}>Deskripsi</th>
                    <th style={{ width: "15%", textAlign: "center" }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => {
                     const eventDate = new Date(e.event_date);
                     const isPast = eventDate < new Date();
                     return (
                    <tr key={e.id} style={{ opacity: isPast ? 0.6 : 1 }}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                           <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: isPast ? "rgba(255,255,255,0.05)" : "rgba(138,43,226,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: isPast ? "#666" : "#8a2be2" }}>
                             <i className="fa-regular fa-calendar"></i>
                           </div>
                           <div>
                              <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>{e.title}</div>
                              <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "3px" }}>
                                 {isPast ? "Selesai" : "Akan Datang"}
                              </div>
                           </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ color: "var(--text-primary)", fontSize: "0.85rem" }}>{eventDate.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginTop: "2px" }}>{eventDate.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB</div>
                      </td>
                      <td>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "250px" }}>
                           {e.description || "-"}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          <Link href={`/admin/events/${e.id}/manage`} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-primary)", width: "36px", height: "36px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", transition: "all 0.2s" }} className="hover-trigger" title="Kehadiran / Tiket">
                            <i className="fa-solid fa-users-viewfinder"></i>
                          </Link>
                          <form action={deleteEvent}>
                            <input type="hidden" name="id" value={e.id} />
                            <button type="submit" style={{ background: "rgba(255,51,102,0.1)", border: "1px solid rgba(255,51,102,0.2)", color: "#ff3366", width: "36px", height: "36px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }} className="hover-trigger" title="Hapus Acara">
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>

            {/* MOBILE EVENT CARDS */}
            <div className="ann-mobile-card-list" style={{ padding: "14px" }}>
              {events.map((e) => {
                const eventDate = new Date(e.event_date);
                const isPast = eventDate < new Date();
                return (
                  <div key={e.id} className="ann-mobile-card" style={{ opacity: isPast ? 0.65 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>{e.title}</div>
                      <span style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: "10px", background: isPast ? "rgba(255,255,255,0.05)" : "rgba(138,43,226,0.15)", color: isPast ? "#888" : "#8a2be2", fontWeight: 700 }}>
                        {isPast ? "Selesai" : "Akan Datang"}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <i className="fa-regular fa-calendar"></i>
                      <span>{eventDate.toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })} · {eventDate.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB</span>
                    </div>

                    {e.description && (
                      <div style={{ fontSize: "0.8rem", color: "var(--text-primary)", lineHeight: 1.4 }}>
                        {e.description}
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px", marginTop: "4px" }}>
                      <Link href={`/admin/events/${e.id}/manage`} className="btn-action btn-edit-action hover-trigger" style={{ textAlign: "center", justifyContent: "center", display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px" }}>
                        <i className="fa-solid fa-users-viewfinder"></i> Kelola RSVP & Tiket
                      </Link>
                      <form action={deleteEvent}>
                        <input type="hidden" name="id" value={e.id} />
                        <button type="submit" className="btn-action btn-delete-action hover-trigger" style={{ padding: "8px 12px" }}>
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto", color: "var(--text-muted)", fontSize: "2rem" }}>
              <i className="fa-regular fa-calendar-xmark"></i>
            </div>
            <h3 style={{ color: "var(--text-primary)", fontSize: "1.1rem", margin: "0 0 8px 0" }}>Belum Ada Agenda</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", maxWidth: "400px", margin: "0 auto" }}>Agenda acara The Syndicate yang Anda tambahkan akan muncul di sini dan otomatis di-broadcast ke seluruh anggota.</p>
          </div>
        )}
      </div>

    </div>
  );
}

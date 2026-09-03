import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminLockBtn from "../../../../AdminLockBtn";
import "../../../../admin.css";

export const metadata = {
  title: "Kelola Tiket | Admin",
};

async function assignTicket(formData: FormData) {
  "use server";
  const cookieStore = await cookies();
  if (cookieStore.get("expedient_admin_session")?.value !== "unlocked") throw new Error("Unauthorized");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const event_id = formData.get("event_id") as string;
  const user_id = formData.get("user_id") as string;
  const seat_number = formData.get("seat_number") as string;

  if (event_id && user_id && seat_number) {
    const ticket_code = `TKT-${event_id.split("-")[0]}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const { error } = await supabase.from("event_tickets").insert([{
      event_id,
      user_id,
      seat_number,
      ticket_code
    }]);

    if (error) {
      console.error("Failed to assign ticket:", error);
    }
    
    revalidatePath(`/admin/events/${event_id}/manage`);
  }
}

async function deleteTicket(formData: FormData) {
  "use server";
  const cookieStore = await cookies();
  if (cookieStore.get("expedient_admin_session")?.value !== "unlocked") throw new Error("Unauthorized");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const id = formData.get("id") as string;
  const event_id = formData.get("event_id") as string;

  if (id) {
    await supabase.from("event_tickets").delete().eq("id", id);
    revalidatePath(`/admin/events/${event_id}/manage`);
  }
}

export default async function EventManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { data: event } = await supabase.from("events").select("*").eq("id", id).single();
  
  if (!event) {
    redirect("/admin/events");
  }

  const { data: users } = await supabase.from("profiles").select("id, nama_panggilan, role").order("nama_panggilan", { ascending: true });
  
  const { data: tickets } = await supabase
    .from("event_tickets")
    .select("*, profiles(nama_panggilan)")
    .eq("event_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="admin-wrapper" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      
      <div className="admin-header" style={{ position: "relative", marginBottom: "30px", paddingRight: "160px" }}>
        <div style={{ position: "absolute", top: 0, right: 0, zIndex: 10 }}>
          <AdminLockBtn />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(138,43,226,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", color: "#8a2be2" }}>
                <i className="fa-solid fa-ticket"></i>
            </div>
            <div>
                <h1 className="admin-title" style={{ marginBottom: "0", fontSize: "1.4rem" }}>Kelola Tiket</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", margin: "4px 0 0 0", letterSpacing: "1px", textTransform: "uppercase" }}>Acara: {event.title}</p>
            </div>
        </div>
        <nav className="admin-nav" style={{ marginTop: "15px" }}>
          <Link href="/admin/events"><i className="fa-solid fa-arrow-left"></i> Kembali ke Events</Link>
          <Link href={`/admin/events/${event.id}/manage`} className="active">Kelola Kehadiran</Link>
        </nav>
      </div>

      <div className="form-panel" style={{ marginBottom: "35px" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "10px" }}>
          <i className="fa-solid fa-address-card" style={{ color: "#8a2be2" }}></i> Terbitkan Tiket (Assign Seat)
        </h2>
        <form action={assignTicket} style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <input type="hidden" name="event_id" value={event.id} />
          
          <div style={{ flex: "2 1 240px" }}>
            <label style={{ display: "block", marginBottom: "6px", color: "var(--text-secondary)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px" }}>Peserta (User)</label>
            <select name="user_id" required style={{ width: "100%", padding: "10px 14px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--glass-border)", color: "var(--text-primary)", borderRadius: "10px", outline: "none", fontSize: "0.85rem" }}>
              <option value="" disabled selected>-- Pilih Entitas Peserta --</option>
              {users?.map(u => (
                <option key={u.id} value={u.id}>{u.nama_panggilan} ({u.role})</option>
              ))}
            </select>
          </div>
          
          <div style={{ flex: "1 1 140px" }}>
            <label style={{ display: "block", marginBottom: "6px", color: "var(--text-secondary)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px" }}>Nomor Kursi/Zona</label>
            <input type="text" name="seat_number" placeholder="Contoh: VIP-A1" required style={{ width: "100%", padding: "10px 14px", background: "var(--bg-secondary)", border: "1px solid var(--glass-border)", color: "var(--text-primary)", borderRadius: "10px", outline: "none", fontSize: "0.85rem" }} />
          </div>
          
          <div style={{ flex: "1 1 140px" }}>
            <button type="submit" style={{ width: "100%", padding: "10px 16px", background: "linear-gradient(135deg, #8a2be2, #4b0082)", border: "none", color: "#fff", borderRadius: "10px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", letterSpacing: "1px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }} className="hover-trigger">
               <i className="fa-solid fa-plus"></i> Simpan Tiket
            </button>
          </div>
        </form>
      </div>

      <div className="table-panel">
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1rem", margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }}>
            <i className="fa-solid fa-ticket-simple" style={{ color: "var(--text-secondary)" }}></i> Daftar Tiket Terbit
          </h2>
          <span style={{ background: "rgba(138,43,226,0.15)", color: "#8a2be2", padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700 }}>
            {tickets?.length || 0} Tiket
          </span>
        </div>

        {tickets && tickets.length > 0 ? (
          <>
            {/* DESKTOP TABLE */}
            <div className="cms-table-wrapper">
              <table className="cms-table">
                <thead>
                  <tr>
                    <th style={{ width: "25%" }}>Kode Tiket</th>
                    <th style={{ width: "30%" }}>Peserta</th>
                    <th style={{ width: "20%" }}>Kursi/Zona</th>
                    <th style={{ width: "15%" }}>Status</th>
                    <th style={{ width: "10%", textAlign: "center" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", color: "#d4af37", display: "inline-block", padding: "4px 10px", borderRadius: "6px", fontFamily: "monospace", fontSize: "0.8rem", letterSpacing: "1px" }}>
                          {t.ticket_code}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                          {t.profiles?.nama_panggilan || 'Anonim'}
                        </div>
                      </td>
                      <td>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                          {t.seat_number}
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          background: t.status === 'valid' ? 'rgba(37,211,102,0.15)' : 'rgba(255,51,102,0.15)',
                          color: t.status === 'valid' ? '#25d366' : '#ff3366',
                          padding: "4px 10px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", display: "inline-block"
                        }}>
                          {t.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <form action={deleteTicket}>
                            <input type="hidden" name="id" value={t.id} />
                            <input type="hidden" name="event_id" value={event.id} />
                            <button type="submit" style={{ background: "rgba(255,51,102,0.1)", border: "1px solid rgba(255,51,102,0.2)", color: "#ff3366", width: "36px", height: "36px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }} className="hover-trigger" title="Hapus Tiket">
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE TICKET CARDS */}
            <div className="ann-mobile-card-list" style={{ padding: "14px" }}>
              {tickets.map((t) => (
                <div key={t.id} className="ann-mobile-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                      {t.profiles?.nama_panggilan || 'Anonim'}
                    </div>
                    <span style={{ 
                      background: t.status === 'valid' ? 'rgba(37,211,102,0.15)' : 'rgba(255,51,102,0.15)',
                      color: t.status === 'valid' ? '#25d366' : '#ff3366',
                      padding: "3px 8px", borderRadius: "20px", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase"
                    }}>
                      {t.status}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem" }}>
                    <span style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", color: "#d4af37", padding: "2px 8px", borderRadius: "6px", fontFamily: "monospace", fontSize: "0.75rem" }}>
                      {t.ticket_code}
                    </span>
                    <span style={{ color: "var(--text-secondary)" }}>
                      Kursi: <strong style={{ color: "var(--text-primary)" }}>{t.seat_number}</strong>
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                    <form action={deleteTicket}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="event_id" value={event.id} />
                      <button type="submit" className="btn-action btn-delete-action hover-trigger" style={{ padding: "6px 12px", fontSize: "0.75rem" }}>
                        <i className="fa-solid fa-trash-can"></i> Hapus Tiket
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto", color: "var(--text-muted)", fontSize: "2rem" }}>
              <i className="fa-solid fa-ticket-simple" style={{ opacity: 0.5 }}></i>
            </div>
            <h3 style={{ color: "var(--text-primary)", fontSize: "1.1rem", margin: "0 0 8px 0" }}>Belum Ada Tiket Terbit</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", maxWidth: "400px", margin: "0 auto" }}>Silakan tambahkan partisipan (user) ke dalam daftar kehadiran acara ini di form atas.</p>
          </div>
        )}
      </div>

    </div>
  );
}

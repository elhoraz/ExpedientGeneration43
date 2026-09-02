import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import "./admin.css";
import AdminLockBtn from "./AdminLockBtn";

export const metadata = {
  title: "Command Center - Expedient",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }


  // Get some stats
  const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
  const { count: activeCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_active", true);
  const { count: wasiatCount } = await supabase.from("wasiats").select("*", { count: "exact", head: true });
  
  // Get activity logs
  const { data: logs } = await supabase
    .from("activity_logs")
    .select("*, profiles(nama_panggilan)")
    .order("created_at", { ascending: false })
    .limit(15);

  return (
    <div className="admin-wrapper">
      <div className="admin-header" style={{ position: "relative" , paddingRight: "160px"}}>
        <div style={{ position: "absolute", top: 0, right: 0, zIndex: 10 }}>
          <AdminLockBtn />
        </div>
        <h1 className="admin-title">Command Center</h1>
        <p className="admin-subtitle">Otoritas Analitik & Pantauan Sentral</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-value">{userCount || 0}</div>
          <div className="metric-label">Total Entitas Terdaftar</div>
        </div>
        <div className="metric-card" style={{ transitionDelay: "0.1s" }}>
          <div className="metric-value">{activeCount || 0}</div>
          <div className="metric-label">Entitas Aktif Berprestise</div>
        </div>
        <div className="metric-card" style={{ transitionDelay: "0.2s" }}>
          <div className="metric-value">{wasiatCount || 0}</div>
          <div className="metric-label">Wasiat Terarsip</div>
        </div>
      </div>

      <h2 className="panel-title" style={{ marginTop: "50px" }}>Akses Kontrol Sistem</h2>
      <div className="metrics-grid" style={{ marginBottom: "50px" }}>
        <Link href="/admin/cms" style={{ textDecoration: "none" }}>
          <div className="metric-card hover-glow-gold" style={{ transitionDelay: "0.15s", borderColor: "rgba(212,175,55,0.4)", background: "linear-gradient(135deg, rgba(212,175,55,0.05), transparent)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <div className="metric-value" style={{ fontSize: "2.5rem", color: "#d4af37" }}><i className="fa-solid fa-wand-magic-sparkles"></i></div>
            <div className="metric-label" style={{ color: "#d4af37", fontWeight: "bold" }}>Web Content Editor</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "10px" }}>Ubah gambar, teks & desain web (CMS)</div>
          </div>
        </Link>
        <Link href="/admin/announcements" style={{ textDecoration: "none" }}>
          <div className="metric-card hover-glow-emerald" style={{ transitionDelay: "0.1s", borderColor: "rgba(0, 255, 136, 0.4)", background: "linear-gradient(135deg, rgba(0, 255, 136, 0.05), transparent)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <div className="metric-value" style={{ fontSize: "2.5rem", color: "#00ff88" }}><i className="fa-solid fa-bullhorn"></i></div>
            <div className="metric-label" style={{ color: "#00ff88", fontWeight: "bold" }}>Pengumuman Global</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "10px" }}>Atur mosi & informasi sentral</div>
          </div>
        </Link>
        <Link href="/admin/users" style={{ textDecoration: "none" }}>
          <div className="metric-card hover-glow-gold" style={{ transitionDelay: "0.2s", borderColor: "rgba(212,175,55,0.4)", background: "linear-gradient(135deg, rgba(212,175,55,0.05), transparent)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <div className="metric-value" style={{ fontSize: "2.5rem" }}><i className="fa-solid fa-users-gear"></i></div>
            <div className="metric-label" style={{ color: "#d4af37", fontWeight: "bold" }}>Manajemen Entitas</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "10px" }}>Kelola peran & status akun pengguna</div>
          </div>
        </Link>
        <Link href="/admin/broadcast" style={{ textDecoration: "none" }}>
          <div className="metric-card hover-glow-emerald" style={{ transitionDelay: "0.3s", borderColor: "rgba(0, 255, 136, 0.4)", background: "linear-gradient(135deg, rgba(0, 255, 136, 0.05), transparent)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <div className="metric-value" style={{ fontSize: "2.5rem", color: "#00ff88" }}><i className="fa-brands fa-whatsapp"></i></div>
            <div className="metric-label" style={{ color: "#00ff88", fontWeight: "bold" }}>Siaran WhatsApp</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "10px" }}>Kirim instruksi massal (Broadcast)</div>
          </div>
        </Link>
        <Link href="/admin/wallet-generator" style={{ textDecoration: "none" }}>
          <div className="metric-card hover-glow-cyan" style={{ transitionDelay: "0.4s", borderColor: "rgba(0, 191, 255, 0.4)", background: "linear-gradient(135deg, rgba(0, 191, 255, 0.05), transparent)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <div className="metric-value" style={{ fontSize: "2.5rem", color: "#00bfff" }}><i className="fa-solid fa-wallet"></i></div>
            <div className="metric-label" style={{ color: "#00bfff", fontWeight: "bold" }}>Sovereign Wallet</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "10px" }}>Cetak dan terbitkan aset digital</div>
          </div>
        </Link>
        <Link href="/admin/events" style={{ textDecoration: "none" }}>
          <div className="metric-card hover-glow-gold" style={{ transitionDelay: "0.5s", borderColor: "rgba(255, 215, 0, 0.4)", background: "linear-gradient(135deg, rgba(255, 215, 0, 0.05), transparent)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <div className="metric-value" style={{ fontSize: "2.5rem", color: "#ffd700" }}><i className="fa-solid fa-ticket-simple"></i></div>
            <div className="metric-label" style={{ color: "#ffd700", fontWeight: "bold" }}>Manajemen Event</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "10px" }}>Kelola acara dan pantau RSVP</div>
          </div>
        </Link>
        <Link href="/admin/export" style={{ textDecoration: "none" }}>
          <div className="metric-card hover-glow-danger" style={{ transitionDelay: "0.6s", borderColor: "rgba(255, 51, 102, 0.4)", background: "linear-gradient(135deg, rgba(255, 51, 102, 0.05), transparent)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <div className="metric-value" style={{ fontSize: "2.5rem", color: "#ff3366" }}><i className="fa-solid fa-file-csv"></i></div>
            <div className="metric-label" style={{ color: "#ff3366", fontWeight: "bold" }}>Ekspor Data</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "10px" }}>Unduh direktori & arsip sistem</div>
          </div>
        </Link>
      </div>

      <div className="charts-grid">
        <div className="chart-panel" style={{ transitionDelay: "0.3s" }}>
          <h2 className="panel-title"><i className="fa-solid fa-clock-rotate-left"></i> Activity Timeline</h2>
          <div style={{ height: "350px", overflowY: "auto", paddingRight: "10px" }}>
            {logs?.map(log => (
              <div key={log.id} className="log-item">
                <div className="log-time">{new Date(log.created_at).toLocaleString('id-ID')}</div>
                <div className="log-action">{log.profiles?.nama_panggilan || "Unknown"} <span style={{ color: "var(--text-primary)", fontWeight: "normal" }}>— {log.action}</span></div>
                <div className="log-desc">{log.details}</div>
              </div>
            ))}
            {(!logs || logs.length === 0) && (
              <div style={{ color: "var(--text-secondary)", textAlign: "center", marginTop: "20px" }}>Belum ada aktivitas terekam.</div>
            )}
          </div>
        </div>

        <div className="chart-panel" style={{ transitionDelay: "0.4s" }}>
          <h2 className="panel-title"><i className="fa-solid fa-shield-halved"></i> Protokol Keamanan</h2>
          <div style={{ padding: "10px 0" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: "1.6" }}>
              Panel eksklusif ini diproteksi oleh lapisan *Server-Side Rendering* (SSR) dengan kebijakan *Role-Based Access Control* tingkat 'admin'. 
              <br/><br/>
              Semua transaksi dan perubahan data di dalam panel ini secara otomatis dicatat dalam buku besar *Activity Logs* yang tidak dapat dihapus, menjamin akuntabilitas penuh bagi anggota *High Council*.
            </p>
            <div style={{ marginTop: "30px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 10px #00ff88" }}></div>
              <span style={{ color: "#00ff88", fontSize: "0.8rem", fontWeight: "bold", letterSpacing: "1px" }}>SYSTEM SECURE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useConfirm } from "@/components/layout/AegisConfirm";
import "../admin.css";
import AdminLockBtn from "../../AdminLockBtn";

type BroadcastUser = {
  id: string;
  role?: string | null;
  no_whatsapp?: string | null;
  nama_panggilan?: string | null;
  nama_lengkap?: string | null;
};

type BroadcastLog = {
  status: string | null;
  to_number: string | null;
  to_name: string | null;
  message: string | null;
  error_message: string | null;
  sent_at: string | null;
  attempts: number;
  max_attempts: number;
};

const getErrorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Terjadi kesalahan server.";

export default function BroadcastClient({ initialUsers }: { initialUsers: BroadcastUser[] }) {
  useEffect(() => {
    document.body.classList.add("page-admin");
    return () => {
      document.body.classList.remove("page-admin");
    };
  }, []);

  const [targetRole, setTargetRole] = useState("all");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [logs, setLogs] = useState<BroadcastLog[]>([]);
  const [stats, setStats] = useState({ total: 0, sent: 0, pending: 0, failed: 0 });
  const [fonnteStatus, setFonnteStatus] = useState<"checking" | "ok" | "error">("checking");
  const [fonnteMessage, setFonnteMessage] = useState("Memeriksa koneksi ke Fonnte...");
  
  const { showAlert } = useConfirm();

  useEffect(() => {
    // Initial fetch for stats and fonnte status
    fetchStats();
    checkFonnteStatus();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/broadcast/stats");
      if (res.ok) {
        const data = await res.json();
        const payload = data.data || data;
        setStats(payload.stats || { total: 0, sent: 0, pending: 0, failed: 0 });
        setLogs(payload.recent_logs || []);
      }
    } catch (err) {
      console.error("Failed to fetch broadcast stats", err);
    }
  };

  const checkFonnteStatus = async () => {
    setFonnteStatus("checking");
    setFonnteMessage("Memeriksa koneksi ke Fonnte...");
    try {
      const res = await fetch("/api/admin/broadcast/diagnose");
      const data = await res.json();
      const payload = data.data || data;
      if (payload.api_ok) {
        setFonnteStatus("ok");
        setFonnteMessage(`✅ Terhubung · Device: ${payload.reason || 'OK'}`);
      } else {
        setFonnteStatus("error");
        setFonnteMessage(`❌ Gagal · ${payload.reason || payload.raw_response || data.message || 'Unknown error'}`);
      }
    } catch {
      setFonnteStatus("error");
      setFonnteMessage("⚠ Error · Tidak bisa reach endpoint diagnostik");
    }
  };

  const getTargetUsers = () => {
      if (targetRole === "all") return initialUsers;
      return initialUsers.filter(u => u.role === targetRole);
  };

  const targetUsers = getTargetUsers();

  const handleBroadcast = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!message || targetUsers.length === 0) return;

      setIsSending(true);

      try {
        const res = await fetch("/api/admin/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetRole, message })
        });
        
        const result = await res.json();
        
        const payload = result.data || result;
        if (res.ok && result.status !== "error") {
          await showAlert("Berhasil", `Dimasukkan ke Antrean: ${payload.queued}, Gagal: ${payload.failed}`);
          setMessage("");
          fetchStats(); // Refresh stats after queuing
        } else {
          await showAlert("Gagal", `Kesalahan Gateway: ${result.message || result.error}`);
        }
      } catch (err: unknown) {
        await showAlert("Error", `Gagal menghubungi server: ${getErrorMessage(err)}`);
      } finally {
        setIsSending(false);
      }
  };

  return (
    <div className="admin-wrapper" style={{ padding: "clamp(80px, 15vh, 120px) 20px 40px", maxWidth: "1200px", margin: "0 auto" }}>
      <div className="admin-header" style={{ position: "relative", marginBottom: "40px" , paddingRight: "160px"}}>
        <div style={{ position: "absolute", top: 0, right: 0, zIndex: 10 }}>
          <AdminLockBtn />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "rgba(37,211,102,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", color: "#25d366" }}>
                <i className="fa-brands fa-whatsapp"></i>
            </div>
            <div>
                <h1 className="admin-title" style={{ marginBottom: "0", fontSize: "1.5rem" }}>WhatsApp Broadcast</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: "4px 0 0 0", letterSpacing: "1px", textTransform: "uppercase" }}>Kelola antrian notifikasi alumni</p>
            </div>
        </div>
        <nav className="admin-nav" style={{ marginTop: "15px" }}>
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/users">Users</Link>
          <Link href="/admin/broadcast" className="active">Broadcast</Link>
        </nav>
      </div>

      {/* Fonnte Connection Status Panel */}
      <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "18px 24px", marginBottom: "32px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ 
              width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0, transition: "background 0.3s",
              background: fonnteStatus === 'checking' ? '#888' : fonnteStatus === 'ok' ? '#25d366' : '#ff3366',
              animation: fonnteStatus === 'checking' ? 'pulse 1s infinite' : 'none'
          }}></div>
          <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>Status Koneksi Fonnte API</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "3px" }}>{fonnteMessage}</div>
          </div>
          <button onClick={checkFonnteStatus} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)", padding: "6px 14px", borderRadius: "8px", fontSize: "0.72rem", cursor: "pointer", whiteSpace: "nowrap" }} className="hover-trigger">
              <i className="fa-solid fa-rotate-right" style={{ marginRight: "5px" }}></i>Cek Ulang
          </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", marginBottom: "30px" }}>
          <div style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", borderRadius: "16px", padding: "18px 14px", textAlign: "center" }}>
              <i className="fa-solid fa-list" style={{ color: "#d4af37", fontSize: "1.3rem", marginBottom: "8px", display: "block" }}></i>
              <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "#d4af37", fontFamily: "monospace" }}>{stats.total.toLocaleString()}</div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px", marginTop: "4px" }}>Total Antrian</div>
          </div>
          <div style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", borderRadius: "16px", padding: "18px 14px", textAlign: "center" }}>
              <i className="fa-solid fa-check-circle" style={{ color: "#25d366", fontSize: "1.3rem", marginBottom: "8px", display: "block" }}></i>
              <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "#25d366", fontFamily: "monospace" }}>{stats.sent.toLocaleString()}</div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px", marginTop: "4px" }}>Terkirim</div>
          </div>
          <div style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", borderRadius: "16px", padding: "18px 14px", textAlign: "center" }}>
              <i className="fa-solid fa-clock" style={{ color: "#f39c12", fontSize: "1.3rem", marginBottom: "8px", display: "block" }}></i>
              <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "#f39c12", fontFamily: "monospace" }}>{stats.pending.toLocaleString()}</div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px", marginTop: "4px" }}>Menunggu</div>
          </div>
          <div style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", borderRadius: "16px", padding: "18px 14px", textAlign: "center" }}>
              <i className="fa-solid fa-times-circle" style={{ color: "#ff3366", fontSize: "1.3rem", marginBottom: "8px", display: "block" }}></i>
              <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "#ff3366", fontFamily: "monospace" }}>{stats.failed.toLocaleString()}</div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px", marginTop: "4px" }}>Gagal</div>
          </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "35px" }}>
          {/* Manual Blast Form */}
          <div style={{ background: "var(--glass-bg)", border: "1px solid rgba(37,211,102,0.2)", borderRadius: "20px", padding: "28px" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#25d366", margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="fa-solid fa-bullhorn"></i> Manual Blast
              </h2>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "0 0 20px 0" }}>
                  Kirim pesan kustom ke semua alumni yang opt-in. Mendukung format WhatsApp: <strong>*bold*</strong>, <em>_italic_</em>.
              </p>
              <form onSubmit={handleBroadcast}>
                  <div style={{ marginBottom: "15px" }}>
                      <label style={{ display: "block", marginBottom: "5px", color: "var(--text-secondary)", fontSize: "0.75rem" }}>Target Penerima ({targetUsers.length} Kontak):</label>
                      <select 
                          value={targetRole} 
                          onChange={e => setTargetRole(e.target.value)}
                          style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid var(--glass-border)", color: "var(--text-primary)", padding: "10px", borderRadius: "8px", fontSize: "0.85rem", outline: "none", cursor: "pointer" }}
                      >
                          <option value="all">Semua Anggota</option>
                          <option value="admin">Hanya Administrator</option>
                          <option value="member">Hanya Member Biasa</option>
                          <option value="bendahara">Hanya Bendahara</option>
                      </select>
                  </div>
                  <textarea 
                      value={message} 
                      onChange={e => setMessage(e.target.value)} 
                      placeholder="Tulis pesan WhatsApp di sini...&#10;&#10;Contoh:&#10;📢 *Expedient Generation*&#10;&#10;Informasi penting untuk seluruh alumni..." 
                      style={{ width: "100%", minHeight: "160px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--glass-border)", borderRadius: "12px", color: "var(--text-primary)", fontSize: "0.85rem", padding: "14px", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", outline: "none", transition: "border-color 0.2s" }} 
                      required 
                      maxLength={4096}
                  ></textarea>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "var(--text-secondary)", margin: "6px 0 16px 0" }}>
                      <span>Markdown WA: *bold*, _italic_, ~coret~</span>
                      <span>{message.length}/4096 karakter</span>
                  </div>
                  <button type="submit" disabled={isSending} style={{ width: "100%", padding: "14px", background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.4)", color: "#25d366", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 600, cursor: isSending ? "not-allowed" : "pointer", letterSpacing: "0.5px", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }} className="hover-trigger">
                      {isSending ? <><i className="fa-solid fa-spinner fa-spin"></i> Mengirim...</> : <><i className="fa-brands fa-whatsapp"></i> Tambahkan ke Antrian & Kirim</>}
                  </button>
              </form>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Retry */}
              <div style={{ background: "var(--glass-bg)", border: "1px solid rgba(255,51,102,0.2)", borderRadius: "20px", padding: "24px" }}>
                  <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#ff3366", margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                      <i className="fa-solid fa-rotate-right"></i> Retry Gagal
                  </h2>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "0 0 16px 0" }}>
                      Reset pesan yang gagal agar dicoba ulang.
                  </p>
                  <button onClick={async () => {
                      try {
                          await fetch("/api/admin/broadcast/retry", { method: "POST" });
                          fetchStats();
                          showAlert("Berhasil", "Semua pesan gagal telah direset menjadi pending.");
                      } catch {
                          showAlert("Gagal", "Gagal mereset pesan.");
                      }
                  }} style={{ width: "100%", padding: "10px", background: "rgba(255,51,102,0.1)", border: "1px solid rgba(255,51,102,0.3)", color: "#ff3366", borderRadius: "10px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }} className="hover-trigger">
                      <i className="fa-solid fa-rotate" style={{ marginRight: "6px" }}></i>Reset {stats.failed} Pesan Gagal
                  </button>
              </div>

              {/* Process Now */}
              <div style={{ background: "var(--glass-bg)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "20px", padding: "24px" }}>
                  <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#d4af37", margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                      <i className="fa-solid fa-bolt"></i> Proses Sekarang
                  </h2>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "0 0 16px 0" }}>
                      Kirim {stats.pending} pesan pending sekarang tanpa menunggu cron.
                  </p>
                  <button disabled={stats.pending === 0} onClick={async () => {
                      try {
                          showAlert("Info", "Sedang memproses antrian... (Mungkin memakan waktu)");
                          const res = await fetch("/api/admin/broadcast/process", { method: "POST" });
                          const data = await res.json();
                          const payload = data.data || data;
                          fetchStats();
                          showAlert("Selesai", `Berhasil dikirim: ${payload.sent}, Gagal: ${payload.failed}`);
                      } catch {
                          showAlert("Gagal", "Gagal memproses antrian.");
                      }
                  }} style={{ width: "100%", padding: "10px", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", color: "#d4af37", borderRadius: "10px", fontSize: "0.8rem", fontWeight: 600, cursor: stats.pending === 0 ? "not-allowed" : "pointer", opacity: stats.pending === 0 ? 0.4 : 1 }} className="hover-trigger">
                      <i className="fa-solid fa-paper-plane" style={{ marginRight: "6px" }}></i>Proses {stats.pending} Antrian Pending
                  </button>
              </div>

              {/* Cron Info */}
              <div style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", borderRadius: "20px", padding: "24px" }}>
                  <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#d4af37", margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                      <i className="fa-solid fa-terminal"></i> Cron Jobs
                  </h2>
                  <pre style={{ background: "rgba(0,0,0,0.4)", borderRadius: "8px", padding: "12px", fontSize: "0.65rem", color: "#25d366", overflowX: "auto", margin: 0, lineHeight: 1.8 }}>
{`# Proses antrian setiap menit
* * * * * curl -X POST https://expedient.app/api/admin/broadcast/process

# Ucapan ulang tahun (tiap hari jam 07:00)
0 7 * * * curl -X POST https://expedient.app/api/admin/broadcast/birthday`}
                  </pre>
              </div>
          </div>
      </div>

      {/* Recent Queue Log */}
      <div style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", borderRadius: "20px", padding: "28px", overflow: "hidden" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="fa-solid fa-list-check" style={{ color: "#d4af37" }}></i> Log Antrian Terbaru (50)
          </h2>

          {logs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  <i className="fa-solid fa-inbox" style={{ fontSize: "2rem", marginBottom: "12px", display: "block", opacity: 0.4 }}></i>
                  Belum ada antrian WhatsApp.
              </div>
          ) : (
              <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                      <thead>
                          <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
                              <th style={{ textAlign: "left", padding: "10px 12px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", fontSize: "0.65rem" }}>Status</th>
                              <th style={{ textAlign: "left", padding: "10px 12px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", fontSize: "0.65rem" }}>Penerima</th>
                              <th style={{ textAlign: "left", padding: "10px 12px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", fontSize: "0.65rem" }}>Pesan</th>
                              <th style={{ textAlign: "left", padding: "10px 12px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", fontSize: "0.65rem" }}>Terkirim</th>
                              <th style={{ textAlign: "center", padding: "10px 12px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", fontSize: "0.65rem" }}>Percobaan</th>
                          </tr>
                      </thead>
                      <tbody>
                          {logs.map((log, index) => {
                              const isSent = log.status === 'sent';
                              const isFailed = log.status === 'failed';
                              const statusColor = isSent ? '#25d366' : isFailed ? '#ff3366' : '#f39c12';
                              const statusIcon = isSent ? 'fa-check' : isFailed ? 'fa-times' : 'fa-clock';
                              
                              return (
                                  <tr key={index} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                      <td style={{ padding: "10px 12px" }}>
                                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: `${statusColor}22`, color: statusColor, fontSize: "0.65rem", padding: "3px 9px", borderRadius: "20px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                              <i className={`fa-solid ${statusIcon}`} style={{ fontSize: "0.6rem" }}></i>
                                              {log.status}
                                          </span>
                                      </td>
                                      <td style={{ padding: "10px 12px", color: "var(--text-primary)" }}>
                                          <div style={{ fontWeight: 600 }}>{log.to_name || '—'}</div>
                                          <div style={{ color: "var(--text-secondary)", fontSize: "0.7rem" }}>{log.to_number}</div>
                                      </td>
                                      <td style={{ padding: "10px 12px", color: "var(--text-secondary)", maxWidth: "300px" }}>
                                          <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "280px" }} title={log.message || undefined}>
                                              {log.message?.substring(0, 80)}...
                                          </div>
                                          {isFailed && log.error_message && (
                                              <div style={{ color: "#ff3366", fontSize: "0.65rem", marginTop: "3px" }}>⚠ {log.error_message}</div>
                                          )}
                                      </td>
                                      <td style={{ padding: "10px 12px", color: "var(--text-secondary)", whiteSpace: "nowrap", fontSize: "0.75rem" }}>
                                          {log.sent_at ? new Date(log.sent_at).toLocaleString("id-ID", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                                      </td>
                                      <td style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-secondary)" }}>
                                          {log.attempts || 0}/{log.max_attempts || 3}
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          )}
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import { useConfirm } from "@/components/layout/AegisConfirm";
import "../admin.css";
import AdminLockBtn from "../../AdminLockBtn";

export default function WalletClient({ users }: { users: any[] }) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [eventName, setEventName] = useState("The Syndicate Annual Gala");
  const [ticketClass, setTicketClass] = useState("VVIP");
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const ticketRef = useRef<HTMLDivElement>(null);
  const { showAlert } = useConfirm();

  const selectedUser = users.find(u => u.id === selectedUserId);

  useEffect(() => {
    document.body.classList.add("page-admin");
    if (selectedUserId && eventName) {
      const ticketData = `VVIP-PASS|${selectedUserId}|${eventName.replace(/\s+/g, '')}`;
      QRCode.toDataURL(ticketData, {
        width: 140,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      }).then(url => setQrDataUrl(url)).catch(console.error);
    } else {
      setQrDataUrl("");
    }
    return () => {
      document.body.classList.remove("page-admin");
    };
  }, [selectedUserId, eventName]);

  const handleGenerate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedUserId || !ticketRef.current) return;
      
      setIsGenerating(true);
      try {
        const canvas = await html2canvas(ticketRef.current, { backgroundColor: null, scale: 3 });
        const imgDataUrl = canvas.toDataURL('image/png');
        
        const link = document.createElement('a');
        link.download = `${ticketClass}_Pass_${selectedUser?.nama_panggilan || 'Tiket'}.png`;
        link.href = imgDataUrl;
        link.click();
      } catch (err) {
        console.error("Failed to generate ticket image:", err);
        await showAlert("Gagal", "Gagal mengunduh tiket.");
      } finally {
        setIsGenerating(false);
      }
  };

  return (
    <div className="admin-wrapper" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div className="admin-header" style={{ position: "relative", marginBottom: "30px", paddingRight: "160px" }}>
        <div style={{ position: "absolute", top: 0, right: 0, zIndex: 10 }}>
          <AdminLockBtn />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(212,175,55,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", color: "#d4af37" }}>
                <i className="fa-brands fa-apple"></i>
            </div>
            <div>
                <h1 className="admin-title" style={{ marginBottom: "0", fontSize: "1.4rem" }}>Wallet Generator</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", margin: "4px 0 0 0", letterSpacing: "1px", textTransform: "uppercase" }}>Terbitkan tiket VVIP digital & ID Card</p>
            </div>
        </div>
        <nav className="admin-nav" style={{ marginTop: "15px" }}>
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/users">Users</Link>
          <Link href="/admin/wallet-generator" className="active">Wallet</Link>
        </nav>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", alignItems: "start" }}>
          {/* Generator Form */}
          <div style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", borderRadius: "20px", padding: "24px 20px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 24px 0", display: "flex", alignItems: "center", gap: "10px" }}>
                  <i className="fa-solid fa-sliders" style={{ color: "#d4af37" }}></i> Parameter Tiket
              </h2>
              <form onSubmit={handleGenerate}>
                  <div style={{ marginBottom: "20px" }}>
                      <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px" }}>Identitas Penerima</label>
                      <select 
                          value={selectedUserId} 
                          onChange={e => setSelectedUserId(e.target.value)} 
                          required
                          style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-primary)", padding: "12px 16px", borderRadius: "10px", fontSize: "0.9rem", outline: "none", cursor: "pointer", transition: "all 0.3s" }}
                      >
                          <option value="" disabled>-- Pilih Identitas Anggota --</option>
                          {users.map(u => (
                              <option key={u.id} value={u.id}>{u.nama_panggilan || u.nama_lengkap} ({u.no_whatsapp || 'Tanpa WA'})</option>
                          ))}
                      </select>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                      <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px" }}>Nama Acara / Keterangan</label>
                      <input 
                          type="text" 
                          value={eventName} 
                          onChange={e => setEventName(e.target.value)} 
                          required 
                          style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-primary)", padding: "12px 16px", borderRadius: "10px", fontSize: "0.9rem", outline: "none", transition: "all 0.3s", boxSizing: "border-box" }}
                      />
                  </div>

                  <div style={{ marginBottom: "30px" }}>
                      <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px" }}>Kelas Akses (Tier)</label>
                      <select 
                          value={ticketClass} 
                          onChange={e => setTicketClass(e.target.value)}
                          style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-primary)", padding: "12px 16px", borderRadius: "10px", fontSize: "0.9rem", outline: "none", cursor: "pointer", transition: "all 0.3s" }}
                      >
                          <option value="VVIP">VVIP Pass (Gold - Akses Penuh)</option>
                          <option value="VIP">VIP Pass (Silver - Akses Terbatas)</option>
                          <option value="REGULAR">Regular Pass (Standard - Area Utama)</option>
                      </select>
                  </div>

                  <button type="submit" disabled={isGenerating || !selectedUserId} style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #d4af37, #aa8529)", border: "none", color: "#000", borderRadius: "12px", fontSize: "0.95rem", fontWeight: 700, cursor: isGenerating || !selectedUserId ? "not-allowed" : "pointer", letterSpacing: "1px", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", opacity: (!selectedUserId || isGenerating) ? 0.6 : 1, boxShadow: "0 5px 15px rgba(212,175,55,0.3)" }} className="hover-trigger">
                      {isGenerating ? <><i className="fa-solid fa-spinner fa-spin"></i> MEMPROSES TIKET...</> : <><i className="fa-solid fa-download"></i> EKSPOR TIKET (.PNG)</>}
                  </button>
                  
                  <div style={{ background: "rgba(255,193,7,0.05)", border: "1px solid rgba(255,193,7,0.2)", borderRadius: "12px", padding: "16px", marginTop: "24px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <i className="fa-solid fa-triangle-exclamation" style={{ color: "#ffc107", marginTop: "3px" }}></i>
                      <p style={{ fontSize: '0.75rem', color: '#ffc107', margin: 0, lineHeight: 1.6 }}>
                          <strong>Sistem Fallback:</strong> Tiket akan dirender sebagai gambar PNG resolusi tinggi karena format <code style={{ background: "rgba(0,0,0,0.4)", padding: "2px 6px", borderRadius: "4px" }}>.pkpass</code> (Apple Wallet Native) membutuhkan lisensi Apple Developer Certificate aktif.
                      </p>
                  </div>
              </form>
          </div>

          {/* Ticket Preview Box */}
          <div style={{ background: "var(--glass-bg)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "20px", padding: "32px", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: "500px", boxShadow: "inset 0 0 50px rgba(0,0,0,0.5)" }}>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "20px" }}>Live Preview</div>
              
              <div style={{ width: "100%", maxWidth: "340px", background: "#1a1a1a", borderRadius: "16px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)", position: "relative" }} ref={ticketRef}>
                  
                  {/* Glowing Edge Effect */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: ticketClass === 'VVIP' ? 'linear-gradient(90deg, #d4af37, #f9f1cc, #d4af37)' : ticketClass === 'VIP' ? 'linear-gradient(90deg, #a0a0a0, #e0e0e0, #a0a0a0)' : 'linear-gradient(90deg, #444, #777, #444)' }}></div>
                  
                  <div style={{ padding: "24px 24px 16px 24px", borderBottom: "1px dashed rgba(255,255,255,0.15)", position: "relative" }}>
                      <div style={{ position: "absolute", bottom: "-10px", left: "-10px", width: "20px", height: "20px", borderRadius: "50%", background: "var(--bg-color)" }}></div>
                      <div style={{ position: "absolute", bottom: "-10px", right: "-10px", width: "20px", height: "20px", borderRadius: "50%", background: "var(--bg-color)" }}></div>
                      
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                          <div>
                              <div style={{ color: '#888', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: "4px" }}>Event Access</div>
                              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#fff', lineHeight: 1.2, fontWeight: 700 }}>{eventName || 'Judul Acara'}</div>
                          </div>
                          <div style={{ 
                              background: ticketClass === 'VVIP' ? 'linear-gradient(135deg, #d4af37, #aa8529)' : ticketClass === 'VIP' ? 'linear-gradient(135deg, #e0e0e0, #888)' : '#333',
                              color: ticketClass === 'VVIP' || ticketClass === 'VIP' ? '#000' : '#fff',
                              padding: "6px 14px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "1px", boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
                          }}>
                              {ticketClass}
                          </div>
                      </div>
                  </div>
                  
                  <div style={{ padding: "24px", background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)" }}>
                      <div style={{ textAlign: 'center', marginBottom: "30px" }}>
                          <div style={{ color: '#666', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Diterbitkan Untuk</div>
                          <div style={{ fontSize: '1.4rem', color: ticketClass === 'VVIP' ? '#d4af37' : '#fff', fontWeight: 800, letterSpacing: "0.5px" }}>{selectedUser ? (selectedUser.nama_panggilan || selectedUser.nama_lengkap) : 'Nama Anggota'}</div>
                          <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '6px', fontFamily: 'monospace', letterSpacing: "1px" }}>ID: {selectedUser ? selectedUser.id.split('-')[0].toUpperCase() : 'XXXX-XXXX'}</div>
                      </div>
                      
                      <div style={{ width: '160px', height: '160px', margin: '0 auto 24px auto', background: '#fff', borderRadius: '12px', padding: '10px', boxShadow: "0 10px 20px rgba(0,0,0,0.5)" }}>
                          {qrDataUrl ? <img src={qrDataUrl} alt="QR Code" style={{ width: '100%', height: '100%', display: 'block', imageRendering: "pixelated" }} /> : <div style={{ width: '100%', height: '100%', background: '#f5f5f5', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '0.8rem' }}>Pilih Anggota</div>}
                      </div>
                      
                      <div style={{ textAlign: 'center', color: '#555', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
                          Pindai kode QR ini di Gerbang Kehadiran
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}

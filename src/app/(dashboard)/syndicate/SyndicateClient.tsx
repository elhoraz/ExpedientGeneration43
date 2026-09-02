"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/layout/AegisConfirm";

export default function SyndicateClient({ initialPortofolio, userId }: { initialPortofolio: any[]; userId: string }) {
  const [portofolio, setPortofolio] = useState<any[]>(initialPortofolio);
  const [filter, setFilter] = useState("all");
  const { showConfirm } = useConfirm();

  const handleFilter = (cat: string) => setFilter(cat);

  const filteredBiz = filter === "all" ? portofolio : portofolio.filter(b => b.kategori === filter);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).VanillaTilt) {
      // Re-initialize tilt for newly rendered filtered items
      const elements = document.querySelectorAll(".biz-item");
      if (elements.length > 0) {
        (window as any).VanillaTilt.init(elements, { max: 15, speed: 400, glare: true, "max-glare": 0.2, scale: 1.02 });
      }
    }
  }, [filteredBiz]);

  const handleDelete = async (id: string) => {
    const isConfirmed = await showConfirm("Konfirmasi", "Apakah Anda yakin ingin menghapus arsip bisnis ini?");
    if (!isConfirmed) return;

    const supabase = createClient();
    const { error } = await supabase.from("syndicate").delete().eq("id", id);
    if (!error) {
      setPortofolio(portofolio.filter(b => b.id !== id));
    }
  };

  return (
    <div style={{
      position: "relative",
      width: "100%",
      minHeight: "100vh",
      padding: "120px 5% 50px",
      background: "radial-gradient(circle at top right, rgba(212, 175, 55, 0.05), transparent 40%), radial-gradient(circle at bottom left, rgba(0, 255, 136, 0.05), transparent 40%)",
      zIndex: 1
    }}>
      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: "3.5rem", color: "#fff",
          fontWeight: 900, letterSpacing: "4px", textTransform: "uppercase",
          textShadow: "0 10px 30px rgba(212, 175, 55, 0.3)", marginBottom: "10px"
        }}>The Syndicate</h1>
        <div style={{ fontFamily: "'Courier New', monospace", fontSize: "1rem", color: "#d4af37", letterSpacing: "6px", textTransform: "uppercase" }}>
          Alumni Business & Professional Network
        </div>
      </div>

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "40px", flexWrap: "wrap", gap: "20px", position: "relative", zIndex: 10
      }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {["all", "F&B", "Teknologi", "Jasa", "Kreatif", "Retail"].map(cat => (
            <button key={cat} onClick={() => handleFilter(cat)} style={{
              background: filter === cat ? "rgba(212, 175, 55, 0.2)" : "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${filter === cat ? "#d4af37" : "rgba(255, 255, 255, 0.1)"}`,
              color: filter === cat ? "#d4af37" : "#aaa",
              padding: "10px 20px", borderRadius: "50px", fontSize: "0.8rem",
              fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", cursor: "pointer",
              transition: "0.3s ease"
            }}>
              {cat === "all" ? "Semua" : cat}
            </button>
          ))}
        </div>

        <Link href="/syndicate/create" style={{
          background: "linear-gradient(135deg, #d4af37, #aa8529)", border: "none", color: "#000",
          padding: "12px 25px", borderRadius: "50px", fontSize: "0.85rem", fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "2px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: "10px",
          boxShadow: "0 10px 20px rgba(212, 175, 55, 0.3)", textDecoration: "none"
        }}>
          <i className="fa-solid fa-plus"></i> Registrasi Bisnis Anda
        </Link>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "30px",
        position: "relative", zIndex: 5
      }}>
        {filteredBiz.length === 0 ? (
          <div style={{
            gridColumn: "1 / -1", textAlign: "center", padding: "80px 20px",
            background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(212,175,55,0.3)", borderRadius: "15px"
          }}>
            <i className="fa-solid fa-vault" style={{ fontSize: "4rem", color: "rgba(212,175,55,0.3)", marginBottom: "20px" }}></i>
            <h3 style={{ color: "#fff", fontFamily: "'Playfair Display', serif" }}>Brankas Masih Kosong</h3>
            <p style={{ color: "#aaa" }}>Jadilah agen pertama yang memamerkan kerajaan bisnis Anda di sini.</p>
          </div>
        ) : (
          filteredBiz.map(biz => {
            const ownerName = biz.profiles?.nama_panggilan || "Unknown";
            const ownerAvatar = biz.profiles?.foto_profil 
              ? `/uploads/profiles/${biz.profiles.foto_profil}` 
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(ownerName)}&background=0D0D0D&color=D4AF37&bold=true`;
            const wa = biz.profiles?.no_whatsapp ? biz.profiles.no_whatsapp.replace(/^0/, '62').replace(/[^0-9]/g, '') : '';
            const logo = biz.logo_bisnis ? `/uploads/bisnis/${biz.logo_bisnis}` : `https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`;

            return (
              <div key={biz.id} className="biz-item" style={{
                background: "rgba(15, 18, 16, 0.7)", backdropFilter: "blur(20px)",
                border: "1px solid rgba(212, 175, 55, 0.3)", borderRadius: "15px",
                overflow: "hidden", position: "relative", boxShadow: "0 15px 35px rgba(0,0,0,0.5)",
                display: "flex", flexDirection: "column", borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                borderLeft: "1px solid rgba(255, 255, 255, 0.1)", transition: "0.4s ease"
              }}>
                <div style={{ width: "100%", height: "180px", background: "#0a0a0a", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{
                    position: "absolute", top: "15px", right: "15px", background: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid #d4af37", color: "#d4af37", padding: "5px 12px", borderRadius: "5px",
                    fontSize: "0.7rem", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase",
                    backdropFilter: "blur(5px)", zIndex: 2
                  }}>{biz.kategori}</div>
                  <img src={logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "15px", padding: "0 20px", transform: "translateY(-20px)" }}>
                  <img src={ownerAvatar} alt="Owner" style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", border: "3px solid #111", boxShadow: "0 5px 15px rgba(0,0,0,0.5)" }} />
                  <div style={{ display: "flex", flexDirection: "column", marginTop: "25px" }}>
                    <h4 style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>{ownerName}</h4>
                    <span style={{ fontFamily: "'Courier New', monospace", color: "#00ff88", fontSize: "0.7rem", letterSpacing: "1px" }}>Direktur / Founder</span>
                  </div>
                </div>

                <div style={{ padding: "0 20px 20px", flexGrow: 1, marginTop: "-10px" }}>
                  <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.4rem", color: "#fff", fontWeight: 800, marginBottom: "10px", lineHeight: 1.2 }}>{biz.nama_bisnis}</h2>
                  <div style={{ fontSize: "0.85rem", color: "#aaa", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{biz.deskripsi}</div>
                </div>

                <div style={{ display: "flex", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.3)" }}>
                  <a href={wa ? `https://wa.me/${wa}` : "#"} target={wa ? "_blank" : "_self"} onClick={async (e) => {
                    if (!wa) {
                      e.preventDefault();
                      await showConfirm("Tidak Tersedia", "Pemilik bisnis belum mencantumkan nomor WhatsApp.");
                    }
                  }} style={{
                    flex: 1, padding: "15px", textAlign: "center", color: "#fff", textDecoration: "none",
                    fontSize: "0.85rem", fontWeight: 600, letterSpacing: "1px", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: "8px", borderRight: "1px solid rgba(255,255,255,0.05)"
                  }}>
                    <i className="fa-brands fa-whatsapp"></i> Hubungi
                  </a>
                  {biz.link_url ? (
                    <a href={biz.link_url} target="_blank" style={{
                      flex: 1, padding: "15px", textAlign: "center", color: "#fff", textDecoration: "none",
                      fontSize: "0.85rem", fontWeight: 600, letterSpacing: "1px", display: "flex", alignItems: "center",
                      justifyContent: "center", gap: "8px"
                    }}>
                      <i className="fa-solid fa-globe"></i> Kunjungi
                    </a>
                  ) : (
                    <a href="#" onClick={e => e.preventDefault()} style={{
                      flex: 1, padding: "15px", textAlign: "center", color: "#fff", textDecoration: "none",
                      fontSize: "0.85rem", fontWeight: 600, letterSpacing: "1px", display: "flex", alignItems: "center",
                      justifyContent: "center", gap: "8px", opacity: 0.3, cursor: "not-allowed"
                    }}>
                      <i className="fa-solid fa-globe"></i> N/A
                    </a>
                  )}
                </div>

                {biz.user_id === userId && (
                  <div style={{ display: "flex", background: "rgba(0,0,0,0.5)" }}>
                    <Link href={`/syndicate/edit/${biz.id}`} style={{
                      flex: 1, padding: "15px", textAlign: "center", color: "#d4af37", background: "transparent", border: "none", borderRight: "1px solid rgba(255,255,255,0.05)",
                      fontSize: "0.85rem", fontWeight: 600, letterSpacing: "1px", display: "flex", alignItems: "center",
                      justifyContent: "center", gap: "8px", textDecoration: "none"
                    }}>
                      <i className="fa-solid fa-edit"></i> Edit
                    </Link>
                    <button onClick={() => handleDelete(biz.id)} style={{
                      flex: 1, padding: "15px", textAlign: "center", color: "#ff3366", background: "transparent", border: "none",
                      fontSize: "0.85rem", fontWeight: 600, letterSpacing: "1px", display: "flex", alignItems: "center",
                      justifyContent: "center", gap: "8px", cursor: "pointer"
                    }}>
                      <i className="fa-solid fa-trash"></i> Hapus
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
    </div>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/vanilla-tilt/1.8.0/vanilla-tilt.min.js" strategy="afterInteractive" onLoad={() => {
          if ((window as any).VanillaTilt) {
              (window as any).VanillaTilt.init(document.querySelectorAll(".biz-item"), { max: 15, speed: 400, glare: true, "max-glare": 0.2, scale: 1.02 });
          }
      }} />
      <Script id="tilt-updater" strategy="afterInteractive">
        {`
          // Effect initializer
        `}
      </Script>
    </div>
  );
}

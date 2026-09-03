"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/layout/AegisConfirm";
import { getAvatarUrl } from "@/lib/avatar";
import "./syndicate.css";

export default function SyndicateClient({ initialPortofolio, userId }: { initialPortofolio: any[]; userId: string }) {
  const [portofolio, setPortofolio] = useState<any[]>(initialPortofolio);
  const [filter, setFilter] = useState("all");
  const { showConfirm } = useConfirm();

  const handleFilter = (cat: string) => setFilter(cat);

  const filteredBiz = filter === "all" ? portofolio : portofolio.filter(b => b.kategori === filter);

  useEffect(() => {
    document.body.classList.add("page-syndicate");
    return () => {
      document.body.classList.remove("page-syndicate");
    };
  }, []);

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
    <div className="syndicate-page">
      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <h1 className="syndicate-title">The Syndicate</h1>
        <div className="syndicate-subtitle">
          Alumni Business & Professional Network
        </div>
      </div>

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "40px", flexWrap: "wrap", gap: "20px", position: "relative", zIndex: 10
      }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {["all", "F&B", "Teknologi", "Jasa", "Kreatif", "Retail"].map(cat => (
            <button 
              key={cat} 
              onClick={() => handleFilter(cat)} 
              className={`syndicate-filter-btn ${filter === cat ? "active" : ""}`}
            >
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
            background: "var(--glass-bg)", border: "1px dashed var(--glass-border)", borderRadius: "18px"
          }}>
            <i className="fa-solid fa-vault" style={{ fontSize: "4rem", color: "var(--gold-main)", opacity: 0.4, marginBottom: "20px" }}></i>
            <h3 style={{ color: "var(--text-primary)", fontFamily: "var(--font-playfair, 'Playfair Display', serif)", fontSize: "1.6rem", marginBottom: "10px" }}>Brankas Masih Kosong</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Jadilah agen pertama yang memamerkan kerajaan bisnis Anda di sini.</p>
          </div>
        ) : (
          filteredBiz.map(biz => {
            const ownerName = biz.profiles?.nama_panggilan || "Unknown";
            const ownerAvatar = getAvatarUrl(biz.profiles?.foto_profil, ownerName);
            const wa = biz.profiles?.no_whatsapp ? biz.profiles.no_whatsapp.replace(/^0/, '62').replace(/[^0-9]/g, '') : '';
            const logo = biz.logo_bisnis 
              ? (biz.logo_bisnis.startsWith("http") || biz.logo_bisnis.startsWith("/") ? biz.logo_bisnis : `/uploads/bisnis/${biz.logo_bisnis}`)
              : `https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`;

            return (
              <div key={biz.id} className="biz-item syndicate-card">
                <div style={{ width: "100%", height: "180px", background: "#0a0a0a", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{
                    position: "absolute", top: "15px", right: "15px", background: "rgba(0, 0, 0, 0.75)",
                    border: "1px solid var(--gold-main)", color: "var(--gold-main)", padding: "5px 12px", borderRadius: "6px",
                    fontSize: "0.7rem", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase",
                    backdropFilter: "blur(6px)", zIndex: 2
                  }}>{biz.kategori}</div>
                  <img src={logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "15px", padding: "0 20px", transform: "translateY(-20px)" }}>
                  <img src={ownerAvatar} alt="Owner" style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", border: "3px solid var(--bg-card)", boxShadow: "0 5px 15px rgba(0,0,0,0.3)" }} />
                  <div style={{ display: "flex", flexDirection: "column", marginTop: "25px" }}>
                    <h4 className="biz-owner-name">{ownerName}</h4>
                    <span className="biz-founder-badge">Direktur / Founder</span>
                  </div>
                </div>

                <div style={{ padding: "0 20px 20px", flexGrow: 1, marginTop: "-10px" }}>
                  <h2 className="biz-name">{biz.nama_bisnis}</h2>
                  <div className="biz-desc">{biz.deskripsi}</div>
                </div>

                <div className="biz-footer-actions">
                  <a href={wa ? `https://wa.me/${wa}` : "#"} target={wa ? "_blank" : "_self"} onClick={async (e) => {
                    if (!wa) {
                      e.preventDefault();
                      await showConfirm("Tidak Tersedia", "Pemilik bisnis belum mencantumkan nomor WhatsApp.");
                    }
                  }} className="biz-footer-btn" style={{ borderRight: "1px solid var(--glass-border, rgba(255,255,255,0.08))" }}>
                    <i className="fa-brands fa-whatsapp" style={{ color: "#25D366" }}></i> Hubungi
                  </a>
                  {biz.link_url ? (
                    <a href={biz.link_url} target="_blank" className="biz-footer-btn">
                      <i className="fa-solid fa-globe" style={{ color: "var(--gold-main)" }}></i> Kunjungi
                    </a>
                  ) : (
                    <a href="#" onClick={e => e.preventDefault()} className="biz-footer-btn" style={{ opacity: 0.35, cursor: "not-allowed" }}>
                      <i className="fa-solid fa-globe"></i> N/A
                    </a>
                  )}
                </div>

                {biz.user_id === userId && (
                  <div style={{ display: "flex", background: "rgba(0,0,0,0.25)", borderTop: "1px solid var(--glass-border)" }}>
                    <Link href={`/syndicate/edit/${biz.id}`} style={{
                      flex: 1, padding: "12px", textAlign: "center", color: "var(--gold-main)", background: "transparent", border: "none", borderRight: "1px solid var(--glass-border)",
                      fontSize: "0.82rem", fontWeight: 600, letterSpacing: "1px", display: "flex", alignItems: "center",
                      justifyContent: "center", gap: "8px", textDecoration: "none"
                    }}>
                      <i className="fa-solid fa-edit"></i> Edit
                    </Link>
                    <button onClick={() => handleDelete(biz.id)} style={{
                      flex: 1, padding: "12px", textAlign: "center", color: "#ff4d6d", background: "transparent", border: "none",
                      fontSize: "0.82rem", fontWeight: 600, letterSpacing: "1px", display: "flex", alignItems: "center",
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

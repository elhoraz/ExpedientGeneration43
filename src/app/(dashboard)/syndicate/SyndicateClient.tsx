"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/layout/AegisConfirm";
import { getAvatarUrl } from "@/lib/avatar";
import "./syndicate.css";

interface Props {
  initialPortofolio: any[];
  userId: string;
  viewerName?: string;
}

export default function SyndicateClient({ initialPortofolio, userId, viewerName = "Rekan Alumni" }: Props) {
  const [portofolio, setPortofolio] = useState<any[]>(initialPortofolio);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { showConfirm, showAlert } = useConfirm();

  const handleFilter = (cat: string) => setFilter(cat);

  useEffect(() => {
    document.body.classList.add("page-syndicate");
    return () => {
      document.body.classList.remove("page-syndicate");
    };
  }, []);

  // Filtered Business calculation
  const filteredBiz = useMemo(() => {
    return portofolio.filter((biz) => {
      // 1. Category Filter
      const matchCategory = filter === "all" || biz.kategori === filter;
      if (!matchCategory) return false;

      // 2. Search Query Filter
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchName = biz.nama_bisnis?.toLowerCase().includes(q);
      const matchTagline = biz.tagline?.toLowerCase().includes(q);
      const matchDesc = biz.deskripsi?.toLowerCase().includes(q);
      const matchCity = biz.kota?.toLowerCase().includes(q);
      const matchOwner = (biz.profiles?.nama_panggilan || biz.profiles?.nama_lengkap || "")
        .toLowerCase()
        .includes(q);

      // Search inside products
      const matchProducts = Array.isArray(biz.produk_layanan) && biz.produk_layanan.some(
        (p: any) => p.nama?.toLowerCase().includes(q) || p.deskripsi?.toLowerCase().includes(q)
      );

      return matchName || matchTagline || matchDesc || matchCity || matchOwner || matchProducts;
    });
  }, [portofolio, filter, searchQuery]);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).VanillaTilt) {
      const elements = document.querySelectorAll(".biz-item");
      if (elements.length > 0) {
        (window as any).VanillaTilt.init(elements, {
          max: 12,
          speed: 400,
          glare: true,
          "max-glare": 0.15,
          scale: 1.02,
        });
      }
    }
  }, [filteredBiz]);

  const handleDelete = async (id: string) => {
    const isConfirmed = await showConfirm(
      "Konfirmasi Hapus",
      "Apakah Anda yakin ingin menghapus data usaha ini beserta halaman websitenya?"
    );
    if (!isConfirmed) return;

    const supabase = createClient();
    const { error } = await supabase.from("syndicate").delete().eq("id", id);
    if (!error) {
      setPortofolio(portofolio.filter((b) => b.id !== id));
      showAlert("Sukses", "Data usaha berhasil dihapus.");
    } else {
      showAlert("Gagal", `Gagal menghapus: ${error.message}`);
    }
  };

  return (
    <div className="syndicate-page">
      {/* Title Header */}
      <div style={{ textAlign: "center", marginBottom: "35px" }}>
        <h1 className="syndicate-title">Katalog Bisnis Alumni</h1>
        <div className="syndicate-subtitle">
          Jaringan Usaha & Profesional Sahabat Alumni Expedient 43
        </div>
      </div>

      {/* Interactive Search Bar */}
      <div className="syndicate-search-container">
        <div className="syndicate-search-box">
          <i className="fa-solid fa-magnifying-glass" style={{ color: "var(--gold-main)", fontSize: "1.1rem" }}></i>
          <input
            type="text"
            className="syndicate-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama bisnis, produk, kota, atau nama alumni..."
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.9rem" }}
            >
              <i className="fa-solid fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips & Add Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "35px",
          flexWrap: "wrap",
          gap: "15px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["all", "F&B", "Teknologi", "Jasa", "Kreatif", "Retail", "Kesehatan", "Properti"].map((cat) => (
            <button
              key={cat}
              onClick={() => handleFilter(cat)}
              className={`syndicate-filter-btn ${filter === cat ? "active" : ""}`}
            >
              {cat === "all" ? "Semua" : cat}
            </button>
          ))}
        </div>

        <Link
          href="/syndicate/create"
          style={{
            background: "linear-gradient(135deg, #d4af37, #aa8529)",
            border: "none",
            color: "#000",
            padding: "12px 22px",
            borderRadius: "50px",
            fontSize: "0.85rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 10px 20px rgba(212, 175, 55, 0.3)",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          <i className="fa-solid fa-plus"></i> Tambah Usaha Anda
        </Link>
      </div>

      {/* Business Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "30px",
          position: "relative",
          zIndex: 5,
        }}
      >
        {filteredBiz.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "80px 20px",
              background: "var(--glass-bg)",
              border: "1px dashed var(--glass-border)",
              borderRadius: "20px",
            }}
          >
            <i
              className="fa-solid fa-store"
              style={{ fontSize: "4rem", color: "var(--gold-main)", opacity: 0.4, marginBottom: "20px" }}
            ></i>
            <h3
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-playfair, 'Playfair Display', serif)",
                fontSize: "1.6rem",
                marginBottom: "10px",
              }}
            >
              {searchQuery ? "Tidak Ada Usaha yang Cocok" : "Belum Ada Usaha Terdaftar"}
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              {searchQuery
                ? `Tidak ditemukan hasil pencarian untuk "${searchQuery}". Coba kata kunci lain.`
                : "Jadilah yang pertama mendaftarkan usaha atau jasa Anda untuk rekan-rekan alumni."}
            </p>
          </div>
        ) : (
          filteredBiz.map((biz) => {
            const ownerName = biz.profiles?.nama_panggilan || biz.profiles?.nama_lengkap || "Alumni";
            const ownerAvatar = getAvatarUrl(biz.profiles?.foto_profil, ownerName);
            const wa = biz.profiles?.no_whatsapp
              ? biz.profiles.no_whatsapp.replace(/^0/, "62").replace(/[^0-9]/g, "")
              : "";

            const logo = biz.logo_bisnis
              ? (biz.logo_bisnis.startsWith("http") || biz.logo_bisnis.startsWith("/")
                  ? biz.logo_bisnis
                  : `/uploads/bisnis/${biz.logo_bisnis}`)
              : "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

            const marketplaces = biz.marketplace_links || {};

            // Dynamic WhatsApp greeting message
            const waText = encodeURIComponent(
              `Halo Mas/Mbak ${ownerName}, saya ${viewerName} dari Alumni Expedient 43.\n\nSaya melihat usaha "${biz.nama_bisnis}" di Katalog Jaringan Usaha dan tertarik untuk bertanya/bermitra.`
            );
            const waUrl = wa ? `https://wa.me/${wa}?text=${waText}` : "#";

            return (
              <div key={biz.id} className="biz-item syndicate-card">
                
                {/* Banner / Card Cover */}
                <Link href={`/syndicate/${biz.id}`} style={{ textDecoration: "none", display: "block" }}>
                  <div
                    style={{
                      width: "100%",
                      height: "175px",
                      background: "#0a0a0a",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {/* Category Pill */}
                    <div
                      style={{
                        position: "absolute",
                        top: "14px",
                        right: "14px",
                        background: "rgba(0, 0, 0, 0.75)",
                        border: "1px solid var(--gold-main)",
                        color: "var(--gold-main)",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
                        backdropFilter: "blur(6px)",
                        zIndex: 2,
                      }}
                    >
                      {biz.kategori}
                    </div>

                    {/* Promo Alumni Indicator */}
                    {biz.promo_alumni && (
                      <div
                        style={{
                          position: "absolute",
                          top: "14px",
                          left: "14px",
                          background: "rgba(212, 175, 55, 0.9)",
                          color: "#000",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "0.68rem",
                          fontWeight: 800,
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                          zIndex: 2,
                          boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                        }}
                      >
                        <i className="fa-solid fa-gift" style={{ marginRight: "4px" }}></i> Promo KTA
                      </div>
                    )}

                    <Image
                      src={logo}
                      alt={biz.nama_bisnis || "Logo"}
                      width={400}
                      height={175}
                      style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
                      unoptimized={logo.startsWith("data:") || logo.includes("ui-avatars.com") || logo.includes("supabase.co")}
                    />
                  </div>
                </Link>

                {/* Owner Info & Avatar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "0 20px",
                    transform: "translateY(-20px)",
                  }}
                >
                  <Image
                    src={ownerAvatar}
                    alt={ownerName}
                    width={56}
                    height={56}
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "3px solid var(--bg-card)",
                      boxShadow: "0 5px 15px rgba(0,0,0,0.4)",
                    }}
                    unoptimized
                  />
                  <div style={{ display: "flex", flexDirection: "column", marginTop: "22px" }}>
                    <h4 className="biz-owner-name">{ownerName}</h4>
                    <span className="biz-founder-badge">Founder &bull; Expedient 43</span>
                  </div>
                </div>

                {/* Body Content */}
                <div style={{ padding: "0 20px 18px", flexGrow: 1, marginTop: "-10px" }}>
                  <Link href={`/syndicate/${biz.id}`} style={{ textDecoration: "none" }}>
                    <h2 className="biz-name">{biz.nama_bisnis}</h2>
                  </Link>

                  {biz.tagline && <div className="biz-tagline">&ldquo;{biz.tagline}&rdquo;</div>}

                  <div className="biz-desc">{biz.deskripsi}</div>

                  {/* Meta Tags: City & Products count */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginTop: "6px" }}>
                    {biz.kota && (
                      <span className="biz-city-tag">
                        <i className="fa-solid fa-location-dot" style={{ color: "#ff4d6d" }}></i> {biz.kota}
                      </span>
                    )}

                    {Array.isArray(biz.produk_layanan) && biz.produk_layanan.length > 0 && (
                      <span className="biz-city-tag" style={{ borderColor: "rgba(212, 175, 55, 0.3)", color: "var(--gold-main)" }}>
                        <i className="fa-solid fa-box-open"></i> {biz.produk_layanan.length} Produk/Jasa
                      </span>
                    )}
                  </div>

                  {/* Marketplace Icons if available */}
                  {(marketplaces.shopee || marketplaces.tokopedia || marketplaces.tiktok || marketplaces.gofood) && (
                    <div className="biz-marketplace-row">
                      <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginRight: "2px" }}>Tersedia di:</span>
                      {marketplaces.shopee && (
                        <a href={marketplaces.shopee} target="_blank" rel="noopener noreferrer" className="biz-mkt-pill" title="Shopee">
                          <i className="fa-solid fa-bag-shopping" style={{ color: "#EE4D2D" }}></i>
                        </a>
                      )}
                      {marketplaces.tokopedia && (
                        <a href={marketplaces.tokopedia} target="_blank" rel="noopener noreferrer" className="biz-mkt-pill" title="Tokopedia">
                          <i className="fa-solid fa-store" style={{ color: "#03AC0E" }}></i>
                        </a>
                      )}
                      {marketplaces.tiktok && (
                        <a href={marketplaces.tiktok} target="_blank" rel="noopener noreferrer" className="biz-mkt-pill" title="TikTok Shop">
                          <i className="fa-brands fa-tiktok"></i>
                        </a>
                      )}
                      {marketplaces.gofood && (
                        <a href={marketplaces.gofood} target="_blank" rel="noopener noreferrer" className="biz-mkt-pill" title="GoFood">
                          <i className="fa-solid fa-motorcycle" style={{ color: "#E31B23" }}></i>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="biz-footer-actions">
                  <a
                    href={waUrl}
                    target={wa ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    onClick={async (e) => {
                      if (!wa) {
                        e.preventDefault();
                        await showAlert("Tidak Tersedia", "Pemilik bisnis belum mencantumkan nomor WhatsApp yang aktif.");
                      }
                    }}
                    className="biz-footer-btn btn-wa"
                    style={{ borderRight: "1px solid var(--glass-border, rgba(255,255,255,0.08))" }}
                  >
                    <i className="fa-brands fa-whatsapp" style={{ fontSize: "1rem" }}></i> WhatsApp
                  </a>

                  <Link href={`/syndicate/${biz.id}`} className="biz-footer-btn btn-site">
                    <i className="fa-solid fa-globe"></i> Website Bisnis
                  </Link>
                </div>

                {/* Owner Admin Actions (Edit / Delete) */}
                {biz.user_id === userId && (
                  <div
                    style={{
                      display: "flex",
                      background: "rgba(0,0,0,0.3)",
                      borderTop: "1px solid var(--glass-border)",
                    }}
                  >
                    <Link
                      href={`/syndicate/edit/${biz.id}`}
                      style={{
                        flex: 1,
                        padding: "11px",
                        textAlign: "center",
                        color: "var(--gold-main)",
                        borderRight: "1px solid var(--glass-border)",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        letterSpacing: "0.5px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        textDecoration: "none",
                      }}
                    >
                      <i className="fa-solid fa-pen-to-square"></i> Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(biz.id)}
                      style={{
                        flex: 1,
                        padding: "11px",
                        textAlign: "center",
                        color: "#ff4d6d",
                        background: "transparent",
                        border: "none",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        letterSpacing: "0.5px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        cursor: "pointer",
                      }}
                    >
                      <i className="fa-solid fa-trash"></i> Hapus
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/vanilla-tilt/1.8.0/vanilla-tilt.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          if ((window as any).VanillaTilt) {
            (window as any).VanillaTilt.init(document.querySelectorAll(".biz-item"), {
              max: 12,
              speed: 400,
              glare: true,
              "max-glare": 0.15,
              scale: 1.02,
            });
          }
        }}
      />
    </div>
  );
}

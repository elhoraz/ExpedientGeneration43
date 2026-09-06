"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { useConfirm } from "@/components/layout/AegisConfirm";
import ImageCropperModal from "@/components/ui/ImageCropperModal";
import "./syndicate.css";

interface ProductItem {
  id: string;
  nama: string;
  harga?: string;
  deskripsi?: string;
  foto?: string;
}

interface MarketplaceLinks {
  shopee?: string;
  tokopedia?: string;
  tiktok?: string;
  gofood?: string;
  grabfood?: string;
  instagram?: string;
}

export type SyndicateFormData = {
  id?: string;
  nama_bisnis: string;
  kategori: string;
  tagline?: string | null;
  deskripsi: string;
  link_url?: string | null;
  kota?: string | null;
  alamat?: string | null;
  promo_alumni?: string | null;
  jam_operasional?: string | null;
  maps_url?: string | null;
  theme?: string | null;
  logo_bisnis?: string | null;
  banner_url?: string | null;
  marketplace_links?: MarketplaceLinks | null;
  produk_layanan?: ProductItem[] | null;
  galeri_foto?: string[] | null;
};

interface Props {
  initialData?: SyndicateFormData;
  userId: string;
  userWhatsapp?: string;
}

export default function SyndicateForm({ initialData, userId, userWhatsapp = "" }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const { showAlert } = useConfirm();
  const [activeTab, setActiveTab] = useState<"info" | "marketplace" | "branding" | "produk" | "promo">("info");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waNumber, setWaNumber] = useState(userWhatsapp);

  useEffect(() => {
    document.body.classList.add("page-syndicate");
    return () => {
      document.body.classList.remove("page-syndicate");
    };
  }, []);

  // Form State
  const [formData, setFormData] = useState<SyndicateFormData>(
    initialData || {
      nama_bisnis: "",
      kategori: "F&B",
      tagline: "",
      deskripsi: "",
      link_url: "",
      kota: "",
      alamat: "",
      promo_alumni: "",
      jam_operasional: "",
      maps_url: "",
      theme: "gold",
      marketplace_links: {
        shopee: "",
        tokopedia: "",
        tiktok: "",
        gofood: "",
        grabfood: "",
        instagram: "",
      },
      produk_layanan: [],
    }
  );

  // Logo & Banner Cropping States
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const productImgRef = useRef<HTMLInputElement>(null);
  const [activeProductIdx, setActiveProductIdx] = useState<number | null>(null);

  const [previewLogo, setPreviewLogo] = useState<string | null>(
    initialData?.logo_bisnis
      ? (initialData.logo_bisnis.startsWith("http") || initialData.logo_bisnis.startsWith("/")
          ? initialData.logo_bisnis
          : `/uploads/bisnis/${initialData.logo_bisnis}`)
      : null
  );

  const [previewBanner, setPreviewBanner] = useState<string | null>(
    initialData?.banner_url
      ? (initialData.banner_url.startsWith("http") || initialData.banner_url.startsWith("/")
          ? initialData.banner_url
          : `/uploads/bisnis/${initialData.banner_url}`)
      : null
  );

  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);

  // Cropper Modal state
  const [cropTarget, setCropTarget] = useState<"logo" | "banner" | null>(null);
  const [rawCropImage, setRawCropImage] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  // Categories
  const categories = ["F&B", "Teknologi", "Jasa", "Kreatif", "Retail", "Kesehatan", "Properti", "Pendidikan"];

  // Helper for Marketplace Links
  const updateMarketplace = (key: keyof MarketplaceLinks, val: string) => {
    setFormData((prev) => ({
      ...prev,
      marketplace_links: {
        ...(prev.marketplace_links || {}),
        [key]: val,
      },
    }));
  };

  // Helper for Products
  const addProductItem = () => {
    const newItems = [...(formData.produk_layanan || [])];
    newItems.push({
      id: "prod_" + Date.now(),
      nama: "",
      harga: "",
      deskripsi: "",
      foto: "",
    });
    setFormData({ ...formData, produk_layanan: newItems });
  };

  const updateProductItem = (index: number, key: keyof ProductItem, val: string) => {
    const newItems = [...(formData.produk_layanan || [])];
    if (newItems[index]) {
      newItems[index] = { ...newItems[index], [key]: val };
      setFormData({ ...formData, produk_layanan: newItems });
    }
  };

  const removeProductItem = (index: number) => {
    const newItems = [...(formData.produk_layanan || [])];
    newItems.splice(index, 1);
    setFormData({ ...formData, produk_layanan: newItems });
  };

  // Handle Product Image Upload
  const handleProductImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeProductIdx === null) return;

    if (file.size > 5 * 1024 * 1024) {
      showAlert("Peringatan", "Ukuran foto produk maksimal 5MB.");
      return;
    }

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("folder", "bisnis");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      if (!res.ok) throw new Error("Gagal mengunggah foto produk");
      const json = await res.json();
      updateProductItem(activeProductIdx, "foto", json.url);
    } catch (err: any) {
      showAlert("Gagal", err.message || "Gagal mengunggah foto produk");
    } finally {
      if (productImgRef.current) productImgRef.current.value = "";
      setActiveProductIdx(null);
    }
  };

  // Handle Logo & Banner Cropping
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: "logo" | "banner") => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showAlert("Peringatan", "Ukuran file maksimal 10MB.");
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      setRawCropImage(objectUrl);
      setCropTarget(target);
      setIsCropperOpen(true);
    }
  };

  const handleCropApply = (croppedBlob: Blob, croppedDataUrl: string) => {
    const ext = croppedBlob.type === "image/png" ? "png" : "jpg";
    const croppedFile = new File([croppedBlob], `${cropTarget}_${userId}_${Date.now()}.${ext}`, {
      type: croppedBlob.type || "image/jpeg",
    });

    if (cropTarget === "logo") {
      setSelectedLogoFile(croppedFile);
      setPreviewLogo(croppedDataUrl);
    } else if (cropTarget === "banner") {
      setSelectedBannerFile(croppedFile);
      setPreviewBanner(croppedDataUrl);
    }

    setIsCropperOpen(false);
    if (rawCropImage) {
      URL.revokeObjectURL(rawCropImage);
      setRawCropImage(null);
    }
    setCropTarget(null);
  };

  const handleCropCancel = () => {
    setIsCropperOpen(false);
    if (rawCropImage) {
      URL.revokeObjectURL(rawCropImage);
      setRawCropImage(null);
    }
    setCropTarget(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let logoUrl = formData.logo_bisnis;
      let bannerUrl = formData.banner_url;

      // 1. Upload Logo if selected
      if (selectedLogoFile) {
        const uploadData = new FormData();
        uploadData.append("file", selectedLogoFile);
        uploadData.append("folder", "bisnis");

        const uploadResp = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!uploadResp.ok) {
          const errJson = await uploadResp.json().catch(() => ({}));
          throw new Error(errJson.error || "Gagal mengunggah logo bisnis");
        }

        const uploadJson = await uploadResp.json();
        logoUrl = uploadJson.url;
      }

      // 2. Upload Banner if selected
      if (selectedBannerFile) {
        const uploadData = new FormData();
        uploadData.append("file", selectedBannerFile);
        uploadData.append("folder", "bisnis");

        const uploadResp = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!uploadResp.ok) {
          const errJson = await uploadResp.json().catch(() => ({}));
          throw new Error(errJson.error || "Gagal mengunggah banner bisnis");
        }

        const uploadJson = await uploadResp.json();
        bannerUrl = uploadJson.url;
      }

      const payload = {
        user_id: userId,
        nama_bisnis: formData.nama_bisnis,
        kategori: formData.kategori,
        tagline: formData.tagline || null,
        deskripsi: formData.deskripsi,
        link_url: formData.link_url || null,
        kota: formData.kota || null,
        alamat: formData.alamat || null,
        promo_alumni: formData.promo_alumni || null,
        jam_operasional: formData.jam_operasional || null,
        maps_url: formData.maps_url || null,
        theme: formData.theme || "gold",
        marketplace_links: formData.marketplace_links || {},
        produk_layanan: formData.produk_layanan || [],
        ...(logoUrl ? { logo_bisnis: logoUrl } : {}),
        ...(bannerUrl ? { banner_url: bannerUrl } : {}),
      };

      let targetId = initialData?.id;

      if (initialData?.id) {
        // Update
        const { error } = await supabase.from("syndicate").update(payload).eq("id", initialData.id);
        if (error) throw error;
      } else {
        // Insert
        const { data: inserted, error } = await supabase.from("syndicate").insert([payload]).select("id").single();
        if (error) throw error;
        targetId = inserted?.id;
      }

      // Update WhatsApp in profiles if changed
      if (waNumber && waNumber !== userWhatsapp) {
        await supabase.from("profiles").update({ no_whatsapp: waNumber }).eq("id", userId);
      }

      showAlert("Sukses", "Website dan data bisnis berhasil disimpan!");
      router.push(targetId ? `/syndicate/${targetId}` : "/syndicate");
      router.refresh();
    } catch (error: any) {
      showAlert("Gagal", `Gagal menyimpan: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="syndicate-page" style={{ paddingTop: "100px" }}>
      <div className="syndicate-form-card">
        
        {/* Header Title */}
        <div style={{ marginBottom: "25px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "3px", color: "var(--gold-main)", fontWeight: 700 }}>
              Alumni Business Website Builder
            </div>
            <h2 style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)", color: "var(--text-primary, #ffffff)", margin: "4px 0 0", fontSize: "1.9rem" }}>
              {initialData ? "Kelola Website Bisnis Anda" : "Buat Website & Katalog Usaha"}
            </h2>
          </div>
          <Link href="/syndicate" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "1.3rem" }}>
            <i className="fa-solid fa-times"></i>
          </Link>
        </div>

        {/* Tab Navigation (WordPress-lite CMS) */}
        <div className="syndicate-tabs">
          <button
            type="button"
            className={`syndicate-tab-btn ${activeTab === "info" ? "active" : ""}`}
            onClick={() => setActiveTab("info")}
          >
            <i className="fa-solid fa-id-card"></i> Info Dasar & Kontak
          </button>
          <button
            type="button"
            className={`syndicate-tab-btn ${activeTab === "marketplace" ? "active" : ""}`}
            onClick={() => setActiveTab("marketplace")}
          >
            <i className="fa-solid fa-store"></i> Marketplace (Opsional)
          </button>
          <button
            type="button"
            className={`syndicate-tab-btn ${activeTab === "branding" ? "active" : ""}`}
            onClick={() => setActiveTab("branding")}
          >
            <i className="fa-solid fa-image"></i> Logo & Banner
          </button>
          <button
            type="button"
            className={`syndicate-tab-btn ${activeTab === "produk" ? "active" : ""}`}
            onClick={() => setActiveTab("produk")}
          >
            <i className="fa-solid fa-boxes-stacked"></i> Produk & Layanan ({formData.produk_layanan?.length || 0})
          </button>
          <button
            type="button"
            className={`syndicate-tab-btn ${activeTab === "promo" ? "active" : ""}`}
            onClick={() => setActiveTab("promo")}
          >
            <i className="fa-solid fa-gift"></i> Promo KTA & Jam Buka
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          
          {/* TAB 1: INFO DASAR */}
          {activeTab === "info" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "6px" }}>
                  Nama Bisnis / Usaha <span style={{ color: "#ff4d6d" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama_bisnis}
                  onChange={(e) => setFormData({ ...formData, nama_bisnis: e.target.value })}
                  className="syndicate-input"
                  placeholder="Misal: Studio Kopi Berbek, PT Mahakarya Digital"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "15px" }}>
                <div>
                  <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "6px" }}>
                    Kategori <span style={{ color: "#ff4d6d" }}>*</span>
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    className="syndicate-select"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "6px" }}>
                    Kota / Domisili Usaha
                  </label>
                  <input
                    type="text"
                    value={formData.kota || ""}
                    onChange={(e) => setFormData({ ...formData, kota: e.target.value })}
                    className="syndicate-input"
                    placeholder="Misal: Surabaya, Jakarta, Nganjuk"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "6px" }}>
                  Slogan / Tagline Bisnis (Singkat)
                </label>
                <input
                  type="text"
                  value={formData.tagline || ""}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="syndicate-input"
                  placeholder="Misal: Cita Rasa Autentik Nusantara, Solusi IT Terpercaya"
                />
              </div>

              <div>
                <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "6px" }}>
                  Tentang Usaha & Deskripsi Lengkap <span style={{ color: "#ff4d6d" }}>*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="syndicate-textarea"
                  placeholder="Jelaskan sejarah, keunggulan, atau nilai produk/jasa yang ditawarkan kepada alumni..."
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "15px" }}>
                <div>
                  <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "6px" }}>
                    Nomor WhatsApp (Aktif) <span style={{ color: "#ff4d6d" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={waNumber}
                    onChange={(e) => setWaNumber(e.target.value)}
                    className="syndicate-input"
                    placeholder="Misal: 08123456789"
                  />
                  <small style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                    Pelanggan akan langsung menghubungi nomor ini dengan template pesan otomatis.
                  </small>
                </div>

                <div>
                  <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "6px" }}>
                    Website Resmi (Opsional)
                  </label>
                  <input
                    type="url"
                    value={formData.link_url || ""}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    className="syndicate-input"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "6px" }}>
                  Alamat Fisik / Workshop
                </label>
                <input
                  type="text"
                  value={formData.alamat || ""}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="syndicate-input"
                  placeholder="Alamat lengkap gerai, toko, atau kantor usaha Anda"
                />
              </div>
            </div>
          )}

          {/* TAB 2: MARKETPLACE LINKS */}
          {activeTab === "marketplace" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ background: "rgba(212, 175, 55, 0.08)", border: "1px solid var(--glass-border)", padding: "14px 18px", borderRadius: "12px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <i className="fa-solid fa-circle-info" style={{ color: "var(--gold-main)", marginRight: "6px" }}></i>
                Semua tautan marketplace ini bersifat <strong>opsional</strong>. Cantumkan platform toko online yang aktif agar calon pembeli dapat langsung berbelanja melalui aplikasi favorit mereka.
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "6px" }}>
                  <i className="fa-solid fa-bag-shopping" style={{ color: "#EE4D2D" }}></i> Link Toko Shopee
                </label>
                <input
                  type="url"
                  value={formData.marketplace_links?.shopee || ""}
                  onChange={(e) => updateMarketplace("shopee", e.target.value)}
                  className="syndicate-input"
                  placeholder="https://shopee.co.id/namatoko"
                />
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "6px" }}>
                  <i className="fa-solid fa-store" style={{ color: "#03AC0E" }}></i> Link Toko Tokopedia
                </label>
                <input
                  type="url"
                  value={formData.marketplace_links?.tokopedia || ""}
                  onChange={(e) => updateMarketplace("tokopedia", e.target.value)}
                  className="syndicate-input"
                  placeholder="https://tokopedia.com/namatoko"
                />
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "6px" }}>
                  <i className="fa-brands fa-tiktok" style={{ color: "#ffffff" }}></i> Link TikTok Shop / Profil TikTok
                </label>
                <input
                  type="url"
                  value={formData.marketplace_links?.tiktok || ""}
                  onChange={(e) => updateMarketplace("tiktok", e.target.value)}
                  className="syndicate-input"
                  placeholder="https://tiktok.com/@akunbisnis"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "15px" }}>
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "6px" }}>
                    <i className="fa-solid fa-motorcycle" style={{ color: "#E31B23" }}></i> Link GoFood (Khusus F&B)
                  </label>
                  <input
                    type="url"
                    value={formData.marketplace_links?.gofood || ""}
                    onChange={(e) => updateMarketplace("gofood", e.target.value)}
                    className="syndicate-input"
                    placeholder="https://gofood.link/..."
                  />
                </div>

                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "6px" }}>
                    <i className="fa-solid fa-utensils" style={{ color: "#00B14F" }}></i> Link GrabFood (Khusus F&B)
                  </label>
                  <input
                    type="url"
                    value={formData.marketplace_links?.grabfood || ""}
                    onChange={(e) => updateMarketplace("grabfood", e.target.value)}
                    className="syndicate-input"
                    placeholder="https://food.grab.com/..."
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "6px" }}>
                  <i className="fa-brands fa-instagram" style={{ color: "#E1306C" }}></i> Link Akun Instagram Bisnis
                </label>
                <input
                  type="url"
                  value={formData.marketplace_links?.instagram || ""}
                  onChange={(e) => updateMarketplace("instagram", e.target.value)}
                  className="syndicate-input"
                  placeholder="https://instagram.com/akunbisnis"
                />
              </div>
            </div>
          )}

          {/* TAB 3: BRANDING & VISUAL (LOGO & COVER BANNER) */}
          {activeTab === "branding" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
              
              {/* Cover Banner Uploader (16:9) */}
              <div>
                <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px" }}>
                  Foto Cover / Banner Header Website (Landscape 16:9)
                </label>
                <div
                  onClick={() => bannerInputRef.current?.click()}
                  style={{
                    width: "100%",
                    height: "180px",
                    borderRadius: "16px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "2px dashed var(--glass-border)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {previewBanner ? (
                    <img src={previewBanner} alt="Banner Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <>
                      <i className="fa-solid fa-panorama" style={{ fontSize: "2.5rem", color: "var(--gold-main)", opacity: 0.6, marginBottom: "8px" }}></i>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Klik untuk Unggah Banner Cover (Rekomendasi 1280x720)</span>
                    </>
                  )}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: "0.75rem", textAlign: "center", padding: "6px 0" }}>
                    Ubah Banner Cover
                  </div>
                </div>
                <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, "banner")} accept="image/*" style={{ display: "none" }} />
              </div>

              {/* Logo Bisnis Uploader (1:1) */}
              <div>
                <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px" }}>
                  Logo Bisnis (Persegi 1:1)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "20px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "2px dashed var(--gold-main)",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      cursor: "pointer",
                      overflow: "hidden",
                      position: "relative",
                      flexShrink: 0,
                    }}
                  >
                    {previewLogo ? (
                      <img src={previewLogo} alt="Logo Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: "2rem", color: "var(--gold-main)", opacity: 0.6 }}></i>
                    )}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: "0.7rem", textAlign: "center", padding: "4px 0" }}>
                      Upload Logo
                    </div>
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                    Logo akan ditampilkan melayang di bagian atas halaman website bisnis dan di kartu katalog utama.
                    <br />
                    <span style={{ color: "var(--gold-main)", fontWeight: 600 }}>Format yang didukung: JPG, PNG, WEBP (Maks 10MB)</span>
                  </div>
                </div>
                <input type="file" ref={logoInputRef} onChange={(e) => handleFileChange(e, "logo")} accept="image/*" style={{ display: "none" }} />
              </div>

            </div>
          )}

          {/* TAB 4: PRODUK & LAYANAN (WORDPRESS REPEATER) */}
          {activeTab === "produk" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h3 style={{ color: "var(--text-primary)", fontSize: "1.1rem", margin: 0 }}>
                    Katalog Produk / Menu / Jasa Unggulan
                  </h3>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                    Tambahkan produk atau layanan agar calon pelanggan dapat langsung memesan via WhatsApp.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addProductItem}
                  style={{
                    background: "rgba(212, 175, 55, 0.15)",
                    border: "1px solid var(--gold-main)",
                    color: "var(--gold-main)",
                    padding: "8px 16px",
                    borderRadius: "50px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <i className="fa-solid fa-plus"></i> Tambah Produk/Jasa
                </button>
              </div>

              {/* Hidden file input for product images */}
              <input
                type="file"
                ref={productImgRef}
                onChange={handleProductImageSelect}
                accept="image/*"
                style={{ display: "none" }}
              />

              {(!formData.produk_layanan || formData.produk_layanan.length === 0) ? (
                <div style={{ textAlign: "center", padding: "40px 20px", background: "rgba(255,255,255,0.02)", border: "1px dashed var(--glass-border)", borderRadius: "14px" }}>
                  <i className="fa-solid fa-box-open" style={{ fontSize: "2.5rem", color: "var(--text-secondary)", opacity: 0.5, marginBottom: "12px" }}></i>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
                    Belum ada produk atau layanan yang ditambahkan. Klik tombol <strong>&ldquo;Tambah Produk/Jasa&rdquo;</strong> di atas.
                  </p>
                </div>
              ) : (
                formData.produk_layanan.map((prod, idx) => (
                  <div key={prod.id || idx} className="product-repeater-card">
                    <div className="product-repeater-header">
                      <span className="product-repeater-num">
                        <i className="fa-solid fa-cube" style={{ marginRight: "6px" }}></i> Item #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeProductItem(idx)}
                        className="product-remove-btn"
                      >
                        <i className="fa-solid fa-trash"></i> Hapus Item
                      </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "12px" }}>
                      <div>
                        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "4px" }}>
                          Nama Produk / Layanan <span style={{ color: "#ff4d6d" }}>*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={prod.nama}
                          onChange={(e) => updateProductItem(idx, "nama", e.target.value)}
                          className="syndicate-input"
                          placeholder="Misal: Kopi Susu Aren, Jasa Pembuatan Website"
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "4px" }}>
                          Estimasi Harga / Tarif
                        </label>
                        <input
                          type="text"
                          value={prod.harga || ""}
                          onChange={(e) => updateProductItem(idx, "harga", e.target.value)}
                          className="syndicate-input"
                          placeholder="Misal: Rp 25.000, Rp 1.500.000 / Proyek"
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", alignItems: "center" }}>
                      <div>
                        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "4px" }}>
                          Deskripsi Singkat Produk/Jasa
                        </label>
                        <input
                          type="text"
                          value={prod.deskripsi || ""}
                          onChange={(e) => updateProductItem(idx, "deskripsi", e.target.value)}
                          className="syndicate-input"
                          placeholder="Keterangan singkat, ukuran, spesifikasi, atau benefit..."
                        />
                      </div>

                      <div style={{ marginTop: "18px" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveProductIdx(idx);
                            productImgRef.current?.click();
                          }}
                          style={{
                            background: prod.foto ? "rgba(0, 255, 136, 0.15)" : "rgba(255, 255, 255, 0.08)",
                            border: `1px solid ${prod.foto ? "#00ff88" : "var(--glass-border)"}`,
                            color: prod.foto ? "#00ff88" : "var(--text-primary)",
                            padding: "10px 14px",
                            borderRadius: "10px",
                            fontSize: "0.82rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <i className={prod.foto ? "fa-solid fa-check" : "fa-solid fa-camera"}></i>
                          {prod.foto ? "Foto Terpasang" : "Upload Foto"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: PROMO ALUMNI & JAM OPERASIONAL */}
          {activeTab === "promo" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--gold-main)", fontSize: "0.95rem", fontWeight: 700, marginBottom: "6px" }}>
                  <i className="fa-solid fa-award"></i> Promo Khusus Pemegang KTA Sovereign Expedient 43
                </label>
                <textarea
                  rows={3}
                  value={formData.promo_alumni || ""}
                  onChange={(e) => setFormData({ ...formData, promo_alumni: e.target.value })}
                  className="syndicate-textarea"
                  placeholder="Contoh: Dapatkan diskon 15% atau Free Upgrade untuk sesama alumni Expedient 43 dengan menunjukkan KTA Sovereign digital!"
                />
                <small style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                  Promo ini akan disorot dengan bingkai emas khusus di halaman website bisnis Anda dan katalog alumni.
                </small>
              </div>

              <div>
                <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "6px" }}>
                  Jam & Hari Operasional
                </label>
                <input
                  type="text"
                  value={formData.jam_operasional || ""}
                  onChange={(e) => setFormData({ ...formData, jam_operasional: e.target.value })}
                  className="syndicate-input"
                  placeholder="Misal: Senin - Sabtu: 09:00 - 21:00 WIB (Minggu Libur)"
                />
              </div>

              <div>
                <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "6px" }}>
                  Link Google Maps Lokasi Usaha
                </label>
                <input
                  type="url"
                  value={formData.maps_url || ""}
                  onChange={(e) => setFormData({ ...formData, maps_url: e.target.value })}
                  className="syndicate-input"
                  placeholder="https://maps.app.goo.gl/..."
                />
              </div>
            </div>
          )}

          {/* Submit Actions Button */}
          <div style={{ display: "flex", gap: "15px", marginTop: "15px", flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 1,
                background: "linear-gradient(135deg, #d4af37, #aa8529)",
                color: "#000",
                border: "none",
                padding: "16px 24px",
                borderRadius: "14px",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: isSubmitting ? "wait" : "pointer",
                opacity: isSubmitting ? 0.7 : 1,
                boxShadow: "0 10px 25px rgba(212,175,55,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              <i className="fa-solid fa-cloud-arrow-up"></i>
              {isSubmitting ? "Menyimpan Data..." : "Publikasikan / Simpan Website Bisnis"}
            </button>
          </div>

        </form>

      </div>

      {/* Image Cropper Modal */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        imageSrc={rawCropImage || ""}
        title={cropTarget === "banner" ? "Sesuaikan Banner Cover (16:9)" : "Sesuaikan Logo Bisnis (1:1)"}
        aspectRatio={cropTarget === "banner" ? 16 / 9 : 1}
        outputWidth={cropTarget === "banner" ? 1280 : 600}
        outputHeight={cropTarget === "banner" ? 720 : 600}
        onApply={handleCropApply}
        onCancel={handleCropCancel}
      />
    </div>
  );
}

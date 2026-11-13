"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { getAvatarUrl } from "@/lib/avatar";
import { useConfirm } from "@/components/layout/AegisConfirm";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getThemeConfig, slugify } from "@/lib/syndicate/themes";
import "../syndicate.css";

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

interface BusinessData {
  id: string;
  user_id: string;
  nama_bisnis: string;
  kategori: string;
  tagline?: string | null;
  deskripsi: string;
  logo_bisnis?: string | null;
  banner_url?: string | null;
  link_url?: string | null;
  kota?: string | null;
  alamat?: string | null;
  promo_alumni?: string | null;
  jam_operasional?: string | null;
  maps_url?: string | null;
  marketplace_links?: MarketplaceLinks | null;
  produk_layanan?: ProductItem[] | null;
  galeri_foto?: string[] | null;
  theme?: string | null;
  profiles?: {
    id: string;
    nama_lengkap?: string | null;
    nama_panggilan?: string | null;
    foto_profil?: string | null;
    no_whatsapp?: string | null;
    alamat_lengkap?: string | null;
    akun_ig?: string | null;
  } | null;
}

interface Props {
  business: BusinessData;
  isOwner: boolean;
  viewerName: string;
}

export default function SyndicateDetailPage({ business, isOwner, viewerName }: Props) {
  const { t, locale } = useLanguage();
  const { showAlert } = useConfirm();
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);

  const themeConfig = getThemeConfig(business.theme);

  const ownerName = business.profiles?.nama_panggilan || business.profiles?.nama_lengkap || "Pemilik Usaha";
  const ownerAvatar = getAvatarUrl(business.profiles?.foto_profil, ownerName);
  const waRaw = business.profiles?.no_whatsapp || "";
  const cleanWa = waRaw.replace(/^0/, "62").replace(/[^0-9]/g, "");

  const logo = business.logo_bisnis
    ? (business.logo_bisnis.startsWith("http") || business.logo_bisnis.startsWith("/")
        ? business.logo_bisnis
        : `/uploads/bisnis/${business.logo_bisnis}`)
    : "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

  const banner = business.banner_url
    ? (business.banner_url.startsWith("http") || business.banner_url.startsWith("/")
        ? business.banner_url
        : `/uploads/bisnis/${business.banner_url}`)
    : "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80";

  const products: ProductItem[] = Array.isArray(business.produk_layanan) ? business.produk_layanan : [];
  const marketplaces: MarketplaceLinks = business.marketplace_links || {};

  // Construct dynamic prefilled WhatsApp message
  const mainWaMessage = encodeURIComponent(
    `Halo Mas/Mbak ${ownerName}, saya ${viewerName} (Alumni Expedient 43).\n\nSaya melihat profil bisnis "${business.nama_bisnis}" di Direktori Bisnis Alumni Expedient 43 dan tertarik untuk berkonsultasi/bertanya mengenai produk/layanan Anda. Terima kasih!`
  );
  const mainWaUrl = cleanWa ? `https://wa.me/${cleanWa}?text=${mainWaMessage}` : "#";

  const publicSlug = slugify(business.nama_bisnis) || business.id;
  const publicPath = `/b/${publicSlug}`;

  // Generate QR code for sharing the clean public URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const targetUrl = `${window.location.origin}${publicPath}`;
      QRCode.toDataURL(targetUrl, { width: 350, margin: 2, color: { dark: "#060b14", light: "#ffffff" } })
        .then((url: string) => setQrCodeDataUrl(url))
        .catch((err: any) => console.error("QR Code error:", err));
    }
  }, [publicPath]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const targetUrl = `${window.location.origin}${publicPath}`;
      navigator.clipboard.writeText(targetUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDownloadQr = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement("a");
    a.href = qrCodeDataUrl;
    a.download = `QR_${business.nama_bisnis.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
    a.click();
  };

  return (
    <div className={`syndicate-page biz-theme-${themeConfig.id}`}>
      <div className="microsite-container">
        
        {/* Navigation Breadcrumb & Action Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "10px" }}>
          <Link href="/syndicate" style={{ color: "var(--biz-text-secondary)", textDecoration: "none", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
            <i className="fa-solid fa-arrow-left"></i> {t.syndicate.back_to_list}
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--biz-gold)",
                backgroundColor: "var(--biz-gold-subtle)",
                padding: "6px 14px",
                borderRadius: "50px",
                border: "1px solid var(--biz-card-border)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <i className={`fa-solid ${themeConfig.icon}`}></i> {themeConfig.name}
            </span>

            {/* Direct Link to Standalone Public Microsite */}
            <Link
              href={publicPath}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "var(--biz-tag-bg)",
                border: "1px solid var(--biz-card-border)",
                color: "var(--biz-gold)",
                padding: "8px 16px",
                borderRadius: "50px",
                fontSize: "0.8rem",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
              title="Buka tampilan publik mandiri tanpa menu dashboard"
            >
              <i className="fa-solid fa-arrow-up-right-from-square"></i> Halaman Publik
            </Link>

            {isOwner && (
              <Link 
                href={`/syndicate/edit/${business.id}`}
                style={{
                  background: "var(--biz-gold-subtle)",
                  border: "1px solid var(--biz-gold)",
                  color: "var(--biz-gold)",
                  padding: "8px 18px",
                  borderRadius: "50px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <i className="fa-solid fa-pen-to-square"></i> {locale === "ar" ? "تعديل هذا الموقع" : locale === "en" ? "Edit This Webpage" : "Edit Profil Usaha"}
              </Link>
            )}
            <button
              onClick={() => setQrModalOpen(true)}
              style={{
                background: "var(--biz-tag-bg)",
                border: "1px solid var(--biz-tag-border)",
                color: "var(--biz-text-primary)",
                padding: "8px 16px",
                borderRadius: "50px",
                fontSize: "0.8rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <i className="fa-solid fa-qrcode"></i> {locale === "ar" ? "مشاركة / رمز QR" : locale === "en" ? "Share / QR" : "Bagikan / QR"}
            </button>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="microsite-banner">
          <Image 
            src={banner} 
            alt="Banner Cover" 
            fill 
            sizes="(max-width: 1080px) 100vw, 1040px"
            unoptimized={banner.startsWith("data:") || banner.includes("supabase.co")}
            priority
          />
          <div className="microsite-banner-overlay" />
        </div>

        {/* Header Content with Floating Logo */}
        <div className="microsite-header-content">
          <div className="microsite-logo-wrapper">
            <Image 
              src={logo} 
              alt={business.nama_bisnis} 
              fill 
              sizes="160px"
              unoptimized={logo.startsWith("data:") || logo.includes("supabase.co") || logo.includes("ui-avatars.com")}
            />
          </div>

          <h1 className="microsite-biz-name">{business.nama_bisnis}</h1>

          <div className="microsite-archetype-divider" aria-hidden="true">
            <i className={`fa-solid ${themeConfig.icon}`}></i>
          </div>

          {business.tagline && (
            <div className="microsite-tagline-text">
              &ldquo;{business.tagline}&rdquo;
            </div>
          )}

          {/* Badges Row */}
          <div className="microsite-badges-row">
            <span className="microsite-badge-pill" style={{ background: "var(--biz-gold-subtle)", border: "1px solid var(--biz-gold)", color: "var(--biz-gold)" }}>
              <i className="fa-solid fa-tag"></i> {business.kategori}
            </span>

            {business.kota && (
              <span className="microsite-badge-pill" style={{ background: "var(--biz-tag-bg)", border: "1px solid var(--biz-tag-border)", color: "var(--biz-text-secondary)" }}>
                <i className="fa-solid fa-location-dot" style={{ color: "#ef4444" }}></i> {business.kota}
              </span>
            )}

            <span className="microsite-badge-pill" style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.35)", color: "var(--biz-badge-owner)" }}>
              <i className="fa-solid fa-user-check"></i> {locale === "ar" ? "صاحب المشروع" : locale === "en" ? "Business Owner" : "Pemilik Usaha"}: {ownerName}
            </span>
          </div>

          {/* Primary Call to Action */}
          <div className="microsite-primary-cta">
            <a 
              href={mainWaUrl} 
              target={cleanWa ? "_blank" : "_self"} 
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!cleanWa) {
                  e.preventDefault();
                  showAlert("Informasi", "Pemilik belum mencantumkan nomor WhatsApp yang aktif.");
                }
              }}
              className="btn-cta-wa"
            >
              <i className="fa-brands fa-whatsapp" style={{ fontSize: "1.3rem" }}></i>
              {themeConfig.ctaWaText || t.syndicate.order_wa}
            </a>

            {business.link_url && (
              <a 
                href={business.link_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-cta-share"
              >
                <i className="fa-solid fa-globe" style={{ color: "var(--biz-gold)" }}></i>
                {t.syndicate.visit_website}
              </a>
            )}

            <button 
              onClick={handleCopyLink}
              className="btn-cta-share"
            >
              <i className={copiedLink ? "fa-solid fa-check" : "fa-solid fa-link"} style={{ color: copiedLink ? "#00c853" : "inherit" }}></i>
              {copiedLink ? "Link Tersalin!" : "Salin Link"}
            </button>
          </div>

          {/* Marketplace Hub (Shopee, Tokopedia, TikTok, GoFood, GrabFood, Instagram) */}
          {(marketplaces.shopee || marketplaces.tokopedia || marketplaces.tiktok || marketplaces.gofood || marketplaces.grabfood || marketplaces.instagram) && (
            <div className="marketplace-hub">
              <span style={{ fontSize: "0.85rem", color: "var(--biz-text-secondary)", marginRight: "6px", fontWeight: 600 }}>
                Toko Online / Pesan Di:
              </span>

              {marketplaces.shopee && (
                <a href={marketplaces.shopee} target="_blank" rel="noopener noreferrer" className="mkt-link-btn shopee">
                  <i className="fa-solid fa-bag-shopping" style={{ color: "#EE4D2D" }}></i> Shopee
                </a>
              )}

              {marketplaces.tokopedia && (
                <a href={marketplaces.tokopedia} target="_blank" rel="noopener noreferrer" className="mkt-link-btn tokopedia">
                  <i className="fa-solid fa-store" style={{ color: "#03AC0E" }}></i> Tokopedia
                </a>
              )}

              {marketplaces.tiktok && (
                <a href={marketplaces.tiktok} target="_blank" rel="noopener noreferrer" className="mkt-link-btn tiktok">
                  <i className="fa-brands fa-tiktok"></i> TikTok Shop
                </a>
              )}

              {marketplaces.gofood && (
                <a href={marketplaces.gofood} target="_blank" rel="noopener noreferrer" className="mkt-link-btn gofood">
                  <i className="fa-solid fa-motorcycle" style={{ color: "#E31B23" }}></i> GoFood
                </a>
              )}

              {marketplaces.grabfood && (
                <a href={marketplaces.grabfood} target="_blank" rel="noopener noreferrer" className="mkt-link-btn" style={{ borderColor: "#00B14F" }}>
                  <i className="fa-solid fa-utensils" style={{ color: "#00B14F" }}></i> GrabFood
                </a>
              )}

              {marketplaces.instagram && (
                <a href={marketplaces.instagram} target="_blank" rel="noopener noreferrer" className="mkt-link-btn">
                  <i className="fa-brands fa-instagram" style={{ color: "#E1306C" }}></i> Instagram
                </a>
              )}
            </div>
          )}
        </div>

        {/* Alumni Privilege Section */}
        {business.promo_alumni && (
          <div className="privilege-card">
            <div className="privilege-icon-box">
              <i className="fa-solid fa-award"></i>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "2px", color: "var(--biz-gold)", fontWeight: 700, marginBottom: "4px" }}>
                Hak Istimewa Alumni Expedient 43
              </div>
              <h3 style={{ fontSize: "1.25rem", color: "var(--biz-text-primary)", fontWeight: 700, margin: "0 0 6px" }}>
                Promo Diskon Pemegang KTA Resmi
              </h3>
              <p style={{ margin: 0, color: "var(--biz-text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>
                {business.promo_alumni}
              </p>
            </div>
          </div>
        )}

        {/* Showcase Produk & Layanan (Theme-Tailored Product Grid) */}
        {products.length > 0 && (
          <div style={{ marginBottom: "50px" }}>
            <h2 className="products-section-title">
              <i className={`fa-solid ${themeConfig.productsIcon}`} style={{ color: "var(--biz-gold)" }}></i>
              {themeConfig.productsTitle}
            </h2>

            <div className="products-grid">
              {products.map((item, idx) => {
                const productPhoto = item.foto || logo;
                const orderText = encodeURIComponent(
                  `Halo Mas/Mbak ${ownerName}, saya ${viewerName} (Alumni Expedient 43).\n\nSaya ingin memesan / menanyakan produk "${item.nama}"${item.harga ? ` (Harga: ${item.harga})` : ""} yang ada di halaman web bisnis Anda (${themeConfig.name}). Mohon info ketersediaannya. Terima kasih!`
                );
                const orderWaUrl = cleanWa ? `https://wa.me/${cleanWa}?text=${orderText}` : "#";

                return (
                  <div key={item.id || idx} className="product-card">
                    <div className="product-img-wrapper">
                      <Image 
                        src={productPhoto} 
                        alt={item.nama} 
                        fill 
                        sizes="(max-width: 640px) 100vw, 340px"
                        unoptimized={productPhoto.startsWith("data:") || productPhoto.includes("supabase.co")}
                      />
                      {item.harga && (
                        <div className="product-price-tag">
                          {item.harga}
                        </div>
                      )}
                    </div>
                    <div className="product-info-box">
                      <h3 className="product-title">{item.nama}</h3>
                      {item.deskripsi && (
                        <p className="product-desc">{item.deskripsi}</p>
                      )}
                      <a 
                        href={orderWaUrl} 
                        target={cleanWa ? "_blank" : "_self"} 
                        rel="noopener noreferrer"
                        className="btn-order-product"
                      >
                        <i className="fa-brands fa-whatsapp"></i> {themeConfig.orderButtonText}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detail Story & Information Grid */}
        <div className="microsite-meta-grid">
          {/* About Us / Cerita Usaha */}
          <div className="microsite-info-card" style={{ gridColumn: "1 / -1" }}>
            <h3>
              <i className="fa-solid fa-circle-info"></i> Tentang Usaha
            </h3>
            <div style={{ color: "var(--biz-text-secondary)", fontSize: "0.98rem", lineHeight: 1.8, whiteSpace: "pre-line" }}>
              {business.deskripsi}
            </div>
          </div>

          {/* Jam Operasional & Lokasi */}
          <div className="microsite-info-card">
            <h3>
              <i className="fa-regular fa-clock"></i> Jam Operasional
            </h3>
            <p style={{ color: "var(--biz-text-secondary)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "15px" }}>
              {business.jam_operasional || "Hubungi langsung via WhatsApp untuk janji temu / reservasi."}
            </p>

            {business.alamat && (
              <>
                <h4 style={{ color: "var(--biz-text-primary)", fontSize: "0.95rem", fontWeight: 700, margin: "15px 0 6px" }}>
                  Alamat / Lokasi:
                </h4>
                <p style={{ color: "var(--biz-text-secondary)", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "15px" }}>
                  {business.alamat}
                </p>
              </>
            )}

            {business.maps_url && (
              <a 
                href={business.maps_url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "var(--biz-gold)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textDecoration: "none"
                }}
              >
                <i className="fa-solid fa-map-location-dot"></i> Buka di Google Maps
              </a>
            )}
          </div>

          {/* Profil Pemilik (Alumni Founder) */}
          <div className="microsite-info-card">
            <h3>
              <i className="fa-solid fa-id-badge"></i> {locale === "ar" ? "بيانات المالك والخريج" : locale === "en" ? "Business Owner & Alumni" : "Profil Pemilik Usaha"}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
              <Image 
                src={ownerAvatar} 
                alt={ownerName} 
                width={65} 
                height={65} 
                style={{ borderRadius: "50%", objectFit: "cover", border: "2px solid var(--biz-gold)", background: "var(--biz-banner-ph)" }}
                unoptimized
              />
              <div>
                <h4 style={{ color: "var(--biz-text-primary)", fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
                  {ownerName}
                </h4>
                <div style={{ fontSize: "0.8rem", color: "var(--biz-badge-owner)", fontWeight: 700, marginTop: "2px" }}>
                  {locale === "ar" ? "خريج دفعة إكسبيدينت ٤٣" : locale === "en" ? "Expedient 43 Alumni" : "Alumni Expedient 43"}
                </div>
                {business.profiles?.akun_ig && (
                  <div style={{ fontSize: "0.8rem", color: "var(--biz-text-secondary)", marginTop: "2px" }}>
                    <i className="fa-brands fa-instagram" style={{ color: "#E1306C", marginRight: "4px" }}></i>
                    {business.profiles.akun_ig}
                  </div>
                )}
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--biz-footer-border)", paddingTop: "12px", marginTop: "10px" }}>
              <a 
                href={mainWaUrl} 
                target={cleanWa ? "_blank" : "_self"} 
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#16a34a",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textDecoration: "none"
                }}
              >
                <i className="fa-brands fa-whatsapp"></i> {locale === "ar" ? "تواصل مباشرة:" : locale === "en" ? "Direct Contact:" : "Hubungi Langsung:"} {waRaw || "Tidak ada nomor"}
              </a>
            </div>
          </div>
        </div>

        {/* Footer Branding */}
        <div style={{ textAlign: "center", padding: "40px 20px 20px", borderTop: "1px solid var(--biz-footer-border)", color: "var(--biz-text-secondary)", fontSize: "0.85rem" }}>
          <div style={{ fontFamily: "var(--font-playfair, serif)", color: "var(--biz-gold)", fontSize: "1.1rem", fontWeight: 700, marginBottom: "6px" }}>
            {locale === "ar" ? "دليل مشاريع ورواد أعمال دفعة إكسبيدينت ٤٣" : locale === "en" ? "Expedient 43 Alumni Business Network" : "Jejaring Bisnis & Usaha Alumni Expedient 43"}
          </div>
          <div>{locale === "ar" ? "دليل الأعمال والتعاون الاقتصادي بين خريجي المعهد" : locale === "en" ? "Alumni Venture Directory & Collaborative Economic Ecosystem" : "Direktori Usaha & Ekosistem Sinergi Bisnis Santri Slahung"}</div>
        </div>

      </div>

      {/* QR Code Sharing Modal */}
      {qrModalOpen && (
        <div className="qr-modal-backdrop" onClick={() => setQrModalOpen(false)}>
          <div className="qr-modal-box" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setQrModalOpen(false)}
              style={{ position: "absolute", top: "18px", right: "18px", background: "transparent", border: "none", color: "var(--biz-text-secondary)", fontSize: "1.3rem", cursor: "pointer" }}
            >
              <i className="fa-solid fa-times"></i>
            </button>

            <h3 style={{ fontFamily: "var(--biz-heading-font)", color: "var(--biz-gold)", fontSize: "1.4rem", margin: "0 0 8px" }}>
              {locale === "ar" ? "رمز QR لصفحة المشروع" : locale === "en" ? "Business QR Code" : "QR Code Halaman Usaha"}
            </h3>
            <p style={{ color: "var(--biz-text-secondary)", fontSize: "0.85rem", marginBottom: "20px" }}>
              {locale === "ar" 
                ? `امسح الرمز لفتح موقع ${business.nama_bisnis} على الهاتف أو شاركه مع العملاء.`
                : locale === "en"
                ? `Scan to open ${business.nama_bisnis} on a mobile device or share with clients.`
                : `Scan untuk membuka profil usaha ${business.nama_bisnis} di smartphone atau bagikan ke pelanggan.`}
            </p>

            {qrCodeDataUrl && (
              <div style={{ background: "#ffffff", padding: "15px", borderRadius: "16px", display: "inline-block", boxShadow: "0 10px 25px rgba(0,0,0,0.25)", marginBottom: "20px" }}>
                <Image src={qrCodeDataUrl} alt="QR Code" width={220} height={220} unoptimized />
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              <button 
                onClick={handleDownloadQr}
                style={{
                  background: "var(--biz-gold-btn)",
                  color: "var(--biz-btn-contrast-text)",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "50px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <i className="fa-solid fa-download"></i> {locale === "ar" ? "تحميل الرمز" : locale === "en" ? "Download QR" : "Unduh QR"}
              </button>

              <button 
                onClick={handleCopyLink}
                style={{
                  background: "var(--biz-tag-bg)",
                  border: "1px solid var(--biz-tag-border)",
                  color: "var(--biz-text-primary)",
                  padding: "10px 20px",
                  borderRadius: "50px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <i className={copiedLink ? "fa-solid fa-check" : "fa-solid fa-link"}></i>
                {copiedLink ? (locale === "ar" ? "تم النسخ!" : locale === "en" ? "Copied!" : "Tersalin!") : (locale === "ar" ? "نسخ الرابط" : locale === "en" ? "Copy Link" : "Salin Link")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { getAvatarUrl } from "@/lib/avatar";
import { useConfirm } from "@/components/layout/AegisConfirm";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { BUSINESS_THEMES, getThemeConfig } from "@/lib/syndicate/themes";
import { executeThemeTransition } from "@/lib/theme/executeThemeTransition";
import "@/app/(dashboard)/syndicate/syndicate.css";

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
  currentSlug: string;
  previewTheme?: string;
}

interface BlueprintConfig {
  sampleNote: string;
  products: (logoSrc: string, bannerSrc: string) => ProductItem[];
}

const DEFAULT_BLUEPRINTS: Record<string, BlueprintConfig> = {
  bistro: {
    sampleNote: "Daftar Menu & Sajian Khas",
    products: (logoSrc, bannerSrc) => [
      {
        id: "blueprint-bistro-1",
        nama: "Paket Ayam Geprek Berbek Komplit",
        harga: "Rp 22.000",
        deskripsi:
          "Ayam goreng krispi rempah khas Jawa Timur disajikan dengan sambal korek uleg pedas mantap, mentimun segar & nasi pulen hangat.",
        foto: logoSrc,
      },
      {
        id: "blueprint-bistro-2",
        nama: "Ayam Geprek Sambal Matah Spesial",
        harga: "Rp 25.000",
        deskripsi:
          "Ayam renyah berpadu irisan bawang merah segar, cabai rawit merah, serai wangi & perasan jeruk limau harum menggugah selera.",
        foto: bannerSrc,
      },
      {
        id: "blueprint-bistro-3",
        nama: "Es Jeruk Peras Murni & Es Teh Manis",
        harga: "Rp 6.000",
        deskripsi:
          "Minuman segar penawar dahaga dari perasan buah jeruk alami, cocok sebagai pendamping santapan pedas gurih.",
        foto: logoSrc,
      },
    ],
  },
  retail: {
    sampleNote: "Koleksi Lookbook Unggulan",
    products: (logoSrc, bannerSrc) => [
      {
        id: "blueprint-retail-1",
        nama: "Kemeja Casual Oxford Signature",
        harga: "Rp 185.000",
        deskripsi:
          "Bahan katun oxford premium dengan jahitan ganda rapi, potongan santai modern, saku tersembunyi, dan kenyamanan seharian.",
        foto: bannerSrc,
      },
      {
        id: "blueprint-retail-2",
        nama: "T-Shirt Heavyweight Combed 24s",
        harga: "Rp 120.000",
        deskripsi:
          "Kaos katun combed 24s bertekstur lembut, siluet boxy kontemporer, dengan sablon plastisol halus tahan cuci.",
        foto: logoSrc,
      },
      {
        id: "blueprint-retail-3",
        nama: "Canvas Tote Bag & Pouch Harian",
        harga: "Rp 65.000",
        deskripsi:
          "Tas jinjing kanvas tebal berkapasitas laptop 14 inci dengan kancing magnet dan ritsleting kuat untuk mobilitas santri & alumni.",
        foto: bannerSrc,
      },
    ],
  },
  agency: {
    sampleNote: "Kapabilitas & Solusi Layanan Studio",
    products: (logoSrc, bannerSrc) => [
      {
        id: "blueprint-agency-1",
        nama: "Konsultasi & Arsitektur Strategi",
        harga: "Rp 1.500.000",
        deskripsi:
          "Audit kebutuhan sistem, perancangan spesifikasi teknis, dan pemetaan peta jalan digital yang efisien dan terukur.",
        foto: logoSrc,
      },
      {
        id: "blueprint-agency-2",
        nama: "Pengembangan Website & Software Custom",
        harga: "Mulai Rp 4.500.000",
        deskripsi:
          "Pembangunan aplikasi web modern berbasis Next.js dan cloud database dengan jaminan performa kencang, aman, dan responsif.",
        foto: bannerSrc,
      },
      {
        id: "blueprint-agency-3",
        nama: "Maintenance & Dukungan Teknis Prioritas",
        harga: "Rp 750.000 / bln",
        deskripsi:
          "Monitoring stabilitas server berkala, pencadangan database rutin, update keamanan, dan jalur bantuan cepat via WhatsApp.",
        foto: logoSrc,
      },
    ],
  },
  heritage: {
    sampleNote: "Khazanah Karya Santri Ar-Risalah",
    products: (logoSrc, bannerSrc) => [
      {
        id: "blueprint-heritage-1",
        nama: "Minyak Wangi Non-Alkohol Khas Santri",
        harga: "Rp 75.000",
        deskripsi:
          "Aroma lembut bersahaja khas majelis pesantren, murni tanpa alkohol, menenangkan dan bertahan lama untuk ibadah.",
        foto: bannerSrc,
      },
      {
        id: "blueprint-heritage-2",
        nama: "Kain Sarung Tenun Halus Tradisional",
        harga: "Rp 165.000",
        deskripsi:
          "Tenunan bermotif warisan Nusantara dari benang katun pilihan, adem dipakai seharian dan berwibawa di setiap pertemuan.",
        foto: logoSrc,
      },
      {
        id: "blueprint-heritage-3",
        nama: "Madu Hutan Murni Sanad Santri",
        harga: "Rp 95.000",
        deskripsi:
          "Madu lebah liar hutan murni tanpa pemanis buatan, dipanen langsung dengan pengawasan amanah alumni untuk menjaga khasiat alami.",
        foto: bannerSrc,
      },
    ],
  },
  gold: {
    sampleNote: "Produk & Layanan Unggulan",
    products: (logoSrc, bannerSrc) => [
      {
        id: "blueprint-gold-1",
        nama: "Paket Produk & Layanan Prioritas",
        harga: "Rp 150.000",
        deskripsi:
          "Solusi terkurasi dengan standar mutu terbaik untuk memenuhi kebutuhan pelanggan dan mitra jejaring bisnis alumni.",
        foto: bannerSrc,
      },
      {
        id: "blueprint-gold-2",
        nama: "Paket Kemitraan Komprehensif",
        harga: "Rp 450.000",
        deskripsi:
          "Layanan terintegrasi dengan konsultasi langsung, garansi pengerjaan, dan pendampingan resmi dari pengelola usaha.",
        foto: logoSrc,
      },
      {
        id: "blueprint-gold-3",
        nama: "Paket Khusus Pesanan Kustom",
        harga: "Sesuai Kebutuhan",
        deskripsi:
          "Penyesuaian spesifikasi, volume, dan tenggat waktu pengerjaan khusus untuk kerja sama antar-alumni Expedient 43.",
        foto: bannerSrc,
      },
    ],
  },
};

function resolveMediaUrl(raw?: string | null, fallbackUrl?: string): string {
  if (!raw) return fallbackUrl || "";
  if (raw.startsWith("http") || raw.startsWith("/")) return raw;
  return `/uploads/bisnis/${raw}`;
}

export default function MicrositeStandaloneView({
  business,
  isOwner,
  viewerName,
  currentSlug,
  previewTheme,
}: Props) {
  const { locale, dir } = useLanguage();
  const { showAlert } = useConfirm();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [displayMode, setDisplayMode] = useState<"dark" | "light">("dark");

  const activeThemeId =
    previewTheme && BUSINESS_THEMES[previewTheme]
      ? previewTheme
      : business.theme && BUSINESS_THEMES[business.theme]
      ? business.theme
      : "gold";
  const themeConfig = getThemeConfig(activeThemeId);

  useEffect(() => {
    const current =
      (document.documentElement.getAttribute("data-theme") as "dark" | "light") ||
      (localStorage.getItem("expedient_theme") as "dark" | "light") ||
      "dark";
    setDisplayMode(current);
  }, []);

  // Scroll-driven progressive reveal for sections and cards below initial view
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>(".biz-reveal"));
    if (!targets.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -24px 0px" }
    );

    targets.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92) {
        el.classList.add("is-revealed");
      } else {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [activeThemeId]);

  const handleToggleDisplayMode = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = displayMode === "dark" ? "light" : "dark";
    setDisplayMode(next);
    executeThemeTransition(next, e);
  };

  const ownerName =
    business.profiles?.nama_panggilan || business.profiles?.nama_lengkap || "Pemilik Usaha";
  const ownerAvatar = getAvatarUrl(business.profiles?.foto_profil, ownerName);
  const waRaw = business.profiles?.no_whatsapp || "";
  const cleanWa = waRaw.replace(/^0/, "62").replace(/[^0-9]/g, "");

  const logo = resolveMediaUrl(
    business.logo_bisnis,
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  );
  const banner = resolveMediaUrl(
    business.banner_url,
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80"
  );

  const hasCustomProducts =
    Array.isArray(business.produk_layanan) && business.produk_layanan.length > 0;
  const currentBlueprint = DEFAULT_BLUEPRINTS[activeThemeId] || DEFAULT_BLUEPRINTS.gold;
  const showBlueprintSamples = !hasCustomProducts && Boolean(previewTheme);
  const products: ProductItem[] = hasCustomProducts
    ? (business.produk_layanan as ProductItem[])
    : showBlueprintSamples
    ? currentBlueprint.products(logo, banner)
    : [];
  const isSampleProducts = showBlueprintSamples;

  const galleryPhotos: string[] = Array.isArray(business.galeri_foto)
    ? business.galeri_foto.filter(Boolean).map((p) => resolveMediaUrl(p))
    : [];
  const marketplaces: MarketplaceLinks = business.marketplace_links || {};

  const buildWaUrl = (itemName?: string, itemPrice?: string) => {
    if (!cleanWa) return "#";
    const text = itemName
      ? `Halo Mas/Mbak ${ownerName}, saya ${viewerName}. Saya ingin memesan / menanyakan "${itemName}"${
          itemPrice ? ` (${itemPrice})` : ""
        } dari profil ${business.nama_bisnis}. Terima kasih.`
      : `Halo Mas/Mbak ${ownerName}, saya ${viewerName}. Saya melihat profil bisnis "${business.nama_bisnis}" di Direktori Alumni Expedient 43 dan tertarik berkonsultasi / memesan. Terima kasih.`;
    return `https://wa.me/${cleanWa}?text=${encodeURIComponent(text)}`;
  };

  const mainWaUrl = buildWaUrl();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const shareUrl = `${window.location.origin}/b/${currentSlug}`;
    QRCode.toDataURL(shareUrl, {
      width: 360,
      margin: 2,
      color: { dark: "#111214", light: "#ffffff" },
    })
      .then((url: string) => setQrCodeDataUrl(url))
      .catch((err: unknown) => console.error("QR Code generation error:", err));
  }, [currentSlug]);

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadQr = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement("a");
    a.href = qrCodeDataUrl;
    a.download = `QR_${business.nama_bisnis.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
    a.click();
  };

  const handleMissingWa = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!cleanWa) {
      e.preventDefault();
      showAlert("Informasi", "Pemilik belum mencantumkan nomor WhatsApp yang aktif.");
    }
  };

  const leadContextLine = `${
    business.tagline ? `${business.tagline}. ` : ""
  }${business.kategori}${business.kota ? ` di ${business.kota}` : ""} oleh ${ownerName}, alumni Expedient 43.`;

  const activeChannels = [
    marketplaces.shopee && { key: "shopee", label: "Shopee", icon: "fa-solid fa-bag-shopping", href: marketplaces.shopee },
    marketplaces.tokopedia && { key: "tokopedia", label: "Tokopedia", icon: "fa-solid fa-store", href: marketplaces.tokopedia },
    marketplaces.tiktok && { key: "tiktok", label: "TikTok Shop", icon: "fa-brands fa-tiktok", href: marketplaces.tiktok },
    marketplaces.gofood && { key: "gofood", label: "GoFood", icon: "fa-solid fa-motorcycle", href: marketplaces.gofood },
    marketplaces.grabfood && { key: "grabfood", label: "GrabFood", icon: "fa-solid fa-utensils", href: marketplaces.grabfood },
    marketplaces.instagram && { key: "instagram", label: "Instagram", icon: "fa-brands fa-instagram", href: marketplaces.instagram },
  ].filter(Boolean) as { key: string; label: string; icon: string; href: string }[];

  const renderPrimaryActions = () => (
    <div className="biz-cta-group biz-animate-mount-delay-2">
      <a
        href={mainWaUrl}
        target={cleanWa ? "_blank" : "_self"}
        rel="noopener noreferrer"
        onClick={handleMissingWa}
        className="biz-btn-primary"
      >
        <i className="fa-brands fa-whatsapp"></i>
        {themeConfig.ctaWaText || "Hubungi Bisnis"}
      </a>

      {business.link_url && (
        <a
          href={business.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="biz-btn-secondary"
        >
          <i className="fa-solid fa-globe"></i>
          Kunjungi Website
        </a>
      )}

      <button type="button" onClick={handleCopyLink} className="biz-btn-secondary">
        <i className={copiedLink ? "fa-solid fa-check" : "fa-solid fa-link"}></i>
        {copiedLink ? "Link Tersalin" : "Salin Link Halaman"}
      </button>
    </div>
  );

  const renderProductCatalogue = () => {
    if (products.length === 0) {
      return (
        <section className="biz-section" aria-labelledby="sec-products">
          <div className="biz-section-head biz-reveal">
            <div>
              <h2 id="sec-products" className="biz-section-title" style={{ margin: 0 }}>
                {themeConfig.productsTitle}
              </h2>
              <p className="biz-section-note">
                {locale === "ar"
                  ? "لم يضف صاحب النشاط قائمة منتجات أو خدمات بعد. تواصل عبر واتساب للاستفسار المباشر."
                  : locale === "en"
                  ? "The business owner has not added product or service items yet. Contact directly via WhatsApp for details."
                  : "Pemilik usaha belum menambahkan daftar produk atau layanan. Hubungi langsung melalui WhatsApp untuk informasi terbaru."}
              </p>
            </div>
            {isOwner && (
              <Link href="/syndicate" className="biz-btn-secondary">
                <i className="fa-solid fa-plus" aria-hidden="true"></i>{" "}
                {locale === "ar" ? "إضافة منتجات" : locale === "en" ? "Add Products" : "Kelola Katalog"}
              </Link>
            )}
          </div>
        </section>
      );
    }

    if (activeThemeId === "bistro") {
      return (
        <section className="biz-section" aria-labelledby="sec-products">
          <div className="biz-section-head biz-reveal">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                <h2 id="sec-products" className="biz-section-title" style={{ margin: 0 }}>
                  {themeConfig.productsTitle}
                </h2>
                {isSampleProducts && (
                  <span className="tpl-sample-badge">
                    <i className="fa-solid fa-sparkles"></i> {currentBlueprint.sampleNote}
                  </span>
                )}
              </div>
              <p className="biz-section-note">
                Sajian dan paket hidangan siap dipesan langsung lewat WhatsApp dapur kami.
              </p>
            </div>
          </div>

          <div className="tpl-bistro-ledger-list">
            {products.map((item, idx) => (
              <article key={item.id || idx} className="tpl-bistro-ledger-row biz-reveal">
                <div className="tpl-bistro-dish-thumb">
                  <Image
                    src={resolveMediaUrl(item.foto, logo)}
                    alt={item.nama}
                    width={120}
                    height={120}
                    unoptimized
                  />
                </div>
                <div className="tpl-bistro-dish-body">
                  <div className="tpl-bistro-dish-top">
                    <h3 className="biz-item-title">{item.nama}</h3>
                    {item.harga && <span className="tpl-bistro-dish-price">{item.harga}</span>}
                  </div>
                  {item.deskripsi && <p className="biz-item-desc">{item.deskripsi}</p>}
                  <div style={{ marginTop: "12px" }}>
                    <a
                      href={buildWaUrl(item.nama, item.harga)}
                      target={cleanWa ? "_blank" : "_self"}
                      rel="noopener noreferrer"
                      onClick={handleMissingWa}
                      className="biz-link-inline"
                    >
                      {themeConfig.orderButtonText}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (activeThemeId === "retail") {
      return (
        <section className="biz-section" aria-labelledby="sec-products">
          <div className="biz-section-head biz-reveal">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                <h2 id="sec-products" className="biz-section-title" style={{ margin: 0 }}>
                  {themeConfig.productsTitle}
                </h2>
                {isSampleProducts && (
                  <span className="tpl-sample-badge">
                    <i className="fa-solid fa-sparkles"></i> {currentBlueprint.sampleNote}
                  </span>
                )}
              </div>
              <p className="biz-section-note">
                Katalog pilihan dengan detail ukuran dan stok real-time dari pengelola.
              </p>
            </div>
          </div>

          <div className="tpl-retail-catalogue-grid">
            {products.map((item, idx) => (
              <article key={item.id || idx} className="tpl-retail-item-card biz-reveal">
                <div className="tpl-retail-item-media">
                  <Image
                    src={resolveMediaUrl(item.foto, banner)}
                    alt={item.nama}
                    width={480}
                    height={360}
                    unoptimized
                  />
                </div>
                <div className="tpl-retail-item-body">
                  <h3 className="biz-item-title">{item.nama}</h3>
                  {item.harga && <div className="biz-item-price">{item.harga}</div>}
                  {item.deskripsi && <p className="biz-item-desc">{item.deskripsi}</p>}
                  <div style={{ marginTop: "auto", paddingTop: "8px" }}>
                    <a
                      href={buildWaUrl(item.nama, item.harga)}
                      target={cleanWa ? "_blank" : "_self"}
                      rel="noopener noreferrer"
                      onClick={handleMissingWa}
                      className="biz-btn-secondary"
                      style={{ width: "100%" }}
                    >
                      {themeConfig.orderButtonText}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (activeThemeId === "agency") {
      return (
        <section className="biz-section" aria-labelledby="sec-products">
          <div className="tpl-agency-solutions-layout">
            <div className="biz-reveal">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                <h2 id="sec-products" className="biz-section-title" style={{ margin: 0 }}>
                  {themeConfig.productsTitle}
                </h2>
                {isSampleProducts && (
                  <span className="tpl-sample-badge">
                    <i className="fa-solid fa-sparkles"></i> {currentBlueprint.sampleNote}
                  </span>
                )}
              </div>
              <p className="biz-section-note">
                Ruang lingkup pengerjaan yang terstruktur dengan estimasi transparan dan dukungan langsung tim.
              </p>
            </div>

            <div className="tpl-agency-solution-list">
              {products.map((item, idx) => (
                <article key={item.id || idx} className="tpl-agency-solution-row biz-reveal">
                  <div className="biz-photo-frame" style={{ aspectRatio: "4 / 3" }}>
                    <Image
                      src={resolveMediaUrl(item.foto, logo)}
                      alt={item.nama}
                      width={160}
                      height={120}
                      unoptimized
                    />
                  </div>
                  <div>
                    <h3 className="biz-item-title">{item.nama}</h3>
                    {item.harga && <div className="biz-item-price" style={{ marginTop: "4px" }}>{item.harga}</div>}
                    {item.deskripsi && (
                      <p className="biz-item-desc" style={{ marginTop: "6px" }}>
                        {item.deskripsi}
                      </p>
                    )}
                  </div>
                  <div>
                    <a
                      href={buildWaUrl(item.nama, item.harga)}
                      target={cleanWa ? "_blank" : "_self"}
                      rel="noopener noreferrer"
                      onClick={handleMissingWa}
                      className="biz-btn-secondary"
                    >
                      {themeConfig.orderButtonText}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      );
    }

    // Default Catalogue Grid for Gold & Heritage
    return (
      <section className="biz-section" aria-labelledby="sec-products">
        <div className="biz-section-head biz-reveal">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
              <h2 id="sec-products" className="biz-section-title" style={{ margin: 0 }}>
                {themeConfig.productsTitle}
              </h2>
              {isSampleProducts && (
                <span className="tpl-sample-badge">
                  <i className="fa-solid fa-sparkles"></i> {currentBlueprint.sampleNote}
                </span>
              )}
            </div>
            <p className="biz-section-note">
              Hubungi langsung pengelola untuk pemesanan satuan, grosir, maupun penyesuaian kebutuhan.
            </p>
          </div>
        </div>

        <div className="biz-catalogue-grid">
          {products.map((item, idx) => (
            <article key={item.id || idx} className="biz-catalogue-card biz-reveal">
              <div className="biz-catalogue-photo">
                <Image
                  src={resolveMediaUrl(item.foto, banner)}
                  alt={item.nama}
                  width={480}
                  height={360}
                  unoptimized
                />
              </div>
              <div className="biz-catalogue-body">
                <h3 className="biz-item-title">{item.nama}</h3>
                {item.harga && <div className="biz-item-price">{item.harga}</div>}
                {item.deskripsi && <p className="biz-item-desc">{item.deskripsi}</p>}
                <div style={{ marginTop: "auto", paddingTop: "8px" }}>
                  <a
                    href={buildWaUrl(item.nama, item.harga)}
                    target={cleanWa ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    onClick={handleMissingWa}
                    className="biz-btn-secondary"
                    style={{ width: "100%" }}
                  >
                    <i className="fa-brands fa-whatsapp"></i>
                    {themeConfig.orderButtonText}
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  };

  const renderStoryAndDossier = () => (
    <section className="biz-section" aria-labelledby="sec-dossier">
      <div className="biz-dossier-grid">
        <article className="biz-panel biz-panel-story biz-reveal">
          {activeThemeId === "heritage" && (
            <div className="tpl-heritage-bismillah" aria-label="Bismillah">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
          )}
          <h2 id="sec-dossier" className="biz-panel-heading">
            {locale === "ar"
              ? "عن المشروع"
              : locale === "en"
              ? "About the Business"
              : `Tentang ${business.nama_bisnis}`}
          </h2>
          <p className="biz-prose">{business.deskripsi}</p>
        </article>

        <article className="biz-panel biz-panel-hours biz-reveal">
          {activeThemeId === "bistro" && (
            <div>
              <span className="tpl-bistro-status-badge">
                <i className="fa-solid fa-fire-burner"></i> Status Dapur: Buka & Siap Order
              </span>
            </div>
          )}
          {activeThemeId === "retail" && (
            <div>
              <span className="tpl-bistro-status-badge" style={{ color: "var(--biz-accent)" }}>
                <i className="fa-solid fa-store"></i> Galeri & Pengiriman Aktif
              </span>
            </div>
          )}
          <h3 className="biz-panel-heading">Jam Operasional dan Lokasi</h3>
          <p className="biz-prose">
            {business.jam_operasional ||
              "Hubungi langsung lewat WhatsApp untuk jadwal layanan, pemesanan, atau janji temu."}
          </p>

          {business.alamat && (
            <div>
              <h4 className="biz-sub-heading">Alamat Lengkap</h4>
              <p className="biz-prose" style={{ marginTop: "6px" }}>
                {business.alamat}
              </p>
            </div>
          )}

          {business.maps_url && (
            <div style={{ marginTop: "auto", paddingTop: "6px" }}>
              <a
                href={business.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="biz-link-inline"
              >
                <i className="fa-solid fa-map-location-dot"></i>
                Buka Petunjuk Google Maps
              </a>
            </div>
          )}
        </article>

        <article className="biz-panel biz-panel-owner biz-reveal">
          <h3 className="biz-panel-heading">Pengelola dan Kontak Resmi</h3>
          <div className="biz-owner-card-row">
            <Image
              src={ownerAvatar}
              alt={ownerName}
              width={156}
              height={144}
              className="biz-owner-photo"
              unoptimized
            />
            <div>
              <div className="biz-item-title">{ownerName}</div>
              <div style={{ color: "var(--biz-status-ok)", fontWeight: 700, fontSize: "0.94rem" }}>
                Alumni Expedient 43 Arrisalah Slahung
              </div>
              {business.profiles?.akun_ig && (
                <div style={{ color: "var(--biz-text-secondary)", fontSize: "0.92rem", marginTop: "4px" }}>
                  Instagram: {business.profiles.akun_ig}
                </div>
              )}
            </div>
          </div>

          <div>
            <a
              href={mainWaUrl}
              target={cleanWa ? "_blank" : "_self"}
              rel="noopener noreferrer"
              onClick={handleMissingWa}
              className="biz-link-inline"
              style={{ color: "var(--biz-status-ok)" }}
            >
              <i className="fa-brands fa-whatsapp"></i>
              WhatsApp Langsung: {waRaw || "Nomor belum tersedia"}
            </a>
          </div>

          <div className="biz-owner-qr-row biz-reveal">
            <div>
              <div style={{ fontWeight: 700, color: "var(--biz-text-primary)", fontSize: "0.96rem" }}>
                Kartu Bagikan Cepat
              </div>
              <div style={{ color: "var(--biz-text-secondary)", fontSize: "0.92rem", marginTop: "4px", maxWidth: "26ch" }}>
                Pindai QR untuk membuka profil usaha ini langsung di ponsel.
              </div>
              <div style={{ marginTop: "12px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button type="button" onClick={() => setQrModalOpen(true)} className="biz-nav-btn">
                  Perbesar QR
                </button>
                <button type="button" onClick={handleDownloadQr} className="biz-nav-btn">
                  Unduh PNG
                </button>
              </div>
            </div>
            {qrCodeDataUrl && (
              <div className="biz-qr-thumb">
                <Image
                  src={qrCodeDataUrl}
                  alt={`Kode QR ${business.nama_bisnis}`}
                  width={144}
                  height={144}
                  unoptimized
                />
              </div>
            )}
          </div>
        </article>
      </div>
    </section>
  );

  const renderHeroByTemplate = () => {
    if (activeThemeId === "bistro") {
      return (
        <section className="tpl-bistro-hero">
          <div className="tpl-bistro-copy">
            <h1 className="biz-display-title">{business.nama_bisnis}</h1>
            <p className="biz-lead-copy biz-animate-mount">{leadContextLine}</p>
            <div className="biz-meta-line biz-animate-mount-delay-1">
              <span>{business.kategori}</span>
              {business.kota && <span>· {business.kota}</span>}
              <span>· {themeConfig.name}</span>
            </div>
            {renderPrimaryActions()}
          </div>

          <div className="tpl-bistro-media-duo">
            <div className="biz-photo-frame tpl-bistro-main-dish biz-animate-mount-delay-1">
              <Image
                src={banner}
                alt={`Suasana atau sajian ${business.nama_bisnis}`}
                width={900}
                height={675}
                unoptimized
                priority
              />
            </div>
            <div className="biz-photo-frame tpl-bistro-side-dish biz-animate-mount-delay-2">
              <Image
                src={logo}
                alt={`Hidangan khas ${business.nama_bisnis}`}
                width={600}
                height={800}
                unoptimized
              />
            </div>
          </div>
        </section>
      );
    }

    if (activeThemeId === "retail") {
      return (
        <section>
          <div className="tpl-retail-masthead">
            <div>
              <h1 className="biz-display-title">{business.nama_bisnis}</h1>
              <p className="biz-lead-copy biz-animate-mount" style={{ marginTop: "12px" }}>
                {leadContextLine}
              </p>
            </div>
            <div className="biz-animate-mount-delay-1" style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-start" }}>
              <div className="biz-meta-line">
                <span>{business.kategori}</span>
                {business.kota && <span>· {business.kota}</span>}
              </div>
              {renderPrimaryActions()}
            </div>
          </div>

          <div className="tpl-retail-lookbook-spread">
            <div className="biz-photo-frame tpl-retail-wide-frame biz-animate-mount-delay-1">
              <Image
                src={banner}
                alt={`Lookbook ${business.nama_bisnis}`}
                width={1200}
                height={675}
                unoptimized
                priority
              />
            </div>
            <div className="tpl-retail-mark-tile biz-animate-mount-delay-2">
              <div className="biz-photo-frame tpl-retail-mark-photo">
                <Image
                  src={logo}
                  alt={`Identitas visual ${business.nama_bisnis}`}
                  width={520}
                  height={520}
                  unoptimized
                />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--biz-text-primary)" }}>
                  {themeConfig.name}
                </div>
                <div style={{ fontSize: "0.92rem", color: "var(--biz-text-secondary)" }}>
                  {business.kota || "Jejaring Alumni Expedient 43"}
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (activeThemeId === "agency") {
      return (
        <section className="tpl-agency-hero">
          <div className="tpl-agency-aside biz-animate-mount">
            <div className="biz-photo-frame" style={{ aspectRatio: "1 / 1", width: "136px" }}>
              <Image
                src={logo}
                alt={`Logo ${business.nama_bisnis}`}
                width={200}
                height={200}
                unoptimized
              />
            </div>
            <div className="biz-meta-tag" style={{ fontSize: "1rem" }}>{business.kategori}</div>
            <p className="biz-section-note">
              Berbasis di {business.kota || "Indonesia"}. Dikelola oleh {ownerName}, alumni Expedient 43.
            </p>
            <div style={{ fontSize: "1rem", color: "var(--biz-accent)", fontWeight: 700 }}>
              {themeConfig.archetypeLabel}
            </div>
          </div>

          <div className="tpl-agency-main">
            <h1 className="biz-display-title">{business.nama_bisnis}</h1>
            <p className="biz-lead-copy biz-animate-mount-delay-1">{leadContextLine}</p>
            {renderPrimaryActions()}

            <div className="tpl-agency-visual-pair">
              <div className="biz-photo-frame tpl-agency-visual-main biz-animate-mount-delay-1">
                <Image
                  src={banner}
                  alt={`Karya dan profil ${business.nama_bisnis}`}
                  width={1000}
                  height={560}
                  unoptimized
                  priority
                />
              </div>
              <div className="biz-photo-frame tpl-agency-visual-thumb biz-animate-mount-delay-2">
                <Image
                  src={ownerAvatar}
                  alt={`Profil ${ownerName}`}
                  width={480}
                  height={360}
                  unoptimized
                />
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (activeThemeId === "heritage") {
      return (
        <section className="tpl-heritage-hero">
          <h1 className="biz-display-title" style={{ maxWidth: "18ch" }}>
            {business.nama_bisnis}
          </h1>
          <p className="biz-lead-copy biz-animate-mount" style={{ textAlign: "center" }}>
            {leadContextLine}
          </p>
          <div className="biz-meta-line biz-animate-mount-delay-1" style={{ justifyContent: "center" }}>
            <span>{themeConfig.trustBadgeText}</span>
            {business.kota && <span>· {business.kota}</span>}
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>{renderPrimaryActions()}</div>

          <div className="tpl-heritage-gallery-pair">
            <div className="biz-photo-frame tpl-heritage-frame-main biz-animate-mount-delay-1">
              <Image
                src={banner}
                alt={`Dokumentasi ${business.nama_bisnis}`}
                width={1080}
                height={608}
                unoptimized
                priority
              />
            </div>
            <div className="biz-photo-frame tpl-heritage-frame-side biz-animate-mount-delay-2">
              <Image
                src={logo}
                alt={`Penanda usaha ${business.nama_bisnis}`}
                width={640}
                height={480}
                unoptimized
              />
            </div>
          </div>
        </section>
      );
    }

    // Default 1: Gold - Royale Editorial Dossier
    return (
      <section className="tpl-gold-hero">
        <div className="tpl-gold-hero-copy">
          <h1 className="biz-display-title">{business.nama_bisnis}</h1>
          <p className="biz-lead-copy biz-animate-mount">{leadContextLine}</p>
          <div className="biz-meta-line biz-animate-mount-delay-1">
            <span>{business.kategori}</span>
            {business.kota && <span>· {business.kota}</span>}
            <span>· {themeConfig.name}</span>
          </div>
          {renderPrimaryActions()}
        </div>

        <div className="tpl-gold-media-pair">
          <div className="biz-photo-frame tpl-gold-banner-frame biz-animate-mount-delay-1">
            <Image
              src={banner}
              alt={`Tampilan utama ${business.nama_bisnis}`}
              width={900}
              height={675}
              unoptimized
              priority
            />
          </div>
          <div className="biz-photo-frame tpl-gold-mark-frame biz-animate-mount-delay-2">
            <Image
              src={logo}
              alt={`Logo ${business.nama_bisnis}`}
              width={480}
              height={600}
              unoptimized
            />
          </div>
        </div>
      </section>
    );
  };

  return (
    <div ref={rootRef} dir={dir} className={`standalone-microsite-viewport biz-theme-${themeConfig.id}`}>
      {/* Clean Non-Sticky Top Bar Aligned to .biz-shell */}
      <header className="biz-topbar">
        <div className="biz-shell">
          <div className="biz-topbar-inner">
            <Link
              href="/syndicate"
              className="biz-wordmark biz-animate-mount"
              title="Kembali ke Direktori Bisnis Alumni Expedient 43"
            >
              <span>Expedient 43</span>
              <span className="biz-wordmark-sub">/ Direktori Bisnis</span>
            </Link>

            <nav className="biz-topbar-nav biz-animate-mount" aria-label="Aksi halaman usaha">
              <button
                type="button"
                onClick={handleToggleDisplayMode}
                className="biz-nav-btn"
                title={displayMode === "dark" ? "Beralih ke Mode Siang" : "Beralih ke Mode Malam"}
                aria-label="Ubah tema siang atau malam"
              >
                <i className={`fa-solid ${displayMode === "dark" ? "fa-sun" : "fa-moon"}`}></i>
                <span>{displayMode === "dark" ? "Mode Siang" : "Mode Malam"}</span>
              </button>

              {isOwner && (
                <Link href={`/syndicate/edit/${business.id}`} className="biz-nav-btn biz-nav-edit">
                  <i className="fa-solid fa-pen-to-square"></i>
                  <span className="hide-mobile-sm">Edit Profil</span>
                </Link>
              )}

              <button
                type="button"
                onClick={() => setQrModalOpen(true)}
                className="biz-nav-btn hide-mobile-sm"
              >
                <i className="fa-solid fa-qrcode"></i>
                <span>QR Usaha</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="biz-main">
        <div className="biz-shell">
          {renderHeroByTemplate()}

          {/* Marketplace & Channel Links */}
          {activeChannels.length > 0 && (
            <section className="biz-section biz-reveal" aria-label="Kanal pembelian dan sosial media">
              <div className="biz-channels-strip">
                {activeChannels.map((ch) => (
                  <a
                    key={ch.key}
                    href={ch.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="biz-channel-link"
                  >
                    <i className={ch.icon}></i>
                    {ch.label}
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Special Alumni Privilege Band */}
          {business.promo_alumni && (
            <section className="biz-section biz-reveal" aria-labelledby="sec-promo">
              <div className="biz-promo-band">
                <div>
                  <h2 id="sec-promo" className="biz-panel-heading">
                    {locale === "ar"
                      ? "ميزة خاصة للخريجين (KTA)"
                      : locale === "en"
                      ? "Exclusive Alumni KTA Privilege"
                      : "Keistimewaan Khusus Alumni Expedient 43"}
                  </h2>
                  <p className="biz-prose" style={{ marginTop: "8px" }}>
                    {business.promo_alumni}
                  </p>
                </div>
                <a
                  href={mainWaUrl}
                  target={cleanWa ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  onClick={handleMissingWa}
                  className="biz-btn-primary"
                >
                  Klaim via WhatsApp
                </a>
              </div>
            </section>
          )}

          {/* Distinct Architecture per Archetype */}
          {activeThemeId === "bistro" ? (
            <>
              {renderProductCatalogue()}

              {/* Dedicated Bistro Catering & Nasi Kotak Banner */}
              <section className="biz-section biz-reveal" aria-label="Layanan Katering dan Pesanan Acara">
                <div className="tpl-bistro-catering-banner">
                  <div>
                    <span className="tpl-bistro-status-badge">
                      <i className="fa-solid fa-bell-concierge"></i> Layanan Khusus Acara
                    </span>
                    <h3 className="tpl-bistro-catering-title">Pesanan Nasi Kotak, Prasmanan, & Jamuan Alumni</h3>
                    <p className="tpl-bistro-catering-desc">
                      Menerima pesanan porsi besar untuk rapat kantor, kajian santri, tasyakuran keluarga, dan agenda reuni santri dengan jaminan kebersihan serta ketepatan waktu.
                    </p>
                  </div>
                  <a
                    href={buildWaUrl("Pesanan katering / nasi kotak acara")}
                    target={cleanWa ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    onClick={handleMissingWa}
                    className="biz-btn-primary"
                  >
                    <i className="fa-brands fa-whatsapp"></i>
                    Pesan Katering Acara
                  </a>
                </div>
              </section>

              {renderStoryAndDossier()}
            </>
          ) : activeThemeId === "agency" ? (
            <>
              {renderProductCatalogue()}

              {/* Dedicated Agency 3-Step Studio Workflow */}
              <section className="biz-section biz-reveal" aria-labelledby="sec-agency-workflow">
                <div className="biz-section-head">
                  <div>
                    <h2 id="sec-agency-workflow" className="biz-section-title">
                      Alur Kerja & Standar Kolaborasi
                    </h2>
                    <p className="biz-section-note">
                      Metodologi teruji untuk memastikan hasil tuntas, terukur, dan transparan dari awal hingga akhir.
                    </p>
                  </div>
                </div>
                <div className="tpl-agency-workflow-grid">
                  <div className="tpl-agency-workflow-step">
                    <div className="tpl-agency-step-num">TAHAP 01</div>
                    <h3 className="biz-item-title" style={{ fontSize: "1.1rem" }}>Konsultasi & Penyelarasan Kebutuhan</h3>
                    <p className="biz-item-desc">
                      Memahami objektif, tantangan bisnis, dan spesifikasi target secara mendalam bersama pengelola langsung.
                    </p>
                  </div>
                  <div className="tpl-agency-workflow-step">
                    <div className="tpl-agency-step-num">TAHAP 02</div>
                    <h3 className="biz-item-title" style={{ fontSize: "1.1rem" }}>Perancangan & Eksekusi Terukur</h3>
                    <p className="biz-item-desc">
                      Pengerjaan sprint berbasis milestone transparan dengan pelaporan berkala tanpa kejutan teknis atau biaya.
                    </p>
                  </div>
                  <div className="tpl-agency-workflow-step">
                    <div className="tpl-agency-step-num">TAHAP 03</div>
                    <h3 className="biz-item-title" style={{ fontSize: "1.1rem" }}>Serah Terima & Garansi Dukungan</h3>
                    <p className="biz-item-desc">
                      Penyelesaian tuntas, transfer aset menyeluruh, dokumentasi serah terima, dan pendampingan implementasi operasional.
                    </p>
                  </div>
                </div>
              </section>

              {renderStoryAndDossier()}
            </>
          ) : activeThemeId === "heritage" ? (
            <>
              {renderStoryAndDossier()}
              {renderProductCatalogue()}
            </>
          ) : (
            <>
              {renderProductCatalogue()}
              {renderStoryAndDossier()}
            </>
          )}

          {/* Uploaded Gallery Photos */}
          {galleryPhotos.length > 0 && (
            <section className="biz-section" aria-labelledby="sec-gallery">
              <div className="biz-section-head biz-reveal">
                <div>
                  <h2 id="sec-gallery" className="biz-section-title">
                    Galeri Dokumentasi Usaha
                  </h2>
                  <p className="biz-section-note">
                    Foto kegiatan, produk, atau suasana tempat usaha.
                  </p>
                </div>
              </div>

              <div className="biz-gallery-grid">
                {galleryPhotos.map((src, idx) => (
                  <div key={idx} className="biz-photo-frame biz-gallery-tile biz-reveal">
                    <Image
                      src={src}
                      alt={`Dokumentasi ${business.nama_bisnis} ${idx + 1}`}
                      width={520}
                      height={390}
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Clean Public Directory Footer */}
      <footer className="biz-footer">
        <div className="biz-shell">
          <div className="biz-footer-layout">
            <div className="biz-reveal">
              <div style={{ fontWeight: 700, fontSize: "1.02rem", color: "var(--biz-text-primary)" }}>
                Jejaring Bisnis Alumni Expedient 43
              </div>
              <p className="biz-section-note" style={{ marginTop: "6px" }}>
                Pondok Modern Arrisalah Slahung Ponorogo.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "18px", marginTop: "14px" }}>
                <Link href="/syndicate" className="biz-link-inline">
                  Jelajahi Direktori Lengkap
                </Link>
                <button
                  type="button"
                  onClick={() => setQrModalOpen(true)}
                  className="biz-link-inline"
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                >
                  Bagikan Kode QR
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Enlarged QR Share Dialog */}
      {qrModalOpen && (
        <div className="qr-modal-backdrop" onClick={() => setQrModalOpen(false)}>
          <div className="qr-modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setQrModalOpen(false)}
              aria-label="Tutup dialog QR"
              className="biz-nav-btn"
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                padding: "8px 12px",
              }}
            >
              <i className="fa-solid fa-times"></i>
            </button>

            <h3 className="biz-panel-heading" style={{ marginBottom: "8px" }}>
              QR Code Halaman Usaha
            </h3>
            <p className="biz-section-note" style={{ marginInline: "auto", marginBottom: "20px" }}>
              Pindai untuk membuka profil {business.nama_bisnis} di ponsel atau bagikan ke pelanggan.
            </p>

            {qrCodeDataUrl && (
              <div
                style={{
                  backgroundColor: "#ffffff",
                  padding: "14px",
                  borderRadius: "12px",
                  display: "inline-block",
                  marginBottom: "20px",
                }}
              >
                <Image src={qrCodeDataUrl} alt="QR Code" width={220} height={220} unoptimized />
              </div>
            )}

            <div className="biz-cta-group" style={{ justifyContent: "center" }}>
              <button type="button" onClick={handleDownloadQr} className="biz-btn-primary">
                <i className="fa-solid fa-download"></i>
                Unduh Gambar QR
              </button>
              <button type="button" onClick={handleCopyLink} className="biz-btn-secondary">
                <i className={copiedLink ? "fa-solid fa-check" : "fa-solid fa-link"}></i>
                {copiedLink ? "Link Tersalin" : "Salin Link Halaman"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

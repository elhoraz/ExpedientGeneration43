export interface BusinessThemeConfig {
  id: "gold" | "bistro" | "retail" | "agency" | "heritage";
  name: string;
  tagline: string;
  categoryFit: string;
  description: string;
  color: string;
  lightColor: string;
  icon: string;
  productsTitle: string;
  productsIcon: string;
  orderButtonText: string;
  ctaWaText: string;
  trustBadgeText: string;
  archetypeLabel: string;
}

export const BUSINESS_THEMES: Record<string, BusinessThemeConfig> = {
  gold: {
    id: "gold",
    name: "Royale Editorial",
    tagline: "Klasik, Prestisius & Berwibawa",
    categoryFit: "Semua Kategori Usaha & Korporat",
    description:
      "Komposisi asimetris dengan tipografi serif editorial dan kontras tonal obsidian/gading yang tenang.",
    color: "#d4af37",
    lightColor: "#85580c",
    icon: "fa-crown",
    productsTitle: "Produk & Layanan Unggulan",
    productsIcon: "fa-box-open",
    orderButtonText: "Pesan via WhatsApp",
    ctaWaText: "Hubungi Bisnis",
    trustBadgeText: "Jejaring Bisnis Resmi Alumni Expedient 43",
    archetypeLabel: "Tata Letak Editorial Klasik",
  },
  bistro: {
    id: "bistro",
    name: "Culinary & Bistro Ledger",
    tagline: "Kuliner, Kopi & Sajian Khas",
    categoryFit: "F&B, Kafe, Katering & Kuliner",
    description:
      "Tata letak khusus kuliner: menampilkan visual sajian di kanan hero dan daftar buku menu terstruktur dengan harga rapi.",
    color: "#f59e0b",
    lightColor: "#991b1b",
    icon: "fa-utensils",
    productsTitle: "Daftar Menu & Sajian",
    productsIcon: "fa-utensils",
    orderButtonText: "Pesan Menu Ini",
    ctaWaText: "Pesan Sekarang via WA",
    trustBadgeText: "Sajian Pilihan • Usaha Alumni Expedient 43",
    archetypeLabel: "Tata Letak Menu Kuliner",
  },
  retail: {
    id: "retail",
    name: "Lookbook Boutique",
    tagline: "Fashion, Apparel & Kriya",
    categoryFit: "Retail, Pakaian, Aksesori & Merchandise",
    description:
      "Galeri lookbook bersudut tegas dengan fotografi lebar mendominasi layar dan tampilan stok monokrom kontras tinggi.",
    color: "#fafafa",
    lightColor: "#18181b",
    icon: "fa-shirt",
    productsTitle: "Koleksi Lookbook",
    productsIcon: "fa-bag-shopping",
    orderButtonText: "Cek Stok & Beli",
    ctaWaText: "Tanya Produk via WA",
    trustBadgeText: "Koleksi Orisinal • Brand Resmi Alumni",
    archetypeLabel: "Tata Letak Galeri Lookbook",
  },
  agency: {
    id: "agency",
    name: "Modern Studio & Lab",
    tagline: "IT, Software, Kreatif & Konsultan",
    categoryFit: "Teknologi, Desain, Jasa & Konsultansi",
    description:
      "Struktur studio presisi bergaya Swiss grid dengan tipografi modern tegas, daftar kapabilitas, dan alur konsultasi cepat.",
    color: "#38bdf8",
    lightColor: "#0369a1",
    icon: "fa-laptop-code",
    productsTitle: "Kapabilitas & Solusi Layanan",
    productsIcon: "fa-layer-group",
    orderButtonText: "Konsultasi Layanan",
    ctaWaText: "Jadwalkan Konsultasi",
    trustBadgeText: "Kemitraan Profesional Alumni 43",
    archetypeLabel: "Tata Letak Studio Modern",
  },
  heritage: {
    id: "heritage",
    name: "Santri Heritage Craft",
    tagline: "Khas Pesantren, Herbal & Busana Muslim",
    categoryFit: "Busana Muslim, Kitab, Herbal & Karya Santri",
    description:
      "Komposisi arsip pesantren bernuansa zamrud hutan dalam & gading hangat, menonjolkan kisah usaha dan amanah halal.",
    color: "#34d399",
    lightColor: "#065f46",
    icon: "fa-mosque",
    productsTitle: "Karya & Produk Pilihan",
    productsIcon: "fa-seedling",
    orderButtonText: "Pesan Produk",
    ctaWaText: "Hubungi Pengelola",
    trustBadgeText: "Karya Alumni Ar-Risalah • Amanah & Halal",
    archetypeLabel: "Tata Letak Warisan Santri",
  },
};

export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function getBusinessSlug(business: { id: string; nama_bisnis?: string | null }): string {
  if (!business) return "";
  const cleanName = slugify(business.nama_bisnis || "");
  return cleanName || business.id;
}

export function getThemeConfig(themeId?: string | null): BusinessThemeConfig {
  if (!themeId || !BUSINESS_THEMES[themeId]) {
    return BUSINESS_THEMES.gold;
  }
  return BUSINESS_THEMES[themeId];
}

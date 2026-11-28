import type { Metadata, Viewport } from "next";
import Image from "next/image";
import { Analytics } from "@vercel/analytics/react";
import { Inter, Playfair_Display, Manrope, Amiri, Great_Vibes } from "next/font/google";
import "./globals.css";
import "../../public/css/design-system.css";
import "../../public/css/template.css";
import ClientLayout from "@/components/layout/ClientLayout";
import { CmsProvider } from "@/components/layout/CmsProvider";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { createAdminClient } from "@/lib/supabase/admin";
import { unstable_cache } from "next/cache";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-playfair",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

const signature = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-signature",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#060b14" },
    { media: "(prefers-color-scheme: light)", color: "#f6f5f1" },
  ],
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://expedientgeneration.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: "%s - Expedient Generation 43",
    default: "Expedient Generation 43 · Pondok Modern Arrisalah Slahung Ponorogo",
  },
  description: "Platform resmi dan arsip kenangan alumni angkatan ke-43 Pondok Modern Arrisalah Program Internasional, Slahung, Ponorogo, Jawa Timur.",
  keywords: [
    "Expedient Generation",
    "Expedient 43",
    "Pondok Modern Arrisalah",
    "Arrisalah Slahung",
    "Arrisalah Ponorogo",
    "Alumni Arrisalah",
    "Santri Ponorogo",
    "Angkatan 43",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Expedient 43",
  },
  openGraph: {
    title: "Expedient Generation 43 · Pondok Modern Arrisalah Slahung Ponorogo",
    description: "Platform resmi, arsip kenangan, dan jaringan alumni ke-43 Pondok Modern Arrisalah Program Internasional Slahung Ponorogo.",
    url: siteUrl,
    siteName: "Expedient Generation 43",
    images: [
      {
        url: "/images/logo-utuh.webp",
        width: 1200,
        height: 630,
        alt: "Expedient Generation 43 - Arrisalah Slahung Ponorogo",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Expedient Generation · Angkatan 43 Arrisalah Slahung",
    description: "Platform resmi, arsip kenangan, dan jaringan alumni ke-43 Pondok Modern Arrisalah Slahung Ponorogo.",
    images: ["/images/logo-utuh.webp"],
  },
  verification: {
    google: "googlec79c55f44fd979bb",
  },
};

const getCachedSiteContent = unstable_cache(
  async () => {
    try {
      const supabase = createAdminClient();
      const cmsPromise = supabase.from("site_content").select("content_key, content_value, content_type");
      const timeoutPromise = new Promise<{ data: null }>((resolve) => setTimeout(() => resolve({ data: null }), 3000));
      const { data } = await Promise.race([cmsPromise, timeoutPromise]);
      return data || [];
    } catch {
      return [];
    }
  },
  ["site_content_root_layout"],
  { revalidate: 60, tags: ["site_content"] }
);

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const allCms = await getCachedSiteContent();
  return (
    <html lang="id" className={`${inter.variable} ${playfair.variable} ${manrope.variable} ${amiri.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Expedient Generation",
              alternateName: [
                "Expedient Generation 43",
                "Expedient 43",
                "Alumni Arrisalah 43",
                "Pondok Modern Arrisalah Slahung"
              ],
              url: siteUrl,
              description: "Platform resmi dan arsip kenangan alumni angkatan ke-43 Pondok Modern Arrisalah Slahung Ponorogo.",
              inLanguage: "id-ID",
            }),
          }}
        />
        {/* Inline script to set theme and detect device performance before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('expedient_theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', t);

                  // Deteksi hardware dan perangkat mobile secara presisi tanpa salah mengenali laptop touchscreen
                  var hasFinePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
                  var isCoarseOnly = window.matchMedia && window.matchMedia('(pointer: coarse) and (hover: none)').matches;
                  var isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Silk/i.test(navigator.userAgent);
                  var isSmallScreen = (window.innerWidth && window.innerWidth <= 1024) || (window.screen && window.screen.width <= 1024);
                  
                  // Perangkat mobile murni adalah HP berlayar sentuh tanpa mouse, atau Mobile UA dengan layar kecil
                  var isMobile = isMobileUA || (isSmallScreen && (isCoarseOnly || !hasFinePointer));

                  var ram = navigator.deviceMemory || (isMobile ? 4 : 8);
                  var cpu = navigator.hardwareConcurrency || (isMobile ? 4 : 8);
                  var isSaveData = Boolean(navigator.connection && navigator.connection.saveData);
                  var isLowEnd = isSaveData || (isMobile && (ram <= 3 || cpu <= 4));
                  var perfTier = isLowEnd ? 'lite' : (isMobile ? 'balanced' : 'high');

                  document.documentElement.setAttribute('data-perf', perfTier);
                  document.documentElement.setAttribute('data-device', isMobile ? 'mobile' : 'desktop');
                  const savedLang = localStorage.getItem('expedient_locale') || 'id';
                  document.documentElement.lang = savedLang;
                  document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
                  if (savedLang === 'ar') document.documentElement.classList.add('rtl-mode');
                } catch(e) {
                  document.documentElement.setAttribute('data-perf', 'high');
                  document.documentElement.setAttribute('data-device', 'desktop');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable} ${manrope.variable} ${amiri.variable} ${signature.variable}`} suppressHydrationWarning>
        <noscript>
          <style>{`.film-grain,.cursor-dot,.cursor-ring,#loadingScreen{display:none!important}body{background:#060b14;color:#d4af37;font-family:sans-serif}`}</style>
          <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "40px", gap: "20px" }}>
            <Image src="/images/logo-utuh.webp" width={120} height={120} style={{ opacity: 0.8 }} alt="Expedient" />
            <h2 style={{ fontSize: "1.5rem", margin: 0 }}>JavaScript Diperlukan</h2>
            <p style={{ color: "#a1a8b5", maxWidth: "400px", lineHeight: 1.6 }}>Platform Expedient Generation memerlukan JavaScript untuk berjalan. Silakan aktifkan JavaScript di browser Anda.</p>
            <a href="/login" style={{ color: "#d4af37", border: "1px solid #d4af37", padding: "10px 26px", borderRadius: "10px", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>Masuk</a>
          </div>
        </noscript>

        <div className="film-grain"></div>
        <div className="cursor-dot" id="cursorDot"></div>
        <div className="cursor-ring" id="cursorRing"></div>

        <div className="aurora-container">
          <div className="aurora-blob blob-1"></div>
          <div className="aurora-blob blob-2"></div>
          <div className="aurora-blob blob-3"></div>
        </div>
        <canvas id="particles-js"></canvas>

        <CmsProvider initialData={allCms || []}>
          <LanguageProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
          </LanguageProvider>
        </CmsProvider>
        {process.env.VERCEL === "1" && <Analytics />}
      </body>
    </html>
  );
}

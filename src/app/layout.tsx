import type { Metadata, Viewport } from "next";
import Image from "next/image";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import "../../public/css/design-system.css";
import "../../public/css/template.css";
import ClientLayout from "@/components/layout/ClientLayout";
import { CmsProvider } from "@/components/layout/CmsProvider";
import { createClient } from "@/lib/supabase/server";

export const viewport: Viewport = {
  themeColor: "#030504",
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    template: "%s - Expedient Generation",
    default: "Expedient Generation",
  },
  description: "Museum Galeri Digital VVIP & Arsip Direktori Expedient Generation.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
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
    title: "Expedient",
  },
  openGraph: {
    title: "Expedient Generation",
    description: "Akses portal eksklusif peninggalan dan jejak langkah Expedient.",
    images: ["/images/logo-utuh.webp"],
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  // Timeout: jangan biarkan root layout hang selamanya jika Supabase lambat
  const cmsPromise = supabase.from("site_content").select("content_key, content_value, content_type");
  const timeoutPromise = new Promise<{ data: null }>((resolve) => setTimeout(() => resolve({ data: null }), 5000));
  const { data: allCms } = await Promise.race([cmsPromise, timeoutPromise]);
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Inline script to set theme before first paint (prevent FOUC) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var t = localStorage.getItem('expedient_theme') || 'dark';
                document.documentElement.setAttribute('data-theme', t);
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <noscript>
          <style>{`.film-grain,.cursor-dot,.cursor-ring,#loadingScreen{display:none!important}body{background:#030504;color:#d4af37;font-family:sans-serif}`}</style>
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "40px", gap: "20px" }}>
            <Image src="/images/logo-utuh.webp" width={120} height={120} style={{ opacity: 0.8 }} alt="Expedient" />
            <h2 style={{ fontSize: "1.5rem", margin: 0 }}>JavaScript Diperlukan</h2>
            <p style={{ color: "#7b8e9b", maxWidth: "400px", lineHeight: 1.6 }}>Platform Expedient Generation memerlukan JavaScript untuk berjalan. Silakan aktifkan JavaScript di browser Anda.</p>
            <a href="/login" style={{ color: "#d4af37", border: "1px solid #d4af37", padding: "10px 30px", borderRadius: "30px", textDecoration: "none", fontSize: "0.85rem", letterSpacing: "2px" }}>MASUK</a>
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
          <ClientLayout>
            {children}
          </ClientLayout>
        </CmsProvider>
        <Analytics />
      </body>
    </html>
  );
}

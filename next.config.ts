import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  publicExcludes: [
    "!noprecache/**/*",
    "!index.html",
    "!assets/audio/**/*",
    "!assets/foto_putra/**/*",
    "!assets/foto_putri/**/*",
    "!assets/gallery/**/*",
    "!assets/models/**/*",
    "!sequence/**/*",
    "!uploads/**/*",
    "!**/*.map",
  ],
});

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
      },
      {
        protocol: 'https',
        hostname: 'dodcwulqgrhqpbldrlik.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/images/posters/:path*',
        destination: 'https://dodcwulqgrhqpbldrlik.supabase.co/storage/v1/object/public/cms-assets/posters/:path*',
      },
    ];
  },
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      return [];
    }

    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' blob: https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com https://va.vercel-scripts.com https://*.vercel-scripts.com https://*.pusher.com https://*.agora.io",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com",
      "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:",
      "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://ui-avatars.com https://api.qrserver.com https://cdnjs.cloudflare.com https://unpkg.com https://*.tile.openstreetmap.org https://server.arcgisonline.com https://*.arcgisonline.com https://*.opentopomap.org https://*.google.com https://*.googleapis.com https://*.cartocdn.com https://*.ytimg.com https://i.ytimg.com https://img.youtube.com https://*.youtube.com https://gibs.earthdata.nasa.gov https://*.stadiamaps.com",
      "media-src 'self' blob: data: https://*.supabase.co https://*.googlevideo.com https://*.youtube.com https://audio.qurancdn.com https://*.qurancdn.com https://*.mp3quran.net https://everyayah.com https://*.everyayah.com https://www.islamcan.com https://*.islamcan.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com https://*.vercel-scripts.com https://*.agora.io wss://*.agora.io https://expedient43-bot.onrender.com https://api.resend.com https://generativelanguage.googleapis.com https://*.tile.openstreetmap.org https://server.arcgisonline.com https://*.arcgisonline.com https://*.opentopomap.org https://*.google.com blob: data: https://*.googlevideo.com https://*.youtube.com https://audio.qurancdn.com https://*.qurancdn.com https://*.mp3quran.net https://everyayah.com https://*.everyayah.com https://api.quran.com https://api.myquran.com",
      "worker-src 'self' blob: data:",
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://youtube.com",
      "child-src 'self' blob: data: https://www.youtube.com https://www.youtube-nocookie.com https://youtube.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        // Explicit audio headers for Vercel CDN byte-range requests and immutable caching
        source: '/assets/audio/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Accept-Ranges',
            value: 'bytes',
          },
        ],
      },
      {
        // Long-lived immutable cache for 3D GLB models, local face weights, vendor JS, & Mushaf fonts
        source: '/assets/models/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/vendor/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Global Content-Security-Policy protecting all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
        ],
      },
      {
        // Global security headers for all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(self), autoplay=*, fullscreen=*',
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);

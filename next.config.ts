import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
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
    ],
  },
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      return [];
    }

    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://unpkg.com",
      "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:",
      "img-src 'self' data: blob: https: *.supabase.co *.supabase.in images.unsplash.com ui-avatars.com https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://server.arcgisonline.com https://clarity.maptiles.arcgis.com https://mt1.google.com https://tiles.stadiamaps.com https://gibs.earthdata.nasa.gov",
      "media-src 'self' blob: data: https: *.supabase.co",
      "connect-src 'self' https: wss: *.supabase.co *.supabase.in *.agora.io *.sd-rtn.com https://api.fonnte.com https://generativelanguage.googleapis.com https://api.bigdatacloud.net https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://server.arcgisonline.com",
      "worker-src 'self' blob:",
      "child-src 'self' blob:",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
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
            value: 'camera=(self), microphone=(self), geolocation=(self)',
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);

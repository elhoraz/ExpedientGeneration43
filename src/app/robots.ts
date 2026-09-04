import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://expedientgeneration.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/beranda',
        '/galeri',
        '/direktori',
        '/fitur',
        '/buku-tamu',
      ],
      disallow: [
        '/admin',
        '/admin/',
        '/api/',
        '/chat/',
        '/sovereign/',
        '/profil',
        '/auth/',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

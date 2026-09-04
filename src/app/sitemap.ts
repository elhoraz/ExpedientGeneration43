import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://expedientgeneration.vercel.app';
  const now = new Date();

  const routes = [
    '',
    '/beranda',
    '/galeri',
    '/direktori',
    '/fitur',
    '/buku-tamu',
    '/login',
    '/register',
    '/kontemplasi',
    '/baitul-maal',
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: (route === '' || route === '/beranda' ? 'daily' : 'weekly') as 'daily' | 'weekly',
    priority: route === '' ? 1.0 : route === '/beranda' ? 0.9 : 0.7,
  }));
}

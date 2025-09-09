import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/admin/',
          '/api/auth/',
          '/api/internal/',
          '/_next/',
          '/profile',  // Página privada de usuarios
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
      },
      {
        userAgent: 'AhrefsBot',
        disallow: '/',
      },
      {
        userAgent: 'SemrushBot',
        crawlDelay: 10,
      },
    ],
    sitemap: 'https://argenstats.com/sitemap.xml',
  }
}
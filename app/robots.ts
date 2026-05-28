import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://candiq.de'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/preise', '/demo', '/login', '/register', '/waitlist-agency', '/branchen', '/resources'],
        disallow: ['/api/', '/dashboard', '/candidates', '/checks', '/analytics', '/settings', '/integrations', '/clients', '/addons'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}

import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://candiq.de'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/', '/preise', '/waitlist-agency', '/branchen', '/resources',
          '/referenzpruefung', '/reference-check-dsgvo', '/zeugnis-pruefen-lassen',
          '/lebenslauf-verifizieren', '/pre-employment-screening', '/background-check-dsgvo',
          '/vergleich', '/fuer',
          // Detail-Seiten (PR #86) + Termin-Page (PR #89)
          '/roi-rechner', '/pilotprogramm', '/compliance', '/termin',
          // Bewerber-Self-Service Phase 1 (Waitlist)
          '/bewerber',
        ],
        disallow: ['/api/', '/dashboard', '/candidates', '/checks', '/analytics', '/settings', '/integrations', '/clients', '/addons', '/login', '/register', '/forgot-password', '/reset-password'],
      },
      // GEO / AI-Crawler explizit erlauben (Generative Engine Optimization)
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'Claude-Web', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'Applebot-Extended', allow: '/' },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}

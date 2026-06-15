import type { MetadataRoute } from 'next'
import { listStaedte } from '@/data/staedte'
import { LEAD_MAGNETS } from '@/content/resources/data'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://candiq.de'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const staedte: MetadataRoute.Sitemap = listStaedte().map((s) => ({
    url: `${BASE_URL}/referenzpruefung/${s.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.75,
  }))
  // Hinweis: /login und /register sind bewusst NICHT enthalten (noindex).
  const pages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/en`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },

    // SEO-Pillar + Keyword-Cluster
    { url: `${BASE_URL}/referenzpruefung`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE_URL}/reference-check-dsgvo`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE_URL}/zeugnis-pruefen-lassen`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/lebenslauf-verifizieren`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/pre-employment-screening`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/background-check-dsgvo`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    ...staedte,

    // Wettbewerbs-Vergleich
    { url: `${BASE_URL}/vergleich/validato-alternative`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },

    // Produkt & Branchen
    { url: `${BASE_URL}/demo`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/preise`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/roi-rechner`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE_URL}/pilotprogramm`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/compliance`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE_URL}/branchen`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE_URL}/branchen/tech-recruiting`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/branchen/sales-recruiting`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/branchen/healthcare-recruiting`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },

    // Zielgruppen-Seiten
    { url: `${BASE_URL}/fuer/hr-abteilungen`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE_URL}/fuer/mittelstand`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE_URL}/waitlist-agency`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },

    // Ressourcen
    { url: `${BASE_URL}/resources`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    // Lead-Magnet-Slugs aus der Single-Source-of-Truth — verhindert, dass
    // neue Magnete in der Sitemap vergessen werden.
    ...LEAD_MAGNETS.map((m) => ({
      url: `${BASE_URL}/resources/${m.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),

    // Termin-Buchungs-Page (candiq-Branded HubSpot-Wrapper) — sollte
    // fuer Brand-Suche indexierbar sein.
    { url: `${BASE_URL}/termin`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },

    // Rechtliches
    { url: `${BASE_URL}/datenschutz`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/agb`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },

  ]

  return pages
}

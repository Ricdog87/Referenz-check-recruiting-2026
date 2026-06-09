import type { Metadata } from 'next'

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://candiq.de'

/**
 * Baut konsistente Per-Page-Metadata mit eigenem Canonical + OpenGraph.
 *
 * Der Seitentitel wird OHNE "candiq" übergeben — das Root-Template hängt
 * " · candiq" automatisch an. So vermeiden wir die Title-Dopplung
 * ("Preise — candiq · candiq").
 *
 * `path` immer mit führendem Slash, ohne Trailing-Slash (außer "/").
 */
export function pageMeta(opts: {
  title: string
  description: string
  path: string
  /** Vollständiger OG-Title inkl. Marke. Default: `${title} | candiq`. */
  ogTitle?: string
  /**
   * Vollständiger, fixer Title ohne Template-Suffix (z. B. wenn die Marke
   * bereits enthalten ist: "… | candiq"). Verhindert die Doppelung "… · candiq".
   */
  absoluteTitle?: string
  noindex?: boolean
  /** Pfad zur englischen Entsprechung, falls vorhanden (für hreflang). */
  enPath?: string
}): Metadata {
  const { title, description, path, ogTitle, absoluteTitle, noindex, enPath } = opts
  const url = `${BASE_URL}${path}`
  const resolvedOgTitle = ogTitle ?? absoluteTitle ?? `${title} | candiq`

  const languages: Record<string, string> | undefined = enPath
    ? { de: path, en: enPath, 'x-default': path }
    : undefined

  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    alternates: {
      canonical: path,
      ...(languages ? { languages } : {}),
    },
    openGraph: {
      type: 'website',
      locale: 'de_DE',
      siteName: 'candiq',
      url,
      title: resolvedOgTitle,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedOgTitle,
      description,
    },
    ...(noindex
      ? { robots: { index: false, follow: false } }
      : {}),
  }
}

// ───────────────────────────────────────────────────────────────────
// JSON-LD Builder (alle geben ein Plain-Object zurück, das via <JsonLd>
// gerendert wird).
// ───────────────────────────────────────────────────────────────────

export function faqJsonLd(items: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  }
}

export function softwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'candiq',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'DSGVO-konforme Referenzprüfung für Recruiting. Verifizierte Referenzen, Zeugnisse und Tätigkeiten in unter 48 Stunden.',
    url: BASE_URL,
    offers: [
      { '@type': 'Offer', name: 'Starter', price: '65', priceCurrency: 'EUR' },
      { '@type': 'Offer', name: 'Professional', price: '199', priceCurrency: 'EUR' },
      { '@type': 'Offer', name: 'Business', price: '499', priceCurrency: 'EUR' },
    ],
    provider: {
      '@type': 'Organization',
      name: 'RSG Recruiting Solutions group GmbH',
    },
  }
}

export function serviceJsonLd(opts?: { areaServed?: string; name?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: opts?.name ?? 'DSGVO-konforme Referenzprüfung',
    provider: {
      '@type': 'Organization',
      name: 'candiq · RSG Recruiting Solutions group GmbH',
      url: BASE_URL,
    },
    areaServed: opts?.areaServed ?? 'Deutschland',
    description:
      'Telefonische Verifizierung von Referenzen, Arbeitszeugnissen und Tätigkeitsangaben durch unsere KI-gestützte, trainierte Telefonassistentin — jeder Report von geschulten Reviewern freigegeben. DSGVO-konform, Server in Deutschland.',
  }
}

export function breadcrumbJsonLd(crumbs: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${BASE_URL}${c.path}`,
    })),
  }
}

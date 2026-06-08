import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import AIConciergeMount from '@/components/chat/AIConciergeMount'
import { ConsentManager } from '@/components/analytics/ConsentManager'

// Routes auf denen der Chat NICHT geladen wird (Auth + Dashboard).
const PRIVATE_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/dashboard',
  '/candidates',
  '/checks',
  '/clients',
  '/settings',
  '/audit',
  '/analytics',
  '/addons',
  '/integrations',
  '/candidate/', // Demo-Candidate-Profil (interaktiv, kein Chat-Overlay)
]

function shouldShowConcierge(pathname: string): boolean {
  return !PRIVATE_PREFIXES.some((p) => pathname.startsWith(p))
}

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
})

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://candiq.de'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'candiq — DSGVO-konforme Referenzprüfung für Recruiting',
    template: '%s · candiq',
  },
  description:
    'candiq verifiziert Referenzen, Zeugnisse und Tätigkeiten Ihrer Kandidaten — DSGVO-konform, in unter 48 Stunden. Vermeiden Sie kostspielige Fehlbesetzungen.',
  keywords: [
    'Referenzprüfung', 'Reference Check', 'Recruiting', 'B2B', 'DSGVO',
    'Kandidatenprüfung', 'HR Software', 'Background Check', 'Verifizierung',
    'Personaldienstleister', 'Zeugnisprüfung', 'candiq',
  ],
  authors: [{ name: 'RSG Recruiting Solutions group GmbH' }],
  creator: 'candiq',
  publisher: 'RSG Recruiting Solutions group GmbH',
  // WICHTIG: KEIN globales `alternates.canonical` und KEIN globales
  // `openGraph.url/title` hier — sonst erben alle Unterseiten das Canonical
  // der Startseite und Google wertet sie als Duplikate. Jede Seite setzt ihr
  // eigenes Canonical + OG (statisch via `metadata` oder via `generateMetadata`).
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    siteName: 'candiq',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'candiq — Referenzprüfung für Recruiting',
    description: 'DSGVO-konforme Referenzprüfung. Live-Demo ohne Anmeldung.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
  // Site-Verification für Search-Engine-Tooling. Tokens werden via Env-Vars
  // gesetzt — fehlt eine Var, wird das jeweilige Meta-Tag einfach nicht
  // gerendert. Verifikation läuft pro Suchmaschine via "Meta-Tag"-Methode.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: {
      ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
        ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
        : {}),
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'candiq',
  legalName: 'RSG Recruiting Solutions group GmbH',
  url: BASE_URL,
  logo: `${BASE_URL}/logo-mark.svg`,
  email: 'hello@candiq.de',
  telephone: '+49 176 60772556',
  vatID: 'DE458027073',
  taxID: 'HRB 35951',
  sameAs: ['https://www.linkedin.com/in/ricardoserrano-rsgai/'],
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Am Heiligenhaus 9',
    postalCode: '65207',
    addressLocality: 'Wiesbaden',
    addressCountry: 'DE',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const h = headers()
  const nonce = h.get('x-nonce') ?? undefined
  // `x-pathname` wird in middleware.ts gesetzt. Sobald die URL mit `/en`
  // beginnt, liefern wir `<html lang="en">`. Fallback ist immer 'de'.
  const pathname = h.get('x-pathname') ?? ''
  const lang = pathname.startsWith('/en') ? 'en' : 'de'

  return (
    <html lang={lang} suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body>
        {/* A11y: BFSG-Pflicht — sichtbarer Skip-Link bei Tastatur-Fokus.
            Springt zum nächsten <main id="main"> auf jeder Route. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-brand-600 focus:text-white focus:shadow-card-lg focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand-300"
        >
          Zum Hauptinhalt springen
        </a>
        <Providers>{children}</Providers>
        {false && shouldShowConcierge(pathname) ? <AIConciergeMount /> : null}
        {process.env.NEXT_PUBLIC_GA_ID ? (
          <ConsentManager gaId={process.env.NEXT_PUBLIC_GA_ID} />
        ) : null}
      </body>
    </html>
  )
}

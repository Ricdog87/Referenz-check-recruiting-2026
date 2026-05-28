import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { headers } from 'next/headers'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

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
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: BASE_URL,
    siteName: 'candiq',
    title: 'candiq — DSGVO-konforme Referenzprüfung für Recruiting',
    description:
      'Verifizierte Referenzen in unter 48 Stunden. DSGVO-konform, Server in Deutschland. Live-Demo ohne Anmeldung.',
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
  const nonce = headers().get('x-nonce') ?? undefined

  return (
    <html lang="de" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {/* HubSpot Chat-Widget Floating-Position erzwingen.
            Notwendig weil HubSpot sein CSS dynamisch via inline <style>
            injiziert — wir liefern hier explizit Floating-Defaults damit
            das Widget auch bei strikter CSP korrekt rendert. */}
        {process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID && (
          <style
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `
                #hubspot-messages-iframe-container {
                  position: fixed !important;
                  bottom: 20px !important;
                  right: 20px !important;
                  z-index: 2147483000 !important;
                  width: auto !important;
                  height: auto !important;
                }
                #hubspot-messages-iframe-container.widget-align-left {
                  right: auto !important;
                  left: 20px !important;
                }
              `,
            }}
          />
        )}
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

        {/* HubSpot Live-Chat (Conversations) — nur rendern wenn Portal-ID
            via Env gesetzt. Lazy-loaded mit strategy='afterInteractive'.
            CSP-Domains in middleware.ts whitelisted (eu1-Region). */}
        {process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID && (
          <Script
            id="hs-script-loader"
            strategy="afterInteractive"
            src={`https://js-eu1.hs-scripts.com/${process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID}.js`}
          />
        )}
      </body>
    </html>
  )
}

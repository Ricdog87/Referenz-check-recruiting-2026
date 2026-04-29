import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

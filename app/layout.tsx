import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

const APP_URL = process.env.NEXTAUTH_URL || 'https://refcheck.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'RefCheck — Referenzprüfung für Recruiting',
    template: '%s — RefCheck',
  },
  description:
    'DSGVO-konforme Referenzprüfung für B2B-Kunden im Recruiting. Kandidaten schnell und sicher verifizieren. Zeugnisse, Tätigkeiten, frühere Arbeitgeber — in unter 48 Stunden.',
  keywords: [
    'Referenzprüfung', 'Recruiting', 'B2B', 'DSGVO', 'Kandidatenprüfung', 'HR',
    'Background Check', 'Hintergrundprüfung', 'Arbeitgeber Verifizierung',
  ],
  authors: [{ name: 'RefCheck' }],
  creator: 'RefCheck',
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: APP_URL,
    siteName: 'RefCheck',
    title: 'RefCheck — Die Wahrheit hinter jeder Bewerbung',
    description:
      'KI generiert täglich hunderte Bewerbungen — wir prüfen die Realität. DSGVO-konform, Server in Deutschland.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RefCheck — Referenzprüfung für Recruiting',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RefCheck — Die Wahrheit hinter jeder Bewerbung',
    description: 'DSGVO-konforme Referenzprüfung für B2B-Recruiting. In unter 48h.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

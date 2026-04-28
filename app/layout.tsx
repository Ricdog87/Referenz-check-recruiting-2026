import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'candiq — Referenzprüfung für Recruiting',
  description: 'DSGVO-konforme Referenzprüfung für B2B-Kunden im Recruiting. Kandidaten schnell und sicher verifizieren.',
  keywords: 'Referenzprüfung, Recruiting, B2B, DSGVO, Kandidatenprüfung, HR',
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

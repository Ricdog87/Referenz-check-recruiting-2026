import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { JsonLd } from '@/components/JsonLd'
import { pageMeta, softwareApplicationJsonLd, breadcrumbJsonLd } from '@/lib/seo'
import { isPartnerProgramEnabled } from '@/lib/flags'
import { PartnerLanding } from '@/components/landing/sections/PartnerLanding'

export const metadata: Metadata = pageMeta({
  title: 'Partner-Programm für Personaldienstleister',
  description:
    'Verkaufen Sie candiq unter Ihrer Marke. Co-Branded Referenzprüfung für Personaldienstleister: Sie behalten die Kundenbeziehung, candiq liefert die verifizierte Tiefe. Vier Stufen, faire Margen, kein Mindestumsatz.',
  path: '/partner',
  // Solange das Programm im Soft-Launch läuft, nicht indexieren.
  noindex: true,
})

export default function PartnerPage() {
  // Feature-Flag PARTNER_PROGRAM_ENABLED gatet die ganze Seite.
  // Default false → /partner liefert 404, niemand sieht das Programm.
  if (!isPartnerProgramEnabled()) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white text-text-primary overflow-x-hidden antialiased">
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Start', path: '/' },
          { name: 'Partner-Programm', path: '/partner' },
        ])}
      />
      <LandingNav />
      <main id="main">
        <PartnerLanding />
      </main>
      <LandingFooter />
    </div>
  )
}

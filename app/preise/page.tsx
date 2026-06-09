import type { Metadata } from 'next'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { JsonLd } from '@/components/JsonLd'
import { pageMeta, softwareApplicationJsonLd } from '@/lib/seo'
import { PricingClient } from './PricingClient'

export const metadata: Metadata = pageMeta({
  title: 'Preise & Pakete für Referenzprüfung',
  description:
    'Faire, transparente Pakete für HR-Abteilungen ab 65 €/Monat — plus Add-on-Services wie Deep-Check, Zeugnis-Verifizierung und Pre-Screening. Monatlich kündbar, kein Mindestvertrag.',
  path: '/preise',
})

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-text-primary overflow-x-hidden antialiased">
      <JsonLd data={softwareApplicationJsonLd()} />
      <LandingNav />
      <main id="main">
        <PricingClient />
      </main>
      <LandingFooter />
    </div>
  )
}

import type { Metadata } from 'next'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { PricingClient } from './PricingClient'

export const metadata: Metadata = {
  title: 'Preise — RefCheck',
  description: 'Faire Pakete für HR-Abteilungen und Personaldienstleister. Ab 79 €/Monat. DSGVO-konform.',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-text-primary overflow-x-hidden antialiased">
      <LandingNav />
      <PricingClient />
      <LandingFooter />
    </div>
  )
}

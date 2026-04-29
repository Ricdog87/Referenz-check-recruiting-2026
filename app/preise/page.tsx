import type { Metadata } from 'next'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { PricingClient } from './PricingClient'

export const metadata: Metadata = {
  title: 'Preise — candiq',
  description: 'Faire Pakete für HR-Abteilungen. PDL-Pakete sind bald verfügbar — jetzt für frühen Zugang vormerken.',
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

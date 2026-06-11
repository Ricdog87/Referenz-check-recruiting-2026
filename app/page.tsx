import type { Metadata } from 'next'
import { LandingNav } from '@/components/landing/LandingNav'
import { JsonLd } from '@/components/JsonLd'
import { pageMeta, softwareApplicationJsonLd, serviceJsonLd } from '@/lib/seo'
import { Hero } from '@/components/landing/sections/Hero'
import { TrustBar } from '@/components/landing/sections/TrustBar'
import { Problem } from '@/components/landing/sections/Problem'
import { SpeedAndProof } from '@/components/landing/sections/SpeedAndProof'
import { FabricationCheck } from '@/components/landing/sections/FabricationCheck'
import { HowItWorks } from '@/components/landing/sections/HowItWorks'
import { Features } from '@/components/landing/sections/Features'
import { Testimonials } from '@/components/landing/sections/Testimonials'
import { PricingPreview } from '@/components/landing/sections/PricingPreview'
import { HomepageFaq } from '@/components/landing/sections/HomepageFaq'
import { FinalCta } from '@/components/landing/sections/FinalCta'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { StickyVoiceCta } from '@/components/landing/StickyVoiceCta'
import { VoiceFollowupTeaser } from '@/components/landing/VoiceFollowupTeaser'

export const metadata: Metadata = {
  ...pageMeta({
    title: 'candiq — DSGVO-konforme Referenzprüfung für Recruiting',
    description:
      'candiq verifiziert Referenzen, Zeugnisse und Tätigkeiten Ihrer Kandidaten — DSGVO-konform, in unter 48 Stunden. Vermeiden Sie kostspielige Fehlbesetzungen.',
    path: '/',
    ogTitle: 'candiq — DSGVO-konforme Referenzprüfung für Recruiting',
    enPath: '/en',
  }),
  // Startseite: Title ohne Template-Suffix (enthält die Marke bereits).
  title: { absolute: 'candiq — DSGVO-konforme Referenzprüfung für Recruiting' },
}

export default function LandingPage() {
  // 3-Akt-Dramaturgie statt 18-Sektion-Liste:
  // Akt 1 (Wow):          Hero mit Live-Voice rechts + TrustBar
  // Akt 2 (Beweis):       Problem -> SpeedAndProof -> FabricationCheck-Live -> HowItWorks -> Features -> Testimonials
  // Akt 3 (Entscheidung): PricingPreview -> HomepageFaq -> FinalCta
  //
  // Detail-Sektionen (OnboardingRoadmap, PilotProgram, ROICalculator,
  // ComparisonTable, CompliancePromise, TwoAudiences) sind bewusst nicht
  // mehr auf der Startseite — sie sind ueber Footer-Links und eigene
  // URLs (/preise, /pilotprogramm, /validato-vergleich, /compliance,
  // /fuer) erreichbar, sobald der Wow-Effekt gegriffen hat.
  return (
    <div className="min-h-screen bg-white text-text-primary overflow-x-hidden antialiased">
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd data={serviceJsonLd()} />
      <LandingNav />
      <main id="main">
        {/* Akt 1: Wow */}
        <Hero />
        <TrustBar />

        {/* Akt 2: Beweis */}
        <Problem />
        <SpeedAndProof />
        <FabricationCheck />
        <HowItWorks />
        <Features />
        <Testimonials />

        {/* Akt 3: Entscheidung */}
        <PricingPreview />
        <HomepageFaq />
        <FinalCta />
      </main>
      <LandingFooter />
      <StickyVoiceCta />
      <VoiceFollowupTeaser />
    </div>
  )
}

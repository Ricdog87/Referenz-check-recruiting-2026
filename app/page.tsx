import type { Metadata } from 'next'
import { LandingNav } from '@/components/landing/LandingNav'
import { ComparisonTable } from '@/components/ComparisonTable'
import { JsonLd } from '@/components/JsonLd'
import { pageMeta, softwareApplicationJsonLd, serviceJsonLd } from '@/lib/seo'
import { Hero } from '@/components/landing/sections/Hero'
import VoiceDemo from '@/components/landing/sections/VoiceDemo'
import { TrustBar } from '@/components/landing/sections/TrustBar'
import { Problem } from '@/components/landing/sections/Problem'
import { HowItWorks } from '@/components/landing/sections/HowItWorks'
import { Features } from '@/components/landing/sections/Features'
import { TwoAudiences } from '@/components/landing/sections/TwoAudiences'
import { OnboardingRoadmap } from '@/components/landing/sections/OnboardingRoadmap'
import { Testimonials } from '@/components/landing/sections/Testimonials'
import { PilotProgram } from '@/components/landing/sections/PilotProgram'
import { ROICalculator } from '@/components/landing/sections/ROICalculator'
import { CompliancePromise } from '@/components/landing/sections/CompliancePromise'
import { PricingPreview } from '@/components/landing/sections/PricingPreview'
import { HomepageFaq } from '@/components/landing/sections/HomepageFaq'
import { FinalCta } from '@/components/landing/sections/FinalCta'
import { LandingFooter } from '@/components/landing/LandingFooter'

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
  return (
    <div className="min-h-screen bg-white text-text-primary overflow-x-hidden antialiased">
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd data={serviceJsonLd()} />
      <LandingNav />
      <main id="main">
        <Hero />
        <VoiceDemo />
        <TrustBar />
        <Problem />
        <HowItWorks />
        <Features />
        <TwoAudiences />
        <OnboardingRoadmap />
        <Testimonials />
        <PilotProgram />
        <ROICalculator />
        <ComparisonTable />
        <CompliancePromise />
        <PricingPreview />
        <HomepageFaq />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  )
}

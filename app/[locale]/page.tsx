import { setRequestLocale } from 'next-intl/server'
import { routing, type Locale } from '@/i18n/routing'

// DE-Sektionen (Status quo, hardcoded German JSX — bleibt in PR 1 unverändert):
import { LandingNav } from '@/components/landing/LandingNav'
import { Hero } from '@/components/landing/sections/Hero'
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

// EN-Sektionen (i18n-fähig, PR 1 deckt diese 4 + Nav + Footer):
import { LandingNavI18n } from '@/components/landing-i18n/LandingNavI18n'
import { HeroI18n } from '@/components/landing-i18n/HeroI18n'
import { TrustBarI18n } from '@/components/landing-i18n/TrustBarI18n'
import { CompliancePromiseI18n } from '@/components/landing-i18n/CompliancePromiseI18n'
import { FinalCtaI18n } from '@/components/landing-i18n/FinalCtaI18n'
import { LandingFooterI18n } from '@/components/landing-i18n/LandingFooterI18n'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  // EN — schlankerer Landing-Aufbau in PR 1 (Hero → Trust → Compliance → CTA).
  // Weitere Sektionen folgen in PR 2 mit voller Translation-Suite.
  if (locale === ('en' satisfies Locale)) {
    return (
      <div className="min-h-screen bg-white text-text-primary overflow-x-hidden antialiased">
        <LandingNavI18n />
        <main id="main">
          <HeroI18n />
          <TrustBarI18n />
          <CompliancePromiseI18n />
          <FinalCtaI18n />
        </main>
        <LandingFooterI18n />
      </div>
    )
  }

  // DE — Status-quo-Landing (Komponenten und Sektionen unverändert).
  return (
    <div className="min-h-screen bg-white text-text-primary overflow-x-hidden antialiased">
      <LandingNav />
      <main id="main">
        <Hero />
        <TrustBar />
        <Problem />
        <HowItWorks />
        <Features />
        <TwoAudiences />
        <OnboardingRoadmap />
        <Testimonials />
        <PilotProgram />
        <ROICalculator />
        <CompliancePromise />
        <PricingPreview />
        <HomepageFaq />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  )
}

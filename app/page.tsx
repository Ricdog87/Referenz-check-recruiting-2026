import Link from 'next/link'
import { LandingNav } from '@/components/landing/LandingNav'
import { Hero } from '@/components/landing/sections/Hero'
import { TrustBar } from '@/components/landing/sections/TrustBar'
import { Problem } from '@/components/landing/sections/Problem'
import { HowItWorks } from '@/components/landing/sections/HowItWorks'
import { TwoAudiences } from '@/components/landing/sections/TwoAudiences'
import { Features } from '@/components/landing/sections/Features'
import { InterviewService } from '@/components/landing/sections/InterviewService'
import { ROICalculator } from '@/components/landing/sections/ROICalculator'
import { PricingPreview } from '@/components/landing/sections/PricingPreview'
import { Testimonials } from '@/components/landing/sections/Testimonials'
import { CompliancePromise } from '@/components/landing/sections/CompliancePromise'
import { FinalCta } from '@/components/landing/sections/FinalCta'
import { LandingFooter } from '@/components/landing/LandingFooter'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-text-primary overflow-x-hidden antialiased">
      <LandingNav />
      <Hero />
      <TrustBar />
      <Problem />
      <HowItWorks />
      <TwoAudiences />
      <Features />
      <InterviewService />
      <ROICalculator />
      <PricingPreview />
      <Testimonials />
      <CompliancePromise />
      <FinalCta />
      <LandingFooter />
    </div>
  )
}

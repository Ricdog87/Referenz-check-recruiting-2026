import type { Metadata } from 'next'
import { LandingNavEn } from '@/components/landing-en/LandingNavEn'
import { HeroEn } from '@/components/landing-en/HeroEn'
import { TrustBarEn } from '@/components/landing-en/TrustBarEn'
import { CompliancePromiseEn } from '@/components/landing-en/CompliancePromiseEn'
import { FinalCtaEn } from '@/components/landing-en/FinalCtaEn'
import { LandingFooterEn } from '@/components/landing-en/LandingFooterEn'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://candiq.de'

export const metadata: Metadata = {
  title: 'candiq — GDPR-compliant reference checks for recruiting',
  description:
    'candiq verifies references, employment history and responsibilities of your candidates — GDPR-compliant, in under 48 hours. Avoid costly bad hires.',
  alternates: {
    canonical: `${BASE_URL}/en`,
    languages: {
      de: `${BASE_URL}/`,
      en: `${BASE_URL}/en`,
      'x-default': `${BASE_URL}/`,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: `${BASE_URL}/en`,
    siteName: 'candiq',
    title: 'candiq — GDPR-compliant reference checks for recruiting',
    description:
      'Verified references in under 48 hours. GDPR-compliant, EU-hosted. Live demo, no sign-up required.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'candiq — Reference checks for recruiting',
    description: 'GDPR-compliant reference checks. Live demo, no sign-up required.',
  },
}

export default function EnglishLandingPage() {
  return (
    <div className="min-h-screen bg-white text-text-primary overflow-x-hidden antialiased">
      <LandingNavEn />
      <main id="main">
        <HeroEn />
        <TrustBarEn />
        <CompliancePromiseEn />
        <FinalCtaEn />
      </main>
      <LandingFooterEn />
    </div>
  )
}

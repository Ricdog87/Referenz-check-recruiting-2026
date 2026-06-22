import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { pageMeta } from '@/lib/seo'
import { isPartnerProgramEnabled } from '@/lib/flags'
import { PartnerForgotForm } from '@/components/partner/ForgotForm'

export const metadata: Metadata = pageMeta({
  title: 'Partner-Passwort zurücksetzen',
  description: 'Passwort-Reset für Partner-Accounts.',
  path: '/partner/forgot-password',
  noindex: true,
})

export default function PartnerForgotPage() {
  if (!isPartnerProgramEnabled()) notFound()

  return (
    <div className="min-h-screen bg-white text-text-primary overflow-x-hidden antialiased">
      <LandingNav />
      <main id="main" className="pt-28 pb-20 px-6">
        <div className="max-w-md mx-auto mb-8 text-center">
          <h1 className="text-[clamp(28px,4vw,36px)] font-bold tracking-tightest text-text-primary mb-2">
            Passwort vergessen
          </h1>
        </div>
        <PartnerForgotForm />
      </main>
      <LandingFooter />
    </div>
  )
}

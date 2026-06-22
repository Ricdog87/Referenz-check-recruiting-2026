import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { pageMeta } from '@/lib/seo'
import { isPartnerProgramEnabled } from '@/lib/flags'
import { PartnerLoginForm } from '@/components/partner/LoginForm'

export const metadata: Metadata = pageMeta({
  title: 'Partner-Login',
  description: 'Login für Partner im candiq-Reseller-Programm.',
  path: '/partner/login',
  noindex: true,
})

export default function PartnerLoginPage() {
  if (!isPartnerProgramEnabled()) notFound()

  return (
    <div className="min-h-screen bg-white text-text-primary overflow-x-hidden antialiased">
      <LandingNav />
      <main id="main" className="pt-28 pb-20 px-6">
        <div className="max-w-md mx-auto mb-8 text-center">
          <h1 className="text-[clamp(28px,4vw,36px)] font-bold tracking-tightest text-text-primary mb-2">
            Partner-Login
          </h1>
          <p className="text-sm text-text-secondary">Reseller-Dashboard</p>
        </div>
        <Suspense fallback={<div className="text-center text-sm text-text-muted">Lade…</div>}>
          <PartnerLoginForm />
        </Suspense>
      </main>
      <LandingFooter />
    </div>
  )
}

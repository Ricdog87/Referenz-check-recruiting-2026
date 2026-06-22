import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { pageMeta } from '@/lib/seo'
import { isPartnerProgramEnabled } from '@/lib/flags'
import { PartnerResetForm } from '@/components/partner/ResetForm'

export const metadata: Metadata = pageMeta({
  title: 'Neues Partner-Passwort',
  description: 'Neues Passwort über Reset-Link setzen.',
  path: '/partner/reset-password',
  noindex: true,
})

export default function PartnerResetPage() {
  if (!isPartnerProgramEnabled()) notFound()

  return (
    <div className="min-h-screen bg-white text-text-primary overflow-x-hidden antialiased">
      <LandingNav />
      <main id="main" className="pt-28 pb-20 px-6">
        <div className="max-w-md mx-auto mb-8 text-center">
          <h1 className="text-[clamp(28px,4vw,36px)] font-bold tracking-tightest text-text-primary mb-2">
            Neues Passwort setzen
          </h1>
        </div>
        <Suspense fallback={<div className="text-center text-sm text-text-muted">Lade…</div>}>
          <PartnerResetForm />
        </Suspense>
      </main>
      <LandingFooter />
    </div>
  )
}

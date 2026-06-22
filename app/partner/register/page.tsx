import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { pageMeta } from '@/lib/seo'
import { isPartnerProgramEnabled } from '@/lib/flags'
import { PartnerRegisterForm } from '@/components/partner/RegisterForm'

export const metadata: Metadata = pageMeta({
  title: 'Partner-Bewerbung',
  description:
    'Bewerben Sie sich als Personaldienstleister im candiq-Partner-Programm. Prüfung in 2 Werktagen, danach Erstgespräch zu Co-Brand und Konditionen.',
  path: '/partner/register',
  noindex: true,
})

export default function PartnerRegisterPage() {
  if (!isPartnerProgramEnabled()) notFound()

  return (
    <div className="min-h-screen bg-white text-text-primary overflow-x-hidden antialiased">
      <LandingNav />
      <main id="main" className="pt-28 pb-20 px-6">
        <div className="max-w-2xl mx-auto mb-10 text-center">
          <h1 className="text-[clamp(28px,4vw,40px)] font-bold tracking-tightest text-text-primary mb-3">
            Partner-Bewerbung
          </h1>
          <p className="text-text-secondary leading-relaxed">
            Kurze Pflichtangaben, dann prüfen wir in 2 Werktagen Sitz, Branche
            und Seriosität. Sie hören per E-Mail zurück.
          </p>
        </div>
        <PartnerRegisterForm />
      </main>
      <LandingFooter />
    </div>
  )
}

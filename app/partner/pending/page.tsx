import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Clock, Mail } from 'lucide-react'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { pageMeta } from '@/lib/seo'
import { isPartnerProgramEnabled } from '@/lib/flags'

export const metadata: Metadata = pageMeta({
  title: 'Bewerbung in Prüfung',
  description: 'Ihre Partner-Bewerbung wird gerade geprüft.',
  path: '/partner/pending',
  noindex: true,
})

export default function PartnerPendingPage() {
  if (!isPartnerProgramEnabled()) notFound()

  return (
    <div className="min-h-screen bg-white text-text-primary overflow-x-hidden antialiased">
      <LandingNav />
      <main id="main" className="pt-28 pb-20 px-6">
        <div className="max-w-xl mx-auto card-md text-center">
          <Clock className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold tracking-tightest text-text-primary mb-3">
            Bewerbung in Prüfung
          </h1>
          <p className="text-text-secondary leading-relaxed mb-6">
            Vielen Dank! Wir prüfen Ihre Bewerbung innerhalb von <strong>2 Werktagen</strong>{' '}
            (Sitz, Branche, Referenzen). Sobald freigegeben, schalten wir Ihr
            Reseller-Dashboard frei und melden uns per E-Mail mit dem Erstgespräch-Termin.
          </p>
          <div className="text-sm text-text-secondary border-t border-border-default pt-6 mt-6">
            <Mail className="w-5 h-5 text-text-muted mx-auto mb-2" />
            Fragen vorab?{' '}
            <a href="mailto:partner@candiq.de" className="underline hover:text-indigo-600">
              partner@candiq.de
            </a>
          </div>
          <Link
            href="/partner/login"
            className="inline-block mt-6 text-xs text-text-muted underline hover:text-indigo-600"
          >
            Zum Login
          </Link>
        </div>
      </main>
      <LandingFooter />
    </div>
  )
}

import type { Metadata } from 'next'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { StickyVoiceCta } from '@/components/landing/StickyVoiceCta'
import { JsonLd } from '@/components/JsonLd'
import { pageMeta, softwareApplicationJsonLd, breadcrumbJsonLd } from '@/lib/seo'
import { PilotProgram } from '@/components/landing/sections/PilotProgram'
import { PilotSlotCounter } from '@/components/landing/PilotSlotCounter'
import { RelatedPagesStrip } from '@/components/landing/RelatedPagesStrip'
import { Sparkles } from 'lucide-react'

export const metadata: Metadata = pageMeta({
  title: 'Pilot-Programm — Frühzugang zu candiq',
  description:
    'Begrenzte Pilot-Slots für HR-Teams, die ihre Referenzprüfung 2026 modernisieren. Sechs Monate vergünstigter Zugang, monatliche Strategie-Calls, direkter Draht zum Produkt.',
  path: '/pilotprogramm',
})

export default function PilotprogrammPage() {
  return (
    <div className="min-h-screen bg-white text-text-primary overflow-x-hidden antialiased">
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Start', path: '/' },
        { name: 'Pilot-Programm', path: '/pilotprogramm' },
      ])} />
      <LandingNav />
      <main id="main">
        {/* Page-Hero */}
        <section className="pt-28 pb-12 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-5">
              <Sparkles className="w-3.5 h-3.5" /> Pilot-Programm 2026
            </div>
            <h1 className="text-[clamp(34px,5vw,56px)] font-bold leading-[1.05] tracking-tightest text-text-primary mb-5">
              Bauen Sie die menschliche{' '}
              <span className="text-gradient-brand">Vertrauensschicht</span>{' '}
              mit uns auf.
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed">
              Begrenzte Plätze für HR-Teams, die ihre Referenzprüfung 2026
              ernst nehmen. Sechs Monate vergünstigter Zugang, monatlicher
              Strategie-Call mit unserem Gründerteam, Ihr Feedback fließt direkt
              ins Produkt.
            </p>
            {/* Live-Scarcity: echte ACCEPTED-Belegung aus der DB */}
            <div className="mt-7 flex justify-center">
              <PilotSlotCounter />
            </div>
          </div>
        </section>

        {/* Was Pilot-Kunden bekommen — konkret, nicht generisch */}
        <section className="pb-12 px-6">
          <div className="max-w-3xl mx-auto grid sm:grid-cols-3 gap-4">
            {[
              { k: '−40 %', v: 'Pilot-Konditionen für 6 Monate' },
              { k: '1×/Monat', v: 'Strategie-Call mit dem Gründerteam' },
              { k: 'Direkt', v: 'Feedback-Loop ins Produkt' },
            ].map(({ k, v }) => (
              <div key={k} className="card-md text-center">
                <div className="text-2xl font-bold text-text-primary leading-none">{k}</div>
                <div className="text-xs text-text-muted mt-2 leading-snug">{v}</div>
              </div>
            ))}
          </div>
        </section>

        <PilotProgram />
        <RelatedPagesStrip currentHref="/pilotprogramm" />
      </main>
      <LandingFooter />
      <StickyVoiceCta />
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CalendarCheck, TrendingUp } from 'lucide-react'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { StickyVoiceCta } from '@/components/landing/StickyVoiceCta'
import { JsonLd } from '@/components/JsonLd'
import { pageMeta, softwareApplicationJsonLd } from '@/lib/seo'
import { ROICalculator } from '@/components/landing/sections/ROICalculator'
import { FinalCta } from '@/components/landing/sections/FinalCta'
import { BOOKING_URL } from '@/lib/site'

export const metadata: Metadata = pageMeta({
  title: 'ROI-Rechner: Was kostet Sie eine Fehlbesetzung?',
  description:
    'Berechnen Sie Ihr Einsparpotenzial mit candiq. Modellrechnung auf Basis von SHRM- und Bain-Daten zu Fehlbesetzungskosten — interaktiv, in unter einer Minute.',
  path: '/roi-rechner',
})

export default function RoiRechnerPage() {
  return (
    <div className="min-h-screen bg-white text-text-primary overflow-x-hidden antialiased">
      <JsonLd data={softwareApplicationJsonLd()} />
      <LandingNav />
      <main id="main">
        {/* Page-Hero — kurz, dann direkt der Rechner */}
        <section className="pt-28 pb-10 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-5">
              <TrendingUp className="w-3.5 h-3.5" /> ROI-Rechner
            </div>
            <h1 className="text-[clamp(34px,5vw,56px)] font-bold leading-[1.05] tracking-tightest text-text-primary mb-5">
              Eine Fehlbesetzung kostet im Schnitt{' '}
              <span className="text-gradient-brand">das 1,5-fache Jahresgehalt.</span>
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed">
              Bewegen Sie die Regler, sehen Sie das Modell live: Was bringt eine
              um 60 % reduzierte Fehlbesetzungs-Quote für Ihre Hiring-Pipeline?
            </p>
          </div>
        </section>

        <ROICalculator />

        {/* Methodik-Strip — Modellannahmen transparent dokumentiert */}
        <section className="pb-16 px-6">
          <div className="max-w-3xl mx-auto card-md bg-bg-secondary border-border">
            <div className="text-sm font-semibold text-text-primary mb-2">Modell-Annahmen</div>
            <ul className="text-xs text-text-secondary leading-relaxed space-y-1.5 list-disc list-inside">
              <li>
                Fehlbesetzungskosten ≈ 1,5 × Jahresgehalt (Recruiting, Onboarding,
                Produktivitäts-Lücke, Folgekosten) — Quellen: SHRM, Bain &amp; Company.
              </li>
              <li>
                Annahme der Quoten-Reduktion: <strong>60 %</strong> durch
                konsequente Referenzprüfung — konservativ gegenüber industrie-typischen
                70–80 %-Werten in unabhängigen Recruiting-Studien.
              </li>
              <li>
                candiq-Kosten in dieser Rechnung pauschal mit dem Professional-Plan
                (39 € pro Hire) angesetzt — Starter ist günstiger, Business je nach
                Volumen.
              </li>
              <li>
                Die Rechnung ist ein <strong>Modell, kein Vertragsversprechen</strong> —
                tatsächliche Einsparungen hängen von Branche, Senioritätsstufe und
                Pipeline-Reife ab.
              </li>
            </ul>
          </div>
        </section>

        {/* Zwischen-CTA für Käufer die jetzt überzeugt sind */}
        <section className="pb-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <Link
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-base py-3.5 px-7 inline-flex group"
            >
              <CalendarCheck className="w-4 h-4" />
              Zahlen mit unserem Team validieren
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <div className="text-xs text-text-muted mt-4">
              15-Min-Termin · individuelles Modell für Ihre Branche · unverbindlich
            </div>
          </div>
        </section>

        <FinalCta />
      </main>
      <LandingFooter />
      <StickyVoiceCta />
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Clock, FileText, Mail } from 'lucide-react'
import { LEAD_MAGNETS } from '@/content/resources/data'
import { pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title: 'Ressourcen für HR-Teams',
  description:
    'Kostenlose PDF-Ressourcen für DACH-Recruiting-Teams: strukturierter Interview-Leitfaden mit Scorecards, DSGVO-Checkliste mit Rechtsgrundlagen pro Verarbeitungsschritt.',
  path: '/resources',
})

export default function ResourcesPage() {
  return (
    <>
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 mb-4">
              Ressourcen
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-4 text-text-primary">
              Kostenlose Praxis-Guides für HR-Teams
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Konkrete Vorlagen und Checklisten aus unserer Recruiting-Praxis. Kostenlos, sofort als
              Web-Version verfügbar, plus Download-Link per E-Mail.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {LEAD_MAGNETS.map((m) => {
              const Icon = m.icon
              return (
                <div
                  key={m.slug}
                  className="card-lg shadow-card hover:shadow-card-lg transition-all flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        {m.category}
                      </div>
                      <div className="text-xs text-text-secondary flex items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {m.pageCount} Seiten
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> ~{m.readMinutes} Min
                        </span>
                      </div>
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-text-primary mb-2 leading-tight">
                    {m.title}
                  </h2>
                  <p className="text-sm text-text-secondary leading-relaxed mb-5 flex-1">
                    {m.subtitle}
                  </p>
                  <Link
                    href={`/resources/${m.slug}`}
                    className="btn-primary py-2.5 px-5 inline-flex items-center justify-center gap-2 text-sm"
                  >
                    Inhalt ansehen <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )
            })}
          </div>

          <div className="mt-14 card-md bg-bg-secondary flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-brand-600" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-text-primary mb-1">Eigenes Thema im Sinn?</div>
              <p className="text-sm text-text-secondary">
                Schreiben Sie uns an{' '}
                <a href="mailto:hello@candiq.de" className="text-brand-700 hover:underline">
                  hello@candiq.de
                </a>{' '}
                — wir veröffentlichen die nachgefragtesten Praxis-Themen als nächstes.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CalendarCheck } from 'lucide-react'
import { listVerticals } from './data'
import { pageMeta } from '@/lib/seo'
import { BOOKING_URL } from '@/lib/site'

export const metadata: Metadata = pageMeta({
  title: 'Branchen-Lösungen für Referenzprüfung',
  description:
    'candiq für Tech, Sales und Healthcare-Recruiting. Vertikal-spezifische Reference-Checks, Zeugnis-Verifizierung und strukturierte Interviews — DSGVO-konform, in 7 Tagen.',
  path: '/branchen',
})

export default function BranchenPage() {
  const verticals = listVerticals()
  return (
    <>
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 mb-4">
              Branchen-Lösungen
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-4 text-text-primary">
              candiq für Ihre Branche
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Vertikal-spezifische Reference-Checks, Zeugnis-Verifizierung und
              strukturierte Interviews — abgestimmt auf die typischen
              Hiring-Fallstricke Ihrer Branche.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {verticals.map((v) => {
              const Icon = v.icon
              return (
                <Link
                  key={v.slug}
                  href={`/branchen/${v.slug}`}
                  className="card-md hover:shadow-card-lg transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-brand-600" />
                  </div>
                  <h2 className="text-lg font-bold text-text-primary mb-2">
                    {v.hero.eyebrow.replace('candiq für ', '')}
                  </h2>
                  <p className="text-sm text-text-secondary leading-relaxed mb-4 line-clamp-3">
                    {v.hero.subtitle}
                  </p>
                  <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 group-hover:text-brand-800">
                    Details ansehen <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="mt-14 text-center">
            <Link
              href={BOOKING_URL}
              className="btn-primary py-3 px-7 inline-flex items-center gap-2"
            >
              <CalendarCheck className="w-4 h-4" />
              15-Min-Termin buchen
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

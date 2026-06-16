import Link from 'next/link'
import { CalendarCheck, ArrowRight } from 'lucide-react'
import { JsonLd } from '@/components/JsonLd'
import { faqJsonLd, serviceJsonLd, breadcrumbJsonLd } from '@/lib/seo'
import { BOOKING_URL } from '@/lib/site'

export type KeywordSection = { h2: string; paragraphs: string[]; bullets?: string[] }
export type KeywordFaq = { q: string; a: string }

export type KeywordPageData = {
  breadcrumbName: string
  path: string
  hero: { eyebrow: string; h1: string; sub: string }
  sections: KeywordSection[]
  faq: KeywordFaq[]
  related: { href: string; label: string }[]
  ctaHeadline: string
}

export function KeywordPage({ data }: { data: KeywordPageData }) {
  return (
    <>
      <JsonLd data={serviceJsonLd()} />
      <JsonLd data={faqJsonLd(data.faq)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Start', path: '/' },
          { name: 'Referenzprüfung', path: '/referenzpruefung' },
          { name: data.breadcrumbName, path: data.path },
        ])}
      />

      <section className="pt-14 pb-10 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 mb-5">
            {data.hero.eyebrow}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-5 text-text-primary leading-tight">
            {data.hero.h1}
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">{data.hero.sub}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={BOOKING_URL} className="btn-primary py-3 px-7 inline-flex items-center gap-2">
              <CalendarCheck className="w-4 h-4" /> 15-Min-Termin buchen
            </Link>
            <Link href="/termin" className="btn-secondary py-3 px-7">Termin buchen</Link>
          </div>
        </div>
      </section>

      <section className="pb-8 px-6">
        <div className="max-w-3xl mx-auto">
          {data.sections.map((s) => (
            <div key={s.h2} className="mb-10">
              <h2 className="text-2xl font-bold tracking-tight mb-4 text-text-primary">{s.h2}</h2>
              {s.paragraphs.map((p, i) => (
                <p
                  key={i}
                  className="text-text-secondary leading-relaxed mb-4"
                  dangerouslySetInnerHTML={{ __html: p }}
                />
              ))}
              {s.bullets && (
                <ul className="space-y-2 text-text-secondary leading-relaxed mb-2 list-disc pl-5">
                  {s.bullets.map((b, i) => (
                    <li key={i} dangerouslySetInnerHTML={{ __html: b }} />
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Related / interne Verlinkung */}
      <section className="py-14 px-6 bg-bg-secondary">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold tracking-tight mb-6 text-text-primary text-center">
            Verwandte Themen
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {data.related.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="card-md hover:shadow-card-lg transition-all flex items-center justify-between gap-3 group"
              >
                <span className="font-semibold text-text-primary group-hover:text-brand-700">{r.label}</span>
                <ArrowRight className="w-4 h-4 text-brand-600 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight mb-8 text-text-primary text-center">Häufige Fragen</h2>
          <div className="space-y-4">
            {data.faq.map((f) => (
              <div key={f.q} className="card-md">
                <h3 className="font-semibold text-text-primary mb-2">{f.q}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 text-center bg-bg-secondary">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight mb-4 text-text-primary">{data.ctaHeadline}</h2>
          <p className="text-text-secondary mb-7">
            In 15 Minuten klären wir Ihren konkreten Use Case und richten Ihren Testzugang ein.
          </p>
          <Link href={BOOKING_URL} className="btn-primary py-3 px-7 inline-flex items-center gap-2">
            <CalendarCheck className="w-4 h-4" /> 15-Min-Termin buchen
          </Link>
        </div>
      </section>
    </>
  )
}

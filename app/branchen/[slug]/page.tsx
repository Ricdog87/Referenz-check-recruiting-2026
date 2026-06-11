import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle, CheckCircle2, ArrowRight, CalendarCheck, ExternalLink,
} from 'lucide-react'
import { getVertical, listVerticals } from '../data'
import { BOOKING_URL } from '@/lib/site'

export function generateStaticParams() {
  return listVerticals().map((v) => ({ slug: v.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const v = getVertical(params.slug)
  if (!v) return { title: 'Branche nicht gefunden', robots: { index: false, follow: true } }
  const path = `/branchen/${v.slug}`
  const url = `https://candiq.de${path}`
  const ogTitle = typeof v.metadata.title === 'string' ? `${v.metadata.title} | candiq` : 'candiq'
  return {
    ...v.metadata,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'de_DE',
      siteName: 'candiq',
      url,
      title: ogTitle,
      description: (v.metadata.description as string | undefined) ?? undefined,
    },
  }
}

export default function VerticalPage({ params }: { params: { slug: string } }) {
  const v = getVertical(params.slug)
  if (!v) notFound()
  const Icon = v.icon

  return (
    <>
      <section className="pt-12 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 mb-5">
            <Icon className="w-3.5 h-3.5" />
            {v.hero.eyebrow}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-5 text-text-primary leading-tight">
            {v.hero.title}
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            {v.hero.subtitle}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={BOOKING_URL} className="btn-primary py-3 px-7 inline-flex items-center gap-2">
              <CalendarCheck className="w-4 h-4" />
              15-Min-Termin buchen
            </Link>
            <Link href="/preise#addons" className="btn-secondary py-3 px-7">
              Add-ons ansehen
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-bg-secondary">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tighter mb-3 text-text-primary text-center">
            {v.pain.headline}
          </h2>
          <p className="text-sm text-text-secondary text-center mb-10 max-w-2xl mx-auto">
            Diese Muster sehen wir in unseren Recruiting-Projekten am häufigsten — anonymisiert und ohne konkrete Firmenbezüge.
          </p>
          <ul className="space-y-3 max-w-3xl mx-auto">
            {v.pain.points.map((p, i) => (
              <li key={i} className="card-md flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </span>
                <span className="text-sm text-text-primary leading-relaxed pt-0.5">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter mb-3 text-text-primary">
              Drei typische Beispiel-Szenarien
            </h2>
            <p className="text-sm text-text-secondary max-w-2xl mx-auto">
              Anonymisierte Hiring-Situationen aus unserer Praxis — alle Namen,
              Firmen und Zahlen sind beispielhaft, keine echten Kunden-Cases.
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-5">
            {v.useCases.map((u, i) => (
              <article key={i} className="card-md flex flex-col">
                <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  Beispiel {i + 1}
                </div>
                <h3 className="text-base font-bold text-text-primary mb-3 leading-snug">
                  {u.title.replace(/^Beispiel-Szenario [A-Z]: /, '')}
                </h3>
                <div className="mb-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">Situation</div>
                  <p className="text-xs text-text-secondary leading-relaxed">{u.scenario}</p>
                </div>
                <div className="mb-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1">Risiko ohne Check</div>
                  <p className="text-xs text-text-secondary leading-relaxed">{u.risk}</p>
                </div>
                <div className="mt-auto pt-3 border-t border-border">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">candiq-Antwort</div>
                  <p className="text-xs text-text-secondary leading-relaxed">{u.candiqAnswer}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-bg-secondary">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tighter mb-3 text-text-primary">
              Empfohlene candiq-Add-ons
            </h2>
            <p className="text-sm text-text-secondary max-w-2xl mx-auto">
              Diese drei Bausteine decken die typischen Hiring-Risiken in dieser Branche ab.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {v.recommendations.map((r) => (
              <Link key={r.sku} href={r.href} className="card-md hover:shadow-card-lg transition-all flex flex-col group">
                <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-4 h-4 text-brand-600" />
                </div>
                <h3 className="text-base font-bold text-text-primary mb-2">{r.addonName}</h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4 flex-1">{r.why}</p>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 group-hover:text-brand-800">
                  Details ansehen <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {v.stat && (
        <section className="py-12 px-6">
          <div className="max-w-3xl mx-auto card-md text-center">
            <div className="text-4xl font-black text-brand-700 tracking-tighter">{v.stat.number}</div>
            <div className="text-sm text-text-secondary mt-2 mb-3">{v.stat.label}</div>
            <a
              href={v.stat.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-brand-700"
            >
              <ExternalLink className="w-3 h-3" />
              Quelle: {v.stat.sourceLabel}
            </a>
          </div>
        </section>
      )}

      {/* Branche-Learnings — aus candiq-Praxis, ehrlich gerahmt */}
      {v.learnings && v.learnings.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">
                Aus unserer Reviewer-Praxis
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-text-primary">
                Drei Dinge, die wir in dieser Vertikale immer wieder sehen
              </h3>
            </div>
            <div className="space-y-3">
              {v.learnings.map((learning, i) => (
                <div key={i} className="card-md flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed pt-1">{learning}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold tracking-tight mb-4 text-text-primary">
            Klingt nach Ihrer Hiring-Situation?
          </h3>
          <p className="text-text-secondary mb-7">
            In einem 15-Minuten-Termin klären wir Ihren konkreten Use Case und richten Ihren Testzugang ein. Kein Self-Service-Trial, keine starre Befristung.
          </p>
          <Link href={BOOKING_URL} className="btn-primary py-3 px-7 inline-flex items-center gap-2">
            <CalendarCheck className="w-4 h-4" />
            15-Min-Termin buchen
          </Link>
        </div>
      </section>
    </>
  )
}

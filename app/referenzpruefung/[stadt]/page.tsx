import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CalendarCheck, ArrowRight, Upload, ShieldCheck, Phone, MapPin, Server, FileCheck, Trash2 } from 'lucide-react'
import { getStadt, listStaedte } from '@/data/staedte'
import { JsonLd } from '@/components/JsonLd'
import { faqJsonLd, serviceJsonLd, breadcrumbJsonLd } from '@/lib/seo'
import { BOOKING_URL } from '@/lib/site'

export function generateStaticParams() {
  return listStaedte().map((s) => ({ stadt: s.slug }))
}

export function generateMetadata({ params }: { params: { stadt: string } }): Metadata {
  const s = getStadt(params.stadt)
  if (!s) return { title: 'Stadt nicht gefunden', robots: { index: false, follow: true } }
  const path = `/referenzpruefung/${s.slug}`
  const url = `https://candiq.de${path}`
  const title = `Referenzprüfung ${s.name}: DSGVO-konform & schnell | candiq`
  const description = `DSGVO-konforme Referenzprüfung für Arbeitgeber in ${s.name}: echte Telefonate, Server in Deutschland, Report in unter 48 h. Jetzt Testzugang sichern.`
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', locale: 'de_DE', siteName: 'candiq', url, title, description },
    twitter: { card: 'summary_large_image', title, description },
  }
}

const STEPS = [
  { icon: Upload, title: 'Anfrage in 30 Sekunden anlegen', body: 'Position und Bewerber-E-Mail eingeben. candiq versendet automatisch einen sicheren Einladungslink.' },
  { icon: ShieldCheck, title: 'Bewerber willigt selbst ein', body: 'Im Self-Service-Portal nennt der Bewerber seine Referenzgeber und erteilt die Einwilligung gem. Art. 6 & 7 DSGVO.' },
  { icon: Phone, title: 'Reviewer verifizieren telefonisch', body: 'Geschulte Reviewer kontaktieren die freigegebenen Referenzgeber. Sie erhalten den Report in unter 48 Stunden.' },
]

const COMPLIANCE = [
  { icon: Server, title: 'Server in Deutschland', body: 'Alle Verifizierungsdaten werden in Deutschland verarbeitet.' },
  { icon: ShieldCheck, title: 'Einwilligung & Audit-Trail', body: 'Granulare Einwilligung nach Art. 6 & 7 DSGVO, lückenlos protokolliert.' },
  { icon: FileCheck, title: 'AVV nach Art. 28', body: 'Auftragsverarbeitungsvertrag standardmäßig im Onboarding.' },
  { icon: Trash2, title: 'Auto-Löschung nach 180 Tagen', body: 'Daten werden automatisch per Cron-Job gelöscht — Datensparsamkeit by Design.' },
]

export default function StadtPage({ params }: { params: { stadt: string } }) {
  const s = getStadt(params.stadt)
  if (!s) notFound()

  const path = `/referenzpruefung/${s.slug}`
  const faq = [
    s.localFaq,
    { q: `Wie schnell ist die Referenzprüfung in ${s.name}?`, a: 'candiq arbeitet remote für ganz Deutschland — der strukturierte Report liegt typischerweise in unter 48 Stunden vor, mit Express-Option in unter 24 Stunden.' },
    { q: 'Ist die Referenzprüfung DSGVO-konform?', a: 'Ja. Einwilligung des Kandidaten nach Art. 6 & 7 DSGVO über ein Self-Service-Portal, Server in Deutschland, AVV nach Art. 28 und automatische Löschung nach 180 Tagen.' },
  ]

  return (
    <>
      <JsonLd data={serviceJsonLd({ areaServed: s.name })} />
      <JsonLd data={faqJsonLd(faq)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Start', path: '/' },
          { name: 'Referenzprüfung', path: '/referenzpruefung' },
          { name: s.name, path },
        ])}
      />

      {/* Lokaler Block */}
      <section className="pt-14 pb-10 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 mb-5">
            <MapPin className="w-3.5 h-3.5" /> {s.name} · {s.region}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-5 text-text-primary leading-tight">
            {s.h1}
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">{s.intro}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={BOOKING_URL} className="btn-primary py-3 px-7 inline-flex items-center gap-2">
              <CalendarCheck className="w-4 h-4" /> 15-Min-Termin buchen
            </Link>
            <Link href="/demo" className="btn-secondary py-3 px-7">Live-Demo öffnen</Link>
          </div>
        </div>
      </section>

      <section className="pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="card-md">
            <div className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-2">
              Branchen-Fokus in {s.name}
            </div>
            <p className="text-text-secondary leading-relaxed mb-4">{s.branchenAngle}</p>
            <div className="flex flex-wrap gap-2">
              {s.leitbranchen.map((b) => (
                <span key={b} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-bg-secondary border border-border text-text-secondary">
                  {b}
                </span>
              ))}
            </div>
          </div>
          <p className="text-sm text-text-muted mt-4 text-center">
            candiq arbeitet remote für ganz Deutschland — Sie brauchen keinen Anbieter vor Ort.
          </p>
        </div>
      </section>

      {/* Gemeinsam: So funktioniert's */}
      <section className="py-16 px-6 bg-bg-secondary">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tighter mb-10 text-text-primary text-center">So funktioniert&rsquo;s</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {STEPS.map((st, i) => (
              <div key={st.title} className="card-md">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-violet flex items-center justify-center mb-4 shadow-glow">
                  <st.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-1">Schritt {i + 1}</div>
                <h3 className="font-bold text-text-primary mb-2">{st.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{st.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gemeinsam: Compliance by Design */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tighter mb-10 text-text-primary text-center">Compliance by Design</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {COMPLIANCE.map((c) => (
              <div key={c.title} className="card-md">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
                  <c.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-bold text-text-primary mb-1 text-sm">{c.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 bg-bg-secondary">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight mb-8 text-text-primary text-center">
            Häufige Fragen — Referenzprüfung in {s.name}
          </h2>
          <div className="space-y-4">
            {faq.map((f) => (
              <div key={f.q} className="card-md bg-white">
                <h3 className="font-semibold text-text-primary mb-2">{f.q}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/referenzpruefung" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
              Mehr im Referenzprüfung-Leitfaden <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight mb-4 text-text-primary">
            Referenzprüfung in {s.name} — heute starten
          </h2>
          <p className="text-text-secondary mb-7">
            In 15 Minuten klären wir Ihren Use Case und richten Ihren Testzugang ein.
          </p>
          <Link href={BOOKING_URL} className="btn-primary py-3 px-7 inline-flex items-center gap-2">
            <CalendarCheck className="w-4 h-4" /> 15-Min-Termin buchen
          </Link>
        </div>
      </section>
    </>
  )
}

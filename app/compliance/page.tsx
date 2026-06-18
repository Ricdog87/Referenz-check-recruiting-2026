import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CalendarCheck, ShieldCheck, Server, UserCheck, FileText, Eye, Trash2 } from 'lucide-react'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { StickyVoiceCta } from '@/components/landing/StickyVoiceCta'
import { JsonLd } from '@/components/JsonLd'
import { pageMeta, softwareApplicationJsonLd, breadcrumbJsonLd, faqJsonLd } from '@/lib/seo'
import { CompliancePromise } from '@/components/landing/sections/CompliancePromise'
import { FinalCta } from '@/components/landing/sections/FinalCta'
import { RelatedPagesStrip } from '@/components/landing/RelatedPagesStrip'
import { BOOKING_URL } from '@/lib/site'

const COMPLIANCE_FAQ = [
  {
    q: 'Wo werden die Personaldaten gespeichert?',
    a: 'Ausschließlich in Rechenzentren in Deutschland und EU. Die Datenbank liegt bei einer EU-Region eines deutschen Cloud-Anbieters (Supabase EU). Keine Datenübermittlung in unsichere Drittstaaten ohne dokumentierte Standardvertragsklauseln.',
  },
  {
    q: 'Wie lange werden Kandidatendaten aufbewahrt?',
    a: 'Abgeschlossene Referenzprüfungen werden nach maximal 180 Tagen automatisch gelöscht — über einen täglich laufenden Cron-Job. Die Frist ist pro Kandidaten-Status differenziert und gesetzlich begründbar. Bewerber können vorher jederzeit Löschung verlangen (Art. 17 DSGVO).',
  },
  {
    q: 'Gibt es einen Auftragsverarbeitungsvertrag?',
    a: 'Ja, ein Standard-AVV nach Art. 28 DSGVO ist im Lieferumfang enthalten — keine Sonderverhandlung nötig. Für regulierte Branchen (Banking, Healthcare, Versicherung) bieten wir branchenspezifische Anpassungen.',
  },
  {
    q: 'Werden Referenzgeber von einer KI angerufen?',
    a: 'Nein. Referenzgeber werden ausschließlich von geschulten menschlichen Reviewern persönlich kontaktiert. KI dokumentiert und strukturiert nur, was Menschen verifiziert haben. candiq Voice spricht ausschließlich mit Kandidaten — niemals mit deren Referenzgebern.',
  },
  {
    q: 'Wie ist die DSAR-Auskunft (Art. 15 DSGVO) organisiert?',
    a: 'Jeder Lesezugriff, jede Statusänderung und jede E-Mail wird in einem Audit-Trail mit Zeitstempel, Akteur und IP protokolliert. Eine Auskunft an einen Betroffenen ist damit ein gezielter Datenbank-Export, keine wochenlange manuelle Recherche.',
  },
]

export const metadata: Metadata = pageMeta({
  title: 'Compliance & DSGVO — Wie candiq Personaldaten schützt',
  description:
    'DSGVO-konform by Design, Server in Deutschland, AVV inklusive, Audit-Trail für jeden Zugriff, automatische Löschung nach 180 Tagen. Hier sind die konkreten technischen und vertraglichen Garantien.',
  path: '/compliance',
})

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'DSGVO-konform by Design',
    body: 'Datenminimierung im Schema (kein Foto, kein Geburtsdatum, keine geschützten Merkmale), Privacy-Defaults aktiv, geprüfte Auftragsverarbeitung. Art. 6 + 7 dokumentiert pro Kandidat.',
  },
  {
    icon: Server,
    title: 'Server in Deutschland',
    body: 'Hosting in EU/DE bei deutschen Hyperscaler-Regionen. Keine Datenübermittlung in unsichere Drittstaaten. SCCs nur dort, wo unumgänglich — und transparent dokumentiert.',
  },
  {
    icon: UserCheck,
    title: 'Verifizierung durch Menschen',
    body: 'Geschulte Reviewer rufen Referenzgeber persönlich an — keine Bot-Anrufe, keine KI-Stimme bei Ihren Kontakten. KI dokumentiert und strukturiert nur, was Menschen verifiziert haben.',
  },
  {
    icon: FileText,
    title: 'AVV ab Tag 1',
    body: 'Standard-Auftragsverarbeitungsvertrag (Art. 28 DSGVO) inklusive — keine Sonderverhandlung nötig. Anpassbar für regulierte Branchen (Banking, Healthcare, Versicherung).',
  },
  {
    icon: Eye,
    title: 'Audit-Trail für jeden Zugriff',
    body: 'Jeder Lesezugriff, jede Statusänderung, jede E-Mail wird mit Zeitstempel, Akteur und IP protokolliert. DSAR-Auskunft (Art. 15) ist ein Knopfdruck, keine Wochen-Recherche.',
  },
  {
    icon: Trash2,
    title: 'Auto-Löschung nach 180 Tagen',
    body: 'Tägliche Cron-Routine löscht abgeschlossene Prüfungen nach gesetzlich begründbarer Speicherdauer. Speicherfristen pro Kandidaten-Status differenziert — kein Datenfriedhof.',
  },
]

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-white text-text-primary overflow-x-hidden antialiased">
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Start', path: '/' },
        { name: 'Compliance & DSGVO', path: '/compliance' },
      ])} />
      <JsonLd data={faqJsonLd(COMPLIANCE_FAQ)} />
      <LandingNav />
      <main id="main">
        {/* Page-Hero */}
        <section className="pt-28 pb-12 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 mb-5">
              <ShieldCheck className="w-3.5 h-3.5" /> Compliance &amp; DSGVO
            </div>
            <h1 className="text-[clamp(34px,5vw,56px)] font-bold leading-[1.05] tracking-tightest text-text-primary mb-5">
              Compliance ist{' '}
              <span className="text-gradient-brand">kein Add-on.</span>
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed">
              Wir verarbeiten sensible Personaldaten — und behandeln sie auch
              so. Hier die konkreten technischen und vertraglichen Garantien,
              die Ihr Datenschutz-Team in einem Audit-Termin vorlegen kann.
            </p>
          </div>
        </section>

        {/* Sechs Säulen — konkret, nicht Marketing-Sprech */}
        <section className="pb-16 px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PILLARS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="card-md">
                <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-base font-semibold text-text-primary mb-2 leading-tight">
                  {title}
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bestehende dunkle Compliance-Promise-Karte als Visual-Anker */}
        <CompliancePromise />

        {/* Doc-Links für Datenschutz-Teams */}
        <section className="py-12 px-6">
          <div className="max-w-3xl mx-auto card-md">
            <div className="text-sm font-semibold text-text-primary mb-4">
              Für Ihr Datenschutz-Team
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Datenschutzerklärung', href: '/datenschutz' },
                { label: 'AVV (Auftragsverarbeitung)', href: '/datenschutz#avv' },
                { label: 'AGB', href: '/agb' },
                { label: 'Impressum', href: '/impressum' },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-border hover:border-brand-300 hover:bg-brand-50/30 transition-colors group"
                >
                  <span className="font-medium text-text-primary">{l.label}</span>
                  <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
            <div className="mt-5 pt-5 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs text-text-muted">
                Audit-Termin mit unserem Datenschutz-Verantwortlichen gewünscht?
              </div>
              <Link
                href={BOOKING_URL}
                className="btn-secondary text-sm py-2 px-4 inline-flex"
              >
                <CalendarCheck className="w-4 h-4" />
                Audit-Termin buchen
              </Link>
            </div>
          </div>
        </section>

        {/* Sichtbare FAQ — gleicher Content wie der FAQPage-JsonLd oben.
            Strukturierte Daten + sichtbarer Text ist die Google-konforme
            Variante; nur strukturiert ohne sichtbar würde als spam-naher
            "hidden content" gewertet. */}
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">
                Datenschutz-FAQ
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
                Die fünf Fragen, die jedes Datenschutz-Team zuerst stellt
              </h2>
            </div>
            <div className="space-y-3">
              {COMPLIANCE_FAQ.map(({ q, a }) => (
                <details key={q} className="card-md group">
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
                    <span className="text-base font-semibold text-text-primary">{q}</span>
                    <ArrowRight className="w-4 h-4 text-text-muted shrink-0 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="text-sm text-text-secondary leading-relaxed mt-3 pt-3 border-t border-border">
                    {a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <RelatedPagesStrip currentHref="/compliance" />
        <FinalCta />
      </main>
      <LandingFooter />
      <StickyVoiceCta />
    </div>
  )
}

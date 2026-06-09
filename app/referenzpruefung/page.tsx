import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarCheck, ArrowRight, ShieldCheck, Phone, FileText, Scale } from 'lucide-react'
import { JsonLd } from '@/components/JsonLd'
import {
  pageMeta, faqJsonLd, serviceJsonLd, softwareApplicationJsonLd, breadcrumbJsonLd,
} from '@/lib/seo'
import { BOOKING_URL } from '@/lib/site'

export const metadata: Metadata = pageMeta({
  title: 'Referenzprüfung DSGVO-konform — der komplette Leitfaden',
  description:
    'Was ist eine Referenzprüfung, welche Rechtsgrundlage gilt (Art. 6 & 7 DSGVO, § 26 BDSG), wie läuft sie ab und was bringt sie? Der vollständige Leitfaden für HR-Teams im DACH-Raum — plus DSGVO-konformes Tool.',
  path: '/referenzpruefung',
})

const FAQ = [
  {
    q: 'Was ist eine Referenzprüfung?',
    a: 'Eine Referenzprüfung ist die strukturierte Verifizierung der Angaben eines Bewerbers — frühere Stationen, Position, Tätigkeiten und Leistung — durch Rücksprache mit benannten Referenzgebern, in der Regel früheren Vorgesetzten. Ziel ist, Diskrepanzen zwischen Eigenangaben im Lebenslauf und der Realität aufzudecken, bevor eine Einstellung erfolgt.',
  },
  {
    q: 'Ist eine Referenzprüfung in Deutschland DSGVO-konform möglich?',
    a: 'Ja — sofern eine wirksame Einwilligung des Bewerbers vorliegt (Art. 6 Abs. 1 lit. a und Art. 7 DSGVO) und nur die vom Bewerber selbst benannten Referenzgeber kontaktiert werden. § 26 BDSG erlaubt die Verarbeitung von Beschäftigtendaten für die Entscheidung über ein Beschäftigungsverhältnis. candiq setzt dafür ein granulares Self-Service-Einwilligungs-Portal mit Audit-Trail ein.',
  },
  {
    q: 'Darf ich frühere Arbeitgeber ohne Zustimmung des Bewerbers anrufen?',
    a: 'Nein. Eine Kontaktaufnahme mit Referenzgebern ohne ausdrückliche, dokumentierte Einwilligung des Bewerbers ist datenschutzrechtlich unzulässig und kann das Vertrauensverhältnis zerstören. Deshalb nennt der Bewerber bei candiq seine Referenzgeber selbst und erteilt die Einwilligung vorab.',
  },
  {
    q: 'Wie lange dauert eine Referenzprüfung?',
    a: 'Bei candiq liegt der strukturierte Report typischerweise in unter 48 Stunden vor, mit Express-Option in unter 24 Stunden. Die Dauer hängt vor allem von der Erreichbarkeit der Referenzgeber ab.',
  },
  {
    q: 'Was kostet eine Referenzprüfung?',
    a: 'Bei candiq starten Pakete ab 65 €/Monat, ein Einzelcheck kostet 49 €. Volumen-Pakete senken den Preis pro Check. Die Preise sind öffentlich einsehbar und monatlich kündbar.',
  },
  {
    q: 'Worin unterscheidet sich Referenzprüfung von einem Background Check?',
    a: 'Eine Referenzprüfung verifiziert berufliche Angaben über Referenzgeber. Ein Background Check umfasst potenziell weitergehende Prüfungen (z. B. Bonität, Strafregister) — viele davon sind in Deutschland nur eingeschränkt zulässig. candiq fokussiert bewusst auf die rechtlich klar zulässige Referenz-, Zeugnis- und CV-Verifizierung.',
  },
]

const ABLAUF = [
  { icon: FileText, title: '1. Auftrag anlegen', body: 'Position und Bewerber-E-Mail eingeben. candiq versendet automatisch einen sicheren Einladungslink.' },
  { icon: ShieldCheck, title: '2. Bewerber willigt ein', body: 'Im Self-Service-Portal nennt der Bewerber seine Referenzgeber und erteilt die granulare Einwilligung gem. Art. 6 & 7 DSGVO.' },
  { icon: Phone, title: '3. Reviewer verifizieren', body: 'Geschulte Reviewer kontaktieren ausschließlich die freigegebenen Referenzgeber — telefonisch, mit standardisierten Fragen.' },
  { icon: Scale, title: '4. Report & Entscheidung', body: 'Strukturierter PDF-Report mit Bewertung pro Station und Diskrepanz-Markierung. Auto-Löschung nach 180 Tagen.' },
]

const INTERNAL_LINKS = [
  { href: '/reference-check-dsgvo', label: 'Reference-Check-Software aus Deutschland', desc: 'Produkt-Überblick, Consent-Portal, Reviewer, Report' },
  { href: '/zeugnis-pruefen-lassen', label: 'Arbeitszeugnis prüfen lassen', desc: 'Echtheits-Check und Decoding der Zeugnis-Geheimcodes' },
  { href: '/lebenslauf-verifizieren', label: 'Lebenslauf verifizieren', desc: 'Stationen und Tätigkeiten gegen die Realität prüfen' },
  { href: '/pre-employment-screening', label: 'Pre-Employment Screening', desc: 'Was in Deutschland erlaubt ist — und was nicht' },
  { href: '/background-check-dsgvo', label: 'Background Check DSGVO-konform', desc: 'Die rechtlichen Grenzen in Deutschland' },
  { href: '/branchen/tech-recruiting', label: 'Branchen-Lösungen', desc: 'Tech, Sales und Healthcare-Recruiting' },
]

export default function ReferenzpruefungPillar() {
  return (
    <>
      <JsonLd data={serviceJsonLd()} />
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd data={faqJsonLd(FAQ)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Start', path: '/' },
          { name: 'Referenzprüfung', path: '/referenzpruefung' },
        ])}
      />

      <section className="pt-14 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 mb-5">
            Leitfaden
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-5 text-text-primary leading-tight">
            Referenzprüfung DSGVO-konform — der komplette Leitfaden
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Alles, was HR-Teams und Personaldienstleister im DACH-Raum über die rechtssichere
            Referenzprüfung wissen müssen: Definition, Rechtsgrundlage, Ablauf, Nutzen — und wie candiq
            das in unter 48 Stunden erledigt.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={BOOKING_URL} className="btn-primary py-3 px-7 inline-flex items-center gap-2">
              <CalendarCheck className="w-4 h-4" /> 15-Min-Termin buchen
            </Link>
            <Link href="/demo" className="btn-secondary py-3 px-7">Live-Demo öffnen</Link>
          </div>
        </div>
      </section>

      <section className="pb-8 px-6">
        <div className="max-w-3xl mx-auto prose-candiq">
          <h2 className="text-2xl font-bold tracking-tight mb-4 text-text-primary">Was ist eine Referenzprüfung?</h2>
          <p className="text-text-secondary leading-relaxed mb-4">
            Eine <strong>Referenzprüfung</strong> (englisch: Reference Check) ist die strukturierte
            Verifizierung der beruflichen Angaben eines Bewerbers durch Rücksprache mit dessen
            Referenzgebern — meist frühere Vorgesetzte oder Kollegen. Geprüft werden typischerweise:
            tatsächliche Position und Zeitraum, übernommene Tätigkeiten und Verantwortung, Arbeitsweise
            und Zusammenarbeit sowie der Grund für das Ausscheiden.
          </p>
          <p className="text-text-secondary leading-relaxed mb-4">
            In Zeiten, in denen KI-Tools jeden Lebenslauf passgenau auf die Stelle umschreiben, wird die
            Referenzprüfung zum entscheidenden Realitäts-Abgleich: Sie deckt Diskrepanzen zwischen dem,
            was auf dem Papier steht, und dem, was wirklich war, auf — <em>bevor</em> eine teure
            Fehlbesetzung passiert.
          </p>

          <h2 className="text-2xl font-bold tracking-tight mb-4 mt-10 text-text-primary">
            Rechtsgrundlage: Was die DSGVO und das BDSG erlauben
          </h2>
          <p className="text-text-secondary leading-relaxed mb-4">
            Eine Referenzprüfung verarbeitet personenbezogene Daten und braucht deshalb eine
            Rechtsgrundlage. In Deutschland sind die relevanten Normen:
          </p>
          <ul className="space-y-2 text-text-secondary leading-relaxed mb-4 list-disc pl-5">
            <li><strong>Art. 6 Abs. 1 lit. a DSGVO</strong> — Einwilligung des Bewerbers in die konkrete Verarbeitung.</li>
            <li><strong>Art. 7 DSGVO</strong> — Anforderungen an eine wirksame, freiwillige und nachweisbare Einwilligung.</li>
            <li><strong>§ 26 BDSG</strong> — Verarbeitung von Beschäftigtendaten für die Entscheidung über ein Beschäftigungsverhältnis.</li>
          </ul>
          <p className="text-text-secondary leading-relaxed mb-4">
            Entscheidend ist: Es dürfen <strong>nur die vom Bewerber selbst benannten Referenzgeber</strong>
            kontaktiert werden, und die Einwilligung muss vorher dokumentiert vorliegen. Ein eigenmächtiger
            Anruf beim aktuellen Arbeitgeber ohne Zustimmung ist unzulässig. candiq löst das über ein
            granulares Self-Service-Portal, in dem der Bewerber seine Referenzgeber selbst eingibt und die
            Einwilligung mit Zeitstempel und Audit-Trail erteilt.
          </p>

          <h2 className="text-2xl font-bold tracking-tight mb-6 mt-10 text-text-primary">
            Wie läuft eine Referenzprüfung mit candiq ab?
          </h2>
        </div>

        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-4 mb-8">
          {ABLAUF.map((s) => (
            <div key={s.title} className="card-md flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
                <s.icon className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary mb-1">{s.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto prose-candiq">
          <h2 className="text-2xl font-bold tracking-tight mb-4 mt-6 text-text-primary">
            Welchen Nutzen bringt eine Referenzprüfung?
          </h2>
          <p className="text-text-secondary leading-relaxed mb-4">
            Eine Fehlbesetzung kostet laut Studien rund das 1,5-fache eines Jahresgehalts — durch
            Einarbeitung, entgangene Produktivität, Neuausschreibung und Team-Schaden. Die Referenzprüfung
            ist eine der günstigsten Versicherungen dagegen: Für den Bruchteil dieser Kosten erhalten Sie
            ein verlässliches Signal, ob die Angaben stimmen. Konkret reduziert sie unnötige
            Erstgespräche, beschleunigt saubere Shortlists und macht Einstellungsentscheidungen gegenüber
            Geschäftsführung und Compliance verteidigbar.
          </p>
        </div>
      </section>

      {/* Interne Verlinkung — Pillar verlinkt auf alle Cluster-Seiten */}
      <section className="py-16 px-6 bg-bg-secondary">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight mb-8 text-text-primary text-center">
            Vertiefen Sie einzelne Themen
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTERNAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="card-md hover:shadow-card-lg transition-all group">
                <h3 className="font-bold text-text-primary mb-1 group-hover:text-brand-700">{l.label}</h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-3">{l.desc}</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                  Mehr erfahren <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight mb-8 text-text-primary text-center">
            Häufige Fragen zur Referenzprüfung
          </h2>
          <div className="space-y-4">
            {FAQ.map((f) => (
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
          <h2 className="text-3xl font-bold tracking-tight mb-4 text-text-primary">
            Referenzprüfung, die einem Audit standhält
          </h2>
          <p className="text-text-secondary mb-7">
            In 15 Minuten zeigen wir Ihnen den Report-Flow live und richten Ihren Testzugang ein.
          </p>
          <Link href={BOOKING_URL} className="btn-primary py-3 px-7 inline-flex items-center gap-2">
            <CalendarCheck className="w-4 h-4" /> 15-Min-Termin buchen
          </Link>
        </div>
      </section>
    </>
  )
}

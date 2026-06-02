import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarCheck, ArrowRight } from 'lucide-react'
import { ComparisonTable } from '@/components/ComparisonTable'
import { JsonLd } from '@/components/JsonLd'
import { pageMeta, breadcrumbJsonLd, faqJsonLd } from '@/lib/seo'
import { BOOKING_URL } from '@/lib/site'

export const metadata: Metadata = pageMeta({
  title: 'candiq als Validato-Alternative',
  description:
    'candiq vs. Validato im ehrlichen Vergleich: Datenstandort Deutschland, transparente Preise ab 65 €/Mo, Reviewer statt Bots, ATS-Integration und Auto-Löschung. Wann candiq die bessere Wahl ist.',
  path: '/vergleich/validato-alternative',
  ogTitle: 'candiq vs. Validato — der ehrliche Vergleich | candiq',
})

const FAQ = [
  {
    q: 'Ist candiq eine echte Alternative zu Validato?',
    a: 'Ja — wenn Ihr Fokus auf Referenzprüfung im Recruiting liegt. candiq ist auf telefonische Referenz-, Zeugnis- und CV-Verifizierung spezialisiert, mit Servern in Deutschland, transparenten Preisen ab 65 €/Monat und einem granularen Einwilligungs-Portal für Kandidaten. Validato deckt ein breiteres Screening-Portfolio ab.',
  },
  {
    q: 'Wo liegt der Hauptunterschied?',
    a: 'Datenstandort (candiq: Server in Deutschland), Preistransparenz (candiq veröffentlicht Preise, Validato auf Anfrage), Self-Service-Einwilligung der Kandidaten mit Audit-Trail und die Spezialisierung auf Recruiting-Referenzprüfung statt breitem Pre-Employment-Screening.',
  },
  {
    q: 'Wann passt Validato besser?',
    a: 'Wenn Sie ein breites Zusatz-Portfolio wie Bonitäts-, Strafregister- oder OSINT-Prüfungen aus einer Hand benötigen oder eine bestehende ISO-27001-Zertifizierung zwingend Voraussetzung ist. Beides bilden wir bei candiq bewusst transparent ab.',
  },
]

export default function ValidatoAlternativePage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Start', path: '/' },
          { name: 'Vergleich', path: '/vergleich/validato-alternative' },
          { name: 'candiq vs. Validato', path: '/vergleich/validato-alternative' },
        ])}
      />
      <JsonLd data={faqJsonLd(FAQ)} />

      <section className="pt-14 pb-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 mb-5">
            Wettbewerbs-Vergleich
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-5 text-text-primary leading-tight">
            Die DSGVO-konforme Alternative zu Validato
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Sie evaluieren Tools zur Kandidaten-Verifizierung und Validato steht auf Ihrer Liste?
            Hier sehen Sie sachlich, wo candiq die bessere Wahl ist — und wo Validato seine Stärken hat.
          </p>
        </div>
      </section>

      {/* Vergleichstabelle als zentrales Element (eigene Headline schon im H1 oben) */}
      <ComparisonTable withHeading={false} />

      {/* Fairer Fließtext */}
      <section className="py-16 px-6 bg-bg-secondary">
        <div className="max-w-3xl mx-auto prose-candiq">
          <h2 className="text-2xl font-bold tracking-tight mb-4 text-text-primary">
            Wann candiq die bessere Wahl ist
          </h2>
          <p className="text-text-secondary leading-relaxed mb-4">
            candiq ist gebaut für HR-Teams und Personaldienstleister im DACH-Raum, die <strong>Referenzen,
            Arbeitszeugnisse und Tätigkeitsangaben</strong> zuverlässig verifizieren wollen — bevor ein
            teures Erstgespräch oder eine Fehlbesetzung passiert. Drei Gründe sprechen besonders für candiq:
          </p>
          <ul className="space-y-2 text-text-secondary leading-relaxed mb-6 list-disc pl-5">
            <li>
              <strong>Datenhoheit in Deutschland.</strong> Alle Verifizierungsdaten werden auf Servern in
              Deutschland verarbeitet. Für Mittelstand und öffentlich-nahe Arbeitgeber, die Datenstandort
              als Vergabe-Kriterium behandeln, ist das oft das ausschlaggebende Argument.
            </li>
            <li>
              <strong>Transparente Preise statt &bdquo;auf Anfrage&ldquo;.</strong> candiq veröffentlicht Pakete ab
              65 €/Monat und Einzelchecks ab 49 €. Sie können kalkulieren, ohne erst ein Sales-Gespräch zu
              durchlaufen — monatlich kündbar, ohne Mindestvertrag.
            </li>
            <li>
              <strong>Einwilligung, die einem Audit standhält.</strong> Kandidaten erteilen ihre
              Einwilligung selbst im granularen Consent-Portal (Art. 6 &amp; 7 DSGVO), inklusive
              vollständigem Audit-Trail. Das ist verteidigbar gegenüber Datenschutzbehörden und Wirtschaftsprüfern.
            </li>
          </ul>

          <h2 className="text-2xl font-bold tracking-tight mb-4 text-text-primary">
            Wann Validato besser passt
          </h2>
          <p className="text-text-secondary leading-relaxed mb-4">
            Wir bleiben ehrlich: Validato hat Stärken, die candiq aktuell bewusst nicht abbildet. Wenn Sie
            ein <strong>breites Zusatz-Portfolio</strong> wie Bonitäts-, Strafregister- oder OSINT-Prüfungen
            aus einer Hand benötigen, oder eine bestehende <strong>ISO-27001-Zertifizierung</strong> zwingende
            Voraussetzung für Ihre Beschaffung ist, ist Validato die naheliegendere Wahl. candiq fokussiert
            sich bewusst auf die Referenz-, Zeugnis- und CV-Verifizierung und macht das in dieser Nische tief
            und schnell — eine ISO-27001-Zertifizierung ist bei uns in Vorbereitung.
          </p>
          <p className="text-text-secondary leading-relaxed">
            Unser Rat: Wenn Referenzprüfung Ihr eigentliches Problem ist und Datenstandort, Tempo und
            Preistransparenz zählen, testen Sie candiq in einem 15-Minuten-Termin. Brauchen Sie ein breites
            Screening-Portfolio mit Bonität und Strafregister, ist ein Generalist wie Validato passender.
          </p>
        </div>
      </section>

      {/* FAQ (sichtbar, deckungsgleich mit FAQPage-Schema) */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight mb-8 text-text-primary text-center">
            Häufige Fragen zum Vergleich
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
            Selbst vergleichen — in 15 Minuten
          </h2>
          <p className="text-text-secondary mb-7">
            Wir zeigen Ihnen den Report-Flow live an Ihrem konkreten Use Case und richten Ihren Testzugang ein.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={BOOKING_URL} className="btn-primary py-3 px-7 inline-flex items-center gap-2">
              <CalendarCheck className="w-4 h-4" />
              15-Min-Termin buchen
            </Link>
            <Link href="/referenzpruefung" className="btn-secondary py-3 px-7 inline-flex items-center gap-2">
              Was ist Referenzprüfung? <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

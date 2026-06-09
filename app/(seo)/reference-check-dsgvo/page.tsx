import type { Metadata } from 'next'
import { KeywordPage, type KeywordPageData } from '@/components/seo/KeywordPage'
import { pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title: 'Reference Check DSGVO-konform: Software aus Deutschland',
  absoluteTitle: 'Reference Check DSGVO-konform: Software aus Deutschland | candiq',
  description:
    'Reference Checks rechtssicher durchführen: Self-Service-Einwilligung, echte Telefonate, Report in unter 48 h. Server in Deutschland, ab 65 €/Monat.',
  path: '/reference-check-dsgvo',
})

const data: KeywordPageData = {
  breadcrumbName: 'Reference Check DSGVO',
  path: '/reference-check-dsgvo',
  hero: {
    eyebrow: 'Reference-Check-Software',
    h1: 'Reference Check — DSGVO-konform, mit echten Telefonaten statt E-Mail-Formularen',
    sub: 'Ein Reference Check ist nur so belastbar wie das Gespräch dahinter. candiq führt Reference Checks mit unserer KI-gestützten, trainierten Telefonassistentin am Telefon durch (jeden Report gibt ein geschulter Reviewer frei), holt die Einwilligung des Kandidaten sauber nach DSGVO ein und liefert Ihnen einen strukturierten Report — typischerweise in unter 48 Stunden, gehostet in Deutschland.',
  },
  sections: [
    {
      h2: 'Was ein Reference Check leistet',
      paragraphs: [
        'Er verifiziert, was sich im Lebenslauf nicht beweisen lässt: ob Positionen, Zeiträume und Verantwortungsbereiche stimmen und wie der Kandidat tatsächlich gearbeitet hat. Richtig gemacht, ist er das verlässlichste Signal im gesamten Auswahlprozess — und der günstigste Schutz vor einer Fehlbesetzung, die Sie sonst das Eineinhalbfache eines Jahresgehalts kostet.',
      ],
    },
    {
      h2: 'Warum DSGVO der Knackpunkt ist',
      paragraphs: [
        'Viele internationale Reference-Check-Tools sind für den deutschen Markt rechtlich heikel: Daten landen außerhalb Deutschlands, die Einwilligung ist dünn, ein Löschkonzept fehlt. candiq dreht das um: granulare Einwilligung nach Art. 6 Abs. 1 lit. a + Art. 7 DSGVO über ein Self-Service-Portal, Server in Deutschland, AVV nach Art. 28, automatische Löschung nach 180 Tagen und ein vollständiger Audit-Trail.',
      ],
    },
    {
      h2: 'So läuft es ab',
      paragraphs: [
        'Anfrage in 30 Sekunden anlegen, Kandidat benennt im Portal selbst seine Referenzgeber und willigt ein, unsere KI-gestützte, trainierte Telefonassistentin telefoniert mit standardisierten Fragen (jeden Report gibt ein geschulter Reviewer frei), Sie erhalten den PDF-Report mit Bewertung pro Station und Diskrepanz-Markierung. Express-Option in 24 Stunden verfügbar.',
      ],
    },
  ],
  faq: [
    { q: 'Ist ein Reference Check ohne Einwilligung erlaubt?', a: 'Nein — Grundlage ist die dokumentierte Einwilligung des Kandidaten nach Art. 6 Abs. 1 lit. a und Art. 7 DSGVO.' },
    { q: 'Telefonisch oder per E-Mail?', a: 'candiq telefoniert mit unserer KI-gestützten, trainierten Telefonassistentin (mit menschlicher Freigabe durch geschulte Reviewer) — kein anonymes E-Mail-Formular.' },
    { q: 'Wie schnell?', a: 'Typischerweise unter 48 Stunden, Express in 24 Stunden.' },
  ],
  related: [
    { href: '/referenzpruefung', label: 'Referenzprüfung — der komplette Leitfaden' },
    { href: '/lebenslauf-verifizieren', label: 'Lebenslauf verifizieren' },
    { href: '/preise', label: 'Preise & Pakete' },
    { href: '/vergleich/validato-alternative', label: 'candiq vs. Validato im Vergleich' },
  ],
  ctaHeadline: 'Reference Checks, die einem Audit standhalten',
}

export default function Page() {
  return <KeywordPage data={data} />
}

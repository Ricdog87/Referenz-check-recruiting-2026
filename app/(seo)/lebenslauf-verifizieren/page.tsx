import type { Metadata } from 'next'
import { KeywordPage, type KeywordPageData } from '@/components/seo/KeywordPage'
import { pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title: 'Lebenslauf verifizieren: KI-CVs erkennen',
  absoluteTitle: 'Lebenslauf verifizieren: KI-CVs erkennen | candiq',
  description:
    'Lebenslauf-Angaben verifizieren, bevor der KI-CV Sie eine Fehlbesetzung kostet. Stationen, Zeiträume und Tätigkeiten geprüft — Report in unter 48 h.',
  path: '/lebenslauf-verifizieren',
})

const data: KeywordPageData = {
  breadcrumbName: 'Lebenslauf verifizieren',
  path: '/lebenslauf-verifizieren',
  hero: {
    eyebrow: 'CV-Verifizierung',
    h1: 'Lebenslauf verifizieren — bevor der KI-CV Sie eine Fehlbesetzung kostet',
    sub: 'ChatGPT formuliert jede Station passgenau zur Stelle. Was im Lebenslauf steht, sagt deshalb immer weniger darüber aus, was der Kandidat wirklich kann. candiq verifiziert die harten Fakten — Stationen, Zeiträume, Tätigkeiten — über echte Gespräche mit den Menschen, die dabei waren.',
  },
  sections: [
    {
      h2: 'Was sich verifizieren lässt',
      paragraphs: [
        'Nicht jede Zeile im CV ist überprüfbar — aber die entscheidenden schon: War der Kandidat dort, wann er es angibt? Hatte er die genannte Verantwortung? Decken sich die beschriebenen Tätigkeiten mit der Einschätzung des früheren Vorgesetzten? Genau diese Punkte landen verifiziert in Ihrem Report, mit klarer Markierung jeder Abweichung.',
      ],
    },
    {
      h2: 'Warum das vor dem Erstgespräch passieren sollte',
      paragraphs: [
        'Jedes Interview mit einem Kandidaten, dessen CV nicht hält, ist verbrannte Zeit. Verifizierte Stationen vor dem Gespräch heißt: Sie laden nur die Kandidaten ein, bei denen sich der Slot lohnt — und treffen schnellere, sauberere Shortlist-Entscheidungen.',
      ],
    },
  ],
  faq: [
    { q: 'Was, wenn ein Referenzgeber nicht erreichbar ist?', a: 'Der Report weist „nicht erreichbar" transparent aus — keine geschönten Lücken.' },
    { q: 'Wie lange dauert die Verifizierung?', a: 'Typischerweise unter 48 Stunden ab Freigabe.' },
  ],
  related: [
    { href: '/referenzpruefung', label: 'Referenzprüfung — der komplette Leitfaden' },
    { href: '/reference-check-dsgvo', label: 'Reference-Check-Software aus Deutschland' },
    { href: '/preise', label: 'Preise & Pakete' },
  ],
  ctaHeadline: 'Verifizieren Sie den CV, nicht nur das Bauchgefühl',
}

export default function Page() {
  return <KeywordPage data={data} />
}

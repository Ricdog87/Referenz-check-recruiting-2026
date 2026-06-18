import type { Metadata } from 'next'
import { KeywordPage, type KeywordPageData } from '@/components/seo/KeywordPage'
import { pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title: 'Arbeitszeugnis prüfen lassen: echt oder geschönt?',
  absoluteTitle: 'Arbeitszeugnis prüfen lassen: echt oder geschönt? | candiq',
  description:
    'Arbeitszeugnisse auf Echtheit und Aussage prüfen lassen — per Rückfrage beim Aussteller, DSGVO-konform. Klarer Report statt Rätselraten.',
  path: '/zeugnis-prüfen-lassen',
})

const data: KeywordPageData = {
  breadcrumbName: 'Arbeitszeugnis prüfen',
  path: '/zeugnis-prüfen-lassen',
  hero: {
    eyebrow: 'Zeugnis-Verifizierung',
    h1: 'Arbeitszeugnis prüfen lassen — echt, geschönt oder erfunden?',
    sub: 'Ein „sehr gutes" Zeugnis ist schnell selbst geschrieben — und mit KI heute in Minuten. candiq prüft Arbeitszeugnisse dort, wo es zählt: durch Rückfrage beim ausstellenden Unternehmen, kombiniert mit der Referenzprüfung. So wissen Sie, ob das Papier zur Realität passt.',
  },
  sections: [
    {
      h2: 'Die Zeugnissprache lügt selten, Menschen schon',
      paragraphs: [
        'Deutsche Arbeitszeugnisse folgen einer Geheimsprache — „stets zu unserer vollsten Zufriedenheit" heißt etwas anderes als „zu unserer Zufriedenheit". Doch die eigentliche Lücke ist nicht die Formulierung, sondern die Echtheit: Stammt das Zeugnis wirklich vom genannten Arbeitgeber, und decken sich Position und Zeitraum mit der Auskunft des früheren Vorgesetzten?',
      ],
    },
    {
      h2: 'So prüft candiq',
      paragraphs: [
        'Im Rahmen der Referenzprüfung gleichen geschulte Reviewer die Angaben aus dem Zeugnis mit der telefonischen Auskunft des freigegebenen Referenzgebers ab — Position, Zeitraum, Tätigkeiten. Abweichungen werden im Report klar markiert. Alles DSGVO-konform mit Einwilligung des Kandidaten.',
      ],
    },
  ],
  faq: [
    { q: 'Dürfen Sie ein Zeugnis beim alten Arbeitgeber überprüfen?', a: 'Mit Einwilligung des Kandidaten und über die von ihm freigegebenen Referenzgeber: ja.' },
    { q: 'Erkennt candiq gefälschte Zeugnisse?', a: 'candiq verifiziert die Angaben über die telefonische Rückfrage beim Aussteller und markiert Diskrepanzen.' },
  ],
  related: [
    { href: '/referenzpruefung', label: 'Referenzprüfung — der komplette Leitfaden' },
    { href: '/lebenslauf-verifizieren', label: 'Lebenslauf verifizieren' },
    { href: '/preise', label: 'Preise & Pakete' },
  ],
  ctaHeadline: 'Zeugnisse prüfen, bevor sie Sie täuschen',
}

export default function Page() {
  return <KeywordPage data={data} />
}

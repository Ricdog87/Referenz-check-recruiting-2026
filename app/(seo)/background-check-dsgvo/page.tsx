import type { Metadata } from 'next'
import { KeywordPage, type KeywordPageData } from '@/components/seo/KeywordPage'
import { pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title: 'Background Check Deutschland: was DSGVO-konform erlaubt ist',
  absoluteTitle: 'Background Check Deutschland: was DSGVO-konform erlaubt ist | candiq',
  description:
    'Background Check in Deutschland rechtssicher: was erlaubt ist, was nicht, und wie candiq Kandidaten DSGVO-konform mit Einwilligung verifiziert.',
  path: '/background-check-dsgvo',
})

const data: KeywordPageData = {
  breadcrumbName: 'Background Check DSGVO',
  path: '/background-check-dsgvo',
  hero: {
    eyebrow: 'Background Check',
    h1: 'Background Check in Deutschland — was DSGVO-konform erlaubt ist (und was nicht)',
    sub: 'Aus den USA importierte „Background Checks" passen selten ins deutsche Recht. candiq zeigt, wo die Grenze verläuft — und liefert den Teil, der zulässig und im Recruiting entscheidend ist: die einwilligungsbasierte Verifizierung von Referenzen und Stationen.',
  },
  sections: [
    {
      h2: 'Die Grenze verläuft an der Einwilligung',
      paragraphs: [
        'Ohne informierte Einwilligung des Kandidaten und ohne klaren Stellenbezug ist ein umfassender Background Check in Deutschland kaum haltbar. Mit beidem wird die Prüfung beruflicher Referenzen zu einem sauberen, verteidigbaren Verfahren. candiq baut genau darauf auf.',
      ],
    },
    {
      h2: 'Was Sie bekommen',
      paragraphs: [
        'Granulare Einwilligung, Server in Deutschland, geschulte Reviewer am Telefon, strukturierter Report mit Diskrepanz-Markierung, Audit-Trail für Compliance und Wirtschaftsprüfer, Auto-Löschung nach 180 Tagen.',
      ],
    },
  ],
  faq: [
    { q: 'Ist ein Background Check in Deutschland überhaupt erlaubt?', a: 'In Teilen — mit Einwilligung und Stellenbezug. candiq bleibt im rechtssicheren Bereich der Referenz- und Stationsprüfung.' },
    { q: 'Werden Daten ins Ausland übertragen?', a: 'Nein, Hosting in Deutschland mit AVV nach Art. 28 DSGVO.' },
  ],
  related: [
    { href: '/referenzpruefung', label: 'Referenzprüfung — der komplette Leitfaden' },
    { href: '/pre-employment-screening', label: 'Pre-Employment Screening' },
    { href: '/preise', label: 'Preise & Pakete' },
  ],
  ctaHeadline: 'Ein Background Check, der einem Audit standhält',
}

export default function Page() {
  return <KeywordPage data={data} />
}

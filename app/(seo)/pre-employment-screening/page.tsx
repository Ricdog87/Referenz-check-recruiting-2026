import type { Metadata } from 'next'
import { KeywordPage, type KeywordPageData } from '@/components/seo/KeywordPage'
import { pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title: 'Pre-Employment Screening für den Mittelstand',
  absoluteTitle: 'Pre-Employment Screening für den Mittelstand | candiq',
  description:
    'Pre-Employment Screening DSGVO-konform: was in Deutschland erlaubt ist, worauf es ankommt und wie candiq Referenzen und Stationen verifiziert.',
  path: '/pre-employment-screening',
})

const data: KeywordPageData = {
  breadcrumbName: 'Pre-Employment Screening',
  path: '/pre-employment-screening',
  hero: {
    eyebrow: 'Pre-Employment Screening',
    h1: 'Pre-Employment Screening für den deutschen Mittelstand',
    sub: '„Pre-Employment Screening" klingt nach Komplett-Durchleuchtung — in Deutschland ist aber vieles davon gar nicht zulässig. candiq konzentriert sich auf den Teil, der rechtssicher und im Recruiting am wirksamsten ist: die Verifizierung von Referenzen, Stationen und Zeugnissen.',
  },
  sections: [
    {
      h2: 'Was in Deutschland erlaubt ist (und was nicht)',
      paragraphs: [
        'Zulässig ist, was zur Stelle in einem angemessenen Verhältnis steht und worin der Kandidat eingewilligt hat — etwa die Prüfung beruflicher Stationen über benannte Referenzgeber. Heikel bis unzulässig sind verdeckte Recherchen, umfassendes Social-Media-Profiling ohne Einwilligung oder Bonitäts- und Strafregisterabfragen ohne klaren Stellenbezug. candiq bleibt bewusst im rechtssicheren Kern.',
      ],
    },
    {
      h2: 'candiqs Ansatz',
      paragraphs: [
        'Einwilligung zuerst, Server in Deutschland, echte Telefonate, strukturierter Report, automatische Löschung nach 180 Tagen. Kein Graubereich, sondern ein verteidigbarer Prozess — auch gegenüber Betriebsrat und Compliance.',
      ],
    },
  ],
  faq: [
    { q: 'Macht candiq auch Bonitäts- oder Strafregisterchecks?', a: 'Nein — candiq fokussiert auf Referenz-, Stations- und Zeugnisverifizierung im rechtssicheren Rahmen.' },
    { q: 'Brauche ich den Betriebsrat?', a: 'Bei systematischer Bewerberprüfung empfiehlt sich frühe Einbindung; candiqs Audit-Trail und Einwilligungs-Workflow erleichtern das.' },
  ],
  related: [
    { href: '/referenzpruefung', label: 'Referenzprüfung — der komplette Leitfaden' },
    { href: '/background-check-dsgvo', label: 'Background Check DSGVO-konform' },
    { href: '/preise', label: 'Preise & Pakete' },
  ],
  ctaHeadline: 'Screening, das rechtssicher bleibt',
}

export default function Page() {
  return <KeywordPage data={data} />
}

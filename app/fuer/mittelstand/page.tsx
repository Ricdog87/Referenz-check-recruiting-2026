import type { Metadata } from 'next'
import { KeywordPage, type KeywordPageData } from '@/components/seo/KeywordPage'
import { pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title: 'Referenzprüfung für den Mittelstand',
  absoluteTitle: 'Referenzprüfung für den Mittelstand | candiq',
  description:
    'Mittelstand 200+ MA: candiq verifiziert Referenzen, Zeugnisse und CVs DSGVO-konform — Server in Deutschland, Audit-Trail für Wirtschaftsprüfer, kein Lock-in. Ab 65 €/Monat.',
  path: '/fuer/mittelstand',
})

const data: KeywordPageData = {
  breadcrumbName: 'Für Mittelstand',
  path: '/fuer/mittelstand',
  hero: {
    eyebrow: 'Für Mittelstand 200+ MA',
    h1: 'Referenzprüfung für den deutschen Mittelstand',
    sub: 'Eine Fehlbesetzung auf Senior-Level kostet im Mittelstand schnell das Eineinhalbfache eines Jahresgehalts — und in einem kleinen Team merken Sie es sofort. candiq verifiziert Schlüssel-Hires DSGVO-konform, ohne dass Sie ein internes Compliance-Team brauchen.',
  },
  sections: [
    {
      h2: 'Warum die Referenzprüfung im Mittelstand mehr zählt als anderswo',
      paragraphs: [
        'Im Mittelstand schlägt jede Personalentscheidung direkt auf den Erfolg durch. Wenn der neue Vertriebsleiter nicht liefert, sehen Sie es nach drei Monaten in den Zahlen, nicht erst nach einem Jahr im Konzern-Reporting. Gleichzeitig haben Sie selten ein eigenes Compliance- oder Datenschutz-Team, das einen aufwendigen Prüfprozess auflegen könnte. Sie brauchen einen Anbieter, der beides löst: belastbare Verifizierung und einen rechtssicheren Rahmen, der ohne juristische Vorarbeit funktioniert.',
      ],
    },
    {
      h2: 'Was candiq für Mittelständler löst',
      paragraphs: ['Konkret bekommen Sie:'],
      bullets: [
        '<strong>Rechtssicherheit out-of-the-box:</strong> Self-Service-Einwilligung nach Art. 6 &amp; 7 DSGVO, AVV nach Art. 28 standardmäßig im Onboarding, Server in Deutschland, automatische Löschung nach 180 Tagen.',
        '<strong>Verteidigbar gegenüber Wirtschaftsprüfern:</strong> Lückenloser Audit-Trail (DSGVO Art. 30) mit Einwilligungs-Zeitstempeln und Datenzugriffs-Protokollen. Auch bei einer Aufsichts-Anfrage liefern Sie sauber.',
        '<strong>Kein Lock-in, keine Mindestlaufzeit:</strong> Pakete monatlich kündbar ab 65 €/Monat. Sie testen mit den Schlüssel-Rollen und skalieren nach Bedarf.',
        '<strong>Geschulte Reviewer telefonieren für Sie:</strong> Standardisierte Fragebögen, dokumentierte Gespräche, Diskrepanz-Markierung — nicht Sie selbst, nicht der Hiring-Manager, sondern Menschen, die das jeden Tag machen.',
        '<strong>Express-Option in 24 h:</strong> Wenn ein Senior-Hire wartet und Sie nicht eine Woche verlieren wollen.',
      ],
    },
    {
      h2: 'Wann sich die Investition rechnet',
      paragraphs: [
        'Branchenstudien (SHRM, Bain) beziffern die Vollkosten einer Fehlbesetzung auf ungefähr das 1,5-fache des Jahresgehalts — durch Einarbeitung, entgangene Produktivität, Neuausschreibung und Team-Schaden. Für eine 70.000-Euro-Stelle reden wir über 105.000 Euro Schadenspotenzial.',
        'Eine vollständige Referenzprüfung kostet bei candiq ab 49 Euro. Selbst wenn die Prüfung in 99 von 100 Fällen „nichts findet", hat sie sich beim hundertsten Mal bereits über tausendfach amortisiert. Im Mittelstand reichen oft schon ein verhinderter Fehl-Hire pro Jahr für ROI.',
      ],
    },
  ],
  faq: [
    { q: 'Lohnt sich candiq schon bei wenigen Hires pro Jahr?', a: 'Ja. Der Starter-Tarif ab 65 €/Monat ist für genau diese Größenordnung gebaut — auch der Einzel-Check ab 49 € ohne Abo ist möglich. Sie zahlen nicht für ein Volumen, das Sie nicht nutzen.' },
    { q: 'Brauchen wir IT-Aufwand für die Einführung?', a: 'Nein. candiq ist ein SaaS — keine Installation, keine Server. Falls Sie ein ATS wie Personio nutzen, gibt es eine Integration; ohne ATS arbeiten Sie direkt im candiq-Dashboard.' },
    { q: 'Was ist mit dem Betriebsrat?', a: 'Bei systematischer Bewerberprüfung sollte der Betriebsrat eingebunden sein. candiqs dokumentierter Einwilligungs-Workflow und der Audit-Trail erleichtern die Vereinbarung erfahrungsgemäß deutlich, da das Verfahren transparent ist.' },
    { q: 'Wer telefoniert eigentlich mit den Referenzgebern?', a: 'Geschulte Reviewer in Deutschland, die das jeden Tag machen — nicht Sie selbst, nicht der Hiring-Manager. Sie sehen die dokumentierten Notizen im Report, ohne ein einziges Telefonat selbst führen zu müssen.' },
    { q: 'Wie verteidigen wir das gegenüber unserem Datenschutzbeauftragten?', a: 'Mit drei Bausteinen: Self-Service-Einwilligung (granular, dokumentiert, widerrufbar), AVV nach Art. 28 DSGVO (Standard im Onboarding) und vollständiger Audit-Trail. Wir liefern auf Wunsch die Datenschutz-Folgenabschätzungs-Hilfe für Ihren DSB.' },
  ],
  related: [
    { href: '/referenzpruefung', label: 'Referenzprüfung — der komplette Leitfaden' },
    { href: '/pre-employment-screening', label: 'Pre-Employment Screening' },
    { href: '/fuer/hr-abteilungen', label: 'Für HR-Abteilungen' },
    { href: '/preise', label: 'Preise & Pakete' },
  ],
  ctaHeadline: 'Ein Fehl-Hire weniger pro Jahr — und candiq hat sich amortisiert',
}

export default function Page() {
  return <KeywordPage data={data} />
}

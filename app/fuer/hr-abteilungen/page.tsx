import type { Metadata } from 'next'
import { KeywordPage, type KeywordPageData } from '@/components/seo/KeywordPage'
import { pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title: 'Referenzprüfung für HR-Abteilungen',
  absoluteTitle: 'Referenzprüfung für HR-Abteilungen | candiq',
  description:
    'Inhouse-HR ohne Zeit für Telefonate? candiq übernimmt die DSGVO-konforme Referenzprüfung — Personio-Integration, Audit-Trail, Report in unter 48 h. Ab 65 €/Monat, monatlich kündbar.',
  path: '/fuer/hr-abteilungen',
})

const data: KeywordPageData = {
  breadcrumbName: 'Für HR-Abteilungen',
  path: '/fuer/hr-abteilungen',
  hero: {
    eyebrow: 'Für HR-Abteilungen',
    h1: 'Referenzprüfung für HR-Teams — ohne dass jemand bei Ihnen telefonieren muss',
    sub: 'Inhouse-Recruiting ist heute unter Druck: mehr Bewerbungen pro Stelle, KI-optimierte Lebensläufe, kleinere Teams. candiq übernimmt die Referenzprüfung als Service — DSGVO-konform, verteidigbar gegenüber Compliance, mit Report in unter 48 Stunden.',
  },
  sections: [
    {
      h2: 'Drei Probleme, die jede HR-Abteilung 2026 kennt',
      paragraphs: ['Wenn Sie in einer HR-Abteilung arbeiten, kennen Sie diese drei Punkte vermutlich aus der eigenen Pipeline:'],
      bullets: [
        '<strong>Volumen statt Signal:</strong> Pro offener Stelle landen 80–200 Bewerbungen, viele mit ChatGPT-optimiertem Lebenslauf. Die Hälfte Ihrer Zeit verbringen Sie in Erstgesprächen mit Kandidaten, deren CV nicht hält.',
        '<strong>Niemand telefoniert mehr gern:</strong> Eine ordentliche Referenzabfrage dauert 30–45 Minuten pro Referenzgeber — bei zwei Stationen pro Kandidat schnell ein halber Tag. Diese Zeit haben kleine HR-Teams nicht.',
        '<strong>Compliance schaut zu:</strong> Bei jedem heiklen Hire fragt am Ende jemand: „Wer hat die Referenzen geprüft, wann, mit welcher Einwilligung?" — und Sie brauchen eine saubere Antwort.',
      ],
    },
    {
      h2: 'Was candiq für HR-Abteilungen konkret liefert',
      paragraphs: [
        'candiq ist als Software-plus-Service für HR-Inhouse-Teams gebaut. Sie behalten die Hoheit über die Entscheidung — die operative Verifizierung übernehmen wir:',
      ],
      bullets: [
        '<strong>Self-Service-Einwilligung der Kandidaten:</strong> Kandidat nennt seine Referenzgeber selbst im Portal, willigt granular nach Art. 6 &amp; 7 DSGVO ein. Sie kontaktieren nie jemanden, der nicht freigegeben wurde.',
        '<strong>Geschulte Reviewer telefonieren für Sie:</strong> Standardisierte Fragebögen, dokumentierte Antworten, Diskrepanz-Markierung. Keine E-Mail-Fragebögen, die im Spam landen.',
        '<strong>Strukturierter PDF-Report</strong> pro Kandidat — direkt teilbar mit Hiring-Manager und Geschäftsführung. Audit-Trail-Export nach DSGVO Art. 30 für interne Revision.',
        '<strong>ATS-Integration:</strong> Personio, SAP SuccessFactors, Workday — Kandidaten und Auftragsstatus fließen in Ihren bestehenden Recruiting-Workflow.',
        '<strong>Auto-Löschung nach 180 Tagen</strong> per Cron-Job — Datensparsamkeit by Design, nicht nach 18-Monate-Nachfrage.',
      ],
    },
    {
      h2: 'Verteidigbar gegenüber Compliance und Betriebsrat',
      paragraphs: [
        'Bei systematischer Bewerberprüfung schaut spätestens die zweite Instanz auf den Prozess: Datenschutzbeauftragte/r, Betriebsrat, externe Wirtschaftsprüfer. candiq ist darauf ausgelegt. Jede Einwilligung wird mit Zeitstempel protokolliert, jeder Datenzugriff im Audit-Log festgehalten, Server stehen in Deutschland, ein AVV nach Art. 28 DSGVO ist Standard im Onboarding.',
        'Wenn die Frage kommt: „Wer hat wann mit wem worüber gesprochen, mit welcher Rechtsgrundlage?" — Sie haben die Antwort in einer Excel-Zeile.',
      ],
    },
  ],
  faq: [
    { q: 'Müssen wir das selbst aufsetzen oder ist es ein Service?', a: 'Beides. candiq ist eine Plattform, die Sie selbst bedienen — Sie legen Kandidaten an, schauen den Status live mit. Die eigentlichen Telefonate übernehmen unsere geschulten Reviewer.' },
    { q: 'Wie schnell sehen wir den ersten Report?', a: 'Typischerweise unter 48 Stunden ab Freigabe der Referenzgeber durch den Kandidaten. Express-Option in unter 24 Stunden für Senior-Hires.' },
    { q: 'Funktioniert das mit unserem Personio / SAP SuccessFactors?', a: 'Ja. candiq bietet ATS-Integrationen für Personio, SAP SuccessFactors und Workday. Kandidaten und Auftragsstatus fließen in Ihren bestehenden Workflow.' },
    { q: 'Was kostet das pro Hire?', a: 'Pakete starten ab 65 €/Monat (Starter). Bei höherem Volumen sinkt der Preis pro Check über das 5er- oder 10er-Pack auf bis zu 34,90 €. Monatlich kündbar, kein Mindestvertrag.' },
    { q: 'Brauche ich vorher eine Betriebsrat-Vereinbarung?', a: 'Bei systematischer Bewerberprüfung empfiehlt sich die frühzeitige Einbindung. Unser dokumentierter Einwilligungs-Workflow und der Audit-Trail erleichtern die Argumentation deutlich.' },
  ],
  related: [
    { href: '/referenzpruefung', label: 'Referenzprüfung — der komplette Leitfaden' },
    { href: '/reference-check-dsgvo', label: 'Reference-Check-Software aus Deutschland' },
    { href: '/fuer/mittelstand', label: 'Für den Mittelstand 200+ MA' },
    { href: '/preise', label: 'Preise & Pakete' },
  ],
  ctaHeadline: 'Geben Sie die Telefonate ab, behalten Sie die Entscheidung',
}

export default function Page() {
  return <KeywordPage data={data} />
}

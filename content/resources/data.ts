import type { Metadata } from 'next'
import type { LucideIcon } from 'lucide-react'
import { BookOpen, ShieldCheck } from 'lucide-react'

export type LeadMagnet = {
  slug: string
  title: string
  subtitle: string
  icon: LucideIcon
  pageCount: number
  readMinutes: number
  category: string
  metadata: Metadata
  // Inhalt liegt in content/resources/{slug}.md
  markdownPath: string
}

export const LEAD_MAGNETS: LeadMagnet[] = [
  {
    slug: 'interview-leitfaden',
    title: 'Strukturierter Interview-Leitfaden für HR-Teams',
    subtitle:
      'AGG-konforme Fragen-Library für 8 typische Rollen + Scorecard-Template + Top-10-Don\'ts',
    icon: BookOpen,
    pageCount: 18,
    readMinutes: 12,
    category: 'Hiring-Practice',
    markdownPath: 'interview-leitfaden.md',
    metadata: {
      title: 'Strukturierter Interview-Leitfaden für HR-Teams | candiq',
      description:
        'Kostenloser PDF-Leitfaden: AGG-konforme Interview-Fragen für 8 Rollen (Tech, Sales, HR, Operations, Marketing, Customer Success, Werkstudent, SDR), Scorecard-Template und die 10 häufigsten Anti-Pattern.',
    },
  },
  {
    slug: 'dsgvo-checkliste-recruiting',
    title: 'DSGVO-Checkliste Recruiting',
    subtitle:
      'Rechtsgrundlagen, Einwilligungs-Pattern, Aufbewahrungsfristen, AVV-Pflichten und DSFA-Trigger',
    icon: ShieldCheck,
    pageCount: 14,
    readMinutes: 10,
    category: 'Compliance',
    markdownPath: 'dsgvo-checkliste-recruiting.md',
    metadata: {
      title: 'DSGVO-Checkliste Recruiting | candiq',
      description:
        'Kostenlose PDF-Checkliste: Rechtsgrundlagen pro Verarbeitungsschritt, granulare Einwilligungs-Pattern, AVV-Pflichten, DSFA-Trigger und Aufbewahrungsfristen für DACH-HR-Teams.',
    },
  },
]

export function getLeadMagnet(slug: string): LeadMagnet | null {
  return LEAD_MAGNETS.find((m) => m.slug === slug) ?? null
}

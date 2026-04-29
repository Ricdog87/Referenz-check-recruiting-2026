import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const CANDIDATE_STATUS = {
  PENDING: { label: 'Ausstehend', color: 'bg-slate-100 text-slate-700 border border-slate-200' },
  IN_REVIEW: { label: 'In Prüfung', color: 'bg-brand-50 text-brand-700 border border-brand-200' },
  COMPLETED: { label: 'Abgeschlossen', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  REJECTED: { label: 'Abgelehnt', color: 'bg-rose-50 text-rose-700 border border-rose-200' },
} as const

export const CHECK_STATUS = {
  OPEN: { label: 'Offen', color: 'bg-slate-100 text-slate-700 border border-slate-200' },
  IN_PROGRESS: { label: 'In Bearbeitung', color: 'bg-amber-50 text-amber-700 border border-amber-200' },
  COMPLETED: { label: 'Abgeschlossen', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  FAILED: { label: 'Fehlgeschlagen', color: 'bg-rose-50 text-rose-700 border border-rose-200' },
} as const

export const CHECK_RESULT = {
  VERIFIED: { label: 'Verifiziert', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  DISCREPANCY_FOUND: { label: 'Unstimmigkeit', color: 'bg-rose-50 text-rose-700 border border-rose-200' },
  UNREACHABLE: { label: 'Nicht erreichbar', color: 'bg-amber-50 text-amber-700 border border-amber-200' },
  DECLINED: { label: 'Auskunft verweigert', color: 'bg-slate-100 text-slate-700 border border-slate-200' },
} as const

export type CandidateStatus = keyof typeof CANDIDATE_STATUS
export type CheckStatus = keyof typeof CHECK_STATUS
export type CheckResult = keyof typeof CHECK_RESULT

// ─────────────────────────────────────────────────────────────────
// Account Types & Pricing
// ─────────────────────────────────────────────────────────────────

export const ACCOUNT_TYPES = {
  HR_DEPARTMENT: {
    label: 'HR-Abteilung',
    short: 'HR / Inhouse',
    description: 'Interne HR-Abteilung im Unternehmen',
  },
  RECRUITMENT_AGENCY: {
    label: 'Personaldienstleister',
    short: 'PSA / Recruiter',
    description: 'Personalvermittlung, Headhunter, Recruiting-Agentur',
  },
} as const

export type AccountType = keyof typeof ACCOUNT_TYPES

export type Plan = {
  id: string
  name: string
  tagline: string
  priceMonthly: number
  priceAnnual: number
  currency: '€'
  pricePerCheck: number | null
  includedChecks: number
  seats: number | string
  highlight?: boolean
  badge?: string
  features: string[]
  ctaLabel: string
  forType: AccountType
}

// HR / Inhouse — Pakete (B2B Inhouse Recruiting)
// Annahmen: ø Verifizierung kostet uns 14 € (Personal+Tools), wir zielen 65–75% Marge
//   Per-Check Listenpreis ~49 € für Pay-as-you-go.
//   Bundles werden günstiger, Enterprise mit individueller Volumenstaffel.
export const HR_PLANS: Plan[] = [
  {
    id: 'STARTER',
    name: 'Starter',
    tagline: 'Für kleine Teams & Einzelplätze',
    priceMonthly: 79,
    priceAnnual: 65,
    currency: '€',
    pricePerCheck: 39,
    includedChecks: 3,
    seats: 1,
    features: [
      '3 inkludierte Referenzprüfungen / Monat',
      'CV- & Zeugnis-Upload (verschlüsselt)',
      'DSGVO-konformes Einwilligungsmanagement',
      'Standard-Reports per PDF',
      'E-Mail-Support (≤ 24h)',
    ],
    ctaLabel: 'Starter wählen',
    forType: 'HR_DEPARTMENT',
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    tagline: 'Wachsende HR-Teams',
    priceMonthly: 249,
    priceAnnual: 199,
    currency: '€',
    pricePerCheck: 29,
    includedChecks: 12,
    seats: 5,
    highlight: true,
    badge: 'Beliebt',
    features: [
      '12 inkludierte Referenzprüfungen / Monat',
      'Bis zu 5 Nutzer-Sitze',
      'Erweiterte Check-Profile (3+ Referenzen pro Kandidat)',
      'White-Label PDF-Reports',
      'Slack/Teams-Notifications',
      'Priority Support (≤ 8h)',
    ],
    ctaLabel: 'Professional wählen',
    forType: 'HR_DEPARTMENT',
  },
  {
    id: 'BUSINESS',
    name: 'Business',
    tagline: 'Für mittelgroße Unternehmen',
    priceMonthly: 599,
    priceAnnual: 499,
    currency: '€',
    pricePerCheck: 22,
    includedChecks: 35,
    seats: 15,
    features: [
      '35 inkludierte Referenzprüfungen / Monat',
      'Bis zu 15 Nutzer-Sitze',
      'Multi-Standort & Abteilungs-Hierarchie',
      'ATS-Integration (Personio, SAP SF, Workday)',
      'Audit-Trail-Export (DSGVO Art. 30)',
      'Dedicated Customer Success Manager',
    ],
    ctaLabel: 'Business wählen',
    forType: 'HR_DEPARTMENT',
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    tagline: 'Konzerne & regulierte Branchen',
    priceMonthly: 0,
    priceAnnual: 0,
    currency: '€',
    pricePerCheck: null,
    includedChecks: 0,
    seats: 'Unbegrenzt',
    features: [
      'Volumen-individualisierte Preise (ab 14 €/Check)',
      'Unbegrenzte Sitze & Workspaces',
      'SSO (SAML, Azure AD, Okta)',
      'Dediziertes Onboarding & SLA 99,9 %',
      'On-Premise oder Private Cloud Deployment',
      'Compliance-Beratung (DSGVO, BaFin, ISO 27001)',
    ],
    ctaLabel: 'Vertrieb kontaktieren',
    forType: 'HR_DEPARTMENT',
  },
]

// Personaldienstleister / Recruiter — höhere Volumen, niedrigere Per-Check-Preise
// Volumen-orientiert: kleinere Marge pro Check, dafür Skalierung & White-Label
export const AGENCY_PLANS: Plan[] = [
  {
    id: 'AGENCY_BASIC',
    name: 'Agency Basic',
    tagline: 'Boutique-Agentur, 1–3 Recruiter',
    priceMonthly: 199,
    priceAnnual: 159,
    currency: '€',
    pricePerCheck: 24,
    includedChecks: 10,
    seats: 3,
    features: [
      '10 inkludierte Prüfungen / Monat',
      'Bis zu 3 Recruiter-Sitze',
      'Mandanten-Verwaltung (5 Endkunden)',
      'White-Label-Reports mit eigenem Logo',
      'Kandidaten-Datenbank (CRM Light)',
    ],
    ctaLabel: 'Agency Basic wählen',
    forType: 'RECRUITMENT_AGENCY',
  },
  {
    id: 'AGENCY_PRO',
    name: 'Agency Pro',
    tagline: 'Etablierte Personaldienstleister',
    priceMonthly: 549,
    priceAnnual: 449,
    currency: '€',
    pricePerCheck: 18,
    includedChecks: 35,
    seats: 10,
    highlight: true,
    badge: 'Beliebt',
    features: [
      '35 inkludierte Prüfungen / Monat',
      'Bis zu 10 Recruiter-Sitze',
      'Unbegrenzte Mandanten / Endkunden',
      'White-Label inkl. eigene Domain (cname)',
      'Mandanten-spezifische Workflows & SLAs',
      'API-Zugriff für ATS-Integration',
      'Provisionierte Reports per Knopfdruck',
    ],
    ctaLabel: 'Agency Pro wählen',
    forType: 'RECRUITMENT_AGENCY',
  },
  {
    id: 'AGENCY_SCALE',
    name: 'Agency Scale',
    tagline: 'Großhandel & Volumen-Recruiting',
    priceMonthly: 1299,
    priceAnnual: 1099,
    currency: '€',
    pricePerCheck: 12,
    includedChecks: 120,
    seats: 30,
    features: [
      '120 inkludierte Prüfungen / Monat',
      'Bis zu 30 Recruiter-Sitze',
      'Bulk-Upload (CSV/Excel) bis 500 Kandidaten',
      'Eigene Sub-Brands je Mandant',
      'Webhook + REST-API ohne Limits',
      'Dedizierter Account Manager',
      'Reseller-Programm (Margin-Sharing)',
    ],
    ctaLabel: 'Agency Scale wählen',
    forType: 'RECRUITMENT_AGENCY',
  },
]

export const ALL_PLANS = [...HR_PLANS, ...AGENCY_PLANS]

export function getPlanById(id: string) {
  return ALL_PLANS.find((p) => p.id === id) ?? HR_PLANS[0]
}

// Demo seed credentials — kept in sync with /api/demo route profiles.
export const DEMO_CREDENTIALS = {
  hr: {
    email: 'demo@candiq.de',
    password: 'demo1234',
    label: 'HR Inhouse',
    description: 'Mittelständische HR-Abteilung · Professional-Plan',
  },
  enterprise: {
    email: 'enterprise@candiq.de',
    password: 'demo1234',
    label: 'Enterprise',
    description: 'Konzern-HR · Business-Plan · Multi-Department',
  },
  boutique: {
    email: 'boutique@candiq.de',
    password: 'demo1234',
    label: 'Startup',
    description: 'Boutique-Recruiting · Starter-Plan',
  },
} as const

// Helpers for greeting & company branding
export function getGreeting(now = new Date()) {
  const h = now.getHours()
  if (h < 5) return 'Guten Morgen'
  if (h < 11) return 'Guten Morgen'
  if (h < 14) return 'Guten Mittag'
  if (h < 18) return 'Guten Tag'
  if (h < 22) return 'Guten Abend'
  return 'Gute Nacht'
}

export function initialsOf(value: string) {
  if (!value) return '?'
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

export function trialDaysLeft(trialEndsAt: Date | string | null | undefined) {
  if (!trialEndsAt) return null
  const end = new Date(trialEndsAt).getTime()
  const now = Date.now()
  if (end <= now) return 0
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24))
}

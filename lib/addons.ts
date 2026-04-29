import type { LucideIcon } from 'lucide-react'
import { Phone, Layers, Mic, Zap, Upload } from 'lucide-react'

export type AddonSku =
  | 'SINGLE_CHECK'
  | 'CHECK_PACK_5'
  | 'CHECK_PACK_10'
  | 'INTERVIEW'
  | 'EXPRESS_24H'
  | 'BULK_CV'

export type Addon = {
  sku: AddonSku
  name: string
  tagline: string
  description: string
  price: number
  unit: string
  badge?: string
  fromPrice?: number
  highlight?: boolean
  category: 'CHECK' | 'INTERVIEW' | 'SPEED' | 'BULK'
  icon: LucideIcon
  color: 'brand' | 'violet' | 'amber' | 'emerald' | 'cyan' | 'rose'
  features: string[]
  cta: string
  quantity: number
}

export const ADDONS: Addon[] = [
  {
    sku: 'SINGLE_CHECK',
    name: 'Einzel-Referenzcheck',
    tagline: 'Eine zusätzliche Verifizierung',
    description:
      'Eine zusätzliche, vollständige telefonische Referenzprüfung außerhalb Ihres Pakets — mit Audit-Report und Gesprächsprotokoll.',
    price: 49,
    unit: 'Check',
    category: 'CHECK',
    icon: Phone,
    color: 'brand',
    features: [
      'Vollständige Telefon-Verifizierung',
      'Strukturierter PDF-Audit-Report',
      'Gesprächsnotizen & Diskrepanz-Markierung',
      'Standard-Durchlaufzeit < 48 h',
    ],
    cta: 'Einzel buchen',
    quantity: 1,
  },
  {
    sku: 'CHECK_PACK_5',
    name: '5er-Pack Referenzchecks',
    tagline: 'Spar-Bundle für mehr Volumen',
    description:
      'Fünf zusätzliche Reference-Checks zum Vorzugspreis — perfekt für High-Volume-Wochen oder Senior-Hires mit mehreren Stationen.',
    price: 199,
    fromPrice: 245,
    unit: 'Pack',
    badge: '−19 %',
    highlight: true,
    category: 'CHECK',
    icon: Layers,
    color: 'violet',
    features: [
      '5 vollständige Reference-Checks',
      '12 Monate gültig (kein Verfall im Monatszyklus)',
      '€ 39,80 pro Check (statt € 49)',
      'Inkl. White-Label-Reports',
    ],
    cta: '5er-Pack buchen',
    quantity: 5,
  },
  {
    sku: 'CHECK_PACK_10',
    name: '10er-Pack Referenzchecks',
    tagline: 'Bestes Preis-Leistungs-Verhältnis',
    description:
      'Zehn zusätzliche Reference-Checks für Recruiting-Teams mit kontinuierlich hohem Bedarf.',
    price: 349,
    fromPrice: 490,
    unit: 'Pack',
    badge: '−29 %',
    category: 'CHECK',
    icon: Layers,
    color: 'cyan',
    features: [
      '10 vollständige Reference-Checks',
      '12 Monate gültig',
      '€ 34,90 pro Check (statt € 49)',
      'Priority-Bearbeitung',
    ],
    cta: '10er-Pack buchen',
    quantity: 10,
  },
  {
    sku: 'INTERVIEW',
    name: 'candiq Interview',
    tagline: 'Strukturiertes Kompetenz-Interview',
    description:
      'Wir führen ein strukturiertes 60-min-Kompetenz- & Cultural-Fit-Interview mit Ihrem Kandidaten — Scorecard, Audio-Aufzeichnung (Einwilligung) und Empfehlung inklusive.',
    price: 199,
    unit: 'Kandidat',
    badge: 'Neu',
    category: 'INTERVIEW',
    icon: Mic,
    color: 'amber',
    features: [
      '60 min strukturiertes Interview',
      'Kompetenz-basierte Scorecard',
      'Cultural-Fit-Bewertung',
      'Empfehlung: Hire / Hold / Reject',
      'Optionale Aufzeichnung (DSGVO-konform)',
    ],
    cta: 'Interview buchen',
    quantity: 1,
  },
  {
    sku: 'EXPRESS_24H',
    name: 'Express 24h',
    tagline: 'Reference-Check in unter 24 Stunden',
    description:
      'Beschleunigte Bearbeitung Ihres nächsten Checks — Resultat garantiert in unter 24 Stunden, inkl. Wochenend-SLA.',
    price: 29,
    unit: 'Aufpreis',
    category: 'SPEED',
    icon: Zap,
    color: 'rose',
    features: [
      'Garantierte Bearbeitung in < 24 h',
      'Inkl. Wochenend- und Feiertags-Slot',
      '€ 29 Aufpreis pro Check',
      'Eskalation an Senior-Verifizierer',
    ],
    cta: 'Express aktivieren',
    quantity: 1,
  },
  {
    sku: 'BULK_CV',
    name: 'Bulk CV-Verification',
    tagline: 'Bis zu 25 Lebensläufe parallel',
    description:
      'Wir prüfen Ausbildungs- und Tätigkeitsangaben aus 25 Lebensläufen parallel — perfekt für Massenrekrutierungen oder Boarding-Prozesse.',
    price: 599,
    unit: '25 CVs',
    category: 'BULK',
    icon: Upload,
    color: 'emerald',
    features: [
      '25 CV-Verifizierungen parallel',
      'Plausibilitäts-Check via Datenbanken',
      'Sammel-Report als Excel & PDF',
      'Durchlaufzeit ø 5 Werktage',
    ],
    cta: 'Bulk-Paket buchen',
    quantity: 25,
  },
]

export function getAddon(sku: string) {
  return ADDONS.find((a) => a.sku === sku)
}

export const ADDON_CATEGORIES = {
  CHECK: { label: 'Reference-Checks', desc: 'Zusätzliche Verifizierungen' },
  INTERVIEW: { label: 'Interview', desc: 'Strukturierte Kompetenz-Interviews' },
  SPEED: { label: 'Express & SLA', desc: 'Schnellere Durchlaufzeit' },
  BULK: { label: 'Bulk', desc: 'Volumen-Pakete' },
} as const

export function formatEuro(value: number) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

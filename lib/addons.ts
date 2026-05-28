import type { LucideIcon } from 'lucide-react'
import { Phone, Layers, Mic, Zap, Upload, FileCheck, ScanSearch, PhoneCall } from 'lucide-react'

export type AddonSku =
  | 'SINGLE_CHECK'
  | 'CHECK_PACK_5'
  | 'CHECK_PACK_10'
  | 'INTERVIEW'
  | 'EXPRESS_24H'
  | 'BULK_CV'
  | 'PRE_SCREENING_CALL'
  | 'DOCUMENT_VERIFICATION'
  | 'CV_SCREENING'

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
  category: 'CHECK' | 'INTERVIEW' | 'SPEED' | 'BULK' | 'PRE_SCREENING' | 'DOCUMENT' | 'SCREENING'
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
    name: 'candiq Deep-Check',
    tagline: 'Strukturiertes Kompetenz-Interview mit Senior-Recruiter',
    description:
      'Unser Senior-Recruiter führt ein 60-min strukturiertes Kompetenz- & Cultural-Fit-Interview mit Ihrem Kandidaten — AGG-konformer Leitfaden, Kompetenz-Scorecard, optionale Audio-Aufzeichnung (Einwilligung) und klare Hire/Hold/Reject-Empfehlung.',
    price: 249,
    unit: 'Kandidat',
    badge: 'Premium',
    highlight: true,
    category: 'INTERVIEW',
    icon: Mic,
    color: 'amber',
    features: [
      '60-min strukturiertes Interview mit Senior-Recruiter',
      'AGG-konformer Leitfaden, vertikal-spezifisch',
      'Kompetenz-basierte Scorecard (5 Dimensionen)',
      'Cultural-Fit-Bewertung & Hire/Hold/Reject-Empfehlung',
      'Optionale Audio-Aufzeichnung (DSGVO-Einwilligung)',
      '5-Werktage-SLA · Express-Option +50 %',
    ],
    cta: 'Deep-Check buchen',
    quantity: 1,
  },
  {
    sku: 'PRE_SCREENING_CALL',
    name: 'Pre-Screening-Call',
    tagline: 'Telefon-Kurzcheck vor dem Interview',
    description:
      '10–15 Min strukturierter Telefon-Quickcheck mit dem Kandidaten — Motivation, Verfügbarkeit, Gehaltsvorstellung, Sprache. Spart Ihnen die ersten Interviews und filtert No-Shows raus.',
    price: 59,
    unit: 'Call',
    badge: 'Neu',
    category: 'PRE_SCREENING',
    icon: PhoneCall,
    color: 'cyan',
    features: [
      '10–15 min strukturierter Call',
      'Standardisierte Quickcheck-Fragen',
      'Notizen + Eignungs-Indikator (Go/Hold/No)',
      'Durchlaufzeit < 24 h',
      'Cross-Sell-Bundle mit Reference-Check: −20 %',
    ],
    cta: 'Pre-Screening buchen',
    quantity: 1,
  },
  {
    sku: 'DOCUMENT_VERIFICATION',
    name: 'Zeugnis-Verifizierung',
    tagline: 'Authentizitäts- & Code-Check für Arbeitszeugnisse',
    description:
      'Wir verifizieren die Echtheit hochgeladener Arbeitszeugnisse direkt beim ausstellenden Arbeitgeber und decodieren versteckte Bewertungs-Formeln („stets zur vollsten Zufriedenheit"-Skala).',
    price: 49,
    unit: 'Zeugnis',
    category: 'DOCUMENT',
    icon: FileCheck,
    color: 'emerald',
    features: [
      'Telefon-Rückfrage beim ausstellenden Arbeitgeber',
      'Decoding der Bewertungs-Geheimsprache',
      'Plausibilitäts-Check (Tätigkeiten, Zeitraum, Position)',
      'Audit-Trail mit Verifizier-Kontakt',
      'Bundle mit Reference-Check: −30 %',
    ],
    cta: 'Zeugnis-Check buchen',
    quantity: 1,
  },
  {
    sku: 'CV_SCREENING',
    name: 'CV-Screening',
    tagline: 'Vorgefilterte Top-Kandidaten aus Ihrer Pipeline',
    description:
      'Sie laden CVs hoch (oder lassen Kandidaten sich selbst registrieren), wir filtern KI-gestützt + Mensch-Review nach Ihren Anforderungen und liefern 1–3 priorisierte Profile mit Scorecard.',
    price: 199,
    unit: '10 CVs',
    category: 'SCREENING',
    icon: ScanSearch,
    color: 'violet',
    features: [
      'Bis zu 10 CVs pro Buchung',
      'KI-Pre-Sort + Senior-Recruiter-Review',
      'AGG-konformer Bewertungs-Raster',
      'Top-3-Shortlist mit Scorecard',
      'Genutzt das candiq Consent-Portal (DSGVO)',
    ],
    cta: 'CV-Screening buchen',
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
  INTERVIEW: { label: 'Deep-Check & Interview', desc: 'Strukturierte Kompetenz-Interviews mit Senior-Recruiter' },
  PRE_SCREENING: { label: 'Pre-Screening', desc: 'Telefon-Quickcheck vor dem eigentlichen Interview' },
  DOCUMENT: { label: 'Zeugnis-Verifizierung', desc: 'Echtheits- und Code-Check für Arbeitszeugnisse' },
  SCREENING: { label: 'CV-Screening', desc: 'Vorgefilterte Top-Kandidaten aus Ihrer Pipeline' },
  CHECK: { label: 'Reference-Checks', desc: 'Zusätzliche Verifizierungen' },
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

import 'server-only'
import { prisma } from '@/lib/db'
import { ALL_PLANS } from '@/lib/utils'

/**
 * KPI-Cockpit-Aggregationen (Phase 3 des DD-Pakets).
 *
 * Alle Kennzahlen werden SERVER-SEITIG aus der Produktions-DB berechnet —
 * kein Client-Rechnen, kein Vertrauen auf gecachte Zwischenwerte. Die reinen
 * Rechen-Helfer (computeMrr/computeArr/averageTurnaroundHours) sind bewusst
 * von den DB-Zugriffen getrennt, damit jede Aggregation isoliert und ohne
 * Infrastruktur testbar ist (siehe __tests__/kpi.test.ts).
 *
 * Geld-Semantik (WICHTIG): `priceMonthly` UND `priceAnnual` sind BEIDE
 * Monatsbeträge. `priceAnnual` ist die günstigere Monatsrate bei jährlicher
 * Zahlung, NICHT die Jahressumme. MRR summiert also je aktivem Abo den
 * passenden Monatsbetrag; ARR = MRR × 12.
 */

// Reviewer/Admin-Accounts sind candiq-intern und zählen NICHT als Kunden.
const CUSTOMER_FILTER = { role: { notIn: ['REVIEWER', 'ADMIN'] } }

// Nur diese Abo-Zustände gelten als „zahlend". TRIALING zahlt (noch) nicht,
// PAST_DUE/CANCELLED/INCOMPLETE ebenfalls nicht → nicht MRR-wirksam.
const PAYING_STATUS = 'ACTIVE'

export type PlanPricing = { priceMonthly: number; priceAnnual: number }

export type ActiveAbo = { plan: string; billingInterval: string | null }

/** Preis-Lookup aus der kanonischen Plan-Konfiguration (lib/utils). */
export function planPricing(): Map<string, PlanPricing> {
  return new Map(
    ALL_PLANS.map((p) => [p.id, { priceMonthly: p.priceMonthly, priceAnnual: p.priceAnnual }]),
  )
}

/**
 * Monthly Recurring Revenue (EUR/Monat) aus aktiven Abos.
 * YEARLY-Abos werden mit der (günstigeren) Jahres-Monatsrate gewertet.
 */
export function computeMrr(
  activeAbos: ActiveAbo[],
  pricing: Map<string, PlanPricing> = planPricing(),
): number {
  return activeAbos.reduce((sum, u) => {
    const p = pricing.get(u.plan)
    if (!p) return sum
    const monthly = u.billingInterval === 'YEARLY' ? p.priceAnnual : p.priceMonthly
    return sum + monthly
  }, 0)
}

/** Annual Recurring Revenue = MRR × 12. */
export function computeArr(mrr: number): number {
  return mrr * 12
}

/**
 * Ø Durchlaufzeit bis Report in Stunden. Proxy: Zeit zwischen Anlage
 * (`createdAt`) und Freigabe/Abschluss (`completedAt` = `updatedAt` bei
 * status=COMPLETED). Liefert `null`, wenn es keine abgeschlossenen Checks
 * gibt (kein sinnvoller Mittelwert).
 */
export function averageTurnaroundHours(
  completed: { createdAt: Date; completedAt: Date }[],
): number | null {
  if (completed.length === 0) return null
  const totalMs = completed.reduce(
    (sum, c) => sum + (c.completedAt.getTime() - c.createdAt.getTime()),
    0,
  )
  return totalMs / completed.length / 3_600_000
}

/** MRR-Aufschlüsselung je Plan × Abrechnungsintervall (für CSV-Export). */
export type RevenueRow = {
  plan: string
  billingInterval: string
  customers: number
  monthlyRatePerCustomer: number
  subtotal: number
}

export function revenueBreakdown(
  activeAbos: ActiveAbo[],
  pricing: Map<string, PlanPricing> = planPricing(),
): RevenueRow[] {
  const groups = new Map<string, RevenueRow>()
  for (const u of activeAbos) {
    const p = pricing.get(u.plan)
    if (!p) continue
    const interval = u.billingInterval === 'YEARLY' ? 'YEARLY' : 'MONTHLY'
    const rate = interval === 'YEARLY' ? p.priceAnnual : p.priceMonthly
    const key = `${u.plan}::${interval}`
    const existing = groups.get(key)
    if (existing) {
      existing.customers += 1
      existing.subtotal += rate
    } else {
      groups.set(key, {
        plan: u.plan,
        billingInterval: interval,
        customers: 1,
        monthlyRatePerCustomer: rate,
        subtotal: rate,
      })
    }
  }
  return Array.from(groups.values()).sort((a, b) => b.subtotal - a.subtotal)
}

export type KpiSnapshot = {
  generatedAt: string
  mrr: number
  arr: number
  currency: '€'
  activePayingCustomers: number
  totalCustomers: number
  trialingCustomers: number
  checksTotal: number
  checksLast30Days: number
  completedChecks: number
  avgTurnaroundHours: number | null
  credentialInventory: number
  partnerCustomers: number
  activePartnerCustomers: number
  zvooveLinkedCustomers: number
}

function thirtyDaysAgo(now = new Date()): Date {
  return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
}

/**
 * Zentrale Snapshot-Funktion: führt alle Aggregationen gegen die DB aus und
 * liefert das vollständige KPI-Bild. Wird von der Admin-Route und vom
 * CSV-Export geteilt, damit Zahl und Export IMMER aus derselben Quelle kommen.
 */
export async function getKpiSnapshot(now = new Date()): Promise<KpiSnapshot> {
  const since30 = thirtyDaysAgo(now)

  const [
    activeAbos,
    activePayingCustomers,
    totalCustomers,
    trialingCustomers,
    checksTotal,
    checksLast30Days,
    completedList,
    verifiedCandidates,
    partnerCustomers,
    activePartnerCustomers,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { ...CUSTOMER_FILTER, planStatus: PAYING_STATUS },
      select: { plan: true, billingInterval: true },
    }),
    prisma.user.count({ where: { ...CUSTOMER_FILTER, planStatus: PAYING_STATUS } }),
    prisma.user.count({ where: CUSTOMER_FILTER }),
    prisma.user.count({ where: { ...CUSTOMER_FILTER, planStatus: 'TRIALING' } }),
    prisma.referenceCheck.count(),
    prisma.referenceCheck.count({ where: { createdAt: { gte: since30 } } }),
    prisma.referenceCheck.findMany({
      where: { status: 'COMPLETED' },
      select: { createdAt: true, updatedAt: true },
    }),
    // Credential-Bestand: wiederverwendbare, verifizierte Profile =
    // distinct Kandidaten mit mind. einer VERIFIED-Referenzprüfung.
    prisma.referenceCheck.findMany({
      where: { result: 'VERIFIED' },
      select: { candidateId: true },
      distinct: ['candidateId'],
    }),
    prisma.partnerCustomer.count(),
    prisma.partnerCustomer.count({ where: { status: 'ACTIVE' } }),
  ])

  const mrr = computeMrr(activeAbos)
  const avgTurnaroundHours = averageTurnaroundHours(
    completedList.map((c) => ({ createdAt: c.createdAt, completedAt: c.updatedAt })),
  )

  return {
    generatedAt: now.toISOString(),
    mrr,
    arr: computeArr(mrr),
    currency: '€',
    activePayingCustomers,
    totalCustomers,
    trialingCustomers,
    checksTotal,
    checksLast30Days,
    completedChecks: completedList.length,
    avgTurnaroundHours,
    credentialInventory: verifiedCandidates.length,
    partnerCustomers,
    activePartnerCustomers,
    // zvoove ist in `main` nicht aktiv (Integration in offenem PR #137) →
    // ehrlich 0 statt geschätzt. Siehe docs/due-diligence/05-INTEGRATIONS.md.
    zvooveLinkedCustomers: 0,
  }
}

/** Detail-Daten für den CSV-Export je Metrik (Revenue-Aufschlüsselung). */
export async function getRevenueBreakdown(): Promise<RevenueRow[]> {
  const activeAbos = await prisma.user.findMany({
    where: { ...CUSTOMER_FILTER, planStatus: PAYING_STATUS },
    select: { plan: true, billingInterval: true },
  })
  return revenueBreakdown(activeAbos)
}

// ── CSV-Serialisierung ────────────────────────────────────────────────────

/** Escaping nach RFC 4180: Feld quoten, wenn Komma/Quote/Zeilenumbruch. */
export function csvCell(value: string | number): string {
  const s = String(value)
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function toCsv(header: string[], rows: (string | number)[][]): string {
  const lines = [header, ...rows].map((r) => r.map(csvCell).join(','))
  // CRLF: maximal kompatibel mit Excel.
  return lines.join('\r\n') + '\r\n'
}

export type KpiMetric = 'summary' | 'revenue'

export const KPI_METRICS: KpiMetric[] = ['summary', 'revenue']

/** Baut die CSV für eine gegebene Metrik server-seitig. */
export async function buildMetricCsv(metric: KpiMetric, now = new Date()): Promise<string> {
  if (metric === 'revenue') {
    const rows = await getRevenueBreakdown()
    return toCsv(
      ['plan', 'billing_interval', 'customers', 'monthly_rate_per_customer_eur', 'subtotal_eur'],
      rows.map((r) => [r.plan, r.billingInterval, r.customers, r.monthlyRatePerCustomer, r.subtotal]),
    )
  }
  // summary: eine Zeile je Kennzahl (metric,value).
  const s = await getKpiSnapshot(now)
  return toCsv(
    ['metric', 'value'],
    [
      ['generated_at', s.generatedAt],
      ['mrr_eur', s.mrr],
      ['arr_eur', s.arr],
      ['active_paying_customers', s.activePayingCustomers],
      ['total_customers', s.totalCustomers],
      ['trialing_customers', s.trialingCustomers],
      ['checks_total', s.checksTotal],
      ['checks_last_30_days', s.checksLast30Days],
      ['completed_checks', s.completedChecks],
      ['avg_turnaround_hours', s.avgTurnaroundHours ?? ''],
      ['credential_inventory', s.credentialInventory],
      ['partner_customers', s.partnerCustomers],
      ['active_partner_customers', s.activePartnerCustomers],
      ['zvoove_linked_customers', s.zvooveLinkedCustomers],
    ],
  )
}

/**
 * EK-Preis-Resolver für das Partner-Programm.
 *
 * EINHEITEN-SEMANTIK (verbindlich, siehe auch lib/partner/README.md):
 * ALLE Cent-Beträge in PartnerPricing UND PartnerCustomer sind
 * MONATSRATEN. Die *AnnualCents-Spalten enthalten die (günstigere)
 * Monatsrate bei jährlicher Zahlweise — NICHT die Jahressumme. Das
 * spiegelt lib/utils.ts (Plan.priceAnnual ist dort ebenfalls €/Monat,
 * vgl. PricingClient „€/Mo."). Konsumenten dürfen daher NIEMALS durch
 * 12 teilen oder mit 12 multiplizieren, um „Monatswerte" zu bekommen.
 *
 * Effektiver Einkaufspreis = entweder Per-Plan-Override aus
 * PartnerPricing(partnerAccountId=X), ODER Tier-Discount-Formel auf der
 * globalen Default-Zeile (partnerAccountId=NULL).
 *
 * Diese Datei ist SERVER-ONLY — sie liest EK-Werte aus der DB und darf
 * NIE direkt oder indirekt in ein Client-Bundle landen. Aufrufer sind:
 *   - app/partner/dashboard/pricing/page.tsx (Server Component)
 *   - app/api/partner/customers/route.ts     (POST/PATCH)
 *   - app/(dashboard)/admin/partners/page.tsx (read-only Margin-Anzeige)
 *
 * Pflicht-Check beim Aufruf: requireApprovedPartner() bzw. isAdmin().
 */

import 'server-only'
import { prisma } from '@/lib/db'

export type BillingCycle = 'MONTHLY' | 'YEARLY'

export type EkResolution = {
  planKey: string
  cycle: BillingCycle
  listPriceCents: number
  ekPriceCents: number
  appliedDiscountPct: number | null  // null wenn Override aktiv
  source: 'OVERRIDE' | 'TIER_FORMULA'
}

/**
 * Liefert für einen Partner + Plan + Billing-Cycle den effektiven EK.
 * Wirft, wenn die globale Default-Zeile fehlt (= Seed-Lücke, sollte nie
 * passieren weil seed:partner-pricing pflicht-Step ist).
 */
export async function resolveEk(opts: {
  partnerAccountId: string
  partnerTier: string
  planKey: string
  cycle: BillingCycle
}): Promise<EkResolution> {
  const [override, defaultRow, tierRow] = await Promise.all([
    prisma.partnerPricing.findUnique({
      where: {
        partnerAccountId_planKey: {
          partnerAccountId: opts.partnerAccountId,
          planKey: opts.planKey,
        },
      },
    }),
    // Deterministisch: NULL≠NULL in Postgres-Unique heißt, es KÖNNTEN
    // versehentlich mehrere Default-Zeilen pro planKey existieren —
    // orderBy stellt sicher, dass immer dieselbe (älteste) gewinnt.
    prisma.partnerPricing.findFirst({
      where: { partnerAccountId: null, planKey: opts.planKey },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.partnerTier.findUnique({ where: { tier: opts.partnerTier } }),
  ])

  if (!defaultRow) {
    throw new Error(`[partner/pricing] no global default for planKey=${opts.planKey} — run seed:partner-pricing`)
  }

  const listPriceCents = opts.cycle === 'MONTHLY'
    ? defaultRow.listPriceMonthlyCents
    : defaultRow.listPriceAnnualCents

  // 1) Override hat absolute Priorität — wenn gesetzt, Tier ignorieren
  const overrideEk = opts.cycle === 'MONTHLY'
    ? override?.baseEkMonthlyCents
    : override?.baseEkAnnualCents

  if (typeof overrideEk === 'number') {
    return {
      planKey: opts.planKey,
      cycle: opts.cycle,
      listPriceCents,
      ekPriceCents: overrideEk,
      appliedDiscountPct: null,
      source: 'OVERRIDE',
    }
  }

  // 2) Tier-Discount auf Listenpreis
  const discountPct = tierRow?.ekDiscountPct ?? 0
  const ekPriceCents = Math.round(listPriceCents * (1 - discountPct / 100))

  return {
    planKey: opts.planKey,
    cycle: opts.cycle,
    listPriceCents,
    ekPriceCents,
    appliedDiscountPct: discountPct,
    source: 'TIER_FORMULA',
  }
}

/**
 * Bulk-Resolver für die Pricing-Tabelle im Partner-Dashboard.
 * Lädt alle globalen Defaults + Per-Partner-Overrides + Tier in einer
 * Query-Runde und resolved lokal.
 */
export async function resolveAllEkForPartner(opts: {
  partnerAccountId: string
  partnerTier: string
}): Promise<{ monthly: EkResolution[]; yearly: EkResolution[] }> {
  const [defaultsRaw, overrides, tierRow] = await Promise.all([
    prisma.partnerPricing.findMany({
      where: { partnerAccountId: null },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.partnerPricing.findMany({ where: { partnerAccountId: opts.partnerAccountId } }),
    prisma.partnerTier.findUnique({ where: { tier: opts.partnerTier } }),
  ])

  // Duplikat-Schutz analog resolveEk: pro planKey gewinnt die älteste Zeile.
  const seenPlan = new Set<string>()
  const defaults = defaultsRaw.filter((d) => {
    if (seenPlan.has(d.planKey)) return false
    seenPlan.add(d.planKey)
    return true
  })

  const overrideByPlan = new Map(overrides.map((o) => [o.planKey, o]))
  const discountPct = tierRow?.ekDiscountPct ?? 0

  const buildOne = (def: typeof defaults[number], cycle: BillingCycle): EkResolution => {
    const listPriceCents = cycle === 'MONTHLY' ? def.listPriceMonthlyCents : def.listPriceAnnualCents
    const ov = overrideByPlan.get(def.planKey)
    const overrideEk = cycle === 'MONTHLY' ? ov?.baseEkMonthlyCents : ov?.baseEkAnnualCents
    if (typeof overrideEk === 'number') {
      return {
        planKey: def.planKey, cycle, listPriceCents,
        ekPriceCents: overrideEk, appliedDiscountPct: null, source: 'OVERRIDE',
      }
    }
    return {
      planKey: def.planKey, cycle, listPriceCents,
      ekPriceCents: Math.round(listPriceCents * (1 - discountPct / 100)),
      appliedDiscountPct: discountPct, source: 'TIER_FORMULA',
    }
  }

  return {
    monthly: defaults.map((d) => buildOne(d, 'MONTHLY')),
    yearly:  defaults.map((d) => buildOne(d, 'YEARLY')),
  }
}

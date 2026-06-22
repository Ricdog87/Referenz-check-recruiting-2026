/**
 * Tier-Helpers für das Partner-Programm.
 *
 * Source of truth für die aktuelle Stufe ist `PartnerAccount.tier` — wird
 * vom Admin gesetzt bzw. (Roadmap) per monatlichem Cron synchronisiert.
 *
 * Diese Datei liefert:
 *   - currentTierFromCount(activeCustomers) — berechnet aus PartnerCustomer.status='ACTIVE'
 *   - nextTierThreshold(tier)               — UI: "noch X aktive Mandanten bis SILVER"
 *   - allTiers()                            — UI: Tier-Ladder im Dashboard
 */

import 'server-only'
import { prisma } from '@/lib/db'

export type TierRow = {
  tier: string
  label: string
  minActiveCustomers: number
  ekDiscountPct: number
  sortOrder: number
}

export async function allTiers(): Promise<TierRow[]> {
  const rows = await prisma.partnerTier.findMany({ orderBy: { sortOrder: 'asc' } })
  return rows.map((r) => ({
    tier: r.tier,
    label: r.label,
    minActiveCustomers: r.minActiveCustomers,
    ekDiscountPct: r.ekDiscountPct,
    sortOrder: r.sortOrder,
  }))
}

/**
 * Höchstes Tier, dessen Schwelle der `activeCount` schon erreicht hat.
 * Fallback: 'REGISTERED' wenn keine Tier-Zeile passt (= leere Tabelle).
 */
export function currentTierFromCount(tiers: TierRow[], activeCount: number): TierRow | null {
  const sorted = [...tiers].sort((a, b) => b.minActiveCustomers - a.minActiveCustomers)
  for (const t of sorted) {
    if (activeCount >= t.minActiveCustomers) return t
  }
  return tiers[0] ?? null
}

/**
 * Nächst-höheres Tier (für UI „noch X bis SILVER"). null wenn schon top.
 */
export function nextTierAbove(tiers: TierRow[], currentTier: string): TierRow | null {
  const sorted = [...tiers].sort((a, b) => a.minActiveCustomers - b.minActiveCustomers)
  const idx = sorted.findIndex((t) => t.tier === currentTier)
  if (idx === -1) return sorted[0] ?? null
  return sorted[idx + 1] ?? null
}

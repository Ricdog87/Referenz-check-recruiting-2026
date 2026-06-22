/**
 * scripts/seed-partner-tiers.ts
 *
 * Füllt die 4 Tier-Defaults für das Partner-/Reseller-Programm:
 *
 *   REGISTERED   0  active customers   15 % EK-Discount
 *   SILVER       5  active customers   22 % EK-Discount
 *   GOLD        15  active customers   30 % EK-Discount
 *   PLATINUM    30  active customers   38 % EK-Discount
 *
 * Idempotent via upsert. Admin-UI kann später label/minActiveCustomers/
 * ekDiscountPct editieren — Re-Run überschreibt diese Werte NICHT, sondern
 * stellt nur sicher, dass alle vier Zeilen existieren.
 *
 * USAGE:
 *   DATABASE_URL=$PROD_DATABASE_URL npx tsx scripts/seed-partner-tiers.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type TierSeed = {
  tier: string
  label: string
  minActiveCustomers: number
  ekDiscountPct: number
  sortOrder: number
}

const TIERS: TierSeed[] = [
  { tier: 'REGISTERED', label: 'Registered', minActiveCustomers: 0,  ekDiscountPct: 15, sortOrder: 1 },
  { tier: 'SILVER',     label: 'Silver',     minActiveCustomers: 5,  ekDiscountPct: 22, sortOrder: 2 },
  { tier: 'GOLD',       label: 'Gold',       minActiveCustomers: 15, ekDiscountPct: 30, sortOrder: 3 },
  { tier: 'PLATINUM',   label: 'Platinum',   minActiveCustomers: 30, ekDiscountPct: 38, sortOrder: 4 },
]

async function main() {
  let created = 0
  let kept = 0

  for (const t of TIERS) {
    const existing = await prisma.partnerTier.findUnique({ where: { tier: t.tier } })
    if (existing) {
      kept++
      console.log(`  ✓ keep    ${t.tier.padEnd(10)}  (${existing.minActiveCustomers} min / ${existing.ekDiscountPct}% disc — unverändert)`)
      continue
    }
    await prisma.partnerTier.create({ data: t })
    created++
    console.log(`  + create  ${t.tier.padEnd(10)}  (${t.minActiveCustomers} min / ${t.ekDiscountPct}% disc)`)
  }

  console.log(`\nPartnerTier-Seed fertig: ${created} angelegt, ${kept} unverändert.`)
}

main()
  .catch((err) => {
    console.error('partner-tiers seed error:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

/**
 * scripts/seed-partner-pricing.ts
 *
 * Spiegelt die öffentlichen Plan-Listenpreise aus lib/utils.ts (HR_PLANS +
 * AGENCY_PLANS) als globale Default-Zeilen in PartnerPricing
 * (partnerAccountId = NULL).
 *
 * EINHEITEN: Plan.priceMonthly UND Plan.priceAnnual sind beide MONATSRATEN
 * (priceAnnual = günstigere Monatsrate bei jährlicher Zahlweise, vgl.
 * PricingClient „€/Mo."). listPriceAnnualCents ist also ebenfalls eine
 * Monatsrate — NICHT die Jahressumme. Siehe lib/partner/README.md.
 *
 * ENTERPRISE wird übersprungen (Custom-Quoting, priceMonthly=0 in der
 * Source-of-Truth) — die Decision dazu ist in lib/partner/README.md
 * dokumentiert.
 *
 * Idempotent via findFirst + create/update (statt upsert, weil Postgres
 * NULL ≠ NULL in unique behandelt und Prisma's upsert mit nullable Key
 * deshalb jedes Mal eine neue Zeile anlegen würde). Re-Run AKTUALISIERT
 * listPriceMonthlyCents / listPriceAnnualCents auf die aktuellen Werte
 * aus lib/utils.ts, lässt aber baseEkMonthlyCents / baseEkAnnualCents
 * (Per-Plan-Override) und notes unverändert.
 *
 * USAGE:
 *   DATABASE_URL=$PROD_DATABASE_URL npx tsx scripts/seed-partner-pricing.ts
 *
 * REIHENFOLGE: nach seed-partner-tiers.ts ausführen.
 */

import { PrismaClient } from '@prisma/client'
import { HR_PLANS, AGENCY_PLANS, type Plan } from '../lib/utils'

const prisma = new PrismaClient()

const SKIP_PLAN_KEYS = new Set(['ENTERPRISE'])

function toCents(eur: number): number {
  return Math.round(eur * 100)
}

async function main() {
  const allPlans: Plan[] = [...HR_PLANS, ...AGENCY_PLANS]
  let upserted = 0
  let skipped = 0

  for (const plan of allPlans) {
    if (SKIP_PLAN_KEYS.has(plan.id)) {
      skipped++
      console.log(`  ⊘ skip    ${plan.id.padEnd(14)}  (Custom-Quoting, kein Default-EK)`)
      continue
    }

    const listMonthly = toCents(plan.priceMonthly)
    const listAnnual  = toCents(plan.priceAnnual)

    const existing = await prisma.partnerPricing.findFirst({
      where: { partnerAccountId: null, planKey: plan.id },
    })

    if (existing) {
      await prisma.partnerPricing.update({
        where: { id: existing.id },
        // Re-Sync der List-Preise auf aktuelle Source-of-Truth.
        // baseEk*Cents + notes bleiben unangetastet.
        data: {
          listPriceMonthlyCents: listMonthly,
          listPriceAnnualCents:  listAnnual,
        },
      })
      console.log(
        `  ↻ update  ${plan.id.padEnd(14)}  list ${(listMonthly / 100).toFixed(0)}€/Mo. · ${(listAnnual / 100).toFixed(0)}€/Mo. (jährl. Zahlweise)`,
      )
    } else {
      await prisma.partnerPricing.create({
        data: {
          partnerAccountId:      null,
          planKey:               plan.id,
          listPriceMonthlyCents: listMonthly,
          listPriceAnnualCents:  listAnnual,
        },
      })
      console.log(
        `  + create  ${plan.id.padEnd(14)}  list ${(listMonthly / 100).toFixed(0)}€/Mo. · ${(listAnnual / 100).toFixed(0)}€/Mo. (jährl. Zahlweise)`,
      )
    }
    upserted++
  }

  console.log(
    `\nPartnerPricing-Seed fertig: ${upserted} Default-Zeilen synchronisiert, ${skipped} übersprungen.`,
  )
}

main()
  .catch((err) => {
    console.error('partner-pricing seed error:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

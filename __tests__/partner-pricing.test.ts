/**
 * __tests__/partner-pricing.test.ts
 *
 * Beweist die EK-Auflösung:
 *   1. Per-Plan-Override schlägt Tier-Formel (auch bei discount=0)
 *   2. Tier-Formel: round(listPrice × (1 − discount/100))
 *   3. Override für MONTHLY wirkt NICHT auf YEARLY (und umgekehrt)
 *   4. Fehlende Default-Zeile → Exception (Seed-Lücke ist Programmierfehler)
 *
 * Prisma wird gemockt via vi.doMock — Tests laufen offline.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockOverrideFindUnique = vi.fn()
const mockDefaultFindFirst = vi.fn()
const mockTierFindUnique = vi.fn()
const mockPricingFindMany = vi.fn()

async function importResolver() {
  vi.resetModules()
  vi.doMock('server-only', () => ({}))
  vi.doMock('@/lib/db', () => ({
    prisma: {
      partnerPricing: {
        findUnique: mockOverrideFindUnique,
        findFirst:  mockDefaultFindFirst,
        findMany:   mockPricingFindMany,
      },
      partnerTier: {
        findUnique: mockTierFindUnique,
      },
    },
  }))
  return import('@/lib/partner/pricing')
}

beforeEach(() => {
  mockOverrideFindUnique.mockReset()
  mockDefaultFindFirst.mockReset()
  mockTierFindUnique.mockReset()
  mockPricingFindMany.mockReset()
})

// ─────────────────────────────────────────────────────────────────
// resolveEk
// ─────────────────────────────────────────────────────────────────

describe('resolveEk — Per-Plan-Override hat absolute Priorität', () => {
  it('uses override.baseEkMonthlyCents when set (ignores tier discount completely)', async () => {
    const { resolveEk } = await importResolver()
    mockOverrideFindUnique.mockResolvedValue({
      partnerAccountId: 'p_1',
      planKey: 'STARTER',
      baseEkMonthlyCents: 5000,  // 50 € forced
      baseEkAnnualCents:  60000, // 600 €
    })
    mockDefaultFindFirst.mockResolvedValue({
      listPriceMonthlyCents: 7900, // 79 €
      listPriceAnnualCents:  6500,
    })
    mockTierFindUnique.mockResolvedValue({ ekDiscountPct: 38 }) // would normally be PLATINUM

    const r = await resolveEk({
      partnerAccountId: 'p_1', partnerTier: 'PLATINUM',
      planKey: 'STARTER', cycle: 'MONTHLY',
    })
    expect(r.source).toBe('OVERRIDE')
    expect(r.ekPriceCents).toBe(5000)
    expect(r.appliedDiscountPct).toBeNull()
    expect(r.listPriceCents).toBe(7900) // Listenpreis bleibt unverändert
  })

  it('falls back to tier formula when override exists but value for this cycle is null', async () => {
    const { resolveEk } = await importResolver()
    mockOverrideFindUnique.mockResolvedValue({
      baseEkMonthlyCents: null,   // ← Override-Zeile da, aber MONTHLY nicht gesetzt
      baseEkAnnualCents:  60000,
    })
    mockDefaultFindFirst.mockResolvedValue({
      listPriceMonthlyCents: 10000,
      listPriceAnnualCents:   9000,
    })
    mockTierFindUnique.mockResolvedValue({ ekDiscountPct: 20 })

    const r = await resolveEk({
      partnerAccountId: 'p_1', partnerTier: 'SILVER',
      planKey: 'STARTER', cycle: 'MONTHLY',
    })
    expect(r.source).toBe('TIER_FORMULA')
    expect(r.ekPriceCents).toBe(8000) // 10000 × 0.8
    expect(r.appliedDiscountPct).toBe(20)
  })
})

describe('resolveEk — Tier-Formel: round(listPrice × (1 − discount/100))', () => {
  it('REGISTERED 15% on 7900 → 6715', async () => {
    const { resolveEk } = await importResolver()
    mockOverrideFindUnique.mockResolvedValue(null)
    mockDefaultFindFirst.mockResolvedValue({ listPriceMonthlyCents: 7900, listPriceAnnualCents: 0 })
    mockTierFindUnique.mockResolvedValue({ ekDiscountPct: 15 })

    const r = await resolveEk({
      partnerAccountId: 'p_1', partnerTier: 'REGISTERED',
      planKey: 'STARTER', cycle: 'MONTHLY',
    })
    expect(r.ekPriceCents).toBe(6715) // 7900 × 0.85 = 6715
    expect(r.source).toBe('TIER_FORMULA')
  })

  it('PLATINUM 38% on 24900 → 15438', async () => {
    const { resolveEk } = await importResolver()
    mockOverrideFindUnique.mockResolvedValue(null)
    mockDefaultFindFirst.mockResolvedValue({ listPriceMonthlyCents: 24900, listPriceAnnualCents: 0 })
    mockTierFindUnique.mockResolvedValue({ ekDiscountPct: 38 })

    const r = await resolveEk({
      partnerAccountId: 'p_1', partnerTier: 'PLATINUM',
      planKey: 'PROFESSIONAL', cycle: 'MONTHLY',
    })
    expect(r.ekPriceCents).toBe(15438) // 24900 × 0.62 = 15438
  })

  it('rounds half-up (cents have no fractions)', async () => {
    const { resolveEk } = await importResolver()
    mockOverrideFindUnique.mockResolvedValue(null)
    mockDefaultFindFirst.mockResolvedValue({ listPriceMonthlyCents: 999, listPriceAnnualCents: 0 })
    mockTierFindUnique.mockResolvedValue({ ekDiscountPct: 22 })

    const r = await resolveEk({
      partnerAccountId: 'p_1', partnerTier: 'SILVER',
      planKey: 'X', cycle: 'MONTHLY',
    })
    // 999 × 0.78 = 779.22 → rundet auf 779
    expect(r.ekPriceCents).toBe(779)
  })

  it('0% discount produces ek === list', async () => {
    const { resolveEk } = await importResolver()
    mockOverrideFindUnique.mockResolvedValue(null)
    mockDefaultFindFirst.mockResolvedValue({ listPriceMonthlyCents: 1000, listPriceAnnualCents: 0 })
    mockTierFindUnique.mockResolvedValue({ ekDiscountPct: 0 })

    const r = await resolveEk({
      partnerAccountId: 'p_1', partnerTier: 'X',
      planKey: 'Y', cycle: 'MONTHLY',
    })
    expect(r.ekPriceCents).toBe(1000)
    expect(r.appliedDiscountPct).toBe(0)
  })

  it('uses ANNUAL columns when cycle=YEARLY', async () => {
    const { resolveEk } = await importResolver()
    mockOverrideFindUnique.mockResolvedValue(null)
    mockDefaultFindFirst.mockResolvedValue({
      listPriceMonthlyCents: 1000,
      listPriceAnnualCents:  8500,
    })
    mockTierFindUnique.mockResolvedValue({ ekDiscountPct: 30 })

    const r = await resolveEk({
      partnerAccountId: 'p_1', partnerTier: 'GOLD',
      planKey: 'Y', cycle: 'YEARLY',
    })
    expect(r.listPriceCents).toBe(8500)
    expect(r.ekPriceCents).toBe(5950) // 8500 × 0.7
  })
})

describe('resolveEk — Fehlerbehandlung', () => {
  it('throws when no global default exists for the planKey', async () => {
    const { resolveEk } = await importResolver()
    mockOverrideFindUnique.mockResolvedValue(null)
    mockDefaultFindFirst.mockResolvedValue(null)    // Seed-Lücke
    mockTierFindUnique.mockResolvedValue({ ekDiscountPct: 15 })

    await expect(
      resolveEk({
        partnerAccountId: 'p_1', partnerTier: 'REGISTERED',
        planKey: 'UNKNOWN', cycle: 'MONTHLY',
      }),
    ).rejects.toThrow(/no global default for planKey=UNKNOWN/)
  })

  it('treats missing tier row as 0% discount (graceful degrade)', async () => {
    const { resolveEk } = await importResolver()
    mockOverrideFindUnique.mockResolvedValue(null)
    mockDefaultFindFirst.mockResolvedValue({ listPriceMonthlyCents: 5000, listPriceAnnualCents: 0 })
    mockTierFindUnique.mockResolvedValue(null)

    const r = await resolveEk({
      partnerAccountId: 'p_1', partnerTier: 'GHOST',
      planKey: 'X', cycle: 'MONTHLY',
    })
    expect(r.ekPriceCents).toBe(5000)
    expect(r.appliedDiscountPct).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────
// resolveAllEkForPartner — Bulk
// ─────────────────────────────────────────────────────────────────

describe('resolveAllEkForPartner — Bulk-Resolver', () => {
  it('returns monthly + yearly arrays in the same length as defaults', async () => {
    const { resolveAllEkForPartner } = await importResolver()

    const defaults = [
      { planKey: 'A', listPriceMonthlyCents: 1000, listPriceAnnualCents: 9000 },
      { planKey: 'B', listPriceMonthlyCents: 2000, listPriceAnnualCents: 18000 },
    ]
    mockPricingFindMany
      .mockResolvedValueOnce(defaults)      // defaults (partnerAccountId IS NULL)
      .mockResolvedValueOnce([])            // overrides
    mockTierFindUnique.mockResolvedValue({ ekDiscountPct: 20 })

    const r = await resolveAllEkForPartner({ partnerAccountId: 'p_1', partnerTier: 'X' })
    expect(r.monthly).toHaveLength(2)
    expect(r.yearly).toHaveLength(2)
    expect(r.monthly[0].ekPriceCents).toBe(800)  // 1000 × 0.8
    expect(r.yearly[1].ekPriceCents).toBe(14400) // 18000 × 0.8
  })

  it('applies overrides per-plan, falls back to tier for the rest', async () => {
    const { resolveAllEkForPartner } = await importResolver()

    mockPricingFindMany
      .mockResolvedValueOnce([
        { planKey: 'A', listPriceMonthlyCents: 1000, listPriceAnnualCents: 9000 },
        { planKey: 'B', listPriceMonthlyCents: 2000, listPriceAnnualCents: 18000 },
      ])
      .mockResolvedValueOnce([
        // Override only on plan A monthly
        { planKey: 'A', baseEkMonthlyCents: 700, baseEkAnnualCents: null },
      ])
    mockTierFindUnique.mockResolvedValue({ ekDiscountPct: 50 })

    const r = await resolveAllEkForPartner({ partnerAccountId: 'p_1', partnerTier: 'X' })
    const monthlyA = r.monthly.find((x) => x.planKey === 'A')!
    const monthlyB = r.monthly.find((x) => x.planKey === 'B')!
    const yearlyA  = r.yearly.find((x) => x.planKey === 'A')!

    expect(monthlyA.source).toBe('OVERRIDE')
    expect(monthlyA.ekPriceCents).toBe(700)

    expect(monthlyB.source).toBe('TIER_FORMULA')
    expect(monthlyB.ekPriceCents).toBe(1000) // 2000 × 0.5

    // YEARLY hat keinen Override → Tier-Formel
    expect(yearlyA.source).toBe('TIER_FORMULA')
    expect(yearlyA.ekPriceCents).toBe(4500) // 9000 × 0.5
  })
})

/**
 * __tests__/partner-tier.test.ts
 *
 * Reine Lookup-Logik — keine DB-Mocks nötig. Wir reichen die Tier-Liste
 * (wie sie der Seed anlegt) explizit ein.
 */

import { describe, it, expect } from 'vitest'
import { currentTierFromCount, nextTierAbove, type TierRow } from '@/lib/partner/tier'

const SEED_TIERS: TierRow[] = [
  { tier: 'REGISTERED', label: 'Registered', minActiveCustomers: 0,  ekDiscountPct: 15, sortOrder: 1 },
  { tier: 'SILVER',     label: 'Silver',     minActiveCustomers: 5,  ekDiscountPct: 22, sortOrder: 2 },
  { tier: 'GOLD',       label: 'Gold',       minActiveCustomers: 15, ekDiscountPct: 30, sortOrder: 3 },
  { tier: 'PLATINUM',   label: 'Platinum',   minActiveCustomers: 30, ekDiscountPct: 38, sortOrder: 4 },
]

describe('currentTierFromCount — höchstes erreichtes Tier', () => {
  it('returns REGISTERED for 0 customers', () => {
    expect(currentTierFromCount(SEED_TIERS, 0)?.tier).toBe('REGISTERED')
  })

  it('still REGISTERED below the SILVER threshold (4)', () => {
    expect(currentTierFromCount(SEED_TIERS, 4)?.tier).toBe('REGISTERED')
  })

  it('jumps to SILVER exactly at threshold (5)', () => {
    expect(currentTierFromCount(SEED_TIERS, 5)?.tier).toBe('SILVER')
  })

  it('stays SILVER until 14, then GOLD at 15', () => {
    expect(currentTierFromCount(SEED_TIERS, 14)?.tier).toBe('SILVER')
    expect(currentTierFromCount(SEED_TIERS, 15)?.tier).toBe('GOLD')
  })

  it('PLATINUM at 30, stays PLATINUM way beyond', () => {
    expect(currentTierFromCount(SEED_TIERS, 30)?.tier).toBe('PLATINUM')
    expect(currentTierFromCount(SEED_TIERS, 9999)?.tier).toBe('PLATINUM')
  })

  it('returns null on empty tier list (defensive)', () => {
    expect(currentTierFromCount([], 50)).toBeNull()
  })
})

describe('nextTierAbove — UI: „noch X bis SILVER"', () => {
  it('REGISTERED → SILVER', () => {
    expect(nextTierAbove(SEED_TIERS, 'REGISTERED')?.tier).toBe('SILVER')
  })

  it('SILVER → GOLD', () => {
    expect(nextTierAbove(SEED_TIERS, 'SILVER')?.tier).toBe('GOLD')
  })

  it('GOLD → PLATINUM', () => {
    expect(nextTierAbove(SEED_TIERS, 'GOLD')?.tier).toBe('PLATINUM')
  })

  it('PLATINUM → null (top of ladder)', () => {
    expect(nextTierAbove(SEED_TIERS, 'PLATINUM')).toBeNull()
  })

  it('unknown tier → returns lowest tier as starting point', () => {
    expect(nextTierAbove(SEED_TIERS, 'UNKNOWN_TIER')?.tier).toBe('REGISTERED')
  })
})

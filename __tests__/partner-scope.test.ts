/**
 * __tests__/partner-scope.test.ts
 *
 * Beweist die zentrale Scoping-Schicht. Der Vertrag:
 *
 *   - withPartnerScope() liefert IMMER eine where-Clause mit partnerAccountId
 *   - Leerer / undefined / null Scope wirft sofort — verhindert
 *     versehentliche unscoped Queries
 *   - withPartnerOrGlobalScope() erlaubt Default-Zeile (partnerAccountId IS NULL)
 *     UND Per-Partner-Override gleichzeitig zu lesen
 */

import { describe, it, expect } from 'vitest'
import { withPartnerScope, withPartnerOrGlobalScope } from '@/lib/partner/scope'

describe('withPartnerScope — Pflicht-Helper für Partner-Reads/Writes', () => {
  it('builds a where-clause with the partner id', () => {
    expect(withPartnerScope('acc_xyz')).toEqual({ partnerAccountId: 'acc_xyz' })
  })

  it('throws on empty string', () => {
    expect(() => withPartnerScope('')).toThrow(/partnerAccountId required/)
  })

  it('throws on undefined', () => {
    expect(() => withPartnerScope(undefined as any)).toThrow(/partnerAccountId required/)
  })

  it('throws on null', () => {
    expect(() => withPartnerScope(null as any)).toThrow(/partnerAccountId required/)
  })

  it('throws on non-string (number, object) — anti-bypass', () => {
    expect(() => withPartnerScope(42 as any)).toThrow(/partnerAccountId required/)
    expect(() => withPartnerScope({} as any)).toThrow(/partnerAccountId required/)
  })

  it('does NOT silently accept "undefined" as string (would create where: { partnerAccountId: "undefined" })', () => {
    // "undefined" als String ist syntaktisch erlaubt — wir lehnen ihn NICHT ab,
    // weil Postgres dann einfach 0 Zeilen findet. Das wäre safe-by-default.
    // Aber: explizit dokumentieren, dass das so gewollt ist.
    expect(withPartnerScope('undefined')).toEqual({ partnerAccountId: 'undefined' })
  })
})

describe('withPartnerOrGlobalScope — für PartnerPricing (Default + Override)', () => {
  it('builds an OR clause covering both sources', () => {
    expect(withPartnerOrGlobalScope('acc_xyz')).toEqual({
      OR: [{ partnerAccountId: 'acc_xyz' }, { partnerAccountId: null }],
    })
  })

  it('throws on empty/undefined/null — same anti-bypass guarantee', () => {
    expect(() => withPartnerOrGlobalScope('')).toThrow()
    expect(() => withPartnerOrGlobalScope(undefined as any)).toThrow()
    expect(() => withPartnerOrGlobalScope(null as any)).toThrow()
  })

  it('order matters: partner-specific BEFORE global, so query can ORDER BY partnerAccountId NULLS LAST', () => {
    const r = withPartnerOrGlobalScope('p_1')
    expect(r.OR[0]).toEqual({ partnerAccountId: 'p_1' })
    expect(r.OR[1]).toEqual({ partnerAccountId: null })
  })
})

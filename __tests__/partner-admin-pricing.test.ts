/**
 * __tests__/partner-admin-pricing.test.ts
 *
 * POST /api/admin/partners/[id]/pricing — Admin setzt/löscht EK-Overrides.
 *
 * Garantien:
 *   - Nur ADMIN (403 für CLIENT/anonym), Flag off → 404
 *   - planKey-Whitelist (ENTERPRISE + Unbekanntes → 400)
 *   - beide Werte null → deleteMany (Formel gilt wieder)
 *   - Wert gesetzt → upsert über compound-unique
 *   - fehlende Default-Zeile → 409 (Seed-Hinweis)
 *   - Betrags-Grenzen (<=0, >1 Mio €) → 400
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockPartnerFindFirst = vi.fn()
const mockPricingFindFirst = vi.fn()
const mockPricingUpsert = vi.fn().mockResolvedValue({})
const mockPricingDeleteMany = vi.fn().mockResolvedValue({ count: 1 })
const mockAuditCreate = vi.fn().mockResolvedValue({})
const mockGetServerSession = vi.fn()

const ADMIN_SESSION = { user: { id: 'admin_1', role: 'ADMIN', email: 'admin@candiq.de' } }
const DEFAULT_ROW = {
  listPriceMonthlyCents: 7900,
  listPriceAnnualCents: 6500,
}

async function importPost(flagOn = true) {
  vi.resetModules()
  vi.doMock('server-only', () => ({}))
  vi.doMock('@/lib/flags', () => ({ isPartnerProgramEnabled: () => flagOn }))
  vi.doMock('next-auth', () => ({ getServerSession: mockGetServerSession }))
  vi.doMock('@/lib/auth', () => ({ authOptions: {} }))
  vi.doMock('@/lib/reviewer', () => ({
    isAdmin: (s: any) => s?.user?.role === 'ADMIN',
  }))
  vi.doMock('@/lib/db', () => ({
    prisma: {
      partnerAccount: { findFirst: mockPartnerFindFirst },
      partnerPricing: {
        findFirst: mockPricingFindFirst,
        upsert: mockPricingUpsert,
        deleteMany: mockPricingDeleteMany,
      },
      partnerAuditLog: { create: mockAuditCreate },
    },
  }))
  vi.doMock('@/lib/logger', () => ({
    logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
  }))
  const mod = await import('@/app/api/admin/partners/[id]/pricing/route')
  return mod.POST
}

function makeReq(body: any): any {
  return {
    headers: new Headers(),
    nextUrl: new URL('http://localhost/api/admin/partners/p1/pricing'),
    json: async () => body,
  }
}

beforeEach(() => {
  mockPartnerFindFirst.mockReset().mockResolvedValue({ id: 'p1' })
  mockPricingFindFirst.mockReset().mockResolvedValue(DEFAULT_ROW)
  mockPricingUpsert.mockClear()
  mockPricingDeleteMany.mockClear()
  mockAuditCreate.mockClear()
  mockGetServerSession.mockReset().mockResolvedValue(ADMIN_SESSION)
})

describe('admin pricing override — Gates', () => {
  it('anonym → 403', async () => {
    const POST = await importPost()
    mockGetServerSession.mockResolvedValue(null)
    const res = await POST(makeReq({ planKey: 'STARTER', baseEkMonthlyCents: 5000 }), { params: { id: 'p1' } })
    expect(res.status).toBe(403)
    expect(mockPricingUpsert).not.toHaveBeenCalled()
  })

  it('CLIENT-Rolle → 403', async () => {
    const POST = await importPost()
    mockGetServerSession.mockResolvedValue({ user: { id: 'u1', role: 'CLIENT' } })
    const res = await POST(makeReq({ planKey: 'STARTER', baseEkMonthlyCents: 5000 }), { params: { id: 'p1' } })
    expect(res.status).toBe(403)
  })

  it('Flag off → 404 ohne Session-Check', async () => {
    const POST = await importPost(false)
    const res = await POST(makeReq({ planKey: 'STARTER', baseEkMonthlyCents: 5000 }), { params: { id: 'p1' } })
    expect(res.status).toBe(404)
    expect(mockGetServerSession).not.toHaveBeenCalled()
  })

  it('unbekannter Partner → 404', async () => {
    const POST = await importPost()
    mockPartnerFindFirst.mockResolvedValue(null)
    const res = await POST(makeReq({ planKey: 'STARTER', baseEkMonthlyCents: 5000 }), { params: { id: 'ghost' } })
    expect(res.status).toBe(404)
  })
})

describe('admin pricing override — Validation', () => {
  it.each(['ENTERPRISE', 'UNKNOWN_PLAN', ''])('planKey "%s" → 400', async (planKey) => {
    const POST = await importPost()
    const res = await POST(makeReq({ planKey, baseEkMonthlyCents: 5000 }), { params: { id: 'p1' } })
    expect(res.status).toBe(400)
  })

  it('negativer Betrag → 400', async () => {
    const POST = await importPost()
    const res = await POST(makeReq({ planKey: 'STARTER', baseEkMonthlyCents: -100 }), { params: { id: 'p1' } })
    expect(res.status).toBe(400)
  })

  it('Betrag über 1 Mio € → 400', async () => {
    const POST = await importPost()
    const res = await POST(makeReq({ planKey: 'STARTER', baseEkMonthlyCents: 100_000_001 }), { params: { id: 'p1' } })
    expect(res.status).toBe(400)
  })
})

describe('admin pricing override — Verhalten', () => {
  it('Wert setzen → upsert mit compound-unique + Audit SET', async () => {
    const POST = await importPost()
    const res = await POST(
      makeReq({ planKey: 'STARTER', baseEkMonthlyCents: 5000, baseEkAnnualCents: 4200 }),
      { params: { id: 'p1' } },
    )
    expect(res.status).toBe(200)
    expect(mockPricingUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { partnerAccountId_planKey: { partnerAccountId: 'p1', planKey: 'STARTER' } },
        update: { baseEkMonthlyCents: 5000, baseEkAnnualCents: 4200 },
      }),
    )
    expect(mockAuditCreate.mock.calls[0][0].data.action).toBe('PARTNER_PRICING_OVERRIDE_SET')
    expect(mockAuditCreate.mock.calls[0][0].data.details).toContain('by_admin=admin_1')
  })

  it('nur ein Cycle gesetzt → anderer bleibt null (Formel greift dort)', async () => {
    const POST = await importPost()
    const res = await POST(
      makeReq({ planKey: 'STARTER', baseEkMonthlyCents: 5000, baseEkAnnualCents: null }),
      { params: { id: 'p1' } },
    )
    expect(res.status).toBe(200)
    expect(mockPricingUpsert.mock.calls[0][0].update).toEqual({
      baseEkMonthlyCents: 5000,
      baseEkAnnualCents: null,
    })
  })

  it('beide null → deleteMany + Audit CLEARED, kein upsert', async () => {
    const POST = await importPost()
    const res = await POST(
      makeReq({ planKey: 'STARTER', baseEkMonthlyCents: null, baseEkAnnualCents: null }),
      { params: { id: 'p1' } },
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.cleared).toBe(true)
    expect(mockPricingDeleteMany).toHaveBeenCalledWith({
      where: { partnerAccountId: 'p1', planKey: 'STARTER' },
    })
    expect(mockPricingUpsert).not.toHaveBeenCalled()
    expect(mockAuditCreate.mock.calls[0][0].data.action).toBe('PARTNER_PRICING_OVERRIDE_CLEARED')
  })

  it('fehlende Default-Zeile → 409 mit Seed-Hinweis', async () => {
    const POST = await importPost()
    mockPricingFindFirst.mockResolvedValue(null)
    const res = await POST(makeReq({ planKey: 'STARTER', baseEkMonthlyCents: 5000 }), { params: { id: 'p1' } })
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.error).toMatch(/seed:partner-pricing/)
  })
})

/**
 * __tests__/partner-customer-isolation.test.ts
 *
 * Beweist: die PATCH /api/partner/customers/[id]-Route lädt einen
 * Mandanten NUR, wenn er via withPartnerScope(session.id) auffindbar
 * ist. Eine geratene fremde ID kann eine Partner A nicht erlauben,
 * Daten von Partner B zu mutieren.
 *
 * Das gleiche Pattern (findFirst + withPartnerScope + id) wird auch von
 * GET /api/partner/customers und vom Dashboard-Page benutzt — wir testen
 * es hier exemplarisch an der schreibenden Route, weil das die größte
 * Konsequenz hat.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockPartnerCustomerFindFirst = vi.fn()
const mockPartnerCustomerUpdate = vi.fn()
const mockPartnerAuditCreate = vi.fn().mockResolvedValue({})

const PARTNER_A: any = { id: 'partner_A', email: 'a@x.de', name: 'A', status: 'APPROVED', tier: 'SILVER' }
const PARTNER_B: any = { id: 'partner_B', email: 'b@x.de', name: 'B', status: 'APPROVED', tier: 'SILVER' }

const mockGetPartnerSession = vi.fn()

async function importPatch() {
  vi.resetModules()
  process.env.PARTNER_PROGRAM_ENABLED = 'true'

  vi.doMock('server-only', () => ({}))
  vi.doMock('@/lib/flags', () => ({ isPartnerProgramEnabled: () => true }))
  vi.doMock('@/lib/partner/session', () => ({
    getPartnerSession: mockGetPartnerSession,
  }))
  vi.doMock('@/lib/db', () => ({
    prisma: {
      partnerCustomer: {
        findFirst: mockPartnerCustomerFindFirst,
        update: mockPartnerCustomerUpdate,
      },
      partnerAuditLog: { create: mockPartnerAuditCreate },
    },
  }))
  // rate-limit / logger sind Side-Effects — wir stubben sie out
  vi.doMock('@/lib/rate-limit', () => ({
    rateLimit: () => ({ ok: true, retryAfter: 0 }),
    getClientIp: () => '127.0.0.1',
  }))
  vi.doMock('@/lib/logger', () => ({
    logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
  }))

  const mod = await import('@/app/api/partner/customers/[id]/route')
  return mod.PATCH
}

function makeReq(body: any): any {
  return {
    headers: new Headers(),
    nextUrl: new URL('http://localhost/api/partner/customers/cust_b1'),
    json: async () => body,
  }
}

beforeEach(() => {
  mockPartnerCustomerFindFirst.mockReset()
  mockPartnerCustomerUpdate.mockReset()
  mockPartnerAuditCreate.mockClear()
  mockGetPartnerSession.mockReset()
})

describe('PATCH /api/partner/customers/[id] — Cross-Partner-Isolation', () => {
  it('Partner A → patch on Partner B customer → 404 (findFirst with scope returns null)', async () => {
    const PATCH = await importPatch()

    mockGetPartnerSession.mockResolvedValue(PARTNER_A)
    // Simulation: findFirst mit scope partner_A findet die ID des B-Mandanten NICHT
    mockPartnerCustomerFindFirst.mockResolvedValue(null)

    const res = await PATCH(makeReq({ status: 'CHURNED' }), { params: { id: 'cust_b1' } })

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toMatch(/nicht gefunden/i)

    // KRITISCH: die Update-Funktion DARF NICHT aufgerufen worden sein
    expect(mockPartnerCustomerUpdate).not.toHaveBeenCalled()

    // Der findFirst MUSS den Scope verwendet haben
    expect(mockPartnerCustomerFindFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        partnerAccountId: 'partner_A',
        id: 'cust_b1',
      }),
    })
  })

  it('Partner A → patch on own customer → update is called with own customer id', async () => {
    const PATCH = await importPatch()

    mockGetPartnerSession.mockResolvedValue(PARTNER_A)
    mockPartnerCustomerFindFirst.mockResolvedValue({
      id: 'cust_a1', partnerAccountId: 'partner_A',
      ekPriceCents: 5000, endPriceCents: 7000, status: 'ACTIVE',
    })
    mockPartnerCustomerUpdate.mockResolvedValue({})

    const res = await PATCH(makeReq({ status: 'PAUSED' }), { params: { id: 'cust_a1' } })

    expect(res.status).toBe(200)
    expect(mockPartnerCustomerUpdate).toHaveBeenCalledTimes(1)
    expect(mockPartnerCustomerUpdate).toHaveBeenCalledWith({
      where: { id: 'cust_a1' },
      data: expect.objectContaining({ status: 'PAUSED', pausedAt: expect.any(Date) }),
    })
  })

  it('unauthenticated → 401, no DB call', async () => {
    const PATCH = await importPatch()

    mockGetPartnerSession.mockResolvedValue(null)

    const res = await PATCH(makeReq({ status: 'PAUSED' }), { params: { id: 'cust_a1' } })

    expect(res.status).toBe(401)
    expect(mockPartnerCustomerFindFirst).not.toHaveBeenCalled()
    expect(mockPartnerCustomerUpdate).not.toHaveBeenCalled()
  })

  it('PENDING partner → 403, no DB call', async () => {
    const PATCH = await importPatch()

    mockGetPartnerSession.mockResolvedValue({ ...PARTNER_A, status: 'PENDING' })

    const res = await PATCH(makeReq({ status: 'PAUSED' }), { params: { id: 'cust_a1' } })

    expect(res.status).toBe(403)
    expect(mockPartnerCustomerFindFirst).not.toHaveBeenCalled()
    expect(mockPartnerCustomerUpdate).not.toHaveBeenCalled()
  })

  it('reject endPriceCents < ekPriceCents (audit trail integrity)', async () => {
    const PATCH = await importPatch()

    mockGetPartnerSession.mockResolvedValue(PARTNER_A)
    mockPartnerCustomerFindFirst.mockResolvedValue({
      id: 'cust_a1', partnerAccountId: 'partner_A',
      ekPriceCents: 5000, endPriceCents: 7000, status: 'ACTIVE',
    })

    const res = await PATCH(makeReq({ endPriceCents: 4000 }), { params: { id: 'cust_a1' } })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/unter EK/i)
    expect(mockPartnerCustomerUpdate).not.toHaveBeenCalled()
  })

  it('flag off → 404 even for own customer', async () => {
    vi.resetModules()
    vi.doMock('server-only', () => ({}))
    vi.doMock('@/lib/flags', () => ({ isPartnerProgramEnabled: () => false }))
    vi.doMock('@/lib/partner/session', () => ({ getPartnerSession: mockGetPartnerSession }))
    vi.doMock('@/lib/db', () => ({
      prisma: { partnerCustomer: { findFirst: vi.fn(), update: vi.fn() }, partnerAuditLog: { create: vi.fn() } },
    }))
    vi.doMock('@/lib/rate-limit', () => ({ rateLimit: () => ({ ok: true, retryAfter: 0 }), getClientIp: () => '127.0.0.1' }))
    vi.doMock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }))

    const mod = await import('@/app/api/partner/customers/[id]/route')
    const PATCH = mod.PATCH

    const res = await PATCH(makeReq({ status: 'PAUSED' }), { params: { id: 'cust_a1' } })
    expect(res.status).toBe(404)
  })
})

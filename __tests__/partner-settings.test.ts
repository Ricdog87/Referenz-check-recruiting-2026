/**
 * __tests__/partner-settings.test.ts
 *
 * PATCH /api/partner/account          — Firmendaten
 * POST  /api/partner/account/password — Passwort ändern
 *
 * Garantien:
 *   - Session-Pflicht (401), Flag off → 404
 *   - email/status/tier sind über PATCH NICHT setzbar
 *   - Passwort: falsches Current → 400 + field, Session allein reicht nicht
 *   - Nach Passwort-Wechsel werden offene Reset-Tokens invalidiert (Transaction)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockAccountUpdate = vi.fn().mockResolvedValue({})
const mockAccountFindUnique = vi.fn()
const mockTokenUpdateMany = vi.fn().mockResolvedValue({ count: 2 })
const mockAuditCreate = vi.fn().mockResolvedValue({})
const mockTransaction = vi.fn(async (ops: unknown[]) => ops)
const mockGetPartnerSession = vi.fn()
const mockCompare = vi.fn()
const mockHash = vi.fn().mockResolvedValue('new-hash')

const SESSION: any = { id: 'partner_A', email: 'a@x.de', name: 'A', status: 'APPROVED', tier: 'SILVER' }

function mockDeps(flagOn = true) {
  vi.resetModules()
  vi.doMock('server-only', () => ({}))
  vi.doMock('@/lib/flags', () => ({ isPartnerProgramEnabled: () => flagOn }))
  vi.doMock('@/lib/partner/session', () => ({ getPartnerSession: mockGetPartnerSession }))
  vi.doMock('@/lib/db', () => ({
    prisma: {
      partnerAccount: { update: mockAccountUpdate, findUnique: mockAccountFindUnique },
      partnerPasswordResetToken: { updateMany: mockTokenUpdateMany },
      partnerAuditLog: { create: mockAuditCreate },
      $transaction: mockTransaction,
    },
  }))
  vi.doMock('@/lib/rate-limit', () => ({
    rateLimit: () => ({ ok: true, retryAfter: 0 }),
    getClientIp: () => '127.0.0.1',
  }))
  vi.doMock('@/lib/logger', () => ({
    logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
  }))
  vi.doMock('bcryptjs', () => ({
    default: { compare: mockCompare, hash: mockHash },
  }))
}

async function importAccountPatch(flagOn = true) {
  mockDeps(flagOn)
  return (await import('@/app/api/partner/account/route')).PATCH
}
async function importPasswordPost(flagOn = true) {
  mockDeps(flagOn)
  return (await import('@/app/api/partner/account/password/route')).POST
}

function makeReq(body: any): any {
  return {
    headers: new Headers(),
    nextUrl: new URL('http://localhost/api/partner/account'),
    json: async () => body,
  }
}

beforeEach(() => {
  mockAccountUpdate.mockClear()
  mockAccountFindUnique.mockReset().mockResolvedValue({
    id: 'partner_A',
    passwordHash: 'old-hash',
    deletedAt: null,
  })
  mockTokenUpdateMany.mockClear()
  mockAuditCreate.mockClear()
  mockTransaction.mockClear()
  mockGetPartnerSession.mockReset().mockResolvedValue(SESSION)
  mockCompare.mockReset().mockResolvedValue(true)
})

describe('PATCH /api/partner/account', () => {
  it('aktualisiert Firmendaten mit Audit', async () => {
    const PATCH = await importAccountPatch()
    const res = await PATCH(makeReq({ company: 'Neu GmbH', phone: '+49 123' }))
    expect(res.status).toBe(200)
    expect(mockAccountUpdate).toHaveBeenCalledWith({
      where: { id: 'partner_A' },
      data: { company: 'Neu GmbH', phone: '+49 123' },
    })
    expect(mockAuditCreate.mock.calls[0][0].data.action).toBe('PARTNER_ACCOUNT_UPDATE')
  })

  it('email/status/tier im Body werden IGNORIERT (nicht Teil des Updates)', async () => {
    const PATCH = await importAccountPatch()
    const res = await PATCH(
      makeReq({ company: 'X GmbH', email: 'hijack@evil.de', status: 'APPROVED', tier: 'PLATINUM' }),
    )
    expect(res.status).toBe(200)
    const updateData = mockAccountUpdate.mock.calls[0][0].data
    expect(updateData).toEqual({ company: 'X GmbH' })
    expect(JSON.stringify(updateData)).not.toContain('hijack')
  })

  it('leere Firma → 400', async () => {
    const PATCH = await importAccountPatch()
    const res = await PATCH(makeReq({ company: '   ' }))
    expect(res.status).toBe(400)
    expect(mockAccountUpdate).not.toHaveBeenCalled()
  })

  it('leerer Body → 400 „Keine Änderungen"', async () => {
    const PATCH = await importAccountPatch()
    const res = await PATCH(makeReq({}))
    expect(res.status).toBe(400)
  })

  it('ohne Session → 401; Flag off → 404', async () => {
    let PATCH = await importAccountPatch()
    mockGetPartnerSession.mockResolvedValue(null)
    expect((await PATCH(makeReq({ company: 'X' }))).status).toBe(401)

    PATCH = await importAccountPatch(false)
    expect((await PATCH(makeReq({ company: 'X' }))).status).toBe(404)
  })
})

describe('POST /api/partner/account/password', () => {
  it('falsches aktuelles Passwort → 400 + field, kein Update', async () => {
    const POST = await importPasswordPost()
    mockCompare.mockResolvedValue(false)
    const res = await POST(makeReq({ currentPassword: 'wrong', newPassword: 'brandnew-secret-pw' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.field).toBe('currentPassword')
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('zu kurzes neues Passwort → 400 ohne bcrypt-Vergleich', async () => {
    const POST = await importPasswordPost()
    const res = await POST(makeReq({ currentPassword: 'current-pw', newPassword: 'short' }))
    expect(res.status).toBe(400)
    expect(mockCompare).not.toHaveBeenCalled()
  })

  it('Erfolg: Transaction mit Hash-Update + Token-Invalidierung + Audit', async () => {
    const POST = await importPasswordPost()
    const res = await POST(makeReq({ currentPassword: 'current-pw', newPassword: 'brandnew-secret-pw' }))
    expect(res.status).toBe(200)
    // Transaction wurde mit beiden Operationen aufgerufen
    expect(mockTransaction).toHaveBeenCalledTimes(1)
    expect(mockAccountUpdate).toHaveBeenCalledWith({
      where: { id: 'partner_A' },
      data: { passwordHash: 'new-hash' },
    })
    expect(mockTokenUpdateMany).toHaveBeenCalledWith({
      where: { partnerAccountId: 'partner_A', usedAt: null },
      data: { usedAt: expect.any(Date) },
    })
    expect(mockAuditCreate.mock.calls[0][0].data.action).toBe('PARTNER_PASSWORD_CHANGED')
  })

  it('gelöschter Account → 401', async () => {
    const POST = await importPasswordPost()
    mockAccountFindUnique.mockResolvedValue({ id: 'partner_A', passwordHash: 'h', deletedAt: new Date() })
    const res = await POST(makeReq({ currentPassword: 'current-pw', newPassword: 'brandnew-secret-pw' }))
    expect(res.status).toBe(401)
  })
})

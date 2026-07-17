/**
 * G2/G4-Regression: HR-Passwortwechsel — Rate-Limit, durabler Fehlversuchs-
 * zähler, passwordChangedAt-Invalidierung. Parität mit dem Partner-Flow.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockUserFindUnique = vi.fn()
const mockUserUpdate = vi.fn().mockResolvedValue({})
const mockAuditCount = vi.fn()
const mockAuditCreate = vi.fn().mockResolvedValue({})
const mockGetSession = vi.fn()
const mockRateLimit = vi.fn()
const mockCompare = vi.fn()
const mockHash = vi.fn().mockResolvedValue('new-hash')

async function importPatch() {
  vi.resetModules()
  vi.doMock('next-auth', () => ({ getServerSession: mockGetSession }))
  vi.doMock('@/lib/auth', () => ({ authOptions: {} }))
  vi.doMock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }))
  vi.doMock('@/lib/rate-limit', () => ({ rateLimit: mockRateLimit, getClientIp: () => '127.0.0.1' }))
  vi.doMock('bcryptjs', () => ({ default: { compare: mockCompare, hash: mockHash } }))
  vi.doMock('@/lib/db', () => ({
    prisma: {
      user: { findUnique: mockUserFindUnique, update: mockUserUpdate },
      auditLog: { count: mockAuditCount, create: mockAuditCreate },
    },
  }))
  return (await import('@/app/api/auth/profile/route')).PATCH
}

function makeReq(body: any): any {
  return { headers: new Headers(), json: async () => body }
}

beforeEach(() => {
  mockUserFindUnique.mockReset().mockResolvedValue({ password: 'old-hash' })
  mockUserUpdate.mockClear()
  mockAuditCount.mockReset().mockResolvedValue(0)
  mockAuditCreate.mockClear()
  mockGetSession.mockReset().mockResolvedValue({ user: { id: 'u1' } })
  mockRateLimit.mockReset().mockReturnValue({ ok: true, retryAfter: 0 })
  mockCompare.mockReset().mockResolvedValue(true)
})

describe('PATCH /api/auth/profile — Passwortwechsel-Härtung', () => {
  it('Erfolg: setzt password + passwordChangedAt + PASSWORD_CHANGED-Audit', async () => {
    const PATCH = await importPatch()
    const res = await PATCH(makeReq({ password: 'brandnew-pw', currentPassword: 'current' }))
    expect(res.status).toBe(200)
    const upd = mockUserUpdate.mock.calls[0][0]
    expect(upd.data.password).toBe('new-hash')
    expect(upd.data.passwordChangedAt).toBeInstanceOf(Date)
    expect(mockAuditCreate.mock.calls.some((c) => c[0].data.action === 'PASSWORD_CHANGED')).toBe(true)
  })

  it('falsches aktuelles Passwort → 400 + durabler FAILED-Zähler, kein Update', async () => {
    const PATCH = await importPatch()
    mockCompare.mockResolvedValue(false)
    const res = await PATCH(makeReq({ password: 'brandnew-pw', currentPassword: 'wrong' }))
    expect(res.status).toBe(400)
    expect(mockUserUpdate).not.toHaveBeenCalled()
    expect(mockAuditCreate.mock.calls[0][0].data.action).toBe('PASSWORD_CHANGE_FAILED')
  })

  it('5 DB-Fehlversuche in der letzten Stunde → 429 VOR bcrypt', async () => {
    const PATCH = await importPatch()
    mockAuditCount.mockResolvedValue(5)
    const res = await PATCH(makeReq({ password: 'brandnew-pw', currentPassword: 'guess' }))
    expect(res.status).toBe(429)
    expect(mockCompare).not.toHaveBeenCalled()
  })

  it('In-Memory-Rate-Limit erschöpft → 429', async () => {
    const PATCH = await importPatch()
    mockRateLimit.mockReturnValue({ ok: false, retryAfter: 1800 })
    const res = await PATCH(makeReq({ password: 'brandnew-pw', currentPassword: 'x' }))
    expect(res.status).toBe(429)
    expect(mockAuditCount).not.toHaveBeenCalled()
  })

  it('Namensänderung ohne Passwort → kein passwordChangedAt, kein Rate-Limit-Pfad', async () => {
    const PATCH = await importPatch()
    const res = await PATCH(makeReq({ name: 'Neuer Name' }))
    expect(res.status).toBe(200)
    expect(mockUserUpdate.mock.calls[0][0].data).toEqual({ name: 'Neuer Name' })
    expect(mockRateLimit).not.toHaveBeenCalled()
  })
})

/**
 * G8 — Core-Owner-Scoping auf Routen-Ebene.
 *
 * Beweist, dass die Kern-Routen (checks/[id], candidates/[id], gdpr/export)
 * IMMER auf den eingeloggten Mandanten (session.user.id) scopen und
 * fremde/anonyme Zugriffe abweisen — Schutz gegen IDOR/Datenleck.
 *
 * Getestet wird das Verhalten der Handler mit gemocktem NextAuth + Prisma;
 * kein Netzwerk, keine DB. Request = minimales Objekt mit .json().
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const getServerSession = vi.fn()

const prismaMock = {
  referenceCheck: { findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
  candidate: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
  gdprConsent: { findMany: vi.fn() },
  user: { findUnique: vi.fn() },
  auditLog: { create: vi.fn() },
}

function mockModules() {
  vi.resetModules()
  vi.doMock('server-only', () => ({}))
  vi.doMock('next-auth', () => ({ getServerSession }))
  vi.doMock('@/lib/auth', () => ({ authOptions: {} }))
  vi.doMock('@/lib/db', () => ({ prisma: prismaMock }))
  // Seiteneffekte im checks-Handler neutralisieren.
  vi.doMock('@/lib/check-notifications', () => ({
    assignRoundRobinIfEnabled: vi.fn().mockResolvedValue(null),
    notifyReviewerHandoff: vi.fn().mockResolvedValue(undefined),
    notifyRefereeArt14: vi.fn().mockResolvedValue(undefined),
  }))
  vi.doMock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }))
}

const jsonReq = (body: unknown) => ({ json: async () => body }) as any

beforeEach(() => {
  getServerSession.mockReset()
  Object.values(prismaMock).forEach((m) =>
    Object.values(m).forEach((fn) => (fn as any).mockReset()),
  )
})

// ── checks/[id] ────────────────────────────────────────────────────────────
describe('checks/[id] Owner-Scoping', () => {
  async function load() {
    mockModules()
    return import('@/app/api/checks/[id]/route')
  }

  it('PATCH ohne Session → 401', async () => {
    const { PATCH } = await load()
    getServerSession.mockResolvedValue(null)
    const res = await PATCH(jsonReq({ status: 'OPEN' }), { params: { id: 'c1' } })
    expect(res.status).toBe(401)
    expect(prismaMock.referenceCheck.findFirst).not.toHaveBeenCalled()
  })

  it('PATCH fremder Check (findFirst=null) → 404, kein update', async () => {
    const { PATCH } = await load()
    getServerSession.mockResolvedValue({ user: { id: 'owner-1' } })
    prismaMock.referenceCheck.findFirst.mockResolvedValue(null)
    const res = await PATCH(jsonReq({ status: 'OPEN' }), { params: { id: 'other' } })
    expect(res.status).toBe(404)
    // Scoping-Beweis: where enthält candidate.userId = session.user.id
    const where = prismaMock.referenceCheck.findFirst.mock.calls[0][0].where
    expect(where.id).toBe('other')
    expect(where.candidate.userId).toBe('owner-1')
    expect(prismaMock.referenceCheck.update).not.toHaveBeenCalled()
  })

  it('PATCH eigener Check → 200 + update auf die id', async () => {
    const { PATCH } = await load()
    getServerSession.mockResolvedValue({ user: { id: 'owner-1' } })
    prismaMock.referenceCheck.findFirst.mockResolvedValue({
      id: 'c1', status: 'OPEN',
      candidate: { firstName: 'A', lastName: 'B', position: 'X', user: { id: 'owner-1', name: 'N', email: 'e', company: 'C' } },
    })
    prismaMock.referenceCheck.update.mockResolvedValue({ id: 'c1', status: 'IN_PROGRESS' })
    const res = await PATCH(jsonReq({ status: 'IN_PROGRESS' }), { params: { id: 'c1' } })
    expect(res.status).toBe(200)
    expect(prismaMock.referenceCheck.update.mock.calls[0][0].where).toEqual({ id: 'c1' })
  })

  it('DELETE fremder Check → 404, kein delete', async () => {
    const { DELETE } = await load()
    getServerSession.mockResolvedValue({ user: { id: 'owner-1' } })
    prismaMock.referenceCheck.findFirst.mockResolvedValue(null)
    const res = await DELETE(jsonReq(null), { params: { id: 'other' } })
    expect(res.status).toBe(404)
    expect(prismaMock.referenceCheck.delete).not.toHaveBeenCalled()
  })
})

// ── candidates/[id] ─────────────────────────────────────────────────────────
describe('candidates/[id] Owner-Scoping', () => {
  async function load() {
    mockModules()
    return import('@/app/api/candidates/[id]/route')
  }

  it('PATCH ohne Session → 401', async () => {
    const { PATCH } = await load()
    getServerSession.mockResolvedValue(null)
    const res = await PATCH(jsonReq({ status: 'PENDING' }), { params: { id: 'k1' } })
    expect(res.status).toBe(401)
    expect(prismaMock.candidate.findFirst).not.toHaveBeenCalled()
  })

  it('PATCH fremder Kandidat → 404, where scoped auf userId', async () => {
    const { PATCH } = await load()
    getServerSession.mockResolvedValue({ user: { id: 'owner-1' } })
    prismaMock.candidate.findFirst.mockResolvedValue(null)
    const res = await PATCH(jsonReq({ status: 'PENDING' }), { params: { id: 'other' } })
    expect(res.status).toBe(404)
    expect(prismaMock.candidate.findFirst.mock.calls[0][0].where).toEqual({ id: 'other', userId: 'owner-1' })
    expect(prismaMock.candidate.update).not.toHaveBeenCalled()
  })

  it('DELETE eigener Kandidat → 200 + Audit-Log', async () => {
    const { DELETE } = await load()
    getServerSession.mockResolvedValue({ user: { id: 'owner-1' } })
    prismaMock.candidate.findFirst.mockResolvedValue({ id: 'k1', userId: 'owner-1' })
    prismaMock.candidate.delete.mockResolvedValue({})
    prismaMock.auditLog.create.mockResolvedValue({})
    const res = await DELETE(jsonReq(null), { params: { id: 'k1' } })
    expect(res.status).toBe(200)
    expect(prismaMock.candidate.delete.mock.calls[0][0].where).toEqual({ id: 'k1' })
    const audit = prismaMock.auditLog.create.mock.calls[0][0].data
    expect(audit).toMatchObject({ userId: 'owner-1', action: 'DELETE', entity: 'Candidate', entityId: 'k1' })
  })
})

// ── gdpr/export ─────────────────────────────────────────────────────────────
describe('gdpr/export Owner-Scoping', () => {
  async function load() {
    mockModules()
    return import('@/app/api/gdpr/export/route')
  }

  it('GET ohne Session → 401', async () => {
    const { GET } = await load()
    getServerSession.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled()
  })

  it('GET scoped ALLE Queries auf session.user.id', async () => {
    const { GET } = await load()
    getServerSession.mockResolvedValue({ user: { id: 'owner-1' } })
    prismaMock.user.findUnique.mockResolvedValue({ id: 'owner-1', name: 'N', email: 'e', company: 'C', createdAt: new Date() })
    prismaMock.candidate.findMany.mockResolvedValue([])
    prismaMock.gdprConsent.findMany.mockResolvedValue([])

    const res = await GET()
    expect(res.status).toBe(200)
    expect(prismaMock.user.findUnique.mock.calls[0][0].where).toEqual({ id: 'owner-1' })
    expect(prismaMock.candidate.findMany.mock.calls[0][0].where).toEqual({ userId: 'owner-1' })
    expect(prismaMock.gdprConsent.findMany.mock.calls[0][0].where).toEqual({ userId: 'owner-1' })

    const body = JSON.parse(await res.text())
    expect(body.account.id).toBe('owner-1')
    expect(body.exportedBy).toContain('Art. 20')
  })
})

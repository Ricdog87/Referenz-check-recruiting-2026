/**
 * G24-Regression: Monats-Kontingent für Referenzprüfungen.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockCount = vi.fn()

async function importQuota() {
  vi.resetModules()
  vi.doMock('server-only', () => ({}))
  vi.doMock('@/lib/db', () => ({
    prisma: { referenceCheck: { count: mockCount } },
  }))
  // echte Plan-Konfig aus lib/utils verwenden (getPlanById)
  return import('@/lib/quota')
}

beforeEach(() => {
  mockCount.mockReset()
})

describe('getCheckQuota', () => {
  it('STARTER (3 inkl.): erlaubt bei 2 genutzt, blockt bei 3', async () => {
    const { getCheckQuota } = await importQuota()

    mockCount.mockResolvedValue(2)
    let q = await getCheckQuota('u1', 'STARTER')
    expect(q).toMatchObject({ allowed: true, used: 2, limit: 3, unlimited: false })

    mockCount.mockResolvedValue(3)
    q = await getCheckQuota('u1', 'STARTER')
    expect(q.allowed).toBe(false)
  })

  it('PROFESSIONAL (12 inkl.): blockt erst ab 12', async () => {
    const { getCheckQuota } = await importQuota()
    mockCount.mockResolvedValue(11)
    expect((await getCheckQuota('u1', 'PROFESSIONAL')).allowed).toBe(true)
    mockCount.mockResolvedValue(12)
    expect((await getCheckQuota('u1', 'PROFESSIONAL')).allowed).toBe(false)
  })

  it('ENTERPRISE: unbegrenzt, auch bei hoher Nutzung', async () => {
    const { getCheckQuota } = await importQuota()
    mockCount.mockResolvedValue(9999)
    const q = await getCheckQuota('u1', 'ENTERPRISE')
    expect(q.unlimited).toBe(true)
    expect(q.allowed).toBe(true)
  })

  it('zählt nur Checks ab Monatsanfang (createdAt >= gte)', async () => {
    const { getCheckQuota } = await importQuota()
    mockCount.mockResolvedValue(0)
    await getCheckQuota('u1', 'STARTER')
    const arg = mockCount.mock.calls[0][0]
    expect(arg.where.candidate).toEqual({ userId: 'u1' })
    expect(arg.where.createdAt.gte).toBeInstanceOf(Date)
    // gte ist der 1. des aktuellen Monats, 00:00
    expect(arg.where.createdAt.gte.getDate()).toBe(1)
  })

  it('unbekannter Plan → Fallback STARTER-Limit', async () => {
    const { getCheckQuota } = await importQuota()
    mockCount.mockResolvedValue(3)
    // getPlanById fällt bei unbekanntem Plan auf STARTER (3) zurück
    expect((await getCheckQuota('u1', 'GHOST_PLAN')).allowed).toBe(false)
  })
})

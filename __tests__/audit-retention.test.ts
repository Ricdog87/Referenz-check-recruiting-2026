/**
 * G10 — AuditLog-Pseudonymisierung nach Frist.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const findMany = vi.fn()
const update = vi.fn()

async function importMod(envDays?: string) {
  vi.resetModules()
  vi.doMock('server-only', () => ({}))
  vi.doMock('@/lib/db', () => ({ prisma: { auditLog: { findMany, update } } }))
  if (envDays !== undefined) process.env.AUDIT_PII_RETENTION_DAYS = envDays
  else delete process.env.AUDIT_PII_RETENTION_DAYS
  // echte redact-Logik verwenden (kein Mock) — beweist die Maskierung
  return import('@/lib/audit-retention')
}

beforeEach(() => {
  findMany.mockReset()
  update.mockReset().mockResolvedValue({})
})

afterEach(() => {
  delete process.env.AUDIT_PII_RETENTION_DAYS
})

describe('pseudonymizeStaleAuditLogs', () => {
  it('nullt userId/ip und maskiert E-Mails in details', async () => {
    const { pseudonymizeStaleAuditLogs } = await importMod()
    findMany.mockResolvedValue([
      { id: 'a1', details: 'to=max.mustermann@example.com subject=x' },
      { id: 'a2', details: null },
    ])

    const res = await pseudonymizeStaleAuditLogs({ now: new Date(2026, 6, 17) })
    expect(res).toEqual({ scanned: 2, pseudonymized: 2 })

    expect(update.mock.calls[0][0]).toEqual({
      where: { id: 'a1' },
      data: { userId: null, ip: null, details: 'to=m***@example.com subject=x' },
    })
    // details=null bleibt null
    expect(update.mock.calls[1][0].data.details).toBeNull()
  })

  it('Filter: älter als Frist UND noch Personenbezug (userId/ip/@)', async () => {
    const { pseudonymizeStaleAuditLogs, AUDIT_PII_RETENTION_DAYS } = await importMod()
    findMany.mockResolvedValue([])
    const now = new Date(2026, 6, 17)
    await pseudonymizeStaleAuditLogs({ now })

    const where = findMany.mock.calls[0][0].where
    const diffDays = (now.getTime() - where.createdAt.lt.getTime()) / (24 * 3600 * 1000)
    expect(diffDays).toBe(AUDIT_PII_RETENTION_DAYS)
    expect(where.OR).toEqual([
      { userId: { not: null } },
      { ip: { not: null } },
      { details: { contains: '@' } },
    ])
  })

  it('respektiert batchSize (take)', async () => {
    const { pseudonymizeStaleAuditLogs } = await importMod()
    findMany.mockResolvedValue([])
    await pseudonymizeStaleAuditLogs({ now: new Date(2026, 6, 17), batchSize: 50 })
    expect(findMany.mock.calls[0][0].take).toBe(50)
  })

  it('leeres Ergebnis → nichts aktualisiert', async () => {
    const { pseudonymizeStaleAuditLogs } = await importMod()
    findMany.mockResolvedValue([])
    const res = await pseudonymizeStaleAuditLogs({ now: new Date(2026, 6, 17) })
    expect(res).toEqual({ scanned: 0, pseudonymized: 0 })
    expect(update).not.toHaveBeenCalled()
  })

  it('ENV AUDIT_PII_RETENTION_DAYS überschreibt die Frist', async () => {
    const { AUDIT_PII_RETENTION_DAYS } = await importMod('90')
    expect(AUDIT_PII_RETENTION_DAYS).toBe(90)
  })
})

/**
 * G9-Regression: Der Cleanup-Cron löscht jetzt auch die Neben-PII-Tabellen
 * (LeadMagnetRequest, PilotApplication[REJECTED/WITHDRAWN], CvAnalysisReport).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const dm = {
  consentToken: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }), count: vi.fn().mockResolvedValue(0) },
  leadMagnetRequest: { deleteMany: vi.fn().mockResolvedValue({ count: 3 }) },
  pilotApplication: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
  cvAnalysisReport: { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) },
  candidate: { findMany: vi.fn().mockResolvedValue([]), deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
  document: { findMany: vi.fn().mockResolvedValue([]) },
  referenceCheck: { findMany: vi.fn().mockResolvedValue([]) },
  auditLog: {
    create: vi.fn().mockResolvedValue({}),
    // G10-Pseudonymisierung: der Cleanup ruft findMany/update auf auditLog.
    findMany: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue({}),
  },
}

async function importGet() {
  vi.resetModules()
  process.env.CRON_SECRET = 'secret'
  vi.doMock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }))
  vi.doMock('@/lib/blob-cleanup', () => ({
    deleteBlobUrls: vi.fn().mockResolvedValue({ deleted: 0, failed: 0 }),
    deleteBlobsByPrefix: vi.fn().mockResolvedValue({ deleted: 0, failed: 0 }),
  }))
  vi.doMock('@/lib/db', () => ({
    prisma: {
      ...dm,
      $transaction: async (fn: any) => fn(dm),
    },
  }))
  return (await import('@/app/api/cron/cleanup/route')).GET
}

function makeReq(auth?: string): any {
  return { headers: new Headers(auth ? { authorization: auth } : {}) }
}

beforeEach(() => {
  Object.values(dm).forEach((m: any) => Object.values(m).forEach((fn: any) => fn.mockClear?.()))
})

describe('cron/cleanup — Retention Neben-Tabellen (G9)', () => {
  it('401 ohne CRON_SECRET-Bearer', async () => {
    const GET = await importGet()
    const res = await GET(makeReq('Bearer wrong'))
    expect(res.status).toBe(401)
    expect(dm.leadMagnetRequest.deleteMany).not.toHaveBeenCalled()
  })

  it('löscht LeadMagnet + CvAnalysisReport + PilotApplication(final) nach Frist', async () => {
    const GET = await importGet()
    const res = await GET(makeReq('Bearer secret'))
    expect(res.status).toBe(200)
    expect(dm.leadMagnetRequest.deleteMany).toHaveBeenCalledTimes(1)
    expect(dm.cvAnalysisReport.deleteMany).toHaveBeenCalledTimes(1)
    // Pilot: nur Endzustände
    const pilotWhere = dm.pilotApplication.deleteMany.mock.calls[0][0].where
    expect(pilotWhere.status).toEqual({ in: ['REJECTED', 'WITHDRAWN'] })
    const data = await res.json()
    expect(data.deleted.leadMagnetsDeleted).toBe(3)
    expect(data.deleted.cvReportsDeleted).toBe(2)
    expect(data.deleted.pilotsDeleted).toBe(1)
    // G10: Pseudonymisierung lief mit (hier 0 Treffer) und wird gemeldet.
    expect(dm.auditLog.findMany).toHaveBeenCalledTimes(1)
    expect(data.auditPseudonymized).toBe(0)
  })
})

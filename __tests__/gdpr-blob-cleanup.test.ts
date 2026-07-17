/**
 * R2-Regression: DSGVO-Löschung entfernt tatsächlich die Blob-Dateien.
 *
 * (a) lib/blob-cleanup: Filterung, No-Token-Verhalten, Fehler-Zählung.
 * (b) DELETE /api/gdpr/delete: sammelt Blob-Referenzen VOR dem DB-Delete
 *     und löscht sie NACH erfolgreichem User-Delete.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// ── (a) blob-cleanup Helper ──────────────────────────────────────────
const mockDel = vi.fn()
const mockList = vi.fn()

async function importCleanup(withToken: boolean) {
  vi.resetModules()
  if (withToken) process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_test'
  else delete process.env.BLOB_READ_WRITE_TOKEN
  vi.doMock('@vercel/blob', () => ({ del: mockDel, list: mockList }))
  vi.doMock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }))
  return import('@/lib/blob-cleanup')
}

beforeEach(() => {
  mockDel.mockReset().mockResolvedValue(undefined)
  mockList.mockReset().mockResolvedValue({ blobs: [] })
})

describe('lib/blob-cleanup — deleteBlobUrls', () => {
  it('filtert leere/duplizierte/nicht-http Einträge und löscht den Rest', async () => {
    const { deleteBlobUrls } = await importCleanup(true)
    const r = await deleteBlobUrls([
      'https://blob/a.pdf',
      'https://blob/a.pdf', // dup
      '',
      null,
      undefined,
      'not-a-url',
      'https://blob/b.pdf',
    ])
    expect(r).toEqual({ deleted: 2, failed: 0 })
    expect(mockDel).toHaveBeenCalledTimes(2)
  })

  it('zählt Fehlschläge einzeln, ohne den Rest abzubrechen', async () => {
    const { deleteBlobUrls } = await importCleanup(true)
    mockDel.mockRejectedValueOnce(new Error('gone')).mockResolvedValue(undefined)
    const r = await deleteBlobUrls(['https://blob/a.pdf', 'https://blob/b.pdf'])
    expect(r.deleted).toBe(1)
    expect(r.failed).toBe(1)
  })

  it('ohne BLOB_READ_WRITE_TOKEN: löscht nichts, meldet failed=Anzahl', async () => {
    const { deleteBlobUrls } = await importCleanup(false)
    const r = await deleteBlobUrls(['https://blob/a.pdf'])
    expect(r).toEqual({ deleted: 0, failed: 1 })
    expect(mockDel).not.toHaveBeenCalled()
  })

  it('deleteBlobsByPrefix: listet + löscht alle Treffer', async () => {
    const { deleteBlobsByPrefix } = await importCleanup(true)
    mockList.mockResolvedValue({ blobs: [{ url: 'https://blob/reports/c1/r.pdf' }] })
    const r = await deleteBlobsByPrefix('reports/c1/')
    expect(mockList).toHaveBeenCalledWith({ prefix: 'reports/c1/' })
    expect(r.deleted).toBe(1)
  })
})

// ── (b) DELETE /api/gdpr/delete ──────────────────────────────────────
const mockDocFindMany = vi.fn()
const mockCheckFindMany = vi.fn()
const mockUserDelete = vi.fn()
const mockAuditCreate = vi.fn().mockResolvedValue({})
const mockGetSession = vi.fn()
const mockDeleteBlobUrls = vi.fn()
const mockDeleteBlobsByPrefix = vi.fn()

async function importGdprDelete() {
  vi.resetModules()
  vi.doMock('next-auth', () => ({ getServerSession: mockGetSession }))
  vi.doMock('@/lib/auth', () => ({ authOptions: {} }))
  vi.doMock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }))
  vi.doMock('@/lib/blob-cleanup', () => ({
    deleteBlobUrls: mockDeleteBlobUrls,
    deleteBlobsByPrefix: mockDeleteBlobsByPrefix,
  }))
  vi.doMock('@/lib/db', () => ({
    prisma: {
      document: { findMany: mockDocFindMany },
      referenceCheck: { findMany: mockCheckFindMany },
      user: { delete: mockUserDelete },
      auditLog: { create: mockAuditCreate },
    },
  }))
  return (await import('@/app/api/gdpr/delete/route')).DELETE
}

beforeEach(() => {
  mockDocFindMany.mockReset().mockResolvedValue([{ path: 'https://blob/cv.pdf' }])
  mockCheckFindMany.mockReset().mockResolvedValue([{ id: 'chk_1' }])
  mockUserDelete.mockReset().mockResolvedValue({})
  mockAuditCreate.mockClear()
  mockGetSession.mockReset().mockResolvedValue({ user: { id: 'user_1' } })
  mockDeleteBlobUrls.mockReset().mockResolvedValue({ deleted: 1, failed: 0 })
  mockDeleteBlobsByPrefix.mockReset().mockResolvedValue({ deleted: 1, failed: 0 })
})

describe('DELETE /api/gdpr/delete — R2 Blob-Löschung', () => {
  it('401 ohne Session, kein DB-/Blob-Zugriff', async () => {
    const DELETE = await importGdprDelete()
    mockGetSession.mockResolvedValue(null)
    const res = await DELETE()
    expect(res.status).toBe(401)
    expect(mockUserDelete).not.toHaveBeenCalled()
    expect(mockDeleteBlobUrls).not.toHaveBeenCalled()
  })

  it('sammelt Blobs VOR dem User-Delete und löscht sie DANACH', async () => {
    const DELETE = await importGdprDelete()
    const order: string[] = []
    mockDocFindMany.mockImplementation(async () => { order.push('collect'); return [{ path: 'https://blob/cv.pdf' }] })
    mockUserDelete.mockImplementation(async () => { order.push('db-delete'); return {} })
    mockDeleteBlobUrls.mockImplementation(async () => { order.push('blob-delete'); return { deleted: 1, failed: 0 } })

    const res = await DELETE()
    expect(res.status).toBe(200)
    // Reihenfolge: erst sammeln, dann DB löschen, dann Blobs
    expect(order).toEqual(['collect', 'db-delete', 'blob-delete'])
    expect(mockDeleteBlobUrls).toHaveBeenCalledWith(['https://blob/cv.pdf'])
    expect(mockDeleteBlobsByPrefix).toHaveBeenCalledWith('reports/chk_1/')
    expect(mockAuditCreate.mock.calls[0][0].data.action).toBe('GDPR_ACCOUNT_DELETED')
  })

  it('DB-Delete-Fehler → 503, KEINE Blob-Löschung (Daten bleiben konsistent)', async () => {
    const DELETE = await importGdprDelete()
    mockUserDelete.mockRejectedValue(new Error('db down'))
    const res = await DELETE()
    expect(res.status).toBe(503)
    expect(mockDeleteBlobUrls).not.toHaveBeenCalled()
  })

  it('meldet blobsFailed in der Response, failt aber nicht die Löschung', async () => {
    const DELETE = await importGdprDelete()
    mockDeleteBlobUrls.mockResolvedValue({ deleted: 0, failed: 1 })
    mockDeleteBlobsByPrefix.mockResolvedValue({ deleted: 0, failed: 0 })
    const res = await DELETE()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.blobsFailed).toBe(1)
  })
})

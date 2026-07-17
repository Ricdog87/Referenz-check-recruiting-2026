/**
 * Phase 2 — zvoove-Sync-Orchestrierung.
 *
 * Beweist: Import legt Kandidaten NUR consent-safe an (gdprConsent=false,
 * PENDING, Checks OPEN), ist idempotent, und Push-Back respektiert Ownership
 * + COMPLETED-Status. Gegen MockZvooveClient + gemocktes Prisma.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const db = {
  zvooveConnection: { findUnique: vi.fn() },
  zvooveCandidateMap: { findUnique: vi.fn(), create: vi.fn() },
  zvooveSyncLog: { create: vi.fn() },
  candidate: { create: vi.fn() },
  referenceCheck: { create: vi.fn(), findFirst: vi.fn() },
}

async function importMod() {
  vi.resetModules()
  vi.doMock('server-only', () => ({}))
  vi.doMock('@/lib/db', () => ({ prisma: {} }))
  vi.doMock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))
  return import('@/lib/integrations/zvoove/sync')
}

async function importMock() {
  return import('@/lib/integrations/zvoove/__mocks__/MockZvooveClient')
}

beforeEach(() => {
  Object.values(db).forEach((m) => Object.values(m).forEach((fn: any) => fn.mockReset()))
  db.zvooveCandidateMap.findUnique.mockResolvedValue(null)
  db.candidate.create.mockImplementation(async (a: any) => ({ id: 'cand_' + a.data.firstName, ...a.data }))
  db.referenceCheck.create.mockResolvedValue({})
  db.zvooveCandidateMap.create.mockResolvedValue({})
  db.zvooveSyncLog.create.mockResolvedValue({})
})

describe('importZvooveCandidates', () => {
  it('legt Kandidaten consent-safe an (PENDING, gdprConsent=false)', async () => {
    const { importZvooveCandidates } = await importMod()
    const { MockZvooveClient, FIXTURE_CANDIDATE_BASIC } = await importMock()
    const client = new MockZvooveClient([FIXTURE_CANDIDATE_BASIC])

    const res = await importZvooveCandidates({ workspaceId: 'ws1', client: client as any, db: db as any })
    expect(res.imported).toBe(1)

    const created = db.candidate.create.mock.calls[0][0].data
    expect(created.gdprConsent).toBe(false)
    expect(created.gdprConsentDate).toBeNull()
    expect(created.status).toBe('PENDING')
    expect(created.userId).toBe('ws1')
    expect(created.firstName).toBe('Anna')
  })

  it('legt ReferenceChecks im Status OPEN an (keine Reviewer-Sichtbarkeit)', async () => {
    const { importZvooveCandidates } = await importMod()
    const { MockZvooveClient, FIXTURE_CANDIDATE_BASIC } = await importMock()
    const client = new MockZvooveClient([FIXTURE_CANDIDATE_BASIC])

    await importZvooveCandidates({ workspaceId: 'ws1', client: client as any, db: db as any })
    // FIXTURE_CANDIDATE_BASIC hat 2 Experiences → 2 Checks
    expect(db.referenceCheck.create).toHaveBeenCalledTimes(2)
    for (const call of db.referenceCheck.create.mock.calls) {
      expect(call[0].data.status).toBe('OPEN')
      // Referenzgeber-Kontaktdaten kommen NICHT aus zvoove
      expect(call[0].data.employerEmail).toBeUndefined()
      expect(call[0].data.employerPhone).toBeUndefined()
    }
  })

  it('schreibt Map + SyncLog (OK) je Import', async () => {
    const { importZvooveCandidates } = await importMod()
    const { MockZvooveClient, FIXTURE_CANDIDATE_MINIMAL } = await importMock()
    const client = new MockZvooveClient([FIXTURE_CANDIDATE_MINIMAL])

    await importZvooveCandidates({ workspaceId: 'ws1', client: client as any, db: db as any })
    expect(db.zvooveCandidateMap.create.mock.calls[0][0].data).toMatchObject({
      workspaceId: 'ws1', zvooveCandidateId: 'zv_002', syncState: 'SYNCED',
    })
    expect(db.zvooveSyncLog.create.mock.calls[0][0].data).toMatchObject({ action: 'import_candidate', status: 'OK' })
  })

  it('ist idempotent: bereits gemappte Kandidaten werden übersprungen', async () => {
    const { importZvooveCandidates } = await importMod()
    const { MockZvooveClient, FIXTURE_CANDIDATE_BASIC } = await importMock()
    const client = new MockZvooveClient([FIXTURE_CANDIDATE_BASIC])
    db.zvooveCandidateMap.findUnique.mockResolvedValue({ id: 'map1', externalHash: 'x' })

    const res = await importZvooveCandidates({ workspaceId: 'ws1', client: client as any, db: db as any })
    expect(res).toMatchObject({ imported: 0, skipped: 1 })
    expect(db.candidate.create).not.toHaveBeenCalled()
  })
})

describe('pushZvooveResult', () => {
  it('pusht Ergebnis eines COMPLETED-Checks + loggt', async () => {
    const { pushZvooveResult } = await importMod()
    const { MockZvooveClient } = await importMock()
    const client = new MockZvooveClient([])
    db.referenceCheck.findFirst.mockResolvedValue({
      id: 'chk1', candidateId: 'cand1', status: 'COMPLETED', result: 'VERIFIED',
      discrepancies: null, updatedAt: new Date('2026-07-01T00:00:00Z'),
    })
    db.zvooveCandidateMap.findUnique.mockResolvedValue({ zvooveCandidateId: 'zv_001' })

    const res = await pushZvooveResult({ workspaceId: 'ws1', checkId: 'chk1', client: client as any, baseUrl: 'https://candiq.de', db: db as any })
    expect(res.ok).toBe(true)
    expect(client.pushed[0]).toMatchObject({
      candidateId: 'zv_001', result: 'VERIFIED', reportUrl: 'https://candiq.de/report/check/chk1',
    })
    expect(db.zvooveSyncLog.create.mock.calls[0][0].data).toMatchObject({ action: 'push_result', status: 'OK' })
  })

  it('verweigert Push für nicht-abgeschlossene Checks', async () => {
    const { pushZvooveResult } = await importMod()
    const { MockZvooveClient } = await importMock()
    const client = new MockZvooveClient([])
    db.referenceCheck.findFirst.mockResolvedValue({ id: 'chk1', candidateId: 'c1', status: 'OPEN' })
    const res = await pushZvooveResult({ workspaceId: 'ws1', checkId: 'chk1', client: client as any, baseUrl: 'x', db: db as any })
    expect(res).toEqual({ ok: false, reason: 'not_completed' })
    expect(client.pushed).toHaveLength(0)
  })

  it('verweigert Push für fremde/unbekannte Checks (Ownership)', async () => {
    const { pushZvooveResult } = await importMod()
    const { MockZvooveClient } = await importMock()
    const client = new MockZvooveClient([])
    db.referenceCheck.findFirst.mockResolvedValue(null)
    const res = await pushZvooveResult({ workspaceId: 'ws1', checkId: 'other', client: client as any, baseUrl: 'x', db: db as any })
    expect(res).toEqual({ ok: false, reason: 'not_found' })
    // Scoping-Beweis
    expect(db.referenceCheck.findFirst.mock.calls[0][0].where.candidate).toEqual({ userId: 'ws1' })
  })

  it('kein zvoove-Link → reason no_zvoove_link', async () => {
    const { pushZvooveResult } = await importMod()
    const { MockZvooveClient } = await importMock()
    const client = new MockZvooveClient([])
    db.referenceCheck.findFirst.mockResolvedValue({ id: 'chk1', candidateId: 'c1', status: 'COMPLETED', result: 'VERIFIED', updatedAt: new Date() })
    db.zvooveCandidateMap.findUnique.mockResolvedValue(null)
    const res = await pushZvooveResult({ workspaceId: 'ws1', checkId: 'chk1', client: client as any, baseUrl: 'x', db: db as any })
    expect(res).toEqual({ ok: false, reason: 'no_zvoove_link' })
  })
})

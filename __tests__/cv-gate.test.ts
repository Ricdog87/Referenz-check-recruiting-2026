/**
 * __tests__/cv-gate.test.ts
 *
 * Beweis-Tests fuer den CV-Consent-Gate. Pure Unit-Tests ohne DB —
 * die einzige Entscheidungs-Funktion (`hasCvAccess`) wird isoliert
 * gegen alle Actor x Status-Kombinationen geprueft.
 *
 * Zusaetzlich: Integration-Test fuer GET /api/documents/:id mit
 * gemocktem Prisma + Session — beweist, dass die Route die Gate-Logik
 * korrekt durchreicht und 403 bei fehlendem Consent feuert.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hasCvAccess, CV_STATUS, type CvAccessActor } from '@/lib/cv-gate'

describe('hasCvAccess — Reviewer-Pfad (sicherheitskritisch)', () => {
  const cv = (cvStatus: string) =>
    ({ type: 'CV', cvStatus, candidate: { userId: 'hr_owner_1' } }) as const

  it('DENIES Reviewer bei cvStatus=AWAITING_CONSENT', () => {
    const r = hasCvAccess(cv(CV_STATUS.AWAITING), { kind: 'reviewer' })
    expect(r.allowed).toBe(false)
    if (!r.allowed) {
      expect(r.reason).toContain('cv_status_not_released')
      expect(r.reason).toContain('AWAITING_CONSENT')
    }
  })

  it('DENIES Reviewer bei cvStatus=REVOKED', () => {
    const r = hasCvAccess(cv(CV_STATUS.REVOKED), { kind: 'reviewer' })
    expect(r.allowed).toBe(false)
    if (!r.allowed) {
      expect(r.reason).toContain('cv_status_not_released')
      expect(r.reason).toContain('REVOKED')
    }
  })

  it('ALLOWS Reviewer NUR bei cvStatus=RELEASED', () => {
    const r = hasCvAccess(cv(CV_STATUS.RELEASED), { kind: 'reviewer' })
    expect(r.allowed).toBe(true)
  })

  it('DENIES Reviewer bei irgendeinem unbekannten Status (defense-in-depth)', () => {
    const r = hasCvAccess(cv('SOMETHING_RANDOM'), { kind: 'reviewer' })
    expect(r.allowed).toBe(false)
  })
})

describe('hasCvAccess — HR-Owner-Pfad', () => {
  const cv = (cvStatus: string, ownerId = 'hr_owner_1') =>
    ({ type: 'CV', cvStatus, candidate: { userId: ownerId } }) as const

  it('ALLOWS HR-Owner unabhaengig vom cvStatus (eigener Upload)', () => {
    for (const s of [CV_STATUS.AWAITING, CV_STATUS.RELEASED, CV_STATUS.REVOKED]) {
      const r = hasCvAccess(cv(s), { kind: 'owner', userId: 'hr_owner_1' })
      expect(r.allowed, `expected allowed for status=${s}`).toBe(true)
    }
  })

  it('DENIES fremde HR-User selbst bei RELEASED (cross-tenant Schutz)', () => {
    const r = hasCvAccess(cv(CV_STATUS.RELEASED, 'hr_owner_1'), {
      kind: 'owner',
      userId: 'hr_owner_2',
    })
    expect(r.allowed).toBe(false)
    if (!r.allowed) expect(r.reason).toBe('not_owner')
  })

  it('DENIES Owner-Actor ohne Candidate-Relation (defensive)', () => {
    const r = hasCvAccess(
      { type: 'CV', cvStatus: CV_STATUS.RELEASED, candidate: null },
      { kind: 'owner', userId: 'hr_owner_1' },
    )
    expect(r.allowed).toBe(false)
  })
})

describe('hasCvAccess — Public', () => {
  it('DENIES anonymen Zugriff immer (selbst bei RELEASED)', () => {
    const r = hasCvAccess(
      { type: 'CV', cvStatus: CV_STATUS.RELEASED, candidate: { userId: 'x' } },
      { kind: 'public' },
    )
    expect(r.allowed).toBe(false)
    if (!r.allowed) expect(r.reason).toBe('unauthenticated')
  })
})

describe('hasCvAccess — Non-CV-Documents', () => {
  it('ALLOWS non-CV Documents unabhaengig vom Gate', () => {
    // CERTIFICATE/REFERENCE/OTHER haben ihre eigene Autorisierung,
    // sie laufen NICHT durch diesen Gate.
    for (const docType of ['CERTIFICATE', 'REFERENCE', 'OTHER']) {
      const r = hasCvAccess(
        { type: docType, cvStatus: CV_STATUS.AWAITING, candidate: { userId: 'x' } },
        { kind: 'reviewer' },
      )
      expect(r.allowed, `expected allowed for docType=${docType}`).toBe(true)
    }
  })
})

// ─────────────────────────────────────────────────────────────────
// Integration-Test fuer den Endpoint GET /api/documents/:id
// Mockt Prisma + NextAuth. Beweist: Reviewer → 403 bei AWAITING,
// 302-Redirect bei RELEASED. HR-Owner → 302 unabhaengig vom Status.
// ─────────────────────────────────────────────────────────────────

describe('GET /api/documents/[id] — Route mit Gate-Enforcement', () => {
  const mockFindUnique = vi.fn()
  const mockAuditCreate = vi.fn().mockResolvedValue({})
  const mockGetServerSession = vi.fn()

  beforeEach(() => {
    vi.resetModules()
    mockFindUnique.mockReset()
    mockAuditCreate.mockClear()
    mockGetServerSession.mockReset()
  })

  async function importHandler() {
    vi.doMock('next-auth', () => ({ getServerSession: mockGetServerSession }))
    vi.doMock('@/lib/auth', () => ({ authOptions: {} }))
    vi.doMock('@/lib/db', () => ({
      prisma: {
        document: { findUnique: mockFindUnique },
        auditLog: { create: mockAuditCreate },
      },
    }))
    const mod = await import('@/app/api/documents/[id]/route')
    return mod.GET
  }

  function makeReq() {
    return {
      headers: new Map(),
      url: 'https://candiq.de/api/documents/doc_1',
    } as unknown as Request
  }

  // Mock global fetch fuer den Stream-Proxy: liefert „Datei-Inhalt".
  const fetchMock = vi.fn()
  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({
      ok: true,
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([0x25, 0x50, 0x44, 0x46])) // %PDF
          controller.close()
        },
      }),
      headers: new Map([
        ['content-type', 'application/pdf'],
        ['content-length', '4'],
      ]),
    })
    ;(globalThis as any).fetch = fetchMock
  })

  it('401, wenn nicht eingeloggt', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const handler = await importHandler()
    const res = await handler(makeReq() as any, { params: { id: 'doc_1' } })
    expect(res.status).toBe(401)
  })

  it('404, wenn Document nicht existiert', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'u', role: 'CLIENT' } })
    mockFindUnique.mockResolvedValue(null)
    const handler = await importHandler()
    const res = await handler(makeReq() as any, { params: { id: 'nope' } })
    expect(res.status).toBe(404)
  })

  it('403 fuer Reviewer bei cvStatus=AWAITING_CONSENT', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'reviewer_1', role: 'REVIEWER' },
    })
    mockFindUnique.mockResolvedValue({
      id: 'doc_1',
      type: 'CV',
      cvStatus: 'AWAITING_CONSENT',
      path: 'https://blob/x',
      candidate: { userId: 'hr_owner_1' },
    })
    const handler = await importHandler()
    const res = await handler(makeReq() as any, { params: { id: 'doc_1' } })
    expect(res.status).toBe(403)
    const audit = mockAuditCreate.mock.calls[0]?.[0]
    expect(audit?.data.action).toBe('CV_ACCESS_DENIED')
  })

  it('200-Stream (kein Blob-URL-Leak!) fuer Reviewer bei cvStatus=RELEASED', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'reviewer_1', role: 'REVIEWER' },
    })
    mockFindUnique.mockResolvedValue({
      id: 'doc_1',
      type: 'CV',
      cvStatus: 'RELEASED',
      path: 'https://blob.example/x.pdf',
      mimeType: 'application/pdf',
      originalName: 'cv.pdf',
      candidate: { userId: 'hr_owner_1' },
    })
    const handler = await importHandler()
    const res = await handler(makeReq() as any, { params: { id: 'doc_1' } })
    expect(res.status).toBe(200)
    // KRITISCH: KEIN Location-Header, der die Blob-URL leaken wuerde
    expect(res.headers.get('location')).toBeNull()
    expect(res.headers.get('content-type')).toContain('application/pdf')
    expect(res.headers.get('cache-control')).toContain('private')
    // Stream wurde vom upstream Vercel-Blob gezogen
    expect(fetchMock).toHaveBeenCalledWith('https://blob.example/x.pdf')
    const audit = mockAuditCreate.mock.calls[0]?.[0]
    expect(audit?.data.action).toBe('CV_ACCESS_GRANTED')
  })

  it('200-Stream fuer HR-Owner SELBST bei AWAITING_CONSENT (eigener Upload)', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'hr_owner_1', role: 'CLIENT' },
    })
    mockFindUnique.mockResolvedValue({
      id: 'doc_1',
      type: 'CV',
      cvStatus: 'AWAITING_CONSENT',
      path: 'https://blob.example/x.pdf',
      mimeType: 'application/pdf',
      originalName: 'cv.pdf',
      candidate: { userId: 'hr_owner_1' },
    })
    const handler = await importHandler()
    const res = await handler(makeReq() as any, { params: { id: 'doc_1' } })
    expect(res.status).toBe(200)
    expect(res.headers.get('location')).toBeNull()
  })

  it('403 fuer FREMDEN HR-User selbst bei RELEASED (cross-tenant)', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'hr_owner_2', role: 'CLIENT' },
    })
    mockFindUnique.mockResolvedValue({
      id: 'doc_1',
      type: 'CV',
      cvStatus: 'RELEASED',
      path: 'https://blob.example/x.pdf',
      candidate: { userId: 'hr_owner_1' },
    })
    const handler = await importHandler()
    const res = await handler(makeReq() as any, { params: { id: 'doc_1' } })
    expect(res.status).toBe(403)
  })
})

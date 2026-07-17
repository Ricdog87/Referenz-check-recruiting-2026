/**
 * G7 — Consent-Lifecycle-Routen (accept / revoke).
 *
 * Beweist die Zustandsübergänge, die das CV-Gate steuern:
 *   accept  → ConsentToken=ACCEPTED, Candidate=CONSENT_GIVEN, Referenzgeber
 *             als OPEN-Checks, CVs RELEASED, Audit CONSENT_ACCEPTED
 *   revoke  → ConsentToken=REVOKED, Candidate=CONSENT_REVOKED (gdprConsent
 *             false), offene Checks CANCELLED, CVs REVOKED, Audit CONSENT_REVOKED
 *
 * Alles gegen gemockte Prisma-Transaktion + gemockte cv-gate-Helfer; kein
 * Consent-Gate-Code wird verändert, nur sein Aufruf verifiziert.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const loadConsentByToken = vi.fn()
const rateLimit = vi.fn()
const sendEmail = vi.fn()
const releaseAllCvsForCandidate = vi.fn()
const revokeAllCvsForCandidate = vi.fn()

const tx = {
  consentToken: { update: vi.fn() },
  candidate: { update: vi.fn() },
  referenceCheck: { create: vi.fn(), updateMany: vi.fn() },
  auditLog: { create: vi.fn() },
}
const prismaMock = {
  $transaction: vi.fn(async (cb: any) => cb(tx)),
  user: { findFirst: vi.fn() },
  candidate: { findUnique: vi.fn() },
}

function mockModules() {
  vi.resetModules()
  vi.doMock('server-only', () => ({}))
  vi.doMock('@/lib/db', () => ({ prisma: prismaMock }))
  vi.doMock('@/lib/consent-token', () => ({ loadConsentByToken }))
  vi.doMock('@/lib/rate-limit', () => ({ rateLimit }))
  vi.doMock('@/lib/email', () => ({
    sendEmail,
    consentAcceptedNotifyHrEmail: () => ({ subject: 's', html: 'h', text: 't' }),
    consentRevokedNotifyHrEmail: () => ({ subject: 's', html: 'h', text: 't' }),
  }))
  vi.doMock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))
  vi.doMock('@/lib/cv-gate', () => ({ releaseAllCvsForCandidate, revokeAllCvsForCandidate }))
}

function req(body: unknown, headers: Record<string, string> = {}) {
  const h = new Map(Object.entries({ 'x-forwarded-for': '203.0.113.9', ...headers }))
  return {
    headers: { get: (k: string) => h.get(k) ?? null },
    json: async () => body,
  } as any
}

const okRateLimit = () => rateLimit.mockReturnValue({ ok: true })

beforeEach(() => {
  ;[loadConsentByToken, rateLimit, sendEmail, releaseAllCvsForCandidate, revokeAllCvsForCandidate].forEach((f) => f.mockReset())
  prismaMock.$transaction.mockClear()
  prismaMock.user.findFirst.mockReset().mockResolvedValue(null)
  prismaMock.candidate.findUnique.mockReset().mockResolvedValue(null)
  Object.values(tx).forEach((m) => Object.values(m).forEach((fn) => (fn as any).mockReset()))
  releaseAllCvsForCandidate.mockResolvedValue({ released: 1 })
  revokeAllCvsForCandidate.mockResolvedValue({ revoked: 1 })
})

// ── accept ──────────────────────────────────────────────────────────────────
describe('consent/[token]/accept', () => {
  async function load() {
    mockModules()
    return import('@/app/api/consent/[token]/accept/route')
  }

  const validBody = {
    consentGiven: true,
    referees: [{ firstName: 'Eva', lastName: 'Muster', company: 'Beispiel AG', email: 'eva@beispiel.invalid' }],
  }

  it('Rate-Limit überschritten → 429', async () => {
    const { POST } = await load()
    rateLimit.mockReturnValue({ ok: false })
    const res = await POST(req(validBody), { params: { token: 't' } })
    expect(res.status).toBe(429)
    expect(loadConsentByToken).not.toHaveBeenCalled()
  })

  it('ungültiges Token → 410', async () => {
    const { POST } = await load()
    okRateLimit()
    loadConsentByToken.mockRejectedValue(new Error('Token ungültig.'))
    const res = await POST(req(validBody), { params: { token: 'bad' } })
    expect(res.status).toBe(410)
  })

  it('bereits ACCEPTED → 409, keine Transaktion', async () => {
    const { POST } = await load()
    okRateLimit()
    loadConsentByToken.mockResolvedValue({ id: 'ct1', candidateId: 'k1', status: 'ACCEPTED' })
    const res = await POST(req(validBody), { params: { token: 't' } })
    expect(res.status).toBe(409)
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('ohne consentGiven → 400', async () => {
    const { POST } = await load()
    okRateLimit()
    loadConsentByToken.mockResolvedValue({ id: 'ct1', candidateId: 'k1', status: 'PENDING', consentVersion: '1.0' })
    const res = await POST(req({ referees: validBody.referees }), { params: { token: 't' } })
    expect(res.status).toBe(400)
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('ohne Referenzgeber → 400', async () => {
    const { POST } = await load()
    okRateLimit()
    loadConsentByToken.mockResolvedValue({ id: 'ct1', candidateId: 'k1', status: 'PENDING', consentVersion: '1.0' })
    const res = await POST(req({ consentGiven: true, referees: [] }), { params: { token: 't' } })
    expect(res.status).toBe(400)
  })

  it('gültig → ACCEPTED + CONSENT_GIVEN + Checks + CV-Release + Audit', async () => {
    const { POST } = await load()
    okRateLimit()
    loadConsentByToken.mockResolvedValue({ id: 'ct1', candidateId: 'k1', status: 'PENDING', consentVersion: '1.0' })
    const res = await POST(req(validBody), { params: { token: 't' } })
    expect(res.status).toBe(200)

    expect(tx.consentToken.update.mock.calls[0][0]).toMatchObject({ where: { id: 'ct1' }, data: { status: 'ACCEPTED' } })
    expect(tx.candidate.update.mock.calls[0][0]).toMatchObject({ where: { id: 'k1' }, data: { status: 'CONSENT_GIVEN', gdprConsent: true } })
    expect(tx.referenceCheck.create).toHaveBeenCalledTimes(1)
    expect(tx.referenceCheck.create.mock.calls[0][0].data).toMatchObject({ candidateId: 'k1', status: 'OPEN', employerName: 'Beispiel AG' })
    // CV-Gate SSOT wird in derselben Transaktion mit tx aufgerufen
    expect(releaseAllCvsForCandidate).toHaveBeenCalledWith('k1', tx)
    expect(tx.auditLog.create.mock.calls[0][0].data).toMatchObject({ action: 'CONSENT_ACCEPTED', entity: 'ConsentToken', entityId: 'ct1' })
  })
})

// ── revoke ──────────────────────────────────────────────────────────────────
describe('consent/[token]/revoke', () => {
  async function load() {
    mockModules()
    return import('@/app/api/consent/[token]/revoke/route')
  }

  it('Rate-Limit überschritten → 429', async () => {
    const { POST } = await load()
    rateLimit.mockReturnValue({ ok: false })
    const res = await POST(req(null), { params: { token: 't' } })
    expect(res.status).toBe(429)
  })

  it('gültig → REVOKED + CONSENT_REVOKED + Checks CANCELLED + CV-Revoke + Audit', async () => {
    const { POST } = await load()
    okRateLimit()
    loadConsentByToken.mockResolvedValue({ id: 'ct1', candidateId: 'k1', status: 'ACCEPTED' })
    const res = await POST(req(null), { params: { token: 't' } })
    expect(res.status).toBe(200)

    expect(tx.consentToken.update.mock.calls[0][0]).toMatchObject({ where: { id: 'ct1' }, data: { status: 'REVOKED' } })
    expect(tx.candidate.update.mock.calls[0][0]).toMatchObject({ where: { id: 'k1' }, data: { status: 'CONSENT_REVOKED', gdprConsent: false } })
    // nur offene Checks werden abgebrochen
    expect(tx.referenceCheck.updateMany.mock.calls[0][0]).toMatchObject({
      where: { candidateId: 'k1', status: { in: ['OPEN', 'IN_PROGRESS'] } },
      data: { status: 'CANCELLED' },
    })
    expect(revokeAllCvsForCandidate).toHaveBeenCalledWith('k1', tx)
    expect(tx.auditLog.create.mock.calls[0][0].data).toMatchObject({ action: 'CONSENT_REVOKED', entity: 'ConsentToken', entityId: 'ct1' })
  })
})

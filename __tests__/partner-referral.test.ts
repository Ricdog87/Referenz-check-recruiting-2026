/**
 * __tests__/partner-referral.test.ts
 *
 * GET /api/partner/referral/[id] — der Prefill-Endpoint für den
 * Register-Flow von Partner-Mandanten.
 *
 * Kritische Garantien:
 *   1. Response enthält NIE Preis-Interna (ekPriceCents, endPriceCents,
 *      marginCents) oder die partnerAccountId — nur Prefill-Daten, die
 *      der Mail-Empfänger ohnehin kennt.
 *   2. CHURNED-Mandant / suspendierter / gelöschter Partner → generische 404
 *      (kein Oracle, welcher Teil fehlgeschlagen ist).
 *   3. Flag off → 404.
 *   4. Ungültiges ID-Format → 400 ohne DB-Zugriff.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockFindUnique = vi.fn()

const VALID_CUSTOMER = {
  id: 'clxreferral0000000000001',
  company: 'Testfirma GmbH',
  contactFirstName: 'Max',
  contactLastName: 'Muster',
  contactEmail: 'max@testfirma.de',
  planKey: 'PROFESSIONAL',
  billingCycle: 'MONTHLY',
  status: 'ACTIVE',
  partnerAccount: { company: 'PDL Partner AG', status: 'APPROVED', deletedAt: null },
}

async function importGet(flagOn = true) {
  vi.resetModules()
  vi.doMock('server-only', () => ({}))
  vi.doMock('@/lib/flags', () => ({ isPartnerProgramEnabled: () => flagOn }))
  vi.doMock('@/lib/db', () => ({
    prisma: { partnerCustomer: { findUnique: mockFindUnique } },
  }))
  vi.doMock('@/lib/rate-limit', () => ({
    rateLimit: () => ({ ok: true, retryAfter: 0 }),
    getClientIp: () => '127.0.0.1',
  }))
  vi.doMock('@/lib/logger', () => ({
    logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
  }))
  const mod = await import('@/app/api/partner/referral/[id]/route')
  return mod.GET
}

function makeReq(): any {
  return { headers: new Headers() }
}

beforeEach(() => {
  mockFindUnique.mockReset()
})

describe('GET /api/partner/referral/[id] — kein Preis-Leak', () => {
  it('returns prefill data for a valid referral', async () => {
    const GET = await importGet()
    mockFindUnique.mockResolvedValue(VALID_CUSTOMER)

    const res = await GET(makeReq(), { params: { id: VALID_CUSTOMER.id } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.company).toBe('Testfirma GmbH')
    expect(data.contactEmail).toBe('max@testfirma.de')
    expect(data.planKey).toBe('PROFESSIONAL')
    expect(data.partnerCompany).toBe('PDL Partner AG')
  })

  it('NEVER exposes pricing internals or the partnerAccountId', async () => {
    const GET = await importGet()
    // Selbst wenn die DB-Row diese Felder enthielte (defensive):
    mockFindUnique.mockResolvedValue({
      ...VALID_CUSTOMER,
      ekPriceCents: 5000,
      endPriceCents: 9900,
      marginCents: 4900,
      partnerAccountId: 'partner_secret_id',
      notes: 'interne Notiz',
    })

    const res = await GET(makeReq(), { params: { id: VALID_CUSTOMER.id } })
    const body = JSON.stringify(await res.json())
    expect(body).not.toContain('ekPriceCents')
    expect(body).not.toContain('endPriceCents')
    expect(body).not.toContain('marginCents')
    expect(body).not.toContain('partner_secret_id')
    expect(body).not.toContain('interne Notiz')
    expect(body).not.toContain('5000')
    expect(body).not.toContain('9900')
  })
})

describe('GET /api/partner/referral/[id] — generische 404 für alle Sperr-Fälle', () => {
  const CASES: Array<[string, any]> = [
    ['unknown id', null],
    ['churned customer', { ...VALID_CUSTOMER, status: 'CHURNED' }],
    ['suspended partner', { ...VALID_CUSTOMER, partnerAccount: { ...VALID_CUSTOMER.partnerAccount, status: 'SUSPENDED' } }],
    ['pending partner', { ...VALID_CUSTOMER, partnerAccount: { ...VALID_CUSTOMER.partnerAccount, status: 'PENDING' } }],
    ['deleted partner', { ...VALID_CUSTOMER, partnerAccount: { ...VALID_CUSTOMER.partnerAccount, deletedAt: new Date() } }],
  ]

  for (const [label, row] of CASES) {
    it(`404 on ${label}`, async () => {
      const GET = await importGet()
      mockFindUnique.mockResolvedValue(row)
      const res = await GET(makeReq(), { params: { id: VALID_CUSTOMER.id } })
      expect(res.status).toBe(404)
      const data = await res.json()
      // Immer dieselbe generische Meldung — kein Status-Oracle
      expect(data.error).toBe('Einladung nicht gefunden oder abgelaufen.')
    })
  }
})

describe('GET /api/partner/referral/[id] — Input-Gates', () => {
  it('400 on malformed id WITHOUT touching the DB', async () => {
    const GET = await importGet()
    const res = await GET(makeReq(), { params: { id: "1; DROP TABLE users" } })
    expect(res.status).toBe(400)
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it('404 when the feature flag is off', async () => {
    const GET = await importGet(false)
    const res = await GET(makeReq(), { params: { id: VALID_CUSTOMER.id } })
    expect(res.status).toBe(404)
    expect(mockFindUnique).not.toHaveBeenCalled()
  })
})

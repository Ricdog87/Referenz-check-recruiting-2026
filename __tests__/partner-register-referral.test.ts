/**
 * __tests__/partner-register-referral.test.ts
 *
 * POST /api/auth/register mit Partner-Referral (?via=<PartnerCustomer.id>).
 *
 * Kritische Garantien:
 *   1. Referral bestimmt Plan AUTORITATIV aus der DB — ein manipulierter
 *      Body-Plan wird ignoriert.
 *   2. AGENCY_*-Plan via valides Referral umgeht den PDL-Closed-Beta-Block
 *      (der Partner hat den Mandanten geprüft angelegt) und setzt
 *      accountType=RECRUITMENT_AGENCY.
 *   3. Ungültiges Referral (churned/suspended/unknown) → normaler Flow:
 *      Whitelist greift, AGENCY-Plan fällt auf STARTER zurück, PDL-Block
 *      aktiv, KEIN Conversion-Log.
 *   4. Conversion-Log enthält NIE die neue User-ID (Cross-Domain-Grenze).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockUserFindFirst = vi.fn()
const mockUserCreate = vi.fn()
const mockAuditCreate = vi.fn().mockResolvedValue({})
const mockPartnerCustomerFindUnique = vi.fn()
const mockPartnerAuditCreate = vi.fn().mockResolvedValue({})

const VALID_REFERRAL_ROW = {
  id: 'clxcust00000000000000001',
  planKey: 'AGENCY_PRO',
  partnerAccountId: 'partner_A',
  contactEmail: 'kontakt@mandant.de',
  status: 'ACTIVE',
  partnerAccount: { status: 'APPROVED', deletedAt: null },
}

async function importPost() {
  vi.resetModules()
  vi.doMock('server-only', () => ({}))
  vi.doMock('@/lib/db', () => ({
    prisma: {
      user: { findFirst: mockUserFindFirst, create: mockUserCreate },
      auditLog: { create: mockAuditCreate },
      partnerCustomer: { findUnique: mockPartnerCustomerFindUnique },
      partnerAuditLog: { create: mockPartnerAuditCreate },
    },
  }))
  vi.doMock('@/lib/rate-limit', () => ({
    rateLimit: () => ({ ok: true, retryAfter: 0 }),
    getClientIp: () => '127.0.0.1',
  }))
  vi.doMock('@/lib/db-init', () => ({
    ensureSchema: async () => {},
    withDbRecovery: async (fn: () => Promise<unknown>) => fn(),
  }))
  vi.doMock('@/lib/email', () => ({
    sendEmail: vi.fn().mockResolvedValue({ ok: true, provider: 'log', id: null }),
    welcomeEmail: () => ({ subject: 's', html: '<p>h</p>', text: 't' }),
  }))
  vi.doMock('bcryptjs', () => ({
    default: { hash: async () => 'hashed-password' },
  }))
  const mod = await import('@/app/api/auth/register/route')
  return mod.POST
}

function makeReq(body: Record<string, unknown>): any {
  return {
    headers: new Headers({ 'user-agent': 'vitest' }),
    nextUrl: new URL('http://localhost/api/auth/register'),
    json: async () => body,
  }
}

const BASE_BODY = {
  name: 'Max Muster',
  company: 'Mandant GmbH',
  email: 'kontakt@mandant.de',
  password: 'super-secret-pw',
  acceptTerms: true,
  acceptPrivacy: true,
}

beforeEach(() => {
  mockUserFindFirst.mockReset().mockResolvedValue(null)
  mockUserCreate.mockReset().mockResolvedValue({ id: 'user_new', email: 'kontakt@mandant.de' })
  mockAuditCreate.mockClear()
  mockPartnerCustomerFindUnique.mockReset()
  mockPartnerAuditCreate.mockClear()
})

describe('POST /api/auth/register — Referral-Plan ist autoritativ', () => {
  it('AGENCY-Plan via valides Referral umgeht PDL-Block und setzt accountType', async () => {
    const POST = await importPost()
    mockPartnerCustomerFindUnique.mockResolvedValue(VALID_REFERRAL_ROW)

    const res = await POST(
      makeReq({ ...BASE_BODY, via: VALID_REFERRAL_ROW.id, accountType: 'HR_DEPARTMENT', plan: 'STARTER' }),
    )

    expect(res.status).toBe(201)
    expect(mockUserCreate).toHaveBeenCalledTimes(1)
    const createArg = mockUserCreate.mock.calls[0][0]
    expect(createArg.data.plan).toBe('AGENCY_PRO')
    expect(createArg.data.accountType).toBe('RECRUITMENT_AGENCY')
  })

  it('manipulierter Body-Plan wird ignoriert — DB-Plan gewinnt', async () => {
    const POST = await importPost()
    mockPartnerCustomerFindUnique.mockResolvedValue({
      ...VALID_REFERRAL_ROW,
      planKey: 'STARTER',
    })

    const res = await POST(
      makeReq({ ...BASE_BODY, via: VALID_REFERRAL_ROW.id, plan: 'BUSINESS' }),
    )

    expect(res.status).toBe(201)
    expect(mockUserCreate.mock.calls[0][0].data.plan).toBe('STARTER')
    expect(mockUserCreate.mock.calls[0][0].data.accountType).toBe('HR_DEPARTMENT')
  })

  it('Conversion-Log wird geschrieben — OHNE User-ID, MIT plan', async () => {
    const POST = await importPost()
    mockPartnerCustomerFindUnique.mockResolvedValue(VALID_REFERRAL_ROW)

    await POST(makeReq({ ...BASE_BODY, via: VALID_REFERRAL_ROW.id }))

    expect(mockPartnerAuditCreate).toHaveBeenCalledTimes(1)
    const log = mockPartnerAuditCreate.mock.calls[0][0].data
    expect(log.action).toBe('PARTNER_CUSTOMER_CONVERTED')
    expect(log.partnerAccountId).toBe('partner_A')
    expect(log.entityId).toBe(VALID_REFERRAL_ROW.id)
    expect(log.details).toContain('plan=AGENCY_PRO')
    expect(log.details).toContain('email_matches=true')
    // Cross-Domain-Grenze: neue User-ID darf NICHT im Partner-Log landen
    expect(JSON.stringify(log)).not.toContain('user_new')
  })
})

describe('POST /api/auth/register — ungültiges Referral fällt sauber zurück', () => {
  const INVALID_ROWS: Array<[string, any]> = [
    ['unknown via', null],
    ['churned customer', { ...VALID_REFERRAL_ROW, status: 'CHURNED' }],
    ['suspended partner', { ...VALID_REFERRAL_ROW, partnerAccount: { status: 'SUSPENDED', deletedAt: null } }],
    ['deleted partner', { ...VALID_REFERRAL_ROW, partnerAccount: { status: 'APPROVED', deletedAt: new Date() } }],
  ]

  for (const [label, row] of INVALID_ROWS) {
    it(`${label}: Whitelist greift, kein Conversion-Log`, async () => {
      const POST = await importPost()
      mockPartnerCustomerFindUnique.mockResolvedValue(row)

      const res = await POST(
        makeReq({ ...BASE_BODY, via: VALID_REFERRAL_ROW.id, plan: 'AGENCY_PRO' }),
      )

      expect(res.status).toBe(201)
      // AGENCY_PRO ist nicht in VALID_PLANS → Fallback STARTER
      expect(mockUserCreate.mock.calls[0][0].data.plan).toBe('STARTER')
      expect(mockPartnerAuditCreate).not.toHaveBeenCalled()
    })
  }

  it('RECRUITMENT_AGENCY ohne valides Referral → 403 PDL-Block bleibt aktiv', async () => {
    const POST = await importPost()
    mockPartnerCustomerFindUnique.mockResolvedValue(null)
    delete process.env.PDL_REGISTRATION_OPEN

    const res = await POST(
      makeReq({ ...BASE_BODY, via: 'clxunknown00000000000001', accountType: 'RECRUITMENT_AGENCY' }),
    )

    expect(res.status).toBe(403)
    expect(mockUserCreate).not.toHaveBeenCalled()
  })
})

describe('POST /api/auth/register — Referral-Härtung (Audit-Fixes)', () => {
  it('E-Mail-Bindung: fremde Adresse am validen Referral → 400, kein User, kein Log', async () => {
    const POST = await importPost()
    mockPartnerCustomerFindUnique.mockResolvedValue(VALID_REFERRAL_ROW)

    const res = await POST(
      makeReq({ ...BASE_BODY, email: 'angreifer@anders.de', via: VALID_REFERRAL_ROW.id }),
    )

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.field).toBe('email')
    expect(mockUserCreate).not.toHaveBeenCalled()
    expect(mockPartnerAuditCreate).not.toHaveBeenCalled()
  })

  it('E-Mail-Bindung ist case-insensitive', async () => {
    const POST = await importPost()
    mockPartnerCustomerFindUnique.mockResolvedValue({
      ...VALID_REFERRAL_ROW,
      contactEmail: 'Kontakt@Mandant.DE',
    })

    const res = await POST(makeReq({ ...BASE_BODY, via: VALID_REFERRAL_ROW.id }))

    expect(res.status).toBe(201)
    expect(mockUserCreate.mock.calls[0][0].data.plan).toBe('AGENCY_PRO')
  })

  it('transienter DB-Fehler beim Referral-Lookup → 503 statt stillem STARTER-Downgrade', async () => {
    const POST = await importPost()
    mockPartnerCustomerFindUnique.mockRejectedValue(new Error('connection reset'))

    const res = await POST(makeReq({ ...BASE_BODY, via: VALID_REFERRAL_ROW.id }))

    expect(res.status).toBe(503)
    expect(mockUserCreate).not.toHaveBeenCalled()
  })
})

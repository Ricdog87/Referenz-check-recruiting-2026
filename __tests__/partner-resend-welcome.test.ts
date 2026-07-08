/**
 * __tests__/partner-resend-welcome.test.ts
 *
 * POST /api/partner/customers/[id]/resend-welcome — der Rettungsweg für
 * nicht zugestellte Welcome-Mails.
 *
 * Garantien:
 *   - Cross-Partner-Isolation: Partner A kann für Partner Bs Mandanten
 *     keine Mail auslösen (findFirst mit withPartnerScope → 404)
 *   - Verbrauchte Einladung (konvertiert) → 409, keine Mail
 *   - CHURNED → 400, keine Mail
 *   - Flag off / keine Session / PENDING → 404 / 401 / 403 ohne DB-Call
 *   - Mail-Fehlschlag → 502 mit Hinweis auf Link-Kopieren
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockCustomerFindFirst = vi.fn()
const mockAuditFindFirst = vi.fn()
const mockAuditCreate = vi.fn().mockResolvedValue({})
const mockSendWelcome = vi.fn()
const mockGetPartnerSession = vi.fn()

const PARTNER_A: any = { id: 'partner_A', email: 'a@x.de', name: 'A', status: 'APPROVED', tier: 'SILVER' }

const CUSTOMER_A = {
  id: 'cust_a1',
  company: 'Mandant GmbH',
  contactFirstName: 'Max',
  contactLastName: 'Muster',
  contactEmail: 'max@mandant.de',
  planKey: 'PROFESSIONAL',
  status: 'ACTIVE',
}

async function importPost(flagOn = true) {
  vi.resetModules()
  vi.doMock('server-only', () => ({}))
  vi.doMock('@/lib/flags', () => ({ isPartnerProgramEnabled: () => flagOn }))
  vi.doMock('@/lib/partner/session', () => ({ getPartnerSession: mockGetPartnerSession }))
  vi.doMock('@/lib/partner/welcome', () => ({ sendCustomerWelcomeMail: mockSendWelcome }))
  vi.doMock('@/lib/db', () => ({
    prisma: {
      partnerCustomer: { findFirst: mockCustomerFindFirst },
      partnerAuditLog: { findFirst: mockAuditFindFirst, create: mockAuditCreate },
    },
  }))
  vi.doMock('@/lib/rate-limit', () => ({
    rateLimit: () => ({ ok: true, retryAfter: 0 }),
    getClientIp: () => '127.0.0.1',
  }))
  vi.doMock('@/lib/logger', () => ({
    logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
  }))
  const mod = await import('@/app/api/partner/customers/[id]/resend-welcome/route')
  return mod.POST
}

function makeReq(): any {
  return {
    headers: new Headers(),
    nextUrl: new URL('http://localhost/api/partner/customers/cust_a1/resend-welcome'),
  }
}

beforeEach(() => {
  mockCustomerFindFirst.mockReset()
  mockAuditFindFirst.mockReset().mockResolvedValue(null)
  mockAuditCreate.mockClear()
  mockSendWelcome.mockReset().mockResolvedValue({ sent: true })
  mockGetPartnerSession.mockReset()
})

describe('resend-welcome — Isolation & Gates', () => {
  it('Partner A auf fremden Mandanten → 404, keine Mail (Scope im findFirst)', async () => {
    const POST = await importPost()
    mockGetPartnerSession.mockResolvedValue(PARTNER_A)
    mockCustomerFindFirst.mockResolvedValue(null) // Scope findet fremde ID nicht

    const res = await POST(makeReq(), { params: { id: 'cust_of_B' } })

    expect(res.status).toBe(404)
    expect(mockSendWelcome).not.toHaveBeenCalled()
    expect(mockCustomerFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ partnerAccountId: 'partner_A', id: 'cust_of_B' }),
      }),
    )
  })

  it('unauthenticated → 401 ohne DB-Call', async () => {
    const POST = await importPost()
    mockGetPartnerSession.mockResolvedValue(null)
    const res = await POST(makeReq(), { params: { id: 'cust_a1' } })
    expect(res.status).toBe(401)
    expect(mockCustomerFindFirst).not.toHaveBeenCalled()
  })

  it('PENDING-Partner → 403 ohne DB-Call', async () => {
    const POST = await importPost()
    mockGetPartnerSession.mockResolvedValue({ ...PARTNER_A, status: 'PENDING' })
    const res = await POST(makeReq(), { params: { id: 'cust_a1' } })
    expect(res.status).toBe(403)
    expect(mockCustomerFindFirst).not.toHaveBeenCalled()
  })

  it('Flag off → 404 ohne Session-Check', async () => {
    const POST = await importPost(false)
    const res = await POST(makeReq(), { params: { id: 'cust_a1' } })
    expect(res.status).toBe(404)
    expect(mockGetPartnerSession).not.toHaveBeenCalled()
  })
})

describe('resend-welcome — Zustands-Regeln', () => {
  it('erfolgreicher Versand → 200 + Audit sent=true', async () => {
    const POST = await importPost()
    mockGetPartnerSession.mockResolvedValue(PARTNER_A)
    mockCustomerFindFirst.mockResolvedValue(CUSTOMER_A)

    const res = await POST(makeReq(), { params: { id: 'cust_a1' } })

    expect(res.status).toBe(200)
    expect(mockSendWelcome).toHaveBeenCalledTimes(1)
    expect(mockSendWelcome.mock.calls[0][0].customer.id).toBe('cust_a1')
    expect(mockAuditCreate.mock.calls[0][0].data.action).toBe('PARTNER_CUSTOMER_RESEND_WELCOME')
    expect(mockAuditCreate.mock.calls[0][0].data.details).toBe('sent=true')
  })

  it('bereits konvertiert → 409, keine Mail', async () => {
    const POST = await importPost()
    mockGetPartnerSession.mockResolvedValue(PARTNER_A)
    mockCustomerFindFirst.mockResolvedValue(CUSTOMER_A)
    mockAuditFindFirst.mockResolvedValue({ id: 'log_converted' })

    const res = await POST(makeReq(), { params: { id: 'cust_a1' } })

    expect(res.status).toBe(409)
    expect(mockSendWelcome).not.toHaveBeenCalled()
  })

  it('CHURNED → 400, keine Mail', async () => {
    const POST = await importPost()
    mockGetPartnerSession.mockResolvedValue(PARTNER_A)
    mockCustomerFindFirst.mockResolvedValue({ ...CUSTOMER_A, status: 'CHURNED' })

    const res = await POST(makeReq(), { params: { id: 'cust_a1' } })

    expect(res.status).toBe(400)
    expect(mockSendWelcome).not.toHaveBeenCalled()
  })

  it('Mail-Fehlschlag → 502 mit Hinweis, Audit sent=false', async () => {
    const POST = await importPost()
    mockGetPartnerSession.mockResolvedValue(PARTNER_A)
    mockCustomerFindFirst.mockResolvedValue(CUSTOMER_A)
    mockSendWelcome.mockResolvedValue({ sent: false })

    const res = await POST(makeReq(), { params: { id: 'cust_a1' } })

    expect(res.status).toBe(502)
    const data = await res.json()
    expect(data.error).toMatch(/Einladungslink/i)
    expect(mockAuditCreate.mock.calls[0][0].data.details).toBe('sent=false')
  })
})

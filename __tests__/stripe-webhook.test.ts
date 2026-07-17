/**
 * G5-Regression: Stripe-Webhook — Signatur, Idempotenz, Status-Mapping.
 * Der Geld-Pfad hatte 0 Tests. Stripe-SDK + Prisma gemockt (offline).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockConstructEvent = vi.fn()
const mockSubRetrieve = vi.fn()
const mockSessionRetrieve = vi.fn()
const mockUserUpdate = vi.fn().mockResolvedValue({})
const mockUserFindUnique = vi.fn()
const mockAddonCreate = vi.fn()
const mockCheckUpdate = vi.fn().mockResolvedValue({})
const mockAuditCreate = vi.fn().mockResolvedValue({})

async function importPost(withSecret = true) {
  vi.resetModules()
  if (withSecret) process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
  else delete process.env.STRIPE_WEBHOOK_SECRET

  vi.doMock('@/lib/stripe', () => ({
    stripe: {
      webhooks: { constructEvent: mockConstructEvent },
      subscriptions: { retrieve: mockSubRetrieve },
      checkout: { sessions: { retrieve: mockSessionRetrieve } },
    },
    planFromPriceId: (id: string) =>
      id === 'price_pro' ? { plan: 'PROFESSIONAL', interval: 'monthly' } : { plan: null, interval: null },
    mapStripeStatus: (s: string) => (s === 'active' ? 'ACTIVE' : s === 'past_due' ? 'PAST_DUE' : 'INACTIVE'),
    addonSkuFromPriceId: () => null,
  }))
  vi.doMock('@/lib/addons', () => ({
    getAddon: () => ({ sku: 'SINGLE_CHECK', name: 'Single Check', price: 49, quantity: 1 }),
  }))
  vi.doMock('@/lib/db', () => ({
    prisma: {
      user: { update: mockUserUpdate, findUnique: mockUserFindUnique },
      addonOrder: { create: mockAddonCreate },
      referenceCheck: { update: mockCheckUpdate },
      auditLog: { create: mockAuditCreate },
    },
  }))
  return (await import('@/app/api/stripe/webhook/route')).POST
}

function makeReq(sig: string | null, body = '{}') {
  return {
    headers: new Headers(sig ? { 'stripe-signature': sig } : {}),
    text: async () => body,
  } as any
}

beforeEach(() => {
  mockConstructEvent.mockReset()
  mockSubRetrieve.mockReset()
  mockSessionRetrieve.mockReset()
  mockUserUpdate.mockClear()
  mockUserFindUnique.mockReset()
  mockAddonCreate.mockReset()
  mockAuditCreate.mockClear()
})

describe('Stripe-Webhook — Sicherheit', () => {
  it('fehlendes Secret → 500', async () => {
    const POST = await importPost(false)
    const res = await POST(makeReq('sig'))
    expect(res.status).toBe(500)
  })

  it('fehlende Signatur → 400', async () => {
    const POST = await importPost()
    const res = await POST(makeReq(null))
    expect(res.status).toBe(400)
    expect(mockConstructEvent).not.toHaveBeenCalled()
  })

  it('ungültige Signatur (constructEvent wirft) → 400', async () => {
    const POST = await importPost()
    mockConstructEvent.mockImplementation(() => { throw new Error('bad sig') })
    const res = await POST(makeReq('wrong'))
    expect(res.status).toBe(400)
    expect(mockUserUpdate).not.toHaveBeenCalled()
  })
})

describe('Stripe-Webhook — Status-Mapping', () => {
  it('checkout.session.completed (subscription) → user.update mit ACTIVE + Plan', async () => {
    const POST = await importPost()
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { mode: 'subscription', metadata: { userId: 'u1' }, subscription: 'sub_1' } },
    })
    mockSubRetrieve.mockResolvedValue({
      id: 'sub_1', status: 'active', customer: 'cus_1',
      items: { data: [{ price: { id: 'price_pro' }, current_period_end: 1893456000 }] },
    })
    const res = await POST(makeReq('ok'))
    expect(res.status).toBe(200)
    const upd = mockUserUpdate.mock.calls[0][0]
    expect(upd.where).toEqual({ id: 'u1' })
    expect(upd.data.planStatus).toBe('ACTIVE')
    expect(upd.data.plan).toBe('PROFESSIONAL')
  })

  it('customer.subscription.updated past_due → PAST_DUE', async () => {
    const POST = await importPost()
    mockUserFindUnique.mockResolvedValue({ id: 'u1' })
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: { object: {
        id: 'sub_1', status: 'past_due', customer: 'cus_1', metadata: { userId: 'u1' },
        items: { data: [{ price: { id: 'price_pro' }, current_period_end: 1893456000 }] },
      } },
    })
    const res = await POST(makeReq('ok'))
    expect(res.status).toBe(200)
    expect(mockUserUpdate.mock.calls[0][0].data.planStatus).toBe('PAST_DUE')
  })
})

describe('Stripe-Webhook — Idempotenz (Add-on)', () => {
  it('doppeltes Event (P2002) wird geschluckt → 200, kein Rethrow', async () => {
    const POST = await importPost()
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: {
        mode: 'payment', metadata: { userId: 'u1', type: 'addon', sku: 'SINGLE_CHECK' },
        id: 'cs_dup', amount_total: 4900,
      } },
    })
    mockAddonCreate.mockRejectedValue(Object.assign(new Error('dup'), { code: 'P2002' }))
    const res = await POST(makeReq('ok'))
    expect(res.status).toBe(200) // Idempotent verschluckt, kein 500
  })

  it('unerwarteter DB-Fehler (nicht P2002) → 500', async () => {
    const POST = await importPost()
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: {
        mode: 'payment', metadata: { userId: 'u1', type: 'addon', sku: 'SINGLE_CHECK' },
        id: 'cs_x', amount_total: 4900,
      } },
    })
    mockAddonCreate.mockRejectedValue(Object.assign(new Error('db down'), { code: 'P1001' }))
    const res = await POST(makeReq('ok'))
    expect(res.status).toBe(500)
  })
})

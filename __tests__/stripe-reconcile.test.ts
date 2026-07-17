/**
 * G6 — Stripe-Reconciliation gegen verpasste Webhooks.
 *
 * subscriptionDrift + reconcileSubscriptions gegen injizierte Mocks;
 * deriveSubscriptionFields/subscriptionPeriodEnd als echte Funktionen
 * (kein Mock) — beweist die Äquivalenz zur Webhook-Ableitung.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const findMany = vi.fn()
const userUpdate = vi.fn()
const auditCreate = vi.fn()
const subRetrieve = vi.fn()

async function importMod() {
  vi.resetModules()
  vi.doMock('server-only', () => ({}))
  vi.doMock('@/lib/db', () => ({ prisma: {} }))
  vi.doMock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))
  // ECHTES lib/stripe verwenden → deriveSubscriptionFields ist real.
  // lib/stripe wirft ohne STRIPE_SECRET_KEY → Platzhalter setzen.
  process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder'
  // planFromPriceId liest STRIPE_PRICE_*-Envs; wir setzen eine bekannte ID.
  process.env.STRIPE_PRICE_PROFESSIONAL = 'price_pro_m'
  return import('@/lib/stripe-reconcile')
}

const db = {
  user: { findMany, update: userUpdate },
  auditLog: { create: auditCreate },
}
const stripeClient = { subscriptions: { retrieve: subRetrieve } }

// Baut ein Stripe-Subscription-artiges Objekt.
function sub(opts: { status: string; priceId?: string; periodEnd?: number }) {
  return {
    status: opts.status,
    items: { data: [{ price: { id: opts.priceId ?? 'price_unknown' }, current_period_end: opts.periodEnd }] },
  }
}

beforeEach(() => {
  findMany.mockReset()
  userUpdate.mockReset().mockResolvedValue({})
  auditCreate.mockReset().mockResolvedValue({})
  subRetrieve.mockReset()
})

async function importStripe() {
  vi.resetModules()
  process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder'
  process.env.STRIPE_PRICE_PROFESSIONAL = 'price_pro_m'
  return import('@/lib/stripe')
}

describe('deriveSubscriptionFields / subscriptionPeriodEnd', () => {
  it('nimmt den FRÜHESTEN Item-Period-End', async () => {
    const { subscriptionPeriodEnd } = await importStripe()
    const s = {
      status: 'active',
      items: { data: [{ current_period_end: 2000 }, { current_period_end: 1000 }] },
    } as any
    expect(subscriptionPeriodEnd(s)).toEqual(new Date(1000 * 1000))
  })

  it('mappt Status + Plan aus der Price-ID', async () => {
    const { deriveSubscriptionFields } = await importStripe()
    const s = {
      status: 'past_due',
      items: { data: [{ price: { id: 'price_pro_m' }, current_period_end: 1700000000 }] },
    } as any
    expect(deriveSubscriptionFields(s)).toEqual({
      plan: 'PROFESSIONAL',
      planStatus: 'PAST_DUE',
      billingInterval: 'MONTHLY',
      currentPeriodEnd: new Date(1700000000 * 1000),
    })
  })

  it('unbekannte Price-ID → plan/billingInterval undefined (kein Nullen)', async () => {
    const { deriveSubscriptionFields } = await importStripe()
    const s = { status: 'active', items: { data: [{ price: { id: 'price_x' } }] } } as any
    const f = deriveSubscriptionFields(s)
    expect(f.plan).toBeUndefined()
    expect(f.billingInterval).toBeUndefined()
    expect(f.planStatus).toBe('ACTIVE')
  })
})

describe('subscriptionDrift', () => {
  it('meldet geänderten planStatus', async () => {
    const { subscriptionDrift } = await importMod()
    const diff = subscriptionDrift(
      { plan: 'PROFESSIONAL', planStatus: 'ACTIVE', billingInterval: 'MONTHLY', currentPeriodEnd: null },
      { plan: 'PROFESSIONAL', planStatus: 'PAST_DUE', billingInterval: 'MONTHLY', currentPeriodEnd: null },
    )
    expect(diff).toEqual({ planStatus: 'PAST_DUE' })
  })

  it('nullt plan/billingInterval NICHT, wenn Stripe sie nicht eindeutig liefert', async () => {
    const { subscriptionDrift } = await importMod()
    const diff = subscriptionDrift(
      { plan: 'PROFESSIONAL', planStatus: 'ACTIVE', billingInterval: 'MONTHLY', currentPeriodEnd: null },
      { plan: undefined, planStatus: 'ACTIVE', billingInterval: undefined, currentPeriodEnd: null },
    )
    expect(diff).toEqual({})
  })

  it('erkennt geänderten currentPeriodEnd', async () => {
    const { subscriptionDrift } = await importMod()
    const d = new Date(2027, 0, 1)
    const diff = subscriptionDrift(
      { plan: 'PROFESSIONAL', planStatus: 'ACTIVE', billingInterval: 'MONTHLY', currentPeriodEnd: null },
      { plan: 'PROFESSIONAL', planStatus: 'ACTIVE', billingInterval: 'MONTHLY', currentPeriodEnd: d },
    )
    expect(diff).toEqual({ currentPeriodEnd: d })
  })
})

describe('reconcileSubscriptions', () => {
  it('korrigiert Drift (planStatus) + schreibt Audit', async () => {
    const { reconcileSubscriptions } = await importMod()
    findMany.mockResolvedValue([
      { id: 'u1', stripeSubscriptionId: 'sub_1', plan: 'PROFESSIONAL', planStatus: 'ACTIVE', billingInterval: 'MONTHLY', currentPeriodEnd: null },
    ])
    // Stripe sagt: past_due (Webhook verpasst) → mapStripeStatus → PAST_DUE
    subRetrieve.mockResolvedValue(sub({ status: 'past_due', priceId: 'price_pro_m' }))

    const res = await reconcileSubscriptions({ db, stripeClient })
    expect(res).toMatchObject({ checked: 1, drifted: 1, errors: 0, driftedUserIds: ['u1'] })
    expect(userUpdate.mock.calls[0][0]).toMatchObject({ where: { id: 'u1' }, data: { planStatus: 'PAST_DUE' } })
    expect(auditCreate.mock.calls[0][0].data).toMatchObject({ userId: 'u1', action: 'SUBSCRIPTION_RECONCILED' })
  })

  it('kein Update, wenn DB == Stripe', async () => {
    const { reconcileSubscriptions } = await importMod()
    findMany.mockResolvedValue([
      { id: 'u1', stripeSubscriptionId: 'sub_1', plan: 'PROFESSIONAL', planStatus: 'ACTIVE', billingInterval: 'MONTHLY', currentPeriodEnd: null },
    ])
    subRetrieve.mockResolvedValue(sub({ status: 'active', priceId: 'price_pro_m' }))
    const res = await reconcileSubscriptions({ db, stripeClient })
    expect(res).toMatchObject({ checked: 1, drifted: 0 })
    expect(userUpdate).not.toHaveBeenCalled()
  })

  it('ein Stripe-Fehler bricht den Lauf nicht ab', async () => {
    const { reconcileSubscriptions } = await importMod()
    findMany.mockResolvedValue([
      { id: 'u1', stripeSubscriptionId: 'sub_1', plan: 'STARTER', planStatus: 'ACTIVE', billingInterval: 'MONTHLY', currentPeriodEnd: null },
      { id: 'u2', stripeSubscriptionId: 'sub_2', plan: 'PROFESSIONAL', planStatus: 'ACTIVE', billingInterval: 'MONTHLY', currentPeriodEnd: null },
    ])
    subRetrieve.mockRejectedValueOnce(new Error('stripe 500'))
    subRetrieve.mockResolvedValueOnce(sub({ status: 'active', priceId: 'price_pro_m' }))
    const res = await reconcileSubscriptions({ db, stripeClient })
    expect(res.errors).toBe(1)
    expect(res.checked).toBe(1) // u2 wurde geprüft
  })

  it('findMany filtert auf stripeSubscriptionId != null', async () => {
    const { reconcileSubscriptions } = await importMod()
    findMany.mockResolvedValue([])
    await reconcileSubscriptions({ db, stripeClient })
    expect(findMany.mock.calls[0][0].where).toEqual({ stripeSubscriptionId: { not: null } })
  })
})

import Stripe from 'stripe'
import type { AddonSku } from './addons'

if (!process.env.STRIPE_SECRET_KEY) {
  // Im Build-Phase nicht hart failen — Vercel buildet ohne Runtime-Env teilweise.
  if (process.env.NEXT_PHASE !== 'phase-production-build') {
    throw new Error('STRIPE_SECRET_KEY required')
  }
}

// API-Version an die im SDK gepinnte Version koppeln — Stripe v22 → "2026-04-22.dahlia".
// Damit kein Drift bei SDK-Upgrades & strikten TypeScript-Checks.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
  apiVersion: '2026-04-22.dahlia',
  typescript: true,
})

export const STRIPE_PRICES = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER!,
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY!,
  },
  professional: {
    monthly: process.env.STRIPE_PRICE_PROFESSIONAL!,
    yearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY!,
  },
  business: {
    monthly: process.env.STRIPE_PRICE_BUSINESS!,
    yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY!,
  },
} as const

export const STRIPE_CHECK_PRICES = {
  starter: process.env.STRIPE_PRICE_CHECK_STARTER!,
  professional: process.env.STRIPE_PRICE_CHECK_PROFESSIONAL!,
  business: process.env.STRIPE_PRICE_CHECK_BUSINESS!,
} as const

export type PlanKey = keyof typeof STRIPE_PRICES
export type Interval = 'monthly' | 'yearly'
export type PlanUpper = 'STARTER' | 'PROFESSIONAL' | 'BUSINESS'
export type IntervalUpper = 'MONTHLY' | 'YEARLY'

export function planFromPriceId(priceId: string): {
  plan: PlanUpper | null
  interval: Interval | null
} {
  for (const [k, v] of Object.entries(STRIPE_PRICES)) {
    if (v.monthly === priceId) return { plan: k.toUpperCase() as PlanUpper, interval: 'monthly' }
    if (v.yearly === priceId) return { plan: k.toUpperCase() as PlanUpper, interval: 'yearly' }
  }
  return { plan: null, interval: null }
}

/**
 * Stripe-Subscription-Status → interner planStatus.
 * Siehe: https://stripe.com/docs/api/subscriptions/object#subscription_object-status
 */
export function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active':
      return 'ACTIVE'
    case 'past_due':
    case 'unpaid':
      return 'PAST_DUE'
    case 'canceled':
    case 'incomplete_expired':
      return 'CANCELLED'
    case 'incomplete':
    case 'paused':
      return 'INCOMPLETE'
    case 'trialing':
      return 'TRIALING'
    default:
      return 'INACTIVE'
  }
}

/**
 * Frühester Item-Period-End einer Subscription (Stripe „dahlia" hat
 * current_period_end auf die Items verschoben). Identisch zur Inline-Logik
 * im Webhook (`periodEndOf`) — hier als geteilter, testbarer Helper für den
 * Reconciliation-Cron (G6).
 */
export function subscriptionPeriodEnd(sub: Stripe.Subscription): Date | null {
  const ends =
    sub.items?.data
      ?.map((i) => i.current_period_end)
      .filter((v): v is number => typeof v === 'number') ?? []
  if (ends.length === 0) return null
  return new Date(Math.min(...ends) * 1000)
}

export type SubscriptionFields = {
  plan: PlanUpper | undefined
  planStatus: string
  billingInterval: IntervalUpper | undefined
  currentPeriodEnd: Date | null
}

/**
 * Kanonische Ableitung User-Billing-Felder ← Stripe-Subscription.
 * MUSS zur Webhook-Logik (BRANCH B / customer.subscription.updated)
 * äquivalent bleiben — der Reconciliation-Cron vergleicht genau hiergegen.
 */
export function deriveSubscriptionFields(sub: Stripe.Subscription): SubscriptionFields {
  const priceId = sub.items.data[0]?.price?.id ?? ''
  const { plan, interval } = planFromPriceId(priceId)
  return {
    plan: plan ?? undefined,
    planStatus: mapStripeStatus(sub.status),
    billingInterval: interval ? (interval.toUpperCase() as IntervalUpper) : undefined,
    currentPeriodEnd: subscriptionPeriodEnd(sub),
  }
}

// ─────────────────────────────────────────────────────────────────
// ONE-TIME ADD-ON PRICES
// ─────────────────────────────────────────────────────────────────
// Wired pro AddonSku → Stripe price_… ID via Env-Var
// (STRIPE_PRICE_ADDON_<SKU>). Build-time Tolerance: leere Strings als
// Fallback, sodass der Build nicht failt, wenn ein Env-Var fehlt.
// Runtime-Check passiert in /api/addons/route.ts vor Checkout-Create.

export const STRIPE_ADDON_PRICES: Record<AddonSku, string> = {
  SINGLE_CHECK: process.env.STRIPE_PRICE_ADDON_SINGLE_CHECK ?? '',
  CHECK_PACK_5: process.env.STRIPE_PRICE_ADDON_CHECK_PACK_5 ?? '',
  CHECK_PACK_10: process.env.STRIPE_PRICE_ADDON_CHECK_PACK_10 ?? '',
  EXPRESS_24H: process.env.STRIPE_PRICE_ADDON_EXPRESS_24H ?? '',
  BULK_CV: process.env.STRIPE_PRICE_ADDON_BULK_CV ?? '',
  PRE_SCREENING_CALL: process.env.STRIPE_PRICE_ADDON_PRE_SCREENING_CALL ?? '',
  DOCUMENT_VERIFICATION: process.env.STRIPE_PRICE_ADDON_DOCUMENT_VERIFICATION ?? '',
  CV_SCREENING: process.env.STRIPE_PRICE_ADDON_CV_SCREENING ?? '',
  INTERVIEW: process.env.STRIPE_PRICE_ADDON_INTERVIEW ?? '',
}

/**
 * Reverse-Lookup: Stripe price_… ID → AddonSku.
 * Webhook braucht das, falls metadata.sku fehlt (Defense-in-Depth).
 */
export function addonSkuFromPriceId(priceId: string): AddonSku | null {
  for (const [sku, id] of Object.entries(STRIPE_ADDON_PRICES) as [AddonSku, string][]) {
    if (id && id === priceId) return sku
  }
  return null
}

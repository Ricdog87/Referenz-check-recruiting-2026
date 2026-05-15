import Stripe from 'stripe'

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

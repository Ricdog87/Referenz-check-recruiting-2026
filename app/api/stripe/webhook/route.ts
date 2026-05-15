import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe, planFromPriceId, mapStripeStatus } from '@/lib/stripe'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

/**
 * Stripe API "dahlia" (2026-04-22) hat `current_period_end` von der
 * Subscription auf die einzelnen Items verschoben. Wir nehmen den
 * frühesten Endzeitpunkt aller Items als „nächste Abrechnung&ldquo;.
 */
function periodEndOf(sub: Stripe.Subscription): Date | null {
  const ends = sub.items?.data
    ?.map((i) => i.current_period_end)
    .filter((v): v is number => typeof v === 'number') ?? []
  if (ends.length === 0) return null
  return new Date(Math.min(...ends) * 1000)
}

export async function POST(req: NextRequest) {
  if (!WEBHOOK_SECRET) {
    console.error('stripe_webhook_no_secret')
    return NextResponse.json({ error: 'webhook secret missing' }, { status: 500 })
  }

  const sig = req.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'no signature' }, { status: 400 })
  }

  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('stripe_webhook_signature_error', { message: err?.message })
    return NextResponse.json({ error: `signature verification failed: ${err?.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const cs = event.data.object as Stripe.Checkout.Session
        const userId = cs.metadata?.userId
        const subId = typeof cs.subscription === 'string' ? cs.subscription : cs.subscription?.id
        if (!userId || !subId) {
          console.warn('stripe_checkout_completed_missing_meta', { userId, subId })
          break
        }
        const sub = await stripe.subscriptions.retrieve(subId)
        const priceId = sub.items.data[0]?.price?.id ?? ''
        const { plan, interval } = planFromPriceId(priceId)
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
            stripeSubscriptionId: sub.id,
            plan: plan ?? undefined,
            planStatus: mapStripeStatus(sub.status),
            billingInterval: interval ? interval.toUpperCase() : undefined,
            currentPeriodEnd: periodEndOf(sub),
          },
        })
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

        const user = userId
          ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
          : await prisma.user.findUnique({ where: { stripeCustomerId: customerId }, select: { id: true } })

        if (!user) {
          console.warn('stripe_sub_updated_user_not_found', { userId, customerId, subId: sub.id })
          break
        }

        const priceId = sub.items.data[0]?.price?.id ?? ''
        const { plan, interval } = planFromPriceId(priceId)
        await prisma.user.update({
          where: { id: user.id },
          data: {
            stripeSubscriptionId: sub.id,
            plan: plan ?? undefined,
            planStatus: mapStripeStatus(sub.status),
            billingInterval: interval ? interval.toUpperCase() : undefined,
            currentPeriodEnd: periodEndOf(sub),
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
          select: { id: true },
        })
        if (!user) {
          console.warn('stripe_sub_deleted_user_not_found', { customerId, subId: sub.id })
          break
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { planStatus: 'CANCELLED' },
        })
        break
      }

      case 'invoice.payment_failed': {
        // Phase 1: nur loggen. Mahnflow ist Phase 2.
        const inv = event.data.object as Stripe.Invoice
        console.warn('stripe_invoice_payment_failed', {
          invoiceId: inv.id,
          customerId: typeof inv.customer === 'string' ? inv.customer : inv.customer?.id,
          amountDue: inv.amount_due,
        })
        break
      }

      default:
        // Andere Events nicht relevant für Phase 1.
        break
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('stripe_webhook_handler_error', {
      type: event.type,
      message: err?.message,
    })
    return NextResponse.json({ error: 'handler error' }, { status: 500 })
  }
}

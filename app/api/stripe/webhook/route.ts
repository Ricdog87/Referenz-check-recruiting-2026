import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe, planFromPriceId, mapStripeStatus, addonSkuFromPriceId } from '@/lib/stripe'
import { getAddon, type AddonSku } from '@/lib/addons'
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
        const metaType = cs.metadata?.type
        const metaSku = cs.metadata?.sku

        // ── BRANCH A: One-time Add-on-Purchase (mode='payment') ──────────
        if (metaType === 'addon' && cs.mode === 'payment' && userId) {
          // SKU bestimmen: primaer aus metadata, fallback aus PriceID
          let sku: AddonSku | null = (metaSku as AddonSku) ?? null
          if (!sku) {
            // Defensive Fallback: line_items expandieren um price-id zu kriegen
            const expanded = await stripe.checkout.sessions.retrieve(cs.id, {
              expand: ['line_items.data.price'],
            })
            const firstPriceId =
              expanded.line_items?.data?.[0]?.price?.id ?? ''
            sku = addonSkuFromPriceId(firstPriceId)
          }
          if (!sku) {
            console.warn('stripe_addon_checkout_no_sku', {
              sessionId: cs.id,
              metaSku,
            })
            break
          }

          const addon = getAddon(sku)
          if (!addon) {
            console.warn('stripe_addon_unknown_sku', { sku })
            break
          }

          // Idempotenter Insert: Unique-Constraint auf stripeSessionId
          // verhindert Doppel-Order bei Webhook-Retries.
          try {
            const totalAmount =
              typeof cs.amount_total === 'number'
                ? cs.amount_total
                : addon.price * 100 * addon.quantity
            const order = await prisma.addonOrder.create({
              data: {
                userId,
                sku: addon.sku,
                quantity: addon.quantity,
                unitPrice: addon.price * 100,
                totalAmount,
                status: 'CONFIRMED',
                stripeSessionId: cs.id,
                notes: `Stripe-Checkout · ${addon.name}`,
              },
            })

            await prisma.auditLog.create({
              data: {
                userId,
                action: 'ADDON_PAID',
                entity: 'AddonOrder',
                entityId: order.id,
                details: JSON.stringify({
                  sku: addon.sku,
                  amountCents: totalAmount,
                  sessionId: cs.id,
                }),
              },
            })
          } catch (e: any) {
            // P2002 = Unique-Constraint-Verletzung → schon vorhandener Insert.
            // Wir loggen das, ignorieren es aber, weil das Idempotency ist.
            if (e?.code === 'P2002') {
              console.info('stripe_addon_duplicate_event_ignored', {
                sessionId: cs.id,
                sku,
              })
            } else {
              throw e
            }
          }
          break
        }

        // ── BRANCH B: Subscription-Checkout (mode='subscription') ────────
        const subId =
          typeof cs.subscription === 'string'
            ? cs.subscription
            : cs.subscription?.id
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
        // Plan-Status auf PAST_DUE setzen + Audit-Log. Stripe selbst
        // schickt dem Kunden die Mahn-Mails; wir reflektieren den Status
        // ins Dashboard, damit der Kunde proaktiv handeln kann (Stripe-
        // Customer-Portal-Link in der Billing-UI).
        const inv = event.data.object as Stripe.Invoice
        const customerId = typeof inv.customer === 'string' ? inv.customer : inv.customer?.id
        // Stripe API "dahlia" hat invoice.subscription entfernt; subId
        // koennen wir nicht mehr direkt vom Invoice-Objekt lesen. Fuer
        // den Status-Update reicht customerId — der User hat nur eine
        // aktive Subscription gleichzeitig.
        console.warn('stripe_invoice_payment_failed', {
          invoiceId: inv.id,
          customerId,
          amountDue: inv.amount_due,
        })
        if (!customerId) break

        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
          select: { id: true, email: true, name: true, planStatus: true },
        })
        if (!user) {
          console.warn('stripe_payment_failed_user_not_found', { customerId })
          break
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { planStatus: 'PAST_DUE' },
        })

        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'PAYMENT_FAILED',
            entity: 'Subscription',
            entityId: null,
            details: JSON.stringify({
              invoiceId: inv.id,
              amountDueCents: inv.amount_due,
              previousStatus: user.planStatus,
            }),
          },
        }).catch((e) => console.error('stripe_payment_failed_audit_log_error', e))

        // Best-effort: User per Mail benachrichtigen. Resend liefert via
        // lib/email; ohne RESEND_API_KEY laeuft das in den AuditLog
        // (Dev-Modus).
        try {
          const { sendEmail } = await import('@/lib/email')
          await sendEmail({
            to: user.email,
            subject: 'Ihre candiq-Zahlung ist fehlgeschlagen',
            text: `Hallo ${user.name},\n\nIhre letzte candiq-Abrechnung konnte nicht eingezogen werden. Bitte aktualisieren Sie Ihre Zahlungsmethode im Stripe-Customer-Portal — den Link finden Sie in Ihrem candiq-Dashboard unter "Abrechnung".\n\nDamit Ihr Zugang nicht unterbrochen wird, bitte innerhalb der nächsten Tage erledigen. Bei Rückfragen einfach auf diese Mail antworten.\n\nViele Grüße,\ncandiq`,
            html: `<p>Hallo ${user.name},</p><p>Ihre letzte candiq-Abrechnung konnte nicht eingezogen werden. Bitte aktualisieren Sie Ihre Zahlungsmethode im Stripe-Customer-Portal — den Link finden Sie in Ihrem candiq-Dashboard unter <strong>Abrechnung</strong>.</p><p>Damit Ihr Zugang nicht unterbrochen wird, bitte innerhalb der nächsten Tage erledigen. Bei Rückfragen einfach auf diese Mail antworten.</p><p>Viele Grüße,<br>candiq</p>`,
            category: 'stripe_payment_failed',
          })
        } catch (e) {
          console.error('stripe_payment_failed_email_error', e)
        }

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

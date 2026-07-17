import 'server-only'
import { prisma } from '@/lib/db'
import { stripe, deriveSubscriptionFields, type SubscriptionFields } from '@/lib/stripe'
import { logger } from '@/lib/logger'

/**
 * Stripe-Reconciliation (G6).
 *
 * Webhooks können verloren gehen (Downtime, 5xx, Zustell-Timeout). Dieser
 * Abgleich fährt periodisch über alle User MIT Subscription, holt den
 * IST-Zustand direkt aus Stripe und korrigiert Drift in der DB. Damit ist
 * der Umsatz-/Zugriffsstatus auch dann korrekt, wenn ein Webhook nie ankam.
 *
 * Bewusst NUR korrigierend, nicht überschreibend: Felder, die Stripe nicht
 * eindeutig liefert (unbekannte Price-ID → plan/billingInterval undefined),
 * werden NICHT genullt. `planStatus` ist immer definiert und maßgeblich.
 *
 * Vergleich läuft gegen `deriveSubscriptionFields` — dieselbe Ableitung wie
 * der Webhook, damit Cron und Webhook nie gegeneinander arbeiten.
 */

export type ReconcileResult = {
  checked: number
  drifted: number
  errors: number
  driftedUserIds: string[]
}

type UserRow = {
  id: string
  stripeSubscriptionId: string | null
  plan: string
  planStatus: string
  billingInterval: string | null
  currentPeriodEnd: Date | null
}

// Minimale Vertragsflächen — erlaubt Dependency-Injection im Test.
type StripeLike = { subscriptions: { retrieve: (id: string) => Promise<any> } }
type Db = {
  user: {
    findMany: (args: any) => Promise<UserRow[]>
    update: (args: any) => Promise<unknown>
  }
  auditLog: { create: (args: any) => Promise<unknown> }
}

/** Diff der Billing-Felder; nur eindeutig gelieferte Felder werden geprüft. */
export function subscriptionDrift(
  current: Pick<UserRow, 'plan' | 'planStatus' | 'billingInterval' | 'currentPeriodEnd'>,
  expected: SubscriptionFields,
): Partial<SubscriptionFields> {
  const diff: Partial<SubscriptionFields> = {}
  if (expected.planStatus !== current.planStatus) diff.planStatus = expected.planStatus
  if (expected.plan !== undefined && expected.plan !== current.plan) diff.plan = expected.plan
  if (
    expected.billingInterval !== undefined &&
    expected.billingInterval !== current.billingInterval
  ) {
    diff.billingInterval = expected.billingInterval
  }
  const curEnd = current.currentPeriodEnd ? current.currentPeriodEnd.getTime() : null
  const expEnd = expected.currentPeriodEnd ? expected.currentPeriodEnd.getTime() : null
  if (expEnd !== curEnd) diff.currentPeriodEnd = expected.currentPeriodEnd
  return diff
}

export async function reconcileSubscriptions(opts?: {
  limit?: number
  db?: Db
  stripeClient?: StripeLike
}): Promise<ReconcileResult> {
  const db = opts?.db ?? (prisma as unknown as Db)
  const sc = opts?.stripeClient ?? (stripe as unknown as StripeLike)
  const limit = opts?.limit ?? 1000

  const users = await db.user.findMany({
    where: { stripeSubscriptionId: { not: null } },
    select: {
      id: true,
      stripeSubscriptionId: true,
      plan: true,
      planStatus: true,
      billingInterval: true,
      currentPeriodEnd: true,
    },
    take: limit,
  })

  let checked = 0
  let drifted = 0
  let errors = 0
  const driftedUserIds: string[] = []

  for (const u of users) {
    if (!u.stripeSubscriptionId) continue
    try {
      const sub = await sc.subscriptions.retrieve(u.stripeSubscriptionId)
      const expected = deriveSubscriptionFields(sub)
      checked++
      const diff = subscriptionDrift(u, expected)
      if (Object.keys(diff).length === 0) continue

      await db.user.update({ where: { id: u.id }, data: diff })
      await db.auditLog.create({
        data: {
          userId: u.id,
          action: 'SUBSCRIPTION_RECONCILED',
          entity: 'Subscription',
          entityId: u.stripeSubscriptionId,
          details: JSON.stringify({
            changed: Object.keys(diff),
            planStatus: diff.planStatus ?? u.planStatus,
          }),
        },
      })
      drifted++
      driftedUserIds.push(u.id)
    } catch (err) {
      errors++
      logger.error('stripe_reconcile_user_failed', {
        userId: u.id,
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return { checked, drifted, errors, driftedUserIds }
}

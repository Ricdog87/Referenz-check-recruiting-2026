import { prisma } from './db'
import { getPlanById, trialDaysLeft } from './utils'
import type { DashboardStats } from './dashboard-stats'

/**
 * Plan- und Trial-Enforcement-Helfer.
 *
 * Designentscheidung: SOFT-Limits, nicht hart blockieren. Während Stripe noch
 * nicht angebunden ist, würde ein Hard-Block jeden Power-User vergraulen, der
 * eigentlich auf ein Upgrade zusteuert. Statt zu blockieren zeigen wir oben
 * im Dashboard ein „Upgrade nötig"-Banner mit klarem Conversion-Pfad.
 *
 * Trial-Logik: solange `trialEndsAt` in der Zukunft liegt, gibt's keinerlei
 * Limits — alle Pläne sind voll nutzbar. Nach Trial-Ablauf greifen die
 * Plan-Limits.
 */

export type PlanUsage = {
  candidatesTotal: number
  checksThisMonth: number
}

export type LimitState = {
  /** Plan-ID (z. B. STARTER, PROFESSIONAL) */
  plan: string
  /** Plan-Name für Anzeige */
  planName: string
  /** Inkludierte Checks pro Monat laut Plan; 0 = unbegrenzt (Enterprise) */
  monthlyCheckLimit: number
  /** Bisher in diesem Monat erstellte Checks */
  monthlyChecksUsed: number
  /** Anteil 0–1 (nur sinnvoll wenn limit > 0) */
  usageRatio: number
  /** True solange Trial aktiv ist (alle Limits ausgesetzt) */
  isTrialing: boolean
  trialDaysLeft: number | null
  /** True wenn Trial abgelaufen UND Plan-Limit überschritten */
  isOverLimit: boolean
  /** True wenn Trial abgelaufen UND ≥ 80% des Plan-Limits erreicht */
  isApproachingLimit: boolean
  /** True wenn Trial abgelaufen ist, aber noch nichts gekauft */
  isTrialExpired: boolean
}

/**
 * Standalone-Variante: lädt Plan + Trial + Monthly-Usage in 2 Queries.
 * Wenn der Aufrufer bereits DashboardStats geladen hat, lieber `limitStateFromStats()`
 * benutzen und die Doppel-Roundtrips sparen.
 */
export async function getLimitState(userId: string): Promise<LimitState> {
  const [user, monthlyChecksUsed] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, trialEndsAt: true },
    }),
    (() => {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      return prisma.referenceCheck.count({
        where: { candidate: { userId }, createdAt: { gte: startOfMonth } },
      })
    })(),
  ])

  return computeLimitState({
    plan: user?.plan ?? 'STARTER',
    trialEndsAt: user?.trialEndsAt ?? null,
    monthlyChecksUsed,
  })
}

/**
 * Schnelle Variante: nutzt das, was DashboardStats bereits geladen hat.
 * Keine zusätzliche DB-Roundtrip — der Banner ist Teil derselben Page-Render.
 */
export function limitStateFromStats(stats: DashboardStats): LimitState {
  return computeLimitState({
    plan: stats.plan,
    trialEndsAt: stats.trialEndsAt,
    monthlyChecksUsed: stats.monthlyChecksUsed,
  })
}

function computeLimitState(input: {
  plan: string
  trialEndsAt: Date | null
  monthlyChecksUsed: number
}): LimitState {
  const planMeta = getPlanById(input.plan)
  const monthlyCheckLimit = planMeta.includedChecks
  const trialLeft = trialDaysLeft(input.trialEndsAt)
  const isTrialing = trialLeft !== null && trialLeft > 0
  const isTrialExpired = trialLeft !== null && trialLeft === 0
  const usageRatio = monthlyCheckLimit > 0 ? input.monthlyChecksUsed / monthlyCheckLimit : 0
  const isOverLimit =
    !isTrialing && monthlyCheckLimit > 0 && input.monthlyChecksUsed >= monthlyCheckLimit
  const isApproachingLimit =
    !isTrialing && monthlyCheckLimit > 0 && usageRatio >= 0.8 && !isOverLimit

  return {
    plan: input.plan,
    planName: planMeta.name,
    monthlyCheckLimit,
    monthlyChecksUsed: input.monthlyChecksUsed,
    usageRatio,
    isTrialing,
    trialDaysLeft: trialLeft,
    isOverLimit,
    isApproachingLimit,
    isTrialExpired,
  }
}

/**
 * Server-side Guard für Endpoints, die zusätzliche Checks erstellen.
 * Liefert null wenn ok, sonst eine User-Facing-Fehlermeldung.
 *
 * Achtung: Soft-Enforcement → wir blockieren NICHT. Diese Funktion ist
 * für Frontend-Hinweise / Banner gedacht. Falls später Hard-Block gewünscht:
 * im API-Endpoint nutzen und 402/403 zurückgeben.
 */
export function softCheckLimit(state: LimitState): { ok: boolean; reason?: string } {
  if (state.isTrialing) return { ok: true }
  if (state.monthlyCheckLimit === 0) return { ok: true } // Enterprise / unbegrenzt
  if (state.isOverLimit) {
    return {
      ok: false,
      reason: `Plan-Limit erreicht (${state.monthlyChecksUsed}/${state.monthlyCheckLimit} Prüfungen diesen Monat). Bitte Plan upgraden.`,
    }
  }
  return { ok: true }
}

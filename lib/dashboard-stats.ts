import { unstable_cache } from 'next/cache'
import { prisma } from './db'

/**
 * Aggregierte Dashboard-Daten für einen User.
 *
 * Statt 14 einzelner Prisma-Queries (Promise.all hin oder her — jeder Call ist
 * ein Roundtrip durch pgbouncer) führen wir 4 SQL-Statements aus, davon zwei
 * mit `COUNT(*) FILTER WHERE …` Aggregation, sodass alle Status-Buckets in
 * einem Tabellen-Scan abgegriffen werden.
 *
 * Auf Free-Tier-Supabase reduziert das die Dashboard-Renderzeit von typisch
 * 800-1500ms (cold) auf ~200-400ms.
 */

export type DashboardStats = {
  // Candidate-Counts
  totalCandidates: number
  activeCandidates: number
  candidateStatusCounts: { pending: number; inReview: number; completed: number; rejected: number }
  consentedCandidates: number

  // Check-Counts
  totalChecks: number
  openChecks: number
  inProgressChecks: number
  completedChecks: number
  failedChecks: number
  verifiedChecks: number
  discrepancies: number
  unreachableChecks: number
  declinedChecks: number

  // Misc
  addonOrders: number

  // Limit-State (zusammen mit einer der Aggregations-Queries gefetcht)
  monthlyChecksUsed: number
  plan: string
  trialEndsAt: Date | null
}

type RawCandidateAgg = {
  total: bigint
  pending: bigint
  in_review: bigint
  completed: bigint
  rejected: bigint
  with_consent: bigint
}
type RawCheckAgg = {
  total: bigint
  open: bigint
  in_progress: bigint
  completed: bigint
  failed: bigint
  verified: bigint
  discrepancy_found: bigint
  unreachable: bigint
  declined: bigint
  this_month: bigint
}
type RawUserPlan = { plan: string; trialEndsAt: Date | null }
type RawAddonCount = { count: bigint }

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  // Monatsstart für "Checks diesen Monat"
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [candAgg, checkAgg, addonAgg, userPlan] = await Promise.all([
    // Eine Tabelle, alle Counts in einem Scan
    prisma.$queryRaw<RawCandidateAgg[]>`
      SELECT
        COUNT(*)::bigint AS total,
        COUNT(*) FILTER (WHERE "status" = 'PENDING')::bigint   AS pending,
        COUNT(*) FILTER (WHERE "status" = 'IN_REVIEW')::bigint AS in_review,
        COUNT(*) FILTER (WHERE "status" = 'COMPLETED')::bigint AS completed,
        COUNT(*) FILTER (WHERE "status" = 'REJECTED')::bigint  AS rejected,
        COUNT(*) FILTER (WHERE "gdprConsent" = true)::bigint   AS with_consent
      FROM "Candidate" WHERE "userId" = ${userId}
    `,
    prisma.$queryRaw<RawCheckAgg[]>`
      SELECT
        COUNT(*)::bigint AS total,
        COUNT(*) FILTER (WHERE rc."status" = 'OPEN')::bigint        AS open,
        COUNT(*) FILTER (WHERE rc."status" = 'IN_PROGRESS')::bigint AS in_progress,
        COUNT(*) FILTER (WHERE rc."status" = 'COMPLETED')::bigint   AS completed,
        COUNT(*) FILTER (WHERE rc."status" = 'FAILED')::bigint      AS failed,
        COUNT(*) FILTER (WHERE rc."result" = 'VERIFIED')::bigint           AS verified,
        COUNT(*) FILTER (WHERE rc."result" = 'DISCREPANCY_FOUND')::bigint  AS discrepancy_found,
        COUNT(*) FILTER (WHERE rc."result" = 'UNREACHABLE')::bigint        AS unreachable,
        COUNT(*) FILTER (WHERE rc."result" = 'DECLINED')::bigint           AS declined,
        COUNT(*) FILTER (WHERE rc."createdAt" >= ${startOfMonth})::bigint  AS this_month
      FROM "ReferenceCheck" rc
      JOIN "Candidate" c ON c."id" = rc."candidateId"
      WHERE c."userId" = ${userId}
    `,
    prisma.$queryRaw<RawAddonCount[]>`
      SELECT COUNT(*)::bigint AS count FROM "AddonOrder" WHERE "userId" = ${userId}
    `,
    prisma.$queryRaw<RawUserPlan[]>`
      SELECT "plan", "trialEndsAt" FROM "User" WHERE "id" = ${userId}
    `,
  ])

  const ZERO = BigInt(0)
  const c = candAgg[0] ?? {
    total: ZERO, pending: ZERO, in_review: ZERO, completed: ZERO, rejected: ZERO, with_consent: ZERO,
  }
  const k = checkAgg[0] ?? {
    total: ZERO, open: ZERO, in_progress: ZERO, completed: ZERO, failed: ZERO,
    verified: ZERO, discrepancy_found: ZERO, unreachable: ZERO, declined: ZERO, this_month: ZERO,
  }
  const a = addonAgg[0]?.count ?? ZERO
  const u = userPlan[0] ?? { plan: 'STARTER', trialEndsAt: null }

  return {
    totalCandidates: Number(c.total),
    activeCandidates: Number(c.in_review),
    consentedCandidates: Number(c.with_consent),
    candidateStatusCounts: {
      pending: Number(c.pending),
      inReview: Number(c.in_review),
      completed: Number(c.completed),
      rejected: Number(c.rejected),
    },

    totalChecks: Number(k.total),
    openChecks: Number(k.open),
    inProgressChecks: Number(k.in_progress),
    completedChecks: Number(k.completed),
    failedChecks: Number(k.failed),
    verifiedChecks: Number(k.verified),
    discrepancies: Number(k.discrepancy_found),
    unreachableChecks: Number(k.unreachable),
    declinedChecks: Number(k.declined),

    addonOrders: Number(a),
    monthlyChecksUsed: Number(k.this_month),
    plan: u.plan,
    trialEndsAt: u.trialEndsAt,
  }
}

/**
 * Trend- und Turnaround-Aggregationen direkt in SQL.
 *
 * Vorher: 30 Tage Roh-Rows holen + im Node-Loop bucketen → wachsendes Payload
 * mit den Daten des Users. Jetzt: zwei kleine GROUP-BY-Queries, die genau die
 * 14 / 7 Buckets liefern, die das Dashboard rendert.
 */
type RawTrendRow = {
  bucket: Date
  total: bigint
  verified: bigint
  discrepancy: bigint
}
type RawTurnaroundRow = {
  bucket: Date
  avg_hours: number | null
}

export type DashboardTrendBuckets = {
  trend: { date: string; total: number; verified: number; discrepancy: number }[]
  turnaround: { day: string; hours: number }[]
}

export async function getDashboardTrendBuckets(userId: string): Promise<DashboardTrendBuckets> {
  const now = new Date()
  const trendStart = new Date(now)
  trendStart.setHours(0, 0, 0, 0)
  trendStart.setDate(trendStart.getDate() - 13)

  const turnaroundStart = new Date(now)
  turnaroundStart.setHours(0, 0, 0, 0)
  turnaroundStart.setDate(turnaroundStart.getDate() - 6)

  const [trendRows, turnaroundRows] = await Promise.all([
    prisma.$queryRaw<RawTrendRow[]>`
      SELECT
        date_trunc('day', rc."updatedAt") AS bucket,
        COUNT(*)::bigint AS total,
        COUNT(*) FILTER (WHERE rc."result" = 'VERIFIED')::bigint           AS verified,
        COUNT(*) FILTER (WHERE rc."result" = 'DISCREPANCY_FOUND')::bigint  AS discrepancy
      FROM "ReferenceCheck" rc
      JOIN "Candidate" c ON c."id" = rc."candidateId"
      WHERE c."userId" = ${userId} AND rc."updatedAt" >= ${trendStart}
      GROUP BY 1
    `,
    prisma.$queryRaw<RawTurnaroundRow[]>`
      SELECT
        date_trunc('day', rc."calledAt") AS bucket,
        AVG(EXTRACT(EPOCH FROM (rc."calledAt" - rc."createdAt")) / 3600.0) AS avg_hours
      FROM "ReferenceCheck" rc
      JOIN "Candidate" c ON c."id" = rc."candidateId"
      WHERE c."userId" = ${userId}
        AND rc."calledAt" IS NOT NULL
        AND rc."calledAt" >= ${turnaroundStart}
      GROUP BY 1
    `,
  ])

  const trendByDay = new Map<string, RawTrendRow>()
  for (const row of trendRows) trendByDay.set(dayKey(row.bucket), row)

  const trend: DashboardTrendBuckets['trend'] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const row = trendByDay.get(dayKey(d))
    trend.push({
      date: d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
      total: row ? Number(row.total) : 0,
      verified: row ? Number(row.verified) : 0,
      discrepancy: row ? Number(row.discrepancy) : 0,
    })
  }

  const turnaroundByDay = new Map<string, RawTurnaroundRow>()
  for (const row of turnaroundRows) turnaroundByDay.set(dayKey(row.bucket), row)

  const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  const turnaround: DashboardTrendBuckets['turnaround'] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const row = turnaroundByDay.get(dayKey(d))
    const idx = d.getDay() === 0 ? 6 : d.getDay() - 1
    turnaround.push({
      day: dayLabels[idx],
      hours: row?.avg_hours ? Math.round(row.avg_hours) : 0,
    })
  }

  return { trend, turnaround }
}

function dayKey(d: Date): string {
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`
}

/**
 * Per-User Cache für die komplette Dashboard-Seite. 15s TTL ist kurz genug,
 * dass neue Kandidaten/Checks nahezu sofort sichtbar werden, lange genug,
 * dass schnelles Hin-und-Her-Navigieren keine erneute DB-Last erzeugt.
 *
 * Cache-Tag: `dashboard:<userId>` — beim Erstellen/Updaten von Kandidaten,
 * Checks oder Audit-Events kann via `revalidateTag` invalidiert werden.
 */
export const dashboardCacheTag = (userId: string) => `dashboard:${userId}`

export const getCachedDashboardStats = (userId: string) =>
  unstable_cache(
    () => getDashboardStats(userId),
    ['dashboard-stats', userId],
    { revalidate: 15, tags: [dashboardCacheTag(userId)] },
  )()

export const getCachedDashboardTrendBuckets = (userId: string) =>
  unstable_cache(
    () => getDashboardTrendBuckets(userId),
    ['dashboard-trend', userId],
    { revalidate: 30, tags: [dashboardCacheTag(userId)] },
  )()

export type DashboardRecentLists = {
  recentCandidates: {
    id: string
    firstName: string
    lastName: string
    position: string
    status: string
    _count: { checks: number }
  }[]
  recentChecks: {
    id: string
    employerName: string
    status: string
    result: string | null
    candidate: { firstName: string; lastName: string; position: string }
  }[]
  recentEvents: {
    id: string
    action: string
    entity: string
    details: string | null
    createdAt: Date
  }[]
}

async function fetchDashboardRecentLists(userId: string): Promise<DashboardRecentLists> {
  const [recentCandidates, recentChecks, recentEvents] = await Promise.all([
    prisma.candidate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true, firstName: true, lastName: true, position: true, status: true,
        _count: { select: { checks: true } },
      },
    }),
    prisma.referenceCheck.findMany({
      where: { candidate: { userId } },
      orderBy: { updatedAt: 'desc' },
      take: 6,
      select: {
        id: true, employerName: true, status: true, result: true,
        candidate: { select: { firstName: true, lastName: true, position: true } },
      },
    }),
    prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, action: true, entity: true, details: true, createdAt: true },
    }),
  ])
  return { recentCandidates, recentChecks, recentEvents }
}

export const getCachedDashboardRecentLists = (userId: string) =>
  unstable_cache(
    () => fetchDashboardRecentLists(userId),
    ['dashboard-recent', userId],
    { revalidate: 15, tags: [dashboardCacheTag(userId)] },
  )()

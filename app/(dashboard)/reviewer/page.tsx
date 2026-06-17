import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isReviewer, isAdmin, slaState, formatHoursShort, SLA_HOURS, type SlaState } from '@/lib/reviewer'
import { Header } from '@/components/layout/Header'
import {
  ClipboardList,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
} from 'lucide-react'

// Stats immer frisch — sehr leichte Queries, kein Cache noetig.
export const dynamic = 'force-dynamic'

export default async function ReviewerDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (!isReviewer(session)) redirect('/dashboard')

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400e3)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400e3)

  // Parallel: spart Latenz auf der Landing-Seite.
  const [openChecks, releasedToday, releasedLast7d, topReviewersRaw] = await Promise.all([
    prisma.referenceCheck.findMany({
      where: { status: 'IN_REVIEW' },
      select: { id: true, updatedAt: true, isExpress: true },
    }),
    prisma.auditLog.count({
      where: { action: 'REVIEW_RELEASE', createdAt: { gte: startOfToday } },
    }),
    prisma.auditLog.count({
      where: { action: 'REVIEW_RELEASE', createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        action: 'REVIEW_RELEASE',
        createdAt: { gte: thirtyDaysAgo },
        userId: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 10,
    }),
  ])

  // User-Details nur fuer die Top-Reviewer nachladen — 1 zusaetzliche Query.
  const reviewerIds = topReviewersRaw
    .map((g) => g.userId)
    .filter((id): id is string => id !== null)
  const reviewerUsers = reviewerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: reviewerIds } },
        select: { id: true, name: true, email: true },
      })
    : []
  const reviewerMap = new Map(reviewerUsers.map((u) => [u.id, u]))

  // Aelteste offene Pruefung + Anzahl SLA-Verletzungen.
  // Bei Express-Checks gilt 12h-SLA statt 24h.
  let oldest: { hoursInQueue: number; state: SlaState } | null = null
  let breachedCount = 0
  let expressCount = 0
  for (const c of openChecks) {
    if (c.isExpress) expressCount++
    const sla = slaState(c.updatedAt, { isExpress: c.isExpress }, now)
    if (sla.state === 'breached') breachedCount++
    if (!oldest || sla.hoursInQueue > oldest.hoursInQueue) {
      oldest = { hoursInQueue: sla.hoursInQueue, state: sla.state }
    }
  }

  return (
    <>
      <Header
        title="Reviewer-Dashboard"
        subtitle={`SLA ${SLA_HOURS}h · ${openChecks.length} offen${expressCount > 0 ? ` · ${expressCount}× Express (12h)` : ''}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Offen in Queue"
          value={openChecks.length}
          icon={<ClipboardList className="w-4 h-4" />}
          accent="brand"
        />
        <StatCard
          label="Aelteste Pruefung"
          value={oldest ? formatHoursShort(oldest.hoursInQueue) : '—'}
          icon={
            oldest?.state === 'breached' ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <Clock className="w-4 h-4" />
            )
          }
          accent={
            oldest?.state === 'breached'
              ? 'rose'
              : oldest?.state === 'warn'
              ? 'amber'
              : 'emerald'
          }
        />
        <StatCard
          label="Heute freigegeben"
          value={releasedToday}
          icon={<CheckCircle2 className="w-4 h-4" />}
          accent="emerald"
        />
        <StatCard
          label="Letzte 7 Tage"
          value={releasedLast7d}
          icon={<TrendingUp className="w-4 h-4" />}
          accent="brand"
        />
      </div>

      {breachedCount > 0 && (
        <div className="card-md border border-rose-200 bg-rose-50 p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="font-semibold text-rose-800">
              {breachedCount} Pruefung(en) ueber {SLA_HOURS}h in der Queue
            </div>
            <div className="text-sm text-rose-700 mt-0.5">
              SLA verletzt — bitte priorisiert abarbeiten.
            </div>
            <Link
              href="/reviewer/queue"
              className="text-sm font-semibold text-rose-800 hover:underline mt-1 inline-block"
            >
              Zur Queue →
            </Link>
          </div>
        </div>
      )}

      <div className={`grid gap-3 mb-6 ${isAdmin(session) ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        <Link
          href="/reviewer/queue"
          className="card-lg p-5 flex items-center justify-between hover:border-brand-300 transition-colors"
        >
          <div>
            <div className="font-bold text-text-primary">Reviewer-Queue oeffnen</div>
            <div className="text-sm text-text-secondary">
              {openChecks.length === 0
                ? 'Aktuell keine offenen Pruefungen — alles abgearbeitet.'
                : `${openChecks.length} Pruefung(en) FIFO sortiert (aelteste zuerst).`}
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-text-muted" />
        </Link>

        {isAdmin(session) && (
          <Link
            href="/admin/customers"
            className="card-lg p-5 flex items-center justify-between hover:border-brand-300 transition-colors"
          >
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-text-muted mt-0.5" />
              <div>
                <div className="font-bold text-text-primary">Kundenverwaltung</div>
                <div className="text-sm text-text-secondary">
                  Alle HR-Kunden, Auftraege, Reviewer-Zuweisungen, Add-on-Orders.
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-text-muted" />
          </Link>
        )}
      </div>

      <div className="card-lg p-5">
        <div className="font-bold text-text-primary mb-1">Top-Reviewer · letzte 30 Tage</div>
        <div className="text-xs text-text-muted mb-4">
          Basiert auf <code className="text-[11px] font-mono">AuditLog.action = REVIEW_RELEASE</code>
        </div>
        {topReviewersRaw.length === 0 ? (
          <div className="text-sm text-text-muted py-2">Keine Freigaben im Zeitraum.</div>
        ) : (
          <div className="space-y-1">
            {topReviewersRaw.map((g, i) => {
              const u = g.userId ? reviewerMap.get(g.userId) : null
              return (
                <div
                  key={g.userId ?? `row-${i}`}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-text-primary truncate">
                      <span className="text-text-muted font-normal mr-1">#{i + 1}</span>
                      {u?.name ?? u?.email ?? '— unbekannt —'}
                    </div>
                    {u?.email && u?.name && (
                      <div className="text-xs text-text-muted truncate">{u.email}</div>
                    )}
                  </div>
                  <div className="text-sm font-bold text-text-primary shrink-0 ml-3">
                    {g._count._all}
                    <span className="text-text-muted font-normal text-xs ml-1">Freigaben</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

type Accent = 'brand' | 'rose' | 'amber' | 'emerald'

// Tailwind-JIT-safe: komplette Klassen-Strings, kein dynamisches Klassen-Mash-up.
const ACCENT_CLASSES: Record<Accent, string> = {
  brand: 'text-brand-600 bg-brand-50',
  rose: 'text-rose-600 bg-rose-50',
  amber: 'text-amber-600 bg-amber-50',
  emerald: 'text-emerald-600 bg-emerald-50',
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  accent: Accent
}) {
  return (
    <div className="card-md p-4">
      <div className="flex items-start justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          {label}
        </span>
        <span
          className={`w-7 h-7 rounded-lg flex items-center justify-center ${ACCENT_CLASSES[accent]}`}
        >
          {icon}
        </span>
      </div>
      <div className="text-2xl font-bold text-text-primary">{value}</div>
    </div>
  )
}

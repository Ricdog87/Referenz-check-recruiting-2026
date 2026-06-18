import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isReviewer, slaState, formatHoursShort, SLA_HOURS } from '@/lib/reviewer'
import { Header } from '@/components/layout/Header'
import { formatDate } from '@/lib/utils'
import { ClipboardList, ArrowRight, Clock, AlertTriangle, Zap } from 'lucide-react'

// Reviewer-Queue ist immer frisch — kein Caching.
export const dynamic = 'force-dynamic'

type Filter = 'all' | 'mine' | 'unassigned'

export default async function ReviewerQueuePage({
  searchParams,
}: {
  searchParams: { filter?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  // Rollen-Gate (zusätzlich zur Middleware): CLIENT landet zurück im Dashboard.
  if (!isReviewer(session)) redirect('/dashboard')

  const filter: Filter =
    searchParams.filter === 'mine'
      ? 'mine'
      : searchParams.filter === 'unassigned'
      ? 'unassigned'
      : 'all'

  const assignmentWhere =
    filter === 'mine'
      ? { assignedReviewerId: session.user.id }
      : filter === 'unassigned'
      ? { assignedReviewerId: null }
      : {}

  // Counters für die Tab-Labels — eine Query mit groupBy.
  const allOpenChecks = await prisma.referenceCheck.findMany({
    where: { status: 'IN_REVIEW' },
    select: { id: true, isExpress: true, assignedReviewerId: true },
  })
  const counts = {
    all: allOpenChecks.length,
    mine: allOpenChecks.filter((c) => c.assignedReviewerId === session.user.id).length,
    unassigned: allOpenChecks.filter((c) => c.assignedReviewerId === null).length,
  }

  // Bewusst KEIN userId-Filter (auf Candidate.userId) — Reviewer arbeiten
  // workspace-übergreifend. Sortier-Prio: Express zuerst, dann FIFO.
  const checks = await prisma.referenceCheck.findMany({
    where: { status: 'IN_REVIEW', ...assignmentWhere },
    orderBy: [{ isExpress: 'desc' }, { updatedAt: 'asc' }],
    include: {
      candidate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
          user: { select: { name: true, email: true, company: true } },
        },
      },
      assignedReviewer: { select: { id: true, name: true, email: true } },
    },
  })
  const expressCount = checks.filter((c) => c.isExpress).length

  return (
    <>
      <Header
        title="Reviewer-Queue"
        subtitle={`${checks.length} Prüfung(en) · SLA ${SLA_HOURS}h${expressCount > 0 ? ` · ${expressCount}× Express (12h)` : ''}`}
      />

      <div className="flex items-center gap-1 mb-4 border-b border-border">
        <FilterTab href="/reviewer/queue" active={filter === 'all'} label="Alle" count={counts.all} />
        <FilterTab href="/reviewer/queue?filter=mine" active={filter === 'mine'} label="Meine" count={counts.mine} />
        <FilterTab href="/reviewer/queue?filter=unassigned" active={filter === 'unassigned'} label="Nicht zugewiesen" count={counts.unassigned} />
      </div>

      {checks.length === 0 ? (
        <div className="card-lg text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-bg-secondary mx-auto mb-4 flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-text-muted" />
          </div>
          <div className="text-text-primary font-semibold mb-1">Queue ist leer</div>
          <div className="text-text-muted text-sm">
            Aktuell liegt keine Prüfung im Status &bdquo;In Review&ldquo;.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {checks.map((check) => {
            const sla = slaState(check.updatedAt, { isExpress: check.isExpress })
            const badge =
              sla.state === 'breached'
                ? {
                    cls: 'bg-rose-50 text-rose-700 border-rose-200',
                    icon: <AlertTriangle className="w-3 h-3" />,
                    label: `SLA + ${formatHoursShort(Math.abs(sla.hoursLeft))}`,
                  }
                : sla.state === 'warn'
                ? {
                    cls: 'bg-amber-50 text-amber-700 border-amber-200',
                    icon: <Clock className="w-3 h-3" />,
                    label: `SLA in ${formatHoursShort(sla.hoursLeft)}`,
                  }
                : {
                    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    icon: <Clock className="w-3 h-3" />,
                    label: `${formatHoursShort(sla.hoursInQueue)} alt`,
                  }
            return (
              <Link
                key={check.id}
                href={`/reviewer/check/${check.id}`}
                className={`card-md p-4 flex items-center justify-between hover:border-border-strong transition-all ${
                  check.isExpress ? 'border-rose-300 bg-rose-50/30' : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="font-semibold text-text-primary truncate flex items-center gap-2">
                    {check.isExpress && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider shrink-0"
                        title="Express-24h gebucht (12h-SLA)"
                      >
                        <Zap className="w-3 h-3 fill-white" />
                        Express
                      </span>
                    )}
                    <span className="truncate">
                      {check.candidate.firstName} {check.candidate.lastName}
                      <span className="text-text-muted font-normal"> · {check.candidate.position}</span>
                    </span>
                  </div>
                  <div className="text-sm text-text-secondary truncate">
                    Arbeitgeber: {check.employerName}
                    {check.employerContact ? ` · ${check.employerContact}` : ''}
                  </div>
                  <div className="text-xs text-text-muted mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>
                      Kunde:{' '}
                      <span className="text-text-secondary font-medium">
                        {check.candidate.user.company ?? check.candidate.user.name ?? check.candidate.user.email}
                      </span>
                    </span>
                    <span aria-hidden="true">·</span>
                    {check.assignedReviewer ? (
                      <span>
                        Reviewer:{' '}
                        <span className="text-text-secondary font-medium">
                          {check.assignedReviewer.name ?? check.assignedReviewer.email}
                          {check.assignedReviewer.id === session.user.id ? ' (ich)' : ''}
                        </span>
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium">offen — nicht zugewiesen</span>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>seit {formatDate(check.updatedAt)}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${badge.cls}`}
                      title={`Im Review seit ${formatHoursShort(sla.hoursInQueue)}`}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-text-muted shrink-0 ml-3" />
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}

function FilterTab({
  href,
  active,
  label,
  count,
}: {
  href: string
  active: boolean
  label: string
  count: number
}) {
  return (
    <Link
      href={href}
      className={`relative px-3 py-2 text-sm font-semibold transition-colors ${
        active
          ? 'text-text-primary'
          : 'text-text-muted hover:text-text-primary'
      }`}
    >
      {label}
      <span
        className={`ml-1.5 text-xs ${
          active ? 'text-brand-700 font-bold' : 'text-text-muted'
        }`}
      >
        {count}
      </span>
      {active && (
        <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-brand-600" />
      )}
    </Link>
  )
}


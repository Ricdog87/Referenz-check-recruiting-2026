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

export default async function ReviewerQueuePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  // Rollen-Gate (zusätzlich zur Middleware): CLIENT landet zurück im Dashboard.
  if (!isReviewer(session)) redirect('/dashboard')

  // Bewusst KEIN userId-Filter — Reviewer arbeiten workspace-übergreifend.
  // Sortier-Prio: Express-Checks (€29 Aufpreis, 12h-SLA) zuerst, dann FIFO.
  const checks = await prisma.referenceCheck.findMany({
    where: { status: 'IN_REVIEW' },
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
    },
  })
  const expressCount = checks.filter((c) => c.isExpress).length

  return (
    <>
      <Header
        title="Reviewer-Queue"
        subtitle={`${checks.length} Prüfung(en) im Review · SLA ${SLA_HOURS}h${expressCount > 0 ? ` · ${expressCount}× Express (12h)` : ''}`}
      />

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


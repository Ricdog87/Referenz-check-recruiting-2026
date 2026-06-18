import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { safeQuery } from '@/lib/safe-query'
import { isAdmin, slaState, formatHoursShort, SLA_HOURS } from '@/lib/reviewer'
import { ALL_PLANS, formatDate } from '@/lib/utils'
import {
  Building2, Users, ClipboardList, CheckCircle2, AlertTriangle,
  Clock, ShieldCheck, ArrowRight, UserPlus, Euro,
} from 'lucide-react'

// Internes Cockpit ist immer frisch — kein Caching.
export const dynamic = 'force-dynamic'

// Reviewer/Admin-Accounts sind candiq-intern und zaehlen NICHT als Kunden.
const CUSTOMER_FILTER = { role: { notIn: ['REVIEWER', 'ADMIN'] } }

export default async function AdminCockpitPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  // Hartes Rollen-Gate (zusätzlich zur Middleware): nur ADMIN.
  if (!isAdmin(session)) redirect('/dashboard')

  const [
    totalCustomers,
    activeCustomers,
    trialingCustomers,
    activePlans,
    totalCandidates,
    totalChecks,
    openChecks,
    inReviewChecks,
    completedChecks,
    discrepancies,
    inReviewList,
    recentCustomers,
    recentReleases,
  ] = await Promise.all([
    safeQuery(prisma.user.count({ where: CUSTOMER_FILTER }), 0, 'admin.totalCustomers'),
    safeQuery(prisma.user.count({ where: { ...CUSTOMER_FILTER, planStatus: 'ACTIVE' } }), 0, 'admin.activeCustomers'),
    safeQuery(prisma.user.count({ where: { ...CUSTOMER_FILTER, planStatus: 'TRIALING' } }), 0, 'admin.trialingCustomers'),
    safeQuery(
      prisma.user.findMany({ where: { ...CUSTOMER_FILTER, planStatus: 'ACTIVE' }, select: { plan: true } }),
      [] as { plan: string }[],
      'admin.activePlans',
    ),
    safeQuery(prisma.candidate.count(), 0, 'admin.totalCandidates'),
    safeQuery(prisma.referenceCheck.count(), 0, 'admin.totalChecks'),
    safeQuery(prisma.referenceCheck.count({ where: { status: 'OPEN' } }), 0, 'admin.openChecks'),
    safeQuery(prisma.referenceCheck.count({ where: { status: 'IN_REVIEW' } }), 0, 'admin.inReviewChecks'),
    safeQuery(prisma.referenceCheck.count({ where: { status: 'COMPLETED' } }), 0, 'admin.completedChecks'),
    safeQuery(prisma.referenceCheck.count({ where: { result: 'DISCREPANCY_FOUND' } }), 0, 'admin.discrepancies'),
    safeQuery(
      prisma.referenceCheck.findMany({ where: { status: 'IN_REVIEW' }, select: { updatedAt: true, isExpress: true } }),
      [] as { updatedAt: Date; isExpress: boolean }[],
      'admin.inReviewList',
    ),
    safeQuery(
      prisma.user.findMany({
        where: CUSTOMER_FILTER,
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, name: true, company: true, email: true, plan: true, planStatus: true, createdAt: true },
      }),
      [] as { id: string; name: string; company: string; email: string; plan: string; planStatus: string; createdAt: Date }[],
      'admin.recentCustomers',
    ),
    safeQuery(
      prisma.auditLog.findMany({
        where: { action: 'REVIEW_RELEASE' },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, createdAt: true, details: true },
      }),
      [] as { id: string; createdAt: Date; details: string | null }[],
      'admin.recentReleases',
    ),
  ])

  // MRR aus aktiven Abos (Monats-Listenpreis je Plan).
  const planPrice = new Map<string, number>(ALL_PLANS.map((p) => [p.id, p.priceMonthly] as [string, number]))
  const mrr = activePlans.reduce((sum, u) => sum + (planPrice.get(u.plan) ?? 0), 0)

  // SLA-Auswertung der Reviewer-Queue.
  const now = new Date()
  const slaBreaches = inReviewList.filter(
    (c) => slaState(c.updatedAt, { isExpress: c.isExpress }, now).state === 'breached',
  ).length
  const oldest = inReviewList.reduce<Date | null>(
    (min, c) => (!min || c.updatedAt < min ? c.updatedAt : min),
    null,
  )
  const oldestHours = oldest ? (now.getTime() - new Date(oldest).getTime()) / 3_600_000 : 0

  return (
    <div className="py-6 space-y-6">
      {/* Admin-Banner — bewusst dunkel, klar abgegrenzt vom Kunden-Dashboard */}
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #4f46e5 100%)' }}
      >
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/70 mb-1">
          <ShieldCheck className="w-3.5 h-3.5" /> candiq · Admin · intern
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Interne Übersicht</h1>
        <p className="text-sm text-white/70 mt-1">
          Plattform-Kennzahlen, Kunden &amp; Reviewer-Betrieb — nur für das candiq-Team sichtbar.
        </p>
      </div>

      {/* Kennzahlen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Building2} label="Kunden gesamt" value={totalCustomers} sub={`${activeCustomers} aktiv · ${trialingCustomers} im Trial`} />
        <Stat icon={Euro} label="MRR" value={`${mrr.toLocaleString('de-DE')} €`} sub="aus aktiven Abos / Monat" />
        <Stat icon={Users} label="Kandidaten" value={totalCandidates} sub="plattformweit" />
        <Stat icon={ClipboardList} label="Prüfungen gesamt" value={totalChecks} sub={`${openChecks} offen · ${completedChecks} fertig`} />
      </div>

      {/* Reviewer-Betrieb — operativ wichtig, daher hervorgehoben */}
      <div className={`card-lg p-5 ${slaBreaches > 0 ? 'ring-2 ring-rose-200' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">Reviewer-Queue</h2>
          </div>
          <Link href="/reviewer/queue" className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-1">
            Zur Queue <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat icon={Clock} label="Im Review" value={inReviewChecks} sub={`SLA ${SLA_HOURS}h`} />
          <Stat icon={Clock} label="Älteste offen" value={oldest ? formatHoursShort(oldestHours) : '—'} sub={oldest ? 'in der Queue' : 'Queue leer'} />
          <Stat icon={AlertTriangle} label="SLA-Verstöße" value={slaBreaches} tone={slaBreaches > 0 ? 'danger' : undefined} />
          <Stat icon={AlertTriangle} label="Unstimmigkeiten" value={discrepancies} sub="Ergebnis: gefunden" tone={discrepancies > 0 ? 'warn' : undefined} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Neueste Kunden */}
        <div className="card-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">Neueste Kunden</h2>
            </div>
            <Link href="/admin/customers" className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-1">
              Alle Kunden <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentCustomers.length === 0 ? (
            <p className="text-sm text-text-muted">Noch keine Kunden erfasst.</p>
          ) : (
            <ul className="space-y-2">
              {recentCustomers.map((u) => (
                <li key={u.id}>
                  <Link href={`/admin/customers/${u.id}`} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-bg-secondary transition-colors">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-text-primary truncate">{u.company || u.name}</div>
                      <div className="text-xs text-text-muted truncate">{u.email}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-semibold text-text-secondary">{u.plan}</div>
                      <div className="text-[11px] text-text-muted">{formatDate(u.createdAt)}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Letzte Freigaben */}
        <div className="card-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">Letzte Freigaben</h2>
          </div>
          {recentReleases.length === 0 ? (
            <p className="text-sm text-text-muted">Noch keine Freigaben.</p>
          ) : (
            <ul className="space-y-2">
              {recentReleases.map((r) => {
                let result: string | null = null
                let rating: number | null = null
                try {
                  const d = r.details ? JSON.parse(r.details) : null
                  result = d?.result ?? null
                  rating = typeof d?.rating === 'number' ? d.rating : null
                } catch {
                  /* details kein valides JSON — ignorieren */
                }
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="text-sm text-text-secondary truncate">{result ?? 'Freigegeben'}{rating ? ` · ${rating}/5` : ''}</span>
                    </div>
                    <span className="text-[11px] text-text-muted flex-shrink-0">{formatDate(r.createdAt)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: any
  label: string
  value: string | number
  sub?: string
  tone?: 'danger' | 'warn'
}) {
  const valueColor = tone === 'danger' ? 'text-rose-600' : tone === 'warn' ? 'text-amber-600' : 'text-text-primary'
  return (
    <div className="card-md p-4">
      <div className="flex items-center gap-2 text-text-muted text-[11px] font-semibold uppercase tracking-wide mb-2">
        <Icon className="w-4 h-4" /> {label}
      </div>
      <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
      {sub && <div className="text-xs text-text-muted mt-1">{sub}</div>}
    </div>
  )
}

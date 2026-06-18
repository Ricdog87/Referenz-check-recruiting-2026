import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { safeQuery } from '@/lib/safe-query'
import { isReviewer, isAdmin } from '@/lib/reviewer'
import { redirect } from 'next/navigation'
import { WelcomeBar } from '@/components/dashboard/WelcomeBar'
import Link from 'next/link'
import { CANDIDATE_STATUS, CHECK_STATUS, getPlanById, ACCOUNT_TYPES } from '@/lib/utils'
import {
  Users, AlertTriangle, TrendingUp, ArrowUpRight,
  Plus, Sparkles, Clock, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { ActivityAreaChart, StatusPieChart, TurnaroundBarChart } from '@/components/dashboard/DashboardCharts'
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  // Role-Routing: candiq-internes Personal (ADMIN/REVIEWER) hat eigene
  // Cockpits — das Kunden-Dashboard ist fuer sie inhaltlich irrelevant
  // (keine eigenen Kandidaten, keine Pipeline-Health, keine Add-on-Buchungen).
  // ADMIN → Kundenliste; REVIEWER → Stats-Dashboard.
  if (isAdmin(session)) redirect('/admin/customers')
  if (isReviewer(session)) redirect('/reviewer')

  const userId = session.user.id
  const isAgency = session.user.accountType === 'RECRUITMENT_AGENCY'

  // Jede einzelne Query so wrappen, dass ein Fehler NIE das gesamte Dashboard
  // auf error.tsx schickt. Pro Query gibt es einen typsicheren Fallback.
  // Siehe lib/safe-query.ts fuer Rationale.

  const [
    totalCandidates,
    activeCandidates,
    completedChecks,
    openChecks,
    inProgressChecks,
    discrepancies,
    verifiedChecks,
    recentCandidates,
    recentChecks,
    candidateStatusGroups,
    allChecks,
    consentedCandidates,
    addonOrders,
    recentEvents,
  ] = await Promise.all([
    safeQuery(prisma.candidate.count({ where: { userId } }), 0, 'totalCandidates'),
    safeQuery(prisma.candidate.count({ where: { userId, status: 'IN_REVIEW' } }), 0, 'activeCandidates'),
    safeQuery(prisma.referenceCheck.count({ where: { candidate: { userId }, status: 'COMPLETED' } }), 0, 'completedChecks'),
    safeQuery(prisma.referenceCheck.count({ where: { candidate: { userId }, status: 'OPEN' } }), 0, 'openChecks'),
    safeQuery(prisma.referenceCheck.count({ where: { candidate: { userId }, status: 'IN_PROGRESS' } }), 0, 'inProgressChecks'),
    safeQuery(prisma.referenceCheck.count({ where: { candidate: { userId }, result: 'DISCREPANCY_FOUND' } }), 0, 'discrepancies'),
    safeQuery(prisma.referenceCheck.count({ where: { candidate: { userId }, result: 'VERIFIED' } }), 0, 'verifiedChecks'),
    safeQuery(
      prisma.candidate.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { _count: { select: { checks: true } } },
      }),
      [],
      'recentCandidates',
    ),
    safeQuery(
      prisma.referenceCheck.findMany({
        where: { candidate: { userId } },
        orderBy: { updatedAt: 'desc' },
        take: 6,
        include: { candidate: { select: { firstName: true, lastName: true, position: true } } },
      }),
      [],
      'recentChecks',
    ),
    safeQuery(
      prisma.candidate.groupBy({ by: ['status'], where: { userId }, _count: true }),
      [] as { status: string; _count: number }[],
      'candidateStatusGroups',
    ),
    safeQuery(
      prisma.referenceCheck.findMany({
        where: { candidate: { userId } },
        select: { createdAt: true, calledAt: true, result: true, status: true, updatedAt: true },
      }),
      [] as { createdAt: Date; calledAt: Date | null; result: string | null; status: string; updatedAt: Date }[],
      'allChecks',
    ),
    safeQuery(prisma.candidate.count({ where: { userId, gdprConsent: true } }), 0, 'consentedCandidates'),
    safeQuery(prisma.addonOrder.count({ where: { userId } }), 0, 'addonOrders'),
    safeQuery(
      prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, action: true, entity: true, details: true, createdAt: true },
      }),
      [] as { id: string; action: string; entity: string; details: string | null; createdAt: Date }[],
      'recentEvents',
    ),
  ])

  const totalChecks = openChecks + inProgressChecks + completedChecks
  const verificationRate = totalChecks > 0 ? Math.round((verifiedChecks / totalChecks) * 100) : 0
  const planMeta = getPlanById(session.user.plan ?? 'STARTER')

  // Build trend data (last 14 days)
  const days = 14
  const trend: { date: string; total: number; verified: number; discrepancy: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const next = new Date(d); next.setDate(d.getDate() + 1)
    const dayChecks = allChecks.filter((c) => {
      // updatedAt ist im Schema non-null, aber in Prisma-Sicht ist der
      // Driver-Layer nicht zu 100% trauenswert (Edge-Cases bei nicht
      // migrierten Spalten o.ae.). Defensiv pruefen.
      if (!c?.updatedAt || typeof (c.updatedAt as Date).getTime !== 'function') return false
      const t = (c.updatedAt as Date).getTime()
      return t >= d.getTime() && t < next.getTime()
    })
    trend.push({
      date: d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
      total: dayChecks.length,
      verified: dayChecks.filter((c) => c.result === 'VERIFIED').length,
      discrepancy: dayChecks.filter((c) => c.result === 'DISCREPANCY_FOUND').length,
    })
  }

  // Avg turnaround in hours — defensiv. Nur Eintraege mit zwei validen Dates.
  const turnaroundChecks = allChecks.filter(
    (c): c is typeof c & { calledAt: Date; createdAt: Date } =>
      !!c?.calledAt && !!c?.createdAt
        && typeof (c.calledAt as Date).getTime === 'function'
        && typeof (c.createdAt as Date).getTime === 'function',
  )
  const turnaround: { day: string; hours: number }[] = []
  const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0)
    const next = new Date(d); next.setDate(d.getDate() + 1)
    const dc = turnaroundChecks.filter((c) => c.calledAt.getTime() >= d.getTime() && c.calledAt.getTime() < next.getTime())
    const avgH = dc.length === 0
      ? 0
      : Math.round(dc.reduce((acc, c) => acc + (c.calledAt.getTime() - c.createdAt.getTime()) / 36e5, 0) / dc.length)
    // Array-Index defensiv: getDay() liefert immer 0-6, dayLabels hat 7 Eintraege.
    // Trotzdem Fallback fuer Engine-Edge-Cases (z. B. Timezone-Verschiebungen).
    const dayLabel = dayLabels[d.getDay() === 0 ? 6 : d.getDay() - 1] ?? '—'
    turnaround.push({ day: dayLabel, hours: avgH })
  }

  // Status distribution
  const statusDist = [
    { name: 'Ausstehend', value: candidateStatusGroups.find((g) => g.status === 'PENDING')?._count ?? 0, color: '#94a3b8' },
    { name: 'Einwilligung erteilt', value: candidateStatusGroups.find((g) => g.status === 'CONSENT_GIVEN')?._count ?? 0, color: '#22c55e' },
    { name: 'In Prüfung', value: candidateStatusGroups.find((g) => g.status === 'IN_REVIEW')?._count ?? 0, color: '#6366f1' },
    { name: 'Abgeschlossen', value: candidateStatusGroups.find((g) => g.status === 'COMPLETED')?._count ?? 0, color: '#10b981' },
    { name: 'Einwilligung widerrufen', value: candidateStatusGroups.find((g) => g.status === 'CONSENT_REVOKED')?._count ?? 0, color: '#fb7185' },
    { name: 'Abgelehnt', value: candidateStatusGroups.find((g) => g.status === 'REJECTED')?._count ?? 0, color: '#f43f5e' },
  ]

  // Plan usage
  const usedThisMonth = totalChecks
  const checkLimit = planMeta.includedChecks
  const usagePct = checkLimit > 0 ? Math.min(100, Math.round((usedThisMonth / checkLimit) * 100)) : 0

  // Avg turnaround value
  const turnaroundValue = turnaround.reduce((a, b) => a + b.hours, 0) / Math.max(1, turnaround.filter(t => t.hours).length) || 0

  const stats = [
    {
      label: 'Kandidaten',
      value: totalCandidates,
      sub: totalCandidates === 0 ? 'Noch keine Kandidaten' : `${activeCandidates} in Prüfung`,
      icon: Users,
      tone: 'brand' as const,
      delta: null,
    },
    {
      label: 'Verifizierungsrate',
      value: totalChecks > 0 ? `${verificationRate}%` : '—',
      sub: totalChecks === 0 ? 'Noch keine Prüfungen' : `${verifiedChecks} verifiziert`,
      icon: CheckCircle2,
      tone: 'emerald' as const,
      delta: null,
    },
    {
      label: 'Diskrepanzen',
      value: discrepancies,
      sub: totalChecks === 0 ? 'Noch keine Prüfungen' : (discrepancies === 0 ? 'Keine Auffälligkeiten' : 'gefunden'),
      icon: AlertTriangle,
      tone: 'rose' as const,
      delta: null,
    },
    {
      label: 'Ø Durchlaufzeit',
      value: turnaroundValue > 0 ? `${turnaroundValue.toFixed(1)} h` : '—',
      sub: turnaroundValue > 0 ? 'letzte 7 Tage' : 'Noch keine abgeschlossene Prüfung',
      icon: Clock,
      tone: 'violet' as const,
      delta: null,
    },
  ]

  // Defensiv: session.user.name kann theoretisch leer sein (siehe auch
  // Root-Cause-Fix im session-Callback in lib/auth.ts). Nie ungeschuetzt
  // .split() aufrufen.
  const safeName = session.user.name ?? ''
  const firstName = safeName.split(' ')[0] || 'Team'

  return (
    <>
      <WelcomeBar
        firstName={firstName}
        fullName={safeName}
        company={session.user.company}
        planName={planMeta.name}
        stats={{
          totalCandidates,
          pendingConsent: candidateStatusGroups.find((g) => g.status === 'PENDING')?._count ?? 0,
          inReview: activeCandidates,
          completed: candidateStatusGroups.find((g) => g.status === 'COMPLETED')?._count ?? 0,
        }}
      />

      <div className="space-y-6">
        {/* Onboarding checklist (auto-hides when complete) */}
        <OnboardingChecklist
          candidateCount={totalCandidates}
          checkCount={totalChecks}
          hasGdprConsent={consentedCandidates > 0}
          hasAddon={addonOrders > 0}
        />

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Plan usage banner */}
        {checkLimit > 0 && (
          <div className="card-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-violet flex items-center justify-center text-white shadow-card">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-text-primary">{planMeta.name}-Paket</span>
                  <span className="badge-brand text-[10px]">{ACCOUNT_TYPES[session.user.accountType as keyof typeof ACCOUNT_TYPES]?.short ?? 'HR'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  <span>{usedThisMonth} / {checkLimit} Prüfungen</span>
                  <div className="flex-1 max-w-xs h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-500 to-violet rounded-full transition-all" style={{ width: `${usagePct}%` }} />
                  </div>
                  <span className="font-mono font-semibold text-text-primary">{usagePct}%</span>
                </div>
              </div>
            </div>
            <Link href="/preise" className="btn-secondary text-xs">
              Paket erweitern <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Charts grid */}
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 card-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title">Aktivität</h2>
                <p className="text-xs text-text-secondary mt-0.5">Letzte 14 Tage</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-500" /> Geprüft</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Verifiziert</div>
              </div>
            </div>
            <ActivityAreaChart data={trend} />
          </div>
          <div className="card-md">
            <h2 className="section-title mb-1">Kandidaten-Status</h2>
            <p className="text-xs text-text-secondary mb-4">Verteilung aktuell</p>
            <StatusPieChart data={statusDist} />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <div className="card-md">
            <h2 className="section-title mb-1">Ø Durchlaufzeit</h2>
            <p className="text-xs text-text-secondary mb-4">letzte 7 Tage in Stunden</p>
            <TurnaroundBarChart data={turnaround} />
          </div>

          {/* Recent candidates */}
          <div className="card-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Neueste Kandidaten</h2>
              <Link href="/candidates" className="text-xs text-brand-700 hover:text-brand-800 font-semibold">Alle →</Link>
            </div>
            {recentCandidates.length === 0 ? (
              <EmptyState message="Noch keine Kandidaten" cta="Anlegen" href="/candidates/new" />
            ) : (
              <div className="space-y-1.5">
                {recentCandidates.slice(0, 5).map((c) => {
                  const st = CANDIDATE_STATUS[c.status as keyof typeof CANDIDATE_STATUS] ?? CANDIDATE_STATUS.PENDING
                  return (
                    <Link key={c.id} href={`/candidates/${c.id}`}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-bg-secondary transition-colors group">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-100 to-violet/20 border border-brand-200 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-brand-700">
                          {(c.firstName?.[0] ?? '').toUpperCase()}{(c.lastName?.[0] ?? '').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-text-primary truncate group-hover:text-brand-700 transition-colors">
                            {c.firstName} {c.lastName}
                          </div>
                          <div className="text-[10px] text-text-muted truncate">{c.position}</div>
                        </div>
                      </div>
                      <span className={`badge ${st.color} text-[10px]`}>{st.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent checks */}
          <div className="card-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Aktuelle Prüfungen</h2>
              <Link href="/checks" className="text-xs text-brand-700 hover:text-brand-800 font-semibold">Alle →</Link>
            </div>
            {recentChecks.length === 0 ? (
              <EmptyState message="Noch keine Prüfungen" cta="Erste Prüfung starten" href="/checks/new" />
            ) : (
              <div className="space-y-1.5">
                {recentChecks.slice(0, 5).map((chk) => {
                  const st = CHECK_STATUS[chk.status as keyof typeof CHECK_STATUS] ?? CHECK_STATUS.OPEN
                  const resIcon = chk.result === 'VERIFIED' ? CheckCircle2 : chk.result === 'DISCREPANCY_FOUND' ? AlertCircle : Clock
                  const resColor = chk.result === 'VERIFIED' ? 'text-emerald-600' : chk.result === 'DISCREPANCY_FOUND' ? 'text-rose-600' : 'text-amber-600'
                  return (
                    <Link key={chk.id} href={`/checks/${chk.id}`}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-bg-secondary transition-colors group">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg bg-bg-secondary flex items-center justify-center flex-shrink-0 ${resColor}`}>
                          {(() => { const I = resIcon; return <I className="w-4 h-4" /> })()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-text-primary truncate">
                            {chk.employerName ?? '—'}
                          </div>
                          <div className="text-[10px] text-text-muted truncate">
                            {chk.candidate?.firstName ?? ''} {chk.candidate?.lastName ?? ''}
                          </div>
                        </div>
                      </div>
                      <span className={`badge ${st.color} text-[10px]`}>{st.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Activity feed (audit trail summary) */}
        <ActivityFeed events={recentEvents} />
      </div>
    </>
  )
}

function StatCard({ label, value, sub, icon: Icon, tone, delta }: {
  label: string; value: string | number; sub: string;
  icon: any; tone: 'brand' | 'emerald' | 'rose' | 'violet'; delta: string | null;
}) {
  const toneCls = {
    brand: 'text-brand-600 bg-brand-50 border-brand-200',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    rose: 'text-rose-600 bg-rose-50 border-rose-200',
    violet: 'text-violet bg-violet/10 border-violet/20',
  }[tone]
  const deltaTone = delta?.startsWith('+') ? 'text-emerald-700' : delta?.startsWith('−') ? 'text-emerald-700' : 'text-text-muted'
  return (
    <div className="card-md group hover:shadow-card-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${toneCls}`}>
          <Icon className="w-5 h-5" />
        </div>
        {delta && <span className={`text-xs font-bold ${deltaTone}`}>
          <TrendingUp className="w-3 h-3 inline mr-0.5" />
          {delta}
        </span>}
      </div>
      <div className="text-3xl font-bold text-text-primary tracking-tighter mb-1" style={{ fontFeatureSettings: '"tnum"' }}>
        {value}
      </div>
      <div className="text-xs text-text-secondary">{label}</div>
      <div className="text-[10px] text-text-muted mt-1">{sub}</div>
    </div>
  )
}

function EmptyState({ message, cta, href }: { message: string; cta: string; href: string }) {
  return (
    <div className="text-center py-8">
      <div className="text-text-muted text-xs mb-3">{message}</div>
      <Link href={href} className="btn-primary text-xs py-2 px-4">{cta}</Link>
    </div>
  )
}

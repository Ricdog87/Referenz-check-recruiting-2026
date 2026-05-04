import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { WelcomeBar } from '@/components/dashboard/WelcomeBar'
import Link from 'next/link'
import { CANDIDATE_STATUS, CHECK_STATUS, getPlanById, ACCOUNT_TYPES, trialDaysLeft } from '@/lib/utils'
import { CheckCircle2, AlertCircle, Clock, ArrowRight } from 'lucide-react'
import { ActivityAreaChart, StatusPieChart, TurnaroundBarChart } from '@/components/dashboard/DashboardCharts'
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist'
import { KPIStrip } from '@/components/dashboard/KPIStrip'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { PlanUsageCard } from '@/components/dashboard/PlanUsageCard'
import { RecentActivity } from '@/components/dashboard/RecentActivity'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const userId = session.user.id

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
    prisma.candidate.count({ where: { userId } }),
    prisma.candidate.count({ where: { userId, status: 'IN_REVIEW' } }),
    prisma.referenceCheck.count({ where: { candidate: { userId }, status: 'COMPLETED' } }),
    prisma.referenceCheck.count({ where: { candidate: { userId }, status: 'OPEN' } }),
    prisma.referenceCheck.count({ where: { candidate: { userId }, status: 'IN_PROGRESS' } }),
    prisma.referenceCheck.count({ where: { candidate: { userId }, result: 'DISCREPANCY_FOUND' } }),
    prisma.referenceCheck.count({ where: { candidate: { userId }, result: 'VERIFIED' } }),
    prisma.candidate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: { _count: { select: { checks: true } } },
    }),
    prisma.referenceCheck.findMany({
      where: { candidate: { userId } },
      orderBy: { updatedAt: 'desc' },
      take: 6,
      include: { candidate: { select: { firstName: true, lastName: true, position: true } } },
    }),
    prisma.candidate.groupBy({ by: ['status'], where: { userId }, _count: true }),
    prisma.referenceCheck.findMany({
      where: { candidate: { userId } },
      select: { createdAt: true, calledAt: true, result: true, status: true, updatedAt: true },
    }),
    prisma.candidate.count({ where: { userId, gdprConsent: true } }),
    prisma.addonOrder.count({ where: { userId } }),
    prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, action: true, entity: true, details: true, createdAt: true },
    }),
  ])

  const totalChecks = openChecks + inProgressChecks + completedChecks
  const verificationRate = totalChecks > 0 ? Math.round((verifiedChecks / totalChecks) * 100) : 0
  const planMeta = getPlanById(session.user.plan ?? 'STARTER')

  // 14-day trend
  const days = 14
  const trend: { date: string; total: number; verified: number; discrepancy: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0)
    const next = new Date(d); next.setDate(d.getDate() + 1)
    const dc = allChecks.filter((c: any) => { const t = c.updatedAt.getTime(); return t >= d.getTime() && t < next.getTime() })
    trend.push({
      date: d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
      total: dc.length,
      verified: dc.filter((c: any) => c.result === 'VERIFIED').length,
      discrepancy: dc.filter((c: any) => c.result === 'DISCREPANCY_FOUND').length,
    })
  }

  // Avg turnaround
  const turnaroundChecks = allChecks.filter((c: any) => c.calledAt && c.createdAt)
  const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  const turnaround: { day: string; hours: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0)
    const next = new Date(d); next.setDate(d.getDate() + 1)
    const dc = turnaroundChecks.filter((c: any) => c.calledAt!.getTime() >= d.getTime() && c.calledAt!.getTime() < next.getTime())
    const avgH = dc.length === 0 ? 0 : Math.round(dc.reduce((acc: number, c: any) => acc + (c.calledAt!.getTime() - c.createdAt.getTime()) / 36e5, 0) / dc.length)
    turnaround.push({ day: dayLabels[d.getDay() === 0 ? 6 : d.getDay() - 1], hours: avgH })
  }

  const avgTurnaround = turnaround.filter(t => t.hours > 0).length > 0
    ? turnaround.reduce((a, b) => a + b.hours, 0) / Math.max(1, turnaround.filter(t => t.hours > 0).length)
    : 0

  // Status distribution
  const statusDist = [
    { name: 'Ausstehend',     value: candidateStatusGroups.find((g: any) => g.status === 'PENDING')?._count ?? 0,   color: '#94a3b8' },
    { name: 'In Prüfung',     value: candidateStatusGroups.find((g: any) => g.status === 'IN_REVIEW')?._count ?? 0, color: '#6366f1' },
    { name: 'Abgeschlossen',  value: candidateStatusGroups.find((g: any) => g.status === 'COMPLETED')?._count ?? 0, color: '#10b981' },
    { name: 'Abgelehnt',      value: candidateStatusGroups.find((g: any) => g.status === 'REJECTED')?._count ?? 0,  color: '#f43f5e' },
  ]

  const usedThisMonth = totalChecks
  const checkLimit = planMeta.includedChecks
  const usagePct = checkLimit > 0 ? Math.min(100, Math.round((usedThisMonth / checkLimit) * 100)) : 0

  const firstName = session.user.name.split(' ')[0] ?? session.user.name
  const trialLeft = trialDaysLeft(session.user.trialEndsAt)
  const isTrialing = trialLeft !== null && trialLeft > 0

  return (
    <>
      <WelcomeBar
        firstName={firstName}
        fullName={session.user.name}
        company={session.user.company}
        planName={planMeta.name}
        trialDaysLeft={trialLeft}
        isTrialing={isTrialing}
      />

      <div className="space-y-5">
        {/* Onboarding checklist */}
        <OnboardingChecklist
          candidateCount={totalCandidates}
          checkCount={totalChecks}
          hasGdprConsent={consentedCandidates > 0}
          hasAddon={addonOrders > 0}
        />

        {/* KPI strip with animated counters */}
        <KPIStrip
          totalCandidates={totalCandidates}
          activeCandidates={activeCandidates}
          verificationRate={verificationRate}
          verifiedChecks={verifiedChecks}
          discrepancies={discrepancies}
          avgTurnaround={avgTurnaround}
        />

        {/* Plan usage */}
        {checkLimit > 0 && (
          <PlanUsageCard
            planName={planMeta.name}
            accountTypeShort={ACCOUNT_TYPES[session.user.accountType as keyof typeof ACCOUNT_TYPES]?.short ?? 'HR'}
            usedChecks={usedThisMonth}
            checkLimit={checkLimit}
            usagePct={usagePct}
          />
        )}

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Activity chart */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-5" style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Aktivitäts-Trend</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Letzte 14 Tage · Prüfungen &amp; Verifizierungen</p>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  Geprüft
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Verifiziert
                </div>
              </div>
            </div>
            <ActivityAreaChart data={trend} />
          </div>

          {/* Status pie */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5" style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
            <h2 className="text-sm font-bold text-slate-800 mb-0.5">Kandidaten-Status</h2>
            <p className="text-[11px] text-slate-400 mb-4">Verteilung aktuell</p>
            <StatusPieChart data={statusDist} />
          </div>
        </div>

        {/* Bottom row: turnaround + recent candidates + quick actions */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Turnaround */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5" style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
            <h2 className="text-sm font-bold text-slate-800 mb-0.5">Ø Durchlaufzeit</h2>
            <p className="text-[11px] text-slate-400 mb-4">Letzte 7 Tage in Stunden</p>
            <TurnaroundBarChart data={turnaround} />
          </div>

          {/* Recent candidates */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5" style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-800">Neueste Kandidaten</h2>
              <Link href="/candidates" className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                Alle <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentCandidates.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-[11px] text-slate-400 mb-3">Noch keine Kandidaten</div>
                <Link href="/candidates/new" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">
                  Ersten anlegen
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {recentCandidates.slice(0, 5).map((c: any) => {
                  const st = CANDIDATE_STATUS[c.status as keyof typeof CANDIDATE_STATUS] ?? CANDIDATE_STATUS.PENDING
                  return (
                    <Link key={c.id} href={`/candidates/${c.id}`}
                      className="flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-indigo-700">
                          {c.firstName[0]}{c.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-700 truncate group-hover:text-indigo-700 transition-colors">
                            {c.firstName} {c.lastName}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">{c.position}</div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent checks */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5" style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-800">Aktuelle Prüfungen</h2>
              <Link href="/checks" className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                Alle <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentChecks.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-[11px] text-slate-400 mb-3">Noch keine Prüfungen</div>
                <Link href="/checks/new" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors">
                  Erste Prüfung starten
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {recentChecks.slice(0, 5).map((chk: any) => {
                  const st = CHECK_STATUS[chk.status as keyof typeof CHECK_STATUS] ?? CHECK_STATUS.OPEN
                  const resIcon = chk.result === 'VERIFIED' ? CheckCircle2 : chk.result === 'DISCREPANCY_FOUND' ? AlertCircle : Clock
                  const resColor = chk.result === 'VERIFIED' ? 'text-emerald-500' : chk.result === 'DISCREPANCY_FOUND' ? 'text-rose-500' : 'text-amber-500'
                  const ResIcon = resIcon
                  return (
                    <Link key={chk.id} href={`/checks/${chk.id}`}
                      className="flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 ${resColor}`}>
                          <ResIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-700 truncate group-hover:text-violet-700 transition-colors">
                            {chk.employerName}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {chk.candidate.firstName} {chk.candidate.lastName}
                          </div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions + Activity feed */}
        <div className="grid lg:grid-cols-2 gap-5">
          <QuickActions />
          <RecentActivity events={recentEvents} />
        </div>
      </div>
    </>
  )
}

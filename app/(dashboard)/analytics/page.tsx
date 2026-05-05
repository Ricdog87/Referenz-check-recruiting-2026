import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/layout/Header'
import { ActivityAreaChart, StatusPieChart, TurnaroundBarChart } from '@/components/dashboard/DashboardChartsLazy'
import { TrendingUp, Target, Activity, Award } from 'lucide-react'

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const userId = session.user.id

  const [
    totalCandidates,
    completedChecks,
    verifiedChecks,
    discrepancies,
    allChecks,
  ] = await Promise.all([
    prisma.candidate.count({ where: { userId } }),
    prisma.referenceCheck.count({ where: { candidate: { userId }, status: 'COMPLETED' } }),
    prisma.referenceCheck.count({ where: { candidate: { userId }, result: 'VERIFIED' } }),
    prisma.referenceCheck.count({ where: { candidate: { userId }, result: 'DISCREPANCY_FOUND' } }),
    prisma.referenceCheck.findMany({
      where: { candidate: { userId } },
      select: { createdAt: true, calledAt: true, result: true, status: true, updatedAt: true, employerName: true },
    }),
  ])

  const totalChecks = allChecks.length
  const verificationRate = totalChecks > 0 ? Math.round((verifiedChecks / totalChecks) * 100) : 0
  const discrepancyRate = totalChecks > 0 ? Math.round((discrepancies / totalChecks) * 100) : 0

  // 30-day trend
  const trend: { date: string; total: number; verified: number; discrepancy: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0)
    const next = new Date(d); next.setDate(d.getDate() + 1)
    const dc = allChecks.filter((c) => c.updatedAt.getTime() >= d.getTime() && c.updatedAt.getTime() < next.getTime())
    trend.push({
      date: d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
      total: dc.length,
      verified: dc.filter((c) => c.result === 'VERIFIED').length,
      discrepancy: dc.filter((c) => c.result === 'DISCREPANCY_FOUND').length,
    })
  }

  // Result distribution
  const resultDist = [
    { name: 'Verifiziert', value: verifiedChecks, color: '#10b981' },
    { name: 'Diskrepanz', value: discrepancies, color: '#f43f5e' },
    { name: 'Nicht erreicht', value: allChecks.filter(c => c.result === 'UNREACHABLE').length, color: '#f59e0b' },
    { name: 'Verweigert', value: allChecks.filter(c => c.result === 'DECLINED').length, color: '#94a3b8' },
  ]

  // Turnaround per weekday
  const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  const turnaround = dayLabels.map((day, idx) => {
    const dc = allChecks.filter((c) => {
      if (!c.calledAt) return false
      const wd = c.calledAt.getDay()
      return (wd === 0 ? 6 : wd - 1) === idx
    })
    const avgH = dc.length === 0
      ? 0
      : Math.round(dc.reduce((acc, c) => acc + (c.calledAt!.getTime() - c.createdAt.getTime()) / 36e5, 0) / dc.length)
    return { day, hours: avgH }
  })

  const stats = [
    { label: 'Verifizierungsrate', v: `${verificationRate}%`, sub: `${verifiedChecks} verifiziert von ${totalChecks}`, icon: Target, tone: 'emerald' },
    { label: 'Diskrepanz-Quote', v: `${discrepancyRate}%`, sub: `${discrepancies} Auffälligkeiten`, icon: TrendingUp, tone: 'rose' },
    { label: 'Geprüfte Kandidaten', v: totalCandidates, sub: 'gesamt', icon: Activity, tone: 'brand' },
    { label: 'Abschlussquote', v: `${totalChecks ? Math.round((completedChecks / totalChecks) * 100) : 0}%`, sub: 'erfolgreich beendet', icon: Award, tone: 'violet' },
  ]

  return (
    <>
      <Header
        title="Analytics"
        subtitle="Tiefe Einblicke in Ihre Recruiting-Performance"
      />
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => {
            const tone = {
              emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200',
              rose: 'text-rose-600 bg-rose-50 border-rose-200',
              brand: 'text-brand-600 bg-brand-50 border-brand-200',
              violet: 'text-violet bg-violet/10 border-violet/20',
            }[s.tone as 'emerald' | 'rose' | 'brand' | 'violet']
            const Icon = s.icon
            return (
              <div key={s.label} className="card-md">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${tone}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-3xl font-bold text-text-primary tracking-tighter">{s.v}</div>
                <div className="text-xs text-text-secondary mt-1">{s.label}</div>
                <div className="text-[10px] text-text-muted mt-0.5">{s.sub}</div>
              </div>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <div className="card-md lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title">Prüfungs-Aktivität</h2>
                <p className="text-xs text-text-secondary mt-0.5">letzte 30 Tage</p>
              </div>
            </div>
            <ActivityAreaChart data={trend} />
          </div>
          <div className="card-md">
            <h2 className="section-title mb-1">Ergebnisverteilung</h2>
            <p className="text-xs text-text-secondary mb-4">aller Prüfungen</p>
            <StatusPieChart data={resultDist} />
          </div>
        </div>

        <div className="card-md">
          <h2 className="section-title mb-1">Ø Durchlaufzeit nach Wochentag</h2>
          <p className="text-xs text-text-secondary mb-4">in Stunden</p>
          <TurnaroundBarChart data={turnaround} />
        </div>
      </div>
    </>
  )
}

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { formatDateTime, CANDIDATE_STATUS, CHECK_STATUS } from '@/lib/utils'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const [totalCandidates, activeCandidates, completedChecks, openChecks, recentCandidates, recentChecks] =
    await Promise.all([
      prisma.candidate.count({ where: { userId: session.user.id } }),
      prisma.candidate.count({ where: { userId: session.user.id, status: 'IN_REVIEW' } }),
      prisma.referenceCheck.count({
        where: { candidate: { userId: session.user.id }, status: 'COMPLETED' },
      }),
      prisma.referenceCheck.count({
        where: { candidate: { userId: session.user.id }, status: 'OPEN' },
      }),
      prisma.candidate.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { _count: { select: { checks: true } } },
      }),
      prisma.referenceCheck.findMany({
        where: { candidate: { userId: session.user.id } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: { candidate: { select: { firstName: true, lastName: true } } },
      }),
    ])

  const discrepancies = await prisma.referenceCheck.count({
    where: { candidate: { userId: session.user.id }, result: 'DISCREPANCY_FOUND' },
  })

  const stats = [
    { label: 'Kandidaten gesamt', value: totalCandidates, sub: 'erfasst', color: 'text-text-primary' },
    { label: 'In Prüfung', value: activeCandidates, sub: 'aktiv', color: 'text-status-info' },
    { label: 'Abgeschlossen', value: completedChecks, sub: 'Prüfungen', color: 'text-status-success' },
    { label: 'Unstimmigkeiten', value: discrepancies, sub: 'gefunden', color: 'text-status-error' },
  ]

  return (
    <div className="animate-fade-in">
      <Header
        title={`Guten Tag, ${session.user.name?.split(' ')[0] ?? 'Recruiter'}`}
        subtitle={`${session.user.company} · Übersicht`}
        action={
          <Link href="/candidates/new" className="btn-primary">
            + Kandidat hinzufügen
          </Link>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="card">
              <div className="text-xs text-text-secondary mb-2">{s.label}</div>
              <div className={`stat-value ${s.color}`}>{s.value}</div>
              <div className="text-xs text-text-muted mt-1">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent candidates */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Neueste Kandidaten</h2>
              <Link href="/candidates" className="text-xs text-accent hover:text-accent-hover transition-colors">
                Alle anzeigen →
              </Link>
            </div>
            {recentCandidates.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-text-muted text-sm mb-3">Noch keine Kandidaten</div>
                <Link href="/candidates/new" className="btn-primary text-xs py-2">
                  Ersten Kandidaten anlegen
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentCandidates.map((c) => {
                  const st = CANDIDATE_STATUS[c.status as keyof typeof CANDIDATE_STATUS] ?? CANDIDATE_STATUS.PENDING
                  return (
                    <Link
                      key={c.id}
                      href={`/candidates/${c.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-hover transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-accent-muted border border-accent/20 flex items-center justify-center flex-shrink-0 text-xs font-medium text-accent">
                          {c.firstName[0]}{c.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-text-primary truncate">
                            {c.firstName} {c.lastName}
                          </div>
                          <div className="text-xs text-text-secondary truncate">{c.position}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`badge ${st.color}`}>{st.label}</span>
                        <span className="text-xs text-text-muted">{c._count.checks} Prüfungen</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent checks */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Aktuelle Prüfungen</h2>
              <Link href="/checks" className="text-xs text-accent hover:text-accent-hover transition-colors">
                Alle anzeigen →
              </Link>
            </div>
            {recentChecks.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-text-muted text-sm">Noch keine Referenzprüfungen</div>
              </div>
            ) : (
              <div className="space-y-2">
                {recentChecks.map((chk) => {
                  const st = CHECK_STATUS[chk.status as keyof typeof CHECK_STATUS] ?? CHECK_STATUS.OPEN
                  return (
                    <Link
                      key={chk.id}
                      href={`/checks/${chk.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-hover transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-text-primary truncate">
                          {chk.candidate.firstName} {chk.candidate.lastName}
                        </div>
                        <div className="text-xs text-text-secondary truncate">{chk.employerName}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`badge ${st.color}`}>{st.label}</span>
                        <span className="text-xs text-text-muted">{formatDateTime(chk.updatedAt).split(',')[0]}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        {totalCandidates === 0 && (
          <div className="card border-accent/20 bg-accent-glow">
            <div className="flex items-start gap-4">
              <div className="text-2xl">🚀</div>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary mb-1">Willkommen bei RefCheck</h3>
                <p className="text-sm text-text-secondary mb-4">
                  Beginnen Sie, indem Sie Ihren ersten Kandidaten anlegen und Referenzprüfungen starten.
                </p>
                <div className="flex gap-3">
                  <Link href="/candidates/new" className="btn-primary text-sm py-2">
                    Ersten Kandidaten anlegen
                  </Link>
                  <Link href="/settings" className="btn-secondary text-sm py-2">
                    Konto einrichten
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

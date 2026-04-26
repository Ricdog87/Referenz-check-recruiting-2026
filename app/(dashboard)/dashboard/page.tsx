import { prisma } from '@/lib/db'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { formatDateTime, CANDIDATE_STATUS, CHECK_STATUS } from '@/lib/utils'
import { getAppSession } from '@/lib/app-session'

export default async function DashboardPage() {
  const session = await getAppSession()

  let totalCandidates = 0
  let activeCandidates = 0
  let completedChecks = 0
  let openChecks = 0
  let discrepancies = 0
  let recentCandidates: any[] = []
  let recentChecks: any[] = []

  try {
    ;[totalCandidates, activeCandidates, completedChecks, openChecks, recentCandidates, recentChecks] =
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

    discrepancies = await prisma.referenceCheck.count({
      where: { candidate: { userId: session.user.id }, result: 'DISCREPANCY_FOUND' },
    })
  } catch (error) {
    console.error('Dashboard loaded in fallback mode (database unavailable):', error)
  }

  const stats = [
    { label: 'Kandidaten gesamt', value: totalCandidates, sub: 'im Workspace', color: 'text-text-primary' },
    { label: 'Aktiv in Prüfung', value: activeCandidates, sub: 'laufend', color: 'text-status-info' },
    { label: 'Abgeschlossen', value: completedChecks, sub: 'Checks', color: 'text-status-success' },
    { label: 'Unstimmigkeiten', value: discrepancies, sub: 'gefunden', color: 'text-status-error' },
  ]

  return (
    <div className="animate-fade-in">
      <Header
        title={`Willkommen, ${session.user.name.split(' ')[0]}`}
        subtitle={`${session.user.company} · Recruiting Control Center`}
        action={
          <Link href="/candidates/new" className="btn-primary">
            + Neuer Kandidat (inkl. CV)
          </Link>
        }
      />

      <div className="p-6 space-y-6">
        <div className="card bg-status-infoBg border-status-info/20 text-status-info text-sm">
          Demo-Modus aktiv: Falls Ihre Datenbank kurzzeitig nicht erreichbar ist, bleibt das Dashboard stabil und zeigt sichere Fallback-Werte.
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s: any) => (
            <div key={s.label} className="card">
              <div className="text-xs text-text-secondary mb-2 uppercase tracking-wider">{s.label}</div>
              <div className={`stat-value ${s.color}`}>{s.value}</div>
              <div className="text-xs text-text-muted mt-1">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">Neueste Kandidaten</h2>
                <Link href="/candidates" className="text-xs text-accent hover:text-accent-hover transition-colors">
                  Alle anzeigen →
                </Link>
              </div>
              {recentCandidates.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-text-muted text-sm mb-3">Noch keine Kandidaten angelegt</div>
                  <Link href="/candidates/new" className="btn-primary text-sm py-2">
                    Ersten Kandidaten + CV anlegen
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentCandidates.map((c: any) => {
                    const st = CANDIDATE_STATUS[c.status as keyof typeof CANDIDATE_STATUS] ?? CANDIDATE_STATUS.PENDING
                    return (
                      <Link key={c.id} href={`/candidates/${c.id}`} className="block p-3 rounded-lg bg-bg-secondary hover:bg-bg-hover transition-colors">
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-text-primary truncate">{c.firstName} {c.lastName}</div>
                            <div className="text-xs text-text-secondary truncate">{c.position}</div>
                          </div>
                          <span className={`badge ${st.color}`}>{st.label}</span>
                        </div>
                        <div className="mt-2 text-xs text-text-muted flex justify-between">
                          <span>{c._count.checks} Checks</span>
                          <span>{formatDateTime(c.createdAt)}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">Aktuelle Referenzprüfungen</h2>
                <Link href="/checks" className="text-xs text-accent hover:text-accent-hover transition-colors">
                  Alle anzeigen →
                </Link>
              </div>
              {recentChecks.length === 0 ? (
                <div className="text-center py-8 text-text-muted text-sm">Noch keine Prüfungen gestartet</div>
              ) : (
                <div className="space-y-3">
                  {recentChecks.map((chk: any) => {
                    const st = CHECK_STATUS[chk.status as keyof typeof CHECK_STATUS] ?? CHECK_STATUS.OPEN
                    return (
                      <Link key={chk.id} href={`/checks/${chk.id}`} className="block p-3 rounded-lg bg-bg-secondary hover:bg-bg-hover transition-colors">
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-text-primary truncate">{chk.employerName}</div>
                            <div className="text-xs text-text-secondary truncate">{chk.candidate.firstName} {chk.candidate.lastName}</div>
                          </div>
                          <span className={`badge ${st.color}`}>{st.label}</span>
                        </div>
                        <div className="mt-2 text-xs text-text-muted">{formatDateTime(chk.updatedAt)}</div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card border-accent/20 bg-accent-glow">
              <h3 className="section-title mb-3">Schnellstart für Ihr Team</h3>
              <ol className="space-y-3 text-sm text-text-secondary">
                <li className="flex gap-2"><span className="text-accent font-semibold">1.</span> Kandidat anlegen und CV direkt hochladen.</li>
                <li className="flex gap-2"><span className="text-accent font-semibold">2.</span> Referenz-Check öffnen und Arbeitgeber-Daten eintragen.</li>
                <li className="flex gap-2"><span className="text-accent font-semibold">3.</span> Ergebnisse live verfolgen und Entscheidung treffen.</li>
              </ol>
              <Link href="/candidates/new" className="btn-primary mt-4 w-full text-center py-2.5 block">
                Prozess starten
              </Link>
            </div>

            <div className="card">
              <h3 className="section-title mb-3">Was Ihr Kunde hier sieht</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Dieses Dashboard zeigt den kompletten Referenzprüfungs-Workflow: vom CV-Upload bis zum finalen Check-Ergebnis.
                So versteht Ihr Kunde den Mehrwert in unter 2 Minuten.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { prisma } from '@/lib/db'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { formatDate, CANDIDATE_STATUS } from '@/lib/utils'
import { getAppSession } from '@/lib/app-session'

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string }
}) {
  const session = await getAppSession()
  
  const where = {
    userId: session.user.id,
    ...(searchParams.status ? { status: searchParams.status } : {}),
    ...(searchParams.q
      ? {
          OR: [
            { firstName: { contains: searchParams.q } },
            { lastName: { contains: searchParams.q } },
            { email: { contains: searchParams.q } },
            { position: { contains: searchParams.q } },
          ],
        }
      : {}),
  }

  let candidates: any[] = []
  let statusCounts: any[] = []
  let total = 0

  try {
    candidates = await prisma.candidate.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { checks: true, documents: true } },
    },
  })


    total = await prisma.candidate.count({ where: { userId: session.user.id } })
  } catch (error) {
    console.error('Candidates loaded in fallback mode:', error)
  }

  return (
    <div className="animate-fade-in">
      <Header
        title="Kandidaten"
        subtitle={`${total} insgesamt`}
        action={
          <Link href="/candidates/new" className="btn-primary">
            + Kandidat hinzufügen
          </Link>
        }
      />

      <div className="p-6 space-y-4">
        <div className="card bg-status-infoBg border-status-info/20 text-status-info text-sm">Fallback-Modus aktiv: Kandidaten-Daten aktuell nicht aus Datenbank geladen.</div>
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form className="flex-1">
            <input
              type="search"
              name="q"
              defaultValue={searchParams.q}
              placeholder="Suchen nach Name, Stelle…"
              className="input-field max-w-sm"
            />
          </form>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: 'Alle', value: '' },
              ...Object.entries(CANDIDATE_STATUS).map(([k, v]) => ({ label: v.label, value: k })),
            ].map((f) => (
              <Link
                key={f.value}
                href={f.value ? `/candidates?status=${f.value}` : '/candidates'}
                className={`badge py-1.5 px-3 text-xs border transition-colors ${
                  (searchParams.status ?? '') === f.value
                    ? 'bg-accent text-white border-accent'
                    : 'border-border text-text-secondary hover:border-border-strong hover:text-text-primary'
                }`}
              >
                {f.label}
                {f.value && (
                  <span className="ml-1 opacity-60">
                    {statusCounts.find((s) => s.status === f.value)?._count ?? 0}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Table */}
        {candidates.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-4xl mb-4">👤</div>
            <div className="text-text-secondary mb-2">Keine Kandidaten gefunden</div>
            <div className="text-text-muted text-sm mb-6">
              {searchParams.q || searchParams.status
                ? 'Probieren Sie andere Filter.'
                : 'Legen Sie Ihren ersten Kandidaten an, um Referenzprüfungen zu starten.'}
            </div>
            {!searchParams.q && !searchParams.status && (
              <Link href="/candidates/new" className="btn-primary">
                Ersten Kandidaten anlegen
              </Link>
            )}
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Kandidat
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider hidden md:table-cell">
                    Stelle
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider hidden sm:table-cell">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider hidden lg:table-cell">
                    Prüfungen
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider hidden lg:table-cell">
                    DSGVO
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Angelegt
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {candidates.map((c: any) => {
                  const st = CANDIDATE_STATUS[c.status as keyof typeof CANDIDATE_STATUS] ?? CANDIDATE_STATUS.PENDING
                  return (
                    <tr key={c.id} className="hover:bg-bg-hover transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/candidates/${c.id}`} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent-muted border border-accent/20 flex items-center justify-center flex-shrink-0 text-xs font-medium text-accent">
                            {c.firstName[0]}{c.lastName[0]}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-text-primary hover:text-accent transition-colors">
                              {c.firstName} {c.lastName}
                            </div>
                            {c.email && <div className="text-xs text-text-secondary">{c.email}</div>}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="text-sm text-text-secondary">{c.position}</div>
                        {c.department && <div className="text-xs text-text-muted">{c.department}</div>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`badge ${st.color}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm font-mono text-text-secondary">{c._count.checks}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {c.gdprConsent ? (
                          <span className="text-status-success text-xs">✓ Einwilligung</span>
                        ) : (
                          <span className="text-status-error text-xs">✗ Ausstehend</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">
                        {formatDate(c.createdAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

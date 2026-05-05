import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { formatDate, CANDIDATE_STATUS } from '@/lib/utils'
import { Search, Plus, Users, ShieldCheck, ShieldAlert, Upload } from 'lucide-react'

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const where = {
    userId: session.user.id,
    ...(searchParams.status ? { status: searchParams.status } : {}),
    ...(searchParams.q
      ? {
          OR: [
            { firstName: { contains: searchParams.q, mode: 'insensitive' as const } },
            { lastName: { contains: searchParams.q, mode: 'insensitive' as const } },
            { email: { contains: searchParams.q, mode: 'insensitive' as const } },
            { position: { contains: searchParams.q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [candidates, statusCounts, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { checks: true, documents: true } } },
    }),
    prisma.candidate.groupBy({ by: ['status'], where: { userId: session.user.id }, _count: true }),
    prisma.candidate.count({ where: { userId: session.user.id } }),
  ])

  return (
    <>
      <Header
        title="Kandidaten"
        subtitle={`${total} insgesamt · ${candidates.length} angezeigt`}
        action={
          <div className="flex gap-2">
            <Link href="/candidates/bulk" className="btn-secondary">
              <Upload className="w-4 h-4" /> Bulk-Import
            </Link>
            <Link href="/candidates/new" className="btn-primary">
              <Plus className="w-4 h-4" /> Kandidat hinzufügen
            </Link>
          </div>
        }
      />

      <div className="space-y-4">
        {/* Filter bar */}
        <div className="card-md p-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <form className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="search"
                name="q"
                defaultValue={searchParams.q}
                placeholder="Name, E-Mail oder Position…"
                className="w-full pl-9 pr-4 py-2 text-sm rounded-full bg-bg-secondary border border-border focus:bg-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/15 transition-all"
              />
            </div>
          </form>
          <div className="flex gap-1.5 flex-wrap">
            {[
              { label: 'Alle', value: '' },
              ...Object.entries(CANDIDATE_STATUS).map(([k, v]) => ({ label: v.label, value: k })),
            ].map((f) => {
              const active = (searchParams.status ?? '') === f.value
              const count = f.value ? (statusCounts.find((s) => s.status === f.value)?._count ?? 0) : total
              return (
                <Link
                  key={f.value}
                  href={f.value ? `/candidates?status=${f.value}` : '/candidates'}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    active
                      ? 'bg-gradient-to-br from-brand-500 to-violet text-white shadow-card'
                      : 'bg-bg-secondary border border-border text-text-secondary hover:border-border-strong hover:text-text-primary'
                  }`}
                >
                  {f.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-white/20' : 'bg-white text-text-secondary'}`}>{count}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Table */}
        {candidates.length === 0 ? (
          <div className="card-lg text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-bg-secondary mx-auto mb-4 flex items-center justify-center">
              <Users className="w-6 h-6 text-text-muted" />
            </div>
            <div className="text-text-primary font-semibold mb-1">Keine Kandidaten gefunden</div>
            <div className="text-text-muted text-sm mb-6">
              {searchParams.q || searchParams.status
                ? 'Probieren Sie andere Filter oder Suchbegriffe.'
                : 'Legen Sie Ihren ersten Kandidaten an, um Referenzprüfungen zu starten.'}
            </div>
            {!searchParams.q && !searchParams.status && (
              <Link href="/candidates/new" className="btn-primary">
                <Plus className="w-4 h-4" /> Ersten Kandidaten anlegen
              </Link>
            )}
          </div>
        ) : (
          <div className="card-md p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-secondary">
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-text-muted uppercase tracking-widest">Kandidat</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-text-muted uppercase tracking-widest hidden md:table-cell">Position</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-text-muted uppercase tracking-widest hidden sm:table-cell">Status</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-text-muted uppercase tracking-widest hidden lg:table-cell">Prüfungen</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-text-muted uppercase tracking-widest hidden lg:table-cell">DSGVO</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-text-muted uppercase tracking-widest">Angelegt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {candidates.map((c) => {
                    const st = CANDIDATE_STATUS[c.status as keyof typeof CANDIDATE_STATUS] ?? CANDIDATE_STATUS.PENDING
                    return (
                      <tr key={c.id} className="hover:bg-bg-secondary/60 transition-colors group">
                        <td className="px-5 py-3.5">
                          <Link href={`/candidates/${c.id}`} className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-100 to-violet/20 border border-brand-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-brand-700">
                              {c.firstName[0]}{c.lastName[0]}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-text-primary group-hover:text-brand-700 transition-colors">
                                {c.firstName} {c.lastName}
                              </div>
                              {c.email && <div className="text-xs text-text-muted">{c.email}</div>}
                            </div>
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <div className="text-sm text-text-primary">{c.position}</div>
                          {c.department && <div className="text-xs text-text-muted">{c.department}</div>}
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          <span className={`badge ${st.color}`}>{st.label}</span>
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <span className="text-sm font-mono font-semibold text-text-primary">{c._count.checks}</span>
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          {c.gdprConsent
                            ? <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><ShieldCheck className="w-3.5 h-3.5" /> Erteilt</span>
                            : <span className="inline-flex items-center gap-1 text-xs text-amber-700"><ShieldAlert className="w-3.5 h-3.5" /> Ausstehend</span>}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-text-secondary">
                          {formatDate(c.createdAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

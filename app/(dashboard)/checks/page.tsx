import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { safeQuery } from '@/lib/safe-query'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { formatDate, CHECK_STATUS, CHECK_RESULT } from '@/lib/utils'
import { Plus, Phone, ClipboardList } from 'lucide-react'

export default async function ChecksPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const where = {
    candidate: { userId: session.user.id },
    ...(searchParams.status ? { status: searchParams.status } : {}),
  }

  const [checks, total, statusCounts] = await Promise.all([
    safeQuery(
      prisma.referenceCheck.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: { candidate: { select: { id: true, firstName: true, lastName: true, position: true } } },
      }),
      [],
      'checks.list',
    ),
    safeQuery(prisma.referenceCheck.count({ where: { candidate: { userId: session.user.id } } }), 0, 'checks.total'),
    safeQuery(
      prisma.referenceCheck.groupBy({
        by: ['status'],
        where: { candidate: { userId: session.user.id } },
        _count: true,
      }),
      [] as { status: string; _count: number }[],
      'checks.statusCounts',
    ),
  ])

  return (
    <>
      <Header
        title="Referenzprüfungen"
        subtitle={`${total} insgesamt · ${checks.length} angezeigt`}
        action={
          <Link href="/checks/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Neue Prüfung
          </Link>
        }
      />

      <div className="space-y-4">
        {/* Filter bar */}
        <div className="card-md p-3 flex flex-wrap gap-1.5">
          {[
            { label: 'Alle', value: '' },
            ...Object.entries(CHECK_STATUS).map(([k, v]) => ({ label: v.label, value: k })),
          ].map((f) => {
            const active = (searchParams.status ?? '') === f.value
            const count = f.value ? (statusCounts.find((s) => s.status === f.value)?._count ?? 0) : total
            return (
              <Link
                key={f.value}
                href={f.value ? `/checks?status=${f.value}` : '/checks'}
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

        {checks.length === 0 ? (
          <div className="card-lg text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-bg-secondary mx-auto mb-4 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-text-muted" />
            </div>
            <div className="text-text-primary font-semibold mb-1">Keine Referenzprüfungen gefunden</div>
            <div className="text-text-muted text-sm mb-6">
              {searchParams.status
                ? 'Probieren Sie andere Filter.'
                : 'Legen Sie zuerst einen Kandidaten an, um Prüfungen zu starten.'}
            </div>
            {!searchParams.status && (
              <Link href="/candidates/new" className="btn-primary">
                <Plus className="w-4 h-4" /> Kandidat anlegen
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {checks.map((chk) => {
              const st = CHECK_STATUS[chk.status as keyof typeof CHECK_STATUS] ?? CHECK_STATUS.OPEN
              const res = chk.result ? (CHECK_RESULT[chk.result as keyof typeof CHECK_RESULT] ?? null) : null
              return (
                <Link
                  key={chk.id}
                  href={`/checks/${chk.id}`}
                  className="card-md hover:shadow-card-lg transition-all group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-violet/10 border border-brand-200 flex items-center justify-center text-brand-600 flex-shrink-0">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-text-primary group-hover:text-brand-700 transition-colors truncate">{chk.employerName ?? '—'}</div>
                        <div className="text-xs text-text-secondary mt-0.5 truncate">
                          {chk.candidate?.firstName ?? ''} {chk.candidate?.lastName ?? ''}
                          {chk.position && <span className="text-text-muted"> · {chk.position}</span>}
                        </div>
                      </div>
                    </div>
                    <span className={`badge ${st.color} flex-shrink-0`}>{st.label}</span>
                  </div>
                  {chk.employerContact && (
                    <div className="text-xs text-text-muted mb-3">Kontakt: {chk.employerContact}</div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    {res ? (
                      <span className={`badge ${res.color} text-[10px]`}>{res.label}</span>
                    ) : (
                      <span className="text-[10px] text-text-muted">Ergebnis ausstehend</span>
                    )}
                    <span className="text-[10px] text-text-muted">{formatDate(chk.updatedAt)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

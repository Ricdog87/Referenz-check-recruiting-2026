import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { formatDate, CHECK_STATUS, CHECK_RESULT } from '@/lib/utils'

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

  const checks = await prisma.referenceCheck.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      candidate: { select: { id: true, firstName: true, lastName: true, position: true } },
    },
  })

  const total = await prisma.referenceCheck.count({
    where: { candidate: { userId: session.user.id } },
  })

  const statusCounts = await prisma.referenceCheck.groupBy({
    by: ['status'],
    where: { candidate: { userId: session.user.id } },
    _count: true,
  })

  return (
    <div className="animate-fade-in">
      <Header
        title="Referenzprüfungen"
        subtitle={`${total} insgesamt`}
        action={
          <Link href="/checks/new" className="btn-primary">
            + Neue Prüfung
          </Link>
        }
      />

      <div className="p-6 space-y-4">
        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'Alle', value: '' },
            ...Object.entries(CHECK_STATUS).map(([k, v]) => ({ label: v.label, value: k })),
          ].map((f) => (
            <Link
              key={f.value}
              href={f.value ? `/checks?status=${f.value}` : '/checks'}
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

        {checks.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-4xl mb-4">📋</div>
            <div className="text-text-secondary mb-2">Keine Referenzprüfungen gefunden</div>
            <div className="text-text-muted text-sm mb-6">
              {searchParams.status
                ? 'Probieren Sie andere Filter.'
                : 'Legen Sie zuerst einen Kandidaten an, um Prüfungen zu starten.'}
            </div>
            {!searchParams.status && (
              <Link href="/candidates/new" className="btn-primary">
                Kandidaten anlegen
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {checks.map((chk) => {
              const st = CHECK_STATUS[chk.status as keyof typeof CHECK_STATUS] ?? CHECK_STATUS.OPEN
              const res = chk.result ? (CHECK_RESULT[chk.result as keyof typeof CHECK_RESULT] ?? null) : null
              return (
                <Link
                  key={chk.id}
                  href={`/checks/${chk.id}`}
                  className="card flex items-start justify-between gap-4 hover:border-border-strong transition-colors p-4"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-bg-secondary border border-border flex items-center justify-center flex-shrink-0 text-sm">
                      📞
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-text-primary">{chk.employerName}</div>
                      <div className="text-sm text-text-secondary mt-0.5">
                        {chk.candidate.firstName} {chk.candidate.lastName}
                        {chk.position && <span className="text-text-muted"> · {chk.position}</span>}
                      </div>
                      {chk.employerContact && (
                        <div className="text-xs text-text-muted mt-1">Kontakt: {chk.employerContact}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`badge ${st.color}`}>{st.label}</span>
                    {res && <span className={`badge ${res.color}`}>{res.label}</span>}
                    <span className="text-xs text-text-muted">{formatDate(chk.updatedAt)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

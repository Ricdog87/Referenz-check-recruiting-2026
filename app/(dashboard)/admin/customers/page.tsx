import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/reviewer'
import { Header } from '@/components/layout/Header'
import { formatDate } from '@/lib/utils'
import { Users, ArrowRight, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (!isAdmin(session)) redirect('/dashboard')

  const q = (searchParams.q ?? '').trim().toLowerCase()

  // Nur echte HR-Kunden — Reviewer/Admin-Accounts werden ausgeblendet.
  // Reviewer-Konten sind candiq-intern und gehören nicht in die Kundenliste.
  const baseWhere = { role: { notIn: ['REVIEWER', 'ADMIN'] } }
  const where = q
    ? {
        AND: [
          baseWhere,
          {
            OR: [
              { email: { contains: q, mode: 'insensitive' as const } },
              { name: { contains: q, mode: 'insensitive' as const } },
              { company: { contains: q, mode: 'insensitive' as const } },
            ],
          },
        ],
      }
    : baseWhere

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ planStatus: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      email: true,
      name: true,
      company: true,
      role: true,
      accountType: true,
      plan: true,
      planStatus: true,
      stripeCustomerId: true,
      createdAt: true,
      _count: { select: { candidates: true } },
    },
    take: 200,
  })

  // Aggregierte Check-Counts pro User (offen / in review / total).
  const userIds = users.map((u) => u.id)
  const checkAgg = userIds.length
    ? await prisma.referenceCheck.groupBy({
        by: ['status'],
        where: { candidate: { userId: { in: userIds } } },
        _count: { _all: true },
      })
    : []
  // Wir brauchen Counts PRO User PRO Status — groupBy auf user geht nicht
  // direkt (kein User-Feld im ReferenceCheck). Stattdessen raw counts:
  const perUserChecks = userIds.length
    ? await prisma.candidate.findMany({
        where: { userId: { in: userIds } },
        select: {
          userId: true,
          checks: { select: { status: true, isExpress: true } },
        },
      })
    : []
  const checksByUser = new Map<
    string,
    { total: number; open: number; inReview: number; express: number; completed: number }
  >()
  for (const c of perUserChecks) {
    const acc = checksByUser.get(c.userId) ?? {
      total: 0,
      open: 0,
      inReview: 0,
      express: 0,
      completed: 0,
    }
    for (const ch of c.checks) {
      acc.total++
      if (ch.status === 'OPEN' || ch.status === 'IN_PROGRESS') acc.open++
      if (ch.status === 'IN_REVIEW') acc.inReview++
      if (ch.status === 'COMPLETED') acc.completed++
      if (ch.isExpress) acc.express++
    }
    checksByUser.set(c.userId, acc)
  }
  // checkAgg currently unused, kept for future global-counters display
  void checkAgg

  // Aktivitäts-Telemetrie: zwei effiziente groupBy-Queries auf AuditLog
  //  - lastLoginByUser:    letzte LOGIN-Action pro User (= "zuletzt online")
  //  - lastActivityByUser: letzte BELIEBIGE Action pro User (= letzte Aktion im SaaS)
  //  - actionsCount30dByUser: Aktivitäts-Volumen pro User in 30 Tagen
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400e3)

  const [loginRows, anyActivityRows, actions30dRows] = userIds.length
    ? await Promise.all([
        prisma.auditLog.groupBy({
          by: ['userId'],
          where: { action: 'LOGIN', userId: { in: userIds } },
          _max: { createdAt: true },
        }),
        prisma.auditLog.groupBy({
          by: ['userId'],
          where: { userId: { in: userIds } },
          _max: { createdAt: true },
        }),
        prisma.auditLog.groupBy({
          by: ['userId'],
          where: { userId: { in: userIds }, createdAt: { gte: thirtyDaysAgo } },
          _count: { _all: true },
        }),
      ])
    : [[], [], []]

  const lastLoginByUser = new Map<string, Date>()
  for (const r of loginRows) {
    if (r.userId && r._max.createdAt) lastLoginByUser.set(r.userId, r._max.createdAt)
  }
  const lastActivityByUser = new Map<string, Date>()
  for (const r of anyActivityRows) {
    if (r.userId && r._max.createdAt) lastActivityByUser.set(r.userId, r._max.createdAt)
  }
  const actions30dByUser = new Map<string, number>()
  for (const r of actions30dRows) {
    if (r.userId) actions30dByUser.set(r.userId, r._count._all)
  }

  function timeAgo(d: Date | null | undefined): { label: string; tone: string } {
    if (!d) return { label: '—', tone: 'text-text-muted' }
    const diffMs = now.getTime() - d.getTime()
    const min = diffMs / 60_000
    const h = min / 60
    const days = h / 24
    if (min < 5) return { label: 'gerade eben', tone: 'text-emerald-700 font-semibold' }
    if (min < 60) return { label: `vor ${Math.round(min)} Min`, tone: 'text-emerald-700' }
    if (h < 24) return { label: `vor ${Math.round(h)} h`, tone: 'text-text-primary' }
    if (days < 7) return { label: `vor ${Math.round(days)} T`, tone: 'text-text-secondary' }
    if (days < 30) return { label: `vor ${Math.round(days / 7)} Wo`, tone: 'text-text-muted' }
    return { label: `vor ${Math.round(days / 30)} Mo`, tone: 'text-rose-600' }
  }

  return (
    <>
      <Header
        title="Kundenverwaltung"
        subtitle={`${users.length} Kunde(n)${q ? ` · Suche: "${q}"` : ''}`}
      />

      <form className="card-md p-3 mb-4 flex items-center gap-2">
        <Search className="w-4 h-4 text-text-muted ml-1" />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="E-Mail, Name, Firma…"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-text-muted"
        />
        {q && (
          <Link
            href="/admin/customers"
            className="text-xs font-semibold text-text-muted hover:text-text-primary"
          >
            zurücksetzen
          </Link>
        )}
      </form>

      {users.length === 0 ? (
        <div className="card-lg text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-bg-secondary mx-auto mb-4 flex items-center justify-center">
            <Users className="w-6 h-6 text-text-muted" />
          </div>
          <div className="text-text-primary font-semibold mb-1">Keine Kunden gefunden</div>
          <div className="text-text-muted text-sm">
            {q ? 'Suche anpassen oder zurücksetzen.' : 'Es sind aktuell keine HR-Kundenkonten angelegt.'}
          </div>
        </div>
      ) : (
        <div className="card-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary border-b border-border">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                <th className="px-4 py-3">Kunde</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Kandidaten</th>
                <th className="px-4 py-3">Checks</th>
                <th className="px-4 py-3 hidden lg:table-cell">Zuletzt online</th>
                <th className="px-4 py-3 hidden lg:table-cell">Letzte Aktion</th>
                <th className="px-4 py-3 hidden xl:table-cell">Aktivität 30T</th>
                <th className="px-4 py-3 hidden md:table-cell">Angelegt</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => {
                const c = checksByUser.get(u.id) ?? {
                  total: 0,
                  open: 0,
                  inReview: 0,
                  express: 0,
                  completed: 0,
                }
                const planCls =
                  u.planStatus === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : u.planStatus === 'PAST_DUE'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : u.planStatus === 'TRIALING'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-bg-secondary text-text-muted border-border'
                return (
                  <tr key={u.id} className="hover:bg-bg-secondary/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/customers/${u.id}`}
                        className="block group"
                      >
                        <div className="font-semibold text-text-primary group-hover:text-brand-700 truncate">
                          {u.name ?? u.email}
                        </div>
                        <div className="text-xs text-text-muted truncate">
                          {u.company ?? u.email}
                          {u.company && u.email !== u.name ? ` · ${u.email}` : ''}
                          {!u.stripeCustomerId && (
                            <span className="ml-2 text-[10px] uppercase font-bold text-amber-700">
                              comp
                            </span>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-text-primary text-xs">{u.plan}</div>
                      <span
                        className={`inline-block mt-0.5 px-1.5 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wider ${planCls}`}
                      >
                        {u.planStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-primary">{u._count.candidates}</td>
                    <td className="px-4 py-3">
                      <div className="text-text-primary font-semibold">{c.total}</div>
                      <div className="text-[11px] text-text-muted">
                        {c.open}↻ · {c.inReview}⏱ · {c.completed}✓
                        {c.express > 0 && (
                          <span className="text-rose-600 font-bold ml-1">· {c.express}⚡</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs hidden lg:table-cell">
                      {(() => {
                        const t = timeAgo(lastLoginByUser.get(u.id))
                        return <span className={t.tone}>{t.label}</span>
                      })()}
                    </td>
                    <td className="px-4 py-3 text-xs hidden lg:table-cell">
                      {(() => {
                        const t = timeAgo(lastActivityByUser.get(u.id))
                        return <span className={t.tone}>{t.label}</span>
                      })()}
                    </td>
                    <td className="px-4 py-3 text-xs hidden xl:table-cell">
                      {(() => {
                        const n = actions30dByUser.get(u.id) ?? 0
                        const cls = n === 0 ? 'text-text-muted' : n < 5 ? 'text-text-secondary' : 'text-emerald-700 font-semibold'
                        return <span className={cls}>{n} Aktion{n === 1 ? '' : 'en'}</span>
                      })()}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted hidden md:table-cell">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/customers/${u.id}`}
                        className="text-text-muted hover:text-text-primary"
                        aria-label="Detail öffnen"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-text-muted mt-3">
        Max. 200 Ergebnisse. Reviewer/Admin-Konten sind ausgeblendet. ↻ offen · ⏱ im Review · ✓ abgeschlossen · ⚡ Express.
        Aktivitäts-Daten aus dem Audit-Trail (alle Logins, Uploads, Übergaben, Add-on-Buchungen — live).
      </p>
    </>
  )
}

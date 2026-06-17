import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isAdmin, slaState, formatHoursShort } from '@/lib/reviewer'
import { Header } from '@/components/layout/Header'
import { formatDate, CHECK_STATUS, CHECK_RESULT } from '@/lib/utils'
import { ArrowLeft, Mail, Building2, CreditCard, Zap, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (!isAdmin(session)) redirect('/dashboard')

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      email: true,
      name: true,
      company: true,
      role: true,
      accountType: true,
      plan: true,
      planStatus: true,
      billingInterval: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      currentPeriodEnd: true,
      trialEndsAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  if (!user) notFound()

  // Reviewer/Admin werden nicht via Kundenliste angezeigt — schuetze defensiv
  // gegen Direkt-URL.
  if (user.role === 'REVIEWER' || user.role === 'ADMIN') {
    redirect('/admin/customers')
  }

  // Kandidaten + Checks + zugewiesener Reviewer pro Check
  const candidates = await prisma.candidate.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      checks: {
        orderBy: { createdAt: 'desc' },
        include: {
          assignedReviewer: { select: { id: true, name: true, email: true } },
        },
      },
    },
  })

  // Add-on-Orders fuer Billing-Kontext.
  const recentOrders = await prisma.addonOrder.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  // Letzte Audit-Events fuer Sales/Support-Kontext.
  const recentAudit = await prisma.auditLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 8,
    select: { id: true, action: true, entity: true, details: true, createdAt: true },
  })

  const totals = candidates.reduce(
    (acc, c) => {
      acc.total += c.checks.length
      for (const ch of c.checks) {
        if (ch.status === 'OPEN' || ch.status === 'IN_PROGRESS') acc.open++
        if (ch.status === 'IN_REVIEW') acc.inReview++
        if (ch.status === 'COMPLETED') acc.completed++
        if (ch.isExpress) acc.express++
      }
      return acc
    },
    { total: 0, open: 0, inReview: 0, completed: 0, express: 0 },
  )

  return (
    <>
      <Header
        title={user.name ?? user.email}
        subtitle={`${user.company ?? '—'} · ${user.email}`}
        action={
          <Link href="/admin/customers" className="btn-secondary">
            <ArrowLeft className="w-4 h-4" /> Zur Liste
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card-md p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
            <Building2 className="w-3.5 h-3.5" />
            Konto
          </div>
          <div className="text-text-primary font-semibold">{user.name ?? '—'}</div>
          <div className="text-xs text-text-muted mt-0.5 break-all">{user.email}</div>
          <div className="text-xs text-text-muted mt-2 space-y-0.5">
            <div>Account-Typ: {user.accountType}</div>
            <div>Angelegt: {formatDate(user.createdAt)}</div>
          </div>
        </div>

        <div className="card-md p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
            <CreditCard className="w-3.5 h-3.5" />
            Billing
          </div>
          <div className="text-text-primary font-semibold">{user.plan}</div>
          <div className="text-xs mt-0.5">
            Status:{' '}
            <span
              className={
                user.planStatus === 'ACTIVE'
                  ? 'text-emerald-700 font-semibold'
                  : user.planStatus === 'PAST_DUE'
                  ? 'text-rose-700 font-semibold'
                  : 'text-text-muted'
              }
            >
              {user.planStatus}
            </span>
          </div>
          <div className="text-xs text-text-muted mt-2 space-y-0.5">
            <div>Intervall: {user.billingInterval ?? '—'}</div>
            <div>
              Stripe-Customer:{' '}
              {user.stripeCustomerId ? (
                <span className="font-mono text-[10px]">{user.stripeCustomerId}</span>
              ) : (
                <span className="text-amber-700 font-semibold">— (Comp/Sales)</span>
              )}
            </div>
            {user.currentPeriodEnd && (
              <div>Period-End: {formatDate(user.currentPeriodEnd)}</div>
            )}
          </div>
        </div>

        <div className="card-md p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
            Aktivität
          </div>
          <div className="grid grid-cols-2 gap-y-1 text-sm">
            <div className="text-text-muted">Kandidaten</div>
            <div className="text-right font-semibold text-text-primary">{candidates.length}</div>
            <div className="text-text-muted">Checks gesamt</div>
            <div className="text-right font-semibold text-text-primary">{totals.total}</div>
            <div className="text-text-muted">Offen / In Review</div>
            <div className="text-right text-text-primary">
              {totals.open} / {totals.inReview}
            </div>
            <div className="text-text-muted">Abgeschlossen</div>
            <div className="text-right text-text-primary">{totals.completed}</div>
            {totals.express > 0 && (
              <>
                <div className="text-rose-600 font-semibold">Express aktiv</div>
                <div className="text-right text-rose-600 font-bold">{totals.express}</div>
              </>
            )}
          </div>
        </div>
      </div>

      <a
        href={`mailto:${user.email}`}
        className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:text-brand-800 font-semibold mb-6"
      >
        <Mail className="w-4 h-4" />
        {user.email} kontaktieren
      </a>

      <h2 className="text-lg font-bold text-text-primary mb-3">Aufträge</h2>
      {candidates.length === 0 ? (
        <div className="card-md p-6 text-center text-text-muted">
          Dieser Kunde hat noch keine Kandidaten angelegt.
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {candidates.map((cand) => (
            <div key={cand.id} className="card-md p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="font-semibold text-text-primary truncate">
                    {cand.firstName} {cand.lastName}
                    <span className="text-text-muted font-normal"> · {cand.position}</span>
                  </div>
                  <div className="text-xs text-text-muted">
                    Status: {cand.status} · {cand.checks.length} Check(s) ·{' '}
                    {formatDate(cand.createdAt)}
                  </div>
                </div>
                <Link
                  href={`/candidates/${cand.id}`}
                  className="text-xs text-brand-700 hover:text-brand-800 font-semibold whitespace-nowrap"
                >
                  öffnen <ExternalLink className="inline w-3 h-3" />
                </Link>
              </div>
              {cand.checks.length === 0 ? (
                <div className="text-xs text-text-muted">Keine Checks angelegt.</div>
              ) : (
                <ul className="space-y-1">
                  {cand.checks.map((chk) => {
                    const st = CHECK_STATUS[chk.status as keyof typeof CHECK_STATUS]
                    const res = chk.result
                      ? CHECK_RESULT[chk.result as keyof typeof CHECK_RESULT]
                      : null
                    const sla =
                      chk.status === 'IN_REVIEW'
                        ? slaState(chk.updatedAt, { isExpress: chk.isExpress })
                        : null
                    return (
                      <li
                        key={chk.id}
                        className="flex items-center justify-between gap-2 py-1.5 text-sm border-t border-border first:border-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-text-primary truncate">
                            {chk.isExpress && (
                              <Zap
                                className="inline w-3 h-3 text-rose-600 fill-rose-600 mr-1"
                                aria-label="Express"
                              />
                            )}
                            <Link
                              href={
                                chk.status === 'IN_REVIEW'
                                  ? `/reviewer/check/${chk.id}`
                                  : `/checks/${chk.id}`
                              }
                              className="hover:text-brand-700 font-medium"
                            >
                              {chk.employerName}
                            </Link>
                            {chk.employerContact && (
                              <span className="text-text-muted">
                                {' '}
                                · {chk.employerContact}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-text-muted flex flex-wrap gap-x-2">
                            {st && <span>{st.label}</span>}
                            {res && <span>· {res.label}</span>}
                            {chk.assignedReviewer ? (
                              <span>
                                · Reviewer:{' '}
                                <span className="font-semibold">
                                  {chk.assignedReviewer.name ?? chk.assignedReviewer.email}
                                </span>
                              </span>
                            ) : chk.status === 'IN_REVIEW' ? (
                              <span className="text-amber-700">· nicht zugewiesen</span>
                            ) : null}
                            {sla && (
                              <span
                                className={
                                  sla.state === 'breached'
                                    ? 'text-rose-600 font-semibold'
                                    : sla.state === 'warn'
                                    ? 'text-amber-700'
                                    : ''
                                }
                              >
                                · {formatHoursShort(sla.hoursInQueue)} im Review
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-md p-4">
          <h3 className="font-bold text-text-primary mb-2">Add-on-Bestellungen</h3>
          {recentOrders.length === 0 ? (
            <div className="text-sm text-text-muted">Noch keine Buchungen.</div>
          ) : (
            <ul className="space-y-1 text-sm">
              {recentOrders.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between py-1 border-b border-border last:border-0"
                >
                  <div>
                    <div className="font-semibold text-text-primary">{o.sku}</div>
                    <div className="text-[11px] text-text-muted">
                      {formatDate(o.createdAt)} · {o.status}
                    </div>
                  </div>
                  <div className="text-text-primary font-semibold">
                    €{(o.totalAmount / 100).toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-md p-4">
          <h3 className="font-bold text-text-primary mb-2">Letzte Audit-Events</h3>
          {recentAudit.length === 0 ? (
            <div className="text-sm text-text-muted">Keine Events.</div>
          ) : (
            <ul className="space-y-1 text-sm">
              {recentAudit.map((a) => (
                <li
                  key={a.id}
                  className="py-1 border-b border-border last:border-0"
                >
                  <div className="font-mono text-[11px] text-text-primary">
                    {a.action}
                  </div>
                  <div className="text-[11px] text-text-muted">
                    {a.entity} · {formatDate(a.createdAt)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}

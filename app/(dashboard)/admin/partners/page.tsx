import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/reviewer'
import { isPartnerProgramEnabled } from '@/lib/flags'
import { formatDateTime } from '@/lib/utils'
import { PartnerAdminActions } from '@/components/partner/PartnerAdminActions'
import { Handshake, Mail, Phone, Building2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: 'Wartet auf Prüfung', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  APPROVED:  { label: 'Aktiv',              cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  SUSPENDED: { label: 'Pausiert',           cls: 'bg-red-50 text-red-800 border-red-200' },
  REJECTED:  { label: 'Abgelehnt',          cls: 'bg-slate-100 text-slate-700 border-slate-200' },
}

const FILTERS = ['ALL', 'PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'] as const
type Filter = (typeof FILTERS)[number]

export default async function AdminPartnersPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  // Flag-Gate ZUERST — wenn Programm aus, ist auch die Admin-Seite weg.
  if (!isPartnerProgramEnabled()) notFound()

  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (!isAdmin(session)) redirect('/dashboard')

  const requested = (searchParams.status ?? 'PENDING').toUpperCase() as Filter
  const activeFilter: Filter = FILTERS.includes(requested) ? requested : 'PENDING'

  const where = activeFilter === 'ALL' ? { deletedAt: null } : { deletedAt: null, status: activeFilter }

  const [partners, counts] = await Promise.all([
    prisma.partnerAccount.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        email: true,
        contactFirstName: true,
        contactLastName: true,
        company: true,
        phone: true,
        status: true,
        tier: true,
        approvedAt: true,
        suspendedAt: true,
        suspendReason: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { customers: true } },
      },
      take: 200,
    }),
    prisma.partnerAccount.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
  ])

  const countByStatus = new Map(counts.map((c) => [c.status, c._count._all]))
  const totalAll = counts.reduce((sum, c) => sum + c._count._all, 0)

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
              <Handshake className="w-3.5 h-3.5" /> Partner-Programm
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tightest">
              Partner-Approval
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Bewerbungen prüfen, freigeben, pausieren. Approval-Aktionen
              triggern automatisch eine E-Mail an den Partner.
            </p>
          </div>
        </div>

        {/* Filter-Tabs ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map((f) => {
            const count = f === 'ALL' ? totalAll : countByStatus.get(f) ?? 0
            const isActive = f === activeFilter
            return (
              <Link
                key={f}
                href={`/admin/partners?status=${f}`}
                className={
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ' +
                  (isActive
                    ? 'bg-text-primary text-white border-text-primary'
                    : 'bg-white text-text-secondary border-border-default hover:bg-surface-subtle')
                }
              >
                {f === 'ALL' ? 'Alle' : STATUS_LABELS[f]?.label ?? f}
                <span
                  className={
                    'inline-block px-1.5 py-0.5 rounded text-[10px] ' +
                    (isActive ? 'bg-white/20' : 'bg-surface-subtle')
                  }
                >
                  {count}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Tabelle ───────────────────────────────────────────────────── */}
        {partners.length === 0 ? (
          <div className="card-md text-center py-16">
            <Handshake className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-secondary">
              Keine Partner im Status {'„'}{activeFilter === 'ALL' ? 'beliebig' : STATUS_LABELS[activeFilter]?.label}{'"'}.
            </p>
          </div>
        ) : (
          <div className="card-md overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-surface-subtle text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Firma / Kontakt</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Tier</th>
                  <th className="text-left px-4 py-3 font-semibold">Aktive Kunden</th>
                  <th className="text-left px-4 py-3 font-semibold">Beworben am</th>
                  <th className="text-left px-4 py-3 font-semibold">Letzter Login</th>
                  <th className="text-right px-4 py-3 font-semibold">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {partners.map((p) => {
                  const statusMeta = STATUS_LABELS[p.status] ?? { label: p.status, cls: '' }
                  return (
                    <tr key={p.id} className="hover:bg-surface-subtle/40">
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-start gap-2">
                          <Building2 className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-semibold text-text-primary leading-tight">
                              {p.company}
                            </div>
                            <div className="text-xs text-text-secondary mt-0.5">
                              {p.contactFirstName} {p.contactLastName}
                            </div>
                            <div className="text-xs text-text-muted mt-1 flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <a href={`mailto:${p.email}`} className="hover:text-indigo-600">
                                  {p.email}
                                </a>
                              </span>
                              {p.phone && (
                                <span className="inline-flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {p.phone}
                                </span>
                              )}
                            </div>
                            {p.suspendReason && (p.status === 'SUSPENDED' || p.status === 'REJECTED') && (
                              <div className="text-xs text-red-700 mt-1.5 italic">
                                {'„'}{p.suspendReason}{'"'}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={
                            'inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ' +
                            statusMeta.cls
                          }
                        >
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-text-secondary">{p.tier}</td>
                      <td className="px-4 py-3 align-top text-xs text-text-secondary">
                        {p._count.customers}
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-text-muted">
                        {formatDateTime(p.createdAt)}
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-text-muted">
                        {p.lastLoginAt ? formatDateTime(p.lastLoginAt) : '—'}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <PartnerAdminActions partnerId={p.id} status={p.status} />
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

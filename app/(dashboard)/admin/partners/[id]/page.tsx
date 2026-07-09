import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/reviewer'
import { isPartnerProgramEnabled } from '@/lib/flags'
import { formatDateTime, HR_PLANS, AGENCY_PLANS } from '@/lib/utils'
import { PartnerAdminActions } from '@/components/partner/PartnerAdminActions'
import { PartnerPricingOverrides, type PricingRow } from '@/components/partner/PartnerPricingOverrides'
import { ArrowLeft, Mail, Phone, Building2, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Wartet auf Prüfung', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  APPROVED: { label: 'Aktiv', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  SUSPENDED: { label: 'Pausiert', cls: 'bg-red-50 text-red-800 border-red-200' },
  REJECTED: { label: 'Abgelehnt', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
}

const CUST_STATUS: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'Aktiv', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PAUSED: { label: 'Pausiert', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  CHURNED: { label: 'Gekündigt', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
}

function euro(cents: number): string {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

// Einheiten-Semantik (siehe lib/partner/README.md): ALLE gespeicherten
// Cent-Beträge (ekPriceCents/endPriceCents/marginCents) sind bereits
// MONATSRATEN — bei YEARLY die günstigere Monatsrate bei jährlicher
// Zahlweise. Ein /12 wäre also doppelt normalisiert (MRR 12x zu niedrig).
function monthly(cents: number, _cycle: string): number {
  return cents
}

export default async function AdminPartnerDetailPage({
  params,
}: {
  params: { id: string }
}) {
  if (!isPartnerProgramEnabled()) notFound()
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (!isAdmin(session)) redirect('/dashboard')

  const partner = await prisma.partnerAccount.findFirst({
    where: { id: params.id, deletedAt: null },
    select: {
      id: true,
      company: true,
      email: true,
      phone: true,
      contactFirstName: true,
      contactLastName: true,
      status: true,
      tier: true,
      createdAt: true,
      approvedAt: true,
      lastLoginAt: true,
      customers: {
        orderBy: [{ status: 'asc' }, { activatedAt: 'desc' }],
        select: {
          id: true,
          company: true,
          planKey: true,
          billingCycle: true,
          ekPriceCents: true,
          endPriceCents: true,
          marginCents: true,
          status: true,
          activatedAt: true,
        },
      },
    },
  })

  if (!partner) notFound()

  // EK-Override-Tabelle: Default-Preise + Partner-Overrides + Tier-Discount.
  // Gleiche Auflösungslogik wie lib/partner/pricing.ts (Override beats Formel).
  const [pricingDefaults, pricingOverrides, tierRow] = await Promise.all([
    prisma.partnerPricing.findMany({
      where: { partnerAccountId: null },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.partnerPricing.findMany({ where: { partnerAccountId: partner.id } }),
    prisma.partnerTier.findUnique({ where: { tier: partner.tier } }),
  ])
  const overrideByPlan = new Map(pricingOverrides.map((o) => [o.planKey, o]))
  const ekDiscountPct = tierRow?.ekDiscountPct ?? 0
  const planMeta = new Map(
    [...HR_PLANS, ...AGENCY_PLANS].filter((p) => p.id !== 'ENTERPRISE').map((p) => [p.id, p]),
  )
  const seenPlanKeys = new Set<string>()
  const pricingRows: PricingRow[] = pricingDefaults
    .filter((d) => {
      if (!planMeta.has(d.planKey) || seenPlanKeys.has(d.planKey)) return false
      seenPlanKeys.add(d.planKey)
      return true
    })
    .map((d) => {
      const ov = overrideByPlan.get(d.planKey)
      return {
        planKey: d.planKey,
        planName: planMeta.get(d.planKey)?.name ?? d.planKey,
        listMonthlyCents: d.listPriceMonthlyCents,
        listAnnualCents: d.listPriceAnnualCents,
        tierEkMonthlyCents: Math.round(d.listPriceMonthlyCents * (1 - ekDiscountPct / 100)),
        tierEkAnnualCents: Math.round(d.listPriceAnnualCents * (1 - ekDiscountPct / 100)),
        overrideMonthlyCents: ov?.baseEkMonthlyCents ?? null,
        overrideAnnualCents: ov?.baseEkAnnualCents ?? null,
      }
    })

  const active = partner.customers.filter((c) => c.status === 'ACTIVE')
  const pausedCount = partner.customers.filter((c) => c.status === 'PAUSED').length
  const churnedCount = partner.customers.filter((c) => c.status === 'CHURNED').length

  const endMrr = active.reduce((s, c) => s + monthly(c.endPriceCents, c.billingCycle), 0)
  const ekMrr = active.reduce((s, c) => s + monthly(c.ekPriceCents, c.billingCycle), 0)
  const marginMrr = active.reduce((s, c) => s + monthly(c.marginCents, c.billingCycle), 0)

  const st = STATUS_LABELS[partner.status] ?? {
    label: partner.status,
    cls: 'bg-slate-100 text-slate-700 border-slate-200',
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/admin/partners"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-indigo-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück zur Partner-Liste
        </Link>

        <div className="card-md mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary leading-tight">{partner.company}</h1>
                <div className="text-sm text-text-secondary">
                  {partner.contactFirstName} {partner.contactLastName}
                </div>
                <div className="text-xs text-text-muted mt-1 flex items-center gap-3 flex-wrap">
                  <a href={`mailto:${partner.email}`} className="inline-flex items-center gap-1 hover:text-indigo-600">
                    <Mail className="w-3 h-3" />
                    {partner.email}
                  </a>
                  {partner.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {partner.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span
                className={
                  'inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ' +
                  st.cls
                }
              >
                {st.label}
              </span>
              <PartnerAdminActions partnerId={partner.id} status={partner.status} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-border-default text-sm">
            <div>
              <div className="text-xs text-text-muted">Tier</div>
              <div className="font-semibold text-text-primary">{partner.tier}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted">Beworben am</div>
              <div className="font-medium text-text-primary">{formatDateTime(partner.createdAt)}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted">Freigegeben am</div>
              <div className="font-medium text-text-primary">
                {partner.approvedAt ? formatDateTime(partner.approvedAt) : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-text-muted">Letzter Login</div>
              <div className="font-medium text-text-primary">
                {partner.lastLoginAt ? formatDateTime(partner.lastLoginAt) : '—'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card-md">
            <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
              <Users className="w-3.5 h-3.5" /> Aktive Kunden
            </div>
            <div className="text-2xl font-bold text-text-primary">{active.length}</div>
            <div className="text-xs text-text-muted mt-1">
              {pausedCount} pausiert · {churnedCount} gekündigt
            </div>
          </div>
          <div className="card-md">
            <div className="text-xs text-text-muted mb-1">End-Kunden-Umsatz (MRR)</div>
            <div className="text-2xl font-bold text-text-primary">{euro(endMrr)}</div>
            <div className="text-xs text-text-muted mt-1">was der Partner berechnet</div>
          </div>
          <div className="card-md">
            <div className="text-xs text-text-muted mb-1">candiq-Umsatz (MRR)</div>
            <div className="text-2xl font-bold text-text-primary">{euro(ekMrr)}</div>
            <div className="text-xs text-text-muted mt-1">EK — zahlt der Partner an candiq</div>
          </div>
          <div className="card-md">
            <div className="text-xs text-text-muted mb-1">Partner-Marge (MRR)</div>
            <div className="text-2xl font-bold text-text-primary">{euro(marginMrr)}</div>
            <div className="text-xs text-text-muted mt-1">End-Umsatz minus EK</div>
          </div>
        </div>

        <div className="mb-6">
          <PartnerPricingOverrides
            partnerId={partner.id}
            tier={partner.tier}
            ekDiscountPct={ekDiscountPct}
            rows={pricingRows}
          />
        </div>

        <div className="card-md overflow-x-auto p-0">
          <div className="px-4 py-3 border-b border-border-default">
            <h2 className="font-semibold text-text-primary">Kunden ({partner.customers.length})</h2>
          </div>
          {partner.customers.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-text-muted">Noch keine Kunden angelegt.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-subtle text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Firma</th>
                  <th className="text-left px-4 py-3 font-semibold">Plan</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">EK / Monat</th>
                  <th className="text-right px-4 py-3 font-semibold">VK / Monat</th>
                  <th className="text-right px-4 py-3 font-semibold">Marge</th>
                  <th className="text-left px-4 py-3 font-semibold">Aktiv seit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {partner.customers.map((c) => {
                  const cs = CUST_STATUS[c.status] ?? {
                    label: c.status,
                    cls: 'bg-slate-100 text-slate-600 border-slate-200',
                  }
                  return (
                    <tr key={c.id} className="hover:bg-surface-subtle/40">
                      <td className="px-4 py-3 font-medium text-text-primary">{c.company}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {c.planKey}
                        <span className="text-text-muted"> · {c.billingCycle === 'YEARLY' ? 'jährl.' : 'monatl.'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            'inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ' +
                            cs.cls
                          }
                        >
                        {cs.label}
                      </span>
                    </td>
                      <td className="px-4 py-3 text-right text-text-secondary">{euro(monthly(c.ekPriceCents, c.billingCycle))}</td>
                      <td className="px-4 py-3 text-right text-text-secondary">{euro(monthly(c.endPriceCents, c.billingCycle))}</td>
                      <td className="px-4 py-3 text-right font-medium text-text-primary">{euro(monthly(c.marginCents, c.billingCycle))}</td>
                      <td className="px-4 py-3 text-text-muted">{formatDateTime(c.activatedAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

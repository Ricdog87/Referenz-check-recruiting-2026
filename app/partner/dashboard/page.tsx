import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { pageMeta } from '@/lib/seo'
import { requireApprovedPartner } from '@/lib/partner/session'
import { withPartnerScope } from '@/lib/partner/scope'
import { allTiers, currentTierFromCount, nextTierAbove } from '@/lib/partner/tier'
import { Briefcase, TrendingUp, Tag, ArrowRight, Sparkles, Image as ImageIcon } from 'lucide-react'

export const metadata: Metadata = pageMeta({
  title: 'Partner-Dashboard',
  description: 'Übersicht über aktive Mandanten, Tier-Status und Marge.',
  path: '/partner/dashboard',
  noindex: true,
})

export const dynamic = 'force-dynamic'

export default async function PartnerDashboardOverviewPage() {
  const partner = await requireApprovedPartner()

  // Alle Reads sind partner-gescoped via withPartnerScope().
  const scope = withPartnerScope(partner.id)

  const [activeCount, allCount, customers, tiers] = await Promise.all([
    prisma.partnerCustomer.count({ where: { ...scope, status: 'ACTIVE' } }),
    prisma.partnerCustomer.count({ where: scope }),
    prisma.partnerCustomer.findMany({
      where: scope,
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, company: true, planKey: true, billingCycle: true,
        ekPriceCents: true, endPriceCents: true, marginCents: true,
        status: true, activatedAt: true,
      },
    }),
    allTiers(),
  ])

  const computedTier = currentTierFromCount(tiers, activeCount)
  const next = nextTierAbove(tiers, partner.tier)

  const totalMarginCents = await prisma.partnerCustomer.aggregate({
    where: { ...scope, status: 'ACTIVE' },
    _sum: { marginCents: true },
  })
  const mtdMarginEur = (totalMarginCents._sum.marginCents ?? 0) / 100

  // Hinweis: PartnerAccount.tier ist die "anerkannte" Stufe (Admin/Cron).
  // Wenn computedTier davon abweicht, ist ein Tier-Wechsel fällig — wir
  // zeigen das als gelber Hinweis, ändern aber NICHT eigenmächtig.
  const tierMismatch = computedTier && computedTier.tier !== partner.tier

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary tracking-tightest">
          Willkommen, {partner.name.split(' ')[0] || 'Partner'}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Übersicht über Ihre Mandanten und aktuelle Konditionen.
        </p>
      </header>

      {/* KPI-Karten ────────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi label="Aktive Mandanten" value={activeCount} icon={Briefcase} />
        <Kpi label="Gesamt-Mandanten" value={allCount} icon={Briefcase} tone="muted" />
        <Kpi
          label="Monats-Marge (aktiv)"
          value={`${formatEur(mtdMarginEur)} €`}
          icon={TrendingUp}
          tone="emerald"
        />
        <Kpi label="Aktuelles Tier" value={partner.tier} icon={Sparkles} tone="indigo" />
      </div>

      {/* Tier-Status ───────────────────────────────────────────────── */}
      <section className="card-md mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-wide text-text-muted">Tier-Status</div>
            <div className="text-lg font-bold text-text-primary mt-1">
              {partner.tier}
              {next && (
                <span className="text-sm text-text-secondary font-normal ml-2">
                  → noch <strong>{Math.max(0, next.minActiveCustomers - activeCount)}</strong>{' '}
                  aktive Mandanten bis {next.tier}
                </span>
              )}
            </div>
            {tierMismatch && computedTier && (
              <div className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg max-w-md">
                Sie haben <strong>{activeCount}</strong> aktive Mandanten — das entspricht
                Stufe <strong>{computedTier.tier}</strong>. Ihr aktuelles Konto-Tier wird
                beim nächsten Sync durch das candiq-Team aktualisiert. Bis dahin gelten
                die Konditionen Ihres aktuellen Tiers.
              </div>
            )}
          </div>
          <Link
            href="/partner/dashboard/pricing"
            className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            Konditionen ansehen <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Letzte Mandanten ─────────────────────────────────────────── */}
      <section className="card-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-text-primary">Letzte Mandanten</h2>
          <Link
            href="/partner/dashboard/customers"
            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1"
          >
            Alle Mandanten <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {customers.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto -mx-4">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-text-muted border-b border-border-default">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Mandant</th>
                  <th className="text-left px-4 py-2 font-semibold">Plan</th>
                  <th className="text-right px-4 py-2 font-semibold">EK</th>
                  <th className="text-right px-4 py-2 font-semibold">VK</th>
                  <th className="text-right px-4 py-2 font-semibold">Marge</th>
                  <th className="text-left px-4 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-semibold text-text-primary">{c.company}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary">
                      {c.planKey}{' '}
                      <span className="text-text-muted">
                        ({c.billingCycle === 'YEARLY' ? 'jährlich' : 'monatlich'})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-text-secondary">
                      {formatEur(c.ekPriceCents / 100)} €
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-text-secondary">
                      {formatEur(c.endPriceCents / 100)} €
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold text-emerald-700">
                      {formatEur(c.marginCents / 100)} €
                    </td>
                    <td className="px-4 py-3">
                      <CustomerStatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function Kpi(props: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  tone?: 'emerald' | 'indigo' | 'muted'
}) {
  const Icon = props.icon
  const toneCls =
    props.tone === 'emerald' ? 'text-emerald-700' :
    props.tone === 'indigo' ? 'text-indigo-700' :
    props.tone === 'muted' ? 'text-text-muted' : 'text-text-primary'

  return (
    <div className="card-md">
      <Icon className={`w-5 h-5 mb-2 ${toneCls}`} />
      <div className="text-xs uppercase tracking-wide text-text-muted">{props.label}</div>
      <div className={`text-2xl font-bold mt-1 leading-none ${toneCls}`}>{props.value}</div>
    </div>
  )
}

function CustomerStatusBadge({ status }: { status: string }) {
  const meta: Record<string, { label: string; cls: string }> = {
    ACTIVE:   { label: 'Aktiv',     cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    PAUSED:   { label: 'Pausiert',  cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    CHURNED:  { label: 'Gekündigt', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  }
  const m = meta[status] ?? { label: status, cls: '' }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${m.cls}`}>
      {m.label}
    </span>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-10">
      <Briefcase className="w-10 h-10 text-text-muted mx-auto mb-3" />
      <p className="text-sm text-text-secondary mb-4">Noch keine Mandanten angelegt.</p>
      <Link
        href="/partner/dashboard/customers"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-text-primary text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
      >
        Ersten Mandanten anlegen <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

function formatEur(amount: number): string {
  return amount.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

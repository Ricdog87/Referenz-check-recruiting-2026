import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { requireApprovedPartner } from '@/lib/partner/session'
import { resolveAllEkForPartner } from '@/lib/partner/pricing'
import { allTiers } from '@/lib/partner/tier'
import { HR_PLANS, AGENCY_PLANS } from '@/lib/utils'
import { Lock, Tag, TrendingUp, Info } from 'lucide-react'

export const metadata: Metadata = pageMeta({
  title: 'Partner — Konditionen',
  description: 'Ihre EK-Konditionen pro Plan, monatlich und jährlich.',
  path: '/partner/dashboard/pricing',
  noindex: true,
})

export const dynamic = 'force-dynamic'

const SKIP_PLANS = new Set(['ENTERPRISE'])

export default async function PartnerPricingPage() {
  const partner = await requireApprovedPartner()

  const [pricing, tiers] = await Promise.all([
    resolveAllEkForPartner({ partnerAccountId: partner.id, partnerTier: partner.tier }),
    allTiers(),
  ])

  const currentTier = tiers.find((t) => t.tier === partner.tier)

  // HR + Agency-Pläne in Anzeigereihenfolge (ENTERPRISE skipped).
  const allPlans = [...HR_PLANS, ...AGENCY_PLANS].filter((p) => !SKIP_PLANS.has(p.id))
  const planMeta = new Map(allPlans.map((p) => [p.id, p]))

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-text-muted mb-2">
          <Lock className="w-3.5 h-3.5" />
          Vertraulich — nur für eingeloggte Partner sichtbar
        </div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tightest">
          Ihre EK-Konditionen
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Aktuelles Tier: <strong>{partner.tier}</strong>
          {currentTier && (
            <span className="text-text-muted"> · {currentTier.ekDiscountPct}% auf Listenpreis</span>
          )}
        </p>
      </header>

      {/* Hinweis ───────────────────────────────────────────────────── */}
      <div className="mb-6 flex gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
        <Info className="w-5 h-5 text-indigo-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-900 leading-relaxed">
          <strong>EK = Listenpreis × (100% − Tier-Discount)</strong>, kaufmännisch
          gerundet. Mandanten-spezifische Konditionen (Per-Plan-Overrides) werden
          vom candiq-Team auf Anfrage gepflegt. Aufstieg in das nächste Tier
          erfolgt monatlich nach Schwellenwert-Erreichung.
        </div>
      </div>

      {/* Tier-Ladder Compact ──────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-text-primary mb-3 inline-flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Tier-Ladder
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tiers.map((t) => {
            const isCurrent = t.tier === partner.tier
            return (
              <div
                key={t.tier}
                className={
                  'rounded-xl p-3 border ' +
                  (isCurrent
                    ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300'
                    : 'bg-white border-border-default')
                }
              >
                <div className="text-xs uppercase tracking-wide text-text-muted">{t.tier}</div>
                <div className="text-lg font-bold text-text-primary mt-0.5">
                  {t.ekDiscountPct}%
                </div>
                <div className="text-[10px] text-text-secondary">
                  ab {t.minActiveCustomers} aktive
                </div>
                {isCurrent && (
                  <div className="mt-1.5 text-[10px] font-bold text-indigo-700 uppercase tracking-wide">
                    Aktuell
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Plan-Tabelle ──────────────────────────────────────────────── */}
      <section className="card-md p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-subtle text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Plan</th>
              <th className="text-left px-4 py-3 font-semibold">Zielgruppe</th>
              <th className="text-right px-4 py-3 font-semibold">Listenpreis / Mo</th>
              <th className="text-right px-4 py-3 font-semibold">Ihr EK / Mo</th>
              <th className="text-right px-4 py-3 font-semibold">Listenpreis / Jahr</th>
              <th className="text-right px-4 py-3 font-semibold">Ihr EK / Jahr</th>
              <th className="text-center px-4 py-3 font-semibold">Quelle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {pricing.monthly.map((row) => {
              const annual = pricing.yearly.find((y) => y.planKey === row.planKey)
              const meta = planMeta.get(row.planKey)
              const yourSavingsMonthly = row.listPriceCents - row.ekPriceCents
              const savingsPct = row.listPriceCents > 0
                ? Math.round((yourSavingsMonthly / row.listPriceCents) * 100)
                : 0

              return (
                <tr key={row.planKey} className="hover:bg-surface-subtle/40">
                  <td className="px-4 py-3">
                    <div className="font-bold text-text-primary">{meta?.name ?? row.planKey}</div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      <Tag className="w-3 h-3 inline mr-1" /> <code>{row.planKey}</code>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    {meta?.forType === 'HR_DEPARTMENT' ? 'HR-Abteilung' : 'PDL / Agentur'}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-text-secondary">
                    {formatEur(row.listPriceCents / 100)} €
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-indigo-700">
                    {formatEur(row.ekPriceCents / 100)} €
                    <span className="block text-[10px] font-normal text-text-muted">
                      −{savingsPct}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-text-secondary">
                    {annual ? `${formatEur(annual.listPriceCents / 100)} €` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-indigo-700">
                    {annual ? `${formatEur(annual.ekPriceCents / 100)} €` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.source === 'OVERRIDE' ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Override
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Tier-Formel
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <p className="text-xs text-text-muted mt-4">
        Konditionen sind <strong>brutto</strong> (ohne USt). Endkunden-Preis ist
        Ihre Marge plus EK. EK wird je Mandant zum Anlage-Zeitpunkt eingefroren —
        spätere Tier-Aufstiege wirken nur auf neue Mandanten.
      </p>
    </div>
  )
}

function formatEur(amount: number): string {
  return amount.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

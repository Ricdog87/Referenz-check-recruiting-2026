import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { pageMeta } from '@/lib/seo'
import { requireApprovedPartner } from '@/lib/partner/session'
import { withPartnerScope } from '@/lib/partner/scope'
import { Wallet, Hammer, Mail, TrendingUp, Info } from 'lucide-react'

export const metadata: Metadata = pageMeta({
  title: 'Partner — Abrechnung',
  description: 'Auszahlung Ihrer Marge — Stripe-Connect-Integration (in Vorbereitung).',
  path: '/partner/dashboard/payouts',
  noindex: true,
})

export const dynamic = 'force-dynamic'

export default async function PartnerPayoutsPage() {
  const partner = await requireApprovedPartner()
  const scope = withPartnerScope(partner.id)

  // Aktuelle Margin-Aggregation (alle aktiven Mandanten)
  const [activeAgg, allTimeAgg] = await Promise.all([
    prisma.partnerCustomer.aggregate({
      where: { ...scope, status: 'ACTIVE' },
      _sum: { marginCents: true },
      _count: { _all: true },
    }),
    prisma.partnerCustomer.aggregate({
      where: scope,
      _sum: { marginCents: true },
    }),
  ])

  const activeMargin = (activeAgg._sum.marginCents ?? 0) / 100
  const allTimeMargin = (allTimeAgg._sum.marginCents ?? 0) / 100

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary tracking-tightest">Abrechnung</h1>
        <p className="text-sm text-text-secondary mt-1">
          Auszahlung Ihrer Marge auf Ihr Konto. Aktuell manuell, Stripe-Connect
          ist in Vorbereitung.
        </p>
      </header>

      {/* KPI ─────────────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="card-md">
          <TrendingUp className="w-5 h-5 text-emerald-700 mb-2" />
          <div className="text-xs uppercase tracking-wide text-text-muted">
            Marge aus aktiven Mandanten
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 leading-none">
            {fmtEur(activeMargin)} €
          </div>
          <div className="text-xs text-text-muted mt-2">
            {activeAgg._count._all} aktive Mandanten · Rolling-Sum
          </div>
        </div>
        <div className="card-md">
          <Wallet className="w-5 h-5 text-indigo-700 mb-2" />
          <div className="text-xs uppercase tracking-wide text-text-muted">
            All-Time Marge
          </div>
          <div className="text-2xl font-bold text-text-primary mt-1 leading-none">
            {fmtEur(allTimeMargin)} €
          </div>
          <div className="text-xs text-text-muted mt-2">
            Einschl. pausierter und gekündigter Mandanten
          </div>
        </div>
      </div>

      {/* Aktueller Prozess ───────────────────────────────────────── */}
      <section className="card-md mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-base font-bold text-text-primary mb-2">
              Aktueller Auszahlungs-Prozess
            </h2>
            <ol className="space-y-2 text-sm text-text-secondary list-decimal list-inside">
              <li>
                candiq rechnet Ihre Marge <strong>monatlich</strong> auf Basis
                Ihrer aktiven Mandanten ab.
              </li>
              <li>
                Auszahlung erfolgt per <strong>Überweisung</strong> auf Ihr
                hinterlegtes Konto (5.–10. des Folgemonats).
              </li>
              <li>
                Gutschrift + Rechnung erhalten Sie zur jeweiligen Auszahlung
                per E-Mail.
              </li>
            </ol>
            <a
              href="mailto:partner@candiq.de?subject=Kontodaten%20%C3%A4ndern"
              className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-md text-xs font-semibold border border-border-default text-text-secondary hover:bg-surface-subtle"
            >
              <Mail className="w-3.5 h-3.5" />
              Kontodaten ändern oder Rückfrage
            </a>
          </div>
        </div>
      </section>

      {/* Stripe-Connect Roadmap-Hinweis ─────────────────────────── */}
      <section className="card-md border-2 border-dashed border-border-default bg-surface-subtle/40">
        <div className="flex items-start gap-3">
          <Hammer className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-100 text-amber-800 border border-amber-200 mb-2">
              Roadmap Q4 / Q1
            </div>
            <h2 className="text-base font-bold text-text-primary mb-2">
              Automatisierte Auszahlung via Stripe Connect
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-3">
              Stripe Connect Express-Account → täglicher Marge-Sweep → Auszahlung
              auf Ihr SEPA-Konto innerhalb von 1–2 Werktagen. Vollautomatisch,
              ohne manuelle Rückfrage.
            </p>
            <ul className="text-xs text-text-muted space-y-1 list-disc list-inside">
              <li>Onboarding via Stripe-Hosted-Form (KYC, Steuerangaben)</li>
              <li>Tagesgenaue Auszahlungen statt Monats-Batch</li>
              <li>PDF-Belege automatisch generiert (Stripe-Standard)</li>
              <li>Mehrwährungs-Support (EUR/CHF) für Partner außerhalb DE</li>
            </ul>
            <div className="mt-4 text-xs text-text-muted">
              Status: Konzept fertig, Vertragslayer in Klärung. Sie werden per
              E-Mail informiert, sobald wir live gehen.
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function fmtEur(amount: number): string {
  return amount.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { pageMeta } from '@/lib/seo'
import { requireApprovedPartner } from '@/lib/partner/session'
import { withPartnerScope } from '@/lib/partner/scope'
import { resolveAllEkForPartner } from '@/lib/partner/pricing'
import { HR_PLANS, AGENCY_PLANS } from '@/lib/utils'
import { PartnerCustomerList } from '@/components/partner/PartnerCustomerList'
import { Download } from 'lucide-react'

export const metadata: Metadata = pageMeta({
  title: 'Partner — Mandanten',
  description: 'Verwaltung Ihrer End-Mandanten im candiq-Partner-Programm.',
  path: '/partner/dashboard/customers',
  noindex: true,
})

export const dynamic = 'force-dynamic'

const SKIP_PLANS = new Set(['ENTERPRISE'])

export default async function PartnerCustomersPage() {
  const partner = await requireApprovedPartner()
  const scope = withPartnerScope(partner.id)

  const [customers, pricing, conversions] = await Promise.all([
    prisma.partnerCustomer.findMany({
      where: scope,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    }),
    resolveAllEkForPartner({ partnerAccountId: partner.id, partnerTier: partner.tier }),
    // Welche Mandanten haben ihren /register-Link genutzt? Lookup im
    // PartnerAuditLog — gibt uns ein Set der konvertierten Customer-IDs.
    prisma.partnerAuditLog.findMany({
      where: {
        partnerAccountId: partner.id,
        action: 'PARTNER_CUSTOMER_CONVERTED',
      },
      select: { entityId: true, createdAt: true },
    }),
  ])

  const convertedIds = new Set(
    conversions.map((c) => c.entityId).filter((id): id is string => id !== null),
  )

  // Plan-Metadaten (Name + EK) für die "Neu anlegen"-Form.
  // EK darf hier auf den Client — Partner ist approved, eingeloggt.
  const allPlans = [...HR_PLANS, ...AGENCY_PLANS].filter((p) => !SKIP_PLANS.has(p.id))
  const planOptions = allPlans.map((p) => {
    const monthly = pricing.monthly.find((r) => r.planKey === p.id)
    const yearly  = pricing.yearly.find((r) => r.planKey === p.id)
    return {
      planKey: p.id,
      name: p.name,
      audience: p.forType === 'HR_DEPARTMENT' ? 'HR' : 'PDL/Agentur',
      listMonthlyCents:  monthly?.listPriceCents ?? 0,
      ekMonthlyCents:    monthly?.ekPriceCents ?? 0,
      listAnnualCents:   yearly?.listPriceCents ?? 0,
      ekAnnualCents:     yearly?.ekPriceCents ?? 0,
    }
  })

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tightest">Mandanten</h1>
          <p className="text-sm text-text-secondary mt-1">
            Legen Sie End-Mandanten an, setzen Sie Ihren Verkaufspreis pro Mandant
            und sehen Sie die Marge live. EK wird beim Anlegen aus Ihrer aktuellen
            Tier-Kondition eingefroren.
          </p>
        </div>
        {customers.length > 0 && (
          <a
            href="/api/partner/customers/export.csv"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border-default text-text-secondary text-sm font-semibold hover:bg-surface-subtle transition-colors flex-shrink-0"
            download
          >
            <Download className="w-4 h-4" />
            CSV-Export
          </a>
        )}
      </header>

      <PartnerCustomerList
        initialCustomers={customers.map((c) => ({
          id: c.id,
          company: c.company,
          contactFirstName: c.contactFirstName,
          contactLastName: c.contactLastName,
          contactEmail: c.contactEmail,
          planKey: c.planKey,
          billingCycle: c.billingCycle as 'MONTHLY' | 'YEARLY',
          ekPriceCents: c.ekPriceCents,
          endPriceCents: c.endPriceCents,
          marginCents: c.marginCents,
          status: c.status as 'ACTIVE' | 'PAUSED' | 'CHURNED',
          notes: c.notes,
          activatedAt: c.activatedAt.toISOString(),
          converted: convertedIds.has(c.id),
        }))}
        planOptions={planOptions}
      />
    </div>
  )
}

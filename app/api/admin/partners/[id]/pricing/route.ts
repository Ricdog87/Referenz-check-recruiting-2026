import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/reviewer'
import { prisma } from '@/lib/db'
import { isPartnerProgramEnabled } from '@/lib/flags'
import { HR_PLANS, AGENCY_PLANS } from '@/lib/utils'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const BOOKABLE_PLAN_KEYS = new Set(
  [...HR_PLANS, ...AGENCY_PLANS].filter((p) => p.id !== 'ENTERPRISE').map((p) => p.id),
)

// Analog customers-Route: 1 Mio € Obergrenze, sicher unter Int4-Max.
const MAX_CENTS = 100_000_000

function parseOptionalCents(raw: unknown, label: string): { ok: true; value: number | null } | { ok: false; error: string } {
  if (raw === null || raw === undefined || raw === '') return { ok: true, value: null }
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return { ok: false, error: `${label}: ungültiger Betrag.` }
  if (n > MAX_CENTS) return { ok: false, error: `${label}: unplausibel hoch.` }
  return { ok: true, value: Math.round(n) }
}

/**
 * POST /api/admin/partners/[id]/pricing
 *   body: { planKey, baseEkMonthlyCents?: number|null, baseEkAnnualCents?: number|null }
 *
 * Setzt oder löscht den Per-Partner-EK-Override für einen Plan.
 * Beide Werte null → Override-Zeile wird GELÖSCHT (Tier-Formel greift wieder).
 * EINHEITEN: beide Werte sind Monatsraten (Annual = Monatsrate bei jährl.
 * Zahlweise) — siehe lib/partner/README.md.
 *
 * Wirkt NUR auf künftige Mandanten-Anlagen (EK-Snapshot-Semantik);
 * bestehende Mandanten behalten ihren eingefrorenen EK.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isPartnerProgramEnabled()) return new NextResponse('Not Found', { status: 404 })

  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const planKey = String(body?.planKey ?? '').trim()
  if (!BOOKABLE_PLAN_KEYS.has(planKey)) {
    return NextResponse.json({ error: `Plan "${planKey}" ist nicht buchbar.` }, { status: 400 })
  }

  const monthly = parseOptionalCents(body?.baseEkMonthlyCents, 'EK monatlich')
  if (!monthly.ok) return NextResponse.json({ error: monthly.error }, { status: 400 })
  const annual = parseOptionalCents(body?.baseEkAnnualCents, 'EK jährl. Zahlweise')
  if (!annual.ok) return NextResponse.json({ error: annual.error }, { status: 400 })

  const partner = await prisma.partnerAccount.findFirst({
    where: { id: params.id, deletedAt: null },
    select: { id: true },
  })
  if (!partner) return NextResponse.json({ error: 'Partner nicht gefunden.' }, { status: 404 })

  const clearing = monthly.value === null && annual.value === null

  try {
    if (clearing) {
      // Override komplett entfernen → Tier-Formel gilt wieder.
      await prisma.partnerPricing.deleteMany({
        where: { partnerAccountId: partner.id, planKey },
      })
    } else {
      // Upsert über den compound-unique (partnerAccountId, planKey).
      // listPrice*-Spalten sind bei Override-Zeilen nur informativ — wir
      // spiegeln die aktuellen Default-Werte, damit die Zeile vollständig ist.
      const defaultRow = await prisma.partnerPricing.findFirst({
        where: { partnerAccountId: null, planKey },
        orderBy: { createdAt: 'asc' },
      })
      if (!defaultRow) {
        return NextResponse.json(
          { error: `Keine Default-Preiszeile für "${planKey}" — seed:partner-pricing ausführen.` },
          { status: 409 },
        )
      }
      await prisma.partnerPricing.upsert({
        where: {
          partnerAccountId_planKey: { partnerAccountId: partner.id, planKey },
        },
        create: {
          partnerAccountId: partner.id,
          planKey,
          listPriceMonthlyCents: defaultRow.listPriceMonthlyCents,
          listPriceAnnualCents: defaultRow.listPriceAnnualCents,
          baseEkMonthlyCents: monthly.value,
          baseEkAnnualCents: annual.value,
        },
        update: {
          baseEkMonthlyCents: monthly.value,
          baseEkAnnualCents: annual.value,
        },
      })
    }

    await prisma.partnerAuditLog
      .create({
        data: {
          partnerAccountId: partner.id,
          action: clearing ? 'PARTNER_PRICING_OVERRIDE_CLEARED' : 'PARTNER_PRICING_OVERRIDE_SET',
          entity: 'PartnerPricing',
          entityId: planKey,
          details: clearing
            ? `by_admin=${session.user.id} plan=${planKey}`
            : `by_admin=${session.user.id} plan=${planKey} ekMo=${monthly.value ?? '—'}c ekJz=${annual.value ?? '—'}c`,
        },
      })
      .catch((err) => logger.warn('partner_pricing_audit_warn', err))

    return NextResponse.json({ ok: true, cleared: clearing })
  } catch (err) {
    logger.error('partner_pricing_override_error', err)
    return NextResponse.json({ error: 'Override konnte nicht gespeichert werden.' }, { status: 500 })
  }
}

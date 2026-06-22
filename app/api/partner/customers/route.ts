import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { isPartnerProgramEnabled } from '@/lib/flags'
import { getPartnerSession } from '@/lib/partner/session'
import { withPartnerScope } from '@/lib/partner/scope'
import { resolveEk, type BillingCycle } from '@/lib/partner/pricing'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const VALID_CYCLES: BillingCycle[] = ['MONTHLY', 'YEARLY']
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * GET  /api/partner/customers  → eigene Mandanten (für Client-side Refresh)
 * POST /api/partner/customers  → neuen Mandanten anlegen
 *
 * Beide Operationen sind auf den eingeloggten Partner gescoped — auch wenn
 * jemand im POST-Body ein fremdes partnerAccountId mitsendet, wird das
 * IGNORIERT (wir lesen den Scope aus der Session, nie aus dem Request).
 */

export async function GET() {
  if (!isPartnerProgramEnabled()) return new NextResponse('Not Found', { status: 404 })

  const session = await getPartnerSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 401 })
  if (session.status !== 'APPROVED') return NextResponse.json({ error: 'Account not approved' }, { status: 403 })

  const customers = await prisma.partnerCustomer.findMany({
    where: withPartnerScope(session.id),
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ customers })
}

export async function POST(req: NextRequest) {
  if (!isPartnerProgramEnabled()) return new NextResponse('Not Found', { status: 404 })

  const session = await getPartnerSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 401 })
  if (session.status !== 'APPROVED') return NextResponse.json({ error: 'Account not approved' }, { status: 403 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const company = String(body?.company ?? '').trim().slice(0, 160)
  const contactFirstName = String(body?.contactFirstName ?? '').trim().slice(0, 120)
  const contactLastName = String(body?.contactLastName ?? '').trim().slice(0, 120)
  const contactEmail = String(body?.contactEmail ?? '').trim().toLowerCase().slice(0, 254)
  const planKey = String(body?.planKey ?? '').trim().slice(0, 40)
  const billingCycle: BillingCycle = VALID_CYCLES.includes(body?.billingCycle) ? body.billingCycle : 'MONTHLY'
  const endPriceCentsRaw = Number(body?.endPriceCents)

  if (!company || !contactFirstName || !contactLastName || !contactEmail || !planKey) {
    return NextResponse.json({ error: 'Bitte alle Pflichtfelder ausfüllen.' }, { status: 400 })
  }
  if (!EMAIL_REGEX.test(contactEmail)) {
    return NextResponse.json({ error: 'Ungültige E-Mail-Adresse.' }, { status: 400 })
  }
  if (!Number.isFinite(endPriceCentsRaw) || endPriceCentsRaw <= 0) {
    return NextResponse.json({ error: 'Bitte einen gültigen Verkaufspreis angeben.' }, { status: 400 })
  }
  const endPriceCents = Math.round(endPriceCentsRaw)

  // EK aus dem Pricing-Resolver — Snapshot zum Anlage-Zeitpunkt.
  let ekPriceCents: number
  try {
    const resolution = await resolveEk({
      partnerAccountId: session.id,
      partnerTier: session.tier,
      planKey,
      cycle: billingCycle,
    })
    ekPriceCents = resolution.ekPriceCents
  } catch (err) {
    logger.error('partner_customer_ek_resolve_error', err)
    return NextResponse.json({ error: `Plan "${planKey}" ist im Programm nicht buchbar.` }, { status: 400 })
  }

  if (endPriceCents < ekPriceCents) {
    return NextResponse.json(
      { error: `Verkaufspreis (${(endPriceCents / 100).toFixed(2)} €) ist niedriger als Ihr EK (${(ekPriceCents / 100).toFixed(2)} €). Bitte über EK ansetzen.` },
      { status: 400 },
    )
  }

  const marginCents = endPriceCents - ekPriceCents

  try {
    const created = await prisma.partnerCustomer.create({
      data: {
        partnerAccountId: session.id,
        company, contactFirstName, contactLastName, contactEmail,
        planKey, billingCycle,
        ekPriceCents, endPriceCents, marginCents,
        status: 'ACTIVE',
      },
    })

    prisma.partnerAuditLog
      .create({
        data: {
          partnerAccountId: session.id,
          action: 'PARTNER_CUSTOMER_ADD',
          entity: 'PartnerCustomer',
          entityId: created.id,
          details: `plan=${planKey} cycle=${billingCycle} margin=${marginCents}c`,
        },
      })
      .catch((err) => logger.warn('partner_customer_audit_warn', err))

    return NextResponse.json({ id: created.id }, { status: 201 })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json(
        { error: 'Mandant mit diesem Plan ist bei Ihnen bereits angelegt.' },
        { status: 409 },
      )
    }
    logger.error('partner_customer_create_error', err)
    return NextResponse.json({ error: 'Mandant konnte nicht angelegt werden.' }, { status: 500 })
  }
}

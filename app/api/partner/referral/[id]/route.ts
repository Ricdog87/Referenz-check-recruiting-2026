import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isPartnerProgramEnabled } from '@/lib/flags'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { getPlanById } from '@/lib/utils'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/partner/referral/[id]
 *
 * Prefill-Daten für den Register-Flow eines Partner-Mandanten. Die ID ist
 * die PartnerCustomer-cuid aus der Welcome-Mail (?via=…) — sie wirkt als
 * Capability-Token: 25 Zeichen cuid, nicht erratbar, nur der Mail-Empfänger
 * kennt sie. Kein Auth-Cookie nötig (der Mandant HAT noch keinen Account).
 *
 * Datenminimierung (bewusst KEIN Response-Feld dafür):
 *   - ekPriceCents / endPriceCents / marginCents  → Preis-Interna des Partners
 *   - partnerAccountId                            → interne ID
 *   - notes                                       → Partner-interne Notizen
 *
 * Der Response enthält NUR, was der Empfänger ohnehin aus seiner eigenen
 * Welcome-Mail kennt: seine Firma, seinen Namen, seine E-Mail, den Plan
 * und den Namen des einladenden Partners.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isPartnerProgramEnabled()) return new NextResponse('Not Found', { status: 404 })

  const ip = getClientIp(req)
  const rl = rateLimit(`partner-referral:${ip}`, 30, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  const id = String(params.id ?? '').trim()
  // cuid-Format grob prüfen, bevor die DB angefasst wird
  if (!/^c[a-z0-9]{20,32}$/i.test(id)) {
    return NextResponse.json({ error: 'Ungültiger Link.' }, { status: 400 })
  }

  try {
    const customer = await prisma.partnerCustomer.findUnique({
      where: { id },
      select: {
        id: true,
        company: true,
        contactFirstName: true,
        contactLastName: true,
        contactEmail: true,
        planKey: true,
        billingCycle: true,
        status: true,
        partnerAccount: {
          select: { company: true, status: true, deletedAt: true },
        },
      },
    })

    // Generische 404 für alle Nicht-Treffer-Fälle — kein Oracle, welcher
    // Teil (Customer weg / Partner suspendiert / gekündigt) zutrifft.
    if (
      !customer ||
      customer.status === 'CHURNED' ||
      !customer.partnerAccount ||
      customer.partnerAccount.deletedAt ||
      customer.partnerAccount.status !== 'APPROVED'
    ) {
      return NextResponse.json({ error: 'Einladung nicht gefunden oder abgelaufen.' }, { status: 404 })
    }

    const plan = getPlanById(customer.planKey)

    return NextResponse.json({
      referralId: customer.id,
      company: customer.company,
      contactFirstName: customer.contactFirstName,
      contactLastName: customer.contactLastName,
      contactEmail: customer.contactEmail,
      planKey: customer.planKey,
      planName: plan?.name ?? customer.planKey,
      billingCycle: customer.billingCycle,
      partnerCompany: customer.partnerAccount.company,
    })
  } catch (err) {
    logger.error('partner_referral_lookup_error', err)
    return NextResponse.json({ error: 'Einladung konnte nicht geladen werden.' }, { status: 500 })
  }
}

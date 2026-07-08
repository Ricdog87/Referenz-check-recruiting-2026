import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isPartnerProgramEnabled } from '@/lib/flags'
import { getPartnerSession } from '@/lib/partner/session'
import { withPartnerScope } from '@/lib/partner/scope'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const VALID_STATUS = new Set(['ACTIVE', 'PAUSED', 'CHURNED'])

/**
 * PATCH /api/partner/customers/[id]
 *   body: { status?: 'ACTIVE'|'PAUSED'|'CHURNED', endPriceCents?: number, notes?: string }
 *
 * EK wird NICHT geändert — der Snapshot bleibt eingefroren. Wenn der EK
 * neu berechnet werden soll, muss der Mandant gekündigt und neu angelegt
 * werden (Audit-Trail-Konformität).
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isPartnerProgramEnabled()) return new NextResponse('Not Found', { status: 404 })

  const session = await getPartnerSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 401 })
  if (session.status !== 'APPROVED') return NextResponse.json({ error: 'Account not approved' }, { status: 403 })

  // Doppel-Scope: findFirst mit withPartnerScope() stellt sicher, dass
  // wir niemals einen fremden Datensatz finden — auch wenn die ID erraten würde.
  const customer = await prisma.partnerCustomer.findFirst({
    where: { ...withPartnerScope(session.id), id: params.id },
  })
  if (!customer) return NextResponse.json({ error: 'Mandant nicht gefunden.' }, { status: 404 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const data: any = {}

  if (typeof body?.status === 'string') {
    const s = String(body.status).toUpperCase()
    if (!VALID_STATUS.has(s)) {
      return NextResponse.json({ error: 'Ungültiger Status.' }, { status: 400 })
    }
    data.status = s
    if (s === 'PAUSED'  && customer.status !== 'PAUSED')  data.pausedAt  = new Date()
    if (s === 'CHURNED' && customer.status !== 'CHURNED') data.churnedAt = new Date()
    if (s === 'ACTIVE') {
      data.pausedAt = null
      data.churnedAt = null
    }
  }

  if (body?.endPriceCents !== undefined) {
    const n = Number(body.endPriceCents)
    if (!Number.isFinite(n) || n <= 0) {
      return NextResponse.json({ error: 'Ungültiger Verkaufspreis.' }, { status: 400 })
    }
    // 1 Mio € Obergrenze — verhindert Int4-Überlauf → Prisma-Fehler → 500.
    if (n > 100_000_000) {
      return NextResponse.json({ error: 'Verkaufspreis unplausibel hoch — bitte prüfen.' }, { status: 400 })
    }
    const cents = Math.round(n)
    if (cents < customer.ekPriceCents) {
      return NextResponse.json(
        { error: `Verkaufspreis (${(cents / 100).toFixed(2)} €) unter EK (${(customer.ekPriceCents / 100).toFixed(2)} €).` },
        { status: 400 },
      )
    }
    data.endPriceCents = cents
    data.marginCents = cents - customer.ekPriceCents
  }

  if (typeof body?.notes === 'string') {
    data.notes = body.notes.slice(0, 1000)
  }

  // Kontaktdaten-Korrektur (Tippfehler in der Welcome-Mail-Adresse ist der
  // Haupt-Anwendungsfall — danach /resend-welcome aufrufen).
  if (body?.contactEmail !== undefined) {
    const email = String(body.contactEmail ?? '').trim().toLowerCase().slice(0, 254)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json({ error: 'Ungültige Kontakt-E-Mail.' }, { status: 400 })
    }
    data.contactEmail = email
  }
  if (body?.contactFirstName !== undefined) {
    const v = String(body.contactFirstName ?? '').trim().slice(0, 120)
    if (!v) return NextResponse.json({ error: 'Vorname darf nicht leer sein.' }, { status: 400 })
    data.contactFirstName = v
  }
  if (body?.contactLastName !== undefined) {
    const v = String(body.contactLastName ?? '').trim().slice(0, 120)
    if (!v) return NextResponse.json({ error: 'Nachname darf nicht leer sein.' }, { status: 400 })
    data.contactLastName = v
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Keine Änderungen.' }, { status: 400 })
  }

  try {
    await prisma.partnerCustomer.update({
      where: { id: customer.id },
      data,
    })

    prisma.partnerAuditLog
      .create({
        data: {
          partnerAccountId: session.id,
          action: 'PARTNER_CUSTOMER_UPDATE',
          entity: 'PartnerCustomer',
          entityId: customer.id,
          details: Object.keys(data).join(','),
        },
      })
      .catch((err) => logger.warn('partner_customer_patch_audit_warn', err))

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error('partner_customer_patch_error', err)
    return NextResponse.json({ error: 'Update fehlgeschlagen.' }, { status: 500 })
  }
}

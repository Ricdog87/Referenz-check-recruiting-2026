import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isPartnerProgramEnabled } from '@/lib/flags'
import { getPartnerSession } from '@/lib/partner/session'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/partner/account — Firmendaten des eigenen Partner-Accounts.
 *
 * Änderbar: company, contactFirstName, contactLastName, phone.
 * BEWUSST NICHT änderbar:
 *   - email  → ist Login-Identität UND Referral-Bindung; Änderung nur
 *     über partner@candiq.de (manuell, mit Verifikation)
 *   - status/tier → Admin- bzw. Cron-Hoheit
 *
 * Auch PENDING-Partner dürfen ihre Stammdaten korrigieren (z. B. Tippfehler
 * in der Firma vor dem Approval). SUSPENDED/REJECTED werden explizit
 * geblockt: der Login verweigert sie zwar, aber eine VOR der Sperrung
 * ausgestellte Session bleibt bis zu 24h gültig (JWT) — deshalb hier
 * zusätzlich Status-Gate + DB-Frischcheck (status/deletedAt), analog zu
 * allen anderen Partner-Routen.
 */
export async function PATCH(req: NextRequest) {
  if (!isPartnerProgramEnabled()) return new NextResponse('Not Found', { status: 404 })

  const session = await getPartnerSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 401 })
  if (session.status !== 'APPROVED' && session.status !== 'PENDING') {
    return NextResponse.json({ error: 'Account gesperrt.' }, { status: 403 })
  }

  // DB-Frischcheck: Session-Status kann bis zu 60s alt sein (JWT-Refresh) —
  // für Schreiboperationen zählt der echte DB-Zustand.
  const freshAccount = await prisma.partnerAccount.findUnique({
    where: { id: session.id },
    select: { status: true, deletedAt: true },
  })
  if (
    !freshAccount ||
    freshAccount.deletedAt ||
    (freshAccount.status !== 'APPROVED' && freshAccount.status !== 'PENDING')
  ) {
    return NextResponse.json({ error: 'Account gesperrt.' }, { status: 403 })
  }

  const ip = getClientIp(req)
  const rl = rateLimit(`partner-account:${session.id}`, 20, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Zu viele Änderungen. Bitte später erneut.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const data: Record<string, string | null> = {}

  if (body?.company !== undefined) {
    const v = String(body.company ?? '').trim().slice(0, 160)
    if (!v) return NextResponse.json({ error: 'Firma darf nicht leer sein.' }, { status: 400 })
    data.company = v
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
  if (body?.phone !== undefined) {
    const v = String(body.phone ?? '').trim().slice(0, 40)
    data.phone = v || null
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Keine Änderungen.' }, { status: 400 })
  }

  try {
    await prisma.partnerAccount.update({
      where: { id: session.id },
      data,
    })
    await prisma.partnerAuditLog
      .create({
        data: {
          partnerAccountId: session.id,
          action: 'PARTNER_ACCOUNT_UPDATE',
          entity: 'PartnerAccount',
          entityId: session.id,
          details: Object.keys(data).join(','),
          ip,
        },
      })
      .catch((err) => logger.warn('partner_account_audit_warn', err))

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error('partner_account_update_error', err)
    return NextResponse.json({ error: 'Änderung fehlgeschlagen.' }, { status: 500 })
  }
}

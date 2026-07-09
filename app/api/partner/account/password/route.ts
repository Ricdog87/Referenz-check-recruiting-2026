import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { isPartnerProgramEnabled } from '@/lib/flags'
import { getPartnerSession } from '@/lib/partner/session'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const MIN_PASSWORD_LEN = 10
const MAX_PASSWORD_LEN = 128

/**
 * POST /api/partner/account/password — Passwort ändern (eingeloggt).
 *
 * Verlangt das AKTUELLE Passwort (Session allein reicht nicht — schützt
 * gegen unbeaufsichtigte offene Browser). Nach Erfolg werden alle offenen
 * Reset-Tokens invalidiert.
 *
 * Rate-Limit bewusst streng (5/h): das Current-Password-Feld ist sonst
 * ein Passwort-Orakel für jeden mit gültiger Session.
 */
export async function POST(req: NextRequest) {
  if (!isPartnerProgramEnabled()) return new NextResponse('Not Found', { status: 404 })

  const session = await getPartnerSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 401 })

  const ip = getClientIp(req)
  const rl = rateLimit(`partner-pwchange:${session.id}`, 5, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Zu viele Versuche. Bitte in ${Math.ceil(rl.retryAfter / 60)} Minuten erneut.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : ''
  const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : ''

  if (!currentPassword) {
    return NextResponse.json({ error: 'Bitte aktuelles Passwort eingeben.', field: 'currentPassword' }, { status: 400 })
  }
  if (newPassword.length < MIN_PASSWORD_LEN) {
    return NextResponse.json(
      { error: `Neues Passwort muss mindestens ${MIN_PASSWORD_LEN} Zeichen haben.`, field: 'newPassword' },
      { status: 400 },
    )
  }
  if (newPassword.length > MAX_PASSWORD_LEN) {
    return NextResponse.json(
      { error: `Neues Passwort darf maximal ${MAX_PASSWORD_LEN} Zeichen haben.`, field: 'newPassword' },
      { status: 400 },
    )
  }

  try {
    const account = await prisma.partnerAccount.findUnique({
      where: { id: session.id },
      select: { id: true, passwordHash: true, deletedAt: true },
    })
    if (!account || account.deletedAt) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 401 })
    }

    const valid = await bcrypt.compare(currentPassword, account.passwordHash).catch(() => false)
    if (!valid) {
      return NextResponse.json(
        { error: 'Aktuelles Passwort ist falsch.', field: 'currentPassword' },
        { status: 400 },
      )
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)

    // Atomar: neues Passwort + alle offenen Reset-Tokens entwerten.
    await prisma.$transaction([
      prisma.partnerAccount.update({
        where: { id: account.id },
        data: { passwordHash },
      }),
      prisma.partnerPasswordResetToken.updateMany({
        where: { partnerAccountId: account.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ])

    await prisma.partnerAuditLog
      .create({
        data: {
          partnerAccountId: account.id,
          action: 'PARTNER_PASSWORD_CHANGED',
          entity: 'PartnerAccount',
          entityId: account.id,
          details: 'Passwort im eingeloggten Zustand geändert',
          ip,
        },
      })
      .catch((err) => logger.warn('partner_pwchange_audit_warn', err))

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error('partner_pwchange_error', err)
    return NextResponse.json({ error: 'Passwort konnte nicht geändert werden.' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createHash } from 'crypto'
import { prisma } from '@/lib/db'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { isPartnerProgramEnabled } from '@/lib/flags'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const MIN_PASSWORD_LEN = 10
const MAX_PASSWORD_LEN = 128

/**
 * POST /api/partner/reset-password
 *
 * Setzt das Partner-Passwort über ein Token aus der forgot-password-Mail.
 * Token ist one-shot, alle anderen offenen Tokens werden invalidiert.
 */
export async function POST(req: NextRequest) {
  if (!isPartnerProgramEnabled()) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const ip = getClientIp(req)
  const rl = rateLimit(`partner-reset:${ip}`, 10, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Zu viele Versuche. Bitte in ${Math.ceil(rl.retryAfter / 60)} Minuten erneut versuchen.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const rawToken = String(body?.token ?? '').trim()
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!rawToken) {
    return NextResponse.json({ error: 'Ungültiger oder abgelaufener Link.' }, { status: 400 })
  }
  if (password.length < MIN_PASSWORD_LEN) {
    return NextResponse.json({ error: `Passwort muss mindestens ${MIN_PASSWORD_LEN} Zeichen haben.` }, { status: 400 })
  }
  if (password.length > MAX_PASSWORD_LEN) {
    return NextResponse.json({ error: `Passwort darf maximal ${MAX_PASSWORD_LEN} Zeichen haben.` }, { status: 400 })
  }

  try {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')

    const tokenRow = await prisma.partnerPasswordResetToken.findUnique({
      where: { token: tokenHash },
      include: { partnerAccount: { select: { id: true, deletedAt: true } } },
    })

    if (
      !tokenRow ||
      tokenRow.usedAt ||
      tokenRow.expiresAt.getTime() < Date.now() ||
      !tokenRow.partnerAccount ||
      tokenRow.partnerAccount.deletedAt
    ) {
      return NextResponse.json(
        { error: 'Der Reset-Link ist ungültig oder abgelaufen. Bitte erneut anfordern.' },
        { status: 400 },
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.$transaction([
      prisma.partnerAccount.update({
        where: { id: tokenRow.partnerAccountId },
        data: { passwordHash },
      }),
      prisma.partnerPasswordResetToken.update({
        where: { id: tokenRow.id },
        data: { usedAt: new Date() },
      }),
      prisma.partnerPasswordResetToken.updateMany({
        where: { partnerAccountId: tokenRow.partnerAccountId, usedAt: null, id: { not: tokenRow.id } },
        data: { usedAt: new Date() },
      }),
    ])

    prisma.partnerAuditLog
      .create({
        data: {
          partnerAccountId: tokenRow.partnerAccountId,
          action: 'PARTNER_PASSWORD_RESET_COMPLETED',
          entity: 'PartnerAccount',
          entityId: tokenRow.partnerAccountId,
          details: 'Passwort über Reset-Link neu gesetzt',
          ip,
        },
      })
      .catch((err) => logger.warn('partner_reset_audit_warn', err))

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error('partner_reset_error', err)
    return NextResponse.json(
      { error: 'Passwort konnte nicht gesetzt werden. Bitte erneut versuchen.' },
      { status: 500 },
    )
  }
}

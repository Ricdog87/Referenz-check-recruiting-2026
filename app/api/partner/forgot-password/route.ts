import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'
import { prisma } from '@/lib/db'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sendEmail, passwordResetEmail } from '@/lib/email'
import { isPartnerProgramEnabled } from '@/lib/flags'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const RESET_TTL_MINUTES = 60

/**
 * POST /api/partner/forgot-password
 *
 * Generisches OK — kein User-Enumeration. Token-Hash in DB, nicht Klartext.
 */
export async function POST(req: NextRequest) {
  if (!isPartnerProgramEnabled()) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const ip = getClientIp(req)
  const rl = rateLimit(`partner-forgot:${ip}`, 5, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Zu viele Anfragen. Bitte in ${Math.ceil(rl.retryAfter / 60)} Minuten erneut versuchen.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const email = String(body?.email ?? '').trim().toLowerCase().slice(0, 254)
  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Bitte eine gültige E-Mail-Adresse eingeben.' }, { status: 400 })
  }

  try {
    const partner = await prisma.partnerAccount.findFirst({
      where: { email: { equals: email, mode: 'insensitive' }, deletedAt: null },
      select: { id: true, email: true, contactFirstName: true, contactLastName: true },
    })

    if (partner) {
      const rawToken = randomBytes(32).toString('base64url')
      const tokenHash = createHash('sha256').update(rawToken).digest('hex')
      const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000)

      // Wenn das Token-Create fehlschlägt, darf KEINE Mail rausgehen —
      // sonst bekommt der Partner einen Link, der nie funktionieren kann.
      // Response bleibt trotzdem das generische ok (kein Enumeration-Oracle).
      try {
        await prisma.partnerPasswordResetToken.create({
          data: { partnerAccountId: partner.id, token: tokenHash, expiresAt, ip },
        })
      } catch (err) {
        logger.error('partner_forgot_token_error', err)
        return NextResponse.json({ ok: true })
      }

      const baseUrl = process.env.NEXTAUTH_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`
      const resetUrl = `${baseUrl}/partner/reset-password?token=${encodeURIComponent(rawToken)}`
      const tpl = passwordResetEmail({
        name: `${partner.contactFirstName} ${partner.contactLastName}`.trim(),
        resetUrl,
        expiresInMinutes: RESET_TTL_MINUTES,
      })
      await sendEmail({
        to: partner.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        category: 'partner-password-reset',
      }).catch((err) => logger.warn('partner_forgot_send_warn', err))

      // Awaited — fire-and-forget geht auf Vercel nach Response-Return verloren.
      await prisma.partnerAuditLog
        .create({
          data: {
            partnerAccountId: partner.id,
            action: 'PARTNER_PASSWORD_RESET_REQUESTED',
            entity: 'PartnerAccount',
            entityId: partner.id,
            details: `TTL ${RESET_TTL_MINUTES}min`,
            ip,
          },
        })
        .catch((err) => logger.warn('partner_forgot_audit_warn', err))
    }
  } catch (err) {
    logger.warn('partner_forgot_lookup_warn', err)
    // Generisch antworten — niemals 5xx leaken
  }

  return NextResponse.json({ ok: true })
}

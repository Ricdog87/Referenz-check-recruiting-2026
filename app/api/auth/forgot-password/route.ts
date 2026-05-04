import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'
import { prisma } from '@/lib/db'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { ensureSchema, withDbRecovery } from '@/lib/db-init'
import { sendEmail, passwordResetEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const RESET_TTL_MINUTES = 60

/**
 * Self-Service-Passwort-Reset.
 *
 * Sicherheits-Designentscheidungen:
 *  • Antwort ist immer generisch („ok") — kein User-Enumeration.
 *  • Tokens sind 32 Bytes Random, nur der **Hash** liegt in der DB. Ein
 *    Datenbank-Leak macht keine Tokens nutzbar.
 *  • TTL 60 Minuten. Tokens sind one-shot (`usedAt` wird beim Verbrauch gesetzt).
 *  • Rate-Limit: 5/h pro IP.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`forgot:${ip}`, 5, 60 * 60 * 1000)
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
    await ensureSchema()

    const user = await withDbRecovery(() =>
      prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true, email: true, name: true },
      }),
    )

    if (user) {
      // 32-Byte Token (URL-safe), Hash in DB
      const rawToken = randomBytes(32).toString('base64url')
      const tokenHash = createHash('sha256').update(rawToken).digest('hex')
      const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000)

      await withDbRecovery(() =>
        prisma.passwordResetToken.create({
          data: { userId: user.id, token: tokenHash, expiresAt, ip },
        }),
      ).catch((err) => {
        console.error('forgot_token_create_warn', err)
      })

      const baseUrl = process.env.NEXTAUTH_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`
      const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`
      const tpl = passwordResetEmail({
        name: user.name,
        resetUrl,
        expiresInMinutes: RESET_TTL_MINUTES,
      })
      await sendEmail({
        to: user.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        userId: user.id,
        category: 'password-reset',
      }).catch((err) => console.error('forgot_send_warn', err))

      try {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'PASSWORD_RESET_REQUESTED',
            entity: 'User',
            entityId: user.id,
            details: `Token erstellt · TTL ${RESET_TTL_MINUTES}min`,
            ip,
          },
        })
      } catch (auditErr) {
        console.error('forgot_audit_warn', auditErr)
      }
    }
  } catch (err) {
    console.error('forgot_lookup_warn', err)
    // Selbst bei DB-Fehler: generisch antworten, niemals 5xx leaken
  }

  return NextResponse.json({ ok: true })
}

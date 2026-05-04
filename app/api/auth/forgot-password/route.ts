import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { withDbRecovery } from '@/lib/db-init'

export const dynamic = 'force-dynamic'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Passwort-Reset (Stub).
 *
 * Aktuell ist kein Transaktional-Email-Provider konfiguriert. Damit der
 * Endpunkt trotzdem produktionssicher ist:
 *
 *   1. Wir antworten IMMER mit einer generischen Erfolgsmeldung — auch wenn
 *      die E-Mail nicht existiert. So wird kein User-Enumeration-Vektor
 *      geöffnet.
 *   2. Existierende User-Accounts werden im AuditLog vermerkt, damit der
 *      Support einen Reset-Wunsch nachvollziehen kann.
 *   3. Sobald ein Provider (Resend / SendGrid) eingebunden wird, bauen wir
 *      hier die Token-Erstellung + Versand ein.
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

  // Best effort — User-Lookup darf den Endpunkt nicht ins Wanken bringen.
  try {
    const user = await withDbRecovery(() =>
      prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true },
      }),
    )

    if (user) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'PASSWORD_RESET_REQUESTED',
            entity: 'User',
            entityId: user.id,
            details: 'Reset-Wunsch (Self-Service). Provider-Versand pending.',
            ip,
          },
        })
      } catch (auditErr) {
        console.error('forgot_audit_warn', auditErr)
      }
    }
  } catch (err) {
    // Niemals 5xx bei einem Reset-Request, sonst leakt das User-Existenz.
    console.error('forgot_lookup_warn', err)
  }

  return NextResponse.json({ ok: true })
}

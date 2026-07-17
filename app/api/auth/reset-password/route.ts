import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createHash } from 'crypto'
import { prisma } from '@/lib/db'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { ensureSchema, withDbRecovery } from '@/lib/db-init'

export const dynamic = 'force-dynamic'

const MIN_PASSWORD_LEN = 8
const MAX_PASSWORD_LEN = 128

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`reset:${ip}`, 10, 60 * 60 * 1000)
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
    await ensureSchema()

    const tokenHash = createHash('sha256').update(rawToken).digest('hex')

    const tokenRow = await withDbRecovery(() =>
      prisma.passwordResetToken.findUnique({
        where: { token: tokenHash },
        include: { user: { select: { id: true, email: true, name: true } } },
      }),
    )

    if (!tokenRow || tokenRow.usedAt || tokenRow.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'Der Reset-Link ist ungültig oder abgelaufen. Bitte erneut anfordern.' },
        { status: 400 },
      )
    }

    const hashed = await bcrypt.hash(password, 12)

    // Atomar: Passwort setzen + Token verbrauchen + alle anderen offenen Tokens invalidieren
    await prisma.$transaction([
      prisma.user.update({
        where: { id: tokenRow.userId },
        // passwordChangedAt entwertet bestehende JWT-Sessions (G4) — beim
        // Reset besonders wichtig (Anlass ist oft ein kompromittiertes PW).
        data: { password: hashed, passwordChangedAt: new Date() },
      }),
      prisma.passwordResetToken.update({
        where: { id: tokenRow.id },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.updateMany({
        where: { userId: tokenRow.userId, usedAt: null, id: { not: tokenRow.id } },
        data: { usedAt: new Date() },
      }),
    ])

    try {
      await prisma.auditLog.create({
        data: {
          userId: tokenRow.userId,
          action: 'PASSWORD_RESET_COMPLETED',
          entity: 'User',
          entityId: tokenRow.userId,
          details: 'Passwort via Self-Service-Reset geändert',
          ip,
        },
      })
    } catch (auditErr) {
      console.error('reset_audit_warn', auditErr)
    }

    return NextResponse.json({ ok: true, email: tokenRow.user.email })
  } catch (err) {
    console.error('reset_password_error', err)
    return NextResponse.json(
      { error: 'Reset fehlgeschlagen. Bitte erneut versuchen oder hello@candiq.de kontaktieren.' },
      { status: 500 },
    )
  }
}

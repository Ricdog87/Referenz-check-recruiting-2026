import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

const MAX_NAME_LEN = 120
const MAX_COMPANY_LEN = 160
const MIN_PASSWORD_LEN = 8
const MAX_PASSWORD_LEN = 128

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}

  if (body.name !== undefined) {
    const name = String(body.name).trim()
    if (!name) return NextResponse.json({ error: 'Name darf nicht leer sein.' }, { status: 400 })
    if (name.length > MAX_NAME_LEN) {
      return NextResponse.json({ error: `Name darf maximal ${MAX_NAME_LEN} Zeichen haben.` }, { status: 400 })
    }
    data.name = name
  }

  if (body.company !== undefined) {
    const company = String(body.company).trim()
    if (!company) return NextResponse.json({ error: 'Firma darf nicht leer sein.' }, { status: 400 })
    if (company.length > MAX_COMPANY_LEN) {
      return NextResponse.json({ error: `Firma darf maximal ${MAX_COMPANY_LEN} Zeichen haben.` }, { status: 400 })
    }
    data.company = company
  }

  let passwordChanged = false
  if (body.password !== undefined) {
    const newPassword = typeof body.password === 'string' ? body.password : ''
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''

    if (newPassword.length < MIN_PASSWORD_LEN) {
      return NextResponse.json({ error: `Passwort muss mindestens ${MIN_PASSWORD_LEN} Zeichen haben.` }, { status: 400 })
    }
    if (newPassword.length > MAX_PASSWORD_LEN) {
      return NextResponse.json({ error: `Passwort darf maximal ${MAX_PASSWORD_LEN} Zeichen haben.` }, { status: 400 })
    }
    if (!currentPassword) {
      return NextResponse.json({ error: 'Aktuelles Passwort ist erforderlich.' }, { status: 400 })
    }

    // G2 — Härtung des Passwort-Orakels (Parität mit Partner):
    // (a) In-Memory-Rate-Limit pro Session (5/h). (b) Durabler DB-Fehlversuchs-
    // zähler (5/h) VOR dem bcrypt-Vergleich, weil das In-Memory-Limit auf
    // Vercel nur pro Lambda-Instanz greift.
    const ip = getClientIp(req)
    const rl = rateLimit(`pwchange:${session.user.id}`, 5, 60 * 60 * 1000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Zu viele Versuche. Bitte in ${Math.ceil(rl.retryAfter / 60)} Minuten erneut.` },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      )
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentFailures = await prisma.auditLog.count({
      where: {
        userId: session.user.id,
        action: 'PASSWORD_CHANGE_FAILED',
        createdAt: { gte: oneHourAgo },
      },
    })
    if (recentFailures >= 5) {
      return NextResponse.json(
        { error: 'Zu viele Fehlversuche. Bitte in einer Stunde erneut — oder nutzen Sie „Passwort vergessen".' },
        { status: 429 },
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    })
    const valid = user ? await bcrypt.compare(currentPassword, user.password).catch(() => false) : false
    if (!valid) {
      await prisma.auditLog
        .create({
          data: {
            userId: session.user.id,
            action: 'PASSWORD_CHANGE_FAILED',
            entity: 'User',
            entityId: session.user.id,
            ip,
          },
        })
        .catch((err) => logger.warn('pwchange_fail_audit_warn', err))
      return NextResponse.json({ error: 'Aktuelles Passwort ist falsch.' }, { status: 400 })
    }

    data.password = await bcrypt.hash(newPassword, 12)
    // Entwertet bestehende JWT-Sessions beim nächsten Refresh (G4).
    data.passwordChangedAt = new Date()
    passwordChanged = true
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Keine Änderungen.' }, { status: 400 })
  }

  await prisma.user.update({ where: { id: session.user.id }, data })
  if (passwordChanged) {
    await prisma.auditLog
      .create({
        data: {
          userId: session.user.id,
          action: 'PASSWORD_CHANGED',
          entity: 'User',
          entityId: session.user.id,
          details: 'Passwort im eingeloggten Zustand geändert',
        },
      })
      .catch((err) => logger.warn('pwchange_audit_warn', err))
  }
  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const rlKey = getRateLimitKey(req, 'register')
  const { allowed } = checkRateLimit(rlKey, 5, 15 * 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Zu viele Registrierungsversuche. Bitte warten Sie 15 Minuten.' },
      { status: 429 }
    )
  }

  try {
    const { name, company, email, password, gdprAccepted } = await req.json()

    if (!name?.trim() || !company?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'Alle Felder sind erforderlich.' }, { status: 400 })
    }
    if (!gdprAccepted) {
      return NextResponse.json({ error: 'DSGVO-Einwilligung erforderlich.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Passwort muss mindestens 8 Zeichen haben.' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json({ error: 'E-Mail bereits registriert.' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        company: company.trim(),
        email: normalizedEmail,
        password: hashed,
        gdprConsents: {
          create: {
            type: 'REGISTRATION',
            granted: true,
            ip,
            userAgent: req.headers.get('user-agent') || '',
          },
        },
      },
    })

    return NextResponse.json({ id: user.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Interner Fehler. Bitte versuchen Sie es erneut.' }, { status: 500 })
  }
}

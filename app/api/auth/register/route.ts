import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { name, company, email, password, gdprAccepted } = await req.json()

    if (!name || !company || !email || !password) {
      return NextResponse.json({ error: 'Alle Felder sind erforderlich.' }, { status: 400 })
    }
    if (!gdprAccepted) {
      return NextResponse.json({ error: 'DSGVO-Einwilligung erforderlich.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Passwort zu kurz.' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'E-Mail bereits registriert.' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    const user = await prisma.user.create({
      data: {
        name,
        company,
        email,
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
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

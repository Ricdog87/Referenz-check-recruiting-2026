import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { name, company, email, password, gdprAccepted } = await req.json()
    const cleanName = (name ?? '').trim()
    const cleanCompany = (company ?? '').trim()
    const cleanEmail = (email ?? '').trim().toLowerCase()

    if (!cleanName || !cleanCompany || !cleanEmail || !password) {
      return NextResponse.json({ error: 'Alle Felder sind erforderlich.' }, { status: 400 })
    }
    if (!gdprAccepted) {
      return NextResponse.json({ error: 'DSGVO-Einwilligung erforderlich.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Passwort zu kurz.' }, { status: 400 })
    }

    const existing = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json({ error: 'E-Mail bereits registriert.' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    const user = await prisma.user.create({
      data: {
        name: cleanName,
        company: cleanCompany,
        email: cleanEmail,
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
  } catch (error) {
    console.error('register_error', error)

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { error: 'Datenbank-Verbindung fehlgeschlagen. Bitte Umgebungsvariablen prüfen.' },
        { status: 503 }
      )
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'E-Mail bereits registriert.' }, { status: 409 })
      }
      if (error.code === 'P1001' || error.code === 'P1002') {
        return NextResponse.json(
          { error: 'Datenbank aktuell nicht erreichbar. Bitte in 1–2 Minuten erneut versuchen.' },
          { status: 503 }
        )
      }
      if (error.code === 'P2021') {
        return NextResponse.json(
          { error: 'Datenbank noch nicht initialisiert. Bitte Support kontaktieren.' },
          { status: 503 }
        )
      }
    }

    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

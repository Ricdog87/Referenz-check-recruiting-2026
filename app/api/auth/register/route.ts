import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

const VALID_ACCOUNT_TYPES = ['HR_DEPARTMENT']
const VALID_PLANS = ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE']

export async function POST(req: NextRequest) {
  try {
    const { name, company, email, password, gdprAccepted, accountType, plan } = await req.json()
    const cleanName = (name ?? '').trim()
    const cleanCompany = (company ?? '').trim()
    const cleanEmail = (email ?? '').trim().toLowerCase()

    if (accountType === 'RECRUITMENT_AGENCY') {
      return NextResponse.json(
        { error: 'PDL-Konten sind aktuell in der Closed Beta. Bitte nutzen Sie die Warteliste unter /waitlist-agency.' },
        { status: 403 }
      )
    }

    const cleanAccountType = VALID_ACCOUNT_TYPES.includes(accountType) ? accountType : 'HR_DEPARTMENT'
    const cleanPlan = VALID_PLANS.includes(plan) ? plan : 'STARTER'

    if (!cleanName || !cleanCompany || !cleanEmail || !password) {
      return NextResponse.json({ error: 'Alle Felder sind erforderlich.' }, { status: 400 })
    }
    if (!gdprAccepted) {
      return NextResponse.json({ error: 'DSGVO-Einwilligung erforderlich.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Passwort muss mindestens 8 Zeichen haben.' }, { status: 400 })
    }

    const existing = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json({ error: 'Diese E-Mail-Adresse ist bereits registriert.' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'

    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    const user = await prisma.user.create({
      data: {
        name: cleanName,
        company: cleanCompany,
        email: cleanEmail,
        password: hashed,
        accountType: cleanAccountType,
        plan: cleanPlan,
        trialEndsAt,
        gdprConsents: {
          create: {
            type: 'REGISTRATION',
            granted: true,
            ip,
            userAgent: req.headers.get('user-agent') ?? '',
          },
        },
      },
    })

    return NextResponse.json({ id: user.id }, { status: 201 })
  } catch (error) {
    console.error('register_error', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Diese E-Mail-Adresse ist bereits registriert.' }, { status: 409 })
      }
      if (error.code === 'P1001' || error.code === 'P1002') {
        return NextResponse.json(
          { error: 'Datenbank aktuell nicht erreichbar. Bitte in 1–2 Minuten erneut versuchen.' },
          { status: 503 }
        )
      }
      if (error.code === 'P2021') {
        return NextResponse.json(
          { error: 'Datenbank-Setup noch nicht abgeschlossen. Bitte support@candiq.de kontaktieren.' },
          { status: 503 }
        )
      }
      if (error.code === 'P2022') {
        return NextResponse.json(
          { error: 'Datenbank-Schema veraltet. Bitte support@candiq.de kontaktieren.' },
          { status: 503 }
        )
      }
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { error: 'Datenbankverbindung konnte nicht hergestellt werden. Bitte später erneut versuchen.' },
        { status: 503 }
      )
    }

    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      return NextResponse.json(
        { error: 'Unbekannter Datenbankfehler. Bitte support@candiq.de kontaktieren.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Registrierung fehlgeschlagen. Bitte support@candiq.de kontaktieren.' },
      { status: 500 }
    )
  }
}

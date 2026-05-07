import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    })
    const valid = user ? await bcrypt.compare(currentPassword, user.password).catch(() => false) : false
    if (!valid) {
      return NextResponse.json({ error: 'Aktuelles Passwort ist falsch.' }, { status: 400 })
    }

    data.password = await bcrypt.hash(newPassword, 12)
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Keine Änderungen.' }, { status: 400 })
  }

  await prisma.user.update({ where: { id: session.user.id }, data })
  return NextResponse.json({ ok: true })
}

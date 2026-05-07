import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const MAX_NAME_LEN = 80
const MAX_EMAIL_LEN = 254
const MAX_PHONE_LEN = 40
const MAX_POSITION_LEN = 160
const MAX_DEPARTMENT_LEN = 160
const MAX_NOTES_LEN = 5000

function trimTo(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max)
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  const candidates = await prisma.candidate.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, firstName: true, lastName: true, position: true, status: true },
  })

  return NextResponse.json(candidates)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const firstName = trimTo(body.firstName, MAX_NAME_LEN)
  const lastName = trimTo(body.lastName, MAX_NAME_LEN)
  const position = trimTo(body.position, MAX_POSITION_LEN)
  const email = trimTo(body.email, MAX_EMAIL_LEN).toLowerCase()
  const phone = trimTo(body.phone, MAX_PHONE_LEN)
  const department = trimTo(body.department, MAX_DEPARTMENT_LEN)
  const notesRaw = body.notes == null ? '' : String(body.notes)

  if (!firstName || !lastName || !position) {
    return NextResponse.json({ error: 'Vorname, Nachname und Stelle sind erforderlich.' }, { status: 400 })
  }
  if (notesRaw.length > MAX_NOTES_LEN) {
    return NextResponse.json({ error: `Notizen dürfen maximal ${MAX_NOTES_LEN} Zeichen haben.` }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const gdprConsent = !!body.gdprConsent

  const candidate = await prisma.candidate.create({
    data: {
      firstName,
      lastName,
      email: email || null,
      phone: phone || null,
      position,
      department: department || null,
      notes: notesRaw || null,
      gdprConsent,
      gdprConsentDate: gdprConsent ? new Date() : null,
      gdprConsentIp: gdprConsent ? ip : null,
      userId: session.user.id,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'CREATE',
      entity: 'Candidate',
      entityId: candidate.id,
      ip,
    },
  })

  return NextResponse.json(candidate, { status: 201 })
}

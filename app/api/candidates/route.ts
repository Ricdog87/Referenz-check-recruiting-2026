import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAppSession } from '@/lib/app-session'

export async function GET() {
  const session = await getAppSession()
  
  const candidates = await prisma.candidate.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, firstName: true, lastName: true, position: true, status: true },
  })

  return NextResponse.json(candidates)
}

export async function POST(req: NextRequest) {
  const session = await getAppSession()
  
  const body = await req.json()
  const { firstName, lastName, email, phone, position, department, notes, gdprConsent } = body

  if (!firstName || !lastName || !position) {
    return NextResponse.json({ error: 'Vorname, Nachname und Stelle sind erforderlich.' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for') || 'unknown'

  const candidate = await prisma.candidate.create({
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      position: position.trim(),
      department: department?.trim() || null,
      notes: notes?.trim() || null,
      gdprConsent: !!gdprConsent,
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

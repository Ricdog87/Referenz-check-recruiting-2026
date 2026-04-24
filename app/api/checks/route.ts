import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAppSession } from '@/lib/app-session'

export async function GET() {
  const session = await getAppSession()
  
  const checks = await prisma.referenceCheck.findMany({
    where: { candidate: { userId: session.user.id } },
    orderBy: { updatedAt: 'desc' },
    include: { candidate: { select: { firstName: true, lastName: true } } },
  })

  return NextResponse.json(checks)
}

export async function POST(req: NextRequest) {
  const session = await getAppSession()
  
  const body = await req.json()
  const { candidateId, employerName, employerContact, employerPhone, employerEmail, position, startDate, endDate } = body

  if (!candidateId || !employerName) {
    return NextResponse.json({ error: 'Kandidat und Arbeitgeber sind erforderlich.' }, { status: 400 })
  }

  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, userId: session.user.id },
  })
  if (!candidate) return NextResponse.json({ error: 'Kandidat nicht gefunden.' }, { status: 404 })

  const check = await prisma.referenceCheck.create({
    data: {
      candidateId,
      employerName: employerName.trim(),
      employerContact: employerContact?.trim() || null,
      employerPhone: employerPhone?.trim() || null,
      employerEmail: employerEmail?.trim() || null,
      position: position?.trim() || null,
      startDate: startDate?.trim() || null,
      endDate: endDate?.trim() || null,
    },
  })

  if (candidate.status === 'PENDING') {
    await prisma.candidate.update({
      where: { id: candidateId },
      data: { status: 'IN_REVIEW' },
    })
  }

  return NextResponse.json(check, { status: 201 })
}

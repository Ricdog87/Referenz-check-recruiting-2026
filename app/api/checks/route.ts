import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getPlanById, trialDaysLeft } from '@/lib/utils'

const MAX_NAME_LEN = 160
const MAX_EMAIL_LEN = 254
const MAX_PHONE_LEN = 40
const MAX_DATE_LEN = 32

function trimTo(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max)
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  const checks = await prisma.referenceCheck.findMany({
    where: { candidate: { userId: session.user.id } },
    orderBy: { updatedAt: 'desc' },
    include: { candidate: { select: { firstName: true, lastName: true } } },
  })

  return NextResponse.json(checks)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  // Quota-Guard
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { planStatus: true, plan: true, trialEndsAt: true }
  })
  const plan = getPlanById(user?.plan || 'STARTER')
  const daysLeft = trialDaysLeft(user?.trialEndsAt)
  const isActive = (user?.planStatus === 'TRIALING' && daysLeft > 0) || user?.planStatus === 'ACTIVE'
  if (!isActive) {
    return NextResponse.json({ error: 'Kein aktiver Plan. Bitte abonnieren Sie einen Plan.' }, { status: 402 })
  }
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const monthlyCount = await prisma.referenceCheck.count({
    where: { userId: session.user.id, createdAt: { gte: startOfMonth } }
  })
  if (monthlyCount >= plan.includedChecks) {
    return NextResponse.json({
      error: `Monatslimit erreicht: ${plan.includedChecks} Checks/Monat in Ihrem ${plan.name}-Plan.`
    }, { status: 402 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const candidateId = trimTo(body.candidateId, 64)
  const employerName = trimTo(body.employerName, MAX_NAME_LEN)
  const employerContact = trimTo(body.employerContact, MAX_NAME_LEN)
  const employerPhone = trimTo(body.employerPhone, MAX_PHONE_LEN)
  const employerEmail = trimTo(body.employerEmail, MAX_EMAIL_LEN).toLowerCase()
  const position = trimTo(body.position, MAX_NAME_LEN)
  const startDate = trimTo(body.startDate, MAX_DATE_LEN)
  const endDate = trimTo(body.endDate, MAX_DATE_LEN)

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
      employerName,
      employerContact: employerContact || null,
      employerPhone: employerPhone || null,
      employerEmail: employerEmail || null,
      position: position || null,
      startDate: startDate || null,
      endDate: endDate || null,
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

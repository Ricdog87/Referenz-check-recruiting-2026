import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const VALID_STATUSES = ['PENDING', 'IN_REVIEW', 'COMPLETED', 'REJECTED']
const MAX_NOTES_LEN = 5000
const MAX_DEPARTMENT_LEN = 160

async function getCandidate(id: string, userId: string) {
  return prisma.candidate.findFirst({ where: { id, userId } })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  const candidate = await getCandidate(params.id, session.user.id)
  if (!candidate) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}

  if (body.status !== undefined) {
    const status = String(body.status)
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Ungültiger Status.' }, { status: 400 })
    }
    data.status = status
  }

  if (body.notes !== undefined) {
    const notes = body.notes === null ? null : String(body.notes)
    if (notes !== null && notes.length > MAX_NOTES_LEN) {
      return NextResponse.json({ error: `Notizen dürfen maximal ${MAX_NOTES_LEN} Zeichen haben.` }, { status: 400 })
    }
    data.notes = notes
  }

  if (body.department !== undefined) {
    const department = body.department === null ? null : String(body.department).trim()
    if (department !== null && department.length > MAX_DEPARTMENT_LEN) {
      return NextResponse.json({ error: `Abteilung darf maximal ${MAX_DEPARTMENT_LEN} Zeichen haben.` }, { status: 400 })
    }
    data.department = department || null
  }

  if (body.gdprConsent !== undefined) {
    data.gdprConsent = !!body.gdprConsent
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Keine Änderungen.' }, { status: 400 })
  }

  const updated = await prisma.candidate.update({ where: { id: params.id }, data })
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  const candidate = await getCandidate(params.id, session.user.id)
  if (!candidate) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  await prisma.candidate.delete({ where: { id: params.id } })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'DELETE',
      entity: 'Candidate',
      entityId: params.id,
    },
  })

  return NextResponse.json({ ok: true })
}

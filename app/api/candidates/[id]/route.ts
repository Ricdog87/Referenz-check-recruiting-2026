import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function getCandidate(id: string, userId: string) {
  return prisma.candidate.findFirst({ where: { id, userId } })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  const candidate = await getCandidate(params.id, session.user.id)
  if (!candidate) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  const body = await req.json()
  const allowed = ['status', 'notes', 'department', 'gdprConsent']
  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key]
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

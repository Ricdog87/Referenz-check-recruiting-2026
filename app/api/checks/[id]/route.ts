import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAppSession } from '@/lib/app-session'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAppSession()
  
  const check = await prisma.referenceCheck.findFirst({
    where: { id: params.id, candidate: { userId: session.user.id } },
  })
  if (!check) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  const body = await req.json()
  const allowed = ['status', 'result', 'callNotes', 'discrepancies', 'rating', 'calledAt']
  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key]
  }

  const updated = await prisma.referenceCheck.update({ where: { id: params.id }, data })
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAppSession()
  
  const check = await prisma.referenceCheck.findFirst({
    where: { id: params.id, candidate: { userId: session.user.id } },
  })
  if (!check) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  await prisma.referenceCheck.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}

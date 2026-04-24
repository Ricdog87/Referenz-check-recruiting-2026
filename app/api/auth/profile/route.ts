import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  const body = await req.json()
  const data: Record<string, unknown> = {}

  if (body.name) data.name = body.name
  if (body.company) data.company = body.company
  if (body.password) {
    if (body.password.length < 8)
      return NextResponse.json({ error: 'Passwort zu kurz.' }, { status: 400 })
    data.password = await bcrypt.hash(body.password, 12)
  }

  await prisma.user.update({ where: { id: session.user.id }, data })
  return NextResponse.json({ ok: true })
}

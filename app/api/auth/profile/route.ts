import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { getAppSession } from '@/lib/app-session'

export async function PATCH(req: NextRequest) {
  const session = await getAppSession()
  
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

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

    const body = await req.json()
    const data: Record<string, unknown> = {}

    if (body.name?.trim()) data.name = body.name.trim()
    if (body.company?.trim()) data.company = body.company.trim()
    if (body.password) {
      if (body.password.length < 8) {
        return NextResponse.json({ error: 'Passwort muss mindestens 8 Zeichen haben.' }, { status: 400 })
      }
      data.password = await bcrypt.hash(body.password, 12)
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Keine Änderungen angegeben.' }, { status: 400 })
    }

    await prisma.user.update({ where: { id: session.user.id }, data })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}

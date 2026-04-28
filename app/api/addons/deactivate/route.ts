import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  const { addonKey } = await req.json()
  if (!addonKey || typeof addonKey !== 'string') {
    return NextResponse.json({ error: 'Ungültiges Add-on.' }, { status: 400 })
  }

  try {
    const existing = await prisma.addonOrder.findFirst({
      where: { userId: session.user.id, addonKey },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Add-on ist nicht aktiv.' }, { status: 404 })
    }

    const order = await prisma.addonOrder.update({
      where: { id: existing.id },
      data: { status: 'CANCELED' },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DEACTIVATE',
        entity: 'AddonOrder',
        entityId: order.id,
        details: addonKey,
      },
    })

    return NextResponse.json({ ok: true, order })
  } catch {
    return NextResponse.json({ error: 'Add-on konnte nicht deaktiviert werden.' }, { status: 503 })
  }
}

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

  if (addonKey === 'INTERVIEW_ASSIST') {
    return NextResponse.json({ error: 'Dieses Add-on ist noch nicht freigeschaltet.' }, { status: 409 })
  }

  try {
    const order = await prisma.addonOrder.upsert({
      where: { userId_addonKey: { userId: session.user.id, addonKey } },
      update: { status: 'ACTIVE', seats: 1 },
      create: {
        userId: session.user.id,
        addonKey,
        addonName: addonKey === 'EXPRESS_VERIFY' ? 'Express Verify' : 'Deep Audit Pack',
        status: 'ACTIVE',
        seats: 1,
        price: 0,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ACTIVATE',
        entity: 'AddonOrder',
        entityId: order.id,
        details: addonKey,
      },
    })

    return NextResponse.json({ ok: true, order })
  } catch {
    return NextResponse.json({ error: 'Add-on konnte aktuell nicht aktiviert werden. Bitte Migration prüfen.' }, { status: 503 })
  }
}

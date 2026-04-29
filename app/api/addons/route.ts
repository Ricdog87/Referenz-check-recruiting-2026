import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getAddon } from '@/lib/addons'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  let body: { sku?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
  }

  const { sku } = body
  if (!sku) {
    return NextResponse.json({ error: 'SKU fehlt' }, { status: 400 })
  }

  const addon = getAddon(sku)
  if (!addon) {
    return NextResponse.json({ error: 'Unbekannte SKU' }, { status: 400 })
  }

  try {
    const order = await prisma.addonOrder.create({
      data: {
        userId: session.user.id,
        sku: addon.sku,
        quantity: addon.quantity,
        unitPrice: addon.price * 100,
        totalAmount: addon.price * 100 * addon.quantity,
        status: 'CONFIRMED',
        notes: `Buchung via Dashboard — ${addon.name}`,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADDON_BOOKED',
        entity: 'AddonOrder',
        entityId: order.id,
        details: JSON.stringify({ sku: addon.sku, price: addon.price, quantity: addon.quantity }),
      },
    })

    return NextResponse.json({ success: true, orderId: order.id })
  } catch (err: any) {
    console.error('[api/addons] Error:', err)
    return NextResponse.json(
      { error: 'Buchung konnte nicht gespeichert werden. Bitte kontaktieren Sie support@candiq.de.' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  const orders = await prisma.addonOrder.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ orders })
}

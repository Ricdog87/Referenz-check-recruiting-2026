import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const CATALOG = [
  {
    key: 'EXPRESS_VERIFY',
    name: 'Express Verify',
    desc: 'Priorisierte Referenzprüfung mit Ziel SLA < 24h für kritische Rollen.',
    defaultStatus: 'Live',
  },
  {
    key: 'DEEP_AUDIT_PACK',
    name: 'Deep Audit Pack',
    desc: 'Erweiterte Dokumentenprüfung und vertiefter Audit-Report für Compliance-Teams.',
    defaultStatus: 'Beta',
  },
  {
    key: 'INTERVIEW_ASSIST',
    name: 'Interview Assist',
    desc: 'Strukturierte Kompetenz-Interviews inkl. Scorecards als zusätzlicher Service.',
    defaultStatus: 'Bald verfügbar',
  },
] as const

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  try {
    const orders = await prisma.addonOrder.findMany({
      where: { userId: session.user.id },
      select: { addonKey: true, status: true, seats: true },
    })

    const byKey = new Map(orders.map((o) => [o.addonKey, o]))
    const addons = CATALOG.map((a) => {
      const order = byKey.get(a.key)
      return {
        ...a,
        active: !!order,
        orderStatus: order?.status ?? null,
        seats: order?.seats ?? 0,
      }
    })

    return NextResponse.json({ addons, storeReady: true })
  } catch {
    return NextResponse.json({
      addons: CATALOG.map((a) => ({ ...a, active: false, orderStatus: null, seats: 0 })),
      storeReady: false,
    })
  }
}

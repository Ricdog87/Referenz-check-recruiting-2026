import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { company, name, email, website, placementsPerYear } = body

  if (!company || !name || !email || !website || !placementsPerYear) {
    return NextResponse.json({ error: 'Bitte alle Felder ausfüllen.' }, { status: 400 })
  }

  try {
    await prisma.auditLog.create({
      data: {
        action: 'WAITLIST_SIGNUP',
        entity: 'AgencyWaitlist',
        details: JSON.stringify({
          company: String(company).trim(),
          name: String(name).trim(),
          email: String(email).trim().toLowerCase(),
          website: String(website).trim(),
          placementsPerYear: String(placementsPerYear).trim(),
        }),
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Wartelisten-Eintrag konnte nicht gespeichert werden.' }, { status: 503 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (!['ADMIN', 'OWNER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Zugriff nur für Admin/Owner.' }, { status: 403 })
  }

  try {
    const rows = await prisma.auditLog.findMany({
      where: { entity: 'AgencyWaitlist', action: 'WAITLIST_SIGNUP' },
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: { id: true, details: true, createdAt: true },
    })

    const items = rows.map((r) => {
      try {
        return { id: r.id, createdAt: r.createdAt, ...JSON.parse(r.details || '{}') }
      } catch {
        return { id: r.id, createdAt: r.createdAt }
      }
    })

    const format = new URL(req.url).searchParams.get('format')
    if (format === 'csv') {
      const header = ['Zeitpunkt', 'Firma', 'Name', 'E-Mail', 'Website/LinkedIn', 'Placements/Jahr']
      const rowsCsv = items.map((i: any) => [
        new Date(i.createdAt).toISOString(),
        i.company ?? '',
        i.name ?? '',
        i.email ?? '',
        i.website ?? '',
        i.placementsPerYear ?? '',
      ])
      const csv = [header, ...rowsCsv]
        .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="candiq-waitlist-${Date.now()}.csv"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ error: 'Warteliste konnte nicht geladen werden.' }, { status: 503 })
  }
}

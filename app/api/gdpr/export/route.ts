import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

    const [user, candidates, gdprConsents] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, company: true, createdAt: true },
      }),
      prisma.candidate.findMany({
        where: { userId: session.user.id },
        include: {
          documents: { select: { originalName: true, mimeType: true, size: true, createdAt: true } },
          checks: true,
        },
      }),
      prisma.gdprConsent.findMany({
        where: { userId: session.user.id },
        select: { type: true, granted: true, createdAt: true },
      }),
    ])

    const exportData = {
      exportDate: new Date().toISOString(),
      exportedBy: 'RefCheck DSGVO-Datenexport (Art. 20 DSGVO)',
      account: user,
      gdprConsents,
      candidates: candidates.map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        phone: c.phone,
        position: c.position,
        department: c.department,
        status: c.status,
        gdprConsent: c.gdprConsent,
        gdprConsentDate: c.gdprConsentDate,
        createdAt: c.createdAt,
        documents: c.documents,
        referenceChecks: c.checks.map((ch) => ({
          employer: ch.employerName,
          contact: ch.employerContact,
          position: ch.position,
          period: `${ch.startDate || '?'} – ${ch.endDate || 'heute'}`,
          status: ch.status,
          result: ch.result,
          notes: ch.callNotes,
          discrepancies: ch.discrepancies,
        })),
      })),
    }

    const json = JSON.stringify(exportData, null, 2)

    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="refcheck-dsgvo-export-${Date.now()}.json"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Export fehlgeschlagen.' }, { status: 500 })
  }
}

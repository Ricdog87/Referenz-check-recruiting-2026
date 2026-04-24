import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAppSession } from '@/lib/app-session'

export async function GET() {
  const session = await getAppSession()
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, company: true, createdAt: true },
  })

  const candidates = await prisma.candidate.findMany({
    where: { userId: session.user.id },
    include: {
      documents: { select: { originalName: true, mimeType: true, size: true, createdAt: true } },
      checks: true,
    },
  })

  const gdprConsents = await prisma.gdprConsent.findMany({
    where: { userId: session.user.id },
    select: { type: true, granted: true, createdAt: true },
  })

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
}

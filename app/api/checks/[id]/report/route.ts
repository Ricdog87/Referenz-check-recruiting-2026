import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isReviewer } from '@/lib/reviewer'
import { getClientIp } from '@/lib/rate-limit'
import { generateAndDeliverCheckReport } from '@/lib/check-report'

// react-pdf braucht die Node-Runtime; PDF-Rendering kann etwas dauern.
export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/checks/:id/report
 * Erzeugt den PDF-Report (Vercel Blob) und mailt den Link an den HR-Auftraggeber.
 * Zugriff: der HR-Eigentümer der Prüfung ODER ein Reviewer/Admin.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  const check = await prisma.referenceCheck.findUnique({
    where: { id: params.id },
    select: { id: true, candidate: { select: { userId: true } } },
  })
  if (!check) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  const isOwner = check.candidate.userId === session.user.id
  if (!isOwner && !isReviewer(session)) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  try {
    const { url, emailed } = await generateAndDeliverCheckReport(params.id)

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'REPORT_GENERATE',
        entity: 'ReferenceCheck',
        entityId: params.id,
        details: JSON.stringify({ url, emailed }),
        ip: getClientIp(req),
      },
    })

    return NextResponse.json({ ok: true, url, emailed })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Report-Erstellung fehlgeschlagen.' }, { status: 500 })
  }
}


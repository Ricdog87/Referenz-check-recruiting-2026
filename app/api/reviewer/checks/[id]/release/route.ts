import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isReviewer } from '@/lib/reviewer'
import { getClientIp } from '@/lib/rate-limit'
import { generateAndDeliverCheckReport } from '@/lib/check-report'

// react-pdf (im Report) braucht die Node-Runtime.
export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/reviewer/checks/:id/release
 * Freigabe durch geschulten Reviewer: Status -> COMPLETED, Audit-Log,
 * dann automatisch PDF-Report erzeugen (Vercel Blob) + HR-Auftraggeber mailen.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (!isReviewer(session)) return NextResponse.json({ error: 'Reviewer-Rolle erforderlich.' }, { status: 403 })

  const check = await prisma.referenceCheck.findUnique({ where: { id: params.id } })
  if (!check) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })
  if (check.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Prüfung ist bereits freigegeben.' }, { status: 409 })
  }

  const updated = await prisma.referenceCheck.update({
    where: { id: params.id },
    data: { status: 'COMPLETED', calledAt: check.calledAt ?? new Date() },
  })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'REVIEW_RELEASE',
      entity: 'ReferenceCheck',
      entityId: check.id,
      details: JSON.stringify({
        from: check.status,
        to: 'COMPLETED',
        candidateId: check.candidateId,
        rating: check.rating ?? null,
        result: check.result ?? null,
      }),
      ip: getClientIp(req),
    },
  })

  // Auto-Trigger P1.2: PDF erzeugen + an HR mailen. Best-effort — die Freigabe
  // ist bereits persistiert; ein Mail-/PDF-Fehler darf sie nicht zurückrollen.
  let report: { url: string; emailed: boolean } | null = null
  try {
    report = await generateAndDeliverCheckReport(check.id)
  } catch {
    // geschluckt; Report kann manuell über POST /api/checks/:id/report nachgezogen werden.
  }

  return NextResponse.json({ ok: true, status: updated.status, report })
}


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isReviewer } from '@/lib/reviewer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * PATCH /api/reviewer/checks/:id/assign
 *
 * Weist einen Check einem konkreten Reviewer zu (oder hebt die Zuweisung auf).
 * Erlaubt für alle REVIEWER/ADMIN — bewusst kein Admin-only, damit
 * Reviewer Aufgaben untereinander tauschen koennen.
 *
 * Body: { reviewerId: string | null }
 * Antwort: { id, assignedReviewerId, assignedAt }
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !isReviewer(session)) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 403 })
  }

  let body: { reviewerId?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  // null oder leerer String → Zuweisung aufheben
  const targetReviewerId =
    body.reviewerId === null || body.reviewerId === '' ? null : String(body.reviewerId)

  // Validierung: Reviewer muss existieren UND REVIEWER/ADMIN sein.
  if (targetReviewerId) {
    const reviewer = await prisma.user.findUnique({
      where: { id: targetReviewerId },
      select: { id: true, role: true },
    })
    if (!reviewer || (reviewer.role !== 'REVIEWER' && reviewer.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Ziel-User ist kein Reviewer/Admin.' },
        { status: 400 },
      )
    }
  }

  const check = await prisma.referenceCheck.findUnique({
    where: { id: params.id },
    select: { id: true, assignedReviewerId: true },
  })
  if (!check) {
    return NextResponse.json({ error: 'Check nicht gefunden.' }, { status: 404 })
  }

  const updated = await prisma.referenceCheck.update({
    where: { id: params.id },
    data: {
      assignedReviewerId: targetReviewerId,
      assignedAt: targetReviewerId ? new Date() : null,
    },
    select: { id: true, assignedReviewerId: true, assignedAt: true },
  })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: targetReviewerId ? 'REVIEW_ASSIGNED' : 'REVIEW_UNASSIGNED',
      entity: 'ReferenceCheck',
      entityId: params.id,
      details: JSON.stringify({
        from: check.assignedReviewerId,
        to: targetReviewerId,
      }),
    },
  })

  return NextResponse.json(updated)
}

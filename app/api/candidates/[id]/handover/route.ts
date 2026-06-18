import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  assignRoundRobinIfEnabled,
  notifyReviewerHandoff,
  notifyRefereeArt14,
} from '@/lib/check-notifications'
import { logger } from '@/lib/logger'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/candidates/:id/handover
 *
 * Sammeluebergabe: setzt ALLE offenen Pruefungen (OPEN / IN_PROGRESS) eines
 * Kandidaten in einem Schritt auf IN_REVIEW. Statt N Einzelklicks auf N
 * Check-Detailseiten — ein Klick auf der Kandidaten-Seite.
 *
 * Benachrichtigungen:
 *  - EINE zusammengefasste Reviewer-Team-Mail mit allen Referenzen
 *  - pro Referenz eine Art-14-Mail an den Referenzgeber (idempotent)
 *  - optional Round-Robin-Assignment (ASSIGNMENT_AUTO=round_robin)
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  const rl = rateLimit(`handover:${session.user.id}`, 20, 60_000)
  if (!rl.ok) {
    return NextResponse.json({ error: 'Zu viele Anfragen. Bitte kurz warten.' }, { status: 429 })
  }

  // Ownership-gated: nur eigene Kandidaten.
  const candidate = await prisma.candidate.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      user: { select: { id: true, name: true, email: true, company: true } },
      checks: {
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!candidate) return NextResponse.json({ error: 'Kandidat nicht gefunden.' }, { status: 404 })

  if (candidate.checks.length === 0) {
    return NextResponse.json(
      { error: 'Keine offenen Pruefungen zum Uebergeben. Bereits alle im Review oder abgeschlossen.' },
      { status: 400 },
    )
  }

  // DSGVO-Gate: Uebergabe nur mit erteilter Bewerber-Einwilligung.
  if (!candidate.gdprConsent) {
    return NextResponse.json(
      { error: 'Einwilligung des Bewerbers fehlt — Uebergabe an Reviewer nicht moeglich.' },
      { status: 409 },
    )
  }

  const ids = candidate.checks.map((c) => c.id)
  await prisma.referenceCheck.updateMany({
    where: { id: { in: ids } },
    data: { status: 'IN_REVIEW' },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://candiq.de'
  const candidateName = `${candidate.firstName} ${candidate.lastName}`.trim()

  // Side-Effects best-effort: Status ist bereits persistiert, Mail-/Assignment-
  // Fehler duerfen die Antwort nicht crashen.
  ;(async () => {
    // Round-Robin pro Check (jeder Check kann an einen anderen Reviewer gehen).
    // Fuer die Team-Mail nehmen wir den ersten zugewiesenen Reviewer als Hinweis.
    let firstAssigned = null
    for (const c of candidate.checks) {
      const a = await assignRoundRobinIfEnabled(c.id, null)
      if (a && !firstAssigned) firstAssigned = a
    }

    await notifyReviewerHandoff({
      customer: candidate.user,
      candidateName,
      checks: candidate.checks.map((c) => ({
        candidatePosition: candidate.position,
        employerName: c.employerName,
        employerContact: c.employerContact ?? '—',
        employerPhone: c.employerPhone,
        employerEmail: c.employerEmail,
        reviewerCheckUrl: `${baseUrl}/reviewer/check/${c.id}`,
      })),
      assignedReviewer: firstAssigned,
    })

    // Art. 14 pro Referenzgeber mit E-Mail.
    for (const c of candidate.checks) {
      if (!c.employerEmail) continue
      await notifyRefereeArt14({
        checkId: c.id,
        refereeName: c.employerContact ?? 'Sehr geehrte Damen und Herren',
        refereeCompany: c.employerName,
        refereeEmail: c.employerEmail,
        candidateName,
        candidatePosition: candidate.position,
        hiringCompany: candidate.user.company ?? candidate.user.name ?? 'der Auftraggeber',
        triggeredByUserId: session.user.id,
      })
    }
  })().catch((err) => logger.warn('batch_handover_side_effect_failed', err))

  await prisma.auditLog
    .create({
      data: {
        userId: session.user.id,
        action: 'BATCH_HANDOVER',
        entity: 'Candidate',
        entityId: candidate.id,
        details: JSON.stringify({ checkCount: ids.length, checkIds: ids }),
      },
    })
    .catch(() => {})

  return NextResponse.json({ ok: true, handed: ids.length })
}

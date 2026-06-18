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
 *
 * Freigabe durch geschulten Reviewer: Status -> COMPLETED, Audit-Log,
 * dann automatisch PDF-Report erzeugen (Vercel Blob) + HR-Auftraggeber mailen.
 *
 * Pflicht-Body: { aggConfirmed: true } — § 11 AGG verlangt dokumentierte
 * Bestaetigung, dass die Bewertung ohne diskriminierende Merkmale erfolgte.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (!isReviewer(session)) return NextResponse.json({ error: 'Reviewer-Rolle erforderlich.' }, { status: 403 })

  // AGG-Pflichtfeld parsen. Defensive: leerer/ungueltiger Body wird als
  // „nicht bestaetigt" gewertet — Release blockt, statt still durchzulassen.
  let body: { aggConfirmed?: boolean } = {}
  try {
    const text = await req.text()
    if (text) body = JSON.parse(text)
  } catch {
    /* unparseable body → aggConfirmed bleibt undefined → blockt */
  }
  if (body.aggConfirmed !== true) {
    return NextResponse.json(
      {
        error:
          'AGG-Bestaetigung erforderlich: Die Bewertung muss explizit als diskriminierungsfrei bestaetigt werden (§ 1 AGG).',
      },
      { status: 400 },
    )
  }

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
        // AGG-Nachweis (§ 11 AGG): explizit dokumentiert, dass diese Bewertung
        // diskriminierungsfrei erfolgte. Wert kommt aus dem Reviewer-UI und
        // wird hier strikt validiert (oben).
        aggConfirmed: true,
        aggConfirmedBy: session.user.id,
        aggConfirmedAt: new Date().toISOString(),
        criteriaScope: ['position', 'tenure', 'tasks', 'work_behavior'],
        excludedScope: [
          'photo',
          'origin',
          'religion',
          'gender',
          'age',
          'sexual_identity',
          'disability',
          'health',
        ],
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


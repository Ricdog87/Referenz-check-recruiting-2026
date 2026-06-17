import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isReviewer } from '@/lib/reviewer'
import { hasCvAccess, type CvAccessActor } from '@/lib/cv-gate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/documents/:id
 *
 * Server-seitiger CV-Consent-Gate. Liefert KEIN File direkt aus; redirected
 * (302) zum Vercel-Blob, wenn der Aufrufer berechtigt ist.
 *
 * Wichtig: Reviewer bekommen 403, wenn cvStatus !== RELEASED. HR-Owner
 * duerfen eigene Uploads jederzeit sehen (eigene Daten). Public → 401.
 *
 * Jede Anfrage wird auditiert (CV_ACCESS_GRANTED / CV_ACCESS_DENIED),
 * unabhaengig vom Ergebnis.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  const doc = await prisma.document.findUnique({
    where: { id: params.id },
    include: { candidate: { select: { userId: true } } },
  })
  if (!doc) {
    return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })
  }

  // Actor-Bestimmung: Wenn Reviewer ZUFAELLIG auch HR-Owner ist
  // (z.B. ADMIN, der selbst Kandidaten in eigenem Workspace hat), bevorzugen
  // wir Owner-Pfad — der ist guenstiger und korrekt (eigene Daten).
  const isOwner = doc.candidate?.userId === session.user.id
  const actor: CvAccessActor = isOwner
    ? { kind: 'owner', userId: session.user.id }
    : isReviewer(session)
    ? { kind: 'reviewer' }
    : { kind: 'public' }

  const gate = hasCvAccess(doc, actor)

  // Audit jede Anfrage — auch denied → forensisch wichtig bei DSGVO-Klagen.
  await prisma.auditLog
    .create({
      data: {
        userId: session.user.id,
        action: gate.allowed ? 'CV_ACCESS_GRANTED' : 'CV_ACCESS_DENIED',
        entity: 'Document',
        entityId: doc.id,
        details: JSON.stringify({
          actor: actor.kind,
          docType: doc.type,
          cvStatus: doc.cvStatus,
          reason: gate.allowed ? null : gate.reason,
        }),
      },
    })
    .catch(() => {})

  if (!gate.allowed) {
    return NextResponse.json(
      {
        error: 'Zugriff verweigert: Einwilligung des Bewerbers fehlt.',
        reason: gate.reason,
      },
      { status: 403 },
    )
  }

  return NextResponse.redirect(doc.path, { status: 302 })
}

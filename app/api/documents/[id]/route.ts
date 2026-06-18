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
 * Server-seitiger CV-Consent-Gate + Storage-Proxy. Streamt den Inhalt
 * direkt durch — die Vercel-Blob-URL wird NICHT an den Client geleakt
 * (kein 302-Redirect mehr). Damit ist die Datei nur ueber diese Route
 * mit gueltiger Session + Gate-Check erreichbar.
 *
 * Reviewer brauchen cvStatus=RELEASED. HR-Owner sehen eigene Uploads
 * jederzeit. Public/anonym → 401.
 *
 * Jede Anfrage auditiert (CV_ACCESS_GRANTED / CV_ACCESS_DENIED).
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

  const isOwner = doc.candidate?.userId === session.user.id
  const actor: CvAccessActor = isOwner
    ? { kind: 'owner', userId: session.user.id }
    : isReviewer(session)
    ? { kind: 'reviewer' }
    : { kind: 'public' }

  const gate = hasCvAccess(doc, actor)

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

  // STREAMING-PROXY statt Redirect:
  // Wir holen die Datei serverseitig von Vercel Blob und streamen sie zum
  // Client zurueck. Die Blob-URL wird NIE im Browser/Response gezeigt
  // (keine Location-Header), damit niemand die URL abgreifen + spaeter
  // ohne Auth abrufen kann.
  const upstream = await fetch(doc.path)
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: 'Storage-Fehler.' }, { status: 502 })
  }

  // ?download=1 erzwingt Attachment-Disposition (statt Inline-Preview).
  const wantsAttachment = new URL(req.url).searchParams.get('download') === '1'
  const disposition = wantsAttachment ? 'attachment' : 'inline'
  const safeName = encodeURIComponent(doc.originalName)

  const headers = new Headers()
  headers.set(
    'Content-Type',
    upstream.headers.get('content-type') ?? doc.mimeType ?? 'application/octet-stream',
  )
  const len = upstream.headers.get('content-length')
  if (len) headers.set('Content-Length', len)
  headers.set('Content-Disposition', `${disposition}; filename="${safeName}"`)
  headers.set('Cache-Control', 'private, no-store, max-age=0')
  headers.set('X-Content-Type-Options', 'nosniff')

  return new NextResponse(upstream.body, { status: 200, headers })
}

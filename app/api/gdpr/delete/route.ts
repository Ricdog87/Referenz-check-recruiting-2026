import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { deleteBlobUrls, deleteBlobsByPrefix } from '@/lib/blob-cleanup'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Art.-17-Löschung des eigenen Accounts (User-getriggert).
 *
 * R2-Fix: Zuvor löschte diese Route `public/uploads/{userId}` vom LOKALEN
 * Filesystem — dort liegt seit der Vercel-Blob-Umstellung nichts. Die
 * eigentlichen CV-/Zeugnis-Dateien und Report-PDFs im Blob-Store blieben
 * liegen. Jetzt werden vor dem DB-Cascade-Delete alle Blob-Referenzen des
 * Users eingesammelt und nach dem erfolgreichen DB-Delete tatsächlich
 * aus dem Blob-Store entfernt.
 */
export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  const userId = session.user.id

  // 1) Blob-Referenzen des Users sammeln, SOLANGE die Zeilen noch existieren.
  //    Documents hängen an Candidate.userId; Report-PDFs an ReferenceCheck.id.
  let docPaths: string[] = []
  let checkIds: string[] = []
  try {
    const [docs, checks] = await Promise.all([
      prisma.document.findMany({
        where: { candidate: { userId } },
        select: { path: true },
      }),
      prisma.referenceCheck.findMany({
        where: { candidate: { userId } },
        select: { id: true },
      }),
    ])
    docPaths = docs.map((d) => d.path)
    checkIds = checks.map((c) => c.id)
  } catch (err) {
    logger.warn('gdpr_delete_collect_warn', { userId, err: err instanceof Error ? err.message : String(err) })
    // Kein harter Abbruch — die DB-Löschung ist der rechtlich zwingende Teil.
  }

  // 2) DB-Cascade-Delete (rechtlich verpflichtender Kern) zuerst.
  try {
    await prisma.user.delete({ where: { id: userId } })
  } catch (err) {
    logger.error('gdpr_delete_user_error', { userId, err: err instanceof Error ? err.message : String(err) })
    return NextResponse.json(
      { error: 'Löschung fehlgeschlagen. Bitte erneut versuchen oder hello@candiq.de kontaktieren.' },
      { status: 503 },
    )
  }

  // 3) NACH erfolgreichem DB-Delete: Blob-Objekte entfernen (best-effort).
  const docBlobs = await deleteBlobUrls(docPaths)
  let reportDeleted = 0
  let reportFailed = 0
  for (const checkId of checkIds) {
    const r = await deleteBlobsByPrefix(`reports/${checkId}/`)
    reportDeleted += r.deleted
    reportFailed += r.failed
  }
  const blobsDeleted = docBlobs.deleted + reportDeleted
  const blobsFailed = docBlobs.failed + reportFailed

  // 4) Audit-Beleg der Löschung (ohne User-Zeile — separater System-Eintrag).
  await prisma.auditLog
    .create({
      data: {
        action: 'GDPR_ACCOUNT_DELETED',
        entity: 'User',
        entityId: userId,
        details: `documents=${docPaths.length} checks=${checkIds.length} blobsDeleted=${blobsDeleted} blobsFailed=${blobsFailed}`,
      },
    })
    .catch(() => {})

  if (blobsFailed > 0) {
    logger.error('gdpr_delete_blob_partial', { userId, blobsDeleted, blobsFailed })
  }

  return NextResponse.json({ ok: true, blobsDeleted, blobsFailed })
}

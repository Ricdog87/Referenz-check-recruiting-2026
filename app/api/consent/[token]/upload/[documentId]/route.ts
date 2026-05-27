import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { loadConsentByToken } from '@/lib/consent-token'
import { rateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { del } from '@vercel/blob'

/**
 * DELETE /api/consent/:token/upload/:documentId
 * Bewerber kann hochgeladenes Dokument wieder entfernen (solange noch PENDING_ACCEPT).
 * Löscht aus Blob Storage + DB.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { token: string; documentId: string } }
) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'

  const rl = rateLimit(`consent_upload_del:${ip}`, 10, 60_000)
  if (!rl.ok) {
    return NextResponse.json({ error: 'Zu viele Anfragen.' }, { status: 429 })
  }

  let record: Awaited<ReturnType<typeof loadConsentByToken>>
  try {
    record = await loadConsentByToken(decodeURIComponent(params.token))
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Token ungültig.' }, { status: 410 })
  }

  if (record.status !== 'PENDING_ACCEPT') {
    return NextResponse.json(
      { error: 'Löschen nicht mehr möglich (Einwilligung bereits abgeschlossen).' },
      { status: 409 }
    )
  }

  const doc = await prisma.document.findFirst({
    where: { id: params.documentId, candidateId: record.candidateId },
  })
  if (!doc) {
    return NextResponse.json({ error: 'Dokument nicht gefunden.' }, { status: 404 })
  }

  try {
    await del(doc.path).catch((e) => logger.warn('blob_del_failed', e))
    await prisma.document.delete({ where: { id: doc.id } })

    await prisma.auditLog.create({
      data: {
        userId: null,
        action: 'CANDIDATE_DOCUMENT_DELETE',
        entity: 'Document',
        entityId: doc.id,
        ip,
        details: `candidate=${record.candidateId} originalName=${doc.originalName}`,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    logger.error('candidate_upload_delete_failed', err)
    return NextResponse.json({ error: 'Löschen fehlgeschlagen.' }, { status: 500 })
  }
}

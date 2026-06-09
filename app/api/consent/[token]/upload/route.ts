import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { loadConsentByToken } from '@/lib/consent-token'
import { rateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { put } from '@vercel/blob'
import { extname } from 'path'
import { randomUUID } from 'crypto'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]
const MAX_SIZE = 4 * 1024 * 1024 // 4 MB (Vercel serverless limit)
const MAX_FILES_PER_TOKEN = 8

/**
 * POST /api/consent/:token/upload
 * Public route — Bewerber lädt selbst CV/Zeugnisse hoch.
 * Token-secured: Upload nur möglich solange ConsentToken active (PENDING_ACCEPT)
 * und Token nicht expired/revoked.
 *
 * Nach Accept werden Documents persistiert; bei Revoke werden sie via
 * cascade-delete des Candidate entfernt (siehe Prisma schema).
 */
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'

  // Rate-Limit: 5 Uploads/Min pro IP
  const rl = rateLimit(`consent_upload:${ip}`, 5, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Zu viele Uploads. Bitte ${Math.ceil(rl.retryAfter / 1000)}s warten.` },
      { status: 429 }
    )
  }

  let record: Awaited<ReturnType<typeof loadConsentByToken>>
  try {
    record = await loadConsentByToken(decodeURIComponent(params.token))
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Token ungültig.' }, { status: 410 })
  }

  // Upload nur in PENDING_ACCEPT erlaubt (nach Accept sind Daten finalisiert)
  if (record.status !== 'PENDING_ACCEPT') {
    return NextResponse.json(
      { error: 'Upload nicht mehr möglich (Einwilligung bereits abgeschlossen oder widerrufen).' },
      { status: 409 }
    )
  }

  // Anzahl-Limit pro Token (verhindert Spam)
  const existing = await prisma.document.count({ where: { candidateId: record.candidateId } })
  if (existing >= MAX_FILES_PER_TOKEN) {
    return NextResponse.json(
      { error: `Maximal ${MAX_FILES_PER_TOKEN} Dateien pro Bewerbung.` },
      { status: 400 }
    )
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const type = String(formData.get('type') ?? 'CV').slice(0, 20)

  if (!file) {
    return NextResponse.json({ error: 'Keine Datei übergeben.' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Dateityp nicht erlaubt. Erlaubt: PDF, DOC, DOCX, JPG, PNG.' },
      { status: 400 }
    )
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Datei zu groß (max. 4 MB).' }, { status: 400 })
  }

  const ext = extname(file.name) || '.bin'
  const blobPath = `candidates/${record.candidateId}/${randomUUID()}${ext}`

  try {
    const blob = await put(blobPath, file, {
      access: 'public',
      addRandomSuffix: false,
      contentType: file.type,
    })

    const doc = await prisma.document.create({
      data: {
        name: blobPath,
        originalName: file.name.slice(0, 200),
        mimeType: file.type,
        size: file.size,
        path: blob.url,
        type,
        candidateId: record.candidateId,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: null,
        action: 'CANDIDATE_DOCUMENT_UPLOAD',
        entity: 'Document',
        entityId: doc.id,
        ip,
        details: `candidate=${record.candidateId} type=${type} mime=${file.type} size=${file.size}`,
      },
    })

    logger.info('candidate_upload', { documentId: doc.id, candidateId: record.candidateId, size: file.size })

    return NextResponse.json({
      ok: true,
      document: {
        id: doc.id,
        originalName: doc.originalName,
        size: doc.size,
        type: doc.type,
      },
    })
  } catch (err: any) {
    logger.error('candidate_upload_failed', err)
    return NextResponse.json({ error: 'Upload fehlgeschlagen.' }, { status: 500 })
  }
}

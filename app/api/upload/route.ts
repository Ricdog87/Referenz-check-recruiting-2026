import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { put } from '@vercel/blob'
import { extname } from 'path'
import { randomUUID } from 'crypto'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { CV_STATUS } from '@/lib/cv-gate'
import { inviteCandidate } from '@/lib/consent-invite'
import { logger } from '@/lib/logger'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]
const MAX_SIZE = 4 * 1024 * 1024 // 4 MB (Vercel serverless limit)
const VALID_DOC_TYPES = new Set(['CV', 'CERTIFICATE', 'REFERENCE', 'OTHER'])

const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'image/jpeg': '.jpg',
  'image/png': '.png',
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  const ip = getClientIp(req)
  const rl = rateLimit(`upload:${session.user.id}:${ip}`, 30, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Upload-Limit erreicht. Bitte in ${Math.ceil(rl.retryAfter / 60)} Minuten erneut versuchen.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const candidateId = formData.get('candidateId') as string
  const rawType = String(formData.get('type') ?? 'CV').trim().toUpperCase()
  const type = VALID_DOC_TYPES.has(rawType) ? rawType : 'CV'

  if (!file || !candidateId) {
    return NextResponse.json({ error: 'Datei und Kandidaten-ID erforderlich.' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Dateityp nicht erlaubt. Erlaubt: PDF, DOC, DOCX, JPG, PNG' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Datei zu groß (max. 4 MB).' }, { status: 400 })
  }

  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, userId: session.user.id },
  })
  if (!candidate) return NextResponse.json({ error: 'Kandidat nicht gefunden.' }, { status: 404 })

  const ext = MIME_TO_EXT[file.type] ?? extname(file.name) ?? '.bin'
  const blobPath = `candidates/${session.user.id}/${candidateId}/${randomUUID()}${ext}`

  const blob = await put(blobPath, file, {
    access: 'public',
    addRandomSuffix: false,
    contentType: file.type,
  })

  // Consent-Gate: ein frisch hochgeladener CV startet IMMER in AWAITING_CONSENT.
  // Bereits eingewilligte Bewerber → wir releasen direkt nach dem Insert.
  // Noch nicht eingewilligte → Auto-Invite per Magic-Link.
  const doc = await prisma.document.create({
    data: {
      name: blobPath,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      path: blob.url,
      type,
      candidateId,
      // cvStatus defaultet auf AWAITING_CONSENT (siehe schema.prisma).
      // Andere Typen (CERTIFICATE etc.) sind nicht vom CV-Gate erfasst,
      // bleiben aber im selben Feld – sie werden vom Gate ignoriert.
    },
  })

  if (type === 'CV') {
    // 1) Wenn der Bewerber bereits ACCEPTED-Consent hat: sofort releasen.
    const accepted = await prisma.consentToken.findFirst({
      where: { candidateId, status: 'ACCEPTED' },
      orderBy: { acceptedAt: 'desc' },
      select: { id: true },
    })
    if (accepted) {
      await prisma.document.update({
        where: { id: doc.id },
        data: { cvStatus: CV_STATUS.RELEASED, releasedAt: new Date() },
      })
      doc.cvStatus = CV_STATUS.RELEASED
    } else {
      // 2) Keine ACCEPTED-Consent → pruefen, ob schon ein PENDING-Invite
      // existiert. Wenn nein, Magic-Link automatisch ausloesen (best-effort,
      // Mail-Fehler crashen den Upload nicht).
      const pending = await prisma.consentToken.findFirst({
        where: { candidateId, status: 'PENDING_ACCEPT' },
        select: { id: true },
      })
      if (!pending) {
        inviteCandidate({
          candidateId,
          triggeredByUserId: session.user.id,
          ip,
        }).catch((err) =>
          logger.warn('auto_consent_invite_after_upload_failed', err),
        )
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CV_UPLOADED_BY_HR',
        entity: 'Document',
        entityId: doc.id,
        ip,
        details: JSON.stringify({
          candidateId,
          consentPath: accepted ? 'auto_release' : 'awaiting_consent',
        }),
      },
    }).catch(() => {})
  }

  // Bewusst KEIN `path` (Vercel-Blob-URL) im Response — der Client
  // erfaehrt die Storage-URL nie direkt. Downloads laufen ausschliesslich
  // ueber /api/documents/:id mit Consent-Gate.
  return NextResponse.json(
    {
      id: doc.id,
      name: doc.name,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      size: doc.size,
      type: doc.type,
      cvStatus: doc.cvStatus,
      candidateId: doc.candidateId,
      createdAt: doc.createdAt,
      downloadUrl: `/api/documents/${doc.id}`,
    },
    { status: 201 },
  )
}

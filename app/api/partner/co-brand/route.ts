import { NextRequest, NextResponse } from 'next/server'
import { put, del } from '@vercel/blob'
import { randomUUID } from 'crypto'
import { extname } from 'path'
import { prisma } from '@/lib/db'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { isPartnerProgramEnabled } from '@/lib/flags'
import { getPartnerSession } from '@/lib/partner/session'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024 // 2 MB — Logos brauchen nicht mehr

const MIME_TO_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/svg+xml': '.svg',
  'image/webp': '.webp',
}

/**
 * POST /api/partner/co-brand   → Logo hochladen (multipart)
 * DELETE /api/partner/co-brand → Logo entfernen
 *
 * Co-Brand-Constraint: das candiq-Siegel bleibt PFLICHTBESTANDTEIL auf
 * Reports und kann durch das Partner-Logo NICHT ersetzt werden — diese
 * Route speichert nur das Partner-Logo, sie ändert keine Render-Logik.
 */
export async function POST(req: NextRequest) {
  if (!isPartnerProgramEnabled()) return new NextResponse('Not Found', { status: 404 })

  const session = await getPartnerSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 401 })
  if (session.status !== 'APPROVED') return NextResponse.json({ error: 'Account not approved' }, { status: 403 })

  const ip = getClientIp(req)
  const rl = rateLimit(`partner-logo:${session.id}:${ip}`, 10, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Upload-Limit erreicht. Bitte in ${Math.ceil(rl.retryAfter / 60)} Minuten erneut versuchen.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Logo-Upload aktuell nicht verfügbar (Blob-Storage nicht konfiguriert).' },
      { status: 503 },
    )
  }

  const formData = await req.formData().catch(() => null)
  const file = formData?.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'Datei erforderlich.' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Format nicht erlaubt. Erlaubt: PNG, JPG, SVG, WEBP.' },
      { status: 400 },
    )
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Datei zu groß (max. 2 MB).' }, { status: 400 })
  }

  // Existierendes Logo merken — wir löschen es NACH erfolgreichem Upload
  const existing = await prisma.partnerAccount.findUnique({
    where: { id: session.id },
    select: { logoUrl: true },
  })

  const ext = MIME_TO_EXT[file.type] ?? extname(file.name ?? '') ?? ''
  const blobKey = `partner-logos/${session.id}/${randomUUID()}${ext}`

  let url: string
  try {
    const result = await put(blobKey, file, { access: 'public', contentType: file.type })
    url = result.url
  } catch (err) {
    logger.error('partner_logo_blob_error', err)
    return NextResponse.json({ error: 'Upload fehlgeschlagen.' }, { status: 500 })
  }

  try {
    await prisma.partnerAccount.update({
      where: { id: session.id },
      data: { logoUrl: url },
    })
  } catch (err) {
    logger.error('partner_logo_db_error', err)
    // Best-effort: Logo-Blob wieder entfernen
    del(url).catch(() => {})
    return NextResponse.json({ error: 'Logo konnte nicht gespeichert werden.' }, { status: 500 })
  }

  // Alten Blob entfernen (best-effort)
  if (existing?.logoUrl && existing.logoUrl !== url) {
    del(existing.logoUrl).catch((err) => logger.warn('partner_logo_old_del_warn', err))
  }

  prisma.partnerAuditLog
    .create({
      data: {
        partnerAccountId: session.id,
        action: 'PARTNER_LOGO_UPLOAD',
        entity: 'PartnerAccount',
        entityId: session.id,
      },
    })
    .catch((err) => logger.warn('partner_logo_audit_warn', err))

  return NextResponse.json({ logoUrl: url })
}

export async function DELETE() {
  if (!isPartnerProgramEnabled()) return new NextResponse('Not Found', { status: 404 })

  const session = await getPartnerSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 401 })
  if (session.status !== 'APPROVED') return NextResponse.json({ error: 'Account not approved' }, { status: 403 })

  const existing = await prisma.partnerAccount.findUnique({
    where: { id: session.id },
    select: { logoUrl: true },
  })

  await prisma.partnerAccount.update({
    where: { id: session.id },
    data: { logoUrl: null },
  })

  if (existing?.logoUrl) {
    del(existing.logoUrl).catch((err) => logger.warn('partner_logo_del_warn', err))
  }

  prisma.partnerAuditLog
    .create({
      data: {
        partnerAccountId: session.id,
        action: 'PARTNER_LOGO_REMOVE',
        entity: 'PartnerAccount',
        entityId: session.id,
      },
    })
    .catch((err) => logger.warn('partner_logo_audit_warn', err))

  return NextResponse.json({ ok: true })
}

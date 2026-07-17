import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isZvooveEnabled } from '@/lib/flags'
import { isZvooveDemoMode } from '@/lib/integrations/zvoove/sync'
import { HttpZvooveClient } from '@/lib/integrations/zvoove/client'
import { encryptSecret, fingerprintSecret } from '@/lib/crypto/aes-gcm'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/integrations/zvoove/connect  { baseUrl, apiKey }
 * Validiert die Verbindung, verschlüsselt den API-Key (AES-256-GCM) und
 * speichert die Connection. Klartext-Key wird NIE persistiert oder geloggt.
 * Im Demo-Modus nicht nötig (Mock-Gegenstelle).
 */
export async function POST(req: NextRequest) {
  if (!isZvooveEnabled()) return new NextResponse('Not Found', { status: 404 })

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  if (isZvooveDemoMode()) {
    return NextResponse.json(
      { ok: true, demo: true, message: 'Demo-Modus aktiv — keine echte Verbindung nötig.' },
    )
  }

  let body: any = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }
  const baseUrl = typeof body?.baseUrl === 'string' ? body.baseUrl.trim().replace(/\/$/, '') : ''
  const apiKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : ''
  if (!/^https:\/\/.+/.test(baseUrl) || !apiKey) {
    return NextResponse.json({ error: 'baseUrl (https) und apiKey erforderlich.' }, { status: 400 })
  }

  // Vor dem Speichern validieren.
  let validation: { ok: boolean; status?: number; reason?: string }
  try {
    const client = new HttpZvooveClient({ baseUrl, apiKey })
    validation = await client.validateConnection()
  } catch (err: any) {
    logger.warn('zvoove_connect_validation_error', { message: err?.message })
    validation = { ok: false, reason: 'validation_error' }
  }
  if (!validation.ok) {
    return NextResponse.json(
      { error: 'Verbindung fehlgeschlagen — Base-URL/API-Key prüfen.', reason: validation.reason },
      { status: 502 },
    )
  }

  let apiKeyEnc: string
  try {
    apiKeyEnc = encryptSecret(apiKey)
  } catch (err: any) {
    // Fehlender INTEGRATION_ENC_KEY → keine Plain-Speicherung, harter Fehler.
    logger.error('zvoove_connect_no_enc_key')
    return NextResponse.json({ error: 'Server-Konfiguration unvollständig (Verschlüsselung).' }, { status: 500 })
  }

  const workspaceId = session.user.id
  await prisma.zvooveConnection.upsert({
    where: { workspaceId },
    update: { baseUrl, apiKeyEnc, apiKeyFp: fingerprintSecret(apiKey), status: 'ACTIVE', lastError: null, lastValidated: new Date() },
    create: { workspaceId, baseUrl, apiKeyEnc, apiKeyFp: fingerprintSecret(apiKey), status: 'ACTIVE', lastValidated: new Date() },
  })

  await prisma.zvooveSyncLog.create({
    data: { workspaceId, action: 'validate_connection', status: 'OK', details: `host=${new URL(baseUrl).host}` },
  })

  return NextResponse.json({ ok: true, fingerprint: fingerprintSecret(apiKey) })
}

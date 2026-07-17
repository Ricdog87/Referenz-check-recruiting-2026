import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isZvooveEnabled } from '@/lib/flags'
import { getZvooveClientForWorkspace, pushZvooveResult } from '@/lib/integrations/zvoove/sync'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/integrations/zvoove/push-result  { checkId }
 * Schreibt das Ergebnis eines abgeschlossenen, zvoove-verknüpften Checks
 * zurück nach zvoove (bzw. an den Mock im Demo-Modus).
 */
export async function POST(req: NextRequest) {
  if (!isZvooveEnabled()) return new NextResponse('Not Found', { status: 404 })

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  let body: any = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }
  const checkId = typeof body?.checkId === 'string' ? body.checkId : ''
  if (!checkId) return NextResponse.json({ error: 'checkId fehlt.' }, { status: 400 })

  const workspaceId = session.user.id
  const client = await getZvooveClientForWorkspace(workspaceId)
  if (!client) {
    return NextResponse.json({ error: 'Keine zvoove-Verbindung.' }, { status: 400 })
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`
  try {
    const result = await pushZvooveResult({ workspaceId, checkId, client, baseUrl })
    if (!result.ok) {
      const status = result.reason === 'not_found' ? 404 : 409
      return NextResponse.json({ error: result.reason }, { status })
    }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    logger.error('zvoove_push_error', { workspaceId, message: err?.message })
    return NextResponse.json({ error: 'Rückschreiben fehlgeschlagen.' }, { status: 500 })
  }
}

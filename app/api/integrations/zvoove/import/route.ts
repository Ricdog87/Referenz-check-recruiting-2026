import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isZvooveEnabled } from '@/lib/flags'
import { getZvooveClientForWorkspace, importZvooveCandidates, isZvooveDemoMode } from '@/lib/integrations/zvoove/sync'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/integrations/zvoove/import
 * Importiert die zur Prüfung markierten Bewerber des Workspaces aus zvoove
 * (bzw. dem Mock im Demo-Modus). Flag-gated + Session-gebunden.
 */
export async function POST() {
  if (!isZvooveEnabled()) return new NextResponse('Not Found', { status: 404 })

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  const workspaceId = session.user.id
  const client = await getZvooveClientForWorkspace(workspaceId)
  if (!client) {
    return NextResponse.json(
      { error: 'Keine zvoove-Verbindung. Bitte zuerst verbinden.' },
      { status: 400 },
    )
  }

  try {
    const result = await importZvooveCandidates({ workspaceId, client })
    logger.info('zvoove_import_ok', { workspaceId, demo: isZvooveDemoMode(), ...result, candidateIds: undefined })
    return NextResponse.json({
      ok: true,
      demo: isZvooveDemoMode(),
      imported: result.imported,
      skipped: result.skipped,
      failed: result.failed,
    })
  } catch (err: any) {
    logger.error('zvoove_import_error', { workspaceId, message: err?.message })
    return NextResponse.json({ error: 'Import fehlgeschlagen.' }, { status: 500 })
  }
}

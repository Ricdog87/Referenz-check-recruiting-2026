/**
 * Monatlicher Tier-Sync für das Partner-Programm.
 *
 * Vercel-Cron-Pattern (vercel.json):
 *   { "path": "/api/cron/partner-tier-sync", "schedule": "0 3 1 * *" }
 *
 * Sicherheits-Pattern wie alle anderen Cron-Routen (vgl. /api/cron/cleanup):
 *   - Auth via Bearer-Token gegen CRON_SECRET
 *   - 401 ohne validen Header
 *   - Flag-Gate: PARTNER_PROGRAM_ENABLED=false → 404
 */

import { NextRequest, NextResponse } from 'next/server'
import { syncAllPartnerTiers } from '@/lib/partner/tier-sync'
import { isPartnerProgramEnabled } from '@/lib/flags'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

function unauthorized() {
  return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      'WWW-Authenticate': 'Bearer realm="cron"',
    },
  })
}

async function run(req: NextRequest) {
  if (!isPartnerProgramEnabled()) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    logger.error('partner_tier_sync_no_secret')
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured on the server' },
      { status: 500 },
    )
  }

  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token || token !== cronSecret) return unauthorized()

  try {
    const result = await syncAllPartnerTiers()
    logger.info('partner_tier_sync_ok', result)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    logger.error('partner_tier_sync_error', err)
    return NextResponse.json({ ok: false, error: 'Sync failed' }, { status: 500 })
  }
}

export { run as GET, run as POST }

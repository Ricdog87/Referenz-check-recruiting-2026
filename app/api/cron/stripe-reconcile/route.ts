import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { reconcileSubscriptions } from '@/lib/stripe-reconcile'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Täglicher Stripe-Reconciliation-Cron (G6).
 *
 * Fängt verpasste Webhooks ab: gleicht jede User-Subscription gegen den
 * Stripe-IST-Zustand ab und korrigiert Drift. Schreibt IMMER einen
 * AuditLog-Beleg (auch bei 0 Drift), damit der Lauf nachweisbar ist.
 *
 * Auth: Bearer-Token gegen CRON_SECRET (identisch zu /api/cron/cleanup).
 */

function unauthorized() {
  return new NextResponse(JSON.stringify({ error: 'unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json', 'WWW-Authenticate': 'Bearer realm="cron"' },
  })
}

async function handle(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    logger.error('cron_reconcile_no_secret_configured')
    return NextResponse.json({ error: 'CRON_SECRET is not configured on the server' }, { status: 500 })
  }
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token || token !== cronSecret) return unauthorized()

  try {
    const result = await reconcileSubscriptions()

    await prisma.auditLog.create({
      data: {
        action: 'STRIPE_RECONCILE',
        entity: 'System',
        entityId: null,
        details: `checked=${result.checked} drifted=${result.drifted} errors=${result.errors}`,
      },
    })

    logger.info('cron_reconcile_ok', {
      checked: result.checked,
      drifted: result.drifted,
      errors: result.errors,
    })
    // Keine User-IDs nach außen — nur Aggregat.
    return NextResponse.json({
      ok: true,
      checked: result.checked,
      drifted: result.drifted,
      errors: result.errors,
    })
  } catch (err: any) {
    logger.error('cron_reconcile_error', err)
    return NextResponse.json(
      { error: 'Reconcile failed', message: err?.message ?? 'unknown' },
      { status: 500 },
    )
  }
}

export const GET = handle
export const POST = handle

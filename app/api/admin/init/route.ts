import { NextRequest, NextResponse } from 'next/server'
import { runSchemaSync } from '@/lib/db-init'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * Manual schema-sync trigger. Adds any missing columns/tables that should
 * be on production but might be out of sync because `prisma db push` failed
 * during the build.
 *
 * Protected by INIT_SECRET env var. Call as:
 *   GET /api/admin/init?secret=YOUR_SECRET
 */
export async function GET(req: NextRequest) {
  const querySecret = req.nextUrl.searchParams.get('secret')
  const headerSecret = req.headers.get('x-init-secret')
  const bearerToken = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  const presentedSecret = headerSecret || bearerToken || querySecret

  if (!process.env.INIT_SECRET || presentedSecret !== process.env.INIT_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    await runSchemaSync()
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('init_error', error)
    return NextResponse.json({ error: 'init failed' }, { status: 500 })
  }
}

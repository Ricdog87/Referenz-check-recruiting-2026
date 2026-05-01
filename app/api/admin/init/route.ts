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
  const secret = req.nextUrl.searchParams.get('secret')
  if (!process.env.INIT_SECRET || secret !== process.env.INIT_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    await runSchemaSync()
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('init_error', error)
    return NextResponse.json(
      { error: error?.message ?? 'init failed' },
      { status: 500 },
    )
  }
}

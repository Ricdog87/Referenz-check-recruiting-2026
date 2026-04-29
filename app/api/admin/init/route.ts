import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * Manual schema-sync fallback. Adds any missing columns/tables that should
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

  const log: string[] = []
  try {
    // Add columns to User if missing (idempotent)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User"
        ADD COLUMN IF NOT EXISTS "accountType" TEXT NOT NULL DEFAULT 'HR_DEPARTMENT',
        ADD COLUMN IF NOT EXISTS "plan" TEXT NOT NULL DEFAULT 'STARTER',
        ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3)
    `)
    log.push('User columns synced')

    // Create AddonOrder table if missing
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AddonOrder" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "sku" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "unitPrice" INTEGER NOT NULL,
        "totalAmount" INTEGER NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "AddonOrder_pkey" PRIMARY KEY ("id")
      )
    `)
    log.push('AddonOrder table synced')

    // Add FK + index for AddonOrder.userId
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'AddonOrder_userId_fkey'
        ) THEN
          ALTER TABLE "AddonOrder" ADD CONSTRAINT "AddonOrder_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$
    `)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AddonOrder_userId_idx" ON "AddonOrder"("userId")`)
    log.push('AddonOrder constraints synced')

    return NextResponse.json({ ok: true, log })
  } catch (error: any) {
    console.error('init_error', error)
    return NextResponse.json(
      { error: error?.message ?? 'init failed', log },
      { status: 500 }
    )
  }
}

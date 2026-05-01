import { prisma } from './db'

/**
 * Idempotent schema sync — applied at runtime as a recovery path when
 * `prisma db push` during the build did not run (or the deployed schema
 * drifted from the Prisma model). Safe to call multiple times.
 *
 * In-memory guard so concurrent demo requests don't hammer Postgres.
 */
let initPromise: Promise<void> | null = null

export function ensureSchema(): Promise<void> {
  if (initPromise) return initPromise
  initPromise = runSchemaSync().catch((err) => {
    initPromise = null // allow a future retry
    throw err
  })
  return initPromise
}

export async function runSchemaSync() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User"
      ADD COLUMN IF NOT EXISTS "accountType" TEXT NOT NULL DEFAULT 'HR_DEPARTMENT',
      ADD COLUMN IF NOT EXISTS "plan" TEXT NOT NULL DEFAULT 'STARTER',
      ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3)
  `)

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
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AddonOrder_pkey" PRIMARY KEY ("id")
    )
  `)

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

  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "AddonOrder_userId_idx" ON "AddonOrder"("userId")`,
  )
}

/**
 * Try a Prisma operation up to `retries` times, ensuring the schema is in sync
 * if we hit a "table missing" error, and reconnecting on a transient init error.
 */
export async function withDbRecovery<T>(
  op: () => Promise<T>,
  { retries = 2 }: { retries?: number } = {},
): Promise<T> {
  let lastErr: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await op()
    } catch (err: any) {
      lastErr = err
      const code = err?.code

      // Missing column or table → run schema sync once, then retry.
      if (code === 'P2021' || code === 'P2022') {
        try {
          await ensureSchema()
          continue
        } catch (syncErr) {
          console.error('schema_sync_failed', syncErr)
          throw err
        }
      }

      // Transient connection problems → small backoff and retry.
      if (code === 'P1001' || code === 'P1002' || code === 'P1017') {
        await new Promise((r) => setTimeout(r, 200 * (attempt + 1)))
        try {
          await prisma.$disconnect()
        } catch {
          /* ignore */
        }
        continue
      }

      throw err
    }
  }
  throw lastErr
}

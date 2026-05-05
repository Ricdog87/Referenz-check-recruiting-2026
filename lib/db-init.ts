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

  // PasswordResetToken — Token-basierter Self-Service-Reset
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "token" TEXT NOT NULL,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "usedAt" TIMESTAMP(3),
      "ip" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
    )
  `)

  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_token_key" ON "PasswordResetToken"("token")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt")`,
  )

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PasswordResetToken_userId_fkey'
      ) THEN
        ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `)

  // AgencyWaitlistEntry — PDL-Frühzugang-Anfragen
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AgencyWaitlistEntry" (
      "id" TEXT NOT NULL,
      "company" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "website" TEXT,
      "placementsPerYear" TEXT,
      "ip" TEXT,
      "userAgent" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AgencyWaitlistEntry_pkey" PRIMARY KEY ("id")
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "AgencyWaitlistEntry_email_idx" ON "AgencyWaitlistEntry"("email")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "AgencyWaitlistEntry_createdAt_idx" ON "AgencyWaitlistEntry"("createdAt")`,
  )

  // ── Performance: Composite-Indizes für die Hot-Query-Pfade
  // Dashboard, Listen-Seiten und Audit-Trail laufen hauptsächlich über
  // userId + Sortierung/Filter. Composite-Indizes sparen den Re-Sort/
  // Filter-Pass nach dem Index-Scan und reduzieren Latenz auf großen Tabellen
  // signifikant (10× und mehr ab ~1000 Rows pro User).
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Candidate_userId_createdAt_idx" ON "Candidate"("userId", "createdAt" DESC)`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Candidate_userId_status_idx" ON "Candidate"("userId", "status")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "ReferenceCheck_candidateId_status_idx" ON "ReferenceCheck"("candidateId", "status")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "ReferenceCheck_candidateId_createdAt_idx" ON "ReferenceCheck"("candidateId", "createdAt" DESC)`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "ReferenceCheck_createdAt_idx" ON "ReferenceCheck"("createdAt")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt" DESC)`,
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

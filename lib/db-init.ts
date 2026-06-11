import { prisma } from './db'
import { logger } from './logger'

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

  // ConsentToken — Bewerber-Self-Service-Consent-Portal
  // (DSGVO Art. 6 Abs. 1 lit. a + Art. 7). Wird in
  // POST /api/candidates/:id/invite + /api/consent/:token/* benutzt.
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ConsentToken" (
      "id" TEXT NOT NULL,
      "candidateId" TEXT NOT NULL,
      "tokenHash" TEXT NOT NULL,
      "scope" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDING_ACCEPT',
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "acceptedAt" TIMESTAMP(3),
      "revokedAt" TIMESTAMP(3),
      "ipAccepted" TEXT,
      "uaAccepted" TEXT,
      "consentVersion" TEXT NOT NULL DEFAULT '1.0',
      "refereesJson" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ConsentToken_pkey" PRIMARY KEY ("id")
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "ConsentToken_tokenHash_key" ON "ConsentToken"("tokenHash")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "ConsentToken_candidateId_idx" ON "ConsentToken"("candidateId")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "ConsentToken_expiresAt_idx" ON "ConsentToken"("expiresAt")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "ConsentToken_status_idx" ON "ConsentToken"("status")`,
  )
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ConsentToken_candidateId_fkey'
      ) THEN
        ALTER TABLE "ConsentToken" ADD CONSTRAINT "ConsentToken_candidateId_fkey"
          FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `)

  // CvAnalysisReport — Speicher für die Ergebnisse von POST /api/cv-analysis
  // (deterministische Checks + LLM-Claim-Analyse).
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CvAnalysisReport" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "report" JSONB NOT NULL,
      "inputHash" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CvAnalysisReport_pkey" PRIMARY KEY ("id")
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "CvAnalysisReport_userId_idx" ON "CvAnalysisReport"("userId")`,
  )
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CvAnalysisReport_userId_fkey'
      ) THEN
        ALTER TABLE "CvAnalysisReport" ADD CONSTRAINT "CvAnalysisReport_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `)

  // PilotApplication-Reminder-Felder fuer die Email-Drip-Sequence.
  // Idempotent — IF NOT EXISTS, falls auf Prod schon ueber db push
  // bei Schema-Sync angelegt.
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "PilotApplication" ADD COLUMN IF NOT EXISTS "lastReminderSent" INTEGER`,
  )
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "PilotApplication" ADD COLUMN IF NOT EXISTS "lastReminderAt" TIMESTAMP(3)`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "PilotApplication_status_lastReminderSent_idx"
       ON "PilotApplication"("status", "lastReminderSent")`,
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
          logger.error('schema_sync_failed', syncErr)
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

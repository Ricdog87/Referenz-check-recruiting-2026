-- Adds two tables that have been declared in prisma/schema.prisma
-- but never had a backing migration:
--
--   ConsentToken     — Bewerber-Self-Service-Consent-Portal
--                      (DSGVO Art. 6 Abs. 1 lit. a + Art. 7).
--                      Ohne diese Tabelle crasht POST /api/candidates/:id/invite
--                      mit `relation "ConsentToken" does not exist`.
--   CvAnalysisReport — Speicher für die Ergebnisse von POST /api/cv-analysis
--                      (deterministische Checks + LLM-Claim-Analyse).
--                      Wird in lib/cv-analysis benutzt.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS, IF NOT EXISTS auf Indizes,
-- DO-Block auf FK-Constraints. Sicher mehrfach anwendbar — falls die
-- Tabelle in einer Umgebung bereits existiert (z. B. weil ensureSchema()
-- aus lib/db-init.ts zuvor lief), ist diese Migration ein No-Op.

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
);

CREATE UNIQUE INDEX IF NOT EXISTS "ConsentToken_tokenHash_key"
    ON "ConsentToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "ConsentToken_candidateId_idx"
    ON "ConsentToken"("candidateId");
CREATE INDEX IF NOT EXISTS "ConsentToken_expiresAt_idx"
    ON "ConsentToken"("expiresAt");
CREATE INDEX IF NOT EXISTS "ConsentToken_status_idx"
    ON "ConsentToken"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ConsentToken_candidateId_fkey'
  ) THEN
    ALTER TABLE "ConsentToken" ADD CONSTRAINT "ConsentToken_candidateId_fkey"
      FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "CvAnalysisReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "report" JSONB NOT NULL,
    "inputHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CvAnalysisReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CvAnalysisReport_userId_idx"
    ON "CvAnalysisReport"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CvAnalysisReport_userId_fkey'
  ) THEN
    ALTER TABLE "CvAnalysisReport" ADD CONSTRAINT "CvAnalysisReport_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

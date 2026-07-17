-- zvoove-Integration (additiv, default off). Idempotent via IF NOT EXISTS,
-- konsistent mit dem Self-Healing-Ansatz in lib/db-init.ts.

CREATE TABLE IF NOT EXISTS "ZvooveConnection" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "baseUrl" TEXT NOT NULL,
  "apiKeyEnc" TEXT NOT NULL,
  "apiKeyFp" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING_VALIDATION',
  "lastError" TEXT,
  "lastValidated" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ZvooveConnection_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ZvooveConnection_workspaceId_key" ON "ZvooveConnection"("workspaceId");
CREATE INDEX IF NOT EXISTS "ZvooveConnection_status_idx" ON "ZvooveConnection"("status");

CREATE TABLE IF NOT EXISTS "ZvooveCandidateMap" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "zvooveCandidateId" TEXT NOT NULL,
  "candiqCandidateId" TEXT NOT NULL,
  "externalHash" TEXT NOT NULL,
  "syncState" TEXT NOT NULL DEFAULT 'PENDING',
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ZvooveCandidateMap_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ZvooveCandidateMap_candiqCandidateId_key" ON "ZvooveCandidateMap"("candiqCandidateId");
CREATE UNIQUE INDEX IF NOT EXISTS "ZvooveCandidateMap_workspaceId_zvooveCandidateId_key" ON "ZvooveCandidateMap"("workspaceId", "zvooveCandidateId");
CREATE INDEX IF NOT EXISTS "ZvooveCandidateMap_workspaceId_idx" ON "ZvooveCandidateMap"("workspaceId");
CREATE INDEX IF NOT EXISTS "ZvooveCandidateMap_syncState_idx" ON "ZvooveCandidateMap"("syncState");

CREATE TABLE IF NOT EXISTS "ZvooveSyncLog" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "candidateId" TEXT,
  "checkId" TEXT,
  "details" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ZvooveSyncLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ZvooveSyncLog_workspaceId_createdAt_idx" ON "ZvooveSyncLog"("workspaceId", "createdAt");
CREATE INDEX IF NOT EXISTS "ZvooveSyncLog_action_idx" ON "ZvooveSyncLog"("action");
CREATE INDEX IF NOT EXISTS "ZvooveSyncLog_status_idx" ON "ZvooveSyncLog"("status");

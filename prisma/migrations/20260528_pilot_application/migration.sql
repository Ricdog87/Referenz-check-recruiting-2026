-- PilotApplication: neue Tabelle fuer Pilot-Programm Q3/2026.
-- Form-Submits von der Homepage landen hier. Status-Default PENDING.
-- Indizes auf status + createdAt fuer die Live-Counter ("9 von 10 voll").

CREATE TABLE IF NOT EXISTS "PilotApplication" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hiresPerYear" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PilotApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PilotApplication_status_idx" ON "PilotApplication"("status");
CREATE INDEX IF NOT EXISTS "PilotApplication_createdAt_idx" ON "PilotApplication"("createdAt");

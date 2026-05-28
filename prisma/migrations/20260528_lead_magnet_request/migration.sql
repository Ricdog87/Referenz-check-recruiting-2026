-- LeadMagnetRequest: Tabelle fuer E-Mail-Capture vor Lead-Magnets.
-- Newsletter ist Double-Opt-In (newsletterConfirmedAt wird gesetzt
-- wenn der Bestaetigungs-Link geklickt wurde).

CREATE TABLE IF NOT EXISTS "LeadMagnetRequest" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "consent" BOOLEAN NOT NULL DEFAULT true,
    "newsletter" BOOLEAN NOT NULL DEFAULT false,
    "newsletterConfirmedAt" TIMESTAMP(3),
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadMagnetRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LeadMagnetRequest_slug_idx" ON "LeadMagnetRequest"("slug");
CREATE INDEX IF NOT EXISTS "LeadMagnetRequest_email_idx" ON "LeadMagnetRequest"("email");
CREATE INDEX IF NOT EXISTS "LeadMagnetRequest_createdAt_idx" ON "LeadMagnetRequest"("createdAt");

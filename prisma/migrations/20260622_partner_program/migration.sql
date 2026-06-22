-- Partner-/Reseller-Programm (Phase 1)
--
-- Additive Migration: 6 neue Tabellen + zugehörige Indizes/FKs.
-- Bestehende Tabellen unverändert. Keine Spalten-Drops, keine Datentyp-Wechsel.
-- Idempotent: kann mehrfach ausgeführt werden ohne Effekt.
--
-- Tabellen:
--   PartnerAccount               — Auth-Entity (strikt getrennt von User/Candidate)
--   PartnerPasswordResetToken    — Eigener Reset-Flow
--   PartnerAuditLog              — Eigener Audit-Trail (kein Klartext-EK in details)
--   PartnerTier                  — 4 Tier-Stufen (Seed füllt: REGISTERED/SILVER/GOLD/PLATINUM)
--   PartnerPricing               — Globale Defaults (partnerAccountId=NULL) + Per-Partner-Overrides
--   PartnerCustomer              — End-Mandanten je Partner (status='ACTIVE' zählt für Tier)
--
-- Es gibt KEINE FKs auf User, Candidate, ConsentToken, GdprConsent,
-- Document, ReferenceCheck oder AddonOrder. Cross-Domain-Reads sind
-- schema-seitig unmöglich.

CREATE TABLE IF NOT EXISTS "PartnerAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "contactFirstName" TEXT NOT NULL,
    "contactLastName" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "tier" TEXT NOT NULL DEFAULT 'REGISTERED',
    "logoUrl" TEXT,
    "consentVersion" TEXT NOT NULL DEFAULT '1.0',
    "emailVerifiedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "suspendedAt" TIMESTAMP(3),
    "suspendReason" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartnerAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PartnerAccount_email_key"  ON "PartnerAccount"("email");
CREATE INDEX        IF NOT EXISTS "PartnerAccount_email_idx"  ON "PartnerAccount"("email");
CREATE INDEX        IF NOT EXISTS "PartnerAccount_status_idx" ON "PartnerAccount"("status");
CREATE INDEX        IF NOT EXISTS "PartnerAccount_tier_idx"   ON "PartnerAccount"("tier");

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "PartnerPasswordResetToken" (
    "id" TEXT NOT NULL,
    "partnerAccountId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartnerPasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PartnerPasswordResetToken_token_key"
    ON "PartnerPasswordResetToken"("token");
CREATE INDEX IF NOT EXISTS "PartnerPasswordResetToken_partnerAccountId_idx"
    ON "PartnerPasswordResetToken"("partnerAccountId");
CREATE INDEX IF NOT EXISTS "PartnerPasswordResetToken_expiresAt_idx"
    ON "PartnerPasswordResetToken"("expiresAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PartnerPasswordResetToken_partnerAccountId_fkey'
  ) THEN
    ALTER TABLE "PartnerPasswordResetToken" ADD CONSTRAINT "PartnerPasswordResetToken_partnerAccountId_fkey"
      FOREIGN KEY ("partnerAccountId") REFERENCES "PartnerAccount"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "PartnerAuditLog" (
    "id" TEXT NOT NULL,
    "partnerAccountId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartnerAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PartnerAuditLog_partnerAccountId_idx" ON "PartnerAuditLog"("partnerAccountId");
CREATE INDEX IF NOT EXISTS "PartnerAuditLog_action_idx"           ON "PartnerAuditLog"("action");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PartnerAuditLog_partnerAccountId_fkey'
  ) THEN
    ALTER TABLE "PartnerAuditLog" ADD CONSTRAINT "PartnerAuditLog_partnerAccountId_fkey"
      FOREIGN KEY ("partnerAccountId") REFERENCES "PartnerAccount"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "PartnerTier" (
    "tier" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "minActiveCustomers" INTEGER NOT NULL,
    "ekDiscountPct" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartnerTier_pkey" PRIMARY KEY ("tier")
);

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "PartnerPricing" (
    "id" TEXT NOT NULL,
    "partnerAccountId" TEXT,
    "planKey" TEXT NOT NULL,
    "listPriceMonthlyCents" INTEGER NOT NULL,
    "listPriceAnnualCents" INTEGER NOT NULL,
    "baseEkMonthlyCents" INTEGER,
    "baseEkAnnualCents" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartnerPricing_pkey" PRIMARY KEY ("id")
);

-- Unique deckt globale Default-Zeile (partnerAccountId IS NULL) UND
-- Per-Partner-Overrides ab. Postgres behandelt NULL ≠ NULL in unique,
-- daher kann es genau eine NULL-Zeile pro planKey geben.
CREATE UNIQUE INDEX IF NOT EXISTS "PartnerPricing_partnerAccountId_planKey_key"
    ON "PartnerPricing"("partnerAccountId", "planKey");
CREATE INDEX IF NOT EXISTS "PartnerPricing_planKey_idx" ON "PartnerPricing"("planKey");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PartnerPricing_partnerAccountId_fkey'
  ) THEN
    ALTER TABLE "PartnerPricing" ADD CONSTRAINT "PartnerPricing_partnerAccountId_fkey"
      FOREIGN KEY ("partnerAccountId") REFERENCES "PartnerAccount"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "PartnerCustomer" (
    "id" TEXT NOT NULL,
    "partnerAccountId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "contactFirstName" TEXT NOT NULL,
    "contactLastName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "planKey" TEXT NOT NULL,
    "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "ekPriceCents" INTEGER NOT NULL,
    "endPriceCents" INTEGER NOT NULL,
    "marginCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pausedAt" TIMESTAMP(3),
    "churnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartnerCustomer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PartnerCustomer_partnerAccountId_company_planKey_key"
    ON "PartnerCustomer"("partnerAccountId", "company", "planKey");
CREATE INDEX IF NOT EXISTS "PartnerCustomer_partnerAccountId_status_idx"
    ON "PartnerCustomer"("partnerAccountId", "status");
CREATE INDEX IF NOT EXISTS "PartnerCustomer_planKey_idx" ON "PartnerCustomer"("planKey");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PartnerCustomer_partnerAccountId_fkey'
  ) THEN
    ALTER TABLE "PartnerCustomer" ADD CONSTRAINT "PartnerCustomer_partnerAccountId_fkey"
      FOREIGN KEY ("partnerAccountId") REFERENCES "PartnerAccount"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

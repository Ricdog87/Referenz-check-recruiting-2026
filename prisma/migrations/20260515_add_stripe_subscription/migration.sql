-- AddStripeSubscription: additive Spalten am User für Phase-1-Billing.
-- Alle Felder sind nullable bzw. haben sichere Defaults, damit bestehende
-- Daten nicht migriert oder verändert werden müssen.

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "planStatus" TEXT NOT NULL DEFAULT 'INACTIVE',
  ADD COLUMN IF NOT EXISTS "billingInterval" TEXT DEFAULT 'MONTHLY',
  ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT,
  ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT,
  ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeCustomerId_key"
  ON "User"("stripeCustomerId");

CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeSubscriptionId_key"
  ON "User"("stripeSubscriptionId");

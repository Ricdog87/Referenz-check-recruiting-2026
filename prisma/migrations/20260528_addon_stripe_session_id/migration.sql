-- AddStripeSessionId: additive nullable Spalte auf AddonOrder
-- fuer Webhook-Idempotency (verhindert doppelte AddonOrder bei
-- Stripe-Event-Replays). Bestehende Datensaetze bleiben NULL.

ALTER TABLE "AddonOrder"
  ADD COLUMN IF NOT EXISTS "stripeSessionId" TEXT;

-- Unique-Index (filtered, weil viele NULLs erlaubt sind) damit der
-- Webhook-Handler eine Sicherung gegen Doppel-Inserts hat.
CREATE UNIQUE INDEX IF NOT EXISTS "AddonOrder_stripeSessionId_key"
  ON "AddonOrder"("stripeSessionId");

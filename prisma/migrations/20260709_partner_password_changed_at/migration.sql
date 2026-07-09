-- Session-Invalidierung nach Passwort-Wechsel (Audit-Fix):
-- passwordChangedAt wird bei jeder Passwort-Änderung gesetzt; der
-- Partner-JWT-Callback entwertet ältere Tokens beim 60s-Refresh.
-- Additiv + idempotent.
ALTER TABLE "PartnerAccount" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3);

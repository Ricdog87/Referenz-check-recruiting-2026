-- Session-Invalidierung nach Passwort-Wechsel für HR-User (Audit-Fix G4).
-- passwordChangedAt wird bei jeder Passwort-Änderung gesetzt; der
-- User-JWT-Callback entwertet ältere Tokens beim Refresh. Additiv + idempotent.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3);

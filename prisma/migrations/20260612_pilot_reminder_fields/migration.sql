-- Pilot-Reminder-Felder ergänzen (Email-Drip-Sequence)
-- Idempotent — IF NOT EXISTS, falls in Prod schon via db push gelandet.

ALTER TABLE "PilotApplication" ADD COLUMN IF NOT EXISTS "lastReminderSent" INTEGER;
ALTER TABLE "PilotApplication" ADD COLUMN IF NOT EXISTS "lastReminderAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "PilotApplication_status_lastReminderSent_idx"
  ON "PilotApplication"("status", "lastReminderSent");

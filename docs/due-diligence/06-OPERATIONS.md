# 06 — Betrieb

**Stand:** 2026-07-17.

## Deployment
- **Hosting:** Vercel (Serverless, EU). Auto-Deploy bei Push/Merge auf `main`; PR-Previews automatisch.
- **Build (`vercel.json`):** `prisma db push --skip-generate && prisma generate && next build`.
  - ⚠️ **Bekanntes Risiko (R6):** `db push` synchronisiert das Schema **ohne** Migrationskette/Rollback direkt gegen Prod. Umstellung auf `migrate deploy` ist GO-gated (Runbook unten).
- **CI (`.github/workflows/ci.yml`):** lint · typecheck · vitest · build · license-check · gitleaks. Empfehlung: als *required status checks* für `main` aktivieren.

## Environments
- **Prod / Preview / Development** über Vercel-Env-Scopes.
- **Env-Parität:** `.env.example` deckt jetzt alle referenzierten Vars ab (G17-Fix) inkl. `ASSIGNMENT_AUTO`, `PDL_REGISTRATION_OPEN`, `CV_ANALYSIS_LLM_ENABLED`, Seed-Vars.
- **Feature-Flags** (default off): `PARTNER_PROGRAM_ENABLED`, `CV_ANALYSIS_LLM_ENABLED`, `CV_ANALYSIS_ENABLE_EXTERNAL_LOOKUPS`.

## Crons (`vercel.json`, Bearer-Auth via `CRON_SECRET`)
| Job | Zeit | Zweck |
|---|---|---|
| `/api/cron/cleanup` | tägl. 03:00 | DSGVO-Löschung 180d (DB + Blobs) |
| `/api/internal/indexnow-ping` | tägl. 04:00 | SEO-Recrawl-Ping |
| `/api/cron/pilot-reminders` | tägl. 09:00 | Pilot-Drip-Mails |
| `/api/cron/partner-tier-sync` | monatl. 1., 05:00 | Partner-Tier-Neuberechnung |

## Monitoring / Health
- **Health-Route:** `/api/health` (DB-Ping `SELECT 1`, 503 bei Ausfall + Latenz).
- **Logging:** `lib/logger.ts` — single-line JSON für Vercel Log-Drains.
- **Offen (G14):** kein Error-Tracking (Sentry/APM), kein Alerting auf Health-503 → empfohlen (Sentry EU + Alert-Regel).

## Backup / Restore (Offen — G15)
- Supabase liefert managed Backups (planabhängig; Pro-Plan: PITR). **Kein dokumentiertes/getestetes Restore-Verfahren im Repo.**
- **Empfehlung vor Signing:** RPO/RTO festlegen, einen echten Restore auf eine Staging-DB testen, Datum + Ergebnis hier eintragen:
  - _Letzter getesteter Restore: **— (noch offen)**_

## Incident-Runbook (Offen — G16)
- Kein On-Call/Eskalations-Dokument. **Empfehlung:** Minimal-Runbook (Health-503 → Vercel-Status + Supabase-Status prüfen → Rollback via Vercel-Redeploy des letzten grünen Deploys → Stripe-Webhook-Nachverarbeitung).

## R6-Runbook — `db push` → `migrate deploy` (GO-gated Prod-Event)
1. Drift prüfen: `prisma migrate diff --from-migrations ./prisma/migrations --to-schema-datamodel ./prisma/schema.prisma --shadow-database-url <shadow>` — muss leer sein. Sonst konsolidierte Baseline-Migration erzeugen.
2. **Prod einmalig:** für jeden Ordner in `prisma/migrations/` → `prisma migrate resolve --applied <migration>` (markiert als angewandt, kein DDL).
3. **Erst danach:** `vercel.json` buildCommand `db push` → `prisma migrate deploy`.
4. `lib/db-init.ts` (paralleles Raw-SQL-Self-Healing) zurückbauen.
5. Staging-Deploy verifizieren → Prod.

## Rollback
- Vercel: Redeploy des letzten grünen Deployments (1 Klick).
- DB: aktuell kein Migrations-Rollback (Folge von `db push`) — nach R6-Cutover via `migrate` möglich.

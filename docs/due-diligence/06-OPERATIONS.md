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
| `/api/cron/cleanup` | tägl. 03:00 | DSGVO-Löschung 180d (DB + Blobs) + AuditLog-Pseudonymisierung (G10) |
| `/api/internal/indexnow-ping` | tägl. 04:00 | SEO-Recrawl-Ping |
| `/api/cron/pilot-reminders` | tägl. 09:00 | Pilot-Drip-Mails |
| `/api/cron/partner-tier-sync` | monatl. 1., 05:00 | Partner-Tier-Neuberechnung |

## Monitoring / Health
- **Health-Route:** `/api/health` (DB-Ping `SELECT 1`, 503 bei Ausfall + Latenz).
- **Logging:** `lib/logger.ts` — single-line JSON für Vercel Log-Drains.
- **Offen (G14):** kein Error-Tracking (Sentry/APM), kein Alerting auf Health-503 → empfohlen (Sentry EU + Alert-Regel).

## Backup / Restore-Runbook (G15)

**Ziele (Vorschlag, vom Betreiber zu bestätigen):** RPO ≤ 24 h (Daten­verlust­fenster), RTO ≤ 4 h (Wiederher­stell­zeit). Mit Supabase-Pro-PITR ist RPO praktisch ≤ 5 min.

**Backup-Mechanik:**
- **Datenbank:** Supabase managed Backups. Free/Pro: tägliches Voll-Backup; **Pro-Plan zusätzlich Point-in-Time-Recovery (PITR)** — für Prod aktivieren.
- **Blobs (CVs/Reports):** Vercel Blob (EU). Kein automatisches Cross-Region-Backup — Blobs sind durch die 180-Tage-DSGVO-Retention bewusst kurzlebig; Quelle der Wahrheit für Metadaten ist die DB.
- **Secrets:** ausschließlich in Vercel-Env-Scopes (nicht im Repo) — separat über Vercel gesichert.

**Restore-Prozedur (auf Staging testen, NICHT blind gegen Prod):**
1. Supabase-Dashboard → Database → Backups → Zeitpunkt (oder PITR-Timestamp) wählen.
2. Restore in ein **frisches Staging-Projekt** (nie direkt über Prod restoren).
3. `DATABASE_URL`/`DIRECT_URL` einer Staging-Vercel-Umgebung auf die restaurierte DB zeigen.
4. Schema-Konsistenz: `npx prisma migrate status` (bzw. `db push --dry-run` prä-R6) — keine Drift.
5. Smoke-Verifikation: `/api/health` = 200; Login; 1 Kandidat + 1 Check sichtbar; 1 Report rendert.
6. Ergebnis (Datum, Restore-Dauer = RTO-Ist, Datenstand = RPO-Ist) unten eintragen.

**Restore-Test-Log:**
| Datum | Umgebung | RTO-Ist | RPO-Ist | Ergebnis |
|---|---|---|---|---|
| _— noch auszuführen_ | Staging | — | — | — |

> **Ehrlich (DD):** Die Prozedur ist dokumentiert und ausführbar, aber ein **echter Restore-Test steht noch aus** — er erfordert Supabase-Projektzugriff und ist eine Betreiber-Aktion. Bis dahin bleibt RTO/RPO eine Zusage, kein Nachweis.

## Incident-Runbook (G16)

**Schweregrade:** **SEV1** = Totalausfall/Datenleck (sofort) · **SEV2** = Kernfunktion gestört (Checkout, Login, Reports) · **SEV3** = degradiert (eine Integration, z. B. Mail/HubSpot).

**Erstreaktion (jede Meldung):**
1. Umfang bestätigen: `/api/health` prüfen, [Vercel-Status](https://www.vercel-status.com) + [Supabase-Status](https://status.supabase.com) checken.
2. Blast-Radius eingrenzen (alle Nutzer? eine Domäne HR/Partner? eine Integration?).
3. Bei SEV1/2: **Rollback zuerst, Root-Cause danach** — Vercel-Redeploy des letzten grünen Deployments (1 Klick).

**Playbooks:**
- **Health-503 / DB down:** Supabase-Status → falls Provider-Ausfall: warten + Status-Kommunikation; falls Connection-Pool erschöpft: Supabase-Pooler/Connections prüfen. Kein Schema-Eingriff unter Last.
- **Stripe-Webhooks fehlgeschlagen:** Stripe-Dashboard → Developers → Webhooks → fehlgeschlagene Events **resenden**. Idempotenz ist getestet (`stripe-webhook.test.ts`), doppelte Zustellung ist sicher. (Härtung G6: Reconciliation-Cron geplant.)
- **Auth-Ausfall (eine Domäne):** `NEXTAUTH_SECRET`/`NEXTAUTH_URL`-Env prüfen; kompromittierte Session? → `passwordChangedAt`-Mechanik entwertet Alt-Tokens ≤ 1 h (HR) / ≤ 60 s (Partner).
- **Blob/Storage:** `BLOB_READ_WRITE_TOKEN` prüfen; Upload/Read degradieren graceful (Stream-Proxy 403 statt Crash).
- **Verdacht Datenleck:** SEV1 — betroffene Credentials/Token rotieren (Vercel-Env), `AuditLog` sichten (`CONSENT_*`, `GDPR_*`, `DOCUMENT_ACCESS_DENIED`), Betroffene + ggf. Aufsichtsbehörde nach Art. 33/34 DSGVO informieren (72 h).

**Nach dem Incident:** Kurz-Postmortem (Was, Ursache, Fix, Prävention) — bei wiederkehrenden Ursachen als Known-Issue/Backlog-Item aufnehmen.

## R6-Runbook — `db push` → `migrate deploy` (GO-gated Prod-Event)
1. Drift prüfen: `prisma migrate diff --from-migrations ./prisma/migrations --to-schema-datamodel ./prisma/schema.prisma --shadow-database-url <shadow>` — muss leer sein. Sonst konsolidierte Baseline-Migration erzeugen.
2. **Prod einmalig:** für jeden Ordner in `prisma/migrations/` → `prisma migrate resolve --applied <migration>` (markiert als angewandt, kein DDL).
3. **Erst danach:** `vercel.json` buildCommand `db push` → `prisma migrate deploy`.
4. `lib/db-init.ts` (paralleles Raw-SQL-Self-Healing) zurückbauen.
5. Staging-Deploy verifizieren → Prod.

## Rollback
- Vercel: Redeploy des letzten grünen Deployments (1 Klick).
- DB: aktuell kein Migrations-Rollback (Folge von `db push`) — nach R6-Cutover via `migrate` möglich.

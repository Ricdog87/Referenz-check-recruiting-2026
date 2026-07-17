# 09 — Known Issues (ehrliches Tech-Debt-Register)

**Stand:** 2026-07-17. Ehrlichkeit schlägt Kosmetik in jeder DD. Vollständige Herleitung: `00-AUDIT_REPORT.md`.

## Offen — vor Signing zu adressieren (GO-gated Prod-Operationen)

| ID | Thema | Risiko | Status |
|---|---|---|---|
| **R3** | CV-Blobs `access: 'public'` (v0.22 kann nur public) | URL abrufbar *falls* geleakt | Runbook bereit; kompensiert durch Stream-Proxy + R1-IDOR-Fix. Braucht `@vercel/blob`-Major + Bestands-Migration |
| **R6** | `prisma db push` gegen Prod im Build | Schema-Drift/kein Rollback | Runbook bereit; braucht einmaliges Prod-Baseline-Resolve |

## Offen — Wartungs-/Härtungs-Backlog (kein Deal-Blocker)

| ID | Thema | Empfehlung |
|---|---|---|
| G3 | Rate-Limiter in-memory (per Lambda) | Auf Upstash/Redis umstellen — härtet Login + alle 24 Call-Sites auf einmal |
| G6 | Kein Stripe-Reconciliation-Cron | Event-Log-Tabelle + täglicher Sub-Sync gegen verpasste Webhooks |
| G7 | Consent-Lifecycle-Routen ungetestet | Route-Tests für accept/revoke/upload |
| G8 | Core-Owner-Scoping nicht per Route getestet | Route-Tests checks/candidates/gdpr |
| G10 | AuditLog Klartext-Emails, unbegrenzte Aufbewahrung | Pseudonymisierung + Frist |
| G11 | Emails im Klartext in einzelnen Logs | Redaction in `email_no_provider`, HubSpot-Fehlerlogs |
| G12 | CV-Analyse-Consent = Boolean, nicht an ConsentToken gebunden | Gegen `ACCEPTED`-Status verifizieren |
| G14 | Kein Error-Tracking/Alerting | Sentry (EU) + Alert auf Health-503 |
| G15 | Kein getestetes Backup/Restore-Verfahren | RPO/RTO + Restore-Test, in `06-OPERATIONS.md` eintragen |
| G16 | Kein Incident-Runbook | Minimal-Runbook (Skizze in `06-OPERATIONS.md`) |
| G18 | Kein Demo-Seed; `prisma/seed.ts` leer | Synthetischer Demo-Datensatz (Phase 4) |
| G19 | E2E ist Scaffold-Platzhalter | Echten Smoke-Pfad verdrahten |
| G20 | DSFA/TOM/RoPA fehlen | Legal-Workstream (technische Basis vorhanden) |
| G22 | `style-src 'unsafe-inline'` neben Nonce | Framer-Motion-Kompat; Hash-basiert lösbar |
| G23 | ElevenLabs-Agent-ID hardcoded, kein Fallback | Env + Graceful-Degradation |
| Next-DoS | 1 verbleibendes `next`-High (DoS-Klasse) | Next-15/16-Migration als eigenes Epic (Image-Optimizer betrifft self-hosted; candiq = managed Vercel) |

## Behoben in `feat/dd-readiness` (Vollständigkeit)
R1 IDOR · R2 Blob-Löschung · R4 LLM-Switch+OpenAI-Disclosure · R5 Next-SSRF · R7 CI · G1 Login-Rate-Limit · G2/G4 HR-Auth-Parität · G5 Stripe-Tests · G9 Retention · G13 LLM-Flag · G17 env.example · G21 stale AUDIT.md · G24 Quota. (Jeweils mit Test + Report-Eintrag.)

## Architektur-Debt (dokumentiert, kein Bug)
- **Dreifache Schema-Wahrheit:** `db push` + `prisma/migrations/*` (vestigial) + `lib/db-init.ts` (Raw-SQL-Self-Healing). Konsolidierung Teil des R6-Cutovers.
- **zvoove:** Phase 1/6 in offenem PR #137, nicht in `main` (s. `05-INTEGRATIONS.md`).
- **Offene PRs:** #137 (zvoove), #138 (Bugs/Quota — teils durch main überholt), #126/#36/#21/#19 (Docs/Draft, größtenteils obsolet) → aufräumen.

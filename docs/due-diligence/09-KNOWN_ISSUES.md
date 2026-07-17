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
| G10 | AuditLog Klartext-Emails, unbegrenzte Aufbewahrung | Pseudonymisierung + Frist |
| G12 | CV-Analyse-Consent = Boolean, nicht an ConsentToken gebunden | Gegen `ACCEPTED`-Status verifizieren |
| G14 | Kein Error-Tracking/Alerting | Sentry (EU) + Alert auf Health-503 |
| G15 | Backup/Restore-Runbook steht (`06-OPERATIONS.md`), aber **echter Restore-Test** noch nicht ausgeführt (Betreiber-Aktion) | RPO/RTO-Ziele + Prozedur dokumentiert; einmaligen Restore auf Staging fahren, Log-Zeile füllen |
| G19 | E2E ist Scaffold-Platzhalter | Echten Smoke-Pfad verdrahten |
| G20 | DSFA/TOM/RoPA fehlen | Legal-Workstream (technische Basis vorhanden) |
| G22 | `style-src 'unsafe-inline'` neben Nonce | Framer-Motion-Kompat; Hash-basiert lösbar |
| Next-DoS | 1 verbleibendes `next`-High (DoS-Klasse) | Next-15/16-Migration als eigenes Epic (Image-Optimizer betrifft self-hosted; candiq = managed Vercel) |

## Behoben in `feat/dd-readiness` (Vollständigkeit)
R1 IDOR · R2 Blob-Löschung · R4 LLM-Switch+OpenAI-Disclosure · R5 Next-SSRF · R7 CI · G1 Login-Rate-Limit · G2/G4 HR-Auth-Parität · G5 Stripe-Tests · G9 Retention · G13 LLM-Flag · G17 env.example · G18 Demo-Seed (`demo:seed`, synthetisch, prod-guarded) · G21 stale AUDIT.md · G24 Quota. (Jeweils mit Test + Report-Eintrag.)

**G7** Consent-Lifecycle-Tests (accept/revoke) · **G8** Owner-Scoping-Route-Tests (checks/candidates/gdpr) · **G11** PII-Redaction in Logs (`email_no_provider`, HubSpot) · **G16** Incident-Runbook (`06-OPERATIONS.md`) · **G23** ElevenLabs-Agent-ID via ENV + Graceful-Degradation.

**Teil-erledigt:** **G15** Backup/Restore-Runbook dokumentiert (Restore-Test noch offen).

Zusätzlich geliefert: **Phase 3** KPI-Cockpit (`/admin/kpi`, flag-gated) · **Phase 4** Demo-Umgebung.

## Architektur-Debt (dokumentiert, kein Bug)
- **Dreifache Schema-Wahrheit:** `db push` + `prisma/migrations/*` (vestigial) + `lib/db-init.ts` (Raw-SQL-Self-Healing). Konsolidierung Teil des R6-Cutovers.
- **zvoove:** Phase 1/6 in offenem PR #137, nicht in `main` (s. `05-INTEGRATIONS.md`).
- **Offene PRs:** #137 (zvoove), #138 (Bugs/Quota — teils durch main überholt), #126/#36/#21/#19 (Docs/Draft, größtenteils obsolet) → aufräumen.

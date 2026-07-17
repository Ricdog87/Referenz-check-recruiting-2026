# 08 — Teststrategie

**Stand:** 2026-07-17 · **25 Testdateien / 219 Fälle**, alle grün. Vitest (Unit/Integration, Prisma + NextAuth gemockt, offline). Laufen ohne DB.

## Suite lokal fahren
```bash
npm ci
npm test            # vitest run — 219/219
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
```
CI (`.github/workflows/ci.yml`) fährt dieselben Gates + build + license-check + gitleaks bei jedem PR.

## Abdeckung kritischer Pfade

| Pfad | Abdeckung | Dateien |
|---|---|:--:|
| **Consent-/CV-Gate** | 🟢 Gate-Enforcement + IDOR-Regression + Blob-Leak-Schutz | `cv-gate.test.ts` |
| **DSGVO-Löschung (Blobs)** | 🟢 Cron + Art.-17, Reihenfolge, Fehlerpfade | `gdpr-blob-cleanup.test.ts`, `cron-retention.test.ts` |
| **Billing / Stripe-Webhook** | 🟢 Signatur, Idempotenz, Status-Mapping, payment_failed | `stripe-webhook.test.ts` |
| **Quota / Umsatz-Integrität** | 🟢 Monatskontingent je Tarif | `quota.test.ts` |
| **KPI-Cockpit (Phase 3)** | 🟢 MRR/ARR, Turnaround, Credential-Bestand, 30d-Fenster, CSV-Export | `kpi.test.ts` |
| **Auth-Härtung** | 🟢 Login-Rate-Limit + HR-PW-Orakel/Session-Kill | `login-guard.test.ts`, `hr-password-hardening.test.ts` |
| **Partner-Scoping & -Pricing** | 🟢 11 Dateien / ~93 Fälle (Isolation, EK-Auflösung, Referral, Settings) | `partner-*.test.ts` |
| **CV-Analyse (LLM-Gate)** | 🟢 Flag-off → kein LLM-Call | `cv-analysis.test.ts` |
| **Consent-Lifecycle (G7)** | 🟢 accept/revoke-Zustandsübergänge + CV-Gate-Aufruf + Audit | `consent-lifecycle.test.ts` |
| **Owner-Scoping auf Routen (G8)** | 🟢 checks/[id], candidates/[id], gdpr/export — 401 + userId-Scope + 404 fremd | `owner-scoping.test.ts` |

## Bewusst (noch) nicht abgedeckt
- **Consent-Upload-Route** (`upload` setzt `cvStatus`) — accept/revoke sind belegt (G7); der Upload-Zweig bleibt für einen späteren Durchgang.
- **E2E:** `tests/example.spec.ts` ist noch Playwright-Scaffold (G19) → echter Smoke-Pfad empfohlen.

## Teststil
- `vi.doMock` für Prisma/NextAuth/Blob → schnelle, deterministische Unit/Integration-Tests ohne Infrastruktur.
- `server-only`-Alias auf Stub (`__tests__/stubs/server-only.ts`) für server-only-Module.
- Jeder DD-Fix (R1/R2/R4/R5/G1/G2/G4/G5/G9/G24) kam mit Regressionstest.

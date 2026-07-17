# candiq

**DSGVO-konforme Referenzprüfung & CV-Verifikation als SaaS.** candiq
unterstützt HR-Abteilungen und Personaldienstleister dabei, Angaben aus
Lebensläufen und Zeugnissen strukturiert, einwilligungsbasiert und
nachvollziehbar zu verifizieren — mit menschlichen Reviewern im Loop, nicht
per Auto-Ablehnung.

- **Live:** [candiq.de](https://candiq.de)
- **Version:** siehe [`CHANGELOG.md`](CHANGELOG.md) · [`package.json`](package.json)
- **Tech-Datenraum (Due Diligence):** [`docs/due-diligence/`](docs/due-diligence/README.md)

---

## Stack

| Schicht | Technologie |
|---|---|
| Framework | Next.js 14 (App Router), TypeScript |
| Datenbank | PostgreSQL (Supabase, EU/Frankfurt) via Prisma |
| Auth | NextAuth v4 — getrennte Domänen HR & Partner (Credentials/bcrypt) |
| Billing | Stripe (Checkout, Webhooks, Add-ons) |
| Storage | Vercel Blob (EU) — CVs/Zeugnisse, Stream-Proxy hinter Consent-Gate |
| Mail | Resend |
| Hosting | Vercel (EU, serverless + Cron) |
| KI (optional, flag-gated) | Anthropic / OpenAI — nur für CV-Plausibilität, default aus |

Architektur-Details, Datenmodell und Sicherheitsposition:
[`docs/due-diligence/01-ARCHITECTURE.md`](docs/due-diligence/01-ARCHITECTURE.md) ff.

---

## Schnellstart (lokal)

```bash
cp .env.example .env          # Pflicht: DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET
npm ci                        # postinstall: prisma generate
DATABASE_URL=$DIRECT_URL npx prisma db push
npm run dev                   # http://localhost:3000
```

Pflicht-Env für den Start: `DATABASE_URL`, `DIRECT_URL`,
`NEXTAUTH_SECRET` (≥ 32 Zeichen), `NEXTAUTH_URL`. Mail/Blob/Stripe/KI
degradieren ohne Keys graceful. Ausführliche Anleitung:
[`SETUP.md`](SETUP.md) und
[`docs/due-diligence/10-ONBOARDING.md`](docs/due-diligence/10-ONBOARDING.md).

### Nützliche Skripte

```bash
npm test                 # Vitest (offline, keine DB) — Unit/Integration
npm run typecheck        # tsc --noEmit
npm run lint             # next lint
npm run build            # Production-Build
npm run seed:partner-tiers && npm run seed:partner-pricing   # Partner-Pflicht-Seeds
npm run demo:seed        # synthetische Demo-Umgebung (nur Staging/lokal)
```

---

## Feature-Flags

Neue/riskante Features stehen hinter ENV-Flags (default **off**,
`lib/flags.ts`):

| Flag | Wirkung |
|---|---|
| `CV_ANALYSIS_LLM_ENABLED` | Master-Switch für den LLM-gestützten CV-Check. Off → kein CV-Inhalt verlässt die Plattform. |
| `PARTNER_PROGRAM_ENABLED` | Reseller-/Partner-Programm (`/partner`). |
| `KPI_COCKPIT_ENABLED` | Admin-KPI-Cockpit `/admin/kpi` (MRR/ARR, Credential-Bestand, CSV-Export). |

Vollständige Liste inkl. Ops-Flags: [`.env.example`](.env.example).

---

## Qualität & CI

CI (`.github/workflows/ci.yml`) läuft bei jedem PR nach `main` und blockt bei
Rot. **Als Required-Checks in den Branch-Protection-Regeln von `main`
setzen:**

- **`Lint · Typecheck · Test · Build`** — Lint, `tsc`, Vitest, Production-Build
- **`License check (kein Copyleft)`** — Allowlist, bricht bei GPL/AGPL/LGPL/MPL
- **`Secret scan (Historie + Diff)`** — gitleaks über die volle Historie

Lokal vor jedem Push: `npm run lint && npm run typecheck && npm test`.

---

## Kernprinzipien (Contributing)

- **Consent-Gate ist tabu.** Jede CV-Content-Route MUSS `hasCvAccess()`
  (`lib/cv-gate.ts`) nutzen — Single Source of Truth.
- **App-Layer-Enforcement** (bewusst kein RLS, siehe
  [`03-SECURITY.md`](docs/due-diligence/03-SECURITY.md)).
- **Secrets nur via ENV**, nie committen/loggen.
- **Migrationen additiv** (`ADD COLUMN IF NOT EXISTS`).
- **Mails awaited** versenden (Vercel-Lambda-Freeze).
- **Jeder Fix mit Test**, CI-Gates grün.

---

## Weiterführende Doku

- [`docs/due-diligence/`](docs/due-diligence/README.md) — technischer
  Datenraum: Architektur, Datenmodell, Security, DSGVO, Integrationen,
  Betrieb, Lizenzen, Teststrategie, Known Issues, Onboarding.
- [`docs/cv-analysis.md`](docs/cv-analysis.md) — CV-Fabrication-/Consistency-Analyzer
  (`lib/cv-analysis/`).
- [`SETUP.md`](SETUP.md) — Setup aus Nutzer-Perspektive.
- [`CHANGELOG.md`](CHANGELOG.md) — Versionshistorie.

---

*© candiq. Proprietär (`UNLICENSED`). Kein Copyleft in den Dependencies —
siehe [`07-IP_LICENSES.md`](docs/due-diligence/07-IP_LICENSES.md).*

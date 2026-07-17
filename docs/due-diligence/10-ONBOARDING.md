# 10 — Onboarding (neuer Dev produktiv in < 1 Tag)

**Stand:** 2026-07-17. Ergänzt `SETUP.md` (Nutzer-Perspektive) um die Entwickler-Perspektive.

## Voraussetzungen
- Node **22**, npm 10+.
- Eine Postgres-DB (Supabase EU-Projekt empfohlen) → `DATABASE_URL` + `DIRECT_URL`.

## Lokales Hochfahren
```bash
git clone <repo> && cd Referenz-check-recruiting-2026
cp .env.example .env          # ausfüllen (Pflicht: DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET)
npm ci                        # postinstall: prisma generate
DATABASE_URL=$DIRECT_URL npx prisma db push   # Schema in die DB
npm run dev                   # http://localhost:3000
```

**Minimal-Env für lokalen Start:** `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET` (≥32 Zeichen), `NEXTAUTH_URL=http://localhost:3000`. Alles andere ist optional (Mail/Blob/Stripe/KI degradieren gracefully — z. B. Mail → Log-Only ohne `RESEND_API_KEY`).

## Pflicht-Seeds (sonst brechen Partner-Features)
```bash
DATABASE_URL=… npm run seed:partner-tiers
DATABASE_URL=… npm run seed:partner-pricing
```
Optionale Seeds (mit `REVIEWER_*` / `PROSPECT_*`-Env): `scripts/seed-reviewer.ts`, `scripts/seed-prospect.ts`.

**Demo-Umgebung (Staging/lokal, vollständig synthetisch):**
```bash
DATABASE_URL=… npm run demo:seed   # 3 Kunden + 1 Partner + Beispiel-Reports
```
Idempotent, keine echte PII (E-Mails `@demo.candiq.invalid`, Firmen `[DEMO] …`). Bricht hart ab, wenn `NEXTAUTH_URL` auf `candiq.de` zeigt (kein Prod-Seed).

## Erste Runde verifizieren
```bash
npm test        # 229 Vitest-Fälle, offline (keine DB nötig)
npm run typecheck
npm run lint
```

## Orientierung im Code
| Was | Wo |
|---|---|
| HR-Auth | `lib/auth.ts` |
| Partner-Auth/-Logik | `lib/partner/*` |
| Consent-/CV-Gate (SSOT) | `lib/cv-gate.ts`, `lib/consent-token.ts` |
| Billing | `lib/stripe.ts`, `app/api/stripe/*` |
| Mail-Templates | `lib/email.ts` |
| Feature-Flags | `lib/flags.ts` |
| Datenmodell | `prisma/schema.prisma` (`02-DATA_MODEL.md`) |
| DD-Gesamtbild | `docs/due-diligence/` (dieser Ordner) |

## Wichtige Konventionen
- **Feature-Flags default off**; neue riskante Features hinter Flag.
- **Consent-Gate ist tabu** — jede CV-Content-Route MUSS `hasCvAccess()` nutzen.
- **Partner-Queries** immer via `withPartnerScope()`.
- **Mails awaited** versenden (Vercel-Lambda-Freeze).
- Migrationen **additiv** (`ADD COLUMN IF NOT EXISTS`).
- Jeder Fix mit Test; CI-Gates müssen grün sein.

## Nächste Schritte für den DD-Prozess
Siehe `00-AUDIT_REPORT.md` (Roadmap) und `09-KNOWN_ISSUES.md` (Backlog).

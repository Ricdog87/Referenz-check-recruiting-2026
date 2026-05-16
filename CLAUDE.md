# CLAUDE.md

Guidance for AI assistants (Claude Code, etc.) working in this repository.

## Project

**candiq** — German-language SaaS for **DSGVO-compliant reference checks** in recruiting. HR teams and agencies register candidates, document consent, run reference checks with former employers, and export PDF reports. Subscription tiers (`STARTER` / `PROFESSIONAL` / `BUSINESS` / `ENTERPRISE` + `AGENCY_*`) plus single-check / check-pack add-on purchases via Stripe. 14-day trial on signup; `demo@candiq.de` is a seeded demo account.

See `SETUP.md` for local setup and `FRONTEND_PRIVACY_AUDIT.md` for the security/privacy posture.

## Stack

- **Next.js 14.0.4** (App Router with route groups) on **React 18**
- **TypeScript 5** (strict)
- **Tailwind CSS 3.3** — custom brand palette in `tailwind.config.js` (no shadcn/ui)
- **Prisma 5.7** + **PostgreSQL** (Neon — uses `DIRECT_URL` for migrations)
- **NextAuth 4.24** — Credentials provider, JWT sessions, secure cookies in prod
- **Stripe 22.1** (API version pinned to `2026-04-22.dahlia`) — checkout, webhook, billing portal
- **@vercel/blob** for document uploads, **Resend** for transactional email (falls back to AuditLog if `RESEND_API_KEY` is unset)
- **framer-motion**, **recharts**, **lucide-react**
- **Playwright** for e2e (CI via `.github/workflows/playwright.yml`)
- **Package manager: npm** (`package-lock.json`)

## Layout

```
app/
  (auth)/                    login / register / forgot-password / reset-password
  (dashboard)/               Protected app — gated by middleware
    dashboard/, candidates/, checks/, analytics/,
    settings/, audit/, addons/, clients/, integrations/
  api/
    auth/[...nextauth]/      NextAuth + forgot/reset password
    candidates/, checks/     CRUD + lifecycle
    stripe/                  checkout, webhook, portal
    gdpr/                    export, delete (DSGVO)
    demo/, sample-data/      Lazy-seed demo accounts
    upload/                  Vercel Blob upload
    admin/                   Schema sync recovery (guarded by INIT_SECRET)
    health/                  Liveness probe
  report/check/[id]/         PDF-friendly check view
components/
  dashboard/, layout/, landing/
lib/
  auth.ts, db.ts, db-init.ts (idempotent schema sync), email.ts,
  stripe.ts, addons.ts (SKU definitions), rate-limit.ts,
  logger.ts, env.ts, utils.ts, site.ts
prisma/
  schema.prisma              See "Data model"
  migrations/                0_init + 20260515_add_stripe_subscription
tests/                       Playwright e2e (skeleton)
.claude/skills/, .agents/skills/   Pre-installed design skills (not wired to hooks)
```

## Scripts

```
npm run dev          # next dev (localhost:3000)
npm run build        # prisma generate && next build
npm run start        # production
npm run lint         # next lint (ESLint 8 + eslint-config-next)
npm run db:push      # prisma db push  (preferred over migrate deploy — see below)
npm run db:studio    # prisma studio
# postinstall runs `prisma generate` automatically
```

### Build / DB quirks (read git log before changing these)

The Vercel build command has been iterated several times and currently relies on `prisma db push` rather than `prisma migrate deploy`:
- `prisma migrate deploy` hit P3005 baseline errors on the Neon DB → switched to `db push`.
- Migrations require `DIRECT_URL` (the pooled `DATABASE_URL` hangs).
- The Stripe subscription columns were added with `--accept-data-loss` because adding a unique constraint to existing data triggered the safety check.

Do not change the build command without understanding why these flags exist.

## Data model (prisma/schema.prisma)

`User` (plan, planStatus, Stripe customer/subscription IDs, trial/period ends) → `Candidate` → `ReferenceCheck`, `Document`. Plus `GdprConsent` (consent type, IP, userAgent), `AuditLog`, `PasswordResetToken` (SHA-256 hashed, 60-min TTL, one-shot), `AddonOrder` (SKUs like `SINGLE_CHECK`, `CHECK_PACK_5`).

## Auth & security

- **NextAuth credentials** with bcrypt. JWT sessions, 24h maxAge, 1h updateAge. Secure `__Secure-next-auth.session-token` cookie in prod.
- **`middleware.ts`** does two things: (1) gates `PROTECTED_PREFIXES` (`/dashboard`, `/candidates`, `/checks`, `/settings`, `/audit`, `/addons`, `/analytics`, `/report`, `/integrations`, `/clients`) behind a valid session, and (2) injects a **per-request nonce-based CSP**:
  - `script-src 'self' 'nonce-{nonce}' 'strict-dynamic' https://js.stripe.com https://va.vercel-scripts.com`
  - `style-src 'self' 'nonce-{nonce}'`
  - `frame-src https://js.stripe.com https://hooks.stripe.com`
  - Dev mode allows `'unsafe-eval'` for HMR
- **`next.config.js`** adds static security headers: HSTS (2y, preload), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, restrictive `Permissions-Policy`, `Cache-Control: no-store` on API routes.
- **Rate limits** (`lib/rate-limit.ts`): registration 5/h, demo login 10/10min, forgot-password 5/h — all per IP.
- **Password reset**: 32-byte random token, SHA-256 hashed in DB, 60-min TTL, `usedAt` enforces one-shot. Forgot-password endpoint returns generic response (no user enumeration).

**Do not weaken CSP, HSTS, or rate limits without explicit user approval** — these are part of the launch-readiness hardening (see commits `5f291c7` and `fdbb84f`).

## DSGVO / GDPR

- `GdprConsent` model logs every consent with IP + userAgent.
- `/api/gdpr/export` returns JSON of user + related records; `/api/gdpr/delete` performs soft-cascade deletion. Both are exposed from `/settings`.
- `AuditLog` is the audit trail for all sensitive actions — write to it from new mutations.

## Stripe / billing

- Server SDK in `lib/stripe.ts` (price IDs sourced from env per plan + billing cycle).
- Routes: `/api/stripe/checkout` (hosted checkout), `/api/stripe/webhook` (handles `customer.subscription.updated/deleted`), `/api/stripe/portal` (billing portal redirect).
- Add-ons in `lib/addons.ts` (single-check + check packs) create `AddonOrder` rows.
- API version is **pinned** to `2026-04-22.dahlia` — don't bump without testing webhooks.

## Conventions

- Path alias **`@/*`** maps to repo root.
- All user-facing copy is **German**. Maintain it.
- No shadcn/ui — components are hand-built using Tailwind + framer-motion. Brand colors live in `tailwind.config.js` (Indigo/Violet primary; semantic bg/border tokens). Fonts: Inter (body) + JetBrains Mono.
- Use the structured `logger` from `lib/logger.ts`, not raw `console.log`.
- Validate env at boot via `lib/env.ts` rather than `process.env.X!` inline.

## Environment (`.env.example`)

`DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY` (optional), `EMAIL_FROM`, `EMAIL_REPLY_TO`, `INIT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, plus `STRIPE_PRICE_{STARTER,PROFESSIONAL,BUSINESS}[_YEARLY]`.

## Testing

- Playwright projects: chromium / firefox / webkit. Trace on first retry, HTML reporter.
- CI (`.github/workflows/playwright.yml`) runs on push/PR to `main`/`master` with 2 retries.
- Only a skeleton test exists in `tests/example.spec.ts` — add coverage when changing user-facing flows.
- No unit-test framework is installed.

## Pre-installed skills

`.claude/skills/ui-ux-pro-max/` and `.agents/skills/huashu-design/` contain design-system reference data and prompts. They are **not** wired into `.claude/settings.json` hooks — invoke explicitly via the `Skill` tool when needed.

## Git workflow for AI assistants

- Develop on the branch specified by the harness (e.g. `claude/...`). Do not push to `main`.
- Use `git push -u origin <branch>`; retry network failures with exponential backoff (2/4/8/16s).
- Do **not** open PRs unless the user explicitly asks.
- Commit message style from history: conventional commits in German or English (`feat(billing): …`, `fix(build): …`, `docs(audit): …`). Keep them descriptive about the *why*.

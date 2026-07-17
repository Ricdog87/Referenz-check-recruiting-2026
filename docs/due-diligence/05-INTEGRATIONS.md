# 05 — Integrationen

**Stand:** 2026-07-17. Je Integration: Zweck · real/mock · Datenfluss · Lock-in/Kündbarkeit.

## Stripe (Billing) — **real, produktiv**
- **Zweck:** Subscriptions (3 Plan-Tiers × monthly/yearly) + One-time-Add-ons.
- **Fluss:** `POST /stripe/checkout` → Stripe Checkout → **Webhook** (`/stripe/webhook`, signaturgeprüft via `constructEvent`) → `user.update{plan,planStatus,currentPeriodEnd}`. Add-ons idempotent (Unique `stripeSessionId`). API-Version gepinnt (`2026-04-22.dahlia`).
- **Tests:** 7 (Signatur, Idempotenz, Status-Mapping, payment_failed).
- **Lock-in:** mittel (Standard-Stripe-Objekte, Portugierbarkeit üblich). **Offen:** kein Reconciliation-Cron für verpasste Events (G6).
- **Env:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`.

## Resend (E-Mail) — **real, produktiv**
- **Zweck:** alle Transaktionsmails (Consent-Invite, Welcome, Reset, Report-Zustellung, Art.-14-Referenzgeber, Partner-Aktionen).
- **Fluss:** `lib/email.ts` (zentrale Fassade + Templates via `shell()`). Ohne `RESEND_API_KEY` → Log-Only-Fallback (in Prod error-Level).
- **Lock-in:** niedrig (HTTP-API, austauschbar).
- **Env:** `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`.

## Vercel Blob (Storage) — **real, produktiv**
- **Zweck:** CV-/Zeugnis-Uploads, Report-PDFs, Partner-Co-Brand-Logos.
- **Fluss:** `put()` beim Upload; Lesen via Stream-Proxy (`documents/[id]`) — Blob-URL wird nie geleakt. Löschen via `del()` (R2).
- **Offen (R3):** aktuell `access: 'public'` (v0.22 kann nur public); Migration auf private Blobs = eigenes Vorhaben (Runbook in `00-AUDIT_REPORT.md`).
- **Lock-in:** mittel (Vercel-spezifisch; S3-Migration möglich, Pfad-Schema stabil).

## Anthropic / OpenAI (CV-KI) — **real, flag-gated (default OFF)**
- **Zweck:** CV-Plausibilitäts-/Diskrepanz-Analyse (`lib/cv-analysis/*`).
- **Fluss:** nur wenn `CV_ANALYSIS_LLM_ENABLED=true`; Anthropic primär, OpenAI-Fallback. Ohne Flag: deterministische Checks (safe fallback).
- **Lock-in:** niedrig (provider-agnostisch, DI-fähig).
- **Env:** `CV_ANALYSIS_LLM_ENABLED`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, Model-Overrides.

## HubSpot (CRM) — **real, optional**
- **Zweck:** Lead-/Pilot-Sync, Hot-Lead-Scoring aus AI-Concierge.
- **Fluss:** `lib/hubspot.ts`; ohne `HUBSPOT_API_KEY` No-Op.
- **Lock-in:** niedrig (optional, entkoppelt).

## ElevenLabs (Voice-Demo) — **real, Marketing**
- **Zweck:** Live-Sprachagent im Landing-Hero (`VoiceConsole.tsx`).
- **Offen:** Agent-ID hardcoded, kein Quota-Fallback (G23).
- **Lock-in:** niedrig (isolierte Demo-Komponente).

## zvoove (ATS-Integration) — **flag-gated (default OFF), Demo gegen Mock lauffähig**
- **Status:** Phase 1 (aus PR #137) auf `feat/dd-readiness` **integriert + rebased** + **Phase 2 (Demo)** ergänzt: Sync-Service, API-Routes (`connect`/`import`/`push-result`), Settings-UI. Hinter `INTEGRATION_ZVOOVE_ENABLED` (default off).
- **Realität gegen echten Tenant:** weiterhin 0 % — alle Endpunkte sind `TODO(zvoove-doc):`-Platzhalter, nicht gegen echtes zvoove verifiziert. **Demo-Modus** (`INTEGRATION_ZVOOVE_DEMO=true`) fährt den vollen candiq-Flow (Import → Consent → Check → Rückschreiben) gegen einen In-Memory-Mock.
- **Consent-Gate:** Import läuft zwingend durch den `consent-guard` — Kandidaten starten `gdprConsent=false`/`PENDING`, Checks `OPEN`. Getestet (`zvoove-sync.test.ts`).
- **Verschlüsselung:** AES-256-GCM-Credential-Vault (`encryptSecret`, strict bei fehlendem `INTEGRATION_ENC_KEY`); API-Key nur als Envelope + Fingerprint in der DB.
- **Was für Live fehlt:** echte API-Doku/Swagger + Auth-Schema + Sandbox-Tenant + Sync-Mechanismus (Polling/Webhook) + AVV-Update. Details: `docs/partnerships/zvoove/`.

## Google Analytics — **real, consent-gated**
- Nur nach Cookie-Einwilligung (`NEXT_PUBLIC_GA_ID`); ohne ID kein gtag.

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

## zvoove (ATS-Integration) — **PHASE 1 in offenem PR #137, NICHT in `main`**
- **Status:** `lib/integrations/zvoove/{types,client,mapper,consent-guard}.ts`, `lib/crypto/aes-gcm.ts`, MockClient, 33 Tests, README — **modularisiert, aber unmerged, auf altem Base (Rebase nötig)**.
- **Realität:** In-Produktion 0 %. Phase 1/6 (API-Routes, Sync, UI, Cron fehlen). Mock-First mit `TODO(zvoove-doc):`-Markern.
- **Verschlüsselung:** AES-GCM-Credential-Vault vorbereitet (`encryptSecret`, strict bei fehlendem `INTEGRATION_ENC_KEY`).
- **DD-Hinweis:** Falls zvoove im Deal zugesichert wurde, ist der Reifegrad (Phase 1, unmerged) explizit zu adressieren.

## Google Analytics — **real, consent-gated**
- Nur nach Cookie-Einwilligung (`NEXT_PUBLIC_GA_ID`); ohne ID kein gtag.

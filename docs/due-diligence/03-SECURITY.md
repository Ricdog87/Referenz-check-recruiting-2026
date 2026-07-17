# 03 — Sicherheit

**Stand:** 2026-07-17 · Basis: `feat/dd-readiness`.

## Auth-Modell — drei getrennte Vertrauensdomänen

| Domäne | Mechanismus | Cookie / Token | Datei |
|---|---|---|---|
| **HR-Nutzer** | NextAuth Credentials (bcrypt cost 12) | `__Secure-next-auth.session-token` | `lib/auth.ts` |
| **Partner** | Eigene NextAuth-Instanz, eigener Provider | `__Secure-next-auth.partner-session-token` | `lib/partner/auth.ts` |
| **Bewerber** | HMAC-signierter Magic-Link (kein Passwort) | Token in URL, nur SHA-256-Hash in DB | `lib/consent-token.ts` |

**Isolation:** Der Partner-`session()`-Callback ersetzt `session.user` durch `undefined` und schreibt nur `session.partner` — kein Cross-Domain-Leak von `role`/`plan`. Getrennte Cookie-Namen erlauben parallele Sessions ohne Kollision.

**Session-Härtung (nach DD-Fixes):**
- **60s-DB-Refresh** in beiden JWT-Callbacks: Status/Tier bzw. Plan werden nachgeladen; `passwordChangedAt > token.iat` → Token entwertet (kompromittierte Session stirbt ≤1 min bzw. ≤1 h statt 24 h). Gelöschter Account → Token entwertet.
- **Login-Rate-Limit** (`lib/login-guard.ts`): 10/15 min je IP + je Email, HR + Partner.
- **Passwortwechsel** (HR + Partner): aktuelles Passwort erforderlich + In-Memory-Limit + **durabler DB-Fehlversuchszähler** (5/h vor bcrypt) → schützt das Passwort-Orakel instanzübergreifend.

## App-Layer-Enforcement statt RLS (bewusste Entscheidung)

candiq verbindet sich via Prisma als Postgres-Owner-Rolle (RLS-Bypass). Eine Supabase-RLS-Policy wäre **Scheinsicherheit**. Zugriffskontrolle läuft daher zentral im App-Layer:

- **`lib/cv-gate.ts`** ist die *einzige* Entscheidungsstelle für CV-Content. Reviewer brauchen zwingend `cvStatus === RELEASED`; getestet in `__tests__/cv-gate.test.ts`.
- **`lib/partner/scope.ts`** (`withPartnerScope`) wirft bei leerem Scope; in allen Partner-Datenrouten Pflicht.
- Alle HR-Datenrouten sind `session.user.id`-gebunden (`findFirst({ where: { id, userId } })`).
- **IDOR-Fix (R1):** `documents/[id]` blockt jetzt jeden Nicht-Owner-Nicht-Reviewer für **alle** Dokumenttypen (vorher nur CV).

Begründung dokumentiert im Code (`lib/cv-gate.ts:6-16`). Das ist konsistent über die gesamte Codebase und mit ~180 Vitest-Fällen abgesichert.

## Secret-Handling
- **Alle** Secrets aus ENV; `lib/env.ts` erzwingt `NEXTAUTH_SECRET ≥ 32` in Prod.
- Secret-Scan über die **volle Git-Historie**: keine Live-Token, nie eine echte `.env` committed, keine Hardcodes.
- `.env` in `.gitignore`; CI-Gate `gitleaks` (`.github/workflows/ci.yml`).
- KI-CV-Analyse hinter `CV_ANALYSIS_LLM_ENABLED` (default off) — Config-Kill-Switch für externen Datenabfluss.

## Verschlüsselung
- **In transit:** HTTPS erzwungen (`upgrade-insecure-requests`, HSTS `max-age=2y; includeSubDomains; preload`).
- **At rest:** Postgres (Supabase-managed, EU) + Vercel Blob (EU) — provider-seitige Verschlüsselung.
- **App-seitig:** Passwörter bcrypt (cost 12); Consent-/Reset-Tokens nur als SHA-256-Hash gespeichert; Consent-Token HMAC-signiert mit `NEXTAUTH_SECRET`.
- **AES-GCM** für externe Integration-Credentials (`lib/crypto/aes-gcm.ts`) liegt im zvoove-PR #137 (noch nicht in `main`).

## HTTP-Sicherheit
- **CSP** (`middleware.ts`): Per-Request-Nonce, `script-src 'self' 'nonce-…' 'strict-dynamic'`, explizite Host-Allowlists (Stripe, HubSpot, Vercel), `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`.
- **Statisch** (`next.config.js`): HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, restriktive Permissions-Policy.
- Bekannter Trade-off: `style-src 'unsafe-inline'` neben Nonce (Framer-Motion-Kompat) — s. `09-KNOWN_ISSUES.md` G22.

## Bekannte Sicherheits-Residuen
Siehe `09-KNOWN_ISSUES.md`: R3 (Blobs `public`, kompensiert durch Stream-Proxy + R1), G3 (Rate-Limiter in-memory → Upstash geplant), G6 (Stripe-Reconciliation), 1 Next-DoS-High (→ Next-16-Migration).

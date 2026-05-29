# Sprint Report — Production-Readiness vor erstem zahlenden Kunden

**Sprint-Datum:** 2026-05-28
**Base-Branch:** `main` (Commit `4b376e0`, „fix(consent): HR-Notification-Mails awaiten" #31)
**Sprint-Scope:** 4 separate Compliance/A11y-PRs vor erstem Pilotkunden

---

## Übersicht — 4 PRs, alle offen, Reviews stehen aus

| PR | Topic | Branch | Status | Files | LoC |
|---|---|---|---|---|---|
| [#32](https://github.com/Ricdog87/Referenz-check-recruiting-2026/pull/32) | `fix(legal)` Datenschutzerklärung Tracker-Hinweise entfernen | `fix/legal-tracker-cleanup` | 🟡 open · review pending | 1 | +16 / −20 |
| [#33](https://github.com/Ricdog87/Referenz-check-recruiting-2026/pull/33) | `feat(a11y)` Skip-Link für BFSG-Compliance | `feat/a11y-skip-link` | 🟡 open · review pending | 14 | +57 / −39 |
| [#34](https://github.com/Ricdog87/Referenz-check-recruiting-2026/pull/34) | `fix(register)` AGB + Datenschutz entkoppeln (Planet49) | `fix/register-consent-split` | 🟡 open · review pending | 2 | +118 / −24 |
| [#35](https://github.com/Ricdog87/Referenz-check-recruiting-2026/pull/35) | `feat(compliance)` Auto-Lösch-Cron nach 180 Tagen | `feat/compliance-cleanup-cron` | 🟡 open · review pending | 5 | +177 / −2 |

**Gesamtumfang:** 22 Files touched, ~+370 / −90 Zeilen, 1 neue Route (`/api/cron/cleanup`).

---

## PR #32 — `fix(legal)`: Datenschutzerklärung Tracker-Hinweise entfernen

**Befund:** Vercel Web Analytics + Speed Insights wurden in PR #18 entfernt, die Datenschutzerklärung listete sie aber unter §9 + §10 weiter als aktive Empfänger → unwahre DSGVO-Angabe + Abmahnungsrisiko.

### Touched Files
- `app/datenschutz/page.tsx`

### Definition of Done — Status

| Check | Ergebnis |
|---|---|
| `grep -rE "Vercel Analytics\|Speed Insights\|analytics\.vercel\|vitals\.vercel\|va\.vercel" app/datenschutz/` | ✅ 0 Treffer |
| Alle DS-Domains stehen im CSP-Whitelist | ✅ — nur `stripe.com` verbleibt referenziert, alle Stripe-Subdomains in `middleware.ts` whitelisted |
| `tsc --noEmit` | ✅ 0 Errors |
| Build `npm run build` lokal | ⚠️ nicht ausgeführt — erfordert echte `DATABASE_URL` (`vercel.json` macht `prisma db push` im buildCommand). Reine Markdown/JSX-Textänderung, kein TS-Logik-Pfad betroffen. |

### Smoke-Test nach Merge (zu erledigen)

- [ ] `/datenschutz` lädt
- [ ] Sektionen 1–11 ohne Lücke
- [ ] „Vercel Web Analytics" / „Speed Insights" tauchen nicht mehr im Text auf
- [ ] „Stand: **28. Mai 2026**" sichtbar

### Out-of-Scope, dokumentiert
`middleware.ts:61` hat noch tote Tracker-Domains im CSP `connect-src` (`vitals.vercel-insights.com`, `va.vercel-scripts.com`). 2-Zeilen-Cleanup, sollte separater PR `fix/csp-tracker-domains` werden.

---

## PR #33 — `feat(a11y)`: Skip-Link für BFSG-Compliance

**Befund:** BFSG-Pflicht seit Juni 2025 — Tastatur-Nutzer:innen müssen Navigation überspringen können. Skip-Link fehlte komplett.

### Touched Files (14)

| File | Was |
|---|---|
| `app/layout.tsx` | Skip-Link `<a href="#main">` als erstes `<body>`-Element |
| `app/(dashboard)/layout.tsx` | `id="main"` am existierenden `<main>` |
| `app/(auth)/layout.tsx` | Inner Content-Bereich auf `<main id="main">` umgestellt |
| `components/landing/LegalShell.tsx` | Content in `<main id="main">` gewrappt (deckt /datenschutz, /agb, /impressum ab) |
| `app/page.tsx`, `app/preise/page.tsx`, `app/demo/page.tsx`, `app/waitlist-agency/page.tsx` | `<main id="main">` zwischen LandingNav und LandingFooter |
| `app/termin/page.tsx` | `id="main"` am existierenden `<main>` |
| `app/report/check/[id]/page.tsx` | `id="main"` am existierenden `<main>` |
| `app/candidate/[token]/page.tsx`, `app/candidate/[token]/ConsentPortalClient.tsx` | `id="main"` an allen 4 Rendering-Zuständen (Error + 3 Portal-States) |
| `app/error.tsx`, `app/not-found.tsx` | Top-Level `<div>` auf `<main id="main">` umgestellt |

### Definition of Done — Status

| Check | Ergebnis |
|---|---|
| `<a href="#main">` als erstes `<body>`-Element | ✅ `app/layout.tsx:121` |
| Genau ein `<main id="main">` pro Route, keine Doppel-`<main>` | ✅ 14 Stellen, eine pro Route |
| Tailwind `sr-only` + `focus:not-sr-only` aktiv | ✅ Core-Utilities, keine Config-Änderung |
| `tsc --noEmit` | ✅ 0 Errors |

### Smoke-Test nach Merge (Browser, manuell)

Auf candiq.de, **Tab-Taste** auf jeder Route — Skip-Link muss als allererstes oben links erscheinen:
- [ ] `/`, `/preise`, `/demo`, `/waitlist-agency`, `/termin`
- [ ] `/datenschutz`, `/agb`, `/impressum`
- [ ] `/login`, `/register`, `/forgot-password`
- [ ] `/dashboard`, `/candidates`, `/settings` (eingeloggt)
- [ ] `/candidate/<token>` (Bewerber-Portal)
- [ ] `/report/check/<id>` (eingeloggt)
- [ ] 404 (`/asdf`)
- [ ] **Enter auf Skip-Link** → Fokus springt zum Content

---

## PR #34 — `fix(register)`: AGB + Datenschutz entkoppeln

**Befund:** Register-Form bündelte AGB-Akzeptanz und Datenschutz-Kenntnisnahme in einer Checkbox → verstößt gegen EuGH Planet49 (C-673/17) + DSGVO Art. 7. Beide sind rechtlich unterschiedliche Handlungen.

### Touched Files (2)

| File | Was |
|---|---|
| `app/(auth)/register/page.tsx` | `gdprAccepted`-State → `acceptTerms` + `acceptPrivacy`. Zwei separate `<label>`-Blöcke mit `name="accept_terms"` / `"accept_privacy"`, ARIA-konform, `target="_blank"` + ↗ + Hilfetext, Submit-Button bleibt disabled bis beide Häkchen |
| `app/api/auth/register/route.ts` | Body-Validation pro Feld einzeln, 400 mit `field`-Hinweis; `gdprConsents.create` schreibt jetzt 2 Records (`TERMS_ACCEPT_v1.0`, `PRIVACY_NOTICE_v1.0`); zusätzlicher AuditLog-Entry mit `action="REGISTRATION_CONSENT"`, `details="terms_version=1.0 privacy_version=1.0"`; Versions-Konstanten `TERMS_VERSION` / `PRIVACY_VERSION` oben in der Datei |

### Definition of Done — Status

| Check | Ergebnis |
|---|---|
| Beide Checkboxen im DOM separat | ✅ `name="accept_terms"` (Z. 325), `name="accept_privacy"` (Z. 352) |
| Submit ohne eine der beiden → API 400 mit klarer Field-Hinweis | ✅ `route.ts:73-84` |
| Erfolgreicher Submit → `AuditLog` mit `REGISTRATION_CONSENT` + Versions-Detail | ✅ `route.ts:158-167` |
| `grep "gdprAccepted"` in Frontend + Backend | ✅ 0 Treffer |
| Hilfetext „öffnet in neuem Tab" | ✅ am AGB-Label |
| `tsc --noEmit` | ✅ 0 Errors |

### Smoke-Test nach Merge

- [ ] `/register` zeigt **zwei separate** Checkbox-Karten (nicht eine gebündelte)
- [ ] Submit mit nur einem Häkchen → klare Fehlermeldung welche fehlt
- [ ] Erfolgreicher Signup → DB hat 2× `GdprConsent` (`TERMS_ACCEPT_v1.0`, `PRIVACY_NOTICE_v1.0`) + 2× `AuditLog` (`REGISTRATION`, `REGISTRATION_CONSENT`) für den neuen User
- [ ] AGB-Link öffnet `/agb` in neuem Tab, Datenschutz-Link öffnet `/datenschutz` in neuem Tab
- [ ] Tastatur-Test: Tab → erste Checkbox, Space toggelt, Tab → zweite Checkbox, Space toggelt

---

## PR #35 — `feat(compliance)`: Auto-Lösch-Cron nach 180 Tagen

**Befund:** `candiq.de` verspricht „Daten werden spätestens nach 6 Monaten automatisch gelöscht" — aber kein Job setzt das um. Unwahre Compliance-Aussage + Risiko gem. Art. 5 (1) e DSGVO.

### Touched Files (5)

| File | Was |
|---|---|
| `app/api/cron/cleanup/route.ts` | **Neu** — GET/POST mit Bearer-Auth, Prisma-Transaction (ConsentToken-expire + Candidate-Cascade-Delete), AuditLog-Entry pro Run |
| `vercel.json` | `crons: [{ path: "/api/cron/cleanup", schedule: "0 3 * * *" }]` + `maxDuration: 60` für den Endpoint |
| `.env.example` | Neue Variable `CRON_SECRET` mit `openssl rand -base64 32` Hinweis |
| `SETUP.md` | Neuer Abschnitt „DSGVO Auto-Löschung (Cron)" mit Vercel-Setup-Schritten + curl-Smoke-Test |
| `app/datenschutz/page.tsx` | Neuer Absatz in §11 (Aufbewahrungsfristen): „Automatische Löschung nach 180 Tagen … Cron um 03:00 UTC … wird im Audit-Log protokolliert." |

### Cleanup-Logik

| Tabelle | Wird gelöscht | Wird NICHT gelöscht |
|---|---|---|
| `ConsentToken` | `expiresAt < now - 180d` (hard) + Cascade-Anhängsel von gelöschten Candidates | |
| `Candidate` | `createdAt < now - 180d` AND `status ∈ {COMPLETED, REJECTED, CONSENT_REVOKED}` | `PENDING`, `IN_REVIEW`, `CONSENT_GIVEN` (laufende Fälle) |
| `Document`, `ReferenceCheck` | via Cascade durch Candidate-Delete | |
| `AuditLog` | **nie** | (Nachweispflicht Art. 7 + § 257 HGB) |
| `User`, `AddonOrder` | **nie** | (§ 147 AO, 10 Jahre für Rechnungen) |

### Definition of Done — Status

| Check | Ergebnis |
|---|---|
| Endpoint mit valider Bearer → 200 mit `{ ok: true, deleted: {...} }` | ✅ `route.ts:128-133` |
| Endpoint ohne Bearer → 401 + `WWW-Authenticate: Bearer` | ✅ `unauthorized()` early return |
| `vercel.json` enthält `crons` + `maxDuration` für Cleanup | ✅ JSON validiert mit `python3 -m json.tool` |
| `.env.example` enthält `CRON_SECRET` mit Anleitung | ✅ |
| AuditLog-Entry pro Run, auch bei 0 Löschungen | ✅ `route.ts:104-114` schreibt unbedingt |
| Schema-Migration nötig | **Nein** — `AuditLog.action` ist String, additive only |
| `SETUP.md` erwähnt Cron-Validierung in Vercel | ✅ neuer Abschnitt mit curl-Probe |
| `tsc --noEmit` | ✅ 0 Errors |

### DevOps-Schritte nach Merge ⚠️

Der Cron läuft **erst**, wenn diese 3 Schritte auf Vercel erledigt sind:

1. **Env-Variable setzen:** Vercel → Project Settings → Environment Variables → `CRON_SECRET` für **Production** + **Preview** (`openssl rand -base64 32`)
2. **Deploy** (geschieht nach Merge automatisch)
3. **Verifizieren:** Vercel → Project Settings → **Cron Jobs** zeigt `/api/cron/cleanup` mit Schedule `0 3 * * *`

### Smoke-Test nach Deploy

```bash
# Ohne Bearer → erwartet 401
curl -i https://candiq.de/api/cron/cleanup

# Mit Bearer → erwartet 200 + JSON-Body mit deleted-Counts
curl -i -H "Authorization: Bearer $CRON_SECRET" https://candiq.de/api/cron/cleanup
```

Nach 24h: DB hat einen neuen `AuditLog`-Record mit `action="AUTO_CLEANUP_180D"` und `details="candidates=X tokens=Y documents=Z checks=W"`.

---

## Bekannte Risiken / Blockers

### Build-Verifikation nur teilweise möglich
Lokales `npm run build` ist nicht ausgeführt worden, weil `vercel.json` im Build-Command `prisma db push --skip-generate --accept-data-loss` ausführt und damit eine echte `DATABASE_URL` zu Neon braucht. Statt dessen wurde **`tsc --noEmit`** auf jedem Branch gegen die echten Prisma-Typen geprüft — alle 4 Branches: **0 TypeScript-Errors**.

Empfehlung: vor Merge in einem Vercel Preview Deploy validieren — Preview-Build deckt den vollen Pfad ab.

### Merge-Reihenfolge
- **PR #32** und **PR #35** editieren beide `app/datenschutz/page.tsx`. Beide ändern aber unterschiedliche Sektionen (PR #32 = §5/§9/§10/§11/§12, PR #35 = §11 Absatz-Erweiterung). Sollte konfliktfrei mergen. Falls Konflikt: PR #32 zuerst, dann PR #35 rebasen.
- **PR #33, #34**: keine Datei-Überschneidung mit anderen.
- **PR #34**: Schema-Migration nicht nötig (additive String-Konstanten in `GdprConsent.type` und `AuditLog.action`).
- **PR #35**: Schema-Migration nicht nötig.

### Smoke-Tests sind Browser-Manual
Ich (Claude Code in dieser Headless-Umgebung) habe keinen Browser — Skip-Link-Tab-Test, Console-CSP-Check, Cron-Aufruf gegen Live-Endpoint müssen manuell auf Vercel Preview oder Production nachgezogen werden. Jede PR-Description listet die konkreten Smoke-Test-Punkte.

---

## Sprint-Befund: Was als Nächstes ansteht (nicht Teil dieses Sprints)

Nicht im Scope, aber gefunden und dokumentiert für Backlog:

1. **`fix/csp-tracker-domains`** — `middleware.ts:61` `connect-src` hat tote `vitals.vercel-insights.com` + `va.vercel-scripts.com` (von PR #18-Removal übriggeblieben). 2-Zeilen-Cleanup.
2. **`frontend/consent-ui-rebuild`** — Restlicher Audit-Cluster: New-Candidate-Form Single-Click-Consent, New-Check-Form fehlendes „Referenzperson informiert" — nicht in diesem Sprint adressiert.
3. **Stripe DPA & Webhook-Härtung** — für ersten zahlenden Kunden vor Live-Gang: Stripe-Webhooks Signature-Verification prüfen, DPA in Datenschutz noch detaillierter referenzieren (Speicherdauer 10 Jahre HGB).
4. **HubSpot Meeting-Embed** in Datenschutz erwähnen — wenn die Booking auf `/termin` weiterhin Pflicht ist (HubSpot-Iframe lädt mit Cookies). Aktuell nicht in der DS-Erklärung erwähnt.

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01BDFAnHrWT7pAA362bKqvfv

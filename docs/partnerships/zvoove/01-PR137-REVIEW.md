# PR #137 — zvoove-Integration: ehrliches Review

**Stand:** 2026-07-17 · Interne Bewertung für die Gesprächsvorbereitung. Nicht extern teilen.

> **Update (nach diesem Review umgesetzt):** Phase 1 aus PR #137 ist inzwischen
> auf `feat/dd-readiness` **integriert/rebased** (Konflikte gelöst, 33 Tests grün)
> **und um Phase 2 (Demo) ergänzt**: Sync-Service, API-Routes
> (`connect`/`import`/`push-result`), Settings-UI — hinter `INTEGRATION_ZVOOVE_ENABLED`
> (default off). Mit `INTEGRATION_ZVOOVE_DEMO=true` läuft der volle Flow gegen einen
> Mock. Der ursprüngliche PR #137 kann damit geschlossen werden (Inhalt ist übernommen).
> Das Folgende ist die ursprüngliche Bewertung von PR #137.

**PR:** [#137 „feat(zvoove): Phase 1"](https://github.com/Ricdog87/Referenz-check-recruiting-2026/pull/137) · Branch `feat/zvoove-integration` · Default OFF · 1 Commit, 11 Dateien, +1178.

## Kurzfazit

Ein **überdurchschnittlich sauberes Fundament** (Phase 1 von 6) — aber ausdrücklich **noch kein lauffähiges Interface**. Es ist die richtige Architektur mit echter Krypto, hartem Consent-Schutz und 33 Tests. Was fehlt, ist alles, was einen echten zvoove-Tenant berührt — und genau das braucht Input von zvoove.

## Was drin ist (und gut ist)

| Baustein | Bewertung |
|---|---|
| **Schema** (`ZvooveConnection`, `ZvooveCandidateMap`, `ZvooveSyncLog`) | Additiv, default off. API-Key **AES-256-GCM-verschlüsselt** (nur Envelope + Fingerprint in DB), SHA-256-Hash für Sync-Idempotenz, append-only SyncLog für DSGVO-Nachweis. Durchdacht. |
| **Krypto** (`lib/crypto/aes-gcm.ts`) | Korrektes AES-256-GCM (96-bit IV, 128-bit Auth-Tag, Tamper-Detection). Wirft strikt ohne `INTEGRATION_ENC_KEY` — kein Silent-Plain-Fallback. Solide. |
| **Consent-Guard** (`consent-guard.ts`) | Der wichtigste Teil: importierte Kandidaten starten zwingend `gdprConsent=false`, `status=PENDING`, CV `AWAITING_CONSENT`, Check `OPEN`. Asserts **werfen** bei Bypass. Genau die richtige Instinktlage. |
| **Mapper** (`mapper.ts`) | Reine Funktionen, keine Seiteneffekte, defensive Sanitization, Datenminimierung (keine Referenzgeber-Kontakte aus zvoove — die nennt der Bewerber selbst). |
| **Client** (`client.ts`) | Retry/Backoff (3×, exp), 429/5xx-Handling, 15 s-Timeout, **kein Key-/PII-Logging**. Interface-first (DI-tauglich, mockbar). |
| **Tests** (33) | Mapper, Consent-Guard (7!), Crypto, MockClient, Flags. Alle grün. |

## Was fehlt / die ehrlichen Lücken

1. **🔴 Alle API-Endpunkte sind Platzhalter.** Jeder Pfad (`/api/v1/me`, `/api/v1/candidates`), das Auth-Schema (`X-API-Key` vs. `Bearer`) und die Response-Formate sind `TODO(zvoove-doc):`-Annahmen aus generischer ATS-Konvention. Die echte Spec liegt laut PR **pro Tenant unter `<tenant>/swagger`**. → **Nichts ist gegen echtes zvoove verifiziert.** Das ist der zentrale Gesprächs-Ask.
2. **🟠 Nur Phase 1 von 6.** Es fehlen: API-Routes (`connect/import/push-result`), Sync-Orchestrierung (`sync.ts` mit Prisma-Layer), Settings-UI, Polling-Cron, Pilot gegen echten Tenant.
3. **🟠 PR ist stale + hat Konflikte.** `mergeable_state: dirty`, Base vom 18.06 — seither ist main stark gewachsen (DD-Readiness). Konkret kollidiert **`lib/flags.ts`** (im PR „added", existiert aber inzwischen in main mit `parseBool` + mehreren Flags). Auch `.env.example` und `prisma/schema.prisma` brauchen ein Rebase-Merge. → Muss auf aktuellen main rebased werden, bevor irgendwas mergen/demofähig ist.
4. **🟠 Consent-Guard ist nur so gut wie sein Aufrufer.** Die Assert-Funktionen sind top, greifen aber erst, wenn der (noch nicht geschriebene) Service-Layer in Phase 2 sie tatsächlich aufruft. In Phase 2 zwingend verdrahten + Route-Test.
5. **🟡 AVV/Subprozessor.** zvoove als optionaler Auftragsverarbeiter ist im AVV noch nicht ergänzt — Legal-Schritt vor Go-Live (nur wenn Kunde die Integration aktiviert).

## Zwei Wege nach vorn

**A — „Demofähig gegen Mock" (ohne zvoove-Zutun, ~1 fokussierter Sprint):**
Rebase auf main → Phase 2 Routes + minimale Settings-UI + `sync.ts` gegen den vorhandenen `MockZvooveClient`. Ergebnis: der **komplette candiq-Flow** (Import → Consent-Magic-Link → Check → Rückschreiben) läuft in der UI end-to-end — nur die Gegenstelle ist gemockt. Ideal, um zvoove die Integration **zu zeigen**, bevor deren Sandbox steht.

**B — „Live gegen echten Tenant" (braucht zvoove):**
Von zvoove: (1) API-Doku/Swagger, (2) Auth-Schema bestätigen, (3) Sandbox-/Test-Tenant, (4) Sync-Mechanismus (Polling vs. Webhook). Dann Platzhalter ersetzen → Pilot → AVV-Update → Prod-Schalter.

## Empfehlung

Für das Gespräch: **Weg A als Demo bauen** (zeigt Substanz, unabhängig von zvoove) und **Weg B als konkreten Ask** formulieren. Nicht den PR „schnell mergen" — erst rebasen; ein stale, teil-fertiger Merge in main würde die saubere DD-Story verwässern.

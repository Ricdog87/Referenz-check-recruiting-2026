# candiq — Tech Due-Diligence Audit Report (Phase 0)

**Stand:** 2026-07-17 · **Basis-Commit:** `7a6e368` (main) · **Branch:** `feat/dd-readiness`
**Methodik:** Read-only. Mechanische Scans (Secret-Scan über volle Git-Historie, `npm audit`, `license-checker`) + vier parallele Deep-Dive-Analysen (Auth/IDOR, DSGVO/Datenflüsse, Architektur/Tech-Debt, Tests/CI/Betrieb). Die zwei kritischsten Funde (IDOR, zvoove-Status) wurden manuell gegenverifiziert.

**Ampel-Konvention:** 🔴 ROT = Deal-Risiko / vor Signing zu adressieren · 🟡 GELB = Preisabschlag / Remediation-Verpflichtung · 🟢 GRÜN = sauber, als Stärke festhalten.

---

## Executive Summary

candiq zeigt für ein Produkt dieser Größe eine **überdurchschnittliche Grundhygiene**: saubere Secret-Historie, keine Copyleft-Lizenzen, strikte Nonce-CSP + vollständige Security-Header, sauber getrennte Auth-Domänen (HR/Partner), ein zentralisierter, gut getesteter Consent-/CV-Gate und eine disziplinierte Partner-Modul-Architektur mit ~93 Tests. Das ist eine gute Ausgangslage.

Es gibt jedoch **eine Handvoll harter Befunde, die ein Käufer-DD-Team finden und für einen Preisabschlag oder eine Vor-Signing-Auflage nutzen wird.** Die drei gewichtigsten betreffen alle den Kern des Produktversprechens (DSGVO-konforme Verarbeitung sensibler Bewerberdaten):

1. **Mandantentrennung ist auf einem Dokumenten-Pfad durchbrochen** (IDOR auf Zeugnisse/Referenzschreiben).
2. **Die tatsächliche Löschung von CV-Dateien funktioniert an keiner der beiden Kern-Löschstellen** — das zentrale „nach 6 Monaten automatisch gelöscht"-Versprechen ist für die Dateien selbst aktuell unwahr; zusätzlich liegen die CVs in einem `public`-Objektspeicher.
3. **Das Deployment fährt `prisma db push` gegen die Produktions-DB** — ein Datenverlust-/Drift-Risiko bei jedem Deploy, ohne Migrationskette/Rollback.

Keiner dieser Punkte ist ein struktureller Deal-Killer — alle sind mit überschaubarem Aufwand (S–L) fixbar. Aber sie sind **vor einer Käufer-DD zu schließen**, weil sie exakt in die Sorgfaltspflicht-Fragen eines HR-SaaS-Erwerbers fallen.

**Netto:** verkaufsreif-machbar in ~1–2 fokussierten Sprints. Nichts deutet auf verstecktes fundamentales Risiko hin (keine Secret-Leaks, keine Lizenz-Fallen, keine Architektur-Sackgasse).

---

## Ampel-Übersicht nach Dimension

| Dimension | Ampel | Kernaussage |
|---|:---:|---|
| Secret-Hygiene | 🟢 | Keine Live-Token in Historie, nie echte `.env` committed, keine Hardcodes |
| Lizenzen / IP | 🟢 | Kein GPL/AGPL; 235× MIT. Eigencode als `UNLICENSED` (proprietär, korrekt) |
| Auth-Modell (HR/Partner/Candidate) | 🟢 | Sauber getrennte Instanzen, isolierte Cookies + Session-Callbacks |
| **IDOR / Owner-Scoping** | 🔴 | Ein Dokument-Pfad ohne Mandanten-Check (non-CV Docs) — Rest sauber |
| Rate-Limits | 🟡 | Breite Abdeckung, aber Login + HR-Passwortwechsel ungedrosselt; in-memory |
| Security-Header / CSP | 🟢 | HSTS/XFO/nosniff + strikte Nonce-CSP mit `strict-dynamic` |
| **DSGVO — Löschung/Storage** | 🔴 | CV-Blob-Löschung kaputt (2 Stellen) + CVs `access:'public'` |
| DSGVO — Consent-Framework | 🟢 | HMAC-Token, gehasht, single-use, Widerruf inkl. CV-Sperre |
| **DSGVO — LLM-Datenfluss** | 🔴 | Echte CV-Inhalte an LLM; OpenAI nicht als Subprozessor disclosed |
| DSGVO — Doku (DSFA/TOM/RoPA) | 🟡 | Datenschutz/AVV vorhanden; DSFA/TOM/RoPA fehlen |
| **Dependencies** | 🔴 | `next@14.0.4`: 1 kritisches + 4 high npm-Advisories |
| **Deployment (`db push` gg. Prod)** | 🔴 | Schema-Sync ohne Migrationskette/Rollback bei jedem Build |
| **CI/CD** | 🔴 | Keine CI — kein automatisches Lint/Typecheck/Test/Build/Secret-Gate |
| Tests — Partner | 🟢 | 11 Dateien / ~93 Fälle, inkl. Isolation & Pricing |
| **Tests — Billing/Consent-Lifecycle** | 🟡 | Stripe-Webhook 0 Tests; Consent-Zustandsübergänge ungetestet |
| Billing-Robustheit | 🟡 | Webhook-Signatur ✅ + idempotent; kein Reconciliation-Cron |
| Betrieb — Monitoring/Backup/Incident | 🟡 | Health-Route ✅; kein Error-Tracking/Alerting/Backup-Runbook |
| zvoove-Integration | 🟡 | Phase 1/6 in offenem PR #137 (nicht in main, Rebase nötig) |
| Onboarding / Seeds | 🟡 | `SETUP.md` ✅; kein Demo-Seed, `.env.example` unvollständig |

---

## 🔴 ROT-Findings (Deal-Risiko — vor Signing adressieren)

### R1 — IDOR: Cross-Tenant-Read auf Nicht-CV-Dokumente ✅ BEHOBEN (Commit siehe `feat/dd-readiness`)
**Datei:** `app/api/documents/[id]/route.ts:30-72` + `lib/cv-gate.ts:60` · **Aufwand: S** · *manuell verifiziert*

> **Fix:** Mandanten-Gate in `app/api/documents/[id]/route.ts` ergänzt — wer weder Eigentümer noch Reviewer ist (`actor.kind === 'public'`), erhält jetzt für **jeden** Dokumenttyp 403 (mit Audit-Beleg), bevor der Stream-Proxy greift. `hasCvAccess()` bleibt unangetastet (Consent-Gate tabu). **Vorher:** non-CV-Docs (CERTIFICATE/REFERENCE/OTHER) fremder Mandanten streambar. **Nachher:** 403 + kein Blob-Fetch. **Test:** 2 Regressionstests in `__tests__/cv-gate.test.ts` (fremder HR-User auf Zeugnis → 403 ohne Fetch; eigener HR-User auf Zeugnis → 200). Suite 141/141 grün.

Die einzige inhaltsausliefernde Dokument-Route lädt das Dokument per `findUnique({ where: { id } })` **ohne** Ownership-Constraint und delegiert die gesamte Autorisierung an `hasCvAccess()`. Diese Funktion gibt für **jedes** Nicht-CV-Dokument bedingungslos frei:

```ts
// lib/cv-gate.ts:60
export function hasCvAccess(doc, actor) {
  if (doc.type !== 'CV') return { allowed: true }   // ← actor wird ignoriert
  ...
}
```

**Konsequenz:** Ein eingeloggter HR-User (Mandant A, Rolle CLIENT) kann per `GET /api/documents/<id>` Dokumente vom Typ `CERTIFICATE` / `REFERENCE` / `OTHER` **jedes fremden Kandidaten** (Mandant B) streamen — Arbeitszeugnisse, Referenzschreiben. Für `type='CV'` greift der Gate korrekt (Non-Owner → `public` → 403). Der Gate-Kommentar sagt selbst: „Non-CV-Dokumente … Andere Routen müssen ihre eigene Autorisierung halten" — genau diese Route tut das nicht.

**Mitigierend:** Dokument-IDs sind `cuid` (nicht durchzählbar), praktische Ausnutzung erfordert Kenntnis einer gültigen fremden ID (Leak via Referer/Logs/geteilte Links). Aber: „unguessable ID" ist Obscurity, keine Zugriffskontrolle — die AuthZ fehlt strukturell. Für ein DSGVO-Produkt mit Zeugnisdaten = OWASP-API-#1 (Broken Object Level Authorization).

**Fix-Skizze:** Owner-oder-Reviewer-Check in der Route ergänzen (der `isOwner`-Wert wird bereits berechnet, aber nur an den Gate durchgereicht), statt für non-CV-Docs auf den Gate zu vertrauen.

### R2 — CV-Dateien werden bei keiner Löschung tatsächlich entfernt (Blob-Leak) ✅ BEHOBEN
**Dateien:** `app/api/cron/cleanup/route.ts:92-96` · `app/api/gdpr/delete/route.ts:16-25` · **Aufwand: M**

> **Fix:** Neuer zentraler Helper `lib/blob-cleanup.ts` (`deleteBlobUrls` + `deleteBlobsByPrefix`, best-effort mit Fehler-Zählung, URL-Redaction im Log). **Cron-Cleanup:** sammelt `Document.path` + `ReferenceCheck.id` in der Transaction, löscht nach dem DB-Commit CV-/Zeugnis-Blobs (per URL) und Report-PDFs (per Prefix `reports/<checkId>/`, da nicht DB-getrackt); Audit-Details um `blobsDeleted/blobsFailed` erweitert. **gdpr/delete:** ersetzt den toten lokalen `rm(public/uploads/…)`-Pfad durch dieselbe Blob-Löschung nach dem User-Delete + `GDPR_ACCOUNT_DELETED`-Audit. Blob-Löschung erfolgt bewusst **nach** dem DB-Commit (kein Datei-Verlust bei Transaction-Rollback). **Test:** 8 Fälle in `__tests__/gdpr-blob-cleanup.test.ts` (Helper-Filterung/No-Token/Fehler-Zählung; Route: Reihenfolge collect→db-delete→blob-delete, 503 ohne Blob-Löschung bei DB-Fehler). Suite 149/149 grün.

- **Auto-Cleanup (180 Tage):** löscht nur DB-Zeilen (`candidate.deleteMany` + Cascade). **Kein `del()` gegen Vercel Blob.** Die CV-Dateien bleiben nach dem Löschlauf dauerhaft im Store. Das im Code zitierte Versprechen „Daten werden nach 6 Monaten automatisch gelöscht" ist damit für die Dateien selbst **unwahr**.
- **User-Art.-17-Löschung:** `gdpr/delete` löscht `public/uploads/{userId}` vom **lokalen Filesystem** — dort liegt seit der Blob-Umstellung nichts. Ergebnis: Account-Löschung entfernt DB-Daten, aber **alle CV-Blobs bleiben liegen**.
- **Positiv:** Der Bewerber-eigene Ersetzen-Pfad macht es korrekt (`consent/[token]/upload/[documentId]/route.ts:46` ruft `del(doc.path)`). Das Muster existiert im Repo — es fehlt nur an den zwei entscheidenden Stellen.

### R3 — CV-Blobs liegen `access: 'public'` 🟠 PLAN BEREIT · Live-Cutover GO-gated
**Dateien:** `app/api/upload/route.ts:68` · `app/api/consent/[token]/upload/route.ts:92` · `lib/check-report.tsx:155` · **Aufwand: M–L**

> **Warum nicht in Sprint 1 mitgefixt:** `@vercel/blob@0.22.3` (installiert) unterstützt **nur** `access: 'public'` — private Blobs + signierte URLs gibt es erst ab `@vercel/blob@2.x` (breaking API). Der Fix ist damit ein eigenes, live-berührendes Vorhaben, kein Einzeiler.
>
> **Runbook (empfohlen, GO-erforderlich):**
> 1. `@vercel/blob` 0.22 → 2.6 upgraden; die 4 `put()`-Call-Sites (upload, consent-upload, check-report, partner-co-brand) auf `access: 'private'` + `addRandomSuffix` migrieren.
> 2. Lese-Pfad: der Stream-Proxy (`documents/[id]`) holt die Datei bereits server-seitig — für private Blobs statt `fetch(doc.path)` einen kurzlebigen signierten Download-URL (`getDownloadUrl`/Token) erzeugen. Co-Brand-Logos (öffentlich gewollt) bleiben public.
> 3. **Daten-Migration der Bestands-Blobs:** einmaliges Skript, das existierende public Blobs nach privat kopiert und die `Document.path`/Report-Referenzen umschreibt (auf Staging trocken testen, dann Prod).
> 4. Voller Regressionslauf: CV-Upload → Consent-Release → Reviewer-Download → Report-PDF → Co-Brand.
>
> **Kompensierende Kontrollen bereits aktiv (Rest-Risiko gemindert):** Stream-Proxy leakt die Blob-URL nicht (kein 302-Redirect), `cuid`-Pfade nicht erratbar, und **R1 schließt jetzt die IDOR** — d. h. die App-Ebene ist dicht; das Rest-Risiko ist „URL abrufbar *falls* sie extern leakt". Vertretbar als kurzfristiger Zustand, vor Signing zu schließen.

Alle Uploads (CVs, Zeugnisse) und die Report-PDFs mit Bewertungsdaten landen in Vercel Blob mit `access: 'public'`. Die App-Layer-Kontrolle (Gate + Stream-Proxy) ist gut gebaut und leakt die URL nicht aktiv — aber die Blob-URL selbst ist **ohne jede Authentifizierung** abrufbar, sobald sie irgendwo auftaucht (Logs, Error-Tracking, Support, DB-Leak, Browser-History). Für Bewerber-CVs (potenziell Art.-9-nahe Daten) ist ein Public-ACL-Store ein hartes Finding. Der Stream-Proxy existiert bereits — Umstellung auf private Blobs + signierte, kurzlebige URLs ist der saubere Weg.

### R4 — OpenAI erhält echte CV-Daten, ist aber nicht als Subprozessor gelistet ✅ BEHOBEN (inkl. G13)
**Dateien:** `lib/cv-analysis/llmClaimAnalysis.ts:47-77` · `app/datenschutz/page.tsx` (fehlt) · **Aufwand: S**

> **Fix (Kombi mit G13):** (1) Neuer Master-Switch `isCvAnalysisLlmEnabled()` (`lib/flags.ts`, ENV `CV_ANALYSIS_LLM_ENABLED`, **default off**) gatet `callConfiguredLlm` — ohne explizite Aktivierung verlässt **kein** CV-Inhalt die Plattform Richtung Anthropic/OpenAI, auch nicht mit gesetztem Key; deterministische Checks bleiben maßgeblich. Gibt einem Betreiber/Käufer den Config-Kill-Switch für den externen Datenabfluss. (2) OpenAI als Subprozessor in `app/datenschutz/page.tsx` ergänzt (Ausweich-Modell, SCC, keine Trainings-Nutzung), Anthropic-Eintrag um SCC + Flag-Bedingung präzisiert. (3) `.env.example` dokumentiert das Flag. **Test:** `__tests__/cv-analysis.test.ts` — Flag-OFF beweist „kein LLM-Call trotz Key" (Client nie aufgerufen), deterministische Checks laufen weiter; Resilience-Test setzt Flag AN. Suite 150/150 grün.

Die CV-Analyse sendet Roh-CV-Text an eine LLM-API (`parseRawCvText`). Provider-Wahl: Anthropic wenn Key gesetzt, sonst **OpenAI-Fallback**. Der Sanitizer filtert nur AGG-Schlüsselwörter (Alter/Herkunft/Religion) — Name, Arbeitgeber, Ausbildung und die **Kontaktdaten der Referenzgeber** gehen ungefiltert raus. Anthropic ist in der Datenschutzerklärung disclosed, **OpenAI nicht** (0 Treffer), obwohl `.env.example` `OPENAI_API_KEY` ausliefert und der Code aktiv dorthin sendet. → Art.-13/14-Informationslücke + fehlende SCC-Nennung. Fix: entweder Doku ergänzen **oder** OpenAI-Fallback entfernen. Verwandt (GELB, G-Serie): die LLM-Analyse hat kein Feature-Flag und keine harte Kopplung an den `ACCEPTED`-Consent-Status.

### R5 — Veraltete Next.js-Version mit kritischem Advisory ✅ BEHOBEN (kritisch eliminiert; 1 DoS-High als dokumentierter Residual)
**Datei:** `package.json` (`next@14.0.4`) · **Aufwand: M**

> **Fix:** `next` 14.0.4 → **14.2.35** (pinned) — **eliminiert das kritische SSRF** in Server Actions. Transitive Highs via `overrides` (`undici ^6.27.0`, `minimatch ^10`) + direkter `postcss ^8.5.19`-Bump. **Ergebnis `npm audit`: critical 1→0, high 4→1, total 10→5.** Bewusst auf Next **14.2.x** geblieben (kein 15/16-Major-Sprung → minimales Regressionsrisiko): Build kompiliert (84 Seiten), 150/150 Tests, lint + tsc clean.
>
> **Dokumentierter Residual (ehrlich):** Das eine verbleibende `next`-High (DoS-Klasse: Image-Optimizer-remotePatterns + RSC-Deserialisierung) ist erst in **Next 16** (Major) gefixt. Der Image-Optimizer-Vektor betrifft primär self-hosted Deployments — candiq läuft auf managed Vercel. Empfehlung: Next-15/16-Migration als **separates Epic** planen, nicht DD-blockierend. Die 4 verbleibenden Moderates (js-yaml, next-auth, postcss, uuid) sind Dev-/Build-Chain und erfordern Major-Bumps der jeweiligen Deps — als Wartungs-Backlog geführt.

`npm audit`: **1 kritisch** (Next.js SSRF in Server Actions), **4 high** (undici unbounded decompression, minimatch ReDoS, 2× @typescript-eslint), 5 moderate. `next@14.0.4` ist ~14 Minor-Releases alt. Die Ausnutzbarkeit des SSRF hängt von der Server-Actions-Nutzung ab (zu prüfen), aber eine öffentlich bekannte kritische Schwachstelle in der Kern-Framework-Version ist ein Standard-DD-Flag. Empfehlung: kontrolliertes Upgrade auf aktuelles Next 14.2.x (oder 15) + `undici`/`minimatch`-Bumps.

### R6 — Deployment fährt `prisma db push` gegen die Produktions-DB 🟠 RUNBOOK BEREIT · Prod-Baseline GO-gated
**Datei:** `vercel.json` (buildCommand) · **Aufwand: M–L**

> **Warum nicht blind umgestellt:** Ein Flip von `db push` auf `migrate deploy` **ohne** vorheriges Prod-Baseline-Resolve würde den **nächsten Deploy zum Absturz bringen** — `migrate deploy` fände keine `_prisma_migrations`-Historie und versuchte, alle Migrationen gegen bereits existierende Tabellen anzuwenden (Konflikt). Die Reihenfolge ist zwingend, der Baseline-Schritt ist ein **Prod-Event** (GO-gated per Guardrail).
>
> **Runbook (empfohlen, GO-erforderlich):**
> 1. Sicherstellen, dass `prisma/migrations/*` den aktuellen Prod-Schema-Stand exakt abbildet (ggf. eine konsolidierte Baseline-Migration via `prisma migrate diff` erzeugen).
> 2. **Auf Prod (einmalig):** jede bestehende Migration als angewandt markieren — `prisma migrate resolve --applied <migration>` für alle Ordner in `prisma/migrations/` — damit `_prisma_migrations` den Ist-Zustand kennt, ohne DDL auszuführen.
> 3. **Erst danach:** `vercel.json` buildCommand `db push` → `prisma migrate deploy` umstellen.
> 4. `lib/db-init.ts` (paralleles Raw-SQL-Self-Healing auf Hot-Paths) zurückbauen, sobald Migrations autoritativ sind — beseitigt die dritte überlappende Schema-Wahrheit.
> 5. Staging-Deploy verifizieren (voller Build + Migrate), dann Prod.
>
> Bis zum Cutover bleibt `db push` aktiv (funktioniert, nur ohne Migrationskette/Rollback). Kein Datenverlust im Normalbetrieb — das Risiko materialisiert sich nur bei Schema-Divergenz zwischen Branch und Prod.

```
DATABASE_URL=$DIRECT_URL npx prisma db push --skip-generate && npx prisma generate && next build
```

`db push` synchronisiert das Schema per Drift-Abgleich **ohne Migrationshistorie** direkt gegen Prod (`DIRECT_URL`) bei **jedem** Deploy — kann bei Divergenz Spalten/Daten droppen, kein Rollback. Es existieren echte Migrations (`prisma/migrations/*`, 10 Ordner), die dadurch aber **nie angewandt** werden (vestigial). Zusätzlich pflegt `lib/db-init.ts` parallel Raw-SQL (`CREATE TABLE/ADD COLUMN IF NOT EXISTS`) auf Hot-Paths (register, reset-password) → **drei überlappende Schema-Wahrheiten**. `lib/partner/README.md` vermerkt die Umstellungs-Absicht bereits. Empfehlung: auf `prisma migrate deploy` konsolidieren (Baseline-Resolve nötig), `db-init.ts` zurückbauen.

### R7 — Keine CI/CD-Pipeline ✅ BEHOBEN
**Pfad:** `.github/workflows/` (fehlt) · **Aufwand: M**

> **Fix:** `.github/workflows/ci.yml` mit drei Jobs, getriggert bei PR→main + Push→main: (1) **quality** — Lint · Typecheck (`tsc --noEmit`) · Test (`vitest run`) · Build (Production-Phase mit Dummy-Env, kein DB-Connect nötig); (2) **licenses** — Allowlist-Gate (bricht bei GPL/AGPL/LGPL/MPL ab); (3) **secrets** — gitleaks über volle Historie + Diff. Neue npm-Scripts `typecheck` + `license-check`. Alle Gates lokal validiert (Build grün mit Dummy-Env, license-check PASS, 150/150 Tests). **Empfehlung an Betreiber:** die drei Jobs als *required status checks* in den GitHub-Branch-Protection-Regeln für `main` aktivieren (macht die Gates verpflichtend statt nur informativ).

Kein `.github/`-Verzeichnis. `lint`/`test`/`build` existieren nur als npm-Scripts, werden aber **bei keinem Push/PR erzwungen** — Merges laufen ohne Gate. Kein `tsc --noEmit`-Gate, kein secret-scan, kein license-check, keine pre-commit-Hooks. `scripts/smoke-routes.sh` existiert, ist aber nirgends eingebunden. Für einen Käufer bedeutet fehlende CI: keine belegbare Qualitätssicherung, jede Regressionsschutz-Aussage ist unbewiesen. Dies ist Phase 5 des Auftrags und Voraussetzung, um die Test-Suite als Asset zu werten.

---

## 🟡 GELB-Findings (Preisabschlag / Remediation)

| # | Finding | Datei:Zeile | Aufwand |
|---|---|---|---|
| G1 | ✅ **BEHOBEN** — Login (HR + Partner) Rate-Limit: `lib/login-guard.ts` (10/15min je IP + je Email), in beide `authorize()` verdrahtet; Blockade → `null` (kein Oracle). 5 Tests. | `lib/auth.ts:42-77`, `lib/partner/auth.ts:59-102` | S–M |
| G2 | **HR-Passwortwechsel als ungedrosseltes Passwort-Orakel** (Partner hat durablen DB-Zähler, HR nicht) | `app/api/auth/profile/route.ts:57-64` | S |
| G3 | Rate-Limiter in-memory/per-Lambda, auf Serverless nicht durchsetzbar | `lib/rate-limit.ts:1-8` | M |
| G4 | HR-JWT ohne Passwort-Wechsel-Invalidierung (Partner hat `passwordChangedAt`-Check) | `lib/auth.ts:91-108` | S–M |
| G5 | ✅ **BEHOBEN** — Stripe-Webhook-Tests: `__tests__/stripe-webhook.test.ts` (7 Fälle: fehlendes Secret→500, fehlende/ungültige Signatur→400, subscription→ACTIVE+Plan-Mapping, past_due→PAST_DUE, Add-on-Idempotenz P2002→200, unerwarteter DB-Fehler→500). Test-only, kein Verhaltens-Change. | `app/api/stripe/**`, `lib/stripe.ts` | M |
| G6 | Kein Reconciliation-Cron für verpasste Stripe-Events → stiller `planStatus`-Drift | `vercel.json` / `lib/stripe.ts` | M |
| G7 | Consent-Lifecycle-Routen ungetestet (accept/revoke/upload setzen `cvStatus`) | `app/api/consent/[token]/**` | M |
| G8 | Core-Owner-Scoping (checks/candidates/gdpr) auf Routen-Ebene ungetestet | `__tests__/` (fehlt) | M |
| G9 | Keine Retention für LeadMagnetRequest / PilotApplication / CvAnalysisReport / GdprConsent | `cron/cleanup` (fehlt) | S–M |
| G10 | AuditLog mit Klartext-Emails, unbegrenzte Aufbewahrung | `lib/email.ts:93-98`, `lib/consent-invite.ts:104` | M |
| G11 | Emails im Klartext in Logs (`email_no_provider`, HubSpot-Fehler) | `lib/email.ts:77-80`, `lib/hubspot.ts:~127` | S |
| G12 | CV-Analyse-Consent = selbst-behaupteter Boolean, nicht an ConsentToken gebunden | `app/api/cv-analysis/route.ts:25-31` | M |
| G13 | Kein Feature-Flag zum Abschalten der LLM-CV-Analyse (nur Key-Präsenz) | `lib/cv-analysis/llmClaimAnalysis.ts:73-77` | S |
| G14 | Kein Error-Tracking (Sentry/APM) / kein Alerting auf Health-503 | (fehlt) | S–M |
| G15 | Kein dokumentiertes/getestetes Backup-Restore-Verfahren (RPO/RTO/PITR) | `docs/` (fehlt) | S |
| G16 | Kein Incident-Runbook / On-Call | `docs/` (fehlt) | S |
| G17 | `.env.example` unvollständig: `ASSIGNMENT_AUTO`, `PDL_REGISTRATION_OPEN`, `REVIEWER_*`, `PROSPECT_*` | `.env.example` | S |
| G18 | Kein Demo-Seed; `prisma/seed.ts` leer + nicht als `prisma.seed` verdrahtet | `prisma/seed.ts` | S–M |
| G19 | E2E ist unveränderter Playwright-Scaffold (testet `playwright.dev`, nicht candiq) | `tests/example.spec.ts` | S–M |
| G20 | Fehlende DSFA (Art. 35) / kein TOM-/RoPA-Dokument | `docs/` | L (org.) |
| G21 | Überholte `AUDIT.md` im Root (behauptet fehlende Features, die existieren) | `AUDIT.md` | S |
| G22 | `style-src`/`style-src-attr 'unsafe-inline'` neben Nonce (Framer-Motion-Kompat) | `middleware.ts:56-59` | S |
| G23 | ElevenLabs-Agent-ID hardcoded, kein Quota-Fallback (Marketing-Demo bricht) | `components/landing/sections/VoiceConsole.tsx:8` | S |
| G24 | ✅ **BEHOBEN** — Monats-Quota in `/api/checks` (POST): `lib/quota.ts` zählt Checks ab Monatsanfang gegen `plan.includedChecks`, `>=` → 402 `QUOTA_EXCEEDED`; ENTERPRISE unbegrenzt. Kandidaten bewusst ungemetert (nicht die abrechenbare Einheit). 5 Tests. | `app/api/checks/route.ts`, `app/api/candidates/route.ts` | S–M |

---

## 🟢 GRÜN — Stärken (für die DD festhalten)

- **Secret-Hygiene:** keine Live-Token in der Git-Historie, nie eine echte `.env` committed, keine Hardcodes im Code.
- **Lizenzen:** kein GPL/AGPL/Copyleft; 235× MIT, 22× ISC, 15× Apache-2.0. Sauberer Stack.
- **Auth-Trennung:** zwei vollständig isolierte NextAuth-Instanzen (HR/Partner) mit getrennten Cookies; Partner-Session-Callback leert `session.user` explizit → kein Cross-Domain-Leak von `role`/`plan`.
- **Partner-Auth ist state-of-the-art:** 60-Sekunden-DB-Refresh, Session-Invalidierung bei `passwordChangedAt`, durabler DB-Fehlversuchszähler beim Passwortwechsel.
- **Candidate-Auth:** HMAC-signierte Magic-Link-Tokens, nur SHA-256-Hash in DB, `timingSafeEqual`, single-use, 14-Tage-TTL.
- **Consent-/CV-Gate:** eine einzige Autorisierungs-Entscheidungsstelle (`lib/cv-gate.ts`), bewusst App-Layer (RLS-Scheinsicherheit begründet verworfen), getestet; Widerruf (Art. 7 Abs. 3) vollständig inkl. Check-Stopp + CV-Sperre + Audit.
- **Owner-Scoping (Rest):** alle HR-Datenrouten außer R1 sauber `session.user.id`-gebunden; alle Partner-Routen via `withPartnerScope()` (wirft bei leerem Scope).
- **Stripe:** Webhook-Signaturprüfung (`constructEvent` auf Raw-Body) + idempotenter Add-on-Insert (Unique auf `stripeSessionId`) + `checkId`-Ownership-Prüfung.
- **Security-Header:** HSTS (2 J., preload), X-Frame-Options DENY, nosniff, Referrer-Policy, restriktive Permissions-Policy + strikte Per-Request-Nonce-CSP mit `strict-dynamic`, `object-src 'none'`, `frame-ancestors 'none'`.
- **Feature-Flags:** default-off, konsequent an ~15 Partner-Routen + Cron + Partner-Auth gegated.
- **Datenschutz-Dokumentation:** `app/datenschutz`, `app/avv`, `app/compliance`, `app/agb`, `app/impressum` existieren; Subprozessoren (außer OpenAI) mit Rechtsgrundlage + SCC/DPF disclosed; Art.-14-Referenzgeber-Info-Mail implementiert.
- **Partner-Tests:** 11 Dateien / ~93 Fälle inkl. Cross-Partner-Isolation, EK-Pricing-Auflösung, Referral-Härtung.
- **Health-Route** (`/api/health`, DB-Ping), strukturiertes JSON-Logging, `.env` in `.gitignore`, `SETUP.md` vorhanden, `NEXTAUTH_SECRET ≥ 32` in Prod erzwungen (`lib/env.ts`).

---

## zvoove-Integration — präziser Status

Die Prüf-Frage „merge-ready?" ist wichtig und wurde manuell aufgelöst (ein Analyse-Agent lag zunächst falsch, weil der lokale Checkout die Remote-Branch nicht enthält):

- **In `main`: 0 %.** Kein zvoove-Code, keine Env-Keys, keine Krypto — der laufende Betrieb hat die Integration nicht.
- **In offenem PR #137 (`feat/zvoove-integration`, Base `a9b880e` vom 18.06.):** **Phase 1 von 6** — modularisiert und diligence-freundlich: `lib/integrations/zvoove/{types,client,mapper,consent-guard}.ts`, `lib/crypto/aes-gcm.ts` (AES-GCM-Credential-Verschlüsselung), MockClient + 33 grüne Tests, README.
- **Bewertung:** solides Fundament, **aber** (a) auf altem Base → **Rebase auf aktuellen `main` nötig**, (b) nur Phase 1 — API-Routes (`connect/import/push-result`), Sync-Orchestrierung, UI und Vercel-Cron **fehlen noch**, (c) AVV-Update mit zvoove als Subprozessor offen. → DD-Aussage: **„begonnen, sauber modularisiert, nicht produktreif und nicht in main"**, nicht „fertig" und nicht „fehlt".

---

## Priorisierte Fix-Roadmap (ROT zuerst)

**Sprint 1 — Vor-Signing-kritisch (Ziel: keine offenen ROT):** ✅ ABGESCHLOSSEN
1. ✅ R1 IDOR-Fix (Owner/Reviewer-Check in `documents/[id]`) — **S**
2. ✅ R2 CV-Blob-Löschung an beiden Stellen (`del(path)` in cleanup + gdpr/delete) — **M**
3. ✅ R4 LLM-Master-Switch (default off) + OpenAI disclosure — **S**
4. ✅ R5 Next.js 14.2.35 (kritisch weg) + undici/minimatch-Overrides — **M**
5. ✅ R7 CI-Pipeline (lint + tsc + vitest + build + secret-scan + license-check) — **M**

**Sprint 2 — Vor-Signing wichtig (Live-Cutover, GO-gated):** 🟠 RUNBOOKS BEREIT, warten auf Freigabe
6. 🟠 R3 CVs auf private Blobs + signierte URLs — **M–L** — braucht `@vercel/blob`-Major + Bestands-Blob-Migration (Live-Storage)
7. 🟠 R6 `db push` → `migrate deploy` — **M–L** — braucht einmaliges Prod-Baseline-Resolve (Prod-Event)
8. G5 Stripe-Webhook-Tests — **M**
9. G1/G2/G4 Login-Rate-Limit + HR-Passwort-Härtung + JWT-Invalidierung — **S–M**
10. G24 Quota-Enforcement (Umsatz-Integrität) — **S–M**

**Sprint 3 — DD-Dokupaket + Betrieb + Cockpit (Phasen 2–5 des Auftrags):**
DSGVO-Doku (DSFA/TOM/RoPA), Retention-Erweiterung, Sentry+Alerting, Backup-Runbook, Demo-Seed, `.env.example`, KPI-Cockpit, `docs/due-diligence/01–10`.

**Aufwands-Grobschätzung Gesamt bis „DD-fest":** ~2 fokussierte Sprints für ROT + Kern-GELB; Doku-/Cockpit-/Demo-Phasen laufen parallel.

---

## Anhang — Scan-Rohdaten

- **`npm audit`:** 1 critical (next SSRF), 4 high (undici, minimatch, 2× @typescript-eslint), 5 moderate (js-yaml, @vercel/blob→undici, next-auth→uuid, postcss, uuid). Gesamt 10.
- **`license-checker --production --summary`:** MIT 235 · ISC 22 · Apache-2.0 15 · BSD-3 4 · MIT* 2 · BSD-2 2 · CC-BY-4.0 1 · Unlicense 1 · 0BSD 1 · UNLICENSED 1 (= candiq selbst). **Kein GPL/AGPL/LGPL/MPL.**
- **Secret-Scan (git-nativ über `git rev-list --all`):** 0 Live-Token-Muster (Stripe/Resend/AWS/GitHub/JWT/PrivateKey), 0 committete `.env`-Dateien, 0 Hardcodes im aktuellen Tree.
- **Offene PRs (Housekeeping-Signal):** #137 zvoove Phase 1, #138 Bugfix+Quota-Guard, #126 email-await (vermutlich durch main überholt), #36 Sprint-Report-Doc, #21 Consent-Plan-Doc, #19 Codex RLS-Draft (durch App-Layer-Entscheidung obsolet).

---

*Ende Phase-0-Audit. Gemäß Auftrag erfolgt KEIN Fix ohne Einzelfreigabe. Nächster Schritt: Freigabe der ROT-Punkte (R1–R7) einzeln oder als Sprint-1-Paket.*

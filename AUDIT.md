# candiq Demo-Readiness Audit

**Stand:** Repo-HEAD `7b83951` (PR #73, Marketing-Repositionierung)
**Methode:** Statisches Code-Tracing + `npm run build` + `npm run lint`. Datenbank ist lokal nicht verbunden, daher alle Aussagen zur DB-Existenz von Tabellen aus Migrations-Dateien abgeleitet, nicht zur Laufzeit verifiziert.
**Scope:** Critical Path Login → Consent-Portal → Report. Marketing-Copy explizit ignoriert.

---

## 1. Verdikt

**TEILWEISE.** Der Happy Path *könnte* end-to-end durchlaufen — aber **die `ConsentToken`-Tabelle existiert in keiner einzigen Migration**, sodass `POST /api/candidates/[id]/invite` in Production mit 500 abstürzt, sobald jemand auf „Einladen" klickt. Damit fällt der zentrale Demo-Moment (granulare Einwilligung des Kandidaten — die *gesamte* Marketing-Story der menschlichen Vertrauensschicht) hart aus.

---

## 2. Status-Tabelle

| # | Punkt | Status | Evidenz | Aufwand |
|---|---|---|---|---|
| 1 | Login → Dashboard | ✅ FUNKTIONIERT | `app/api/auth/[...nextauth]`, `lib/auth.ts` (CredentialsProvider, JWT-Session, bcrypt 12), `app/(dashboard)/dashboard/page.tsx` rendert via Prisma. `middleware.ts` schützt Dashboard-Routen. | — |
| 2 | Reference-Check anlegen | ✅ FUNKTIONIERT | UI: `app/(dashboard)/candidates/new/page.tsx` + `app/(dashboard)/checks/new/page.tsx`. API: `POST /api/candidates` + `POST /api/checks` (beide validiert, beide schreiben in DB, AuditLog). Modelle `Candidate` und `ReferenceCheck` sind in `0_init`-Migration. | — |
| 3 | Consent-Portal | 🔴 KAPUTT (in Prod) | UI komplett: `app/candidate/[token]/ConsentPortalClient.tsx` (Referenzgeber-Felder, Checkboxes, Upload, Widerruf). API komplett: `POST /api/consent/[token]/accept` persistiert `ip`, `ua`, `acceptedAt`, `refereesJson` revisionssicher. Email-Templates existieren. **ABER:** `grep -rli ConsentToken prisma/migrations/` = 0 Treffer. `lib/db-init.ts` erzeugt die Tabelle auch nicht. Erstes `POST /api/candidates/[id]/invite` wirft `relation "ConsentToken" does not exist`. | **S** (1 Migration) |
| 4 | Check → PDF-Report | 🟡 TEILWEISE | Report-Page existiert: `app/report/check/[id]/page.tsx` rendert HTML mit Print-CSS. **PDF = Browser-Print** via `window.print()` in `PrintControls.tsx`. Keine PDF-Library (`grep` für jspdf/puppeteer/playwright-pdf/@react-pdf = 0 Treffer). Reviewer-Felder (`callNotes`, `discrepancies`, `rating`) sind manuell in `PATCH /api/checks/[id]` zu setzen — kein automatisierter Flow. Kein Mail-Versand des Reports an den Kunden. | **M** |
| 5 | CV-Analyzer + Trust-Score im Report | 🔴 STUB/FEHLT | `grep -rn "CvAnalysisReport\|cv-analysis\|cvAnalysis\|fabrication"` über `app/`, `lib/`, `components/`, `prisma/` = **0 Treffer**. Kein Modell, keine Migration, keine API-Route, keine UI-Verdrahtung. Auf der Marketing-Seite existiert eine Section `FabricationCheck.tsx` (PR #73) — die ist pure Copy, kein Backend. | **L** |
| 6 | candiq Voice Demo | ✅ FUNKTIONIERT | `VoiceConsole.tsx` nutzt `@elevenlabs/react`, startet WebSocket-Session gegen `AGENT_ID = 'agent_9601ktktemgwfk3tey407mkkxnc5'` (hardcoded). `VoiceAgent.tsx` lädt das Widget-Embed-Script. **Nicht zur Laufzeit verifiziert**: Qualität des Agent-Promptings, Bezahl-Quota auf dem ElevenLabs-Konto, ob der Agent noch existiert. | — |

---

## 3. Pro Punkt im Detail

### 1. Login → Dashboard ✅
**Real:** `next-auth` mit CredentialsProvider (`lib/auth.ts`), bcrypt-12-Hashes (`app/api/auth/register/route.ts`). JWT-Session, secure Cookies. Middleware (`middleware.ts:PROTECTED_PREFIXES`) erzwingt Auth auf `/dashboard`, `/candidates`, `/checks`, `/clients`, `/report` etc. `app/(dashboard)/dashboard/page.tsx` liest Live-Daten aus Prisma — totalCandidates, completedChecks, ActivityAreaChart aus echten Aggregationen.
**Demo-tauglich:** Ja. **Voraussetzung Demo-Konto:** ein User-Eintrag in DB (kann via `/api/sample-data` mit einem Klick erzeugt werden — der erstellt auch 4 Beispiel-Kandidaten + 6 Checks; idempotent gegen Überschreiben).

### 2. Reference-Check anlegen ✅
**Real:** Frontend `app/(dashboard)/candidates/new/page.tsx` ruft `POST /api/candidates`, `app/(dashboard)/checks/new/page.tsx` ruft `POST /api/checks`. Beide validieren Eingaben (Längen, Pflichtfelder), beide schreiben in DB + AuditLog. `prisma/schema.prisma` und `0_init`-Migration enthalten beide Modelle.
**Demo-tauglich:** Ja. **Aber:** Es bleibt eine reine DB-Operation — kein Trigger, der einen Reviewer beauftragt, kein Workflow-Start. Status-Übergänge muss man manuell oder per `/api/sample-data` setzen.

### 3. Consent-Portal 🔴
**Real geplant:** Vollständig durchdesigntes Modell `ConsentToken` (in `prisma/schema.prisma`) mit `tokenHash`, `scope`, `status`, `expiresAt`, `acceptedAt`, `ipAccepted`, `uaAccepted`, `consentVersion`, `refereesJson`. UI: `ConsentPortalClient.tsx` deckt drei Zustände ab (pending / accepted / revoked), inkl. Datei-Upload-Block (`/api/consent/[token]/upload`). API `POST /api/consent/[token]/accept` (`app/api/consent/[token]/accept/route.ts`) persistiert revisionssicher Referenzgeber + IP + UA + consentVersion. Cleanup-Cron (`app/api/cron/cleanup/route.ts`) löscht abgelaufene ConsentTokens nach 180 Tagen.
**Real kaputt:** Die Tabelle `ConsentToken` wird **in keiner Migration** angelegt:
- `prisma/migrations/0_init/migration.sql` enthält nur `User, Candidate, Document, ReferenceCheck, GdprConsent, PasswordResetToken, AddonOrder, AuditLog`. Kein `ConsentToken`.
- `20260515_add_stripe_subscription` — nur User-Spalten.
- `20260528_addon_stripe_session_id` — nur `AddonOrder.stripeSessionId`.
- `20260528_pilot_application` — nur `PilotApplication`.
- `20260528_lead_magnet_request` — nur `LeadMagnetRequest`.
- `lib/db-init.ts` `ensureSchema()` legt `AddonOrder` + `PasswordResetToken` + User-Spalten nach, aber **nicht `ConsentToken`**.
- `grep -rn "CREATE TABLE.*ConsentToken"` = 0 Treffer im gesamten Repo.
**Konsequenz in Production:** Erstes `POST /api/candidates/[id]/invite` läuft in `createConsentToken()` → `prisma.consentToken.create(...)` → Postgres-Error `relation "ConsentToken" does not exist`. 500. **Damit fällt der gesamte „menschliche Vertrauensschicht / DSGVO-Audit-Trail"-Pitch in Live-Demo durch.**
**Nicht zur Laufzeit verifiziert:** Möglich, dass eine Out-of-Band-Migration (Supabase-Console-SQL) das Schema in der Prod-DB doch erzeugt hat. Aus dem Repo allein nicht nachweisbar.

### 4. Check → strukturierter PDF-Report 🟡
**Real:** `app/report/check/[id]/page.tsx` ist eine vollständige Server-Component, die den Report aus DB-Daten rendert (Header, Kandidaten-Block, Ergebnis-Pills, Rating-Sterne). `PrintControls.tsx` bietet einen „Drucken"-Button → `window.print()`. Print-CSS in `globals.css` versteckt Chrome-Elemente. Reviewer-Felder (`callNotes`, `discrepancies`, `rating`, `calledAt`) werden via `PATCH /api/checks/[id]` von einem internen User gesetzt — kein automatisierter Workflow.
**Was fehlt für „PDF":**
1. Echte PDF-Generierung (Puppeteer / @react-pdf / serverseitig). Aktuell muss der HR-User selbst auf „Drucken → Als PDF speichern" klicken. In der Demo aus dem Browser heraus zeigbar, aber kein Endkunden-Versand.
2. Kein Trigger, der den Report per E-Mail an den Auftraggeber schickt.
3. Kein Reviewer-UI, das den Call dokumentiert — der HR-User selbst editiert die Felder.
**Nicht zur Laufzeit verifiziert:** ob der Browser-Print-Pfad in einer Live-Demo „PDF-würdig" aussieht (Tabellen-Breaks, Seitenränder, Logo-Position).

### 5. CV-Analyzer + Trust-Score 🔴
**Real:** Nichts. Marketing-Section `FabricationCheck.tsx` existiert (PR #73) — sagt textlich, was geprüft werden soll (Firma existiert / Zeitlinien / Titel-Dauer / Referenzgeber echt / Substanz statt Stil) und visualisiert ein „candiq Verified"-Siegel. **Aber:** kein API-Endpoint `/api/cv-analysis`, kein `lib/cv-analysis.*`, kein `CvAnalysisReport`-Modell, keine Migration, keine Verdrahtung in `/report/check/[id]`. Trust-Score wird nirgendwo berechnet, gespeichert oder angezeigt.
**Fehlt für demo-ready:** Mindestens eines davon:
- (a) Section aus dem Marketing nehmen, bis Backend gebaut ist.
- (b) Minimal-Implementierung: `Candidate` bekommt Felder `trustScore: Int?`, `fabricationFindings: String?`; ein neuer Endpoint `POST /api/cv-analysis` ruft eine LLM-API mit dem hochgeladenen CV auf und schreibt zurück; Report-Page rendert beide Felder.

### 6. candiq Voice Demo ✅
**Real:** `VoiceConsole.tsx` und `VoiceAgent.tsx` binden den ElevenLabs ConvAI-Widget an. Agent-ID `agent_9601ktktemgwfk3tey407mkkxnc5` ist hardcoded — keine Env-Var. WebSocket-Verbindung startet bei Knopfdruck. Permission-Policy in `next.config.js` erlaubt `microphone=(self)`. CSP in `middleware.ts` erlaubt `https://js.elevenlabs.io` und `https://livekit.elevenlabs.io` (per Brief in PR #64/#66 ergänzt).
**Nicht zur Laufzeit verifiziert:** ob der Agent in ElevenLabs noch aktiv ist, ob das Konto Quota hat, ob das Prompt-Skript die candiq-Positionierung trifft. In der Live-Demo wird sich das zeigen — wenn der Agent fertig ist, ist es ein starkes Asset.

---

## 4. Punch-List — minimal für demo-ready

In Reihenfolge des Critical Path, jeweils das absolute Minimum.

### P0 — Consent-Portal Migration (Aufwand: S — 30 Min)
Ohne das ist der Brand-Pitch in der Live-Demo tot. Neue Migration `prisma/migrations/<datum>_consent_token/migration.sql` mit `CREATE TABLE "ConsentToken" (...)` aus dem Schema ableiten (alle Felder + 3 Indizes). Anwenden mit `prisma migrate deploy` auf der Prod-DB. Verifizieren: `POST /api/candidates/[id]/invite` gibt 200 statt 500. Smoke-Test des kompletten Consent-Flows (Mail → Portal → Accept → DB-Eintrag mit IP + UA + refereesJson).

### P1 — Demo-Datenpfad sauber stellen (Aufwand: S — 15 Min)
Für jeden Pilot-Kunden / Demo-Termin: leeres Konto anlegen → `POST /api/sample-data` triggern (existiert bereits in `app/api/sample-data/route.ts`, seedet 4 Kandidaten + 6 Checks idempotent). Dann eine **einzige** Demo-Kandidatin in den Consent-Status `PENDING_ACCEPT` versetzen und den Portal-Link parat haben. Kein Code-Change, nur Run-Book.

### P2 — Report-PDF tauglich machen (Aufwand: M — 1-2 Tage)
Entweder Server-Side-Render mit Puppeteer (`puppeteer-core` + Vercel-Chromium-Layer auf einer dedizierten Function), oder `@react-pdf/renderer` für native React-PDF. Trigger an `POST /api/checks/[id]/report` o.ä., Output an Resend → Auftraggeber. Minimum: ein automatisierter Browser-Print-Test, dass die HTML-Variante korrekt umbricht.

### P3 — Trust-Score & Fabrikations-Check ehrlich aufstellen (Aufwand: L — 3-5 Tage)
Optionen, geordnet nach Kosten/Glaubwürdigkeit:
- (a) Marketing-Section `FabricationCheck.tsx` mit Disclaimer „in Vorbereitung" markieren oder ganz entfernen, bis Backend da ist. **30 Min, behebt sofort die Lücke zwischen Versprechen und Realität.**
- (b) Minimal-Backend: LLM-Call (Anthropic, Key ist in `.env.example` schon vorgesehen) → 5 strukturierte Checks → `trustScore` (0-100) in neuer Tabelle `CvAnalysisReport`. Sichtbar im Report. 3-5 Tage.

### P4 — Reviewer-Workflow + Email-Versand des Reports (Aufwand: M)
Aktuell editiert der HR-User die Reviewer-Felder selbst — das widerspricht dem Pitch „geschulte Reviewer rufen an". Minimum: zweite Rolle „REVIEWER" in `lib/auth.ts`, separates UI für sie, Status-Übergang `IN_REVIEW → COMPLETED` mit Mail an HR-User. Ohne das sieht ein aufmerksamer Käufer im Demo, dass „der Mensch" nicht in der Software steckt.

---

## 5. Hard Blocker

Für den nächsten Live-Demo-Slot mit echtem Käufer:

1. **🔴 `ConsentToken`-Tabelle fehlt in Prod-DB.** Ohne Migration crasht der Invite-Flow mit 500. Belegt durch `grep -rli ConsentToken prisma/migrations/ = 0`. Nicht zur Laufzeit verifiziert, aber maximal wahrscheinlich. Ohne Fix: gar keine Consent-Demo.
2. **🔴 `CvAnalysisReport` / Trust-Score komplett fehlend** während die Marketing-Section auf der Homepage prominent danach fragt. Käufer-Risiko: einer fragt „kann ich den Trust-Score auf einem echten Report sehen?", Antwort wäre „den gibt's noch nicht" — direkter Glaubwürdigkeits-Schaden zum frisch repositionierten Narrativ.
3. **🟡 PDF-Generierung = Browser-Print.** Funktioniert in einer geführten Demo, scheitert aber, wenn ein Käufer fragt „und der Report wird automatisch per Mail an meinen Hiring-Manager geschickt?".
4. **🟡 Keine echten Tests.** Im Repo nur `tests/example.spec.ts` aus `npm init playwright` (testet playwright.dev, nicht candiq). Kein `npm run test`-Script. Build-Pipeline kann Schema-Drift, Migrations-Lücken und Runtime-Fehler nicht erwischen — das `ConsentToken`-Problem wäre durch einen einzigen Smoke-Test des Invite-Endpoints aufgefallen.

**Was NICHT blockt:**
- Login, Dashboard, Candidate-/Check-Anlage funktionieren.
- Voice-Demo läuft (vorbehaltlich Agent-Verfügbarkeit auf ElevenLabs).
- Build, Lint und alle Marketing-Pages sind grün.

---

## Anhang: nicht zur Laufzeit verifiziert

- Ob die Production-DB die `ConsentToken`-Tabelle trotz fehlender Migration durch eine manuelle Supabase-Console-Aktion bereits enthält.
- Ob der ElevenLabs-Agent `agent_9601ktktemgwfk3tey407mkkxnc5` noch aktiv ist und Quota hat.
- Ob der HTML-Report im Browser-Print-Modus tatsächlich sauber paginiert (Logo bleibt im Header, Tabellen-Breaks korrekt).
- Ob Resend-Versand der Consent-Invite-Mails in Prod tatsächlich zustellt (vom Code abgedeckt, aber abhängig von `RESEND_API_KEY` und verifizierter `EMAIL_FROM`-Domain in Resend).

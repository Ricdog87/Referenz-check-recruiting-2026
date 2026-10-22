# Consent-First Reference Check Flow — Implementation Plan

Status: **DRAFT — wartet auf grünes Licht**
Branch: `feat/consent-first-flow`
Basis: `claude/recruiting-verification-saas-TigaZ` (Repo-Default, gleichzeitig Vercel-Production-Branch)

---

## 0. Stack-Reality-Check (Spec ↔ Repo)

Der Original-Prompt nimmt einen Stack an, der nur teilweise stimmt. Das ist der ehrliche Diff — bitte vorab bestätigen, dass die Anpassungen okay sind, sonst wandert die Implementierung gegen die Wand.

| Im Prompt angenommen     | Tatsächlich im Repo                                  | Konsequenz für Plan |
| ------------------------ | ---------------------------------------------------- | ------------------- |
| Supabase Postgres + `supabase/migrations/*.sql` | **Prisma** ORM, `prisma/migrations/*/migration.sql`, postgres-URL nur via `DATABASE_URL` | Schema wird in `prisma/schema.prisma` definiert; SQL-Trigger als rohes SQL in einer Migration-Datei. Kein `supabase/migrations/` anlegen. |
| Supabase Auth (`auth.users`, `workspaces`) | **NextAuth** + eigener `User`-Tabelle, **kein** `workspaces`-Modell | `workspace_id`-FK fällt weg; stattdessen `userId` als Tenant-Schlüssel (single-user-workspace = der HR-User). |
| Supabase Storage         | **Vercel Blob** (`*.public.blob.vercel-storage.com` in CSP, `Document.path` bereits im Schema) | `storage_path` → bleibt String-Pfad in Vercel-Blob; existierender `Document`-Code wird wiederverwendet. |
| shadcn/ui Drawer-Component  | **Kein** shadcn/ui installiert (`components/ui/` existiert nicht). Vorhanden: framer-motion, lucide-react, Tailwind. | Bottom-Drawer wird als kleine eigene Komponente unter `components/ui/Drawer.tsx` gebaut (Headless, framer-motion-driven). Kein npm-Bloat. |
| pnpm                     | **npm** (es gibt `package-lock.json`)                | Demo-Anleitung in PR nutzt `npm run dev`. |
| `@react-pdf/renderer` für Audit-PDF | **Nicht installiert.** Existierende PDF-Pipeline? → muss ich kurz prüfen vor Implementierung. | Phase-1: Audit-Trail-Export als JSON-Download. PDF-Variante als Phase-2-Ticket vermerkt, falls keine PDF-Pipeline existiert. **Punkt für deine Entscheidung.** |
| Existierende `ReferenceCheck`-Tabelle = Container für 1 Check | Im Repo: `ReferenceCheck` = **1 Eintrag pro Referenzgeber**, gehört zu `Candidate` (= 1 Bewerber = 1 Check-Anfrage) | Spec's `reference_checks` ≈ existierender `Candidate`. Spec's `referee_nominations` ≈ existierender `ReferenceCheck`. → Wir **erweitern bestehende Modelle**, statt parallele Tabellen anzulegen. Listing der breaking changes weiter unten. |

---

## 1. Single Source of Truth — `lib/flow/consent-steps.ts`

1:1 wie im Prompt spezifiziert. Plus:
- Zod-Schema für Step-Validation.
- `CONSENT_FLOW_VERSION = "1.0.0"` Konstante, in jedes geschriebene `ConsentEvent` als `consent_text_version` mitgegeben.
- Helper `nextStatus(currentStatus, eventId)` mit Transition-Map.

Daneben: `lib/flow/transitions.ts` — Statemachine, pure functions, vollständig unit-testbar. Komponenten/Routes rufen nur diese Helper auf, nie direkt `prisma.candidate.update({ status: ... })`.

---

## 2. Schema-Änderungen (Prisma)

### Neue Modelle

```prisma
model ConsentEvent {
  id                  String   @id @default(cuid())
  candidateId         String   // = "check_id" aus Spec; Candidate ist die Check-Anfrage
  candidate           Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  stepId              String   // aus CONSENT_FLOW.id
  actorRole           String   // 'candidate' | 'referee' | 'hr' | 'system'
  actorIdentifier     String   // E-Mail (für referee SHA-256-gehasht)
  consentGiven        Boolean
  consentTextVersion  String   // CONSENT_FLOW_VERSION
  legalBasis          String   // "Art. 6 Abs. 1 lit. a DSGVO" etc.
  ipHash              String?  // SHA-256, nie Klar-IP
  userAgent           String?
  createdAt           DateTime @default(now())

  uploads             Document[] @relation("UploadConsent")

  @@index([candidateId, stepId])
}

model RefereeNomination {
  id                       String   @id @default(cuid())
  candidateId              String
  candidate                Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  nominatedByCandidate     Boolean  @default(true)  // DB-Default + Constraint = true
  refereeName              String
  refereeEmail             String
  relationship             String?
  inviteToken              String   @unique
  status                   String   @default("pending") // pending|consented|responded|declined|expired
  nominatedAt              DateTime @default(now())

  refereeConsentEventId    String?  // FK auf ConsentEvent (referee_consent)
  referenceCheckId         String?  @unique // verlinkt auf existierendes ReferenceCheck wenn beantwortet

  @@index([candidateId])
}
```

### Änderungen an existierenden Modellen (BREAKING — explizit gelistet)

- `Candidate`:
  - **NEU** `status` wird zur State-Machine (existiert schon als String mit Default `"PENDING"` → bekommt enum-validierende Werte: `request_created | candidate_invited | awaiting_candidate_consent | candidate_uploading | awaiting_referee_nomination | awaiting_referee_consent | referee_responding | report_released | revoked | expired`). Migration mappt alte `"PENDING"` → `"request_created"`.
  - **NEU** `inviteToken String @unique` + `expiresAt DateTime`.
  - **NEU** Relations: `consentEvents ConsentEvent[]`, `refereeNominations RefereeNomination[]`.
  - Felder `gdprConsent`, `gdprConsentDate`, `gdprConsentIp` bleiben unverändert (alte API-Routen lesen sie noch), werden aber von neuen Routen **nicht mehr beschrieben**. Backfill-Hilfsskript erzeugt aus alten Candidates ein synthetisches `candidate_consent`-ConsentEvent für Audit-Konsistenz. → wandert in Phase-2 cleanup.
- `Document`:
  - **NEU** `consentEventId String` + Relation `consentEvent ConsentEvent @relation(...)` mit Trigger-Gate (siehe unten). Migration setzt `consentEventId` für bestehende Dokumente auf eine "legacy"-Sentinel-ConsentEvent-Reihe.

### SQL-Trigger in Migration

Migration: `prisma/migrations/20260515_consent_flow/migration.sql`

```sql
-- DB-Level-Gate 1: Upload nur nach candidate_consent
CREATE OR REPLACE FUNCTION ensure_candidate_consent_before_upload() ...
CREATE TRIGGER trg_ensure_consent_before_upload BEFORE INSERT ON "Document" ...

-- DB-Level-Gate 2: Referee-Nominierung nur durch Kandidat (nominatedByCandidate = true)
CREATE OR REPLACE FUNCTION ensure_referee_nominated_by_candidate() ...
CREATE TRIGGER trg_ensure_nominator BEFORE INSERT ON "RefereeNomination" ...

-- DB-Level-Gate 3: ReferenceCheck-Antwort nur nach referee_consent
CREATE OR REPLACE FUNCTION ensure_referee_consent_before_response() ...
CREATE TRIGGER trg_ensure_referee_consent BEFORE INSERT ON "ReferenceCheck" ...

-- AuditLog append-only (REVOKE UPDATE, DELETE auf Postgres-Rolle der App)
REVOKE UPDATE, DELETE ON "AuditLog" FROM PUBLIC;
```

RLS-Policies: **nicht zutreffend**, weil das Repo nicht via PostgREST/Supabase-Auth fährt — Tenancy wird in der Next.js-Server-Schicht durch `userId`-Filter erzwungen. Das in einem separaten Doc-Abschnitt klar dokumentieren (Spec verlangte RLS, aber das ergibt hier kein Pattern).

---

## 3. UI-Deliverables

### 3.1 Homepage Section — `components/landing/sections/ConsentFlow.tsx`

(Pfad-Anpassung: Repo hat `components/landing/sections/`, nicht `app/(marketing)/_sections/`.)

- Headline + Sub wie Spec.
- Horizontale Timeline 7 Knoten, Mobile vertikal.
- Icons aus `lucide-react`: `FilePlus, Mail, ShieldCheck, Upload, UserPlus2, Users, FileCheck`.
- Actor-Badges: Farben aus existierenden Tailwind-Tokens (`tailwind.config.ts` lese ich vor Code; Versprechen: keine neuen Farben).
- Consent-Gate-Lock-Animation: lucide `Lock` → `LockOpen` per framer-motion variant-transition, getriggert durch hover/focus.
- Bottom-Drawer: eigene Komponente unter `components/ui/Drawer.tsx`. ARIA-konform (`role="dialog"`, `aria-modal`, Focus-Trap, ESC).
- Meeting-Mode: Toggle, `localStorage` key `candiq-meeting-mode`. Hydration-safe (lese state in `useEffect`, keine Mismatch).
- Konkurrenz-Vergleichs-Tabelle wie Spec, semantic `<table>` mit `<caption>` für a11y.

Einbinden auf:
- `app/page.tsx` (Homepage) — als neue Section unterhalb Hero.
- `app/datenschutz/page.tsx` — als zusätzlicher Block oberhalb des bestehenden DSGVO-Textes, Anchor `#consent-flow`.

### 3.2 Dashboard Timeline — `components/dashboard/ConsentTimeline.tsx`

(Pfad-Anpassung: Repo nutzt `app/dashboard/candidates/[id]/page.tsx` als Check-Detail, nicht `app/dashboard/checks/[id]/`. Werde existierende Detail-Page so erweitern, dass die Timeline dort angezeigt wird. Falls du wirklich eine neue Route willst, sag Bescheid.)

- Wiederverwendung des `<ConsentFlowStep>`-Renderers aus 3.1 → garantiert visuelle Wiedererkennung.
- Status-Farben: pending=grau / in_progress=blau pulsierend / completed=grün / blocked=orange / revoked=rot. Tailwind-Token-Mapping vorab in PR-Description.
- Audit-Trail-Aufklapp: `<details>` semantic, kein Custom-Accordion.
- "Audit-Trail exportieren": Phase-1 als JSON-Download (Server-Action), Phase-2 PDF (nach deiner Bestätigung).
- "Löschen auf Knopfdruck" (Art. 17): Confirmation-Dialog + Server-Action, cascade-delete via Prisma `onDelete: Cascade`. AuditLog-Eintrag bleibt mit `payload.deletedCheckId` erhalten.

---

## 4. API / Server Actions

- `POST /api/checks` — bereits existiert (`app/api/checks/`) → **erweitern**, nicht neu. HR legt Check an, Status `request_created`, Invite-Mail über bestehende Mail-Pipeline (`lib/email.ts` checke ich vor Code).
- `app/candidate/consent/[token]/page.tsx` — neue Route (Repo hat keine `(candidate)`-Route-Group; nutze flach `app/candidate/...`, kein Layout-Mismatch). Kandidaten-Landing: Klartext + Toggle → erst dann Upload-UI + Referee-Nominierung freigeschaltet.
- Server Action `recordConsent(candidateId, stepId, payload)` in `lib/flow/transitions.ts` → schreibt `ConsentEvent`, ruft `nextStatus()`, schreibt `AuditLog`.
- **Keine `<form>`-Tags** wie gefordert — `<button formAction={serverAction}>` direkt.

---

## 5. Tests

- `__tests__/flow/transitions.test.ts` — pure-function unit tests aller erlaubten/verbotenen Status-Übergänge.
- `__tests__/db/consent-gates.test.ts` — integration test: versucht `INSERT INTO "Document"` ohne ConsentEvent → erwartet Postgres-Exception. Braucht eine Test-DB; nutze `DATABASE_URL_TEST` falls vorhanden, sonst skip mit Warnung (CI-Pipeline-Frage). → **Punkt für deine Entscheidung.**
- `__tests__/components/ConsentFlow.test.tsx` — Snapshot + a11y-check (axe).

---

## 6. Akzeptanzkriterien — Mapping

| # | Spec-Kriterium | Wie erfüllt |
| - | -------------- | ----------- |
| 1 | Section sichtbar Mobile+Desktop, Lighthouse a11y ≥ 95 | `lighthouse --only-categories=accessibility` in CI; manueller Check + Screenshot in PR. |
| 2 | Meeting-Mode mit Pfeiltasten, Browser-Back funktioniert | `useEffect` `keydown`-Listener; Step-Index in URL-Hash, Browser-Back navigiert Steps. |
| 3 | DB wirft Exception ohne ConsentEvent | Trigger + Test in `__tests__/db/consent-gates.test.ts`. |
| 4 | Dashboard-Timeline = identisch zur Homepage | Gleiche `<ConsentFlowStep>`-Komponente, gleiche `CONSENT_FLOW`-Konstante. |
| 5 | Audit-Trail-Export enthält Timestamp/Actor/Legal/Version | JSON-Schema in `lib/flow/audit-export.ts`. PDF nach Bestätigung. |
| 6 | Kein `any`, keine Custom-Color außerhalb Token-Datei | `tsc --noEmit` + grep-CI-Check über `bg-[#`/`text-[#`/`any\b`. |

---

## 7. Reihenfolge & Commits

```
1. feat(flow): add consent-steps single source of truth (lib/flow/consent-steps.ts + transitions.ts + unit tests)
2. feat(db): consent events, referee nominations, DB-level consent gates (Prisma schema + SQL trigger migration)
3. feat(ui): shared ConsentFlowStep renderer + Drawer primitive (no shadcn)
4. feat(marketing): consent-flow section on / and /datenschutz with meeting-mode
5. feat(dashboard): consent timeline on candidate detail page + audit-trail JSON export + delete action
6. feat(candidate): consent landing page at /candidate/consent/[token]
7. feat(api): extend POST /api/checks for invite flow + recordConsent server action
8. test: db consent-gates integration test (skipped if no DATABASE_URL_TEST)
9. docs: PR description, CHANGELOG-Note, lokale Demo-Anleitung
```

Jeder Commit individuell kompilierbar und lintbar.

---

## 8. Offene Punkte — bitte entscheiden, bevor ich Code schreibe

1. **PDF-Pipeline für Audit-Trail-Export**: Existiert eine? Falls nein → Phase-1 JSON ok, oder soll ich `@react-pdf/renderer` neu reinziehen (Bundle-Hit ≈ 250 KB)?
2. **Dashboard-Route**: Repo hat `dashboard/candidates/[id]`, kein `dashboard/checks/[id]`. → Timeline an Candidate-Detail anflanschen (mein Vorschlag), oder neue Route?
3. **Test-DB für Integration-Tests**: Gibt's eine `DATABASE_URL_TEST`? Sonst CI-only mit Postgres-Container.
4. **Vercel-Deploy-Blocker zuerst**: PR #20 (Stripe-MVP) ist gemerged, aber Production zeigt das alte Bundle. Wahrscheinlich kippt `prisma migrate deploy` im Build. → Empfehlung: **vorab** kurzes Hotfix-PR (`migrate deploy` aus `vercel.json` raus, Migration manuell ausführen) damit der Consent-Flow später nicht ins gleiche Loch fällt. **Soll ich das vorab machen?**
5. **Mail-Versand**: Welche Pipeline wird genutzt (Resend? Postmark?) — checke ich vor Code, aber wenn du's weißt, spar mir den Lookup.

---

## 9. Was ich NICHT mache (wie im Prompt verlangt)

- Keine Cookie-Banner-Logik.
- Keine Mock-Daten in `seed.sql` (nur `dev_seed.sql` falls explizit nötig, gated auf `NODE_ENV !== 'production'`).
- Keine breaking changes ohne explizite Auflistung — siehe Abschnitt 2 Candidate/Document.
- Keine `<form>`-Tags in React-Komponenten.

---

**Wenn die obigen 5 Punkte beantwortet sind und du das Schema-Mapping aus Abschnitt 2 abgenickt hast, lege ich los — Commit-Reihenfolge wie Abschnitt 7.**

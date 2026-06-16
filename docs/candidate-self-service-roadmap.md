# Candidate Self-Service Roadmap

> **Status:** Phase 1 live (Marketing-Landing + Waitlist). Phase 2 wartet auf
> Validierungs-Trigger.
> **Letzte Aktualisierung:** 16. Juni 2026.
> **Owner:** Ricardo Serrano (Gründer)

## Vision

Bewerber:innen verifizieren ihre Referenzen **proaktiv** durch candiq —
analog einer SCHUFA-Auskunft für Recruiting. Sie teilen einen
candiq-verifizierten Link mit Arbeitgebern und schaffen sich damit einen
strukturellen Vertrauens-Vorsprung in einer Welt, in der CVs durch
KI-Tools beliebig manipulierbar geworden sind.

## Verbindliche Architektur-Entscheidungen (16. Juni 2026)

Drei Architektur-Weichenstellungen sind bereits getroffen und gelten für
alle folgenden Phasen:

### 1. Auth-Architektur — Eigene Tabelle `CandidateAccount`

Bewerber-Konten leben in einer **separaten Prisma-Tabelle**, getrennt vom
`User`-Modell (HR-Konten). Begründung:

- Saubere DSGVO-Datenfluss-Trennung — HR-Kunden sind „Verantwortliche",
  Bewerber sind „Betroffene" *und* gleichzeitig „Verantwortliche" für
  ihre Self-Service-Verifikationen. Architektur muss das spiegeln.
- HR-Felder wie `plan`, `billingInterval`, `stripeCustomerId`,
  `accountType` ergeben für Bewerber keinen Sinn — gemeinsame Tabelle
  würde diese Felder verschmutzen.
- Zwei klar getrennte Auth-Flows: HR-Login bleibt bei `/login`, Bewerber
  unter `/bewerber/login` mit eigenen NextAuth-Cookies (`__Secure-candidate.session-token`).
- Audit-Trail bleibt sauber trennbar.

**Kostet:** 2× Schema-Migrationen + 2× Auth-Flows zu warten.
**Spart:** Wochen an späterer Refactoring-Arbeit, sobald Datenflüsse
divergieren.

### 2. Monetarisierung — Erstmal kostenlos (Phase 2)

Phase 2 launcht **ohne Stripe-B2C-Integration**. Bewerber zahlen nichts.

- Spart 3–4 Tage Stripe-B2C-Setup
- Nachfrage-Validierung steht im Fokus, nicht Pricing-Optimierung
- Pricing-Entscheidung wird nach 50–100 aktiven Bewerber-Konten
  getroffen (Datenpunkte: wie viele Stationen pro Profil, wie viele
  Re-Verifikationen, wie viele aktive Profile nach 90 Tagen)
- Spätere Optionen offen: Pauschale pro Verifikation,
  Profil-aktiv-Abo, oder weiterhin B2B-quersubventioniert

### 3. Anti-Fraud — Referenzgeber-Identitäts-Check

Höchste Vertrauens-Sicherheit, kostet höchsten Reviewer-Aufwand. Aber:
das gesamte Bewerber-Self-Service-Versprechen steht und fällt mit
Glaubwürdigkeit. Ohne harte Identitäts-Sicherung wird das Produkt zur
Lachnummer („Bewerber-Bewerber-Verifikationen").

**Mechanik:**
- Pflicht: geschäftliche E-Mail der Referenz-Person (kein Freemail,
  also kein gmail.com / web.de / gmx.de / hotmail.com etc.)
- Reviewer ruft an UND verifiziert per LinkedIn / Xing, dass die Person
  tatsächlich an der angegebenen Firma in der angegebenen Position
  arbeitet/gearbeitet hat
- Bei Diskrepanz zwischen LinkedIn-Profil und Bewerber-Angabe →
  Verifikation wird gestoppt, Bewerber bekommt Hinweis
- Reviewer-Tool bekommt eine LinkedIn-/Xing-Pflichtabfrage in den
  Workflow eingebaut

---

## Phase 1 — DELIVERED (16. Juni 2026, PR #106)

**Live:** `candiq.de/bewerber`

- Marketing-Landing mit Hero, Problem, 3-Schritt-Funktion, Benefits,
  Waitlist, 7 FAQ-Items, DSGVO-Rahmen, Final-CTA
- Waitlist-API (`POST /api/candidate-waitlist`), rate-limited,
  AuditLog, HubSpot-Sync mit `candiq_source=candidate_self_service_waitlist`
- Storage-Reuse: `LeadMagnetRequest` mit `slug='candidate-self-service'`
  (zero Schema-Touch)
- Footer-Link „Bewerber:innen (Beta Q4 2026)", Sitemap + robots
- Datenschutz §14 ergänzt um Bewerber-Waitlist

**Zweck:** Marketing-Wert + Nachfrage-Daten ohne Architektur-Risiko.

---

## Validierungs-Trigger für Phase 2

Phase 2 wird **nicht** automatisch gestartet. Mindestens einer dieser
Trigger muss greifen:

| Trigger | Aktion |
|---|---|
| ≥50 Waitlist-Signups innerhalb 4 Wochen | Phase 2 starten |
| ≥20 Signups **plus** ≥3 explizite Beta-Anfragen via Mail/LinkedIn | Phase 2 starten |
| <20 Signups in 4 Wochen | **Pivot oder Re-Positioning**, Phase 2 nicht starten |

**Messen:** Waitlist-Anmeldungen sind in `LeadMagnetRequest` mit
`slug='candidate-self-service'` einsehbar.

```sql
SELECT COUNT(*) FROM "LeadMagnetRequest"
WHERE slug = 'candidate-self-service';
```

---

## Phase 2 — Bewerber-Account-Foundation (geplant, 5–8 Werktage)

**Voraussetzung:** Validierungs-Trigger erreicht.

### Schema (additive Migration)

```prisma
model CandidateAccount {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  firstName     String
  lastName      String
  phone         String?
  consentVersion String  @default("1.0")
  emailVerifiedAt DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastLoginAt   DateTime?
  deletedAt     DateTime?  // soft-delete für 30d-Reue-Periode
  profile       CandidateProfile?
  resetTokens   CandidatePasswordResetToken[]
  auditLogs     CandidateAuditLog[]
  @@index([email])
}

model CandidatePasswordResetToken {
  id          String           @id @default(cuid())
  candidateAccountId String
  candidateAccount   CandidateAccount @relation(fields: [candidateAccountId], references: [id], onDelete: Cascade)
  token       String           @unique  // SHA-256 hash
  expiresAt   DateTime
  usedAt      DateTime?
  ip          String?
  createdAt   DateTime         @default(now())
  @@index([candidateAccountId])
  @@index([expiresAt])
}

model CandidateAuditLog {
  id                 String   @id @default(cuid())
  candidateAccountId String?
  candidateAccount   CandidateAccount? @relation(fields: [candidateAccountId], references: [id], onDelete: SetNull)
  action             String
  entity             String
  entityId           String?
  details            String?
  ip                 String?
  createdAt          DateTime @default(now())
  @@index([candidateAccountId])
}
```

### NextAuth-Config

Zweite NextAuth-Instanz oder zweiter Provider mit eigenem
`session.strategy = 'jwt'`, eigenen Cookie-Namen
(`__Secure-candidate.session-token`), eigenem `pages.signIn = '/bewerber/login'`.

### Routes

- `/bewerber/register` — Registrierungs-Form mit granularer Einwilligung
  (3 Pflicht-Checkboxen: AGB, DSGVO, Reference-Check-Verfahren)
- `/bewerber/login` — Login mit E-Mail + Passwort
- `/bewerber/forgot-password`, `/bewerber/reset-password` — Recovery
- `/bewerber/(dashboard)/` — Route-Group mit eigenem Layout + Sidebar
  - `/bewerber/dashboard` — Übersicht (leer in Phase 2, befüllt in Phase 3)
  - `/bewerber/settings` — Profil-Daten, Passwort-Change, DSGVO-Export, Konto-Löschung

### Middleware

- Pfad-Matcher erweitert um `/bewerber/(dashboard|settings|profile|stations)/.*`
- NextAuth-Schutz auf dem zweiten Cookie, sonst Redirect zu `/bewerber/login`
- Bestehende CSP + Nonce bleiben unangetastet

### Was Phase 2 NICHT enthält
- Kein Profil-Anlegen (Phase 3)
- Keine Stationen, keine Referenzgeber (Phase 3)
- Keine Reviewer-Workflows (Phase 3)
- Kein Profil-Sharing (Phase 4)

### Smoke-Checklist Phase 2
- `/bewerber/register` 200, alle drei Consent-Boxen Pflicht
- `/bewerber/login` mit korrekten Credentials → `/bewerber/dashboard`
- `/bewerber/dashboard` ohne Login → 307 → `/bewerber/login`
- `/login` (HR) und `/bewerber/login` haben **getrennte Cookies** —
  Bewerber kann nicht ins HR-Dashboard, HR nicht ins Bewerber-Dashboard
- Bewerber-`AuditLog`-Entries landen in eigener `CandidateAuditLog`-Tabelle
- HR-Routes (`/dashboard`, `/candidates`, etc.) bleiben unverändert

---

## Phase 3 — Profil + Stationen + Reviewer-Workflow (geplant, 7–10 Werktage)

**Voraussetzung:** Phase 2 stabil + 5–10 Pilot-Bewerber:innen für Co-Development.

### Schema (additive)
```prisma
model CandidateProfile {
  id                   String   @id @default(cuid())
  candidateAccountId   String   @unique
  candidateAccount     CandidateAccount @relation(fields: [candidateAccountId], references: [id], onDelete: Cascade)
  publicSlug           String   @unique  // für /profil/<slug>-URLs in Phase 4
  bio                  String?
  linkedinUrl          String?
  xingUrl              String?
  trustScore           Int      @default(0)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  stations             CandidateStation[]
}

model CandidateStation {
  id                  String  @id @default(cuid())
  candidateProfileId  String
  candidateProfile    CandidateProfile @relation(fields: [candidateProfileId], references: [id], onDelete: Cascade)
  companyName         String
  position            String
  startDate           String   // "MM/YYYY"
  endDate             String?  // null = "heute"
  responsibilities    String?
  status              String   @default("DRAFT")  // DRAFT | INVITED | REJECTED_BY_REFEREE | REVIEWER_QUEUED | REVIEWER_IN_PROGRESS | COMPLETED_VERIFIED | COMPLETED_DISCREPANCY | CANCELED
  refereeFirstName    String?
  refereeLastName     String?
  refereePosition     String?
  refereeEmail        String?  // PFLICHT: geschäftlich, kein Freemail
  refereePhone        String?
  refereeLinkedinUrl  String?  // optional, hilft Reviewer beim Check
  reviewerNotes       String?
  reviewerCheckId     String?  // ggf. Re-Use des bestehenden ReferenceCheck-Modells
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  @@index([candidateProfileId])
  @@index([status])
}
```

### Routes
- `/bewerber/profil` — Profil bearbeiten
- `/bewerber/stationen` — Liste der Stationen
- `/bewerber/stationen/neu` — Station anlegen (inkl. Referenzgeber-Daten)
- `/bewerber/stationen/[id]` — Status + Reviewer-Feedback

### Reviewer-Workflow-Erweiterung
- Reviewer-Queue (`/reviewer/queue` für HR-Owner heute) erweitern um
  Bewerber-initiierte Aufträge
- Neue UI-Sektion „Identitäts-Check" mit:
  - Plausibilitäts-Test geschäftliche E-Mail (Domain matcht Firmenname?)
  - LinkedIn/Xing-Lookup-Anstoß (manuell, mit Quick-Link)
  - Reviewer kann "Identität bestätigt" / "abgelehnt" markieren
- Referenzgeber-Anschreiben um neuen Hinweis ergänzt: „Bewerber:in hat
  Sie als Referenz angegeben und dieser Verifikation zugestimmt.
  Bitte bestätigen Sie kurz Ihre Identität."

### Anti-Fraud-Logik (im Code, hart)
- E-Mail-Validierung auf Freemail-Domains:
  ```ts
  const FREEMAIL = new Set([
    'gmail.com', 'googlemail.com', 'web.de', 'gmx.de', 'gmx.net', 'gmx.com',
    'hotmail.com', 'hotmail.de', 'outlook.com', 'outlook.de', 'live.com',
    'yahoo.com', 'yahoo.de', 'aol.com', 'mail.com', 't-online.de', 'icloud.com',
    'me.com', 'proton.me', 'protonmail.com', 'tutanota.com',
  ])
  function isBusinessEmail(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase()
    return domain ? !FREEMAIL.has(domain) : false
  }
  ```
- Bewerber-Domain darf nicht gleich Referee-Domain sein (Self-Referencing)
- Bewerber darf sich nicht selbst als Referee angeben (E-Mail-Match)

### Smoke-Checklist Phase 3
- Station mit Freemail-Referenz → 400 mit klarer Fehlermeldung
- Station mit identischer Bewerber-/Referee-E-Mail → 400
- Reviewer-Queue zeigt Bewerber-Aufträge separat markiert
- Identitäts-Check-UI im Reviewer-Tool funktional
- Bewerber sieht Status-Updates in Echtzeit (Live-Status pro Station)

---

## Phase 4 — Verifiziertes-Profil-Sharing + Badge (geplant, 5–7 Werktage)

**Voraussetzung:** Phase 3 produktiv genutzt + Anwalts-Review für separate Bewerber-DSGVO-Erklärung.

### Public-Profile-URL
- `/profil/<publicSlug>?access=<accessToken>` — private URL, nur mit Token
- Schema: `CandidateProfileAccessToken` mit `recipientEmail`, `expiresAt`,
  `accessedAt`-Array, `revokedAt`
- Bewerber generiert Token im Dashboard, schickt URL selbst
- Zugriffs-Log: bei jedem View wird `accessedAt` + IP gespeichert
- Bewerber sieht im Dashboard: wer (Empfänger-E-Mail) hat wann wie oft
  reingesehen

### Badge-Generierung
- SVG-Generator-Endpoint `/api/profil/<slug>/badge.svg`
- Verschiedene Größen + Sprachen (DE/EN)
- Markdown-Snippet zum Kopieren für LinkedIn-Posts:
  `[![candiq-verifiziert](https://candiq.de/api/profil/abc123/badge.svg)](https://candiq.de/profil/abc123?access=...)`

### Separate Bewerber-DSGVO-Erklärung
- `/bewerber/datenschutz` als eigene Seite
- Komplette Datenfluss-Doku: was gespeichert, wo, wie lange, an wen
- Explizite Klarstellung: Bewerber ist Verantwortlicher für sein
  Self-Service-Profil, candiq ist Auftragsverarbeiter
- Anwalts-Review **zwingend** vor Live-Gang dieser Phase

### Anti-Pattern: Was NICHT gebaut wird
- Kein öffentliches Profil-Verzeichnis
- Keine Suchfunktion für Profile
- Kein "Find candidates" für Recruiter
- Kein Datenverkauf, kein Marktplatz
- candiq bleibt Tool, nicht Plattform

---

## Phase 5+ (out of scope für initialen Roll-out)

- Stripe-B2C-Integration (sobald Pricing entschieden)
- Multi-Language (EN-Bewerber-Flow)
- API für ATS-Integrationen (Recruiter pullt Verifikations-Status)
- Mobile-App (Bewerber-Notifications)

---

## Decisions log

| Datum | Entscheidung | Begründung |
|---|---|---|
| 2026-06-16 | `CandidateAccount` als eigene Tabelle | DSGVO-Klarheit, klare Datenfluss-Trennung |
| 2026-06-16 | Phase 2 launcht ohne Pricing | Validierung first, Pricing nach Daten |
| 2026-06-16 | Referenzgeber-Identitäts-Check via geschäftl. E-Mail + LinkedIn | Trust-Anchor des gesamten Produkts |
| 2026-06-16 | Phase 1 nutzt `LeadMagnetRequest` als Storage | Zero-Schema-Risk in Initial-Launch |

---

## Validierungs-Dashboard (manuell, bis Phase 2)

Solange Phase 2 nicht läuft, Waitlist-Status manuell prüfen:

```bash
# Prisma Studio gegen Production-DB (mit Vorsicht!)
DATABASE_URL="$PROD_DATABASE_URL" npx prisma studio

# Oder: SQL-Query
psql "$PROD_DATABASE_URL" -c \
  "SELECT COUNT(*) AS signups, MAX(\"createdAt\") AS latest
   FROM \"LeadMagnetRequest\"
   WHERE slug = 'candidate-self-service';"
```

Bei wachsenden Zahlen kann Cowork-Session Phase 2 via Cowork-Prompt
(siehe Repo-Wiki oder Chat-Historie) anwerfen.

# zvoove-Gespräch — Tech-FAQ (Vorbereitung)

Antworten auf die harten Fragen, die ein zvoove-Tech-/Security-Team stellen wird.
Ehrlich, aus dem tatsächlichen Codestand. Interne Vorbereitung.

---

### 1. Wo liegen die Daten? Ist das DSGVO-konform?
EU, Frankfurt (Supabase/Postgres, Vercel EU, Blob EU, Resend). Referenzprüfung läuft einwilligungsbasiert (Art. 6 Abs. 1 lit. a). Löschkonzept: automatische Löschung nach 180 Tagen, AuditLog wird nach Frist pseudonymisiert. Datenschutzerklärung listet alle Subprozessoren. **Offen/ehrlich:** DSFA/TOM/RoPA als Formaldokumente sind im Legal-Workstream (technische Basis liegt vor).

### 2. Wie stellt ihr sicher, dass ein importierter Bewerber nicht ohne Einwilligung geprüft wird?
Hart im Code: importierte Kandidaten starten `gdprConsent=false`, `status=PENDING`, CVs `AWAITING_CONSENT`, Checks `OPEN`. Ein `consent-guard` **wirft**, wenn Import-Code diese Werte umgehen will. Reviewer-Zugriff erst nach Bewerber-Einwilligung per Magic-Link. Das ist mit 7 dedizierten Tests abgesichert und identisch zum manuellen Anlage-Pfad — die Integration bekommt **keinen** Sonderweg.

### 3. Wie schützt ihr unseren API-Key?
AES-256-GCM-verschlüsselt at-rest (96-bit IV, 128-bit Auth-Tag, Tamper-Detection). Nur der Envelope + ein maskierter Fingerprint (`abc1…xyz9`) liegen in der DB. Der Klartext-Key verlässt nie den Server-Speicher und wird **nie geloggt** — auch nicht in Fehler-/Retry-Logs. Schlüsselmaterial kommt aus einer ENV-Variable, nie aus dem Code.

### 4. Warum kein Row-Level-Security (RLS) in der DB?
Bewusste Architektur-Entscheidung: candiq nutzt **App-Layer-Enforcement** (Prisma verbindet als Owner, RLS würde umgangen → Scheinsicherheit). Jede Datenzugriffs-Schicht scoped explizit auf den Workspace/Owner; das ist per Route-Test belegt (Owner-Scoping, IDOR-Regression). Konsistent über die gesamte Codebase, inkl. der zvoove-Module. RLS-Refactor wäre ein eigener, separater Schritt — dokumentiert, nicht „vergessen".

### 5. Wie geht ihr mit Mandanten-Trennung um (Multi-Tenant)?
Heute: ein `User` = ein Workspace (`workspaceId = User.id`). Die zvoove-Modelle nutzen bereits das Feld `workspaceId`, damit der Q4-2026-Multi-Tenant-Refactor **kein Schema-Bruch** wird, nur ein FK-Wechsel. Jede zvoove-Connection ist per `workspaceId @unique` isoliert.

### 6. Was passiert bei einem verpassten Sync / doppeltem Import?
Idempotenz über einen SHA-256-Hash der relevanten Profilfelder (`ZvooveCandidateMap.externalHash`) + `UNIQUE(workspace, zvooveCandidateId)`. Re-Sync passiert nur bei echter Änderung; `updatedAt`-only-Änderungen triggern **keinen** Re-Import (kein Endlos-Loop). Auf candiq-Billing-Seite gibt es analog einen täglichen Stripe-Reconciliation-Cron gegen verlorene Webhooks — dieselbe Robustheits-Philosophie gilt für den zvoove-Sync.

### 7. Welche Felder zieht ihr aus zvoove? Auch sensible Daten?
Nur Name, Position und Career-History (Stationen) — das Minimum für die Referenzprüfung. **Keine** besonderen Kategorien nach Art. 9 DSGVO. Referenzgeber-Kontaktdaten importieren wir **nicht** aus zvoove; die nennt der Bewerber selbst im Einwilligungs-Portal.

### 8. Wie schreibt ihr das Ergebnis zurück?
Nach Abschluss: `result` (VERIFIED/DISCREPANCY_FOUND/UNREACHABLE/DECLINED) + ein **auth-geschützter** Report-Link (kein öffentlicher Blob) + optionaler Diskrepanz-Hinweis. Das exakte Zielformat (Note/Comment am Bewerber vs. Custom-Field) stimmen wir mit euch ab — genau dafür brauchen wir eure Doku.

### 9. Wie stabil ist der Client gegen eure API?
Retry mit Exponential-Backoff (max 3, 500 ms/1,5 s/4,5 s) bei 429/5xx, 15 s-Timeout, fail-fast bei Tenant-Down, strukturierte Fehler statt loser Strings. Der Client ist Interface-first (DI), gegen einen In-Memory-Mock getestet.

### 10. Vendor-Lock-in? Was, wenn der Kunde candiq wieder abschaltet?
Die Integration ist pro Kunde über ein Feature-Flag/Connection-Objekt aktivierbar und ebenso deaktivierbar. Keine Datenkopie über das Nötige hinaus; Löschkonzept greift. Der API-Key ist jederzeit widerrufbar (in zvoove löschen → Connection wird ungültig).

### 11. Habt ihr das schon gegen echtes zvoove getestet?
**Ehrlich: nein.** Das Fundament (Schema, Krypto, Mapper, Consent-Guard, Client, 33 Tests) steht und ist gegen einen Mock getestet. Die konkreten Endpunkte/Auth-Header sind aktuell begründete Annahmen aus ATS-Konvention und als Platzhalter markiert. **Genau deshalb reden wir** — mit eurer API-Doku + einem Sandbox-Tenant ersetzen wir die Platzhalter und fahren einen Pilot.

### 12. Wie schnell könnt ihr live sein?
Eine Demo des vollständigen candiq-Flows gegen eine Mock-Gegenstelle: kurzfristig. Live gegen einen echten Tenant: nach Erhalt von API-Doku + Sandbox + Auth-Bestätigung + Sync-Mechanismus — dann Platzhalter ersetzen, Pilot, AVV-Update. Der Weg ist kurz, weil das Fundament schon diligence-fähig steht.

---

## Rote Linien / worauf NICHT eingehen
- Nichts versprechen, was gegen echtes zvoove verifiziert wäre — ist es nicht.
- Consent-Gate ist nicht verhandelbar; keine „Express-Imports ohne Einwilligung".
- Keine Zusagen zu Art.-9-Daten oder Datenexport außerhalb der EU.
- Keinen fixen Live-Termin nennen, bevor Sandbox + Doku vorliegen.

# zvoove-Integration

Bidirektionale Anbindung von **zvoove Recruit** an candiq für Personaldienstleister.

> **Status**: Phase 1 (Fundament) + Phase 2 (Demo gegen Mock). Default OFF
> (`INTEGRATION_ZVOOVE_ENABLED=false`). Vor Production-Schaltung müssen die
> `TODO(zvoove-doc):`-Stellen gegen die per-Tenant Swagger-Doku unter
> `<tenant>/swagger` verifiziert werden.
>
> **Demo-Modus** (`INTEGRATION_ZVOOVE_DEMO=true`): `getZvooveClientForWorkspace`
> liefert den `MockZvooveClient` mit 2 Fixtures. `/integrations/zvoove` +
> `/api/integrations/zvoove/{import,push-result}` fahren den VOLLEN candiq-Flow
> (Import → Consent → Check → Rückschreiben) ohne echten Tenant. Für Sales-Demos.
>
> **Phase 2 neu:** `sync.ts` (Import/Push + Consent-Guard-Enforcement),
> API-Routes `connect`/`import`/`push-result`, UI `app/(dashboard)/integrations/zvoove`.
> Tests: `__tests__/zvoove-sync.test.ts`.

## Architektur

```
┌─────────────────────┐                  ┌────────────────────┐
│   zvoove Recruit    │  X-API-Key       │      candiq        │
│  (Tenant-Subdomain) │ ◄────HTTP───────►│  /api/integrations │
└─────────────────────┘                  │      /zvoove/*     │
                                         └─────────┬──────────┘
                                                   │
                                ┌──────────────────┼──────────────────┐
                                ▼                  ▼                  ▼
                       ┌─────────────────┐  ┌─────────────┐  ┌────────────────┐
                       │ ZvooveConnection│  │ CandidateMap│  │   SyncLog      │
                       │ apiKey AES-GCM  │  │ workspace + │  │ append-only    │
                       │                 │  │ external_hash│ │ Audit/DSGVO    │
                       └─────────────────┘  └─────────────┘  └────────────────┘

   Import-Flow:                          Push-Flow:
   1. List candidates (tag=ref-check)    1. candiq-Check abgeschlossen
   2. Upsert candiq.Candidate (PENDING)  2. POST /push-result an zvoove
   3. Magic-Link an Bewerber (Consent!)  3. Note/Comment am Bewerber
   4. Nach Consent: ReferenceCheck OPEN
   5. HR überträgt manuell an Reviewer
```

## Sicherheits-Prinzipien (nicht verhandelbar)

1. **Consent-Gate bleibt**: Importierte Kandidaten starten `gdprConsent: false`,
   `status: PENDING`, Documents `cvStatus: AWAITING_CONSENT`. Reviewer-Zugriff
   erst nach Bewerber-Einwilligung via Magic-Link.
   → enforced in `consent-guard.ts`, getestet in `__tests__/zvoove-integration.test.ts`.

2. **API-Key at-rest verschlüsselt** (AES-256-GCM, `lib/crypto/aes-gcm.ts`).
   Klartext verlässt nie das Server-Memory. Plain-Logging des Keys = NIE.

3. **Application-Layer-Enforcement** (kein RLS). Konsistent mit dem Rest der
   candiq-Codebase (siehe `lib/cv-gate.ts`). RLS-Refactor wäre eigener PR.

4. **Datenminimierung**: Wir ziehen nur die Felder, die für die Referenz-
   prüfung nötig sind (Name, Position, Career-History). KEINE besonderen
   Kategorien nach Art. 9 DSGVO.

5. **Ownership-gated**: Jede zvoove-API-Route verlangt eine eingeloggte
   Session, deren userId = workspaceId der ZvooveConnection ist.

## Kunden-Onboarding (Anleitung für PDL)

1. **Im zvoove-Hub**: Kundenbereich → Service → API-Schlüssel
   → „Neuen Bediener-API-Key erzeugen". Key kopieren.
2. **Tenant-URL notieren**: z.B. `https://<dein-tenant>.europersonal.com`
3. **In candiq**: Einstellungen → Integrationen → zvoove → „Verbinden",
   Tenant-URL + API-Key eintragen.
4. candiq validiert die Connection sofort (GET `/api/v1/me` o.ä.).
5. **Im zvoove-Hub**: relevante Bewerber mit Tag `ref-check` markieren.
   candiq importiert nur diese.
6. candiq schickt automatisch den Magic-Link an den Bewerber. Nach Einwilligung
   übernimmt der HR-Workflow.

## Was noch zu tun ist (vor Prod-Schalter)

- [ ] Per-Tenant Swagger-Doku gegen `client.ts`-Endpoints abgleichen
  (alle `TODO(zvoove-doc):`-Marker)
- [ ] Auth-Header verifizieren (`X-API-Key` vs. `Authorization: Bearer`)
- [ ] Sync-Strategie: Polling via Vercel-Cron vs. Webhook von zvoove (falls supported)
- [ ] UI: `/integrations` Settings-Page für Tenant-URL + Key-Input
- [ ] AVV-Update: zvoove als optionaler Subprozessor (nur wenn Kunde aktiviert)
- [ ] Pilot mit echtem zvoove-Test-Tenant

## Test ausführen

```bash
npx vitest run __tests__/zvoove-integration.test.ts
```

Erwartet: alle Tests grün (Mapper, Consent-Guard, MockClient, Crypto, Flags).

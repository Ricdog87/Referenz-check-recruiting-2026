# candiq × zvoove — Technischer Onepager

*Referenzprüfung als eingebetteter Schritt im zvoove-Recruiting-Workflow.*
Stand 2026-07 · teilbar mit dem zvoove-Team.

---

## Was candiq ist

**DSGVO-konforme Referenzprüfung & CV-Verifikation als SaaS.** Menschliche Reviewer verifizieren die Angaben eines Kandidaten (Stationen, Positionen, Zeiträume) einwilligungsbasiert und nachvollziehbar — mit strukturiertem PDF-Report. Kein Auto-Reject, keine Blackbox. Hosting & Daten in der **EU (Frankfurt)**.

## Der Integrations-Use-Case (bidirektional)

Für zvoove-Recruit-Kunden (Personaldienstleister) wird die Referenzprüfung ein Ein-Klick-Schritt, ohne die zvoove-Oberfläche zu verlassen:

```
zvoove Recruit ──(1) Bewerber "ref-check"───►  candiq
   (Tenant)                                       │
                                                  ├─(2) Consent-Magic-Link an Bewerber
                                                  ├─(3) Reviewer prüft Referenzen
   zvoove Recruit ◄──(4) Ergebnis + Report-Link──┘
```

1. Der PDL markiert einen Bewerber in zvoove zur Prüfung.
2. candiq importiert **nur** die dafür nötigen Stammdaten + Stationen und schickt dem Bewerber den Einwilligungs-Link.
3. Nach Einwilligung prüft ein candiq-Reviewer die Referenzen.
4. candiq schreibt Ergebnis (`VERIFIED` / `DISCREPANCY_FOUND` / …) + auth-geschützten Report-Link nach zvoove zurück.

## Warum das technisch sauber ist (das Verkaufsargument)

- **Einwilligung ist nicht umgehbar.** Importierte Kandidaten starten zwingend ohne Consent (`PENDING`, CV `AWAITING_CONSENT`); Reviewer-Zugriff gibt es erst nach Bewerber-Einwilligung. Hart im Code verankert und getestet.
- **Datenminimierung.** Wir ziehen nur Name, Position, Career-History — **keine** besonderen Kategorien (Art. 9 DSGVO). Referenzgeber-Kontakte nennt der Bewerber selbst, nicht zvoove.
- **Tenant-Secrets verschlüsselt.** zvoove-API-Keys liegen **AES-256-GCM-verschlüsselt** at-rest; Klartext verlässt nie den Server-Speicher, wird nie geloggt.
- **Idempotenter Sync.** SHA-256-Hash über die relevanten Felder → Re-Sync nur bei echter Änderung, kein Doppel-Import.
- **Nachweisbar.** Append-only Sync-Log je Workspace für den DSGVO-Nachweis.

## Was bereits steht

Diligence-fähige **Fundament-Schicht**: verschlüsselte Verbindungs-/Mapping-/Log-Modelle, typisierter HTTP-Client mit Retry/Backoff, reine Mapping-Funktionen, Consent-Guard und **33 grüne Tests** — alles hinter einem Feature-Flag (default aus). Die candiq-Plattform selbst ist produktiv (Live: candiq.de) mit CI, Test-Suite und einem vollständigen technischen Datenraum.

## Was wir von zvoove brauchen (der konkrete Ask)

1. **API-Dokumentation / Swagger** für den relevanten Recruit-Tenant.
2. **Auth-Schema** bestätigen (`X-API-Key` vs. `Bearer`) + Scopes eines Bediener-API-Keys.
3. **Sandbox-/Test-Tenant** für einen Pilot.
4. **Sync-Mechanismus**: unterstützt zvoove Webhooks, oder ist Polling der Weg?
5. Empfohlenes **Rückschreibe-Format** (Note/Comment am Bewerber vs. Custom-Field).

## Time-to-Live

Mit obigem Input ist der Schritt von „Fundament" zu „Pilot gegen echten Tenant" kurz — die Platzhalter-Endpunkte werden gegen die echte Spec ersetzt, dann Pilot + AVV-Update (zvoove als optionaler Subprozessor). Eine **Demo des vollständigen candiq-Flows gegen eine Mock-Gegenstelle** können wir unabhängig davon kurzfristig zeigen.

---

*Kontakt: candiq · r.serrano@recruiting-sg.de*

# 04 — Datenschutz / DSGVO

**Stand:** 2026-07-17. Aus dem Code + `app/datenschutz`, `app/avv`, `app/compliance` abgeleitet. Dies ist **technische** Doku — die verbindliche juristische Bewertung (DSFA, VVT/RoPA, TOM) ist als offener Punkt geführt (s. u. + `09-KNOWN_ISSUES.md` G20).

## Verarbeitungen & Rechtsgrundlage

| Verarbeitung | Daten | Rechtsgrundlage | Beleg |
|---|---|---|---|
| HR-Account | User-Stammdaten | Art. 6 (1) b (Vertrag) | `register` |
| Kandidaten-/Referenzprüfung | Bewerber-PII, CV | Art. 6 (1) a (Einwilligung Bewerber) + f (Personalauswahl) | Consent-Portal, `email.ts:218` |
| Referenzgeber-Kontakt | Name/Firma/Kontakt Dritter | Art. 6 (1) f + Art. 14 Info-Mail | `email.ts:434-527` |
| CV-KI-Analyse (optional) | CV-Text, Referenzgeber-Daten | Einwilligung + `CV_ANALYSIS_LLM_ENABLED` | `lib/cv-analysis/*` |
| Billing | Zahlungs-/Kontaktdaten | Art. 6 (1) b | Stripe |
| Marketing (Lead/Pilot) | Email, Name, Firma | Art. 6 (1) a (Opt-in, DOI Newsletter) | `lead-magnet`, `pilot` |
| Cookie/Analytics | GA4 | Art. 6 (1) a (Cookie-Consent) | `lib/consent.ts` |

## Consent-Mechanik (Bewerber)

1. HR legt Kandidat an → Invite (`consent-invite.ts`) erzeugt HMAC-Magic-Link (`consent-token.ts`), nur SHA-256-Hash in DB, single-use, 14-Tage-TTL.
2. Bewerber öffnet Portal (`candidate/[token]`), lädt CV hoch (→ Blob, `cvStatus=AWAITING_CONSENT`), benennt Referenzgeber, akzeptiert granular.
3. **Accept** (`consent/[token]/accept`) erfasst `ipAccepted`, `uaAccepted`, `consentVersion` und ruft `releaseAllCvsForCandidate` **in derselben Transaction** → `cvStatus=RELEASED`.
4. **Widerruf** (Art. 7 (3), `consent/[token]/revoke`): Status REVOKED, offene Checks gestoppt, CVs gesperrt (`revokeAllCvsForCandidate`), HR-Notification, Audit-Beleg.

Rechtsgrundlagen sind je Verarbeitung **explizit im Code/in den Mails benannt**. Consent-Gate = `lib/cv-gate.ts` (Single Source of Truth, getestet).

## Datenflüsse zu Dritten (Subprozessoren)

| Dienst | PII | Region | Grundlage |
|---|---|---|---|
| Supabase (DB) | alle PII | EU-Frankfurt | AVV |
| Vercel (Hosting/Blob) | alle PII / Dateien | EU | AVV |
| Stripe | Billing-Kontakt | IE → US (SCC/DPF) | Vertrag |
| Resend | Mail-Empfänger + -Inhalt | US (SCC) | Art. 6 (1) b/f |
| Anthropic | CV-Text (nur bei aktivem Flag) | US (SCC) | Einwilligung |
| **OpenAI** | CV-Text (Ausweich-LLM) | US (SCC) | Einwilligung — **jetzt disclosed** (R4-Fix) |
| HubSpot | Lead-/Pilot-PII | IE → US | Art. 6 (1) a/f |
| ElevenLabs / Google | Voice-Demo / Analytics | US | Cookie-Consent |

**Datenminimierung KI:** `CV_ANALYSIS_LLM_ENABLED` default off → ohne explizite Aktivierung verlässt kein CV-Inhalt die Plattform (deterministische Checks laufen weiter). `CV_ANALYSIS_ENABLE_EXTERNAL_LOOKUPS` default off.

## Löschung & Retention (Art. 17)

- **Auto-Cleanup** (`/api/cron/cleanup`, täglich, 180 Tage): Candidates in Finalstatus + Cascade (Documents, Checks, ConsentTokens), abgelaufene ConsentTokens, LeadMagnetRequest, CvAnalysisReport, PilotApplication[REJECTED/WITHDRAWN] — **inkl. der Blob-Dateien** (R2-Fix: `del()` per URL + Report-PDFs per Prefix).
- **User-Löschung** (`/api/gdpr/delete`): DB-Cascade + Blob-Löschung + `GDPR_ACCOUNT_DELETED`-Audit.
- **Auskunft** (`/api/gdpr/export`): strukturierter Export der eigenen Daten.
- **Bewusst behalten:** `GdprConsent` + Audit-Belege (Art.-7-Nachweispflicht) — Aufbewahrung rechtfertigungsbedürftig, s. G10.

## Vorhandene Rechts-Dokumente (im Repo)
`app/datenschutz` (Subprozessor-Liste + SCC/DPF), `app/avv` (Art. 28), `app/compliance`, `app/agb`, `app/impressum`.

## Offene DSGVO-Punkte (nicht Code, sondern Governance)
- **DSFA (Art. 35)** — bei systematischer Verarbeitung von Bewerber-CVs + LLM wahrscheinlich pflichtig, fehlt.
- **TOM-Dokument** + **VVT/RoPA** (Art. 30) als versionierte Artefakte fehlen.
- Empfehlung: als eigenes Legal-Workstream vor Signing erstellen (die technischen Voraussetzungen — Consent, Löschung, Verschlüsselung, Subprozessor-Transparenz — sind gegeben).

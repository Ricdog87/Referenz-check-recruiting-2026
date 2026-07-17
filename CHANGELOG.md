# Changelog

Alle nennenswerten Änderungen an candiq. Format nach
[Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionierung nach [SemVer](https://semver.org/lang/de/).

Vor `0.3.0` wurde ohne Tags releast; die Historie davor ist in der
Git-Commit-Historie nachvollziehbar.

## [Unreleased]

_Noch nicht getaggt. Tag `v0.3.0` wird beim Merge von `feat/dd-readiness`
nach `main` gesetzt._

## [0.3.0] — DD-Readiness

Härtung, Transparenz und interne Werkzeuge im Rahmen der technischen
Due-Diligence-Vorbereitung. Alle Änderungen mit Regressionstests
(Suite 190/190), CI-Gates grün. Feature-Flags default off, Migrationen
additiv, Consent-Gate unangetastet.

### Added
- **KPI-Cockpit** (`/admin/kpi`, Flag `KPI_COCKPIT_ENABLED`, default off):
  server-seitig berechnete MRR/ARR, zahlende Kunden, Check-Volumen
  (gesamt & 30 Tage), Ø Durchlaufzeit bis Report, Credential-Bestand,
  Partner-Kunden. CSV-Export je Metrik. Doppel-Gate Flag + ADMIN-Rolle.
- **Demo-Umgebung** (`npm run demo:seed`): vollständig synthetische
  Staging-Daten (3 Kunden, 1 Partner, Beispiel-Reports), idempotent,
  prod-guarded (harter Abbruch auf `candiq.de`).
- **CI-Pipeline** (`.github/workflows/ci.yml`): Lint · Typecheck · Test ·
  Build + License-Allowlist (kein Copyleft) + gitleaks-Secret-Scan.
- **Login-Rate-Limiting** für HR- und Partner-Auth (IP + E-Mail).
- **Monats-Kontingent** für Referenzprüfungen je Tarif (Umsatz-Integrität).
- **DD-Dokupaket** `docs/due-diligence/01–10` + Top-Level-README + CHANGELOG.

### Changed
- HR-Auth auf Partner-Niveau gehärtet: Passwort-Orakel-Schutz + Session-
  Invalidierung via `passwordChangedAt` (kompromittierte Sessions sterben
  ≤ 1 h statt 24 h).
- Retention-Cron erweitert (Lead-Magnet, CV-Analyse-Reports, abgelehnte
  Pilot-Bewerbungen) inkl. Blob-Aufräumung.
- `next` auf 14.2.35 gepinnt; `undici`/`minimatch`-Overrides.

### Security
- **IDOR behoben** (R1): Mandanten-Gate für `documents/[id]` über alle
  Dokumenttypen.
- **Blob-Löschung** (R2): CV-/Report-Blobs werden bei Cron-Cleanup und
  DSGVO-Löschung tatsächlich aus dem Storage entfernt (Art. 17).
- **LLM-Master-Switch** (R4): ohne `CV_ANALYSIS_LLM_ENABLED` verlässt kein
  CV-Inhalt die Plattform; OpenAI als Subprozessor in der Datenschutz-
  erklärung offengelegt.
- **Next.js-SSRF** (R5) durch Pinning eliminiert.

### Docs
- Ehrliches Known-Issues-Register (`09-KNOWN_ISSUES.md`), inkl. der beiden
  GO-gated Prod-Operationen R3 (private Blobs) und R6 (`migrate deploy`)
  mit Runbooks.
- CV-Analyzer-Referenz nach `docs/cv-analysis.md` verschoben; README.md ist
  jetzt ein echtes Projekt-README.

## [0.2.1] — Baseline vor DD-Readiness

Ausgangsstand der Tech-DD: produktive candiq-Plattform (Referenzprüfung,
Reviewer-Workflow, Stripe-Billing, Partner-Programm, CV-Analyse). Details
siehe Git-Historie bis Commit-Stand `feat/dd-readiness`-Fork.

[Unreleased]: https://github.com/Ricdog87/Referenz-check-recruiting-2026/compare/main...feat/dd-readiness

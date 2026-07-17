# candiq — Due-Diligence-Paket

Technischer Datenraum für die Käufer-DD. Alle Aussagen aus dem Code abgeleitet, Stand `feat/dd-readiness`, 2026-07-17.

| Dokument | Inhalt |
|---|---|
| [00-AUDIT_REPORT](00-AUDIT_REPORT.md) | Ampel-Findings (ROT/GELB/GRÜN) + Fix-Status + Roadmap |
| [01-ARCHITECTURE](01-ARCHITECTURE.md) | Stack, C4-Kontext/Container, Kernflüsse (Mermaid) |
| [02-DATA_MODEL](02-DATA_MODEL.md) | ER-Diagramm + PII-Kennzeichnung je Tabelle |
| [03-SECURITY](03-SECURITY.md) | Auth-Domänen, App-Layer-Enforcement, Secrets, Verschlüsselung |
| [04-PRIVACY_DSGVO](04-PRIVACY_DSGVO.md) | Rechtsgrundlagen, Consent-Mechanik, Löschung, Subprozessoren |
| [05-INTEGRATIONS](05-INTEGRATIONS.md) | Stripe/Resend/Blob/LLM/HubSpot/zvoove — real vs. mock, Lock-in |
| [06-OPERATIONS](06-OPERATIONS.md) | Deploy, Envs, Crons, Monitoring, Backup, Incident, R6-Runbook |
| [07-IP_LICENSES](07-IP_LICENSES.md) | Lizenz-Scan (kein Copyleft), Eigencode, Marken/Domains |
| [08-TEST_STRATEGY](08-TEST_STRATEGY.md) | 270 Tests, Abdeckung kritischer Pfade, lokal fahren |
| [09-KNOWN_ISSUES](09-KNOWN_ISSUES.md) | Ehrliches Tech-Debt-Register (offen + behoben) |
| [10-ONBOARDING](10-ONBOARDING.md) | Neuer Dev produktiv in < 1 Tag |

**Kurzfazit:** Überdurchschnittliche Grundhygiene; 5 von 7 ROT-Funden behoben (2 GO-gated Prod-Operationen mit Runbook), 16 GELB behoben, alle mit Regressionstests. Suite 270/270 grün, CI aktiv.

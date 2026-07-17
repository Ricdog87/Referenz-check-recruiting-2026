# 07 — IP & Lizenzen

**Stand:** 2026-07-17. Quelle: `license-checker --production` + Git-Historie.

## Eigenentwicklung vs. Fremdcode
- **candiq-Codebase** (`app/`, `lib/`, `components/`, `prisma/`) ist **Eigenentwicklung**, proprietär (`package.json` → `UNLICENSED`, korrekt für nicht-veröffentlichte Software).
- Kein übernommener Fremdcode-Snippet mit fremder Lizenz identifiziert; Dependencies ausschließlich über npm.

## Dependency-Lizenzen (Production)
Scan-Ergebnis (`npm run license-check`, CI-Gate):

| Lizenz | Anzahl |
|---|---|
| MIT | 235 |
| ISC | 22 |
| Apache-2.0 | 15 |
| BSD-3-Clause | 4 |
| MIT* / BSD-2 / CC-BY-4.0 / 0BSD / Unlicense / (MIT AND …) | je 1–2 |
| UNLICENSED (= candiq selbst) | 1 |

**Kein GPL / AGPL / LGPL / MPL** — keine Copyleft-Verpflichtung, keine Offenlegungspflicht für den proprietären Code. ✅

- **CI-Gate:** `.github/workflows/ci.yml` → `license-check` bricht ab, sobald eine Production-Dependency eine nicht-freigegebene Lizenz einführt (Allowlist in `package.json`).

## Marken / Domains
- **Marke „candiq"** — Markenstatus/Registrierung ist ein Legal-Punkt (nicht aus dem Code ableitbar).
- **Domain:** `candiq.de` (produktiv, Vercel + Resend-DNS-verifiziert).
- Empfehlung DD: Marken-Recherche/-Registrierung + Domain-Inhaberschaft im Datenraum belegen.

## Secrets / Vertraulichkeit
- Secret-Scan über die volle Historie: **0 Leaks**, nie eine echte `.env` committed. Details `03-SECURITY.md`.

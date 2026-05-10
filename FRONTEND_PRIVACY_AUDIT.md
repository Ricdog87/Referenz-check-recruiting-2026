# Frontend Privacy & Security Audit — candiq

**Stand:** 2026-05-10
**Branch:** `claude/check-deployed-branch-br6LA` (Code-identisch zum aktuellen Default-/Deploy-Branch `claude/recruiting-verification-saas-TigaZ` @ `97ff711`)
**Scope:** Frontend (Next.js App Router) + statische Legal-Pages. Backend (APIs, DB, Storage) explizit ausgenommen — wird parallel auf `security/backend-block-1-supabase-storage` gehärtet.
**Methode:** Read-only Code-Audit. Kein Browser-Test, kein Lighthouse-/Observatory-Scan (kommt in Phase 3).

> **Befund-Severity-Schema**
> - **CRITICAL** — Live-Verstoß gegen DSGVO/TTDSG/BFSG oder klare XSS-/Tracking-Lücke. Sofort fixen.
> - **HIGH** — Rechtsrisiko oder schwerer UX-/Privacy-Mangel. In Phase 2 fixen.
> - **MEDIUM** — Best-Practice-Lücke, Theaterei oder Compliance-Halbgarheit. Nach High-Fixes.
> - **LOW** — Polishing, Wording, Konsistenz.

---

## Executive Summary

Das Frontend ist sauber strukturiert (App Router, RSC, klare Trennung Auth/Dashboard/Marketing/Legal), zentrale Header sind in `next.config.js` schon konfiguriert, und die DSGVO-Self-Service-Basis (Export Art. 20, Löschung Art. 17) existiert bereits.

Die schweren Befunde liegen in **drei Clustern**:

1. **Externe Tracker laden ohne Einwilligung**, während die Datenschutzerklärung „nur technisch notwendige Cookies" verspricht. Konkret: **Google Fonts via CDN** (kritisch nach LG München-Urteil) sowie **Vercel Web Analytics + Speed Insights** (TTDSG §25).
2. **Einwilligungs-Bündelung im Registrierungsformular**: Datenschutz **und** AGB werden in einer einzigen Checkbox akzeptiert — verstößt gegen das Kopplungsverbot (Art. 7 Abs. 4 DSGVO).
3. **CSP erlaubt `unsafe-inline` + `unsafe-eval` für Scripts** — XSS-Schutz faktisch deaktiviert, plus **HSTS fehlt komplett**.

Das DSGVO-Self-Service-Center ist mehr Skeleton als Center: es fehlen Berichtigung (Art. 16), Einwilligungs-Historie/Widerruf, Empfänger-Liste, DSB-Kontakt — alles in der Datenschutz-Erklärung versprochen, aber nicht erreichbar im Dashboard.

---

## A) Security Headers & CSP

| # | Sev | Datei:Zeile | Befund | Empfehlung |
|---|---|---|---|---|
| A1 | **CRITICAL** | `next.config.js:21` | CSP enthält `'unsafe-inline'` **und** `'unsafe-eval'` in `script-src` → XSS-Schutz faktisch aus. Begründung im Code-Kontext: framer-motion + dangerouslySetInnerHTML (JSON-LD). | Auf **Nonce-basierte CSP** umstellen. JSON-LD mit Nonce ausliefern. `'unsafe-eval'` raus (Next 14 braucht es nur noch in dev). Migrationspfad: zuerst `'strict-dynamic'` mit Nonce, dann `'unsafe-inline'` als Fallback nur für ältere Browser. |
| A2 | **HIGH** | `next.config.js:11–43` (gesamte `headers()`) | **Strict-Transport-Security fehlt komplett** — kein HSTS, kein `preload`. | `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` in den globalen Header-Block. |
| A3 | **HIGH** | `next.config.js:25–26` + `app/globals.css:1` + `app/layout.tsx:95-96` | CSP whitelistet `https://fonts.googleapis.com` / `fonts.gstatic.com`, weil Google Fonts via CDN geladen werden — DSGVO-Risiko (siehe N1). | Self-Hosting (siehe N1) → diese CSP-Whitelist-Einträge entfernen, dann ist `style-src 'self'` und `font-src 'self'` möglich. |
| A4 | MEDIUM | `next.config.js:24` | `style-src` erlaubt `'unsafe-inline'` (Tailwind-runtime, framer-motion inline-styles). | Nonce-Strategie für styles oder hashed inline-styles, mindestens als Phase-2-Ziel. |
| A5 | MEDIUM | `next.config.js:14–17` | Permissions-Policy nur für `camera`, `microphone`, `geolocation`. Es fehlen `payment=()`, `usb=()`, `interest-cohort=()` (FLoC-Opt-out), `fullscreen=(self)`. | Restriktive Permissions-Policy ergänzen. |
| A6 | MEDIUM | `app/layout.tsx:93–98` | Inline `<script type="application/ld+json" dangerouslySetInnerHTML>` ohne Nonce. Solange `'unsafe-inline'` in CSP, nicht blockiert — wird beim Verschärfen der CSP zur Pflicht. | Nonce über `headers()` propagieren oder JSON-LD via Metadata-API ohne inline-Script ausliefern. |
| A7 | LOW | `next.config.js:40` | API-Cache-Control gesetzt, aber `Pragma: no-cache` und `Expires: 0` fehlen für ältere Caches/Proxies. | Optional, niedriger Impact. |
| A8 | LOW | `next.config.js` | `X-DNS-Prefetch-Control: off` fehlt — DNS-Prefetch leakt z.T. Browsing zu Drittservern. | Header ergänzen. |

**Ziel-Headers nach Phase 2:**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-XXX' 'strict-dynamic'; style-src 'self' 'nonce-XXX'; font-src 'self'; img-src 'self' data: blob: https://*.public.blob.vercel-storage.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()
X-DNS-Prefetch-Control: off
```

---

## B) Client-Side Storage Hygiene

| # | Sev | Datei:Zeile | Befund | Empfehlung |
|---|---|---|---|---|
| B1 | LOW | (gesamtes `app/`, `components/`, `lib/`) | **Keine `localStorage`/`sessionStorage`-Nutzung gefunden**, **keine direkten `document.cookie`-Schreibvorgänge** — sehr saubere Basis. | Beibehalten. In Phase 2 als Lint-Regel verankern. |
| B2 | MEDIUM | `lib/auth.ts:21–34` | NextAuth-Session-Cookie ist `httpOnly`, `Secure`, aber `sameSite: 'lax'` (nicht `Strict`). `Lax` ist NextAuth-Default für OAuth-Redirects — bei reiner Credentials-Auth kann auf `Strict` gestrafft werden. | Auf `sameSite: 'strict'` umstellen, da kein OAuth-Redirect-Flow benötigt wird. |
| B3 | LOW | `app/(dashboard)/settings/SettingsClient.tsx:90–99` | `URL.createObjectURL(blob)` für Export — `revokeObjectURL` wird unmittelbar gerufen ✓. | OK. |

---

## C) Forms & Inputs (AGG + DSGVO)

| # | Sev | Datei:Zeile | Befund | Empfehlung |
|---|---|---|---|---|
| C1 | **CRITICAL** | `app/(auth)/register/page.tsx:308–318` | **Bündelung verboten:** Eine Checkbox akzeptiert gleichzeitig Datenschutzerklärung **und** AGB („Ich habe die Datenschutzerklärung und AGB gelesen und stimme der Verarbeitung meiner Daten zu") — verstößt gegen Kopplungsverbot Art. 7 Abs. 4 DSGVO und vermischt Vertrag (AGB) mit Einwilligung. | **Zwei separate Checkboxen:** (1) „Ich habe die AGB gelesen und akzeptiere sie" — Vertragsschluss, (2) „Ich habe die Datenschutzerklärung gelesen" — Kenntnisnahme (keine Einwilligung, da Verarbeitung auf Art. 6 (1) b läuft). |
| C2 | **HIGH** | `app/(auth)/register/page.tsx:308` | Checkbox-Text vermischt „Datenschutz gelesen" mit „stimme der Verarbeitung zu" — die Verarbeitung läuft aber bereits auf Vertragsbasis (Art. 6 (1) b), eine Einwilligung ist gar nicht erforderlich und eingeholt zu werden, suggeriert aber rechtlich falsche Grundlage und ist außerdem nicht widerrufbar wie eine echte Einwilligung. | Einwilligung nur für tatsächliche Einwilligungs-Verarbeitungen einholen (z.B. Newsletter, Analytics). Vertragsbasis nicht als „Einwilligung" framen. |
| C3 | **HIGH** | `app/waitlist-agency/page.tsx:23–26` | Waitlist-Form: `onSubmit` setzt nur `setSubmitted(true)` — **keine Datenübertragung**, kein Backend-Endpoint. UI gibt aber „Danke! Wir melden uns" zurück → potenzielles Dark Pattern + Rechtsrisiko (User glaubt sich angemeldet). | Entweder Backend-Endpoint anschließen ODER UI klar als „Coming soon" markieren. Bis Backend bereit ist: Stub-Endpoint, der Mail an `hello@candiq.de` triggert. |
| C4 | **HIGH** | `app/waitlist-agency/page.tsx:74–158` | **Kein Datenschutz-Hinweis am Formular**, kein Link zur Datenschutzerklärung, keine Einwilligungs-Checkbox. Pflichtfelder Firmenname, Name, E-Mail, Website, Placements/Jahr werden erfasst → personenbezogen. | Datenschutz-Hinweis + Link zur Erklärung am Formular ergänzen. Da Verarbeitung zur Kontaktaufnahme dient: Art. 6 (1) b/f Anwendung im Hinweis nennen. |
| C5 | **HIGH** | `app/(dashboard)/candidates/new/page.tsx:166–186` | Single-Click-Bestätigung „Der Kandidat wurde informiert und hat eingewilligt" — keine Plausibilisierung, kein Audit-Trail, kein zwei-Schritt-Mechanismus. Kandidaten-Einwilligung ist ein zentraler Compliance-Pfeiler — die UI vermittelt das nicht. | UX-Redesign: zweite Checkbox „Ich versichere, dass mir die Einwilligung schriftlich/per E-Mail vorliegt", Datums-Pflichtfeld, Upload-Slot für Einwilligungs-Dokument. Idealfall: separate Bewerber-Self-Service-Seite mit Magic-Link, die Kandidat selbst signiert. |
| C6 | MEDIUM | `app/(dashboard)/checks/new/NewCheckForm.tsx:90–157` | **Kein Hinweis** „Stelle sicher, dass du die Referenzperson über deine Bewerbung informiert hast" und keine Pflicht-Checkbox dazu. Art. 14 DSGVO greift, sobald wir den Referenzgeber kontaktieren. | Pflicht-Checkbox + Vorlage-Mail-Generator (siehe I1). |
| C7 | MEDIUM | `app/(auth)/forgot-password/page.tsx`, `register`, `waitlist-agency`, `demo` | **Kein Spam-Schutz** (kein Honeypot, kein Cloudflare Turnstile, kein hCaptcha) auf öffentlichen Forms. | Honeypot als minimum (1 versteckter Input mit `autocomplete="off"`, leerer Wert wird abgelehnt). Für Production-grade: Turnstile (DSGVO-freundlicher als reCAPTCHA). |
| C8 | MEDIUM | `app/(dashboard)/candidates/new/page.tsx:140–148` | Frontend-Limit `f.size < 10 * 1024 * 1024` (10 MB), Backend hartet auf 4 MB (`app/api/upload/route.ts:18`). User wählt 6 MB-Datei, Frontend akzeptiert, Backend wirft 400. | Frontend-Limit auf **4 MB** synchron zum Backend setzen. Bei Sprengung: klarer Toast, kein silent Fail. |
| C9 | LOW | `app/(auth)/register/page.tsx:312–315` | `<input type="checkbox" className="sr-only">` mit Custom-Visual ohne `aria-checked`-Sync auf dem sichtbaren `<div>`. | `role="checkbox"` + `aria-checked={gdprAccepted}` auf den sichtbaren Container ODER nativ ohne sr-only stylen. |
| C10 | LOW | `app/(auth)/register/page.tsx:235–241`, `app/(dashboard)/candidates/new/page.tsx:117–125` | E-Mail-Felder im Candidate-Form: `autoComplete` fehlt. | `autoComplete="off"` (für Daten Dritter) bzw. korrekt setzen. |
| C11 | INFO | (alle Forms) | **AGG-Check OK** — keine Pflichtfelder für Geschlecht, Religion, Familienstand, Nationalität, Foto, Geburtsdatum. Saubere Basis. | Beibehalten. Bei Erweiterung der Felder erneut prüfen. |

---

## D) Datenanzeige (Privacy by Default)

| # | Sev | Datei:Zeile | Befund | Empfehlung |
|---|---|---|---|---|
| D1 | **HIGH** | `app/(dashboard)/candidates/page.tsx:115–145` | Kandidatenliste zeigt **vollen Klarnamen + E-Mail** in Tabelle — Privacy-by-Default verlangt Maskierung in List-Views. Schulter-Surf-Risiko, Screenshot-Risiko, Reviewer-Sichtbarkeit. | Default-Maskierung: `Max M.` + `m***@firma.de`. Hover/Click „Vollständig anzeigen" → Audit-Log-Eintrag. |
| D2 | MEDIUM | `app/(dashboard)/candidates/[id]/page.tsx:54–87` | Detail-Seite zeigt PII unmaskiert. OK für Owner-View, aber kein Audit-Trail beim Öffnen. | Server-seitig `Audit-Log: VIEW Candidate <id>` beim Page-Load. |
| D3 | MEDIUM | `app/(dashboard)/candidates/page.tsx:21–32` | Suchparameter `?q=...` enthält potenziell PII (E-Mail-Suche), wird in `searchParams` reflektiert und landet in Browser-History + Server-Logs. | Search-Form auf POST + In-Memory-State umstellen, oder GET-Param nach Submit per `router.replace` aus URL entfernen. |
| D4 | LOW | `app/(dashboard)/candidates/[id]/page.tsx` und `app/report/check/[id]/page.tsx` | **Kein `<title>`-Override mit PII** ✓ — Headers sind reine `<h1>`, Browser-Tab zeigt den Default-Title aus `app/layout.tsx`. Sauber. | Beibehalten. Beim späteren Hinzufügen von `metadata.title` darauf achten, kein Klarname. |
| D5 | LOW | `app/(dashboard)/candidates/[id]/page.tsx:65, 72` | `<a href="mailto:..."` und Telefon `<a href="tel:...">` direkt klickbar — OK, aber `rel="noopener"` und Copy-to-Clipboard wären User-freundlicher und reduzieren Mail-Client-Leak. | Optional. |
| D6 | INFO | `app/(dashboard)/candidates/[id]/page.tsx`, `app/(dashboard)/candidates/page.tsx` | URLs nutzen ausschließlich UUIDs (cuid), **keine PII in URLs** ✓. | Sehr gut. Beibehalten. |

---

## E) File-Upload UI

| # | Sev | Datei:Zeile | Befund | Empfehlung |
|---|---|---|---|---|
| E1 | MEDIUM | `app/(dashboard)/candidates/new/page.tsx:158–164` | Upload läuft synchron in for-Schleife, **kein Progress, kein Cancel, kein Retry** — User sieht nur „Wird angelegt...". | Phase 2: dedizierte `<FileUpload>`-Component mit XHR/Streaming-Progress, Cancel-AbortController, Retry-Button. |
| E2 | MEDIUM | (kein UI-Element) | Keine sichtbare Auflistung „Wo werden meine CVs gespeichert? Wer kann sie sehen?" — Datenschutz erklärt's, aber im Upload-Kontext fehlt die Inline-Info. | Inline-Info-Card am Upload: „Verschlüsselt, nur für Ihren Workspace, Löschung jederzeit möglich" + Link zur Datenschutz. |
| E3 | LOW | `app/(dashboard)/candidates/new/page.tsx:185` | Datei-Liste hat ✕-Button **vor** Upload (nur lokales State). Nach Upload (auf `[id]` Detail-Seite) gibt es **keinen Löschen-Button** für Dokumente. | Phase 2: Löschen-Button auf Detail-Seite, der echten Backend-DELETE triggert (wartet auf Backend). |
| E4 | INFO | `app/(dashboard)/candidates/new/page.tsx:131–138` | MIME + Size client-validiert ✓ — defense-in-depth ist auch Backend-seitig vorhanden. | OK. |

---

## F) Einwilligungs-UI (DSGVO Art. 7)

| # | Sev | Datei:Zeile | Befund | Empfehlung |
|---|---|---|---|---|
| F1 | **CRITICAL** | `app/(auth)/register/page.tsx:308–318` | Siehe C1 — gebündelte AGB+Datenschutz-Checkbox. | C1-Fix. |
| F2 | **HIGH** | (kein Element) | **Widerrufs-Hinweis fehlt** in allen Einwilligungs-UIs. Art. 7 Abs. 3 DSGVO verlangt: "vor Erteilung über Widerrufsrecht informiert". | Bei jeder Einwilligungs-Checkbox: kurzer Hinweis „Sie können Ihre Einwilligung jederzeit unter /einstellungen widerrufen." |
| F3 | **HIGH** | (kein Element) | **Keine granulare Einwilligungsverwaltung** für unterschiedliche Verarbeitungszwecke. Aktuell gibt es nur die eine Bündel-Checkbox. | Sobald Marketing-Funktionen / Analytics einwilligungspflichtig werden: separate Checkboxen pro Zweck (siehe H1). |
| F4 | MEDIUM | `app/(dashboard)/candidates/new/page.tsx:166–186` | Single-Click-Bestätigung der Kandidaten-Einwilligung durch HR ist juristisch dünn. „Ich bestätige, dass die Einwilligung vorliegt" reicht im Prüfungsfall ggf. nicht — Behörden sehen gerne den Originaltext und Datum/Signatur. | Phase 2: separate Bewerber-Self-Service-Seite (Magic-Link). Bis dahin: Datums-Pflichtfeld + Upload des unterschriebenen Einwilligungs-Dokuments + Audit-Log. |
| F5 | LOW | `app/(auth)/register/page.tsx:308` | Touch-Target der Checkbox ist 5×5 (`w-5 h-5`) — unter empfohlenen 44×44 für mobile (WCAG 2.5.5). Der Tap-Bereich ist aber das ganze `<label>` → faktisch okay. | Ausreichend, aber expliziter min-h-[44px] auf mobile besser. |

---

## G) DSGVO Self-Service-Center

Aktueller Stand: `app/(dashboard)/settings/SettingsClient.tsx` enthält **vier** Sektionen — Profil, Passwort, Daten-Übersicht, DSGVO (Export + Löschung).

| # | Sev | Was fehlt | Empfehlung |
|---|---|---|---|
| G1 | **HIGH** | **Berichtigung (Art. 16 DSGVO)** ist nicht erreichbar. User kann zwar Name + Company ändern, aber nicht E-Mail (im UI deaktiviert), nicht die Daten der von ihm erfassten Kandidaten. | Edit-Workflow für Kandidaten-Daten ist über `/candidates/[id]` möglich → in Settings darauf verlinken. E-Mail-Berichtigung über Support oder Re-Auth-Flow. |
| G2 | **HIGH** | **Einwilligungs-Historie** und **Widerruf-Knopf** fehlen. | Eigene Sektion „Meine Einwilligungen" mit Liste (Datum, Zweck, Status) + Widerruf-Button pro Eintrag. Backend liefert über AuditLog (sobald Block #2 fertig). |
| G3 | **HIGH** | **Empfänger-Liste** (Art. 13 (1) e DSGVO) ist im Self-Service nicht sichtbar — nur in der Datenschutz-Erklärung, dort aber unvollständig (siehe O3). | Statische Sektion „Wer bekommt Ihre Daten" mit allen Sub-Processors (Vercel/Hosting, Neon/DB, Resend/Mail, Vercel Blob/Files, ggf. Supabase nach Backend-Migration). |
| G4 | MEDIUM | **DSB-Kontakt** im UI nicht erreichbar. | Sektion „Datenschutzbeauftragter" mit Kontakt (oder Begründung „Kein DSB benannt gemäß § 38 BDSG"). |
| G5 | MEDIUM | Alles auf `/settings` — keine dedizierte Route `/einstellungen/datenschutz` wie im Briefing gefordert. | Phase 2: eigene Sub-Route mit Tabs / Sektionen. Settings für Profil/Passwort, eigene Privacy-Page für DSGVO-Rechte. |
| G6 | LOW | `confirm()`-Dialog für Konto-Löschung — kein zwei-Schritt-Flow, keine E-Mail-Bestätigung. | Modal mit Tippen des E-Mail-Werts (`type "candiq-loeschen" to confirm`), idealerweise + E-Mail-Bestätigung mit Token. |

---

## H) Cookie / Tracking-Consent

| # | Sev | Datei:Zeile | Befund | Empfehlung |
|---|---|---|---|---|
| H1 | **CRITICAL** | `app/layout.tsx:104–105`, Datenschutz `app/datenschutz/page.tsx:71–82` | **Vercel Web Analytics + Speed Insights laufen ohne Einwilligung.** Datenschutzerklärung Punkt 8 sagt aber „nur technisch notwendige Cookies" — direkter Widerspruch zu Punkt 9 (Vercel Analytics auf Art. 6 (1) f). Reichweitenanalyse ist nach **TTDSG § 25** **nicht** „unbedingt erforderlich" — daher einwilligungspflichtig, **selbst wenn cookieless**. Aktuelle BGH/EuGH-Linie ist hier streng. | **Drei Optionen, eine wählen** (siehe Open Inputs Q1): (a) Banner mit Opt-In + Default-Off, (b) Vercel Analytics ausbauen → keine Reichweitenanalyse mehr → kein Banner nötig (= echtes „nur technisch notwendige Cookies"), (c) Self-Hosted Open-Source-Alternative wie Plausible/Umami EU-gehostet, anonymisiert. **Empfehlung: (b)** während Pre-Launch, da rechtlich am sichersten und konsistent mit aktueller DS-Erklärung. |
| H2 | **HIGH** | `app/datenschutz/page.tsx:71–73` (Punkt 8) vs. Punkt 9 (`app/datenschutz/page.tsx:75–82`) | **Inkonsistenz in der Datenschutzerklärung selbst:** Punkt 8 sagt „ausschließlich technisch notwendige Cookies", Punkt 9 dokumentiert Vercel Analytics auf Art. 6 (1) f — das **ist** Reichweitenanalyse, nicht „technisch notwendig". | Konsistent machen: entweder Vercel raus + Punkt 9 entfernen, ODER Punkt 8 ergänzen „technisch notwendige Cookies sowie pseudonyme Reichweitenanalyse auf Basis Art. 6 (1) f / Einwilligung gem. § 25 TTDSG". |
| H3 | INFO | `lib/site.ts:4` | HubSpot-Booking ist **Link** (kein Embed, kein Iframe) — Cookie wird erst bei externer Navigation gesetzt, das ist ePrivacy-konform. | OK. Bei späterem Embed: Consent-Pflicht. |

---

## I) Hinweise an Referenzgeber (Art. 14 DSGVO)

| # | Sev | Datei:Zeile | Befund | Empfehlung |
|---|---|---|---|---|
| I1 | **HIGH** | `app/(dashboard)/checks/new/NewCheckForm.tsx:90–157` | **Kein UI-Hinweis** an HR-User: „Bevor Sie diese Person kontaktieren, stellen Sie sicher, dass der Bewerber sie informiert hat." Auch keine Pflicht-Checkbox dazu. | Pflicht-Checkbox am Formular: „Ich versichere, dass der Bewerber die Referenzperson über meine bevorstehende Kontaktaufnahme informiert hat." Plus: optionaler Vorlage-Mail-Generator zum Versenden an den Bewerber. |
| I2 | MEDIUM | (kein UI-Element) | Wenn wir Referenzpersonen kontaktieren, müssen **wir** als Verantwortlicher Art. 14-Infos liefern (Identität, Zweck, Rechte). Aktuell gibt es im Code keinen Hinweis auf eine standardisierte „Erstkontakt-Mail" mit Art. 14-Informationspflicht. | Falls Backend diese Mails verschickt: dort Art. 14-Pflichttext. UI-Skelett im Reviewer-Interface (J): Vorlage-Anzeige des Erstkontakt-Texts. |

---

## J) Reviewer-Interface (CheckEditor)

| # | Sev | Datei:Zeile | Befund | Empfehlung |
|---|---|---|---|---|
| J1 | MEDIUM | `app/(dashboard)/checks/[id]/CheckEditor.tsx:79–219` | **Kein strukturiertes Call-Skript** — freie Textareas „Gesprächsnotizen" und „Diskrepanzen". Kein versionierter AGG-Fragenkatalog. Risiko: Reviewer fragt unzulässige Fragen (Religion, Familienstand). | Phase 2: Fragebogen-Komponente mit versionierten, AGG-konformen Pflicht-Fragen + freie Notizen-Sektion am Ende. Versionsnummer am Check speichern. |
| J2 | MEDIUM | (kein UI-Element) | **Kein Auto-Logout-Timer** bei Inaktivität im Dashboard. Reviewer mit Kandidatenakte offen → Mittagspause → Schulter-Surfing-Risiko. | Phase 2: `useIdleTimer`-Hook (z.B. 15 min Inaktivität → Modal „Noch da?" → 1 min später signOut). Reine Frontend-Lösung, kein Backend-Aufwand. |
| J3 | MEDIUM | `app/(dashboard)/checks/[id]/page.tsx:54–98` | Reviewer sieht **alle** Kontaktdaten (Tel, Mail, Adresse) — ohne abgestuftes Need-to-Know. | Falls Reviewer-Rolle separat von Owner-Rolle: Sektionen ein-/ausblendbar pro Status. Aktuell nur 1 Rolle (`CLIENT`) → Phase-3-Thema. |
| J4 | LOW | `CheckEditor.tsx` | Kein „Aufzeichnung aktiv?"-Toggle. Falls keine Aufzeichnung im Produkt vorgesehen: bewusst nicht implementieren. | Bei späterer Aufzeichnungs-Funktion: doppelter Einwilligungs-Hint Pflicht (Bewerber + Referenzgeber, § 201 StGB!). |

---

## K) Marketing-Pages

| # | Sev | Datei:Zeile | Befund | Empfehlung |
|---|---|---|---|---|
| K1 | **HIGH** | `components/landing/sections/Hero.tsx:55–58`, `app/layout.tsx:11–14` | **Marketing-Claim „DSGVO-konform"** ist während Backend-Härtung (öffentliche Vercel-Blobs für CVs, ungehärtetes Demo-Login, Google Fonts CDN, Tracker ohne Einwilligung) **überspitzt**. Wettbewerbsrecht (UWG § 5) kann als irreführend ausgelegt werden. | Wording bis Härtung abgeschlossen: „DSGVO by Design", „Compliance-Audit läuft", „Server in der EU". Erst nach Block #1+#2 wieder „DSGVO-konform" als Pauschalclaim. |
| K2 | MEDIUM | `app/layout.tsx:64`, `Hero` Subhead, Footer | „**Server in Deutschland**" wird mehrfach prominent beworben. Vercel hostet je nach Region in Frankfurt (eu-central-1) — aber Edge-Functions weltweit, plus Resend (USA), HubSpot (USA), Vercel Blob (Region konfigurierbar). | Genauer formulieren: „Daten werden in der EU verarbeitet" oder „Hauptverarbeitung in Frankfurt am Main". Vercel-Region in `vercel.json` explizit auf `fra1` pinnen, falls noch nicht. |
| K3 | MEDIUM | `app/demo/page.tsx:63–65, 90–92` | Demo-Personen tragen realistisch klingende deutsche Namen (Lara Weber, Dr. Martin Krüger, Tina Lange). Wenn diese Daten im Demo-Account auch in der Datenbank liegen: synthetisch ist OK, aber im UI fehlt ein **„Demo"-Wasserzeichen** auf der Karten-Ebene. | Demo-Karten + Demo-Dashboard mit dezentem `DEMO`-Watermark (Footer-Banner oder Stripe-Pattern). Schützt vor Verwechslung, falls Demo-Screenshots ungewollt zirkulieren. |
| K4 | LOW | `components/landing/sections/ROICalculator.tsx:65` | Behauptung „candiq reduziert Mishire-Rate um 60%" — Disclaimer „Modellrechnung basierend auf SHRM/Bain" ist da, aber 60% sind nicht durch eigene Daten belegt. | Wording entschärfen auf „bis zu 60 % laut Branchen-Studien". Studien-Quellen verlinken. |
| K5 | LOW | `app/page.tsx`, `Hero.tsx` | Nutzt `<img>`-Tag mit `eslint-disable next/no-img-element`-Bypass für Logo. | Auf `next/image` migrieren — bessere Lighthouse-Scores, Lazy-Loading, CLS-Schutz. Keine Privacy-Implikation. |

---

## L) Accessibility (BFSG ab Juni 2025 Pflicht)

| # | Sev | Datei:Zeile | Befund | Empfehlung |
|---|---|---|---|---|
| L1 | **HIGH** | (`app/layout.tsx`, alle pages) | **Skip-Link fehlt komplett.** WCAG 2.4.1 / BFSG. | `<a href="#main">Zum Hauptinhalt springen</a>` als erstes Element im `<body>`, sichtbar bei Focus, sr-only sonst. |
| L2 | MEDIUM | `app/(auth)/register/page.tsx:312–317` (und ähnliche Custom-Checkboxen) | Custom-Checkbox mit `sr-only`-Input ohne `aria-checked`-Sync auf dem Visual-Container. Screenreader hört das versteckte Input, sieht aber den Status nicht synchron. | `role="checkbox" aria-checked={...} tabIndex={0}` auf den sichtbaren Container ODER nativer Checkbox-Stil. |
| L3 | MEDIUM | (kein File) | **Kein axe-core / Lighthouse-CI** in der CI-Pipeline. | Phase 2: `@axe-core/playwright` in den existierenden Playwright-Test (`tests/example.spec.ts`) integrieren. |
| L4 | LOW | `app/globals.css` | Focus-Ring vorhanden via Tailwind, aber Custom-Buttons in `LandingNav`/Demo-Cards überschreiben mit `outline: none` ohne Ersatz? | Konsistente `:focus-visible` Outline auf allen interaktiven Elementen. Manuell prüfen. |
| L5 | LOW | (alle Headings) | Heading-Reihenfolge prüfen: einige Sections haben `<h2>` ohne dazwischenliegendes `<h1>` (Demo-Page hat H1 im Hero, dann H2 ✓). | Einmaliger Sweep mit axe. |
| L6 | INFO | `app/(auth)/login/page.tsx:181–182` | `aria-label` auf Show-Password-Button vorhanden ✓. | Beibehalten als Pattern. |

---

## M) SEO + Privacy

| # | Sev | Datei:Zeile | Befund | Empfehlung |
|---|---|---|---|---|
| M1 | INFO | `app/robots.ts:7–13` | `disallow: ['/api/', '/dashboard', '/candidates', '/checks', ...]` ✓ — alle PII-Routes blockiert. | OK. |
| M2 | INFO | `app/sitemap.ts:9–18` | Nur öffentliche Seiten. ✓ | OK. |
| M3 | LOW | `app/layout.tsx:11–55` | Metadata enthält keine PII, Open-Graph keine PII. ✓ | OK. |

---

## N) Performance + Privacy

| # | Sev | Datei:Zeile | Befund | Empfehlung |
|---|---|---|---|---|
| N1 | **CRITICAL** | `app/globals.css:1`, `app/layout.tsx:95–96`, `next.config.js:25–26` | **Google Fonts via CDN** (`@import url('https://fonts.googleapis.com/...')` plus Preconnect). Bei jedem Pageload geht die Nutzer-IP an Google → **LG München I, 20.01.2022 (3 O 17493/20)**: 100 € Schmerzensgeld pro Fall. **Ohne Einwilligung rechtswidrig**, da nicht anonymisierbar und nicht „unbedingt erforderlich". | Migration auf `next/font/google` mit `display: 'swap'`, **lokal gehostet** durch Next 14 by default (`subsets: ['latin']`). Der Inter-Import in globals.css raus, in `layout.tsx`: `import { Inter, JetBrains_Mono } from 'next/font/google'` und über Variable an `<body>` binden. Preconnect-Tags entfernen. CSP `font-src 'self'`. |
| N2 | **HIGH** | `app/layout.tsx:104–105` | `@vercel/analytics` + `@vercel/speed-insights` laden Third-Party-Scripts (`va.vercel-scripts.com`). Auch wenn cookieless: Skript-Load = Tracking-Treffer = Einwilligungspflicht (TTDSG §25). | Siehe H1 — entweder ausbauen oder hinter Consent-Gate. |
| N3 | LOW | `next.config.js:1–8` | `images.remotePatterns` nur `*.public.blob.vercel-storage.com`. Nach Supabase-Migration (Block #1) muss das angepasst werden. | Hand-off-Liste: Backend-Team → neue remotePatterns-Domain vorgeben. |

---

## O) Statische Legal-Pages

| # | Sev | Datei:Zeile | Befund | Empfehlung |
|---|---|---|---|---|
| O1 | **HIGH** | `app/datenschutz/page.tsx:65–69` | **Aufbewahrungsfristen pro Datenkategorie fehlen** außer „Audit-Logs 24 Monate". Pflicht aus Art. 13 (2) a DSGVO. | Tabelle/Liste pro Kategorie: Konto-Daten = Vertragsdauer + 6/10 Jahre HGB/AO; Kandidaten-Daten = bis Widerruf, max. 6 Monate nach Abschluss; Bewerbungsunterlagen = 4 Monate nach Absage (BAG-Rechtsprechung); Referenzprüfungs-Reports = 6 Monate nach Erstellung; Audit-Logs = 24 Monate. |
| O2 | **HIGH** | `app/datenschutz/page.tsx:36–40` (Empfänger-Kategorien implizit) | **Empfänger-Liste unvollständig.** Erwähnt nur Vercel. **Es fehlen:** Resend (USA, E-Mail), Neon (DB-Hosting, EU-Region prüfen), Vercel Blob (Files), HubSpot (USA, Meeting-Booking-Link → wird Cookie gesetzt sobald geklickt), bcryptjs/Prisma sind keine Sub-Processors. Nach Backend-Migration: Supabase. | Vollständige Sub-Processor-Liste anlegen (Name, Sitz, Zweck, Rechtsgrundlage, SCC-Status). |
| O3 | **HIGH** | `app/datenschutz/page.tsx` (kein Eintrag) | **Kein DSB-Kontakt** (Datenschutzbeauftragter). Nach § 38 BDSG bei < 20 Personen mit automatisierter Verarbeitung nicht zwingend, **aber** bei „Kerntätigkeit umfangreiche Verarbeitung besonderer Kategorien" (z.B. Bewerber-Daten in Masse) Diskussion. | Entweder DSB benennen + Kontaktdaten oder explizit begründen: „Ein DSB ist nicht benannt, da gem. § 38 BDSG die Pflichtschwelle nicht erreicht ist und die Voraussetzungen des Art. 37 (1) DSGVO nicht vorliegen." Beleg im Datenschutzkonzept führen. |
| O4 | **HIGH** | `app/agb/page.tsx:60` | **Gerichtsstand ist Platzhalter:** „Gerichtsstand ist [Ort des Anbieters]". | Wiesbaden eintragen. |
| O5 | **HIGH** | `app/datenschutz/page.tsx:71–82` | Inkonsistenz Cookies/Vercel Analytics — siehe H2. | Siehe H2. |
| O6 | MEDIUM | `app/datenschutz/page.tsx:48–53` | „Drittland-Übermittlung findet nicht statt; Ausnahme Vercel auf SCC-Basis" — keine **Transfer Impact Assessment (TIA)** dokumentiert. Nach Schrems II Pflicht bei US-Transfers. | TIA-Dokument intern führen, in Datenschutzerklärung Verweis: „Eine Transfer Impact Assessment liegt vor und wird auf Anfrage zur Verfügung gestellt." |
| O7 | MEDIUM | `app/impressum/page.tsx:6` | Verantwortlich nach **§ 55 Abs. 2 RStV** — Rundfunkstaatsvertrag ist seit November 2020 durch **Medienstaatsvertrag (MStV)** abgelöst. Korrekt: § 18 Abs. 2 MStV. | Aktualisieren. |
| O8 | LOW | `app/agb/page.tsx:84` | Disclaimer „Vor Live-Gang individuell anwaltlich prüfen lassen" — sichtbar im Public-AGB. Dieses interne Memo gehört nicht in den Live-AGB-Text, kann Vertragspartner verunsichern. | Disclaimer entfernen — die anwaltliche Prüfung gehört intern erledigt, bevor AGB live gehen. |
| O9 | LOW | `app/datenschutz/page.tsx:84` | „Stand: April 2026" — kann vor Launch nochmal aktualisiert werden, sobald Empfänger-Liste/DSB ergänzt. | Datum-Stempel mit jedem Substantielle-Edit synchronisieren. |
| O10 | LOW | `app/datenschutz/page.tsx:13` | Sektion „Welche Daten verarbeiten wir?" bezieht sich auf **Kunden-Daten**. Es fehlt eine eigene Sektion **„Daten der durch Sie verarbeiteten Bewerber/Kandidaten/Referenzgeber"** — wir sind dort als AVV-Auftragsverarbeiter nur mittelbar zuständig, sollten es aber transparent erläutern. | Eigene Section „Verarbeitung im Auftrag unserer Kunden". |

---

## Zusatz-Befund: Demo-Login

Nicht primär Frontend, aber UI-relevant:

| # | Sev | Datei:Zeile | Befund |
|---|---|---|---|
| X1 | HIGH | `app/api/demo/route.ts:39, 47` (oder gleichwertige Stelle), `app/(auth)/login/page.tsx:91–115` | Demo-Login provisioniert User mit **hardcoded Passwort `demo1234`**. Public-Login-Page hat „Quick-Demo"-Buttons, die `/api/demo` aufrufen → Account in Production existiert dauerhaft, Passwort öffentlich bekannt. Wenn jemand das Demo-Konto über die normale Login-Form anvisiert (E-Mail `demo@candiq.de` + `demo1234`), kommt er rein **ohne** Demo-Reset-Logik dazwischen. |
| | | | **Empfehlung:** Demo-Login auf Magic-Link umstellen (Token in der URL, signed, 30 min gültig). Oder: bei jedem Demo-Provisioning ein **rotierendes** Passwort generieren, Cookie/Storage setzen, Login direkt auf Server-Seite. Frontend-Aufgabe: Demo-Buttons umbauen, sobald Backend-Pfad fertig. |

---

## Statische Bestandsaufnahme

| Bereich | Stand | Notizen |
|---|---|---|
| `localStorage`/`sessionStorage` Nutzung | **0 Treffer** | Sehr saubere Basis ✓ |
| Externe Skripte im DOM | 3 | `va.vercel-scripts.com`, `vitals.vercel-insights.com`, Google Fonts CDN |
| `dangerouslySetInnerHTML` | 1 | JSON-LD in `app/layout.tsx:99` (kontrollierter Inhalt) |
| `eval`-ähnliche Konstrukte | 0 | ✓ |
| Hardcoded Secrets | 0 | ✓ (alle `process.env`-basiert) |
| `NEXT_PUBLIC_*` Variablen | 1 | `NEXT_PUBLIC_BASE_URL` — unkritisch |
| Auth-Tokens in Storage | 0 | NextAuth nutzt httpOnly Cookies ✓ |
| Public Forms ohne Spam-Schutz | 4 | `register`, `forgot-password`, `waitlist-agency`, `demo` (Quick-Login) |
| Forms mit `autoComplete` korrekt | 2/4 | `login` ✓, `register` ✓, `candidates/new` ✗, `checks/new` ✗ |
| `next/font` lokal | nein | ❌ Google Fonts via CDN |
| Skip-Link | nein | ❌ |
| HSTS | nein | ❌ |

---

## Top-3 Prioritäten für Phase 2

| # | Branch-Vorschlag | Was | Warum jetzt |
|---|---|---|---|
| **1** | `frontend/security-headers-csp` | (a) Google Fonts → `next/font/google` lokal; (b) HSTS-Header; (c) CSP auf Nonce-basiert ohne `unsafe-inline`/`unsafe-eval`; (d) zusätzliche Permissions-Policy. | Pure Frontend, kein Backend-Touch, kein User-State betroffen. Verschließt drei kritische Lücken (N1, A1, A2) auf einmal. **`securityheaders.com` A+ und Mozilla Observatory A+ realistisch nach diesem Block.** |
| **2** | `frontend/consent-ui-rebuild` | Register-Form: AGB- und Datenschutz-Checkboxen entkoppeln + Widerrufs-Hinweis. Waitlist-Form: Datenschutz-Hinweis + Backend-Stub. New-Candidate: zweite Checkbox + Datums-Pflicht. New-Check: Pflicht-Checkbox „Referenzperson informiert". | Schließt C1, C2, C3, C4, C6, F1, F2, I1 — vier CRITICAL/HIGH-Befunde mit einem konsistenten UX-Redesign der Einwilligungs-UI. Backend-frei. |
| **3** | `frontend/legal-pages-update` | Datenschutz: Empfänger-Liste, Aufbewahrungsfristen, DSB-Klausel, Cookie/Vercel-Inkonsistenz, AVV-Sektion. Impressum: § 18 MStV. AGB: Wiesbaden statt Platzhalter, Disclaimer raus. | Reine Markdown/MDX-Edits, schnell deploybar, schließt O1, O2, O3, O4, O5, O7. Hebt das größte Rechtsrisiko. |

Diese drei Branches **können parallel** entstehen und unabhängig deployt werden — kein Backend-Konflikt.

---

## Drei Open Inputs, die ich von dir brauche

1. **Tracking-Strategie** — Soll Vercel Web Analytics + Speed Insights drinbleiben (mit TTDSG-konformem Consent-Banner, Reject = Default) **oder** rauswerfen und auf Plausible/Umami EU-gehostet umsteigen **oder** komplett ohne Reichweitenanalyse arbeiten? Empfehlung von mir: **Phase 2 ohne Reichweitenanalyse**, das ist sauber und passt zur aktuellen DS-Erklärung. Wenn Analytics gewünscht: Plausible self-hosted in EU.

2. **DSB-Status** — Ist ein Datenschutzbeauftragter benannt (intern oder extern)? Falls nein: liegt die Begründung „nicht erforderlich gem. § 38 BDSG / Art. 37 DSGVO" intern dokumentiert vor? Für die Datenschutzerklärung muss die Antwort rein.

3. **Demo-Login-Verhalten** — Ist der `demo@candiq.de`-Account mit `demo1234` ein bewusst öffentliches Demo-Konto auf Production (wie es heute aussieht), oder soll der Demo-Zugang nach dem 15-min-Termin mit personalisiertem Magic-Link funktionieren? Beeinflusst, ob die Quick-Demo-Buttons auf der Login-Page bleiben oder ersetzt werden.

---

## Hand-off an Backend

Frontend-Arbeit, die **auf Backend-Anbindung wartet** (kann mit Mocks vorgebaut werden, finales Wiring erst nach Block #2):

- DSGVO-Self-Service-Center: Endpoints `GET /api/gdpr/recipients`, `GET /api/gdpr/consents`, `POST /api/gdpr/rectify`, `POST /api/gdpr/revoke-consent`, `GET /api/gdpr/dpo-info`, `GET /api/gdpr/vvz` — werden gebraucht.
- Waitlist-Backend-Endpoint: `POST /api/waitlist/agency` mit E-Mail-Trigger an `hello@candiq.de` und Audit-Log.
- File-Upload-Component: Migration auf Supabase Private Buckets (Block #1) → neue API-Form / Signed-URL-Pfad.
- Demo-Login-Magic-Link: neuer Endpoint `POST /api/demo/magic-link` + Frontend-Token-Verifikation auf einer neuen Route `/demo/start?token=...`.

---

**Audit Ende. Stoppe und warte auf Freigabe pro Block, bevor Phase 2 startet.**

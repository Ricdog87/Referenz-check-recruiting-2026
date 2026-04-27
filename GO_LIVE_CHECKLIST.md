# RefCheck — Go-Live Checkliste

Stand: April 2026 | Branch: `claude/saas-production-launch-7RYTK`

---

## 1. Infrastruktur & Umgebungsvariablen

### Datenbank (Neon PostgreSQL)
- [ ] Neon-Projekt erstellt unter https://neon.tech
- [ ] `DATABASE_URL` in Vercel-Umgebungsvariablen gesetzt (Connection Pooler URL verwenden!)
- [ ] Schema deployed: `npx prisma db push` oder via `db:push` Script
- [ ] Verbindung getestet (z.B. `npx prisma studio`)

### NextAuth
- [ ] `NEXTAUTH_SECRET` gesetzt (mind. 32 Zeichen): `openssl rand -base64 32`
- [ ] `NEXTAUTH_URL` auf die finale Domain gesetzt (z.B. `https://refcheck.vercel.app`)
- [ ] **KEIN** trailing slash am Ende der URL

### Vercel Blob (Datei-Upload)
- [ ] Vercel Blob Store erstellt: Vercel Dashboard → Storage → Blob → Create Store
- [ ] `BLOB_READ_WRITE_TOKEN` in Vercel-Umgebungsvariablen gesetzt
- [ ] Test-Upload durchgeführt (Kandidat anlegen + Datei hochladen)

---

## 2. Vercel Deployment

- [ ] Repository mit Vercel verbunden (GitHub / GitLab)
- [ ] Build-Command: `prisma generate && next build` ✓ (bereits in package.json)
- [ ] Node.js Version: **18.x oder 20.x** (in Vercel-Projekteinstellungen prüfen)
- [ ] Alle 4 Umgebungsvariablen in Vercel gesetzt:
  - `DATABASE_URL`
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`
  - `BLOB_READ_WRITE_TOKEN`
- [ ] Erster Deploy erfolgreich durchgelaufen (ohne Build-Fehler)
- [ ] `vercel.json` Timeout-Einstellungen aktiv (30s für Upload & GDPR-Export)

---

## 3. Funktionale Tests (vor Sales-Start)

### Registrierung & Login
- [ ] Registrierung mit neuer E-Mail funktioniert
- [ ] Doppelte Registrierung liefert Fehlermeldung (409)
- [ ] Login mit korrekten Zugangsdaten → Redirect zum Dashboard
- [ ] Login mit falschem Passwort → Fehlermeldung (kein Stack-Trace)
- [ ] Logout funktioniert und setzt Session zurück
- [ ] Direktzugriff auf `/dashboard` ohne Login → Redirect zu `/login`
- [ ] Direktzugriff auf `/candidates` ohne Login → Redirect zu `/login`

### Kandidaten
- [ ] Kandidat anlegen (Pflichtfelder: Vorname, Nachname, Stelle)
- [ ] DSGVO-Einwilligung bei Anlage dokumentiert
- [ ] Kandidaten-Liste zeigt alle Einträge mit korrektem Status
- [ ] Kandidaten-Detailseite lädt korrekt
- [ ] Statusänderung über CandidateActions-Dropdown funktioniert
- [ ] Kandidat löschen (inklusive Cascade zu Prüfungen & Dokumenten)

### Datei-Upload
- [ ] CV-Upload (PDF) auf Kandidaten-Seite funktioniert
- [ ] Datei erscheint nach Upload in Dokumenten-Liste
- [ ] Download-Link funktioniert (Auth-Check aktiv)
- [ ] Dateityp-Validierung: .exe oder .zip wird abgelehnt
- [ ] Größen-Validierung: Datei > 4 MB wird abgelehnt

### Referenzprüfungen
- [ ] Neue Prüfung anlegen (aus Kandidaten-Seite und aus /checks/new)
- [ ] Kandidat-Status wechselt automatisch zu "In Prüfung"
- [ ] Status, Ergebnis, Notizen und Bewertung speicherbar
- [ ] Prüfungs-Übersicht zeigt alle Prüfungen
- [ ] Filter nach Status funktioniert

### Einstellungen
- [ ] Profilname und Unternehmensname ändern
- [ ] Passwort ändern (altes Passwort wird überschrieben)
- [ ] Datenexport (Art. 20 DSGVO) lädt JSON-Datei herunter
- [ ] Konto löschen (Art. 17 DSGVO) → alle Daten gelöscht → Redirect zu /

### Rechtliche Seiten
- [ ] `/datenschutz` lädt ohne 404
- [ ] `/impressum` lädt ohne 404 (Platzhalter durch echte Daten ersetzen!)
- [ ] `/agb` lädt ohne 404

---

## 4. Sicherheits-Checks

- [ ] Middleware schützt alle Dashboard-Routen (test ohne Session → 302 zu /login)
- [ ] API-Endpoints prüfen Session: Curl-Test ohne Cookie → 401
- [ ] Rate Limiting auf `/api/auth/register`: >5 Requests in 15 Min → 429
- [ ] Keine internen Fehlermeldungen / Stack-Traces in Prod-Responses
- [ ] CSP-Header aktiv: Browser-DevTools → Network → Response-Headers prüfen
- [ ] X-Frame-Options: DENY aktiv
- [ ] HTTPS erzwungen (Vercel macht das automatisch)

---

## 5. Rechtliche Pflichten (DSGVO & Deutsches Recht)

- [ ] **Impressum ausfüllen**: Unternehmensname, Adresse, Handelsregister, USt-ID, E-Mail
- [ ] Datenschutzerklärung an tatsächliche Hosting-Infrastruktur anpassen
  - Neon PostgreSQL: Serverstandort prüfen (EU-Region `eu-central-1` oder `eu-west-1` wählen!)
  - Vercel Blob: EU-Storage aktivieren
- [ ] Auftragsverarbeitungsvertrag (AVV) mit Neon Tech und Vercel abgeschlossen
- [ ] Cookie-Hinweis: RefCheck setzt nur Session-Cookie → kein Cookie-Banner nötig
- [ ] E-Mail-Adresse für Datenschutz-Anfragen eingerichtet (datenschutz@...)

---

## 6. Performance & Monitoring

- [ ] Vercel Analytics aktiviert (kostenlos, DSGVO-freundlich)
- [ ] Vercel Speed Insights aktiviert
- [ ] Neon Connection Pooler aktiviert (verhindert Connection-Erschöpfung bei vielen Usern)
- [ ] Fehler-Monitoring: Vercel Logs beobachten (Dashboard → Functions → Logs)

---

## 7. Finale Deployment-Schritte

```bash
# 1. Branch zum main mergen (oder direkt deployen)
git checkout main
git merge claude/saas-production-launch-7RYTK

# 2. Push → Vercel triggert automatisch Deploy
git push origin main

# 3. Datenbank-Schema deployen (falls noch nicht geschehen)
# In Vercel Console oder lokal mit Production-URL:
DATABASE_URL="<production_url>" npx prisma db push

# 4. Deployment verifizieren
curl -I https://ihre-domain.vercel.app
# → HTTP/2 200 erwartet
```

---

## 8. Sales-Vorbereitung

- [ ] Pricing-Seite auf Landing Page prüfen (Trial / Professional / Enterprise)
- [ ] Demo-Konto erstellen: `demo@refcheck.de` / `demo1234` (via Seed-Script)
- [ ] E-Mail für Enterprise-Anfragen: `enterprise@refcheck.de` einrichten
- [ ] Ersten Kunden onboarden: Registrierungslink schicken → `/register`
- [ ] Support-Kanal einrichten (E-Mail / Slack-Workspace)

---

## Status-Legende

- `[ ]` Offen
- `[x]` Erledigt
- `[~]` In Arbeit

---

*Erstellt am 27.04.2026 | RefCheck SaaS Production Launch*

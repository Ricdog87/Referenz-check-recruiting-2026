# candiq — Setup & Deploy

## Was Tester sofort ausprobieren können

1. **One-Click-Demo** auf `/login` → vorbefülltes Konto mit Daten und Charts
2. **Eigenes Konto registrieren** auf `/register` → 14 Tage Trial, Welcome-Mail (wenn Resend konfiguriert)
3. **Beispiel-Daten laden** auf dem Dashboard (für leere Konten) → 4 Demo-Kandidaten + 6 Prüfungen mit einem Klick
4. **Kandidat anlegen → Referenz prüfen → Report als PDF exportieren** (Druck-Dialog des Browsers, „Als PDF speichern")
5. **Passwort-Reset** über `/forgot-password` (Token + Mail bei Resend / Audit-Log im Dev-Modus)
6. **DSGVO-Funktionen**: Datenexport (JSON) und Konto-Löschung in `/settings`

---

## Test-Zugang (Demo) — sofort nutzbar

Drei vorbefüllte Demo-Profile, kein Formular, keine E-Mail-Bestätigung:

| Profil       | E-Mail                  | Passwort   | Plan         | Inhalt                          |
|--------------|-------------------------|------------|--------------|---------------------------------|
| HR Inhouse   | `demo@candiq.de`        | `demo1234` | Professional | 5 Kandidaten · 7 Prüfungen      |
| Enterprise   | `enterprise@candiq.de`  | `demo1234` | Business     | 9 Kandidaten · 12 Prüfungen     |
| Startup      | `boutique@candiq.de`    | `demo1234` | Starter      | 2 Kandidaten · 1 Prüfung        |

**Drei Wege rein:**
1. **Login-Seite** → Block „Tool sofort testen" → Profil klicken (One-Click)
2. **`/demo`** → ausführliche Übersicht der Profile mit Highlights
3. **Direkt anmelden** mit obigen Credentials auf `/login`

Die Demo-Daten werden beim ersten Login per `/api/demo` lazy seedet (idempotent — wiederholtes Klicken setzt nichts zurück).

---

## Vercel (empfohlen für Demo & Produktion)

### Schritt 1: Neon Datenbank (kostenlos)

1. https://neon.tech → Account erstellen (kostenlos)
2. **New Project** → Name: `candiq`
3. Region: **EU Central (Frankfurt)** wählen
4. Nach Erstellung: **Connection Details** öffnen
   - "Connection string" kopieren → das ist `DATABASE_URL`
   - Bei "Pooling" deaktivieren → zweiten String kopieren → das ist `DIRECT_URL`

### Schritt 2: Vercel Blob (Datei-Uploads)

1. https://vercel.com → Dashboard → **Storage** Tab
2. **Create Database** → **Blob** → Name: `candiq-uploads`
3. Nach Erstellung: **Environments** → `.env.local` anzeigen
   - `BLOB_READ_WRITE_TOKEN` kopieren

### Schritt 3: Vercel Deployment

1. https://vercel.com → **Add New Project**
2. GitHub Repo `ricdog87/Referenz-check-recruiting-2026` verbinden
3. **Environment Variables** setzen:

| Variable | Wert |
|---|---|
| `DATABASE_URL` | Neon Connection String (mit Pooling) |
| `DIRECT_URL` | Neon Connection String (ohne Pooling) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://IHRE-APP.vercel.app` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob Token |
| `RESEND_API_KEY` *(optional)* | https://resend.com → API Keys (Free 3 000/mo) |
| `EMAIL_FROM` *(optional)* | z. B. `candiq <hello@deine-domain.de>` |

4. **Deploy** klicken

> Die Datenbank wird beim ersten Build automatisch eingerichtet (`prisma db push`).
> `lib/db-init.ts` enthält zusätzlich eine idempotente Schema-Sync-Recovery,
> falls der Build den Push nicht ausgeführt hat.

### Schritt 4: Konto anlegen oder Demo nutzen

Nach dem Deploy:
- **Test/Sales:** `https://IHRE-APP.vercel.app/login` → One-Click-Demo
- **Echtes Konto:** `https://IHRE-APP.vercel.app/register` (14 Tage Trial)

---

## Lokale Entwicklung

```bash
# 1. Abhängigkeiten
npm install

# 2. Umgebungsvariablen
cp .env.example .env
# .env bearbeiten — DATABASE_URL, NEXTAUTH_SECRET, BLOB_READ_WRITE_TOKEN

# 3. Datenbank-Schema anlegen
npm run db:push

# 4. (optional) Demo-User aus Seed-Script anlegen
npx ts-node prisma/seed.ts
# Alternativ erzeugt /api/demo die User on-the-fly bei erstem Login.

# 5. Entwicklungsserver
npm run dev
# → http://localhost:3000
```

### Auth-Flow (lokal testen)

```bash
# Health-Check
curl http://localhost:3000/api/health

# Demo-User on-the-fly seeden
curl -X POST 'http://localhost:3000/api/demo?type=hr'
# → { ok: true, email: "demo@candiq.de", password: "demo1234", ... }

# Im Browser
# http://localhost:3000/login        → One-Click-Demo-Buttons
# http://localhost:3000/register     → Eigenes Konto (14 Tage Trial)
# http://localhost:3000/forgot-password
```

---

## Hostinger (alternativ zu Vercel)

### Datenbank
- In hPanel → MySQL-Datenbank anlegen
- `schema.prisma` anpassen: `provider = "mysql"` (statt "postgresql")
- `DIRECT_URL` Zeile in schema.prisma entfernen

### Node.js App
1. hPanel → **Node.js** → App erstellen
2. Node.js Version: 18 oder 20
3. Startup: `npm start`
4. Umgebungsvariablen in hPanel setzen (gleiche wie oben)

### File-Uploads
- `BLOB_READ_WRITE_TOKEN` nicht nötig
- In `app/api/upload/route.ts`: Vercel Blob durch lokales Dateisystem ersetzen
  (Original-Code aus Git-History verfügbar)

---

## Sicherheitshinweise

- `NEXTAUTH_SECRET` niemals teilen oder ins Repository committen — `openssl rand -base64 32`
- `.env` ist in `.gitignore` und wird nie committed
- HTTPS ist auf Vercel automatisch aktiv; Cookies sind in Production `__Secure-…` + `httpOnly` + `sameSite=lax`
- Alle Dashboard-Routen sind über `middleware.ts` geschützt; alle API-Routen prüfen `getServerSession`
- Rate-Limits: Registrierung 5/h pro IP, Demo 10/10min pro IP, Forgot-Password 5/h pro IP
- Forgot-Password: Generische Antwort (kein User-Enumeration); Token-Hash in DB gespeichert (32-Byte Random, SHA-256), 60 Min. TTL, one-shot
- E-Mails: Optional über Resend (ohne `RESEND_API_KEY` werden Mails nur in `AuditLog` protokolliert — bequem für Dev/Test)

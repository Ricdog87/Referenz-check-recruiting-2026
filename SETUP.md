# RefCheck — Setup & Deploy

## Vercel (empfohlen für Demo & Produktion)

### Schritt 1: Neon Datenbank (kostenlos)

1. https://neon.tech → Account erstellen (kostenlos)
2. **New Project** → Name: `refcheck`
3. Region: **EU Central (Frankfurt)** wählen
4. Nach Erstellung: **Connection Details** öffnen
   - "Connection string" kopieren → das ist `DATABASE_URL`

### Schritt 2: Vercel Blob (Datei-Uploads)

1. https://vercel.com → Dashboard → **Storage** Tab
2. **Create Database** → **Blob** → Name: `refcheck-uploads`
3. Nach Erstellung: **Environments** → `.env.local` anzeigen
   - `BLOB_READ_WRITE_TOKEN` kopieren

### Schritt 3: Vercel Deployment

1. https://vercel.com → **Add New Project**
2. GitHub Repo `ricdog87/Referenz-check-recruiting-2026` verbinden
3. **Environment Variables** setzen:

| Variable | Wert |
|---|---|
| `DATABASE_URL` | Neon Connection String (mit Pooling) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://IHRE-APP.vercel.app` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob Token |

4. **Deploy** klicken

> Die Datenbank muss **vorab** einmalig eingerichtet werden (lokal mit `npm run db:push` oder per CI/Migrations-Job), nicht im Vercel-Build.

> Falls in Vercel weiterhin `prisma generate && prisma db push && next build` läuft: **Project Settings → Build & Development Settings → Build Command** prüfen und auf `prisma generate && next build` setzen (oder leeren, damit `vercel.json` genutzt wird).

### Schritt 4: Demo-Zugang einrichten

Nach dem ersten Deploy auf der Live-URL registrieren:
- https://ihre-app.vercel.app/register
- Unternehmenskonto anlegen

---

## Lokale Entwicklung

```bash
# 1. Abhängigkeiten
npm install

# 2. Umgebungsvariablen
cp .env.example .env
# .env bearbeiten — DATABASE_URL, NEXTAUTH_SECRET, BLOB_READ_WRITE_TOKEN

# 3. Datenbank anlegen
npm run db:push

# 4. Entwicklungsserver
npm run dev
# → http://localhost:3000
```

---

## Hostinger (alternativ zu Vercel)

### Datenbank
- In hPanel → MySQL-Datenbank anlegen
- `schema.prisma` anpassen: `provider = "mysql"` (statt "postgresql")

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
- `NEXTAUTH_SECRET` niemals teilen oder ins Repository committen
- `.env` ist in `.gitignore` — wird nie committed
- HTTPS ist auf Vercel automatisch aktiv
- Alle API-Routen prüfen die Session vor jedem Datenzugriff

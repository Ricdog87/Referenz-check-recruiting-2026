# RefCheck — Setup & Deployment Guide

> **Branch:** `claude/saas-production-launch-7RYTK` → merge to `main` for production

---

## Schnellstart (Vercel + Neon — empfohlen)

### Schritt 1: Neon Datenbank (kostenlos)

1. https://neon.tech → Account erstellen
2. **New Project** → Name: `refcheck`
3. **Region: EU Central (Frankfurt)** — Pflicht für DSGVO
4. Nach Erstellung → **Connection Details**:
   - "Connection string (Pooler)" kopieren → `DATABASE_URL`

### Schritt 2: Vercel Blob (Datei-Uploads)

1. https://vercel.com → Dashboard → **Storage** Tab
2. **Create Store** → **Blob** → Name: `refcheck-uploads`
3. **Region: Frankfurt (fra1)** wählen — Pflicht für DSGVO
4. Nach Erstellung: `.env.local` Tab → `BLOB_READ_WRITE_TOKEN` kopieren

### Schritt 3: Vercel Deployment

1. https://vercel.com → **Add New Project** → GitHub-Repo verbinden
2. **Environment Variables** (alle 4 sind Pflicht):

| Variable | Wert | Hinweis |
|---|---|---|
| `DATABASE_URL` | Neon Pooler Connection String | Mit `?sslmode=require` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | Mind. 32 Zeichen |
| `NEXTAUTH_URL` | `https://ihre-app.vercel.app` | Kein trailing slash |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob Token | Aus Blob Store |

3. **Deploy** klicken → Build läuft durch

> Das Schema wird beim ersten Build automatisch deployed (`prisma generate && next build`).
> Falls nicht: Vercel Console → `npx prisma db push`

### Schritt 4: Demo-Konto anlegen (optional)

```bash
# Lokal mit Production DATABASE_URL:
DATABASE_URL="<production-url>" npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts

# Demo-Zugangsdaten:
# E-Mail: demo@refcheck.de
# Passwort: demo1234
```

Oder einfach unter `https://ihre-app.vercel.app/register` manuell registrieren.

---

## Lokale Entwicklung

```bash
# 1. Dependencies installieren
npm install

# 2. Umgebungsvariablen konfigurieren
cp .env.example .env
# .env bearbeiten — DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL=http://localhost:3000, BLOB_READ_WRITE_TOKEN

# 3. Datenbank-Schema anlegen
npm run db:push

# 4. (Optional) Demo-Daten einspielen
npm run db:seed

# 5. Entwicklungsserver starten
npm run dev
# → http://localhost:3000
```

### Verfügbare Scripts

| Script | Beschreibung |
|---|---|
| `npm run dev` | Entwicklungsserver (localhost:3000) |
| `npm run build` | Production Build (inkl. Prisma Generate) |
| `npm run db:push` | Schema in Datenbank übertragen |
| `npm run db:seed` | Demo-Daten einspielen |
| `npm run db:studio` | Prisma Studio öffnen |

---

## Rechtliche Pflichten (vor Go-Live)

- [ ] **Impressum ausfüllen** (`app/impressum/page.tsx`) — Deutsches Recht erfordert vollständiges Impressum
- [ ] **Datenschutzerklärung anpassen** — Verantwortlichen eintragen, Hosting-Anbieter nennen
- [ ] **AVV mit Neon Tech** abschließen (https://neon.tech/docs/security/gdpr)
- [ ] **AVV mit Vercel** abschließen (https://vercel.com/legal/dpa)
- [ ] Support-E-Mail einrichten: `support@refcheck.de`
- [ ] Enterprise-E-Mail einrichten: `enterprise@refcheck.de`

---

## Architektur-Übersicht

```
Next.js 14 (App Router)
├── app/
│   ├── (auth)/          # Login, Register — ungeschützt
│   ├── (dashboard)/     # Alle App-Seiten — durch Middleware geschützt
│   ├── api/             # REST API-Routen
│   │   ├── auth/        # NextAuth + Register + Profil
│   │   ├── candidates/  # CRUD Kandidaten
│   │   ├── checks/      # CRUD Referenzprüfungen
│   │   ├── upload/      # Datei-Upload → Vercel Blob
│   │   ├── download/    # Datei-Download (Auth-gesichert)
│   │   └── gdpr/        # Datenexport (Art. 20) + Löschung (Art. 17)
│   ├── agb/             # AGB
│   ├── datenschutz/     # Datenschutzerklärung
│   └── impressum/       # Impressum
├── components/layout/   # Sidebar, Header, MobileNav
├── lib/                 # auth.ts, db.ts, utils.ts, rate-limit.ts
├── prisma/              # Schema + Seed
└── middleware.ts        # Route-Schutz via NextAuth
```

### Tech Stack

| Bereich | Technologie |
|---|---|
| Framework | Next.js 14 (App Router) |
| Auth | NextAuth v4 (JWT, Credentials) |
| Datenbank | PostgreSQL via Prisma ORM |
| File Storage | Vercel Blob |
| Styling | Tailwind CSS (Dark Mode, Apple HIG) |
| Deployment | Vercel |

---

## Sicherheitsmaßnahmen

- Alle Dashboard-Routen durch NextAuth-Middleware geschützt (exakte + Sub-Pfade)
- Alle API-Routen prüfen Session vor jedem Datenzugriff
- Passwörter mit bcrypt (Salt Rounds: 12) gehasht
- Rate Limiting auf `/api/auth/register` (5 req / 15 min pro IP)
- DSGVO: GDPR-Delete löscht alle Vercel Blob-Dateien des Users
- Security Headers: X-Frame-Options, CSP, X-Content-Type-Options, Referrer-Policy
- JWT-Sessions (8h), kein localStorage

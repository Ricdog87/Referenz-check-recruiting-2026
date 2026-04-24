# RefCheck — Setup-Anleitung

## Voraussetzungen
- Node.js 18+
- npm oder pnpm

## Lokale Entwicklung

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Umgebungsvariablen konfigurieren
cp .env.example .env
# Bearbeiten Sie .env und setzen Sie NEXTAUTH_SECRET

# 3. Datenbank initialisieren
npm run db:push

# 4. Demo-Daten laden (optional)
npm run db:seed

# 5. Entwicklungsserver starten
npm run dev
```

Öffnen Sie http://localhost:3000

Demo-Login: demo@refcheck.de / demo1234

## Produktion (Hostinger)

### Node.js App auf Hostinger

1. Node.js-App in hPanel anlegen
2. Umgebungsvariablen in hPanel setzen:
   - `DATABASE_URL` — MySQL-Verbindungsstring
   - `NEXTAUTH_SECRET` — sicherer Zufallsstring (openssl rand -base64 32)
   - `NEXTAUTH_URL` — Ihre Domain (https://ihre-domain.de)

3. Für MySQL/PostgreSQL in prisma/schema.prisma ändern:
   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }
   ```

4. Build und Deploy:
   ```bash
   npm run build
   npm start
   ```

### Wichtige Sicherheitshinweise
- NEXTAUTH_SECRET niemals ins Repository committen
- UPLOAD_DIR auf absoluten Pfad außerhalb des Web-Roots setzen
- HTTPS erzwingen (Let's Encrypt via hPanel)
- Regelmäßige Datenbankbackups einrichten

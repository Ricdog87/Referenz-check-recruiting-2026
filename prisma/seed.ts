/**
 * Prisma-Seed.
 *
 * Hinweis: Frueher hat dieses Skript drei oeffentliche Demo-Konten
 * (demo@/enterprise@/boutique@candiq.de) mit hardcoded Passwort `demo1234`
 * angelegt. Dieses Demo-Self-Service ist abgeschafft — Demos gibt es nur
 * noch nach persönlichem Termin (siehe scripts/seed-prospect.ts für
 * Sales-Comp-Accounts).
 *
 * Das Seed-Skript ist absichtlich leer. Falls neue Demo-Daten gebraucht
 * werden, gehören sie in ein separates Sales-Skript wie seed-prospect.ts —
 * NICHT als oeffentliche Default-Accounts.
 *
 * Für eine vollständig synthetische Demo-Landschaft (Staging/lokal, keine
 * echte PII, prod-guarded): `npm run demo:seed` (scripts/seed-demo.ts).
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Prisma-Seed: Demo-Konten wurden entfernt (Demo nur noch nach Termin).')
  console.log('Für Prospect-/Sales-Comp-Accounts: scripts/seed-prospect.ts.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

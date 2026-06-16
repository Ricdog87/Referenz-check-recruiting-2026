/**
 * Prisma-Seed.
 *
 * Hinweis: Frueher hat dieses Skript drei oeffentliche Demo-Konten
 * (demo@/enterprise@/boutique@candiq.de) mit hardcoded Passwort `demo1234`
 * angelegt. Dieses Demo-Self-Service ist abgeschafft — Demos gibt es nur
 * noch nach persoenlichem Termin (siehe scripts/seed-prospect.ts fuer
 * Sales-Comp-Accounts).
 *
 * Das Seed-Skript ist absichtlich leer. Falls neue Demo-Daten gebraucht
 * werden, gehoeren sie in ein separates Sales-Skript wie seed-prospect.ts —
 * NICHT als oeffentliche Default-Accounts.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Prisma-Seed: Demo-Konten wurden entfernt (Demo nur noch nach Termin).')
  console.log('Fuer Prospect-/Sales-Comp-Accounts: scripts/seed-prospect.ts.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

/**
 * scripts/backfill-cv-status.ts
 *
 * Einmal-Migration nach dem Schema-Push, der den CV-Gate einführt
 * (PR #126 / Document.cvStatus).
 *
 * Logik:
 *  - Alle Documents mit type='CV', wo der zugehörige Candidate bereits
 *    gdprConsent=true hat → cvStatus='RELEASED', releasedAt=now()
 *  - Alle anderen bleiben auf default 'AWAITING_CONSENT'.
 *
 * Idempotent: re-Run aendert nichts mehr, weil die WHERE-Klausel nur
 * Documents im Default-State erwischt.
 *
 * USAGE:
 *   DATABASE_URL=$PROD_DATABASE_URL npx tsx scripts/backfill-cv-status.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('')
  console.log('═════════════════════════════════════════════════════════════')
  console.log('  candiq · backfill-cv-status.ts')
  console.log('═════════════════════════════════════════════════════════════')
  console.log('  Hebt alle CVs eingewilligter Kandidaten auf RELEASED an.')
  console.log('─────────────────────────────────────────────────────────────')

  const candidatesWithConsent = await prisma.candidate.findMany({
    where: { gdprConsent: true },
    select: { id: true },
  })
  const ids = candidatesWithConsent.map((c) => c.id)
  console.log(`  ✓ ${ids.length} Kandidaten mit gdprConsent=true`)

  if (ids.length === 0) {
    console.log('  Nichts zu tun.')
    return
  }

  const res = await prisma.document.updateMany({
    where: {
      candidateId: { in: ids },
      type: 'CV',
      cvStatus: 'AWAITING_CONSENT',
    },
    data: {
      cvStatus: 'RELEASED',
      releasedAt: new Date(),
    },
  })

  console.log(`  ✓ ${res.count} CV-Document(s) auf RELEASED gehoben`)
  console.log('')
  console.log('  Restliche AWAITING_CONSENT-CVs sind Documents von Kandidaten,')
  console.log('  die noch nicht eingewilligt haben — bleiben gesperrt für Reviewer.')
  console.log('═════════════════════════════════════════════════════════════')
}

main()
  .catch((err) => {
    console.error('❌ backfill-cv-status.ts failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

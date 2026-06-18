import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { safeQuery } from '@/lib/safe-query'
import { Header } from '@/components/layout/Header'
import { SettingsClient } from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  // User-Lookup ist die einzige Pflicht-Query — wenn die failt, koennen wir
  // sinnvoll auf /login fallen. Die drei Statistik-Counts laufen parallel
  // und sind je einzeln per safeQuery abgesichert (Fallback: 0).
  const [user, candidateCount, checkCount, documentCount] = await Promise.all([
    safeQuery(
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, company: true, createdAt: true },
      }),
      null,
      'settings.user',
    ),
    safeQuery(prisma.candidate.count({ where: { userId } }), 0, 'settings.candidateCount'),
    safeQuery(
      prisma.referenceCheck.count({ where: { candidate: { userId } } }),
      0,
      'settings.checkCount',
    ),
    safeQuery(
      prisma.document.count({ where: { candidate: { userId } } }),
      0,
      'settings.documentCount',
    ),
  ])

  // User-Record kann fehlen, wenn das Konto in einem anderen Tab gelöscht
  // wurde (GDPR-Delete), die Session aber noch gültig ist. Sauber ausloggen
  // statt mit `user!` die Seite zu crashen.
  if (!user) redirect('/login')

  // Defensiv: createdAt sollte nie null sein (Schema), aber falls die DB
  // mal eine seltsame Zeile zurueckgibt, fallen wir auf "jetzt" zurueck —
  // schlimmstenfalls steht im UI ein falsches Datum, kein Crash.
  const safeCreatedAt = user.createdAt instanceof Date ? user.createdAt : new Date()

  return (
    <>
      <Header title="Einstellungen" subtitle="Konto & DSGVO-Verwaltung" />
      <div className="max-w-2xl space-y-5">
        <SettingsClient
          user={{
            id: user.id,
            name: user.name ?? '',
            email: user.email ?? '',
            company: user.company ?? '',
            createdAt: safeCreatedAt,
          }}
          stats={{ candidates: candidateCount, checks: checkCount, documents: documentCount }}
        />
      </div>
    </>
  )
}

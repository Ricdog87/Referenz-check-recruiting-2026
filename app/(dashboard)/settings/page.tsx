import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/layout/Header'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, company: true, createdAt: true },
  })

  // User-Record kann fehlen, wenn das Konto in einem anderen Tab geloescht
  // wurde (GDPR-Delete), die Session aber noch gueltig ist. Sauber
  // ausloggen statt mit `user!` die Seite zu crashen.
  if (!user) redirect('/login')

  const candidateCount = await prisma.candidate.count({ where: { userId: session.user.id } })
  const checkCount = await prisma.referenceCheck.count({
    where: { candidate: { userId: session.user.id } },
  })
  const documentCount = await prisma.document.count({
    where: { candidate: { userId: session.user.id } },
  })

  return (
    <>
      <Header title="Einstellungen" subtitle="Konto & DSGVO-Verwaltung" />
      <div className="max-w-2xl space-y-5">
        <SettingsClient
          user={user!}
          stats={{ candidates: candidateCount, checks: checkCount, documents: documentCount }}
        />
      </div>
    </>
  )
}

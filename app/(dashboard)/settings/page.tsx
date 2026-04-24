import { prisma } from '@/lib/db'
import { Header } from '@/components/layout/Header'
import { SettingsClient } from './SettingsClient'
import { getAppSession } from '@/lib/app-session'

export default async function SettingsPage() {
  const session = await getAppSession()
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, company: true, createdAt: true },
  })

  const candidateCount = await prisma.candidate.count({ where: { userId: session.user.id } })
  const checkCount = await prisma.referenceCheck.count({
    where: { candidate: { userId: session.user.id } },
  })
  const documentCount = await prisma.document.count({
    where: { candidate: { userId: session.user.id } },
  })

  return (
    <div className="animate-fade-in">
      <Header title="Einstellungen" subtitle="Konto & DSGVO-Verwaltung" />
      <div className="p-6 max-w-2xl space-y-6">
        <SettingsClient
          user={user!}
          stats={{ candidates: candidateCount, checks: checkCount, documents: documentCount }}
        />
      </div>
    </div>
  )
}

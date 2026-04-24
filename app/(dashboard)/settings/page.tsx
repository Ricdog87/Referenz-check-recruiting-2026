import { prisma } from '@/lib/db'
import { Header } from '@/components/layout/Header'
import { SettingsClient } from './SettingsClient'
import { getAppSession } from '@/lib/app-session'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await getAppSession()

  const fallbackUser = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    company: session.user.company,
    createdAt: new Date(),
  }

  let user = fallbackUser
  let candidateCount = 0
  let checkCount = 0
  let documentCount = 0

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, company: true, createdAt: true },
    })

    if (dbUser) user = dbUser

    ;[candidateCount, checkCount, documentCount] = await Promise.all([
      prisma.candidate.count({ where: { userId: session.user.id } }),
      prisma.referenceCheck.count({ where: { candidate: { userId: session.user.id } } }),
      prisma.document.count({ where: { candidate: { userId: session.user.id } } }),
    ])
  } catch (error) {
    console.error('Settings loaded in fallback mode (database unavailable):', error)
  }

  return (
    <div className="animate-fade-in">
      <Header title="Einstellungen" subtitle="Konto & DSGVO-Verwaltung" />
      <div className="p-6 max-w-2xl space-y-6">
        <div className="card bg-status-infoBg border-status-info/20 text-status-info text-sm">
          Demo-Modus aktiv: Kontodaten werden ohne Datenbank im Live-Vorschau-Modus angezeigt.
        </div>
        <SettingsClient
          user={user}
          stats={{ candidates: candidateCount, checks: checkCount, documents: documentCount }}
        />
      </div>
    </div>
  )
}

import { Header } from '@/components/layout/Header'
import { WaitlistPanel } from '@/components/dashboard/WaitlistPanel'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function WaitlistPage() {
  const session = await getServerSession(authOptions)
  const canAccess = !!session && ['ADMIN', 'OWNER'].includes(session.user.role)

  if (!canAccess) {
    return (
      <>
        <Header title="PDL-Warteliste" subtitle="Zugriffsbeschränkt" />
        <div className="card-md border-amber-200 bg-amber-50/60 text-sm text-amber-800">
          Diese Ansicht ist nur für Rollen <strong>ADMIN</strong> oder <strong>OWNER</strong> verfügbar.
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="PDL-Warteliste" subtitle="Übersicht aller Wartelisten-Anfragen" />
      <WaitlistPanel />
    </>
  )
}

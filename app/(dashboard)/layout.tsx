import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { MobileSidebarProvider } from '@/components/layout/MobileSidebarContext'
import { TrialBanner } from '@/components/layout/TrialBanner'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { trialDaysLeft } from '@/lib/utils'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const trialLeft = trialDaysLeft(session?.user.trialEndsAt)

  return (
    <MobileSidebarProvider>
      <div className="flex min-h-screen" style={{ background: '#f6f7f9' }}>
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <TopBar
            name={session?.user.name ?? ''}
            company={session?.user.company ?? ''}
            accountType={session?.user.accountType ?? 'HR_DEPARTMENT'}
            plan={session?.user.plan ?? 'STARTER'}
          />
          {trialLeft !== null && trialLeft <= 7 && trialLeft > 0 && (
            <TrialBanner daysLeft={trialLeft} />
          )}
          <div className="px-4 sm:px-6 lg:px-8 py-6 pb-16 animate-fadeIn">
            {children}
          </div>
        </main>
      </div>
    </MobileSidebarProvider>
  )
}

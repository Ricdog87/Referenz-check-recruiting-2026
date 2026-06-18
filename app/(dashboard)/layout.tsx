import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { MobileSidebarProvider } from '@/components/layout/MobileSidebarContext'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const role = session?.user.role ?? 'CLIENT'

  return (
    <MobileSidebarProvider>
      <div className="flex min-h-screen bg-bg-secondary">
        <Sidebar />
        <main id="main" className="flex-1 min-w-0 overflow-x-hidden bg-bg-secondary">
          <TopBar
            name={session?.user.name ?? ''}
            company={session?.user.company ?? ''}
            accountType={session?.user.accountType ?? 'HR_DEPARTMENT'}
            plan={session?.user.plan ?? 'STARTER'}
            role={role}
          />
          <div className="px-4 sm:px-6 lg:px-10 pb-12">
            {children}
          </div>
        </main>
      </div>
    </MobileSidebarProvider>
  )
}

import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  return (
    <div className="flex min-h-screen bg-bg-secondary">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-bg-secondary">
        <TopBar
          name={session?.user.name ?? ''}
          company={session?.user.company ?? ''}
          accountType={session?.user.accountType ?? 'HR_DEPARTMENT'}
          plan={session?.user.plan ?? 'STARTER'}
        />
        <div className="px-6 lg:px-10 pb-12">
          {children}
        </div>
      </main>
    </div>
  )
}

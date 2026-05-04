import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ChecksList } from '@/components/dashboard/ChecksList'

export default async function ChecksPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const userId = session.user.id

  const [checks, statusCounts, total] = await Promise.all([
    prisma.referenceCheck.findMany({
      where: { candidate: { userId } },
      orderBy: { updatedAt: 'desc' },
      include: { candidate: { select: { id: true, firstName: true, lastName: true, position: true } } },
    }),
    prisma.referenceCheck.groupBy({
      by: ['status'],
      where: { candidate: { userId } },
      _count: true,
    }),
    prisma.referenceCheck.count({ where: { candidate: { userId } } }),
  ])

  return (
    <>
      <Header
        title="Referenzprüfungen"
        subtitle={`${total} Prüfungen gesamt`}
        action={
          <Link href="/checks/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Neue Prüfung
          </Link>
        }
      />
      <ChecksList checks={checks as any} statusCounts={statusCounts as any} total={total} />
    </>
  )
}

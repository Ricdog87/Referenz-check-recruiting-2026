import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { CandidatesTable } from '@/components/dashboard/CandidatesTable'

export default async function CandidatesPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const userId = session.user.id

  const [candidates, statusCounts, total] = await Promise.all([
    prisma.candidate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { checks: true, documents: true } } },
    }),
    prisma.candidate.groupBy({ by: ['status'], where: { userId }, _count: true }),
    prisma.candidate.count({ where: { userId } }),
  ])

  return (
    <>
      <Header
        title="Kandidaten"
        subtitle={`${total} Kandidaten gesamt`}
        action={
          <Link href="/candidates/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Kandidat hinzufügen
          </Link>
        }
      />
      <CandidatesTable candidates={candidates as any} statusCounts={statusCounts as any} total={total} />
    </>
  )
}

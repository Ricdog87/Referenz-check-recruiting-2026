import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isReviewer } from '@/lib/reviewer'
import { Header } from '@/components/layout/Header'
import { ArrowLeft } from 'lucide-react'
import { ReviewerCheckClient } from './ReviewerCheckClient'

export const dynamic = 'force-dynamic'

export default async function ReviewerCheckPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (!isReviewer(session)) redirect('/dashboard')

  // Reviewer dürfen jede Prüfung sehen — KEIN userId-Filter.
  const check = await prisma.referenceCheck.findUnique({
    where: { id: params.id },
    include: {
      candidate: {
        select: { id: true, firstName: true, lastName: true, position: true, department: true },
      },
    },
  })
  if (!check) notFound()

  return (
    <>
      <Header
        title={`Review: ${check.candidate.firstName} ${check.candidate.lastName}`}
        subtitle={`${check.candidate.position} · Arbeitgeber: ${check.employerName}`}
        action={
          <Link href="/reviewer/queue" className="btn-secondary">
            <ArrowLeft className="w-4 h-4" /> Zur Queue
          </Link>
        }
      />

      <ReviewerCheckClient
        check={{
          id: check.id,
          status: check.status,
          employerName: check.employerName,
          employerContact: check.employerContact,
          employerPhone: check.employerPhone,
          position: check.position,
          startDate: check.startDate,
          endDate: check.endDate,
          callNotes: check.callNotes,
          discrepancies: check.discrepancies,
          rating: check.rating,
          result: check.result,
        }}
      />
    </>
  )
}


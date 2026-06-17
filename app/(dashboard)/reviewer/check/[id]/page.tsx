import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isReviewer, slaState, formatHoursShort } from '@/lib/reviewer'
import { Header } from '@/components/layout/Header'
import { ArrowLeft, Zap } from 'lucide-react'
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

  const sla = slaState(check.updatedAt, { isExpress: check.isExpress })

  return (
    <>
      <Header
        title={`Review: ${check.candidate.firstName} ${check.candidate.lastName}`}
        subtitle={`${check.candidate.position} · Arbeitgeber: ${check.employerName}`}
        action={
          <div className="flex items-center gap-2">
            {check.isExpress && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-600 text-white text-xs font-bold uppercase tracking-wider"
                title={`Express-24h (12h-SLA). Aktuell ${formatHoursShort(sla.hoursInQueue)} im Review.`}
              >
                <Zap className="w-3 h-3 fill-white" />
                Express · {sla.state === 'breached' ? 'SLA verletzt' : `${formatHoursShort(Math.max(0, sla.hoursLeft))} verbleibend`}
              </span>
            )}
            <Link href="/reviewer/queue" className="btn-secondary">
              <ArrowLeft className="w-4 h-4" /> Zur Queue
            </Link>
          </div>
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


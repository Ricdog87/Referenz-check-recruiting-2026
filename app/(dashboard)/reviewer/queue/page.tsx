import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isReviewer } from '@/lib/reviewer'
import { Header } from '@/components/layout/Header'
import { formatDate } from '@/lib/utils'
import { ClipboardList, ArrowRight } from 'lucide-react'

// Reviewer-Queue ist immer frisch — kein Caching.
export const dynamic = 'force-dynamic'

export default async function ReviewerQueuePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  // Rollen-Gate (zusätzlich zur Middleware): CLIENT landet zurück im Dashboard.
  if (!isReviewer(session)) redirect('/dashboard')

  // Bewusst KEIN userId-Filter — Reviewer arbeiten workspace-übergreifend.
  const checks = await prisma.referenceCheck.findMany({
    where: { status: 'IN_REVIEW' },
    orderBy: { updatedAt: 'asc' }, // FIFO: älteste zuerst
    include: {
      candidate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
          user: { select: { name: true, email: true, company: true } },
        },
      },
    },
  })

  return (
    <>
      <Header
        title="Reviewer-Queue"
        subtitle={`${checks.length} Prüfung(en) im Review`}
      />

      {checks.length === 0 ? (
        <div className="card-lg text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-bg-secondary mx-auto mb-4 flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-text-muted" />
          </div>
          <div className="text-text-primary font-semibold mb-1">Queue ist leer</div>
          <div className="text-text-muted text-sm">
            Aktuell liegt keine Prüfung im Status &bdquo;In Review&ldquo;.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {checks.map((check) => (
            <Link
              key={check.id}
              href={`/reviewer/check/${check.id}`}
              className="card-md p-4 flex items-center justify-between hover:border-border-strong transition-all"
            >
              <div className="min-w-0">
                <div className="font-semibold text-text-primary truncate">
                  {check.candidate.firstName} {check.candidate.lastName}
                  <span className="text-text-muted font-normal"> · {check.candidate.position}</span>
                </div>
                <div className="text-sm text-text-secondary truncate">
                  Arbeitgeber: {check.employerName}
                  {check.employerContact ? ` · ${check.employerContact}` : ''}
                </div>
                <div className="text-xs text-text-muted mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                  <span>
                    Kunde:{' '}
                    <span className="text-text-secondary font-medium">
                      {check.candidate.user.company ?? check.candidate.user.name ?? check.candidate.user.email}
                    </span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Im Review seit {formatDate(check.updatedAt)}</span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-text-muted shrink-0 ml-3" />
            </Link>
          ))}
        </div>
      )}
    </>
  )
}


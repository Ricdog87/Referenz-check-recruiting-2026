import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { formatDate, CHECK_STATUS, CHECK_RESULT } from '@/lib/utils'
import { CheckEditor } from './CheckEditor'
import { HandoverToReviewerButton } from './HandoverToReviewerButton'
import { Printer } from 'lucide-react'

export default async function CheckDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const check = await prisma.referenceCheck.findFirst({
    where: { id: params.id, candidate: { userId: session.user.id } },
    include: { candidate: true },
  })

  if (!check) notFound()

  const st = CHECK_STATUS[check.status as keyof typeof CHECK_STATUS] ?? CHECK_STATUS.OPEN
  const res = check.result ? (CHECK_RESULT[check.result as keyof typeof CHECK_RESULT] ?? null) : null

  return (
    <>
      <Header
        title={check.employerName}
        subtitle={`${check.candidate.firstName} ${check.candidate.lastName} · ${check.candidate.position}`}
        action={
          <div className="flex gap-2">
            <HandoverToReviewerButton checkId={check.id} status={check.status} />
            <Link href={`/report/check/${check.id}`} className="btn-secondary" target="_blank" rel="noopener">
              <Printer className="w-4 h-4" /> Report (PDF)
            </Link>
            <Link href={`/candidates/${check.candidate.id}`} className="btn-secondary">
              ← Zum Kandidaten
            </Link>
          </div>
        }
      />

      <div className="space-y-5 max-w-3xl">
        {/* Status bar */}
        <div className="card-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={`badge ${st.color} text-sm py-1 px-3`}>{st.label}</span>
            {res && <span className={`badge ${res.color} text-sm py-1 px-3`}>{res.label}</span>}
          </div>
          {check.calledAt && (
            <span className="text-xs text-text-muted">
              Kontaktiert: {formatDate(check.calledAt)}
            </span>
          )}
        </div>

        {/* Contact info */}
        <div className="card-md">
          <h2 className="section-title mb-4">Kontaktdaten</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="label">Arbeitgeber</div>
              <div className="text-text-primary">{check.employerName}</div>
            </div>
            {check.employerContact && (
              <div>
                <div className="label">Ansprechpartner</div>
                <div className="text-text-primary">{check.employerContact}</div>
              </div>
            )}
            {check.employerPhone && (
              <div>
                <div className="label">Telefon</div>
                <a
                  href={`tel:${check.employerPhone}`}
                  className="text-brand-700 hover:text-brand-800 transition-colors"
                >
                  {check.employerPhone}
                </a>
              </div>
            )}
            {check.employerEmail && (
              <div>
                <div className="label">E-Mail</div>
                <a
                  href={`mailto:${check.employerEmail}`}
                  className="text-brand-700 hover:text-brand-800 transition-colors"
                >
                  {check.employerEmail}
                </a>
              </div>
            )}
            {check.position && (
              <div>
                <div className="label">Position (laut CV)</div>
                <div className="text-text-primary">{check.position}</div>
              </div>
            )}
            {(check.startDate || check.endDate) && (
              <div>
                <div className="label">Beschäftigungszeitraum</div>
                <div className="text-text-primary">
                  {check.startDate || '?'} – {check.endDate || 'heute'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Editor for status, notes, result */}
        <CheckEditor check={check} />
      </div>
    </>
  )
}

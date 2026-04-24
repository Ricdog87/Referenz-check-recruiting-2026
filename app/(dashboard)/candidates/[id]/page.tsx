import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { formatDate, formatDateTime, formatFileSize, CANDIDATE_STATUS, CHECK_STATUS, CHECK_RESULT } from '@/lib/utils'
import { CandidateActions } from './CandidateActions'
import { getAppSession } from '@/lib/app-session'

export default async function CandidateDetailPage({ params }: { params: { id: string } }) {
  const session = await getAppSession()
  
  let candidate: any = null

  try {
    candidate = await prisma.candidate.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      documents: true,
      checks: { orderBy: { createdAt: 'desc' } },
    },
  })

  } catch (error) {
    console.error('Candidate detail fallback mode:', error)
  }

  if (!candidate) notFound()

  const st = CANDIDATE_STATUS[candidate.status as keyof typeof CANDIDATE_STATUS] ?? CANDIDATE_STATUS.PENDING

  return (
    <div className="animate-fade-in">
      <Header
        title={`${candidate.firstName} ${candidate.lastName}`}
        subtitle={`${candidate.position}${candidate.department ? ` · ${candidate.department}` : ''}`}
        action={
          <div className="flex gap-2">
            <Link href={`/checks/new?candidateId=${candidate.id}`} className="btn-primary text-sm py-2">
              + Referenzprüfung
            </Link>
            <CandidateActions candidateId={candidate.id} />
          </div>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info card */}
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent-muted border border-accent/20 flex items-center justify-center text-lg font-bold text-accent">
                    {candidate.firstName[0]}{candidate.lastName[0]}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-text-primary">
                      {candidate.firstName} {candidate.lastName}
                    </h2>
                    <p className="text-sm text-text-secondary">{candidate.position}</p>
                  </div>
                </div>
                <span className={`badge ${st.color}`}>{st.label}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {candidate.email && (
                  <div>
                    <div className="label">E-Mail</div>
                    <div className="text-text-primary">{candidate.email}</div>
                  </div>
                )}
                {candidate.phone && (
                  <div>
                    <div className="label">Telefon</div>
                    <div className="text-text-primary">{candidate.phone}</div>
                  </div>
                )}
                {candidate.department && (
                  <div>
                    <div className="label">Abteilung</div>
                    <div className="text-text-primary">{candidate.department}</div>
                  </div>
                )}
                <div>
                  <div className="label">Angelegt am</div>
                  <div className="text-text-primary">{formatDate(candidate.createdAt)}</div>
                </div>
              </div>

              {candidate.notes && (
                <>
                  <div className="divider" />
                  <div>
                    <div className="label">Notizen</div>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{candidate.notes}</p>
                  </div>
                </>
              )}
            </div>

            {/* Reference checks */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">Referenzprüfungen</h2>
                <Link href={`/checks/new?candidateId=${candidate.id}`} className="text-xs text-accent hover:text-accent-hover transition-colors">
                  + Neue Prüfung
                </Link>
              </div>

              {candidate.checks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-text-muted text-sm mb-3">Noch keine Referenzprüfungen</div>
                  <Link href={`/checks/new?candidateId=${candidate.id}`} className="btn-primary text-sm py-2">
                    Erste Prüfung starten
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {candidate.checks.map((chk: any) => {
                    const cst = CHECK_STATUS[chk.status as keyof typeof CHECK_STATUS] ?? CHECK_STATUS.OPEN
                    const res = chk.result ? (CHECK_RESULT[chk.result as keyof typeof CHECK_RESULT] ?? null) : null
                    return (
                      <Link
                        key={chk.id}
                        href={`/checks/${chk.id}`}
                        className="block p-4 bg-bg-secondary rounded-lg border border-border hover:border-border-strong transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-text-primary">{chk.employerName}</div>
                            {chk.position && <div className="text-xs text-text-secondary">{chk.position}</div>}
                            {(chk.startDate || chk.endDate) && (
                              <div className="text-xs text-text-muted mt-1">
                                {chk.startDate} – {chk.endDate || 'heute'}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <span className={`badge ${cst.color}`}>{cst.label}</span>
                            {res && <span className={`badge ${res.color}`}>{res.label}</span>}
                          </div>
                        </div>
                        {chk.callNotes && (
                          <p className="text-xs text-text-secondary mt-2 line-clamp-2">{chk.callNotes}</p>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* GDPR status */}
            <div className={`card ${candidate.gdprConsent ? 'border-status-success/20 bg-status-successBg' : 'border-status-warning/20 bg-status-warningBg'}`}>
              <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                <span>{candidate.gdprConsent ? '🛡' : '⚠️'}</span>
                DSGVO-Status
              </div>
              {candidate.gdprConsent ? (
                <>
                  <p className="text-xs text-status-success mb-1">Einwilligung erteilt</p>
                  {candidate.gdprConsentDate && (
                    <p className="text-xs text-text-muted">{formatDateTime(candidate.gdprConsentDate)}</p>
                  )}
                </>
              ) : (
                <p className="text-xs text-status-warning">Einwilligung ausstehend</p>
              )}
            </div>

            {/* Documents */}
            <div className="card">
              <h3 className="section-title mb-4 text-base">Dokumente</h3>
              {candidate.documents.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">Keine Dokumente</p>
              ) : (
                <div className="space-y-2">
                  {candidate.documents.map((doc: any) => (
                    <a
                      key={doc.id}
                      href={`/api/download/${doc.id}`}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-bg-secondary hover:bg-bg-hover transition-colors group"
                    >
                      <span className="text-lg">📄</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-text-primary truncate">{doc.originalName}</div>
                        <div className="text-xs text-text-muted">{formatFileSize(doc.size)}</div>
                      </div>
                      <span className="text-xs text-text-muted group-hover:text-accent transition-colors">↓</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Quick stats */}
            <div className="card">
              <h3 className="section-title mb-4 text-base">Zusammenfassung</h3>
              <div className="space-y-3">
                {[
                  { label: 'Prüfungen gesamt', value: candidate.checks.length },
                  { label: 'Abgeschlossen', value: candidate.checks.filter((c: any) => c.status === 'COMPLETED').length },
                  {
                    label: 'Unstimmigkeiten',
                    value: candidate.checks.filter((c: any) => c.result === 'DISCREPANCY_FOUND').length,
                  },
                  { label: 'Dokumente', value: candidate.documents.length },
                ].map((item: any) => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-xs text-text-secondary">{item.label}</span>
                    <span className="text-sm font-mono font-medium text-text-primary">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

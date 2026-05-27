import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'
import { formatDate, formatDateTime, formatFileSize, CANDIDATE_STATUS, CHECK_STATUS, CHECK_RESULT } from '@/lib/utils'
import { CandidateActions } from './CandidateActions'
import { InviteButton } from './InviteButton'
import { Phone, Plus, ShieldCheck, ShieldAlert, FileText, Download, Mail } from 'lucide-react'

export default async function CandidateDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { uploadFailed?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const candidate = await prisma.candidate.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      documents: true,
      checks: { orderBy: { createdAt: 'desc' } },
      consentTokens: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  if (!candidate) notFound()


  const latestConsent = candidate.consentTokens?.[0]
  const consentSummary = latestConsent
    ? {
        hasActive: latestConsent.status === 'PENDING_ACCEPT' || latestConsent.status === 'ACCEPTED',
        status: latestConsent.status as 'NONE' | 'PENDING_ACCEPT' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED',
        expiresAt: latestConsent.expiresAt.toISOString(),
        acceptedAt: latestConsent.acceptedAt?.toISOString(),
        sentAt: latestConsent.sentAt.toISOString(),
      }
    : { hasActive: false, status: 'NONE' as const }

  const st = CANDIDATE_STATUS[candidate.status as keyof typeof CANDIDATE_STATUS] ?? CANDIDATE_STATUS.PENDING
  const uploadFailures = searchParams?.uploadFailed
    ? decodeURIComponent(searchParams.uploadFailed).split('|').filter(Boolean)
    : []

  return (
    <>
      <Header
        title={`${candidate.firstName} ${candidate.lastName}`}
        subtitle={`${candidate.position}${candidate.department ? ` · ${candidate.department}` : ''}`}
        action={
          <div className="flex flex-wrap gap-2 items-center">
            <InviteButton candidateId={candidate.id} candidateEmail={candidate.email} initialConsent={consentSummary} />
            <Link href={`/checks/new?candidateId=${candidate.id}`} className="btn-primary">
              <Plus className="w-4 h-4" /> Referenzprüfung
            </Link>
            <CandidateActions candidateId={candidate.id} />
          </div>
        }
      />

      {uploadFailures.length > 0 && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="text-sm font-semibold text-amber-900 mb-1">
            {uploadFailures.length === 1 ? '1 Datei' : `${uploadFailures.length} Dateien`} konnten nicht hochgeladen werden
          </div>
          <ul className="text-xs text-amber-800 space-y-0.5">
            {uploadFailures.map((f, i) => (
              <li key={i}>· {f}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info card */}
          <div className="card-md">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-100 to-violet/20 border border-brand-200 flex items-center justify-center text-base font-bold text-brand-700">
                  {candidate.firstName[0]}{candidate.lastName[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary tracking-tight">
                    {candidate.firstName} {candidate.lastName}
                  </h2>
                  <p className="text-sm text-text-secondary">{candidate.position}</p>
                </div>
              </div>
              <span className={`badge ${st.color}`}>{st.label}</span>
            </div>

            <div className="grid grid-cols-2 gap-5 text-sm">
              {candidate.email && (
                <div>
                  <div className="label">E-Mail</div>
                  <a href={`mailto:${candidate.email}`} className="text-text-primary hover:text-brand-700">{candidate.email}</a>
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
          <div className="card-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Referenzprüfungen</h2>
              <Link href={`/checks/new?candidateId=${candidate.id}`} className="text-xs text-brand-700 hover:text-brand-800 font-semibold">
                + Neue Prüfung
              </Link>
            </div>

            {candidate.checks.length === 0 ? (
              <div className="text-center py-10">
                <Phone className="w-8 h-8 text-text-muted mx-auto mb-3" />
                <div className="text-text-muted text-sm mb-3">Noch keine Referenzprüfungen</div>
                <Link href={`/checks/new?candidateId=${candidate.id}`} className="btn-primary text-sm">
                  Erste Prüfung starten
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {candidate.checks.map((chk) => {
                  const cst = CHECK_STATUS[chk.status as keyof typeof CHECK_STATUS] ?? CHECK_STATUS.OPEN
                  const res = chk.result ? (CHECK_RESULT[chk.result as keyof typeof CHECK_RESULT] ?? null) : null
                  return (
                    <Link key={chk.id} href={`/checks/${chk.id}`}
                      className="block p-4 bg-bg-secondary rounded-xl border border-border hover:border-brand-300 hover:bg-white transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-text-primary group-hover:text-brand-700 transition-colors">{chk.employerName}</div>
                          {chk.position && <div className="text-xs text-text-secondary">{chk.position}</div>}
                          {(chk.startDate || chk.endDate) && (
                            <div className="text-xs text-text-muted mt-1">
                              {chk.startDate ?? '?'} – {chk.endDate || 'heute'}
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
          <div className={`card-md ${candidate.gdprConsent ? 'bg-emerald-50/40 border-emerald-200' : 'bg-amber-50/40 border-amber-200'}`}>
            <div className="text-sm font-semibold mb-2 flex items-center gap-2">
              {candidate.gdprConsent
                ? <ShieldCheck className="w-4 h-4 text-emerald-600" />
                : <ShieldAlert className="w-4 h-4 text-amber-600" />}
              DSGVO-Status
            </div>
            {candidate.gdprConsent ? (
              <>
                <p className="text-xs text-emerald-700 mb-1">Einwilligung erteilt</p>
                {candidate.gdprConsentDate && (
                  <p className="text-[11px] text-text-muted">{formatDateTime(candidate.gdprConsentDate)}</p>
                )}
              </>
            ) : (
              <p className="text-xs text-amber-700">Einwilligung ausstehend</p>
            )}
          </div>

          {/* Documents */}
          <div className="card-md">
            <h3 className="section-title mb-4 text-base">Dokumente</h3>
            {candidate.documents.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">Keine Dokumente</p>
            ) : (
              <div className="space-y-2">
                {candidate.documents.map((doc) => (
                  <a key={doc.id} href={`/api/download/${doc.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-bg-secondary hover:bg-white border border-transparent hover:border-border transition-all group">
                    <FileText className="w-4 h-4 text-brand-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-text-primary truncate">{doc.originalName}</div>
                      <div className="text-[10px] text-text-muted">{formatFileSize(doc.size)}</div>
                    </div>
                    <Download className="w-3.5 h-3.5 text-text-muted group-hover:text-brand-600 transition-colors" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="card-md">
            <h3 className="section-title mb-4 text-base">Zusammenfassung</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Prüfungen gesamt', value: candidate.checks.length },
                { label: 'Abgeschlossen', value: candidate.checks.filter((c) => c.status === 'COMPLETED').length },
                { label: 'Unstimmigkeiten', value: candidate.checks.filter((c) => c.result === 'DISCREPANCY_FOUND').length },
                { label: 'Dokumente', value: candidate.documents.length },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-xs text-text-secondary">{item.label}</span>
                  <span className="text-sm font-bold text-text-primary tabular-nums">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

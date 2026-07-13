import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { formatDate, formatDateTime, CHECK_STATUS, CHECK_RESULT } from '@/lib/utils'
import Link from 'next/link'
import { ReportPrintControls } from './PrintControls'
import './report.css'

export const dynamic = 'force-dynamic'

export default async function CheckReportPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect(`/login?callbackUrl=/report/check/${params.id}`)

  const check = await prisma.referenceCheck.findFirst({
    where: { id: params.id, candidate: { userId: session.user.id } },
    include: {
      candidate: { include: { documents: true } },
    },
  })

  if (!check) notFound()

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, company: true, email: true },
  })

  const st = CHECK_STATUS[check.status as keyof typeof CHECK_STATUS] ?? CHECK_STATUS.OPEN
  const res = check.result ? (CHECK_RESULT[check.result as keyof typeof CHECK_RESULT] ?? null) : null

  return (
    <main id="main" className="report-shell">
      {/* Print controls — werden im Druck ausgeblendet */}
      <ReportPrintControls backHref={`/checks/${check.id}`} />

      <article className="report-doc">
        {/* Header */}
        <header className="report-header">
          <div className="report-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.svg" alt="" className="report-logo" width={48} height={48} />
            <div>
              <div className="report-brand-name">candiq</div>
              <div className="report-brand-sub">Referenzprüfungs-Report</div>
            </div>
          </div>
          <div className="report-meta">
            <div><span>Erstellt am</span><strong>{formatDateTime(new Date())}</strong></div>
            <div><span>Report-ID</span><strong>{check.id.slice(-12).toUpperCase()}</strong></div>
            <div><span>Auftraggeber</span><strong>{user?.company ?? '—'}</strong></div>
          </div>
        </header>

        {/* Title block */}
        <section className="report-title">
          <h1>Referenzauskunft</h1>
          <h2>{check.candidate.firstName} {check.candidate.lastName}</h2>
          <div className="report-subtitle">
            Bewerbung als <strong>{check.candidate.position}</strong>
            {check.candidate.department && <> · {check.candidate.department}</>}
          </div>
          <div className="report-pills">
            <span className="pill pill-status">{st.label}</span>
            {res && <span className={`pill pill-result pill-${check.result?.toLowerCase()}`}>{res.label}</span>}
            {check.rating && (
              <span className="pill pill-rating">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < check.rating! ? 'star-on' : 'star-off'}>★</span>
                ))}
                <span>{check.rating}/5</span>
              </span>
            )}
          </div>
        </section>

        {/* Summary grid */}
        <section className="report-grid">
          <div className="report-block">
            <h3>Geprüfter Arbeitgeber</h3>
            <div className="kv">
              <div><label>Unternehmen</label><span>{check.employerName}</span></div>
              {check.employerContact && <div><label>Ansprechpartner</label><span>{check.employerContact}</span></div>}
              {check.employerPhone && <div><label>Telefon</label><span>{check.employerPhone}</span></div>}
              {check.employerEmail && <div><label>E-Mail</label><span>{check.employerEmail}</span></div>}
              {check.position && <div><label>Position laut CV</label><span>{check.position}</span></div>}
              {(check.startDate || check.endDate) && (
                <div><label>Beschäftigungszeitraum</label><span>{check.startDate ?? '?'} – {check.endDate ?? 'heute'}</span></div>
              )}
              {check.calledAt && <div><label>Kontaktiert am</label><span>{formatDateTime(check.calledAt)}</span></div>}
            </div>
          </div>

          <div className="report-block">
            <h3>Kandidat</h3>
            <div className="kv">
              <div><label>Name</label><span>{check.candidate.firstName} {check.candidate.lastName}</span></div>
              {check.candidate.email && <div><label>E-Mail</label><span>{check.candidate.email}</span></div>}
              {check.candidate.phone && <div><label>Telefon</label><span>{check.candidate.phone}</span></div>}
              <div><label>DSGVO-Einwilligung</label>
                <span>
                  {check.candidate.gdprConsent
                    ? `Erteilt${check.candidate.gdprConsentDate ? ` am ${formatDate(check.candidate.gdprConsentDate)}` : ''}`
                    : 'Ausstehend'}
                </span>
              </div>
              <div><label>Profil angelegt</label><span>{formatDate(check.candidate.createdAt)}</span></div>
            </div>
          </div>
        </section>

        {/* Result narrative */}
        {(check.callNotes || check.discrepancies) && (
          <section className="report-section">
            <h3>Auskunft &amp; Bewertung</h3>

            {check.callNotes && (
              <div className="report-prose">
                <h4>Gesprächsnotizen</h4>
                <p>{check.callNotes}</p>
              </div>
            )}

            {check.discrepancies && (
              <div className="report-callout">
                <h4>⚠ Festgestellte Unstimmigkeiten</h4>
                <p>{check.discrepancies}</p>
              </div>
            )}
          </section>
        )}

        {/* Documents (Referenz auf vorhandene Dokumente) */}
        {check.candidate.documents.length > 0 && (
          <section className="report-section">
            <h3>Hinterlegte Dokumente</h3>
            <ul className="doc-list">
              {check.candidate.documents.map((doc) => (
                <li key={doc.id}>
                  <span>{doc.originalName}</span>
                  <span>{(doc.size / 1024).toFixed(0)} KB</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Compliance footer */}
        <footer className="report-footer">
          <div>
            <strong>Compliance-Hinweis</strong>
            <p>
              Dieser Report enthält personenbezogene Daten. Verarbeitung gemäß DSGVO Art. 6 Abs. 1 lit. f
              (berechtigtes Interesse Personalauswahl) und Einwilligung des Kandidaten gemäß Art. 6 Abs. 1 lit. a.
              Aufbewahrung max. 6 Monate nach Stellenbesetzungsentscheidung.
            </p>
          </div>
          <div>
            <strong>Erstellt durch</strong>
            <p>{user?.name ?? '—'} · {user?.company ?? ''}<br/>{user?.email ?? ''}</p>
          </div>
          <div className="report-footer-meta">
            <span>candiq · DSGVO-konformes Reference-Checking</span>
            <span>Report-ID {check.id.slice(-12).toUpperCase()}</span>
          </div>
        </footer>
      </article>

      <Link className="back-link no-print" href={`/checks/${check.id}`}>← Zurück zur Prüfung</Link>
    </main>
  )
}

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { formatDate, formatDateTime, CHECK_STATUS, CHECK_RESULT } from '@/lib/utils'
import Link from 'next/link'
import { ReportPrintControls } from './PrintControls'

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
    <main className="report-shell">
      {/* Print controls — werden im Druck ausgeblendet */}
      <ReportPrintControls backHref={`/checks/${check.id}`} />

      <article className="report-doc">
        {/* Header */}
        <header className="report-header">
          <div className="report-brand">
            <div className="report-logo">CQ</div>
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

      <style>{REPORT_CSS}</style>
    </main>
  )
}

const REPORT_CSS = `
.report-shell { background: #f1f5f9; min-height: 100vh; padding: 24px 16px 64px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; }
.report-doc { max-width: 820px; margin: 0 auto; background: #fff; padding: 56px 56px 48px; border-radius: 12px; box-shadow: 0 4px 24px rgba(15,23,42,.06); border: 1px solid #e2e8f0; }
.report-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 28px; border-bottom: 2px solid #e2e8f0; margin-bottom: 32px; gap: 24px; flex-wrap: wrap; }
.report-brand { display: flex; align-items: center; gap: 14px; }
.report-logo { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #4f46e5, #8b5cf6); color: #fff; font-weight: 900; font-size: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(79,70,229,.3); }
.report-brand-name { font-weight: 900; font-size: 22px; letter-spacing: -0.5px; }
.report-brand-sub { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
.report-meta { display: grid; grid-template-columns: auto auto; gap: 4px 18px; font-size: 11px; color: #475569; }
.report-meta div { display: contents; }
.report-meta span { color: #94a3b8; }
.report-meta strong { color: #0f172a; font-weight: 700; }
.report-title h1 { font-size: 13px; color: #4f46e5; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px; }
.report-title h2 { font-size: 32px; font-weight: 800; letter-spacing: -1px; margin: 0 0 6px; line-height: 1.1; }
.report-subtitle { font-size: 14px; color: #475569; margin-bottom: 18px; }
.report-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 36px; }
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.pill-status { background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; }
.pill-result { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
.pill-result.pill-verified { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
.pill-result.pill-discrepancy_found { background: #fff1f2; color: #be123c; border-color: #fecdd3; }
.pill-result.pill-unreachable { background: #fffbeb; color: #b45309; border-color: #fde68a; }
.pill-rating { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
.star-on { color: #f59e0b; }
.star-off { color: #e2e8f0; }
.report-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin-bottom: 28px; }
.report-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; page-break-inside: avoid; }
.report-block h3, .report-section h3 { font-size: 11px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 14px; }
.kv { display: grid; gap: 10px; }
.kv > div { display: grid; grid-template-columns: 130px 1fr; gap: 10px; align-items: baseline; }
.kv label { font-size: 11px; color: #94a3b8; font-weight: 600; }
.kv span { font-size: 13px; color: #0f172a; font-weight: 500; }
.report-section { margin-bottom: 28px; padding: 22px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; page-break-inside: avoid; }
.report-prose h4 { font-size: 12px; font-weight: 700; color: #475569; margin: 0 0 8px; }
.report-prose p { font-size: 13px; line-height: 1.6; color: #0f172a; margin: 0 0 16px; white-space: pre-wrap; }
.report-callout { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 14px 16px; }
.report-callout h4 { color: #c2410c; font-size: 12px; font-weight: 800; margin: 0 0 6px; }
.report-callout p { font-size: 13px; color: #7c2d12; margin: 0; line-height: 1.6; white-space: pre-wrap; }
.doc-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 6px; }
.doc-list li { display: flex; justify-content: space-between; padding: 8px 12px; background: #f8fafc; border-radius: 6px; font-size: 12px; }
.doc-list li span:last-child { color: #94a3b8; }
.report-footer { margin-top: 40px; padding-top: 28px; border-top: 2px solid #e2e8f0; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; font-size: 11px; color: #475569; line-height: 1.5; }
.report-footer strong { display: block; color: #0f172a; font-size: 11px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px; }
.report-footer p { margin: 0; }
.report-footer-meta { grid-column: 1 / -1; padding-top: 18px; margin-top: 6px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
.back-link { display: block; max-width: 820px; margin: 16px auto 0; text-align: center; color: #64748b; font-size: 13px; text-decoration: none; }
.back-link:hover { color: #0f172a; }

@media print {
  @page { margin: 18mm 14mm; }
  body, .report-shell { background: #fff !important; padding: 0; }
  .report-doc { box-shadow: none; border: none; padding: 0; max-width: 100%; border-radius: 0; }
  .no-print { display: none !important; }
  .report-block, .report-section, .report-footer { page-break-inside: avoid; }
}
`

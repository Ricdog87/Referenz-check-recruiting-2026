import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/db'
import { sendEmail, checkCompletedEmail } from '@/lib/email'
import { CHECK_RESULT, CHECK_STATUS } from '@/lib/utils'
import { logger } from '@/lib/logger'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://candiq.de'

type ReportData = {
  id: string
  candidateName: string
  position: string | null
  employerName: string
  employerContact: string | null
  employerPhone: string | null
  period: string
  statusLabel: string
  resultLabel: string | null
  rating: number | null
  callNotes: string | null
  discrepancies: string | null
  calledAt: Date | null
  generatedAt: Date
}

// ── PDF-Layout ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#0f172a', lineHeight: 1.5 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 },
  brand: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#4f46e5' },
  meta: { fontSize: 8, color: '#64748b', textAlign: 'right' },
  divider: { borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginBottom: 16, marginTop: 4 },
  h1: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 12 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#475569', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: 130, color: '#64748b' },
  value: { flex: 1, fontFamily: 'Helvetica-Bold' },
  box: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4, padding: 10, marginTop: 4 },
  badge: { fontFamily: 'Helvetica-Bold' },
  footer: { position: 'absolute', bottom: 28, left: 40, right: 40, fontSize: 7.5, color: '#94a3b8', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8 },
})

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

function CheckReportDocument({ data }: { data: ReportData }) {
  const fmt = (d: Date) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  return (
    <Document title={`Referenz-Report ${data.candidateName}`} author="candiq">
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>candiq</Text>
          <Text style={styles.meta}>
            Referenzprüfungs-Report{'\n'}Erstellt: {fmt(data.generatedAt)}{'\n'}Report-ID: {data.id}
          </Text>
        </View>
        <View style={styles.divider} />

        <Text style={styles.h1}>Referenzprüfung — {data.candidateName}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kandidat & Position</Text>
          <Field label="Kandidat" value={data.candidateName} />
          <Field label="Position" value={data.position ?? '—'} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Referenzgeber / Arbeitgeber</Text>
          <Field label="Arbeitgeber" value={data.employerName} />
          <Field label="Kontaktperson" value={data.employerContact ?? '—'} />
          <Field label="Telefon" value={data.employerPhone ?? '—'} />
          <Field label="Beschäftigungszeitraum" value={data.period} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ergebnis der Prüfung</Text>
          <Field label="Status" value={data.statusLabel} />
          <Field label="Ergebnis" value={data.resultLabel ?? '—'} />
          <Field label="Bewertung" value={data.rating ? `${data.rating} / 5` : '—'} />
          <Field label="Kontaktiert am" value={data.calledAt ? fmt(data.calledAt) : '—'} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gesprächsnotizen</Text>
          <View style={styles.box}>
            <Text>{data.callNotes?.trim() || 'Keine Notizen erfasst.'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diskrepanzen / Auffälligkeiten</Text>
          <View style={styles.box}>
            <Text>{data.discrepancies?.trim() || 'Keine Auffälligkeiten markiert.'}</Text>
          </View>
        </View>

        <Text style={styles.footer} fixed>
          candiq — menschliche Vertrauensschicht für Hiring. Dieser Report ist Entscheidungsunterstützung für geschulte
          Reviewer und stellt keine automatische Eignungs- oder Ablehnungsentscheidung dar. Verarbeitung gemäß DSGVO;
          Aufbewahrung nach Zweckbindung. {BASE_URL}
        </Text>
      </Page>
    </Document>
  )
}

// ── Generierung + Auslieferung (shared) ──────────────────────────
/**
 * Erzeugt den PDF-Report für eine Prüfung, lädt ihn in Vercel Blob hoch und
 * benachrichtigt den HR-Auftraggeber per Mail (Link auf das PDF).
 * Best-effort beim Mailversand — der Aufrufer entscheidet über Fehlerbehandlung.
 */
export async function generateAndDeliverCheckReport(
  checkId: string,
): Promise<{ url: string; emailed: boolean }> {
  const check = await prisma.referenceCheck.findUnique({
    where: { id: checkId },
    include: { candidate: { include: { user: { select: { id: true, name: true, email: true } } } } },
  })
  if (!check) throw new Error('Prüfung nicht gefunden.')

  const statusLabel =
    (CHECK_STATUS as Record<string, { label: string }>)[check.status]?.label ?? check.status
  const resultLabel = check.result
    ? (CHECK_RESULT as Record<string, { label: string }>)[check.result]?.label ?? check.result
    : null

  const data: ReportData = {
    id: check.id,
    candidateName: `${check.candidate.firstName} ${check.candidate.lastName}`,
    position: check.position ?? check.candidate.position ?? null,
    employerName: check.employerName,
    employerContact: check.employerContact,
    employerPhone: check.employerPhone,
    period: `${check.startDate ?? '?'} – ${check.endDate ?? '?'}`,
    statusLabel,
    resultLabel,
    rating: check.rating,
    callNotes: check.callNotes,
    discrepancies: check.discrepancies,
    calledAt: check.calledAt,
    generatedAt: new Date(),
  }

  const buffer = await renderToBuffer(<CheckReportDocument data={data} />)

  const blob = await put(`reports/${check.id}/referenz-report-${Date.now()}.pdf`, buffer, {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/pdf',
  })

  let emailed = false
  try {
    const hr = check.candidate.user
    if (hr?.email) {
      const tpl = checkCompletedEmail({
        name: hr.name,
        candidateName: data.candidateName,
        employerName: data.employerName,
        result: resultLabel ?? 'Abgeschlossen',
        // DSGVO: KEIN public Blob-Link in der Mail (der Report enthaelt die
        // Bewertung des Bewerbers). Stattdessen Link auf die auth- +
        // ownership-geschuetzte Report-Seite. Nur eingeloggte HR-User des
        // eigenen Workspace sehen den Report. Das PDF-Blob bleibt fuer
        // interne Records, ist aber nicht mehr direkt verlinkt.
        checkUrl: `${BASE_URL}/report/check/${check.id}`,
      })
      const r = await sendEmail({
        to: hr.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        userId: hr.id,
        category: 'check_report',
      })
      emailed = r.ok
    }
  } catch (err) {
    logger.warn('check_report_mail_warn', err)
  }

  return { url: blob.url, emailed }
}


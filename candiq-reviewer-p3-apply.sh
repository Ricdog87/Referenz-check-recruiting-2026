#!/usr/bin/env bash
#
# candiq-reviewer-p3-apply.sh — candiq: Reviewer-Workflow (P1.1+P1.2) + P3 Auto-IndexNow-Ping.
# Ein Befehl: Branch anlegen, Dependency installieren (fixt nebenbei den roten
# CI-Lockfile, weil npm install package-lock.json regeneriert), 10 Dateien
# schreiben, 5 bestehende Dateien patchen, dann lint/build/test.
# KEIN Auto-Commit/Push — du reviewst und committest selbst.
#
# Aufruf im Repo-Root (Ricdog87/Referenz-check-recruiting-2026):
#   bash candiq-reviewer-p3-apply.sh
#
set -euo pipefail

if [ ! -f package.json ] || [ ! -d prisma ]; then
  echo "FEHLER: bitte im candiq-Repo-Root ausfuehren." >&2; exit 1
fi
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "FEHLER: uncommittete Aenderungen vorhanden. Erst committen oder stashen." >&2; exit 1
fi

BRANCH="feat/reviewer-p3-end-to-end"
echo "==> Branch: $BRANCH"
git checkout -b "$BRANCH" 2>/dev/null || git checkout "$BRANCH"

echo "==> Dependency: @react-pdf/renderer (npm install regeneriert auch package-lock.json -> CI-Fix)"
npm install @react-pdf/renderer

echo "==> Schreibe neue Dateien ..."
mkdir -p "$(dirname 'lib/reviewer.ts')"
cat > 'lib/reviewer.ts' <<'CANDIQ_EOF'
import type { Session } from 'next-auth'

/**
 * Reviewer-Rollen.
 *
 * Das `role`-Feld existiert bereits im User-Schema (default 'CLIENT') und wird
 * via lib/auth.ts in JWT + Session gespiegelt. Wir gaten den Reviewer-Bereich
 * gegen diese Rollen — KEIN userId-Filter, denn geschulte Reviewer arbeiten
 * workspace-übergreifend.
 */
export const REVIEWER_ROLES = ['REVIEWER', 'ADMIN'] as const

export function isReviewer(session: Session | null | undefined): boolean {
  const role = session?.user?.role
  return role === 'REVIEWER' || role === 'ADMIN'
}

CANDIQ_EOF
echo "  + lib/reviewer.ts"

mkdir -p "$(dirname 'lib/check-report.tsx')"
cat > 'lib/check-report.tsx' <<'CANDIQ_EOF'
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
        checkUrl: blob.url, // Direktlink auf das PDF
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

CANDIQ_EOF
echo "  + lib/check-report.tsx"

mkdir -p "$(dirname 'app/(dashboard)/reviewer/queue/page.tsx')"
cat > 'app/(dashboard)/reviewer/queue/page.tsx' <<'CANDIQ_EOF'
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
      candidate: { select: { id: true, firstName: true, lastName: true, position: true } },
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
            Aktuell liegt keine Prüfung im Status „In Review".
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
                <div className="text-xs text-text-muted mt-0.5">
                  Im Review seit {formatDate(check.updatedAt)}
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

CANDIQ_EOF
echo "  + app/(dashboard)/reviewer/queue/page.tsx"

mkdir -p "$(dirname 'app/(dashboard)/reviewer/check/[id]/page.tsx')"
cat > 'app/(dashboard)/reviewer/check/[id]/page.tsx' <<'CANDIQ_EOF'
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

CANDIQ_EOF
echo "  + app/(dashboard)/reviewer/check/[id]/page.tsx"

mkdir -p "$(dirname 'app/(dashboard)/reviewer/check/[id]/ReviewerCheckClient.tsx')"
cat > 'app/(dashboard)/reviewer/check/[id]/ReviewerCheckClient.tsx' <<'CANDIQ_EOF'
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, CheckCircle2, Loader2 } from 'lucide-react'

type CheckData = {
  id: string
  status: string
  employerName: string
  employerContact: string | null
  employerPhone: string | null
  position: string | null
  startDate: string | null
  endDate: string | null
  callNotes: string | null
  discrepancies: string | null
  rating: number | null
  result: string | null
}

const RESULTS = [
  { value: '', label: '— kein Ergebnis —' },
  { value: 'VERIFIED', label: 'Verifiziert' },
  { value: 'DISCREPANCY_FOUND', label: 'Unstimmigkeit gefunden' },
  { value: 'UNREACHABLE', label: 'Nicht erreichbar' },
  { value: 'DECLINED', label: 'Auskunft verweigert' },
]

export function ReviewerCheckClient({ check }: { check: CheckData }) {
  const router = useRouter()
  const [callNotes, setCallNotes] = useState(check.callNotes ?? '')
  const [discrepancies, setDiscrepancies] = useState(check.discrepancies ?? '')
  const [rating, setRating] = useState<number | ''>(check.rating ?? '')
  const [result, setResult] = useState(check.result ?? '')
  const [saving, setSaving] = useState(false)
  const [releasing, setReleasing] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function save() {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/reviewer/checks/${check.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callNotes: callNotes || null,
          discrepancies: discrepancies || null,
          rating: rating === '' ? null : Number(rating),
          result: result || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Speichern fehlgeschlagen.')
      setMsg({ type: 'ok', text: 'Gespeichert.' })
      router.refresh()
    } catch (e: any) {
      setMsg({ type: 'err', text: e.message })
    } finally {
      setSaving(false)
    }
  }

  async function release() {
    if (!confirm('Prüfung freigeben? Status wird auf „Abgeschlossen" gesetzt und der HR-Auftraggeber benachrichtigt.')) return
    setReleasing(true)
    setMsg(null)
    try {
      // Erst speichern, dann freigeben — damit die Notizen im Report landen.
      const saveRes = await fetch(`/api/reviewer/checks/${check.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callNotes: callNotes || null,
          discrepancies: discrepancies || null,
          rating: rating === '' ? null : Number(rating),
          result: result || null,
        }),
      })
      if (!saveRes.ok) throw new Error((await saveRes.json()).error ?? 'Speichern fehlgeschlagen.')

      const res = await fetch(`/api/reviewer/checks/${check.id}/release`, { method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Freigabe fehlgeschlagen.')
      setMsg({ type: 'ok', text: 'Freigegeben. HR-Auftraggeber wurde benachrichtigt.' })
      router.push('/reviewer/queue')
      router.refresh()
    } catch (e: any) {
      setMsg({ type: 'err', text: e.message })
      setReleasing(false)
    }
  }

  const released = check.status === 'COMPLETED'

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Kontext (read-only) */}
      <div className="card-md p-4 grid sm:grid-cols-2 gap-3 text-sm">
        <div><span className="text-text-muted">Arbeitgeber:</span> {check.employerName}</div>
        <div><span className="text-text-muted">Kontakt:</span> {check.employerContact ?? '—'}</div>
        <div><span className="text-text-muted">Telefon:</span> {check.employerPhone ?? '—'}</div>
        <div><span className="text-text-muted">Position:</span> {check.position ?? '—'}</div>
        <div><span className="text-text-muted">Zeitraum:</span> {check.startDate ?? '?'} – {check.endDate ?? '?'}</div>
      </div>

      {/* Reviewer-Eingaben */}
      <div className="card-md p-4 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-1">Gesprächsnotizen</label>
          <textarea
            value={callNotes}
            onChange={(e) => setCallNotes(e.target.value)}
            rows={6}
            maxLength={5000}
            disabled={released}
            className="w-full rounded-xl border border-border bg-bg-secondary px-3 py-2 text-sm"
            placeholder="Notizen aus dem Referenzgespräch…"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-primary mb-1">Diskrepanzen / Auffälligkeiten</label>
          <textarea
            value={discrepancies}
            onChange={(e) => setDiscrepancies(e.target.value)}
            rows={3}
            maxLength={5000}
            disabled={released}
            className="w-full rounded-xl border border-border bg-bg-secondary px-3 py-2 text-sm"
            placeholder="Markierte Unstimmigkeiten zwischen CV-Angaben und Referenzauskunft…"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1">Bewertung (1–5)</label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={released}
              className="w-full rounded-xl border border-border bg-bg-secondary px-3 py-2 text-sm"
            >
              <option value="">— keine —</option>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1">Ergebnis</label>
            <select
              value={result}
              onChange={(e) => setResult(e.target.value)}
              disabled={released}
              className="w-full rounded-xl border border-border bg-bg-secondary px-3 py-2 text-sm"
            >
              {RESULTS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`text-sm rounded-xl px-3 py-2 ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {msg.text}
        </div>
      )}

      {released ? (
        <div className="card-md p-4 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Diese Prüfung ist bereits freigegeben (abgeschlossen).
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button onClick={save} disabled={saving || releasing} className="btn-secondary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Speichern
          </button>
          <button onClick={release} disabled={saving || releasing} className="btn-primary">
            {releasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Freigeben
          </button>
        </div>
      )}
    </div>
  )
}

CANDIQ_EOF
echo "  + app/(dashboard)/reviewer/check/[id]/ReviewerCheckClient.tsx"

mkdir -p "$(dirname 'app/api/reviewer/checks/[id]/route.ts')"
cat > 'app/api/reviewer/checks/[id]/route.ts' <<'CANDIQ_EOF'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isReviewer } from '@/lib/reviewer'
import { getClientIp } from '@/lib/rate-limit'

const VALID_RESULTS = ['VERIFIED', 'DISCREPANCY_FOUND', 'UNREACHABLE', 'DECLINED']
const MAX_NOTES_LEN = 5000

/**
 * PATCH /api/reviewer/checks/:id
 * Reviewer speichert Gesprächsnotizen, Diskrepanzen, Rating, Ergebnis.
 * Rollen-gated (REVIEWER/ADMIN), BEWUSST ohne userId-Filter — Reviewer
 * arbeiten workspace-übergreifend. Status wird hier NICHT verändert
 * (Freigabe läuft über /release).
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (!isReviewer(session)) return NextResponse.json({ error: 'Reviewer-Rolle erforderlich.' }, { status: 403 })

  const check = await prisma.referenceCheck.findUnique({ where: { id: params.id } })
  if (!check) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })
  if (check.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Prüfung ist bereits freigegeben.' }, { status: 409 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}

  if (body.callNotes !== undefined) {
    const v = body.callNotes === null ? null : String(body.callNotes)
    if (v !== null && v.length > MAX_NOTES_LEN) {
      return NextResponse.json({ error: `Notizen max. ${MAX_NOTES_LEN} Zeichen.` }, { status: 400 })
    }
    data.callNotes = v
  }

  if (body.discrepancies !== undefined) {
    const v = body.discrepancies === null ? null : String(body.discrepancies)
    if (v !== null && v.length > MAX_NOTES_LEN) {
      return NextResponse.json({ error: `Diskrepanzen max. ${MAX_NOTES_LEN} Zeichen.` }, { status: 400 })
    }
    data.discrepancies = v
  }

  if (body.rating !== undefined) {
    if (body.rating === null) {
      data.rating = null
    } else {
      const rating = Number(body.rating)
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return NextResponse.json({ error: 'Bewertung muss zwischen 1 und 5 liegen.' }, { status: 400 })
      }
      data.rating = rating
    }
  }

  if (body.result !== undefined) {
    const result = body.result === null || body.result === '' ? null : String(body.result)
    if (result !== null && !VALID_RESULTS.includes(result)) {
      return NextResponse.json({ error: 'Ungültiges Ergebnis.' }, { status: 400 })
    }
    data.result = result
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Keine Änderungen.' }, { status: 400 })
  }

  const updated = await prisma.referenceCheck.update({ where: { id: params.id }, data })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'REVIEW_UPDATE',
      entity: 'ReferenceCheck',
      entityId: check.id,
      details: JSON.stringify({ fields: Object.keys(data) }),
      ip: getClientIp(req),
    },
  })

  return NextResponse.json(updated)
}

CANDIQ_EOF
echo "  + app/api/reviewer/checks/[id]/route.ts"

mkdir -p "$(dirname 'app/api/reviewer/checks/[id]/release/route.ts')"
cat > 'app/api/reviewer/checks/[id]/release/route.ts' <<'CANDIQ_EOF'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isReviewer } from '@/lib/reviewer'
import { getClientIp } from '@/lib/rate-limit'
import { generateAndDeliverCheckReport } from '@/lib/check-report'

// react-pdf (im Report) braucht die Node-Runtime.
export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/reviewer/checks/:id/release
 * Freigabe durch geschulten Reviewer: Status -> COMPLETED, Audit-Log,
 * dann automatisch PDF-Report erzeugen (Vercel Blob) + HR-Auftraggeber mailen.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  if (!isReviewer(session)) return NextResponse.json({ error: 'Reviewer-Rolle erforderlich.' }, { status: 403 })

  const check = await prisma.referenceCheck.findUnique({ where: { id: params.id } })
  if (!check) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })
  if (check.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Prüfung ist bereits freigegeben.' }, { status: 409 })
  }

  const updated = await prisma.referenceCheck.update({
    where: { id: params.id },
    data: { status: 'COMPLETED', calledAt: check.calledAt ?? new Date() },
  })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'REVIEW_RELEASE',
      entity: 'ReferenceCheck',
      entityId: check.id,
      details: JSON.stringify({
        from: check.status,
        to: 'COMPLETED',
        candidateId: check.candidateId,
        rating: check.rating ?? null,
        result: check.result ?? null,
      }),
      ip: getClientIp(req),
    },
  })

  // Auto-Trigger P1.2: PDF erzeugen + an HR mailen. Best-effort — die Freigabe
  // ist bereits persistiert; ein Mail-/PDF-Fehler darf sie nicht zurückrollen.
  let report: { url: string; emailed: boolean } | null = null
  try {
    report = await generateAndDeliverCheckReport(check.id)
  } catch {
    // geschluckt; Report kann manuell über POST /api/checks/:id/report nachgezogen werden.
  }

  return NextResponse.json({ ok: true, status: updated.status, report })
}

CANDIQ_EOF
echo "  + app/api/reviewer/checks/[id]/release/route.ts"

mkdir -p "$(dirname 'app/api/checks/[id]/report/route.ts')"
cat > 'app/api/checks/[id]/report/route.ts' <<'CANDIQ_EOF'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isReviewer } from '@/lib/reviewer'
import { getClientIp } from '@/lib/rate-limit'
import { generateAndDeliverCheckReport } from '@/lib/check-report'

// react-pdf braucht die Node-Runtime; PDF-Rendering kann etwas dauern.
export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/checks/:id/report
 * Erzeugt den PDF-Report (Vercel Blob) und mailt den Link an den HR-Auftraggeber.
 * Zugriff: der HR-Eigentümer der Prüfung ODER ein Reviewer/Admin.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  const check = await prisma.referenceCheck.findUnique({
    where: { id: params.id },
    select: { id: true, candidate: { select: { userId: true } } },
  })
  if (!check) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  const isOwner = check.candidate.userId === session.user.id
  if (!isOwner && !isReviewer(session)) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  try {
    const { url, emailed } = await generateAndDeliverCheckReport(params.id)

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'REPORT_GENERATE',
        entity: 'ReferenceCheck',
        entityId: params.id,
        details: JSON.stringify({ url, emailed }),
        ip: getClientIp(req),
      },
    })

    return NextResponse.json({ ok: true, url, emailed })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Report-Erstellung fehlgeschlagen.' }, { status: 500 })
  }
}

CANDIQ_EOF
echo "  + app/api/checks/[id]/report/route.ts"

mkdir -p "$(dirname 'app/(dashboard)/checks/[id]/HandoverToReviewerButton.tsx')"
cat > 'app/(dashboard)/checks/[id]/HandoverToReviewerButton.tsx' <<'CANDIQ_EOF'
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Loader2 } from 'lucide-react'

/**
 * HR-Übergabe an den Reviewer-Pool.
 * Setzt die Prüfung auf IN_REVIEW → sie erscheint in /reviewer/queue.
 * Wird im Header der HR-Check-Detailseite gerendert.
 */
export function HandoverToReviewerButton({ checkId, status }: { checkId: string; status: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (status === 'IN_REVIEW') {
    return <span className="badge bg-amber-50 text-amber-700 border border-amber-200 text-sm py-1 px-3">Im Review</span>
  }
  // Nach Abschluss keine erneute Übergabe.
  if (status === 'COMPLETED') return null

  async function handover() {
    if (!confirm('Prüfung an den Reviewer-Pool übergeben? Ein geschulter Reviewer übernimmt Gespräch & Freigabe.')) return
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch(`/api/checks/${checkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_REVIEW' }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Übergabe fehlgeschlagen.')
      router.refresh()
    } catch (e: any) {
      setErr(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={handover} disabled={loading} className="btn-primary">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
        An Reviewer übergeben
      </button>
      {err && <span className="text-xs text-rose-600">{err}</span>}
    </div>
  )
}

CANDIQ_EOF
echo "  + app/(dashboard)/checks/[id]/HandoverToReviewerButton.tsx"

mkdir -p "$(dirname 'app/api/internal/indexnow-ping/route.ts')"
cat > 'app/api/internal/indexnow-ping/route.ts' <<'CANDIQ_EOF'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const HOST = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://candiq.de').replace(/\/$/, '')
const HOSTNAME = HOST.replace(/^https?:\/\//, '')
const KEY = process.env.NEXT_PUBLIC_INDEXNOW_KEY
const MAX_URLS = 100

/**
 * GET /api/internal/indexnow-ping
 *
 * Per Vercel-Cron getriggert: liest die aktuelle sitemap.xml, extrahiert die
 * URLs und meldet sie an IndexNow (Bing, Yandex, Naver via api.indexnow.org),
 * statt auf den naechsten Crawl zu warten.
 *
 * Schutz: Vercel-Cron schickt automatisch `Authorization: Bearer $CRON_SECRET`,
 * wenn CRON_SECRET in den Project-Env-Vars gesetzt ist (gleiches Muster wie
 * /api/cron/cleanup). Manuelle Aufrufe ohne korrektes Bearer -> 401.
 */
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }
  if (!KEY) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_INDEXNOW_KEY nicht gesetzt.' }, { status: 503 })
  }

  // 1) Sitemap lesen + URLs extrahieren
  let urls: string[] = []
  try {
    const res = await fetch(`${HOST}/sitemap.xml`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`sitemap HTTP ${res.status}`)
    const xml = await res.text()
    urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1].trim())
  } catch (e: any) {
    return NextResponse.json({ error: `Sitemap nicht lesbar: ${e?.message ?? 'unknown'}` }, { status: 502 })
  }

  urls = Array.from(new Set(urls)).slice(0, MAX_URLS)
  if (urls.length === 0) {
    return NextResponse.json({ ok: true, pinged: 0, note: 'keine URLs in sitemap.xml' })
  }

  // 2) IndexNow-Ping (ein Endpoint genuegt; verteilt an alle teilnehmenden Engines)
  const payload = {
    host: HOSTNAME,
    key: KEY,
    keyLocation: `${HOST}/${KEY}.txt`,
    urlList: urls,
  }

  let ping: Response
  try {
    ping = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    })
  } catch (e: any) {
    return NextResponse.json({ error: `IndexNow nicht erreichbar: ${e?.message ?? 'unknown'}` }, { status: 502 })
  }

  return NextResponse.json({ ok: ping.ok, indexnowStatus: ping.status, pinged: urls.length })
}

CANDIQ_EOF
echo "  + app/api/internal/indexnow-ping/route.ts"

echo "==> Patche bestehende Dateien ..."
python3 - <<'PY'
import pathlib

def patch(path, transform, label):
    p = pathlib.Path(path)
    if not p.exists():
        print(f"  !! {label}: {path} fehlt — uebersprungen"); return
    s = p.read_text()
    ns, msg = transform(s)
    if ns is not None and ns != s:
        p.write_text(ns); print(f"  OK {label}: {msg}")
    else:
        print(f"  !! {label}: {msg}")

def t_mw(s):
    if "'/reviewer'" in s: return None, "bereits vorhanden"
    a = "  '/report',\n]"
    if a in s: return s.replace(a, "  '/report',\n  '/reviewer',\n]", 1), "/reviewer ergaenzt"
    return None, "Anchor nicht gefunden — manuell (README-REVIEWER)"
patch("middleware.ts", t_mw, "middleware")

def t_vs(s):
    new = "const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'FAILED']"
    if new in s: return None, "bereits vorhanden"
    old = "const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'FAILED']"
    if old in s: return s.replace(old, new, 1), "IN_REVIEW ergaenzt"
    return None, "Anchor nicht gefunden — manuell"
patch("app/api/checks/[id]/route.ts", t_vs, "checks-API")

def t_sb(s):
    done = []
    if "ShieldCheck" not in s:
        a = "  CreditCard,\n} from 'lucide-react'"
        if a in s: s = s.replace(a, "  CreditCard, ShieldCheck,\n} from 'lucide-react'", 1); done.append("Icon")
    if "const isReviewer" not in s:
        a = "const isAgency = session?.user?.accountType === 'RECRUITMENT_AGENCY'"
        if a in s: s = s.replace(a, a + "\n  const isReviewer = session?.user?.role === 'REVIEWER' || session?.user?.role === 'ADMIN'", 1); done.append("isReviewer")
    if "/reviewer/queue" not in s:
        a = '        <NavSection label="Konto">'
        inj = ('        {isReviewer && (\n'
               '          <NavSection label="Review">\n'
               '            <NavItem href="/reviewer/queue" label="Reviewer-Queue" icon={ShieldCheck} pathname={pathname} />\n'
               '          </NavSection>\n'
               '        )}\n\n')
        if a in s: s = s.replace(a, inj + a, 1); done.append("Nav")
    return (s, ", ".join(done) if done else "nichts zu tun / Anchor fehlt")
patch("components/layout/Sidebar.tsx", t_sb, "Sidebar")

def t_pg(s):
    if "HandoverToReviewerButton" in s: return None, "bereits vorhanden"
    done = []
    a = "import { CheckEditor } from './CheckEditor'"
    if a in s: s = s.replace(a, a + "\nimport { HandoverToReviewerButton } from './HandoverToReviewerButton'", 1); done.append("import")
    b = '<div className="flex gap-2">'
    if s.count(b) == 1:
        s = s.replace(b, b + "\n            <HandoverToReviewerButton checkId={check.id} status={check.status} />", 1); done.append("Button")
    else:
        done.append("Button NICHT eindeutig — bitte manuell in den Header platzieren")
    return s, ", ".join(done)
patch("app/(dashboard)/checks/[id]/page.tsx", t_pg, "checks-page")

def t_vercel(s):
    if "indexnow-ping" in s: return None, "bereits vorhanden"
    a = '{ "path": "/api/cron/cleanup", "schedule": "0 3 * * *" }'
    if a in s:
        repl = a + ',\n    { "path": "/api/internal/indexnow-ping", "schedule": "0 4 * * *" }'
        return s.replace(a, repl, 1), "indexnow-ping Cron ergaenzt"
    return None, "Anchor (cron cleanup) nicht gefunden — manuell (README-P3)"
patch("vercel.json", t_vercel, "vercel.json cron")
PY

echo
echo "==> Verifikation: lint / build / test"
npm run lint
npm run build
npm run test

cat <<'DONE'

============================================================
 Fertig auf Branch feat/reviewer-p3-end-to-end (nichts committed/gepusht).
 1) Pruefen:        git diff
 2) Reviewer-Rolle (Supabase SQL Editor der candiq-DB):
      update "User" set role='REVIEWER' where email='DEINE_REVIEWER_MAIL';
 3) Committen + pushen:
      git add -A
      git commit -m "feat(reviewer+seo): reviewer-workflow, pdf-report, auto-indexnow-ping"
      git push -u origin feat/reviewer-p3-end-to-end
 4) PR oeffnen und squash-mergen. Der CI-Check sollte jetzt GRUEN sein
    (package-lock.json wurde durch npm install regeneriert).
 Hinweis: Faellt ein Patch mit "!!" auf, den Edit manuell aus den READMEs ziehen.
============================================================
DONE

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { parseCsv, rowToCandidate, type CandidateInput } from '@/lib/csv'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const MAX_ROWS = 500
const MAX_BYTES = 2 * 1024 * 1024 // 2 MB

/**
 * Bulk-Kandidaten-Import via CSV.
 *
 * Akzeptiert Multipart-Upload mit `file` (CSV) ODER JSON-Body mit `csv` (string).
 * Antwortet mit { created, skipped, errors[{ row, message }] } — Frontend zeigt
 * eine Diff-Tabelle, die der User vor dem finalen Submit reviewen kann.
 *
 * Optional: `dryRun=true` parsed nur, schreibt nicht.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  // Rate-Limit: 10 Bulk-Imports pro Stunde pro User (jeder Import bis 500 Rows)
  const ip = getClientIp(req)
  const rl = rateLimit(`bulk:${session.user.id}:${ip}`, 10, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Zu viele Bulk-Importe. Bitte in ${Math.ceil(rl.retryAfter / 60)} Minuten erneut versuchen.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  let csvText = ''
  let dryRun = false
  const contentType = req.headers.get('content-type') ?? ''

  try {
    if (contentType.includes('multipart/form-data')) {
      const fd = await req.formData()
      const file = fd.get('file')
      dryRun = fd.get('dryRun') === 'true'
      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'Keine Datei übermittelt.' }, { status: 400 })
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json(
          { error: `Datei zu groß (max. ${Math.round(MAX_BYTES / 1024 / 1024)} MB).` },
          { status: 413 },
        )
      }
      csvText = await file.text()
    } else {
      const body = await req.json()
      csvText = String(body?.csv ?? '')
      dryRun = body?.dryRun === true
      if (csvText.length > MAX_BYTES) {
        return NextResponse.json({ error: 'CSV zu groß (max. 2 MB).' }, { status: 413 })
      }
    }
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  if (!csvText.trim()) {
    return NextResponse.json({ error: 'CSV ist leer.' }, { status: 400 })
  }

  const { headers, rows } = parseCsv(csvText)
  if (headers.length === 0) {
    return NextResponse.json({ error: 'CSV-Header konnte nicht erkannt werden.' }, { status: 400 })
  }
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Keine Datenzeilen in CSV gefunden.' }, { status: 400 })
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Maximal ${MAX_ROWS} Zeilen pro Import. Datei hat ${rows.length}.` },
      { status: 413 },
    )
  }

  const validated: { data: CandidateInput; error?: string; rowNumber: number }[] = rows.map(
    (row, idx) => {
      const result = rowToCandidate(row, headers)
      return { ...result, rowNumber: idx + 2 } // +2: Header ist Zeile 1, erste Datenzeile = 2
    },
  )

  const errors = validated
    .filter((v) => v.error)
    .map((v) => ({ row: v.rowNumber, message: v.error!, data: v.data }))
  const valid = validated.filter((v) => !v.error).map((v) => v.data)

  // Doppelte Email-Adressen (innerhalb des Imports) → Warnung
  const seenEmails = new Map<string, number>()
  const duplicates: { row: number; email: string }[] = []
  validated.forEach((v, idx) => {
    if (v.error || !v.data.email) return
    const e = v.data.email.toLowerCase()
    if (seenEmails.has(e)) {
      duplicates.push({ row: v.rowNumber, email: e })
    } else {
      seenEmails.set(e, idx)
    }
  })

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      totalRows: rows.length,
      valid: valid.length,
      errors,
      duplicates,
      preview: valid.slice(0, 10),
    })
  }

  // Tatsächliches Anlegen
  let created = 0
  const createErrors: { row: number; message: string }[] = []

  for (let i = 0; i < validated.length; i++) {
    const v = validated[i]
    if (!v || v.error) continue
    try {
      await prisma.candidate.create({
        data: {
          userId: session.user.id,
          firstName: v.data.firstName,
          lastName: v.data.lastName,
          email: v.data.email || null,
          phone: v.data.phone || null,
          position: v.data.position,
          department: v.data.department || null,
          notes: v.data.notes || null,
          status: 'PENDING',
          gdprConsent: false, // Pflichtfeld vor Bulk-Import nicht setzbar
        },
      })
      created++
    } catch (err: any) {
      console.error('bulk_create_error', { row: v.rowNumber, message: err?.message })
      createErrors.push({ row: v.rowNumber, message: err?.message?.slice(0, 200) ?? 'unknown' })
    }
  }

  // Audit-Log
  try {
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'BULK_IMPORT',
        entity: 'Candidate',
        details: `Bulk-Import: ${created}/${rows.length} Kandidaten angelegt · ${errors.length} Validierungsfehler · ${createErrors.length} Schreibfehler`,
        ip,
      },
    })
  } catch { /* noop */ }

  return NextResponse.json({
    ok: true,
    dryRun: false,
    totalRows: rows.length,
    created,
    errors: [...errors, ...createErrors],
    duplicates,
  })
}

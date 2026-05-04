import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * CV-Auto-Parsing via Claude API.
 *
 * Akzeptiert PDF/JPG/PNG ≤ 4 MB, extrahiert strukturierte Daten und retourniert
 * sie als JSON. Das Frontend füllt damit das Kandidaten-Formular vor + bietet
 * an, die Referenz-Checks für die letzten Arbeitgeber gleich mit anzulegen.
 *
 * Graceful fallback: ohne ANTHROPIC_API_KEY antwortet der Endpoint mit 503
 * und einem operatorHint — Frontend zeigt dann das normale Formular.
 */

const MAX_FILE_BYTES = 4 * 1024 * 1024 // 4 MB
const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])

const EXTRACTION_PROMPT = `Du bekommst einen Lebenslauf (CV). Extrahiere die strukturierten Daten so präzise wie möglich.

Wichtige Regeln:
- Wenn ein Feld nicht klar erkennbar ist: Wert auf null oder leer-String lassen, NICHT raten.
- Bei "position" → die ZIELPOSITION oder die AKTUELLSTE Berufsbezeichnung.
- Bei "previousEmployers" → bis zu 5 Stationen, NEUSTE ZUERST. "current"=true nur wenn die Stelle laut CV noch aktiv ist.
- Bei "summary" → 1-2 Sätze auf Deutsch, neutraler HR-Stil. Keine Wertung.
- Telefonnummern im internationalen Format wenn möglich (+49 …).
- Datumsangaben "MM/YYYY" wenn vorhanden, sonst "YYYY".

Antworte AUSSCHLIESSLICH gemäß dem JSON-Schema.`

const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    firstName: { type: 'string', description: 'Vorname des Kandidaten' },
    lastName: { type: 'string', description: 'Nachname' },
    email: { type: 'string', description: 'E-Mail oder leer' },
    phone: { type: 'string', description: 'Telefon oder leer' },
    position: { type: 'string', description: 'Aktuelle/angestrebte Position' },
    department: { type: 'string', description: 'Abteilung/Bereich oder leer' },
    summary: { type: 'string', description: '1-2 Sätze Profilzusammenfassung auf Deutsch' },
    skills: {
      type: 'array',
      items: { type: 'string' },
      description: 'Top 5-8 fachliche Kernkompetenzen',
    },
    previousEmployers: {
      type: 'array',
      description: 'Bis zu 5 frühere Arbeitgeber, neueste zuerst',
      items: {
        type: 'object',
        properties: {
          employerName: { type: 'string' },
          position: { type: 'string' },
          startDate: { type: 'string', description: 'MM/YYYY oder YYYY' },
          endDate: { type: 'string', description: 'MM/YYYY oder YYYY oder leer wenn current' },
          location: { type: 'string' },
          current: { type: 'boolean' },
        },
        required: ['employerName', 'position', 'current'],
        additionalProperties: false,
      },
    },
  },
  required: ['firstName', 'lastName', 'position', 'previousEmployers'],
  additionalProperties: false,
} as const

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  // Rate-Limit: 20 CV-Parses pro Stunde pro User (CV-Parsing ist kostspielig)
  const ip = getClientIp(req)
  const rl = rateLimit(`parse:${session.user.id}:${ip}`, 20, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Zu viele CV-Parse-Anfragen. Bitte in ${Math.ceil(rl.retryAfter / 60)} Minuten erneut versuchen.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error: 'CV-Auto-Parsing ist aktuell nicht aktiviert. Bitte Felder manuell ausfüllen.',
        operatorHint: 'ANTHROPIC_API_KEY env-var setzen, um CV-Auto-Parsing zu aktivieren.',
      },
      { status: 503 }
    )
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage (kein Multipart-Body).' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Keine Datei übermittelt.' }, { status: 400 })
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'Datei ist leer.' }, { status: 400 })
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: `Datei zu groß (max. ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB).` },
      { status: 413 }
    )
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: 'Format nicht unterstützt. Bitte PDF, JPG oder PNG hochladen.' },
      { status: 415 }
    )
  }

  // In Base64 konvertieren — Anthropic akzeptiert PDFs/Bilder direkt inline
  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')

  const isImage = file.type.startsWith('image/')
  const mediaType = file.type as 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp'

  try {
    const client = new Anthropic()

    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 4096,
      output_config: {
        format: { type: 'json_schema', schema: EXTRACTION_SCHEMA },
      },
      messages: [
        {
          role: 'user',
          content: [
            isImage
              ? {
                  type: 'image',
                  source: { type: 'base64', media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp', data: base64 },
                }
              : {
                  type: 'document',
                  source: { type: 'base64', media_type: 'application/pdf', data: base64 },
                },
            { type: 'text', text: EXTRACTION_PROMPT },
          ],
        },
      ],
    })

    // Strukturierter Output liegt im ersten Text-Block — durch json_schema validiert
    const firstBlock = response.content.find((b) => b.type === 'text')
    if (!firstBlock || firstBlock.type !== 'text') {
      throw new Error('Keine Antwort vom Modell erhalten.')
    }

    let parsed: any
    try {
      parsed = JSON.parse(firstBlock.text)
    } catch {
      throw new Error('Modell-Antwort konnte nicht geparst werden.')
    }

    return NextResponse.json({
      ok: true,
      data: {
        firstName: parsed.firstName?.trim() ?? '',
        lastName: parsed.lastName?.trim() ?? '',
        email: parsed.email?.trim() ?? '',
        phone: parsed.phone?.trim() ?? '',
        position: parsed.position?.trim() ?? '',
        department: parsed.department?.trim() ?? '',
        summary: parsed.summary?.trim() ?? '',
        skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 12) : [],
        previousEmployers: Array.isArray(parsed.previousEmployers)
          ? parsed.previousEmployers.slice(0, 5).map((e: any) => ({
              employerName: e.employerName?.trim() ?? '',
              position: e.position?.trim() ?? '',
              startDate: e.startDate?.trim() ?? '',
              endDate: e.endDate?.trim() ?? '',
              location: e.location?.trim() ?? '',
              current: !!e.current,
            }))
          : [],
      },
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    })
  } catch (err: any) {
    console.error('cv_parse_error', {
      name: err?.name,
      status: err?.status,
      message: err?.message?.slice(0, 200),
    })

    if (err instanceof Anthropic.APIError) {
      if (err.status === 401) {
        return NextResponse.json(
          {
            error: 'CV-Auto-Parsing nicht verfügbar (Konfigurationsfehler).',
            operatorHint: 'ANTHROPIC_API_KEY ist ungültig.',
          },
          { status: 503 }
        )
      }
      if (err.status === 429) {
        return NextResponse.json(
          { error: 'Aktuell hohe Auslastung. Bitte in einer Minute erneut versuchen.' },
          { status: 503 }
        )
      }
      if (err.status === 413 || err.status === 400) {
        return NextResponse.json(
          { error: 'CV konnte nicht verarbeitet werden — bitte als anderes Format (PDF/JPG/PNG) hochladen oder manuell ausfüllen.' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'CV-Parsing ist aktuell nicht möglich. Bitte Felder manuell ausfüllen.' },
      { status: 500 }
    )
  }
}

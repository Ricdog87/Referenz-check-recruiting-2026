import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * candiq AI — CV Auto-Parsing.
 *
 * Pipeline:
 *  1. Validate file (PDF/JPG/PNG/WebP, ≤4MB).
 *  2. Send to Claude with a prompt-driven JSON response (no output_config —
 *     proven more stable across model versions and PDF documents).
 *  3. Strip optional markdown fences, parse JSON, normalize fields.
 *  4. Return structured candidate data + employment history.
 *
 * Graceful fallback: missing ANTHROPIC_API_KEY → 503 + operatorHint.
 * Diagnostic: real Anthropic error messages are bubbled up via operatorHint
 * so the operator can see *why* parsing failed without ssh / vercel logs.
 */

const MAX_FILE_BYTES = 4 * 1024 * 1024
const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])

const EXTRACTION_PROMPT = `Du bist ein präziser HR-Assistent. Extrahiere die folgenden Felder aus dem angehängten Lebenslauf.

Antworte AUSSCHLIESSLICH mit einem JSON-Objekt — keine Erklärung davor oder danach, keine Markdown-Codeblöcke. Genau dieses Schema:

{
  "firstName": "Vorname (string, leer wenn unklar)",
  "lastName": "Nachname (string, leer wenn unklar)",
  "email": "E-Mail (string, leer wenn nicht im CV)",
  "phone": "Telefon im internationalen Format wenn möglich (string, leer wenn nicht im CV)",
  "position": "Aktuelle oder angestrebte Berufsbezeichnung (string)",
  "department": "Abteilung/Bereich (string, leer wenn unklar)",
  "summary": "1-2 Sätze neutrale Profilzusammenfassung auf Deutsch (string)",
  "skills": ["max 8 fachliche Kernkompetenzen als string-array"],
  "previousEmployers": [
    {
      "employerName": "Firmenname (string)",
      "position": "Damalige Position (string)",
      "startDate": "MM/YYYY oder YYYY (string, leer wenn unklar)",
      "endDate": "MM/YYYY oder YYYY (string, leer wenn aktuell)",
      "location": "Stadt (string, leer wenn unklar)",
      "current": "true wenn diese Stelle laut CV noch aktiv ist, sonst false (boolean)"
    }
  ]
}

Regeln:
- Bis zu 5 Arbeitgeber, NEUSTE ZUERST.
- Wenn ein Feld nicht klar erkennbar ist: leerer String, NICHT raten.
- "current": nur true wenn das CV explizit "aktuell", "laufend", "heute" o.ä. anzeigt.
- KEINE zusätzlichen Felder.`

type ParsedData = {
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  department: string
  summary: string
  skills: string[]
  previousEmployers: Array<{
    employerName: string
    position: string
    startDate: string
    endDate: string
    location: string
    current: boolean
  }>
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  // Rate-Limit: 20 Parses/h pro User
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
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
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

  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  const isImage = file.type.startsWith('image/')

  try {
    const client = new Anthropic()

    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            isImage
              ? {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
                    data: base64,
                  },
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

    // Antwort einlesen — wir erwarten genau einen text-Block
    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      console.error('cv_parse_no_text_block', { content: response.content })
      return NextResponse.json(
        {
          error: 'CV-Analyse hat keine Antwort geliefert. Bitte Felder manuell ausfüllen.',
          operatorHint: 'Modell-Antwort enthielt keinen Text-Block.',
        },
        { status: 502 }
      )
    }

    // Manchmal wickelt das Modell die Antwort in ```json … ``` oder fügt vorab Text ein.
    // Wir extrahieren das erste { … } Objekt robust raus.
    const raw = textBlock.text.trim()
    const jsonStr = extractJson(raw)
    if (!jsonStr) {
      console.error('cv_parse_no_json', { raw: raw.slice(0, 300) })
      return NextResponse.json(
        {
          error: 'CV-Analyse lieferte unstrukturierte Antwort. Bitte Felder manuell ausfüllen.',
          operatorHint: 'Antwort enthielt kein parsbares JSON-Objekt.',
        },
        { status: 502 }
      )
    }

    let parsed: any
    try {
      parsed = JSON.parse(jsonStr)
    } catch (parseErr: any) {
      console.error('cv_parse_json_invalid', {
        message: parseErr?.message,
        snippet: jsonStr.slice(0, 200),
      })
      return NextResponse.json(
        {
          error: 'CV-Analyse-Antwort war kein gültiges JSON. Bitte erneut versuchen.',
          operatorHint: `JSON.parse: ${parseErr?.message ?? 'unknown'}`,
        },
        { status: 502 }
      )
    }

    const data = normalize(parsed)

    return NextResponse.json({
      ok: true,
      data,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    })
  } catch (err: any) {
    console.error('cv_parse_error', {
      name: err?.name,
      status: err?.status,
      type: err?.error?.type,
      message: err?.message?.slice(0, 300),
    })

    // Echte Anthropic-Fehler bubbeln wir als operatorHint hoch — sonst stochert
    // der Operator in /api/health und Vercel-Logs herum.
    if (err instanceof Anthropic.APIError) {
      const baseHint = `Anthropic API: ${err.status} ${err.error?.type ?? 'error'}`
      const detail = err.message?.slice(0, 240) ?? ''

      if (err.status === 401) {
        return NextResponse.json(
          {
            error: 'CV-Auto-Parsing nicht verfügbar (Konfigurationsfehler).',
            operatorHint: `ANTHROPIC_API_KEY ist ungültig oder abgelaufen — Console: https://console.anthropic.com/settings/keys`,
          },
          { status: 503 }
        )
      }
      if (err.status === 403) {
        return NextResponse.json(
          {
            error: 'CV-Auto-Parsing nicht verfügbar (kein Zugriff auf Modell).',
            operatorHint: `${baseHint}: claude-opus-4-7 nicht für diesen API-Key freigeschaltet. Workspace-Tier prüfen.`,
          },
          { status: 503 }
        )
      }
      if (err.status === 404) {
        return NextResponse.json(
          {
            error: 'CV-Auto-Parsing nicht verfügbar (Modell nicht gefunden).',
            operatorHint: `${baseHint}: Modell claude-opus-4-7 ist auf diesem Account nicht verfügbar.`,
          },
          { status: 503 }
        )
      }
      if (err.status === 429) {
        return NextResponse.json(
          { error: 'Aktuell hohe Auslastung. Bitte in einer Minute erneut versuchen.', operatorHint: baseHint },
          { status: 503 }
        )
      }
      if (err.status === 413 || err.status === 400) {
        return NextResponse.json(
          {
            error: 'CV konnte nicht verarbeitet werden — bitte als PDF unter 4 MB erneut versuchen oder Felder manuell ausfüllen.',
            operatorHint: `${baseHint}: ${detail}`,
          },
          { status: 400 }
        )
      }
      return NextResponse.json(
        {
          error: 'CV-Analyse aktuell gestört. Bitte Felder manuell ausfüllen.',
          operatorHint: `${baseHint}: ${detail}`,
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        error: 'CV-Analyse fehlgeschlagen. Bitte Felder manuell ausfüllen.',
        operatorHint: err?.message?.slice(0, 240) ?? 'Unbekannter Fehler',
      },
      { status: 500 }
    )
  }
}

/**
 * Extrahiert das erste vollständige JSON-Objekt aus einem Text — auch wenn es
 * in Markdown-Code-Fences eingewickelt ist oder zusätzlicher Text drumrum steht.
 */
function extractJson(text: string): string | null {
  // 1. Markdown-Codefences entfernen wenn vorhanden
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenceMatch && fenceMatch[1]) {
    return fenceMatch[1].trim()
  }
  // 2. Erstes { bis zum dazu passenden schließenden } finden (mit Bracket-Counting)
  const start = text.indexOf('{')
  if (start === -1) return null
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i++) {
    const c = text[i]
    if (escaped) { escaped = false; continue }
    if (c === '\\' && inString) { escaped = true; continue }
    if (c === '"') inString = !inString
    if (inString) continue
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

function normalize(parsed: any): ParsedData {
  const arr = (v: any) => (Array.isArray(v) ? v : [])
  const str = (v: any) => (typeof v === 'string' ? v.trim() : '')
  return {
    firstName: str(parsed.firstName),
    lastName: str(parsed.lastName),
    email: str(parsed.email),
    phone: str(parsed.phone),
    position: str(parsed.position),
    department: str(parsed.department),
    summary: str(parsed.summary),
    skills: arr(parsed.skills).map(str).filter(Boolean).slice(0, 12),
    previousEmployers: arr(parsed.previousEmployers).slice(0, 5).map((e: any) => ({
      employerName: str(e?.employerName),
      position: str(e?.position),
      startDate: str(e?.startDate),
      endDate: str(e?.endDate),
      location: str(e?.location),
      current: e?.current === true,
    })),
  }
}

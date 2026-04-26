import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function normalizeText(input: string) {
  return input.replace(/\u0000/g, ' ').replace(/\s+/g, ' ').trim()
}

function extractCandidateData(text: string, filename: string) {
  const normalized = normalizeText(text)
  const lines = normalized.split(/\s{2,}|\n/).map((l) => l.trim()).filter(Boolean)

  const emailMatch = normalized.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  const phoneMatch = normalized.match(/(\+?\d[\d\s\-()/]{7,}\d)/)

  let firstName = ''
  let lastName = ''

  const filenameBase = filename.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ')
  const fnParts = filenameBase.split(/\s+/).filter(Boolean)

  const fullNameLine = lines.find((line) => /^[A-ZÄÖÜ][A-Za-zÄÖÜäöüß'-]+\s+[A-ZÄÖÜ][A-Za-zÄÖÜäöüß'-]+$/.test(line))

  if (fullNameLine) {
    const [f, ...rest] = fullNameLine.split(' ')
    firstName = f
    lastName = rest.join(' ')
  } else if (fnParts.length >= 2) {
    firstName = fnParts[0]
    lastName = fnParts[1]
  }

  const positionKeywords = [
    'software engineer',
    'software developer',
    'entwickler',
    'project manager',
    'produktmanager',
    'sales manager',
    'account manager',
    'data analyst',
    'hr manager',
    'recruiter',
  ]

  let position = ''
  const lower = normalized.toLowerCase()
  for (const kw of positionKeywords) {
    if (lower.includes(kw)) {
      position = kw
        .split(' ')
        .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
        .join(' ')
      break
    }
  }

  return {
    firstName,
    lastName,
    email: emailMatch?.[0] ?? '',
    phone: phoneMatch?.[0] ?? '',
    position,
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Datei fehlt.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const utf8 = buffer.toString('utf8')
    const latin1 = buffer.toString('latin1')
    const mergedText = `${utf8}\n${latin1}`

    const parsed = extractCandidateData(mergedText, file.name)

    return NextResponse.json({
      parsed,
      confidence: Object.values(parsed).filter(Boolean).length,
      note: 'Best-effort Parsing aktiv. Bitte Daten kurz prüfen.',
    })
  } catch (error) {
    console.error('CV parse failed:', error)
    return NextResponse.json({ error: 'CV Parsing fehlgeschlagen.' }, { status: 500 })
  }
}

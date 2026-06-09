import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { put } from '@vercel/blob'
import { extname } from 'path'
import { randomUUID } from 'crypto'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]
const MAX_SIZE = 4 * 1024 * 1024 // 4 MB (Vercel serverless limit)
const VALID_DOC_TYPES = new Set(['CV', 'CERTIFICATE', 'REFERENCE', 'OTHER'])

const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'image/jpeg': '.jpg',
  'image/png': '.png',
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  const ip = getClientIp(req)
  const rl = rateLimit(`upload:${session.user.id}:${ip}`, 30, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Upload-Limit erreicht. Bitte in ${Math.ceil(rl.retryAfter / 60)} Minuten erneut versuchen.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const candidateId = formData.get('candidateId') as string
  const rawType = String(formData.get('type') ?? 'CV').trim().toUpperCase()
  const type = VALID_DOC_TYPES.has(rawType) ? rawType : 'CV'

  if (!file || !candidateId) {
    return NextResponse.json({ error: 'Datei und Kandidaten-ID erforderlich.' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Dateityp nicht erlaubt. Erlaubt: PDF, DOC, DOCX, JPG, PNG' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Datei zu groß (max. 4 MB).' }, { status: 400 })
  }

  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, userId: session.user.id },
  })
  if (!candidate) return NextResponse.json({ error: 'Kandidat nicht gefunden.' }, { status: 404 })

  const ext = MIME_TO_EXT[file.type] ?? extname(file.name) ?? '.bin'
  const blobPath = `candidates/${session.user.id}/${candidateId}/${randomUUID()}${ext}`

  const blob = await put(blobPath, file, {
    access: 'public',
    addRandomSuffix: false,
    contentType: file.type,
  })

  const doc = await prisma.document.create({
    data: {
      name: blobPath,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      path: blob.url,
      type,
      candidateId,
    },
  })

  return NextResponse.json(doc, { status: 201 })
}

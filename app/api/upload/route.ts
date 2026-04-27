import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { put } from '@vercel/blob'
import { extname } from 'path'
import { randomUUID } from 'crypto'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]
const MAX_SIZE = 4 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const candidateId = formData.get('candidateId') as string
    const type = (formData.get('type') as string) || 'CV'

    if (!file || !candidateId) {
      return NextResponse.json({ error: 'Datei und Kandidaten-ID erforderlich.' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Dateityp nicht erlaubt. Erlaubt: PDF, DOC, DOCX, JPG, PNG' },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Datei zu groß (max. 4 MB).' }, { status: 400 })
    }

    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, userId: session.user.id },
    })
    if (!candidate) return NextResponse.json({ error: 'Kandidat nicht gefunden.' }, { status: 404 })

    const ext = extname(file.name) || '.bin'
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
  } catch {
    return NextResponse.json({ error: 'Upload fehlgeschlagen. Bitte versuchen Sie es erneut.' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  const doc = await prisma.document.findFirst({
    where: { id: params.id, candidate: { userId: session.user.id } },
  })
  if (!doc) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  const filePath = join(process.cwd(), 'public', doc.path)
  const buffer = await readFile(filePath)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': doc.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(doc.originalName)}"`,
      'Cache-Control': 'no-store',
    },
  })
}

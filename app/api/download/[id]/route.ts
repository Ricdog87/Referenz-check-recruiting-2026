import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  const doc = await prisma.document.findFirst({
    where: { id: params.id, candidate: { userId: session.user.id } },
  })
  if (!doc) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  // path stores the Vercel Blob URL — redirect with auth check complete
  return NextResponse.redirect(doc.path)
}

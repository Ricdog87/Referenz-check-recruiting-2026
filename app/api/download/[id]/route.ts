import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAppSession } from '@/lib/app-session'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAppSession()
  
  const doc = await prisma.document.findFirst({
    where: { id: params.id, candidate: { userId: session.user.id } },
  })
  if (!doc) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  // path stores the Vercel Blob URL — redirect with auth check complete
  return NextResponse.redirect(doc.path)
}

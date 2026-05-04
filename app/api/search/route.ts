import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Global Search across the user's candidates and checks.
 *
 * Returns up to 5 candidates + 5 checks matching the query — used by the
 * TopBar's omni-search to give recruiters a one-keystroke jump to anything
 * in their workspace.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  const q = (req.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 80)
  if (q.length < 2) {
    return NextResponse.json({ candidates: [], checks: [] })
  }

  const userId = session.user.id

  const [candidates, checks] = await Promise.all([
    prisma.candidate.findMany({
      where: {
        userId,
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { position: { contains: q, mode: 'insensitive' } },
          { department: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        status: true,
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.referenceCheck.findMany({
      where: {
        candidate: { userId },
        OR: [
          { employerName: { contains: q, mode: 'insensitive' } },
          { employerContact: { contains: q, mode: 'insensitive' } },
          { position: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        employerName: true,
        position: true,
        status: true,
        result: true,
        candidate: {
          select: { firstName: true, lastName: true },
        },
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  return NextResponse.json({ candidates, checks })
}

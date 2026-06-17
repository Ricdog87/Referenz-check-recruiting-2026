import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { inviteCandidate } from '@/lib/consent-invite'
import { rateLimit } from '@/lib/rate-limit'

/**
 * POST /api/candidates/:id/invite
 * HR triggert: erzeugt ConsentToken, sendet Mail an Bewerber.
 * Re-Invite ist erlaubt (alte Tokens werden EXPIRED markiert).
 *
 * Die eigentliche Logik liegt in lib/consent-invite.ts — dieselbe
 * Funktion wird auch automatisch aus dem HR-CV-Upload-Pfad aufgerufen,
 * damit der Bewerber sofort die Magic-Link-Mail bekommt.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session)
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  // Rate-Limit: max 10 Invites/Min pro User
  const rl = rateLimit(`invite:${session.user.id}`, 10, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Zu viele Einladungen. Bitte ${Math.ceil(rl.retryAfter / 1000)}s warten.` },
      { status: 429 },
    )
  }

  // Ownership-Check noch hier — wir wollen nicht, dass HR-User X einen
  // Invite fuer den Kandidaten von User Y triggert.
  const owned = await prisma.candidate.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { id: true },
  })
  if (!owned)
    return NextResponse.json({ error: 'Kandidat nicht gefunden.' }, { status: 404 })

  const result = await inviteCandidate({
    candidateId: params.id,
    triggeredByUserId: session.user.id,
    ip: req.headers.get('x-forwarded-for') || 'unknown',
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({
    ok: true,
    provider: result.provider,
    expiresAt: result.expiresAt.toISOString(),
  })
}

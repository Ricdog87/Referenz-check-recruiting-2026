import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createConsentToken } from '@/lib/consent-token'
import { sendEmail, candidateConsentInviteEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { rateLimit } from '@/lib/rate-limit'

const TTL_DAYS = 14

/**
 * POST /api/candidates/:id/invite
 * HR triggert: erzeugt ConsentToken, sendet Mail an Bewerber.
 * Re-Invite ist erlaubt (alte Tokens werden EXPIRED markiert).
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })

  // Rate-Limit: max 10 Invites/Min pro User
  const rl = rateLimit(`invite:${session.user.id}`, 10, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Zu viele Einladungen. Bitte ${Math.ceil(rl.retryAfter / 1000)}s warten.` },
      { status: 429 }
    )
  }

  const candidate = await prisma.candidate.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { user: { select: { name: true, company: true } } },
  })
  if (!candidate) return NextResponse.json({ error: 'Kandidat nicht gefunden.' }, { status: 404 })
  if (!candidate.email) {
    return NextResponse.json({ error: 'Kandidat hat keine E-Mail-Adresse hinterlegt.' }, { status: 400 })
  }

  // Alte Tokens expiren (single active token per candidate)
  await prisma.consentToken.updateMany({
    where: { candidateId: candidate.id, status: 'PENDING_ACCEPT' },
    data: { status: 'EXPIRED' },
  })

  const { token, tokenHash, expiresAt } = createConsentToken(candidate.id, TTL_DAYS)

  await prisma.consentToken.create({
    data: {
      candidateId: candidate.id,
      tokenHash,
      scope: JSON.stringify(['REFERENCE_CHECK', 'CV_UPLOAD', 'CONTACT_REFEREES']),
      expiresAt,
    },
  })

  const portalUrl = `${process.env.NEXTAUTH_URL || 'https://candiq.de'}/candidate/${encodeURIComponent(token)}`
  const mail = candidateConsentInviteEmail({
    candidateFirstName: candidate.firstName,
    hiringCompany: candidate.user.company || candidate.user.name || 'Ihr potenzieller Arbeitgeber',
    position: candidate.position,
    portalUrl,
    expiresInDays: TTL_DAYS,
  })

  const result = await sendEmail({
    to: candidate.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    userId: session.user.id,
    category: 'consent_invite',
  })

  if (!result.ok) {
    logger.error('consent_invite_email_failed', { candidateId: candidate.id, error: result.error })
    return NextResponse.json({ error: 'E-Mail-Versand fehlgeschlagen.' }, { status: 502 })
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'CONSENT_INVITE_SENT',
      entity: 'Candidate',
      entityId: candidate.id,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      details: `to=${candidate.email} provider=${result.provider} expires=${expiresAt.toISOString()}`,
    },
  })

  return NextResponse.json({
    ok: true,
    provider: result.provider,
    expiresAt: expiresAt.toISOString(),
  })
}

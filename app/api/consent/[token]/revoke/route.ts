import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { loadConsentByToken } from '@/lib/consent-token'
import { sendEmail, consentRevokedNotifyHrEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

/**
 * POST /api/consent/:token/revoke
 * Bewerber widerruft Einwilligung jederzeit (Art. 7 Abs. 3 DSGVO).
 * Soft-Delete: Candidate-Status auf REVOKED, ReferenceChecks gestoppt.
 */
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'

  const rl = rateLimit(`revoke:${ip}`, 5, 60_000)
  if (!rl.ok) {
    return NextResponse.json({ error: 'Zu viele Versuche.' }, { status: 429 })
  }

  let record: Awaited<ReturnType<typeof loadConsentByToken>>
  try {
    record = await loadConsentByToken(decodeURIComponent(params.token))
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Token ungültig.' }, { status: 410 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.consentToken.update({
      where: { id: record.id },
      data: { status: 'REVOKED', revokedAt: new Date() },
    })

    await tx.candidate.update({
      where: { id: record.candidateId },
      data: { status: 'CONSENT_REVOKED', gdprConsent: false },
    })

    // Offene Referenz-Checks abbrechen
    await tx.referenceCheck.updateMany({
      where: { candidateId: record.candidateId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      data: { status: 'CANCELLED' },
    })

    await tx.auditLog.create({
      data: {
        userId: null,
        action: 'CONSENT_REVOKED',
        entity: 'ConsentToken',
        entityId: record.id,
        ip,
        details: `candidate=${record.candidateId} previousStatus=${record.status}`,
      },
    })
  })

  logger.info('consent_revoked', { candidateId: record.candidateId })

  // HR-Notification: Bewerber hat widerrufen
  const hrUser = await prisma.user.findFirst({
    where: { candidates: { some: { id: record.candidateId } } },
    select: { id: true, name: true, email: true },
  })
  if (hrUser?.email) {
    const candidate = await prisma.candidate.findUnique({
      where: { id: record.candidateId },
      select: { firstName: true, lastName: true, position: true },
    })
    if (candidate) {
      const baseUrl = process.env.NEXTAUTH_URL || 'https://candiq.de'
      const mail = consentRevokedNotifyHrEmail({
        hrFirstName: hrUser.name?.split(' ')[0] || 'Team',
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        position: candidate.position,
        candidateUrl: `${baseUrl}/candidates/${record.candidateId}`,
      })
      sendEmail({
        to: hrUser.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        userId: hrUser.id,
        category: 'consent_hr_revoke_notify',
      }).catch((e) => logger.error('hr_notify_revoked_failed', e))
    }
  }

  return NextResponse.json({ ok: true })
}

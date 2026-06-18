/**
 * lib/consent-invite.ts
 *
 * Geteilter Helper fuer den Magic-Link-Versand an den Bewerber.
 * Wird aufgerufen aus:
 *  - app/api/candidates/[id]/invite/route.ts (HR triggert manuell)
 *  - app/api/upload/route.ts (Auto-Trigger beim HR-CV-Upload)
 */

import { prisma } from '@/lib/db'
import { createConsentToken } from '@/lib/consent-token'
import { sendEmail, candidateConsentInviteEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

export const CONSENT_INVITE_TTL_DAYS = 14

export type InviteResult =
  | { ok: true; provider: string; expiresAt: Date }
  | { ok: false; error: string; status: number }

/**
 * Sendet einen Consent-Invite-Link an den Bewerber. Idempotent: existierende
 * PENDING_ACCEPT-Tokens werden auf EXPIRED gesetzt, damit immer nur ein
 * Magic-Link gleichzeitig gueltig ist.
 *
 * Best-effort fuer den Auto-Trigger (HR-Upload): wenn der Versand fehlschlaegt,
 * landen Document und ConsentToken trotzdem in der DB. Der Aufrufer kann den
 * Versand bei Bedarf manuell ueber den UI-Button re-triggern.
 */
export async function inviteCandidate(opts: {
  candidateId: string
  triggeredByUserId: string
  ip?: string
}): Promise<InviteResult> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: opts.candidateId },
    include: { user: { select: { name: true, company: true } } },
  })
  if (!candidate) {
    return { ok: false, error: 'Kandidat nicht gefunden.', status: 404 }
  }
  if (!candidate.email) {
    return {
      ok: false,
      error: 'Kandidat hat keine E-Mail-Adresse hinterlegt.',
      status: 400,
    }
  }

  // Alte Tokens expiren (single active token per candidate)
  await prisma.consentToken.updateMany({
    where: { candidateId: candidate.id, status: 'PENDING_ACCEPT' },
    data: { status: 'EXPIRED' },
  })

  const { token, tokenHash, expiresAt } = createConsentToken(
    candidate.id,
    CONSENT_INVITE_TTL_DAYS,
  )

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
    candidateFullName: `${candidate.firstName} ${candidate.lastName}`.trim(),
    hiringCompany:
      candidate.user.company || candidate.user.name || 'Ihr potenzieller Arbeitgeber',
    position: candidate.position,
    portalUrl,
    expiresInDays: CONSENT_INVITE_TTL_DAYS,
  })

  const result = await sendEmail({
    to: candidate.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    userId: opts.triggeredByUserId,
    category: 'consent_invite',
  })

  if (!result.ok) {
    logger.error('consent_invite_email_failed', {
      candidateId: candidate.id,
      error: result.error,
    })
    return { ok: false, error: 'E-Mail-Versand fehlgeschlagen.', status: 502 }
  }

  await prisma.auditLog.create({
    data: {
      userId: opts.triggeredByUserId,
      action: 'CONSENT_INVITE_SENT',
      entity: 'Candidate',
      entityId: candidate.id,
      ip: opts.ip ?? 'unknown',
      details: `to=${candidate.email} provider=${result.provider} expires=${expiresAt.toISOString()}`,
    },
  })

  return { ok: true, provider: result.provider, expiresAt }
}

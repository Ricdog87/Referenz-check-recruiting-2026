/**
 * lib/check-notifications.ts
 *
 * Geteilte Benachrichtigungs- + Assignment-Logik fuer den Reviewer-Handoff.
 * Wird von BEIDEN Uebergabe-Pfaden genutzt:
 *  - app/api/checks/[id]/route.ts (Einzeluebergabe via PATCH status=IN_REVIEW)
 *  - app/api/candidates/[id]/handover/route.ts (Sammeluebergabe)
 *
 * Dadurch: identisches Verhalten, eine Quelle der Wahrheit.
 */

import { prisma } from '@/lib/db'
import {
  sendEmail,
  reviewerHandoffNotificationEmail,
  refereeArt14NotificationEmail,
  type ReviewerHandoffCheck,
} from '@/lib/email'
import { logger } from '@/lib/logger'

const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://candiq.de'

export type AssignedReviewer = {
  id: string
  name: string | null
  email: string
}

/**
 * Round-Robin-Assignment (opt-in via ASSIGNMENT_AUTO=round_robin).
 * Weist den Check dem Reviewer mit der geringsten Anzahl offener
 * Zuweisungen zu und gibt ihn zurueck — damit der Aufrufer die
 * Handoff-Mail zusaetzlich an diesen Reviewer schicken kann (Finding 3).
 *
 * Gibt null zurueck, wenn Auto-Assignment deaktiviert ist oder kein
 * Reviewer existiert.
 */
export async function assignRoundRobinIfEnabled(
  checkId: string,
  currentAssigneeId: string | null,
): Promise<AssignedReviewer | null> {
  if (process.env.ASSIGNMENT_AUTO !== 'round_robin') return null
  if (currentAssigneeId) return null

  const reviewers = await prisma.user.findMany({
    where: { role: { in: ['REVIEWER', 'ADMIN'] } },
    select: {
      id: true,
      name: true,
      email: true,
      _count: { select: { assignedChecks: { where: { status: 'IN_REVIEW' } } } },
    },
  })
  if (reviewers.length === 0) return null

  reviewers.sort((a, b) => {
    const cmp = a._count.assignedChecks - b._count.assignedChecks
    if (cmp !== 0) return cmp
    return (a.name ?? '').localeCompare(b.name ?? '')
  })
  const target = reviewers[0]

  await prisma.referenceCheck.update({
    where: { id: checkId },
    data: { assignedReviewerId: target.id, assignedAt: new Date() },
  })
  await prisma.auditLog.create({
    data: {
      userId: target.id,
      action: 'REVIEW_AUTO_ASSIGNED',
      entity: 'ReferenceCheck',
      entityId: checkId,
      details: JSON.stringify({ method: 'round_robin', queueDepth: target._count.assignedChecks }),
    },
  })
  return { id: target.id, name: target.name, email: target.email }
}

/**
 * Sendet die Reviewer-Team-Benachrichtigung. Unterstuetzt 1..N Pruefungen
 * (Sammeluebergabe → EINE Mail). Empfaenger: REVIEWER_NOTIFICATION_EMAIL
 * (default hello@candiq.de) UND — falls vorhanden — der per Round-Robin
 * zugewiesene Reviewer (Finding 3).
 */
export async function notifyReviewerHandoff(opts: {
  customer: { id: string; name: string | null; email: string; company: string | null }
  candidateName: string
  checks: ReviewerHandoffCheck[]
  assignedReviewer?: AssignedReviewer | null
}): Promise<void> {
  if (opts.checks.length === 0) return

  const teamRecipients = (process.env.REVIEWER_NOTIFICATION_EMAIL ?? 'hello@candiq.de')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  // Zugewiesenen Reviewer als Empfaenger ergaenzen (dedupe).
  const recipientSet = new Set(teamRecipients)
  if (opts.assignedReviewer?.email) recipientSet.add(opts.assignedReviewer.email)
  const recipients = Array.from(recipientSet)
  if (recipients.length === 0) return

  const tpl = reviewerHandoffNotificationEmail({
    customerName: opts.customer.name ?? opts.customer.email,
    customerCompany: opts.customer.company,
    customerEmail: opts.customer.email,
    candidateName: opts.candidateName,
    checks: opts.checks,
    queueUrl: `${BASE_URL}/reviewer/queue`,
    assignedTo: opts.assignedReviewer?.name ?? null,
  })

  await sendEmail({
    to: recipients,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    category: 'reviewer_handoff',
    userId: opts.customer.id,
  })
}

/**
 * Art. 14 DSGVO: informiert den Referenzgeber, bevor ein Reviewer ihn
 * kontaktiert. Idempotent pro Check (AuditLog-Lookup). Best-effort —
 * Fehler werden geloggt, nicht geworfen.
 */
export async function notifyRefereeArt14(opts: {
  checkId: string
  refereeName: string
  refereeCompany: string
  refereeEmail: string
  candidateName: string
  candidatePosition: string
  hiringCompany: string
  triggeredByUserId: string
}): Promise<void> {
  const existing = await prisma.auditLog.findFirst({
    where: {
      action: 'REFEREE_ART14_NOTIFIED',
      entity: 'ReferenceCheck',
      entityId: opts.checkId,
    },
    select: { id: true },
  })
  if (existing) return

  const tpl = refereeArt14NotificationEmail({
    refereeName: opts.refereeName,
    refereeCompany: opts.refereeCompany,
    candidateName: opts.candidateName,
    candidatePosition: opts.candidatePosition,
    hiringCompany: opts.hiringCompany,
  })

  const result = await sendEmail({
    to: opts.refereeEmail,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    category: 'referee_art14_info',
    userId: opts.triggeredByUserId,
  })
  if (!result.ok) {
    logger.warn('referee_art14_send_failed', { checkId: opts.checkId, error: result.error })
    return
  }

  await prisma.auditLog.create({
    data: {
      userId: opts.triggeredByUserId,
      action: 'REFEREE_ART14_NOTIFIED',
      entity: 'ReferenceCheck',
      entityId: opts.checkId,
      details: JSON.stringify({ refereeEmail: opts.refereeEmail, provider: result.provider }),
    },
  })
}

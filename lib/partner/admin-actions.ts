/**
 * Shared logic für die Admin-Approval-Aktionen auf PartnerAccounts.
 *
 * Wird von den vier /api/admin/partners/[id]/*-Routes verwendet, damit die
 * Status-Transitionen, der Audit-Log-Eintrag und die Mail-Benachrichtigung
 * an einer Stelle leben.
 *
 * Gating (Flag + Admin-Rolle) macht JEDE Route selbst — diese Funktion
 * geht davon aus, dass der Aufrufer bereits authentifiziert + berechtigt ist.
 */

import { prisma } from '@/lib/db'
import {
  sendEmail,
  partnerApprovedEmail,
  partnerRejectedEmail,
  partnerSuspendedEmail,
  partnerReactivatedEmail,
} from '@/lib/email'
import { logger } from '@/lib/logger'

type AdminAction = 'APPROVE' | 'REJECT' | 'SUSPEND' | 'REACTIVATE'

const ALLOWED_TRANSITIONS: Record<AdminAction, { from: string[]; to: string }> = {
  APPROVE:    { from: ['PENDING'],   to: 'APPROVED' },
  REJECT:     { from: ['PENDING'],   to: 'REJECTED' },
  SUSPEND:    { from: ['APPROVED'],  to: 'SUSPENDED' },
  REACTIVATE: { from: ['SUSPENDED'], to: 'APPROVED' },
}

export type ApplyResult =
  | { ok: true; status: string }
  | { ok: false; error: string; httpStatus: number }

export async function applyAdminAction(opts: {
  partnerAccountId: string
  action: AdminAction
  adminUserId: string
  reason?: string
  baseUrl: string
}): Promise<ApplyResult> {
  const transition = ALLOWED_TRANSITIONS[opts.action]

  const partner = await prisma.partnerAccount.findUnique({
    where: { id: opts.partnerAccountId },
    select: {
      id: true, email: true, status: true, deletedAt: true,
      contactFirstName: true, contactLastName: true, company: true,
    },
  })

  if (!partner || partner.deletedAt) {
    return { ok: false, error: 'Partner nicht gefunden.', httpStatus: 404 }
  }

  if (!transition.from.includes(partner.status)) {
    return {
      ok: false,
      error: `Aktion ${opts.action} ist im Status ${partner.status} nicht erlaubt.`,
      httpStatus: 409,
    }
  }

  const now = new Date()
  const nextStatus = transition.to

  // Status + zugehörige Audit-Timestamps in einer Transaction setzen.
  await prisma.$transaction(async (tx) => {
    const updateData: any = { status: nextStatus }
    if (opts.action === 'APPROVE' || opts.action === 'REACTIVATE') {
      updateData.approvedAt = now
      updateData.approvedByUserId = opts.adminUserId
      updateData.suspendedAt = null
      updateData.suspendReason = null
    }
    if (opts.action === 'SUSPEND') {
      updateData.suspendedAt = now
      updateData.suspendReason = opts.reason?.slice(0, 500) || null
    }
    if (opts.action === 'REJECT') {
      updateData.suspendedAt = now
      updateData.suspendReason = opts.reason?.slice(0, 500) || 'Bewerbung abgelehnt'
    }

    await tx.partnerAccount.update({
      where: { id: partner.id },
      data: updateData,
    })

    await tx.partnerAuditLog.create({
      data: {
        partnerAccountId: partner.id,
        action: `PARTNER_${opts.action}`,
        entity: 'PartnerAccount',
        entityId: partner.id,
        details: opts.reason
          ? `by_admin=${opts.adminUserId} reason=${opts.reason.slice(0, 200)}`
          : `by_admin=${opts.adminUserId}`,
      },
    })
  })

  // Mail an den Partner (best-effort)
  notifyPartner({
    action: opts.action,
    partnerEmail: partner.email,
    partnerName: `${partner.contactFirstName} ${partner.contactLastName}`.trim(),
    company: partner.company,
    baseUrl: opts.baseUrl,
    reason: opts.reason,
  }).catch((err) => logger.warn('partner_admin_mail_warn', err))

  return { ok: true, status: nextStatus }
}

/**
 * Versendet die Status-Mail an den Partner nach einer Admin-Aktion.
 * Alle Templates leben in lib/email.ts und nutzen den candiq-shell()
 * (Marken-Header, Karten-Layout, Footer-Hinweis) — keine rohen `<p>`-Mails.
 */
async function notifyPartner(opts: {
  action: AdminAction
  partnerEmail: string
  partnerName: string
  company: string
  baseUrl: string
  reason?: string
}) {
  const loginUrl = `${opts.baseUrl}/partner/login`

  if (opts.action === 'APPROVE') {
    const tpl = partnerApprovedEmail({
      partnerName: opts.partnerName,
      company: opts.company,
      loginUrl,
    })
    await sendEmail({
      to: opts.partnerEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      category: 'partner-approved',
    })
    return
  }

  if (opts.action === 'REJECT') {
    const tpl = partnerRejectedEmail({
      partnerName: opts.partnerName,
      reason: opts.reason,
    })
    await sendEmail({
      to: opts.partnerEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      category: 'partner-rejected',
    })
    return
  }

  if (opts.action === 'SUSPEND') {
    const tpl = partnerSuspendedEmail({
      partnerName: opts.partnerName,
      reason: opts.reason,
    })
    await sendEmail({
      to: opts.partnerEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      category: 'partner-suspended',
    })
    return
  }

  if (opts.action === 'REACTIVATE') {
    const tpl = partnerReactivatedEmail({
      partnerName: opts.partnerName,
      loginUrl,
    })
    await sendEmail({
      to: opts.partnerEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      category: 'partner-reactivated',
    })
    return
  }
}

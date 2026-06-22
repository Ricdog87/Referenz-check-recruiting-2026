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
import { sendEmail } from '@/lib/email'
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

async function notifyPartner(opts: {
  action: AdminAction
  partnerEmail: string
  partnerName: string
  company: string
  baseUrl: string
  reason?: string
}) {
  const loginUrl = `${opts.baseUrl}/partner/login`
  const greeting = opts.partnerName ? `Hallo ${opts.partnerName},` : 'Hallo,'

  if (opts.action === 'APPROVE') {
    await sendEmail({
      to: opts.partnerEmail,
      subject: `Ihre Partner-Bewerbung wurde freigegeben — ${opts.company}`,
      html: `<p>${greeting}</p>
             <p>Ihre Partner-Bewerbung ist freigegeben — willkommen im candiq-Reseller-Programm.</p>
             <p>Sie können sich jetzt einloggen und Mandanten anlegen: <a href="${loginUrl}">${loginUrl}</a></p>
             <p>Wir melden uns separat zum Erstgespräch (EK-Konditionen, Co-Brand-Setup).</p>
             <p>Bis bald,<br>candiq</p>`,
      text: `${greeting}\n\nIhre Partner-Bewerbung ist freigegeben.\nLogin: ${loginUrl}\n\nWir melden uns separat zum Erstgespräch.`,
      category: 'partner-approved',
    })
    return
  }

  if (opts.action === 'REJECT') {
    await sendEmail({
      to: opts.partnerEmail,
      subject: `Ihre Partner-Bewerbung — Rückmeldung`,
      html: `<p>${greeting}</p>
             <p>Vielen Dank für Ihre Bewerbung. Aktuell können wir Sie nicht ins Programm aufnehmen.</p>
             ${opts.reason ? `<p>Begründung: ${escapeHtml(opts.reason)}</p>` : ''}
             <p>Sie können sich später erneut bewerben.</p>
             <p>candiq</p>`,
      text: `${greeting}\n\nVielen Dank für Ihre Bewerbung. Aktuell können wir Sie nicht ins Programm aufnehmen.${opts.reason ? `\n\nBegründung: ${opts.reason}` : ''}\n\ncandiq`,
      category: 'partner-rejected',
    })
    return
  }

  if (opts.action === 'SUSPEND') {
    await sendEmail({
      to: opts.partnerEmail,
      subject: `Ihr Partner-Zugang wurde pausiert`,
      html: `<p>${greeting}</p>
             <p>Ihr Partner-Zugang ist aktuell pausiert.${opts.reason ? ` Begründung: ${escapeHtml(opts.reason)}` : ''}</p>
             <p>Bitte melden Sie sich unter <a href="mailto:partner@candiq.de">partner@candiq.de</a>, falls Sie das klären möchten.</p>
             <p>candiq</p>`,
      text: `${greeting}\n\nIhr Partner-Zugang ist aktuell pausiert.${opts.reason ? `\nBegründung: ${opts.reason}` : ''}\n\npartner@candiq.de`,
      category: 'partner-suspended',
    })
    return
  }

  if (opts.action === 'REACTIVATE') {
    await sendEmail({
      to: opts.partnerEmail,
      subject: `Ihr Partner-Zugang ist wieder aktiv`,
      html: `<p>${greeting}</p>
             <p>Ihr Partner-Zugang ist wieder freigegeben. Login: <a href="${loginUrl}">${loginUrl}</a></p>
             <p>candiq</p>`,
      text: `${greeting}\n\nIhr Partner-Zugang ist wieder freigegeben.\nLogin: ${loginUrl}\n\ncandiq`,
      category: 'partner-reactivated',
    })
    return
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isPartnerProgramEnabled } from '@/lib/flags'
import { getPartnerSession } from '@/lib/partner/session'
import { withPartnerScope } from '@/lib/partner/scope'
import { sendCustomerWelcomeMail } from '@/lib/partner/welcome'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/partner/customers/[id]/resend-welcome
 *
 * Verschickt die Co-Branded Welcome-Mail erneut — der Rettungsweg, wenn
 * die Erst-Mail nicht ankam (Spam, Tippfehler in der Adresse nach
 * Korrektur via PATCH, Provider-Ausfall).
 *
 * Gates:
 *   - Flag + Partner-Session + APPROVED
 *   - withPartnerScope: nur eigene Mandanten
 *   - CHURNED → 400 (kein aktives Onboarding)
 *   - bereits konvertiert → 409 (Link ist verbraucht, Mandant hat schon
 *     ein Konto — erneuter Versand wäre irreführend)
 *   - Rate-Limit 10/h pro Partner (Spam-Schutz Richtung Endkunde)
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isPartnerProgramEnabled()) return new NextResponse('Not Found', { status: 404 })

  const session = await getPartnerSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 401 })
  if (session.status !== 'APPROVED') return NextResponse.json({ error: 'Account not approved' }, { status: 403 })

  const ip = getClientIp(req)
  const rl = rateLimit(`partner-resend:${session.id}`, 10, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Zu viele Versand-Versuche. Bitte in ${Math.ceil(rl.retryAfter / 60)} Minuten erneut.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  const customer = await prisma.partnerCustomer.findFirst({
    where: { ...withPartnerScope(session.id), id: params.id },
    select: {
      id: true, company: true, contactFirstName: true, contactLastName: true,
      contactEmail: true, planKey: true, status: true,
    },
  })
  if (!customer) return NextResponse.json({ error: 'Mandant nicht gefunden.' }, { status: 404 })
  if (customer.status === 'CHURNED') {
    return NextResponse.json({ error: 'Mandant ist gekündigt — kein aktives Onboarding.' }, { status: 400 })
  }

  const converted = await prisma.partnerAuditLog.findFirst({
    where: { entityId: customer.id, action: 'PARTNER_CUSTOMER_CONVERTED' },
    select: { id: true },
  })
  if (converted) {
    return NextResponse.json(
      { error: 'Mandant hat sein Konto bereits aktiviert — die Einladung ist verbraucht.' },
      { status: 409 },
    )
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`
  const { sent } = await sendCustomerWelcomeMail({
    partnerAccountId: session.id,
    partnerCompanyFallback: session.name,
    customer,
    baseUrl,
  })

  await prisma.partnerAuditLog
    .create({
      data: {
        partnerAccountId: session.id,
        action: 'PARTNER_CUSTOMER_RESEND_WELCOME',
        entity: 'PartnerCustomer',
        entityId: customer.id,
        details: `sent=${sent}`,
        ip,
      },
    })
    .catch((err) => logger.warn('partner_resend_audit_warn', err))

  if (!sent) {
    return NextResponse.json(
      { error: 'Mail konnte nicht versendet werden. Bitte später erneut versuchen oder den Einladungslink direkt kopieren.' },
      { status: 502 },
    )
  }
  return NextResponse.json({ ok: true })
}

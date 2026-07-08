/**
 * Versand der Co-Branded Welcome-Mail an einen End-Mandanten.
 *
 * Gemeinsamer Pfad für:
 *   - POST /api/partner/customers            (Erstanlage)
 *   - POST /api/partner/customers/[id]/resend-welcome  (erneuter Versand)
 *
 * Der Aufrufer MUSS das Ergebnis awaiten (Vercel-Lambda-Freeze) und ist
 * für Auth/Scope-Gates verantwortlich. sendEmail wirft nie — Rückgabe
 * ist { sent: boolean }.
 */

import 'server-only'
import { prisma } from '@/lib/db'
import { sendEmail, partnerCustomerWelcomeEmail } from '@/lib/email'
import { getPlanById } from '@/lib/utils'
import { logger } from '@/lib/logger'

export function buildSignupUrl(baseUrl: string, customerId: string, planKey: string): string {
  // plan= ist nur UI-Hint für die sofortige Anzeige; die autoritative
  // Plan-Zuweisung macht /api/auth/register über den via-Lookup in der DB.
  return `${baseUrl}/register?via=${customerId}&plan=${encodeURIComponent(planKey)}`
}

export async function sendCustomerWelcomeMail(opts: {
  partnerAccountId: string
  partnerCompanyFallback: string
  customer: {
    id: string
    company: string
    contactFirstName: string
    contactLastName: string
    contactEmail: string
    planKey: string
  }
  baseUrl: string
}): Promise<{ sent: boolean }> {
  try {
    const partnerRecord = await prisma.partnerAccount.findUnique({
      where: { id: opts.partnerAccountId },
      select: { company: true, logoUrl: true },
    })

    const plan = getPlanById(opts.customer.planKey)
    const tpl = partnerCustomerWelcomeEmail({
      partnerName: partnerRecord?.company || opts.partnerCompanyFallback || 'Ihr Partner',
      partnerLogoUrl: partnerRecord?.logoUrl ?? null,
      customerContactName:
        `${opts.customer.contactFirstName} ${opts.customer.contactLastName}`.trim(),
      customerCompany: opts.customer.company,
      planName: plan?.name ?? opts.customer.planKey,
      signupUrl: buildSignupUrl(opts.baseUrl, opts.customer.id, opts.customer.planKey),
    })

    const result = await sendEmail({
      to: opts.customer.contactEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      category: 'partner-customer-welcome',
    })
    if (!result.ok) logger.error('partner_customer_welcome_failed', result)
    return { sent: result.ok }
  } catch (err) {
    logger.error('partner_customer_welcome_error', err)
    return { sent: false }
  }
}

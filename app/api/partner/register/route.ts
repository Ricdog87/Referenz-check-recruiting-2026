import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sendEmail, partnerApplicationAdminNotificationEmail } from '@/lib/email'
import { isPartnerProgramEnabled } from '@/lib/flags'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MAX_NAME_LEN = 120
const MAX_COMPANY_LEN = 160
const MAX_EMAIL_LEN = 254
const MAX_PHONE_LEN = 40
const MAX_PASSWORD_LEN = 128
const MIN_PASSWORD_LEN = 10 // strenger als HR-Flow (Partner sind Multi-Mandant-Operator)

const CONSENT_VERSION = '1.0'

/**
 * POST /api/partner/register
 *
 * Legt einen PartnerAccount mit status='PENDING' an. Approval ist
 * Admin-Aufgabe (siehe Phase 3c).
 *
 * Best-effort Audit + Admin-Notification — beide dürfen den Request
 * nicht blocken.
 *
 * Flag-Gate: PARTNER_PROGRAM_ENABLED=false → 404.
 */
export async function POST(req: NextRequest) {
  if (!isPartnerProgramEnabled()) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const ip = getClientIp(req)
  const rl = rateLimit(`partner-register:${ip}`, 3, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Zu viele Bewerbungen. Bitte in ${Math.ceil(rl.retryAfter / 60)} Minuten erneut versuchen.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const {
    contactFirstName, contactLastName, company, phone, email, password,
    acceptTerms, acceptPrivacy, acceptCoBranding,
  } = body ?? {}

  const cleanFirstName = String(contactFirstName ?? '').trim().slice(0, MAX_NAME_LEN)
  const cleanLastName  = String(contactLastName ?? '').trim().slice(0, MAX_NAME_LEN)
  const cleanCompany   = String(company ?? '').trim().slice(0, MAX_COMPANY_LEN)
  const cleanPhone     = String(phone ?? '').trim().slice(0, MAX_PHONE_LEN) || null
  const cleanEmail     = String(email ?? '').trim().toLowerCase().slice(0, MAX_EMAIL_LEN)
  const rawPassword    = typeof password === 'string' ? password : ''

  if (!cleanFirstName || !cleanLastName || !cleanCompany || !cleanEmail || !rawPassword) {
    return NextResponse.json({ error: 'Bitte füllen Sie alle Pflichtfelder aus.' }, { status: 400 })
  }
  if (!EMAIL_REGEX.test(cleanEmail)) {
    return NextResponse.json({ error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' }, { status: 400 })
  }
  if (rawPassword.length < MIN_PASSWORD_LEN) {
    return NextResponse.json({ error: `Passwort muss mindestens ${MIN_PASSWORD_LEN} Zeichen haben.` }, { status: 400 })
  }
  if (rawPassword.length > MAX_PASSWORD_LEN) {
    return NextResponse.json({ error: `Passwort darf maximal ${MAX_PASSWORD_LEN} Zeichen haben.` }, { status: 400 })
  }
  if (acceptTerms !== true) {
    return NextResponse.json({ error: 'Bitte akzeptieren Sie die AGB.', field: 'acceptTerms' }, { status: 400 })
  }
  if (acceptPrivacy !== true) {
    return NextResponse.json({ error: 'Bitte bestätigen Sie die Datenschutzerklärung.', field: 'acceptPrivacy' }, { status: 400 })
  }
  if (acceptCoBranding !== true) {
    return NextResponse.json(
      { error: 'Bitte bestätigen Sie, dass das candiq-Siegel auf Reports sichtbar bleibt.', field: 'acceptCoBranding' },
      { status: 400 },
    )
  }

  try {
    const existing = await prisma.partnerAccount.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Für diese E-Mail existiert bereits eine Bewerbung. Falls Sie Ihr Passwort vergessen haben: /partner/forgot-password.' },
        { status: 409 },
      )
    }

    const passwordHash = await bcrypt.hash(rawPassword, 12)

    const partner = await prisma.partnerAccount.create({
      data: {
        email: cleanEmail,
        passwordHash,
        contactFirstName: cleanFirstName,
        contactLastName: cleanLastName,
        company: cleanCompany,
        phone: cleanPhone,
        status: 'PENDING',
        tier: 'REGISTERED',
        consentVersion: CONSENT_VERSION,
      },
      select: { id: true, email: true, company: true },
    })

    // Audit: best-effort, niemals den Request blocken
    prisma.partnerAuditLog
      .create({
        data: {
          partnerAccountId: partner.id,
          action: 'PARTNER_REGISTER',
          entity: 'PartnerAccount',
          entityId: partner.id,
          details: `consent_version=${CONSENT_VERSION} company=${cleanCompany.slice(0, 60)}`,
          ip,
        },
      })
      .catch((err) => logger.warn('partner_register_audit_warn', err))

    // Admin-Notification: an LEAD_ALERT_EMAIL (Default: r.serrano@…)
    // Nutzt das candiq-branded Template aus lib/email.ts (shell() Layout).
    const adminEmail = process.env.LEAD_ALERT_EMAIL || 'r.serrano@recruiting-sg.de'
    const baseUrl = process.env.NEXTAUTH_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`
    const adminTpl = partnerApplicationAdminNotificationEmail({
      company: cleanCompany,
      contactFirstName: cleanFirstName,
      contactLastName: cleanLastName,
      email: cleanEmail,
      phone: cleanPhone,
      approvalUrl: `${baseUrl}/admin/partners`,
    })
    // AWAITED: fire-and-forget geht auf Vercel nach dem Response-Return
    // verloren — dann bleibt eine Bewerbung unbemerkt liegen. sendEmail
    // wirft nie; ein Versand-Fehler failt die Bewerbung nicht.
    await sendEmail({
      to: adminEmail,
      subject: adminTpl.subject,
      html: adminTpl.html,
      text: adminTpl.text,
      category: 'partner-application-admin',
    }).catch((err) => logger.error('partner_admin_notify_error', err))

    return NextResponse.json({ id: partner.id, status: 'PENDING' }, { status: 201 })
  } catch (error) {
    logger.error('partner_register_error', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Für diese E-Mail existiert bereits eine Bewerbung.' },
          { status: 409 },
        )
      }
    }

    return NextResponse.json(
      { error: 'Bewerbung konnte nicht gespeichert werden. Bitte in einem Moment erneut versuchen.' },
      { status: 500 },
    )
  }
}

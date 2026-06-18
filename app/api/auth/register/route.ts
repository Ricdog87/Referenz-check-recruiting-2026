import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { ensureSchema, withDbRecovery } from '@/lib/db-init'
import { sendEmail, welcomeEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const VALID_ACCOUNT_TYPES = ['HR_DEPARTMENT']
const VALID_PLANS = ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE']

// RFC 5322-light pragmatic regex — good enough for trial signups
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const MAX_NAME_LEN = 120
const MAX_COMPANY_LEN = 160
const MAX_EMAIL_LEN = 254
const MAX_PASSWORD_LEN = 128
const MIN_PASSWORD_LEN = 8

// Aktuell gültige Versionen der jeweiligen Rechtsdokumente. Bei Änderung der
// Texte muss hier hochgezogen werden, damit revisionssicher nachweisbar bleibt,
// welche Fassung der User beim Signup akzeptiert hat (DSGVO Art. 7 Abs. 1).
const TERMS_VERSION = '1.0'
const PRIVACY_VERSION = '1.0'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Zu viele Registrierungsversuche. Bitte in ${Math.ceil(rl.retryAfter / 60)} Minuten erneut versuchen.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const { name, company, email, password, acceptTerms, acceptPrivacy, accountType, plan } = body ?? {}
  const cleanName = String(name ?? '').trim().slice(0, MAX_NAME_LEN)
  const cleanCompany = String(company ?? '').trim().slice(0, MAX_COMPANY_LEN)
  const cleanEmail = String(email ?? '').trim().toLowerCase().slice(0, MAX_EMAIL_LEN)
  const rawPassword = typeof password === 'string' ? password : ''

  // PDL-Registrierung: standardmäßig GESCHLOSSEN — PDL-Pakete sind in
  // Vorbereitung und werden später über den dedizierten Sales-Flow
  // freigegeben. Falls geöffnet werden soll, in Vercel-Env explizit:
  // PDL_REGISTRATION_OPEN=true setzen.
  const pdlOpen = (process.env.PDL_REGISTRATION_OPEN ?? 'false').toLowerCase() === 'true'
  if (accountType === 'RECRUITMENT_AGENCY' && !pdlOpen) {
    return NextResponse.json(
      { error: 'PDL-Konten sind aktuell in der Closed Beta. Bitte nutzen Sie die Warteliste unter /waitlist-agency.' },
      { status: 403 }
    )
  }

  const cleanAccountType = VALID_ACCOUNT_TYPES.includes(accountType) ? accountType : 'HR_DEPARTMENT'
  const cleanPlan = VALID_PLANS.includes(plan) ? plan : 'STARTER'

  if (!cleanName || !cleanCompany || !cleanEmail || !rawPassword) {
    return NextResponse.json({ error: 'Bitte füllen Sie alle Felder aus.' }, { status: 400 })
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
  // DSGVO Art. 7 + Planet49: AGB und Datenschutz dürfen nicht gebuendelt
  // akzeptiert werden. Beide Felder werden hier einzeln und mit klarer
  // Fehlermeldung geprüft.
  if (acceptTerms !== true) {
    return NextResponse.json(
      { error: 'Bitte akzeptieren Sie die AGB.', field: 'acceptTerms' },
      { status: 400 },
    )
  }
  if (acceptPrivacy !== true) {
    return NextResponse.json(
      { error: 'Bitte bestätigen Sie, dass Sie die Datenschutzerklärung gelesen haben.', field: 'acceptPrivacy' },
      { status: 400 },
    )
  }

  try {
    await ensureSchema()

    const existing = await withDbRecovery(() =>
      prisma.user.findFirst({
        where: { email: { equals: cleanEmail, mode: 'insensitive' } },
        select: { id: true },
      }),
    )
    if (existing) {
      return NextResponse.json({ error: 'Diese E-Mail-Adresse ist bereits registriert.' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(rawPassword, 12)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? ''

    const user = await withDbRecovery(() =>
      prisma.user.create({
        data: {
          name: cleanName,
          company: cleanCompany,
          email: cleanEmail,
          password: hashed,
          accountType: cleanAccountType,
          plan: cleanPlan,
          trialEndsAt,
          // Zwei getrennte Consent-Records, einer pro Rechtsdokument-Version.
          // Bei einer Änderung von AGB oder Datenschutz wird beim nächsten
          // Touchpoint die neue Version erneut angefragt — Audit-Trail bleibt.
          gdprConsents: {
            create: [
              {
                type: `TERMS_ACCEPT_v${TERMS_VERSION}`,
                granted: true,
                ip,
                userAgent,
              },
              {
                type: `PRIVACY_NOTICE_v${PRIVACY_VERSION}`,
                granted: true,
                ip,
                userAgent,
              },
            ],
          },
        },
        select: { id: true, email: true },
      }),
    )

    // Audit-Log ist „nice to have" — Registrierung darf nicht daran scheitern.
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'REGISTRATION',
          entity: 'User',
          entityId: user.id,
          details: `Konto erstellt · Plan: ${cleanPlan} · Trial bis ${trialEndsAt.toISOString().slice(0, 10)}`,
          ip,
        },
      })
      // Separater Eintrag: revisionssicher dokumentieren, welche Versionen
      // der Rechtsdokumente bei diesem Signup akzeptiert wurden.
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'REGISTRATION_CONSENT',
          entity: 'User',
          entityId: user.id,
          details: `terms_version=${TERMS_VERSION} privacy_version=${PRIVACY_VERSION}`,
          ip,
        },
      })
    } catch (auditErr) {
      console.error('register_audit_warn', auditErr)
    }

    // Welcome-Mail (graceful: scheitert nicht den Request, wenn Provider fehlt).
    //
    // WICHTIG: `to` ist die validierte Input-Adresse (`cleanEmail`), nicht
    // `user.email` aus dem DB-Round-Trip. Damit kann ein case-insensitiver
    // Lookup oder ein abweichender DB-Wert NIE die Empfängeradresse
    // beeinflussen — Empfänger ist immer die Adresse, die der Nutzer
    // gerade eingegeben hat.
    const baseUrl = process.env.NEXTAUTH_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`
    const tpl = welcomeEmail({ name: cleanName, email: cleanEmail, loginUrl: `${baseUrl}/login` })
    // await statt fire-and-forget: Fehler landen im Log und sind in Vercel sichtbar.
    // Mail-Fehler crashen den Register-Flow NICHT (try/catch).
    try {
      const emailResult = await sendEmail({
        to: cleanEmail,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        userId: user.id,
        category: 'welcome',
      })
      if (!emailResult.ok) {
        logger.warn('welcome_email_failed', { error: emailResult.error, to: cleanEmail })
      }
    } catch (err) {
      logger.warn('welcome_email_exception', { error: (err as any)?.message, to: cleanEmail })
    }

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
  } catch (error) {
    console.error('register_error', {
      code: (error as any)?.code,
      name: (error as any)?.name,
      message: (error as any)?.message,
    })

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Diese E-Mail-Adresse ist bereits registriert.' }, { status: 409 })
      }
      if (error.code === 'P1001' || error.code === 'P1002' || error.code === 'P1017') {
        return NextResponse.json(
          { error: 'Datenbank aktuell nicht erreichbar. Bitte in 1–2 Minuten erneut versuchen.' },
          { status: 503 }
        )
      }
      if (error.code === 'P2021' || error.code === 'P2022') {
        return NextResponse.json(
          { error: 'Datenbank-Setup wird gerade abgeschlossen. Bitte in einem Moment erneut versuchen.' },
          { status: 503 }
        )
      }
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { error: 'Datenbankverbindung konnte nicht hergestellt werden. Bitte später erneut versuchen.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Registrierung fehlgeschlagen. Bitte in einem Moment erneut versuchen oder hello@candiq.de kontaktieren.' },
      { status: 500 }
    )
  }
}

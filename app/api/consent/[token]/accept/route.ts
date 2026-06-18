import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { loadConsentByToken } from '@/lib/consent-token'
import { sendEmail, consentAcceptedNotifyHrEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { releaseAllCvsForCandidate } from '@/lib/cv-gate'

const MAX_REFEREES = 5
const MAX_NAME = 120
const MAX_EMAIL = 254
const MAX_PHONE = 40

type RefereeInput = {
  firstName?: string
  lastName?: string
  company?: string
  position?: string
  email?: string
  phone?: string
  relationship?: string
  startDate?: string
  endDate?: string
}

function clean(s: unknown, max: number): string {
  return String(s ?? '').trim().slice(0, max)
}

/**
 * POST /api/consent/:token/accept
 * Bewerber bestätigt Einwilligung + nennt Referenzgeber.
 * Idempotent: doppelter Call gibt 409.
 */
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'

  // Rate-Limit: 5 Versuche/Min pro IP
  const rl = rateLimit(`consent:${ip}`, 5, 60_000)
  if (!rl.ok) {
    return NextResponse.json({ error: 'Zu viele Versuche. Bitte später erneut.' }, { status: 429 })
  }

  let record: Awaited<ReturnType<typeof loadConsentByToken>>
  try {
    record = await loadConsentByToken(decodeURIComponent(params.token))
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Token ungültig.' }, { status: 410 })
  }

  // HR-User-Details für Notification-Mail laden
  const hrUser = await prisma.user.findFirst({
    where: { candidates: { some: { id: record.candidateId } } },
    select: { id: true, name: true, email: true },
  })

  if (record.status === 'ACCEPTED') {
    return NextResponse.json({ error: 'Einwilligung wurde bereits erteilt.' }, { status: 409 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  // Pflicht: explizite Einwilligungs-Checkbox
  if (!body.consentGiven) {
    return NextResponse.json(
      { error: 'Bitte bestätigen Sie die Einwilligung explizit.' },
      { status: 400 }
    )
  }

  // Referenzgeber-Liste validieren
  const refereesRaw = Array.isArray(body.referees) ? body.referees : []
  if (refereesRaw.length === 0) {
    return NextResponse.json(
      { error: 'Bitte nennen Sie mindestens einen Referenzgeber.' },
      { status: 400 }
    )
  }
  if (refereesRaw.length > MAX_REFEREES) {
    return NextResponse.json(
      { error: `Maximal ${MAX_REFEREES} Referenzgeber.` },
      { status: 400 }
    )
  }

  const referees = refereesRaw.map((r: RefereeInput) => ({
    firstName: clean(r.firstName, MAX_NAME),
    lastName: clean(r.lastName, MAX_NAME),
    company: clean(r.company, MAX_NAME),
    position: clean(r.position, MAX_NAME),
    email: clean(r.email, MAX_EMAIL).toLowerCase(),
    phone: clean(r.phone, MAX_PHONE),
    relationship: clean(r.relationship, MAX_NAME),
    startDate: clean(r.startDate, 16),
    endDate: clean(r.endDate, 16),
  }))

  // Mindest-Validierung pro Referenz
  for (const r of referees) {
    if (!r.firstName || !r.lastName || !r.company) {
      return NextResponse.json(
        { error: 'Jeder Referenzgeber braucht mindestens Vor-/Nachname und Firma.' },
        { status: 400 }
      )
    }
    if (!r.email && !r.phone) {
      return NextResponse.json(
        { error: 'Jeder Referenzgeber braucht E-Mail oder Telefon.' },
        { status: 400 }
      )
    }
  }

  const ua = req.headers.get('user-agent')?.slice(0, 500) ?? null

  await prisma.$transaction(async (tx) => {
    await tx.consentToken.update({
      where: { id: record.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        ipAccepted: ip,
        uaAccepted: ua,
        refereesJson: JSON.stringify(referees),
      },
    })

    // Candidate auf "Einwilligung erteilt" setzen
    await tx.candidate.update({
      where: { id: record.candidateId },
      data: {
        gdprConsent: true,
        gdprConsentDate: new Date(),
        gdprConsentIp: ip,
        status: 'CONSENT_GIVEN',
      },
    })

    // Referenzgeber als ReferenceCheck-Records anlegen (Status OPEN)
    for (const r of referees) {
      await tx.referenceCheck.create({
        data: {
          candidateId: record.candidateId,
          employerName: r.company,
          employerContact: `${r.firstName} ${r.lastName}`.trim(),
          employerEmail: r.email || null,
          employerPhone: r.phone || null,
          position: r.position || null,
          startDate: r.startDate || null,
          endDate: r.endDate || null,
          status: 'OPEN',
        },
      })
    }

    // CV-Consent-Gate: alle aktuell AWAITING_CONSENT-CVs dieses Kandidaten
    // werden in derselben Transaktion auf RELEASED gehoben — erst jetzt
    // dürfen Reviewer den Inhalt abrufen.
    const releaseRes = await releaseAllCvsForCandidate(record.candidateId, tx)

    await tx.auditLog.create({
      data: {
        userId: null,
        action: 'CONSENT_ACCEPTED',
        entity: 'ConsentToken',
        entityId: record.id,
        ip,
        details: `candidate=${record.candidateId} refereesCount=${referees.length} cvsReleased=${releaseRes.released} version=${record.consentVersion} ua=${ua?.slice(0, 100) || 'unknown'}`,
      },
    })
  })

  logger.info('consent_accepted', { candidateId: record.candidateId, refereesCount: referees.length })

  // HR-Notification per E-Mail (fire-and-forget, blockt User-Response nicht)
  if (hrUser?.email) {
    const candidate = await prisma.candidate.findUnique({
      where: { id: record.candidateId },
      select: { firstName: true, lastName: true, position: true },
    })
    if (candidate) {
      const baseUrl = process.env.NEXTAUTH_URL || 'https://candiq.de'
      const mail = consentAcceptedNotifyHrEmail({
        hrFullName: hrUser.name || hrUser.email || '',
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        position: candidate.position,
        refereesCount: referees.length,
        candidateUrl: `${baseUrl}/candidates/${record.candidateId}`,
      })
      try {
        const r = await sendEmail({
          to: hrUser.email,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
          userId: hrUser.id,
          category: 'consent_hr_notify',
        })
        if (!r.ok) logger.error('hr_notify_accepted_failed', { error: r.error })
        else logger.info('hr_notify_accepted_sent', { provider: r.provider })
      } catch (e) {
        logger.error('hr_notify_accepted_exception', e)
      }
    }
  }

  return NextResponse.json({ ok: true, refereesCount: referees.length })
}

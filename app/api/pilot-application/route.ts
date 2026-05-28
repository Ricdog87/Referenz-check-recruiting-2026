import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { upsertContact, addContactToList } from '@/lib/hubspot'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_PILOT_SLOTS = parseInt(process.env.PILOT_PROGRAM_MAX_SLOTS ?? '10', 10)

/**
 * Bewerbung fuers candiq Pilot-Programm Q3/2026.
 *
 * Body: { company, firstName, lastName, email, hiresPerYear }
 *
 * - Rate-Limit pro IP: max 3 pro Stunde (Spam-Schutz)
 * - Validierung: alle Felder Pflicht, E-Mail-Format
 * - Pruefung: wenn schon MAX_PILOT_SLOTS ACCEPTED-Eintraege → 409 (Programm voll)
 * - Speichert PilotApplication mit Status PENDING
 * - Schreibt AuditLog (entity=PilotApplication)
 * - Sendet 2 E-Mails (Bestaetigung an Bewerber + Notification an Sales)
 */
export async function POST(req: NextRequest) {
  // IP fuer Rate-Limit + Auditing
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  const ua = req.headers.get('user-agent') ?? null

  const rl = rateLimit(`pilot:${ip}`, 3, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen. Bitte spaeter erneut versuchen.' },
      { status: 429 },
    )
  }

  let body: {
    company?: string
    firstName?: string
    lastName?: string
    email?: string
    hiresPerYear?: string
    consent?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungueltige Anfrage' }, { status: 400 })
  }

  const company = body.company?.trim() ?? ''
  const firstName = body.firstName?.trim() ?? ''
  const lastName = body.lastName?.trim() ?? ''
  const email = body.email?.trim().toLowerCase() ?? ''
  const hiresPerYear = body.hiresPerYear?.trim() ?? ''
  const consent = body.consent === true

  if (!company || !firstName || !lastName || !email || !hiresPerYear) {
    return NextResponse.json(
      { error: 'Bitte alle Pflichtfelder ausfuellen.' },
      { status: 400 },
    )
  }
  if (!consent) {
    return NextResponse.json(
      { error: 'Bitte Einwilligung zur Datenverarbeitung erteilen.' },
      { status: 400 },
    )
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Ungueltige E-Mail-Adresse.' }, { status: 400 })
  }

  // Programm-Slots pruefen (ACCEPTED, nicht PENDING — Pending zaehlt nicht)
  const accepted = await prisma.pilotApplication.count({ where: { status: 'ACCEPTED' } })
  if (accepted >= MAX_PILOT_SLOTS) {
    return NextResponse.json(
      {
        error:
          'Das Pilot-Programm Q3/2026 ist bereits voll. Wir tragen Sie gerne auf die Wartelist ein — schreiben Sie kurz an hello@candiq.de.',
      },
      { status: 409 },
    )
  }

  // Doppel-Submit-Schutz: gleiche E-Mail in den letzten 24h?
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const existing = await prisma.pilotApplication.findFirst({
    where: { email, createdAt: { gte: since } },
    select: { id: true },
  })
  if (existing) {
    return NextResponse.json({
      success: true,
      message:
        'Ihre Bewerbung liegt uns bereits vor. Wir melden uns innerhalb von 2 Werktagen.',
      duplicate: true,
    })
  }

  try {
    const application = await prisma.pilotApplication.create({
      data: {
        company,
        firstName,
        lastName,
        email,
        hiresPerYear,
        status: 'PENDING',
        ip: ip === 'unknown' ? null : ip,
        userAgent: ua,
      },
    })

    await prisma.auditLog.create({
      data: {
        action: 'PILOT_APPLIED',
        entity: 'PilotApplication',
        entityId: application.id,
        details: `company=${company} email=${email} hires=${hiresPerYear}`,
        ip: ip === 'unknown' ? null : ip,
      },
    })

    // HubSpot CRM-Sync — best-effort, nicht blockierend.
    try {
      const sync = await upsertContact({
        email,
        firstname: firstName,
        lastname: lastName,
        company,
        lifecyclestage: 'lead',
        // Sammel-Feld 'message' — Standard-Property, immer vorhanden.
        // Form-Kontext landet hier sodass Sales sofort sieht woher der Lead kommt.
        message: `[candiq Pilot 2026] Bewerbung über candiq.de · Hires/Jahr: ${hiresPerYear} · Firma: ${company} · IP: ${ip === 'unknown' ? '-' : ip}`,
      })
      if (sync.ok && process.env.HUBSPOT_PILOT_LIST_ID) {
        await addContactToList(sync.contactId, process.env.HUBSPOT_PILOT_LIST_ID)
      }
      if (!sync.ok) {
        console.warn('pilot_hubspot_sync_failed', { reason: sync.reason })
      }
    } catch (hsErr: any) {
      console.error('pilot_hubspot_sync_error', { message: hsErr?.message })
    }

    // E-Mails best-effort — Fehler nicht propagieren
    try {
      const { sendEmail } = await import('@/lib/email')
      await sendEmail({
        to: email,
        subject: 'Ihre Bewerbung fuer das candiq Pilot-Programm Q3/2026',
        html: `<p>Hallo ${firstName},</p>
<p>vielen Dank fuer Ihre Bewerbung fuer das candiq Pilot-Programm Q3/2026.</p>
<p>Wir pruefen Ihre Anmeldung und melden uns innerhalb von 2 Werktagen mit den naechsten Schritten — typischerweise ein 30-Min-Kennenlern-Termin und die Discount-Bestaetigung.</p>
<p>Bei Rueckfragen: einfach auf diese Mail antworten oder an <a href="mailto:hello@candiq.de">hello@candiq.de</a> schreiben.</p>
<p>Bis gleich,<br/>candiq</p>`,
      })
      await sendEmail({
        to: 'hello@candiq.de',
        subject: `[Pilot 2026] Neue Bewerbung: ${company} (${hiresPerYear})`,
        html: `<p>Neue Pilot-Bewerbung eingegangen:</p>
<ul>
  <li><strong>Firma:</strong> ${company}</li>
  <li><strong>Kontakt:</strong> ${firstName} ${lastName}</li>
  <li><strong>E-Mail:</strong> <a href="mailto:${email}">${email}</a></li>
  <li><strong>Geplante Hires pro Jahr:</strong> ${hiresPerYear}</li>
  <li><strong>IP:</strong> ${ip}</li>
  <li><strong>Aktuell akzeptiert:</strong> ${accepted} von ${MAX_PILOT_SLOTS}</li>
</ul>
<p>Anwendung pruefen im Admin-Bereich (sobald gebaut) oder direkt in Supabase.</p>`,
      })
    } catch (mailErr: any) {
      console.error('pilot_application_mail_error', { message: mailErr?.message })
    }

    return NextResponse.json({
      success: true,
      message: 'Vielen Dank — wir melden uns innerhalb von 2 Werktagen.',
    })
  } catch (err: any) {
    console.error('pilot_application_create_error', { message: err?.message })
    return NextResponse.json(
      { error: 'Bewerbung konnte nicht gespeichert werden. Bitte spaeter erneut versuchen.' },
      { status: 500 },
    )
  }
}

/**
 * Public-Counter — die Section liest das vor dem Render, damit
 * die UI "X von 10" anzeigen kann ohne Auth.
 */
export async function GET() {
  const accepted = await prisma.pilotApplication.count({ where: { status: 'ACCEPTED' } })
  const totalPending = await prisma.pilotApplication.count({ where: { status: 'PENDING' } })
  return NextResponse.json({
    maxSlots: MAX_PILOT_SLOTS,
    accepted,
    pending: totalPending,
    isClosed: accepted >= MAX_PILOT_SLOTS,
  })
}

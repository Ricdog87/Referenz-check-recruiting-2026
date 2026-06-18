import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { upsertContact } from '@/lib/hubspot'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/candidate-waitlist — Bewerber-Self-Service Phase-1 Waitlist
 *
 * Erfasst Interesse von Bewerber:innen, die candiq selbst nutzen wollen,
 * um ihre Bewerbungen vorab zu verifizieren (Schufa-Analogon für
 * Recruiting). Phase 1 ist reines Interesse-Capture — kein Account,
 * kein Dashboard, kein Auth. Der echte Bewerber-Self-Service-Flow folgt
 * in Phase 2-4.
 *
 * Storage-Reuse: Wir schreiben in `LeadMagnetRequest` mit dem fixen
 * `slug = 'candidate-self-service'`. Damit nullen wir das Schema-Risiko,
 * der bestehende DSGVO-Auto-Löschungs-Cron (180 Tage) greift, und der
 * HubSpot-Sync läuft über den bekannten Pfad mit eigenem source-Tag.
 *
 * Body: { firstName, email, position?, consent, newsletter? }
 * - firstName + email + consent: Pflicht
 * - position: optional (Job-Titel/-Bereich des Bewerbers)
 * - newsletter: optional (Double-Opt-In im nächsten Schritt — für
 *   Phase 1 bewusst noch nicht versendet, nur Intent gespeichert)
 *
 * Rate-Limit: 5/h pro IP (haerter als Lead-Magnet — Form ist nur EIN
 * Mal pro Person sinnvoll).
 */

const WAITLIST_SLUG = 'candidate-self-service'

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  const ua = req.headers.get('user-agent') ?? null

  const rl = rateLimit(`candidate-waitlist:${ip}`, 5, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen. Bitte später erneut versuchen.' },
      { status: 429 },
    )
  }

  let body: {
    firstName?: string
    email?: string
    position?: string
    consent?: boolean
    newsletter?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
  }

  const firstName = body.firstName?.trim() ?? ''
  const email = body.email?.trim().toLowerCase() ?? ''
  const position = body.position?.trim() || null
  const consent = body.consent === true
  const newsletter = body.newsletter === true

  if (!firstName || !email) {
    return NextResponse.json({ error: 'Bitte Vorname und E-Mail angeben.' }, { status: 400 })
  }
  if (!consent) {
    return NextResponse.json(
      { error: 'Bitte Einwilligung zur Datenverarbeitung erteilen.' },
      { status: 400 },
    )
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Ungültige E-Mail-Adresse.' }, { status: 400 })
  }

  try {
    const record = await prisma.leadMagnetRequest.create({
      data: {
        slug: WAITLIST_SLUG,
        firstName,
        email,
        // `position` koennen wir in das company-Feld kippen — wir nutzen
        // den Slot zweckentfremdet, weil sich das Modell nicht ändern
        // soll. Phase-2-Migration trennt das sauber.
        company: position,
        consent,
        newsletter,
        ip: ip === 'unknown' ? null : ip,
        userAgent: ua,
      },
    })

    await prisma.auditLog.create({
      data: {
        action: 'CANDIDATE_WAITLIST_SIGNUP',
        entity: 'LeadMagnetRequest',
        entityId: record.id,
        details: `email=${email} position=${position ?? '—'} newsletter=${newsletter}`,
        ip: ip === 'unknown' ? null : ip,
      },
    })

    // HubSpot CRM-Sync (best-effort, nicht blockierend) — unterscheidbar
    // von HR-Leads über candiq_source = candidate_self_service_waitlist.
    try {
      const sync = await upsertContact({
        email,
        firstname: firstName,
        // company-Slot für position (s.o.) — für HubSpot mappen wir
        // das als jobtitle, nicht company.
        jobtitle: position ?? undefined,
        lifecyclestage: 'subscriber',
        message: `[candiq Bewerber-Waitlist] Bewerber:in interessiert an Self-Service Verifizierung · Position: ${position ?? '—'} · Newsletter: ${newsletter ? 'ja' : 'nein'}`,
        candiq_source: 'candidate_self_service_waitlist',
        candiq_newsletter_opt_in: newsletter ? 'true' : 'false',
      })
      if (!sync.ok) {
        console.warn('candidate_waitlist_hubspot_sync_failed', { reason: sync.reason })
      }
    } catch (hsErr: any) {
      console.error('candidate_waitlist_hubspot_sync_error', { message: hsErr?.message })
    }

    // Best-effort-Mails (nicht blockierend) im candiq-Layout: Bestätigung an Bewerber:in + Info an uns.
    try {
      const { sendEmail, candidateWaitlistConfirmEmail, candidateWaitlistNotifyEmail } = await import('@/lib/email')
      const confirm = candidateWaitlistConfirmEmail({ firstName, newsletter })
      await sendEmail({ to: email, category: 'candidate_waitlist_confirm', subject: confirm.subject, html: confirm.html, text: confirm.text })
      const notify = candidateWaitlistNotifyEmail({ firstName, email, position, newsletter })
      await sendEmail({ to: 'hello@candiq.de', category: 'candidate_waitlist_notify', subject: notify.subject, html: notify.html, text: notify.text })
    } catch (mailErr: any) {
      console.error('candidate_waitlist_mail_error', { message: mailErr?.message })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('candidate_waitlist_error', { message: err?.message })
    return NextResponse.json({ error: 'Speicherung fehlgeschlagen.' }, { status: 500 })
  }
}

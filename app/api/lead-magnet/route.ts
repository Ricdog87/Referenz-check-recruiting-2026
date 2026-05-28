import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { getLeadMagnet } from '@/content/resources/data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/lead-magnet — Lead-Magnet-Anforderung
 *
 * Body: { slug, title, firstName, email, company?, consent, newsletter? }
 *
 * - Validierung + Rate-Limit (3/IP/h)
 * - Speichert LeadMagnetRequest (DSGVO Art. 6 Abs. 1 lit. a, dokumentiert)
 * - Schreibt AuditLog LEAD_MAGNET_REQUESTED
 * - Sendet Bestaetigungs-E-Mail mit Link auf die Resource
 * - Newsletter ist Double-Opt-In: optionale Bestaetigungs-Mail mit
 *   eigenem Link (separater Schritt, hier nur Speicherung der Absicht)
 */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  const ua = req.headers.get('user-agent') ?? null

  const rl = rateLimit(`leadmagnet:${ip}`, 3, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen. Bitte spaeter erneut versuchen.' },
      { status: 429 },
    )
  }

  let body: {
    slug?: string
    title?: string
    firstName?: string
    email?: string
    company?: string
    consent?: boolean
    newsletter?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungueltige Anfrage' }, { status: 400 })
  }

  const slug = body.slug?.trim() ?? ''
  const firstName = body.firstName?.trim() ?? ''
  const email = body.email?.trim().toLowerCase() ?? ''
  const company = body.company?.trim() ?? null
  const consent = body.consent === true
  const newsletter = body.newsletter === true

  if (!slug || !firstName || !email) {
    return NextResponse.json({ error: 'Bitte Pflichtfelder ausfuellen.' }, { status: 400 })
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

  const magnet = getLeadMagnet(slug)
  if (!magnet) {
    return NextResponse.json({ error: 'Unbekannte Ressource.' }, { status: 400 })
  }

  try {
    const record = await prisma.leadMagnetRequest.create({
      data: {
        slug,
        firstName,
        email,
        company,
        consent,
        newsletter,
        ip: ip === 'unknown' ? null : ip,
        userAgent: ua,
      },
    })

    await prisma.auditLog.create({
      data: {
        action: 'LEAD_MAGNET_REQUESTED',
        entity: 'LeadMagnetRequest',
        entityId: record.id,
        details: `slug=${slug} email=${email} newsletter=${newsletter}`,
        ip: ip === 'unknown' ? null : ip,
      },
    })

    // Best-effort-Mail mit dem Link zur Resource
    try {
      const { sendEmail } = await import('@/lib/email')
      const baseUrl = process.env.NEXTAUTH_URL ?? 'https://candiq.de'
      const url = `${baseUrl}/resources/${slug}`
      await sendEmail({
        to: email,
        subject: `Ihr Link: ${magnet.title}`,
        html: `<p>Hallo ${firstName},</p>
<p>vielen Dank fuer Ihr Interesse — hier der Link zu <strong>${magnet.title}</strong>:</p>
<p><a href="${url}">${url}</a></p>
<p>Im Browser koennen Sie den Inhalt direkt als PDF speichern (Browser-Druckdialog &rarr; Ziel: PDF).</p>
${newsletter ? `<hr/><p>Sie haben den candiq Praxis-Newsletter mit angefordert. Wir senden Ihnen in Kuerze eine separate <strong>Bestaetigungs-Mail (Double-Opt-In)</strong>. Erst nach Klick auf den Link in dieser Mail werden Sie zum Newsletter hinzugefuegt.</p>` : ''}
<p>Bei Rueckfragen: <a href="mailto:hello@candiq.de">hello@candiq.de</a>.</p>
<p>Beste Gruesse,<br/>candiq</p>`,
      })
    } catch (mailErr: any) {
      console.error('lead_magnet_mail_error', { message: mailErr?.message })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('lead_magnet_error', { message: err?.message })
    return NextResponse.json({ error: 'Speicherung fehlgeschlagen.' }, { status: 500 })
  }
}

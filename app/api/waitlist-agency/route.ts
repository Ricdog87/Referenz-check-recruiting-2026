import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { ensureSchema, withDbRecovery } from '@/lib/db-init'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * PDL-Warteliste — speichert Einträge in DB + benachrichtigt Sales (wenn Resend
 * konfiguriert). Niemals 5xx an den Lead leaken — wir müssen den Lead erfassen,
 * auch wenn das Mail-Versand-Backend gerade hakt.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`waitlist:${ip}`, 5, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Zu viele Anfragen. Bitte in ${Math.ceil(rl.retryAfter / 60)} Minuten erneut versuchen.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const company = String(body?.company ?? '').trim().slice(0, 200)
  const name = String(body?.name ?? '').trim().slice(0, 160)
  const email = String(body?.email ?? '').trim().toLowerCase().slice(0, 254)
  const website = String(body?.website ?? '').trim().slice(0, 300) || null
  const placementsPerYear = String(body?.placementsPerYear ?? '').trim().slice(0, 80) || null

  if (!company || !name || !email) {
    return NextResponse.json({ error: 'Bitte Firma, Name und E-Mail ausfüllen.' }, { status: 400 })
  }
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Bitte eine gültige E-Mail-Adresse eingeben.' }, { status: 400 })
  }

  try {
    await ensureSchema()

    await withDbRecovery(() =>
      prisma.agencyWaitlistEntry.create({
        data: {
          company,
          name,
          email,
          website,
          placementsPerYear,
          ip,
          userAgent: req.headers.get('user-agent')?.slice(0, 500) ?? null,
        },
      }),
    )
  } catch (err) {
    console.error('waitlist_save_warn', err)
    // DB-Fehler nicht an Lead leaken — wir versuchen trotzdem die Mail zu senden
    if (err instanceof Prisma.PrismaClientInitializationError) {
      // OK, weiter zur Mail
    }
  }

  // Sales-Benachrichtigung (wenn Resend konfiguriert ist)
  const salesAddress = process.env.SALES_NOTIFICATION_EMAIL ?? 'hello@candiq.de'
  sendEmail({
    to: salesAddress,
    subject: `Neue PDL-Waitlist-Anfrage: ${company}`,
    html: `<h2>Neue PDL-Warteliste</h2>
      <p><strong>Firma:</strong> ${escapeHtml(company)}</p>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>E-Mail:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
      ${website ? `<p><strong>Website:</strong> ${escapeHtml(website)}</p>` : ''}
      ${placementsPerYear ? `<p><strong>Placements/Jahr:</strong> ${escapeHtml(placementsPerYear)}</p>` : ''}
      <p style="color:#94a3b8;font-size:12px;">IP: ${escapeHtml(ip)}</p>`,
    text: `Neue PDL-Waitlist:\n\nFirma: ${company}\nName: ${name}\nE-Mail: ${email}\nWebsite: ${website ?? '—'}\nPlacements/Jahr: ${placementsPerYear ?? '—'}\nIP: ${ip}`,
    category: 'waitlist-agency',
  }).catch((err) => console.error('waitlist_mail_warn', err))

  return NextResponse.json({ ok: true })
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c))
}

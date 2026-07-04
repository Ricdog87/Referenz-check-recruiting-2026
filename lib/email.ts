import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

/**
 * Lightweight transactional-email service mit graceful Fallback.
 *
 * - Wenn `RESEND_API_KEY` gesetzt ist → Mail wird über Resend (https://resend.com) versendet.
 * - Wenn nicht → wir loggen den Versand in `AuditLog` (entity: 'Email') und auf die Konsole.
 *   So bleibt das SaaS in Test/Dev funktionsfähig, ohne externe Provider.
 *
 * Direkter HTTP-Call statt Resend-SDK: vermeidet zusätzliche Dependencies.
 */

export type EmailMessage = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  /** Optional: Audit-Log-Verknüpfung (User, Entity-Referenz) */
  userId?: string
  category?: string
}

const FROM_DEFAULT = process.env.EMAIL_FROM ?? 'candiq <hello@candiq.de>'
const REPLY_TO = process.env.EMAIL_REPLY_TO ?? 'hello@candiq.de'

export type SendResult =
  | { ok: true; provider: 'resend'; id: string }
  | { ok: true; provider: 'log'; id: null }
  | { ok: false; error: string }

export async function sendEmail(msg: EmailMessage): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY

  // ── 1. Provider verfügbar → echter Versand ─────────────────────
  if (apiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_DEFAULT,
          to: Array.isArray(msg.to) ? msg.to : [msg.to],
          subject: msg.subject,
          html: msg.html,
          text: msg.text ?? stripHtml(msg.html),
          reply_to: REPLY_TO,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const errMsg = data?.message ?? `HTTP ${res.status}`
        logger.error('email_resend_error', { message: errMsg, status: res.status })
        await logEmailEvent(msg, `FAILED_RESEND: ${errMsg}`).catch(() => {})
        return { ok: false, error: errMsg }
      }

      await logEmailEvent(msg, `SENT_RESEND id=${data?.id ?? 'unknown'}`).catch(() => {})
      return { ok: true, provider: 'resend', id: data?.id ?? 'unknown' }
    } catch (err: any) {
      logger.error('email_resend_exception', err)
      await logEmailEvent(msg, `FAILED_RESEND_EXCEPTION: ${err?.message ?? 'unknown'}`).catch(() => {})
      return { ok: false, error: err?.message ?? 'unknown' }
    }
  }

  // ── 2. Kein Provider → in AuditLog vermerken ───────────────────
  logger.warn('email_no_provider', {
    to: Array.isArray(msg.to) ? msg.to.join(', ') : msg.to,
    subject: msg.subject,
  })
  await logEmailEvent(msg, 'LOG_ONLY (kein RESEND_API_KEY gesetzt)').catch(() => {})
  return { ok: true, provider: 'log', id: null }
}

async function logEmailEvent(msg: EmailMessage, status: string) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: msg.userId ?? null,
        action: 'EMAIL_SEND',
        entity: 'Email',
        entityId: null,
        details: [
          `category=${msg.category ?? 'transactional'}`,
          `to=${Array.isArray(msg.to) ? msg.to.join(',') : msg.to}`,
          `subject=${msg.subject}`,
          status,
        ].join(' · '),
      },
    })
  } catch (err) {
    logger.warn('email_audit_warn', err)
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// ─────────────────────────────────────────────────────────────────
// Templates (inline, ohne Templating-Engine — kleine, lesbare Mails)
// ─────────────────────────────────────────────────────────────────

const BASE_STYLES = `
  body { margin: 0; padding: 0; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; }
  .wrap { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
  .card { background: #fff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; }
  h1 { font-size: 22px; margin: 0 0 12px; color: #0f172a; }
  p { font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 12px; }
  .btn { display: inline-block; padding: 12px 22px; background: linear-gradient(135deg,#4f46e5,#8b5cf6); color: #fff !important; border-radius: 9999px; font-weight: 700; font-size: 14px; text-decoration: none; }
  .meta { font-size: 12px; color: #94a3b8; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
  .logo { font-weight: 900; font-size: 20px; color: #4f46e5; letter-spacing: -0.5px; margin-bottom: 24px; }
`.trim()

function shell(content: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_STYLES}</style></head><body><div class="wrap"><div class="logo">candiq</div><div class="card">${content}<div class="meta">Diese E-Mail wurde automatisch versendet. Antworten Sie an <a href="mailto:${REPLY_TO}">${REPLY_TO}</a>.</div></div></div></body></html>`
}

// Professionelle Anrede mit vollem Namen — neutral ohne Geschlecht-Annahme.
// „Sehr geehrte/r {Voller Name}," ist die deutsche Business-Etikette wenn
// das Geschlecht nicht zuverlaessig bekannt ist. Fallback: nur „Sehr geehrte
// Damen und Herren," falls Name leer.
function salutation(fullName: string | null | undefined): string {
  const name = (fullName ?? '').trim()
  if (!name) return 'Sehr geehrte Damen und Herren'
  return `Sehr geehrte/r ${name}`
}

export function welcomeEmail(opts: { name: string; email: string; loginUrl: string }): { subject: string; html: string; text: string } {
  const html = shell(`
    <h1>Willkommen bei candiq</h1>
    <p>${salutation(opts.name)},</p>
    <p>Ihr candiq-Account ist bereit. Sie können jetzt Kandidaten anlegen, Referenzprüfungen starten und den gesamten DSGVO-konformen Recruiting-Workflow nutzen.</p>
    <p style="margin: 24px 0;"><a class="btn" href="${opts.loginUrl}">Zum Dashboard</a></p>
    <p><strong>Erste Schritte:</strong></p>
    <p>1. Ersten Kandidaten anlegen<br>2. Referenzprüfung starten<br>3. PDF-Report exportieren</p>
    <p>Fragen? Antworten Sie einfach auf diese E-Mail — wir helfen gern.</p>
  `)
  const text = `Willkommen bei candiq\n\n${salutation(opts.name)},\n\nIhr candiq-Account ist bereit: ${opts.loginUrl}\n\nFragen? Antworten Sie einfach auf diese E-Mail.`
  return { subject: 'Willkommen bei candiq — Ihr Account ist bereit', html, text }
}

export function passwordResetEmail(opts: { name: string; resetUrl: string; expiresInMinutes: number }): { subject: string; html: string; text: string } {
  const html = shell(`
    <h1>Passwort zurücksetzen</h1>
    <p>${salutation(opts.name)},</p>
    <p>wir haben eine Anfrage erhalten, das Passwort für Ihr candiq-Konto zurückzusetzen. Klicken Sie auf den Button, um ein neues Passwort zu wählen:</p>
    <p style="margin: 24px 0;"><a class="btn" href="${opts.resetUrl}">Neues Passwort festlegen</a></p>
    <p>Der Link ist <strong>${opts.expiresInMinutes} Minuten</strong> gültig. Wenn Sie keinen Reset angefordert haben, können Sie diese E-Mail einfach ignorieren — Ihr Passwort bleibt unverändert.</p>
    <p style="font-size: 12px; color: #94a3b8;">Sicherheitshinweis: Geben Sie diesen Link niemals an Dritte weiter.</p>
  `)
  const text = `Passwort zurücksetzen\n\n${salutation(opts.name)},\n\nLink (${opts.expiresInMinutes} Min. gültig): ${opts.resetUrl}\n\nWenn Sie keinen Reset angefordert haben, ignorieren Sie diese E-Mail.`
  return { subject: 'candiq — Passwort zurücksetzen', html, text }
}

export function checkCompletedEmail(opts: { name: string; candidateName: string; employerName: string; result: string; checkUrl: string }): { subject: string; html: string; text: string } {
  const resultLabels: Record<string, string> = {
    VERIFIED: 'verifiziert ✓',
    DISCREPANCY_FOUND: 'Unstimmigkeit gefunden ⚠',
    UNREACHABLE: 'nicht erreichbar',
    DECLINED: 'Auskunft verweigert',
  }
  const resultLabel = resultLabels[opts.result] ?? opts.result
  const html = shell(`
    <h1>Referenzprüfung abgeschlossen</h1>
    <p>${salutation(opts.name)},</p>
    <p>die Prüfung für <strong>${escapeHtml(opts.candidateName)}</strong> bei <strong>${escapeHtml(opts.employerName)}</strong> ist abgeschlossen.</p>
    <p>Ergebnis: <strong>${escapeHtml(resultLabel)}</strong></p>
    <p style="margin: 24px 0;"><a class="btn" href="${opts.checkUrl}">Report ansehen</a></p>
  `)
  const text = `Referenzprüfung abgeschlossen — ${opts.candidateName} bei ${opts.employerName}\n\n${salutation(opts.name)},\n\nErgebnis: ${resultLabel}\n${opts.checkUrl}`
  return { subject: `candiq — Prüfung abgeschlossen: ${opts.candidateName}`, html, text }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c))
}

// ─────────────────────────────────────────────────────────────────
// Bewerber-Einladung zum Self-Service-Consent-Portal
// ─────────────────────────────────────────────────────────────────
export function candidateConsentInviteEmail(opts: {
  /** Voller Name (Vor- + Nachname) — für professionelle Anrede. */
  candidateFullName: string
  hiringCompany: string
  position: string
  portalUrl: string
  expiresInDays: number
}): { subject: string; html: string; text: string } {
  const html = shell(`
    <h1>Einwilligung zur Referenzprüfung</h1>
    <p>${salutation(opts.candidateFullName)},</p>
    <p><strong>${escapeHtml(opts.hiringCompany)}</strong> möchte für Ihre Bewerbung als <strong>${escapeHtml(opts.position)}</strong> eine professionelle Referenzprüfung durchführen.</p>
    <p>Bei candiq haben <strong>Sie die volle Kontrolle</strong>: Sie sehen vor jeder Prüfung, welche Daten verarbeitet werden, Sie nennen selbst die Referenzgeber, die kontaktiert werden dürfen, und Sie können Ihre Einwilligung jederzeit widerrufen.</p>
    <p style="margin: 24px 0;"><a class="btn" href="${opts.portalUrl}">Einwilligungs-Portal öffnen</a></p>
    <p>Der Link ist <strong>${opts.expiresInDays} Tage</strong> gültig und ausschließlich für Sie bestimmt.</p>
    <p style="font-size: 13px; color: #475569; margin-top: 24px;"><strong>Datenschutz auf einen Blick:</strong></p>
    <p style="font-size: 13px; color: #475569;">
      • Rechtsgrundlage: Ihre Einwilligung gem. Art. 6 Abs. 1 lit. a DSGVO<br>
      • Speicherdauer: max. 6 Monate nach Abschluss des Bewerbungsverfahrens<br>
      • Server in Deutschland · Übertragung TLS-verschlüsselt<br>
      • Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Widerruf jederzeit
    </p>
    <p style="font-size: 12px; color: #94a3b8;">Falls Sie sich nicht beworben haben oder die Anfrage nicht erkennen, können Sie diese E-Mail einfach ignorieren — es passiert dann nichts.</p>
  `)
  const text = `Einwilligung zur Referenzprüfung

${salutation(opts.candidateFullName)},

${opts.hiringCompany} möchte für Ihre Bewerbung als ${opts.position} eine professionelle Referenzprüfung durchführen.

Sie haben die volle Kontrolle: Sie nennen selbst die Referenzgeber und können Ihre Einwilligung jederzeit widerrufen.

Portal öffnen (${opts.expiresInDays} Tage gültig):
${opts.portalUrl}

Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO · Server in Deutschland · Auto-Löschung nach 6 Monaten

Falls Sie sich nicht beworben haben, ignorieren Sie diese E-Mail.`
  return { subject: `Einwilligung zur Referenzprüfung — ${opts.hiringCompany}`, html, text }
}

// ─────────────────────────────────────────────────────────────────
// HR-Notification: Bewerber hat Einwilligung erteilt
// ─────────────────────────────────────────────────────────────────
export function consentAcceptedNotifyHrEmail(opts: {
  /** Voller HR-Name (Vor- + Nachname) — für professionelle Anrede. */
  hrFullName: string
  candidateName: string
  position: string
  refereesCount: number
  candidateUrl: string
}): { subject: string; html: string; text: string } {
  const html = shell(`
    <h1>Einwilligung erhalten ✓</h1>
    <p>${salutation(opts.hrFullName)},</p>
    <p><strong>${escapeHtml(opts.candidateName)}</strong> (${escapeHtml(opts.position)}) hat die Einwilligung zur Referenzprüfung erteilt und <strong>${opts.refereesCount} Referenzgeber</strong> freigegeben.</p>
    <p>Sie können jetzt die Prüfung starten — die Reviewer kontaktieren ausschließlich die vom Bewerber genannten Personen.</p>
    <p style="margin: 24px 0;"><a class="btn" href="${opts.candidateUrl}">Kandidat öffnen</a></p>
    <p style="font-size: 12px; color: #94a3b8;">Audit-Trail dokumentiert: Zeitpunkt, IP, User-Agent und akzeptierte Datenschutzversion.</p>
  `)
  const text = `Einwilligung erhalten ✓

${salutation(opts.hrFullName)},

${opts.candidateName} (${opts.position}) hat eingewilligt und ${opts.refereesCount} ${opts.refereesCount === 1 ? 'Referenz' : 'Referenzen'} freigegeben.

Jetzt Prüfung starten: ${opts.candidateUrl}`
  return {
    subject: `candiq — ${opts.candidateName}: Einwilligung erteilt (${opts.refereesCount} ${opts.refereesCount === 1 ? 'Referenz' : 'Referenzen'})`,
    html,
    text,
  }
}

// ─────────────────────────────────────────────────────────────────
// HR-Notification: Bewerber hat Einwilligung widerrufen
// ─────────────────────────────────────────────────────────────────
export function consentRevokedNotifyHrEmail(opts: {
  /** Voller HR-Name (Vor- + Nachname) — für professionelle Anrede. */
  hrFullName: string
  candidateName: string
  position: string
  candidateUrl: string
}): { subject: string; html: string; text: string } {
  const html = shell(`
    <h1>⚠️ Einwilligung widerrufen</h1>
    <p>${salutation(opts.hrFullName)},</p>
    <p><strong>${escapeHtml(opts.candidateName)}</strong> (${escapeHtml(opts.position)}) hat die zuvor erteilte Einwilligung zur Referenzprüfung widerrufen (Art. 7 Abs. 3 DSGVO).</p>
    <p>Alle offenen Referenzprüfungen wurden automatisch gestoppt. Bitte informieren Sie das Recruiting-Team.</p>
    <p style="margin: 24px 0;"><a class="btn" href="${opts.candidateUrl}">Kandidat öffnen</a></p>
  `)
  const text = `Einwilligung widerrufen — ${opts.candidateName} (${opts.position})

${salutation(opts.hrFullName)},

${opts.candidateName} hat die zuvor erteilte Einwilligung zur Referenzprüfung widerrufen (Art. 7 Abs. 3 DSGVO). Alle offenen Prüfungen wurden gestoppt.

${opts.candidateUrl}`
  return { subject: `candiq — ${opts.candidateName}: Einwilligung widerrufen`, html, text }
}


// ─────────────────────────────────────────────────────────────────
// Reviewer-Team-Notification: Kunde hat einen Check an Reviewer übergeben
// Triggert auf PATCH /api/checks/:id mit status=IN_REVIEW.
// Empfänger: REVIEWER_NOTIFICATION_EMAIL (default hello@candiq.de).
// ─────────────────────────────────────────────────────────────────
export type ReviewerHandoffCheck = {
  candidatePosition: string
  employerName: string
  employerContact: string
  employerPhone?: string | null
  employerEmail?: string | null
  reviewerCheckUrl: string
}

/**
 * Reviewer-Team-Benachrichtigung bei Übergabe. Unterstützt 1..N Prüfungen
 * (Sammelübergabe): bei N>1 wird EINE Mail mit allen Referenzen gesendet
 * statt N Einzel-Mails. Optional `assignedTo` (Name des per Round-Robin
 * zugewiesenen Reviewers) wird im Betreff + Body hervorgehoben.
 */
export function reviewerHandoffNotificationEmail(opts: {
  customerName: string
  customerCompany: string | null
  customerEmail: string
  candidateName: string
  checks: ReviewerHandoffCheck[]
  queueUrl: string
  assignedTo?: string | null
}): { subject: string; html: string; text: string } {
  const companyLine = opts.customerCompany
    ? `${escapeHtml(opts.customerCompany)} · ${escapeHtml(opts.customerEmail)}`
    : escapeHtml(opts.customerEmail)
  const n = opts.checks.length
  const multiple = n > 1

  const checkBlocks = opts.checks
    .map((c, i) => {
      const contactExtras = [
        c.employerPhone ? `Tel: ${escapeHtml(c.employerPhone)}` : null,
        c.employerEmail ? `Mail: ${escapeHtml(c.employerEmail)}` : null,
      ]
        .filter(Boolean)
        .join(' · ')
      return `
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:8px;">
          <div style="font-size:11px;color:#94a3b8;">Referenz ${i + 1} von ${n} · ${escapeHtml(c.candidatePosition)}</div>
          <div style="font-weight:700;margin-top:2px;">${escapeHtml(c.employerName)} &mdash; ${escapeHtml(c.employerContact)}</div>
          ${contactExtras ? `<div style="font-size:13px;color:#475569;">${contactExtras}</div>` : ''}
          <div style="margin-top:8px;"><a href="${c.reviewerCheckUrl}" style="color:#4f46e5;font-weight:600;font-size:13px;">Prüfung öffnen &rarr;</a></div>
        </div>`
    })
    .join('')

  const assignedLine = opts.assignedTo
    ? `<p style="margin-top:0;font-size:13px;color:#475569;"><strong>Zugewiesen an:</strong> ${escapeHtml(opts.assignedTo)}</p>`
    : ''

  const html = shell(`
    <h1>${multiple ? `${n} neue Prüfungen` : 'Neue Prüfung'} in der Reviewer-Queue</h1>
    <p>Ein Kunde hat ${multiple ? `${n} Referenzprüfungen` : 'eine Referenzprüfung'} an euch übergeben. Bearbeitung idealerweise innerhalb <strong>24 Stunden</strong>.</p>
    <p style="font-size:13px;color:#475569;margin-top:18px;"><strong>Kunde</strong></p>
    <p style="margin-top:0;">${escapeHtml(opts.customerName)}<br>${companyLine}</p>
    <p style="font-size:13px;color:#475569;margin-top:18px;"><strong>Kandidat</strong></p>
    <p style="margin-top:0;">${escapeHtml(opts.candidateName)}</p>
    ${assignedLine}
    <p style="font-size:13px;color:#475569;margin-top:18px;"><strong>${multiple ? 'Referenzen' : 'Referenz'}</strong></p>
    ${checkBlocks}
    <p style="font-size:12px;color:#94a3b8;margin-top:16px;">Alle offenen Prüfungen: <a href="${opts.queueUrl}">${opts.queueUrl}</a></p>
  `)

  const textChecks = opts.checks
    .map((c, i) => `  ${i + 1}. ${c.employerName} — ${c.employerContact} (${c.candidatePosition})\n     ${c.reviewerCheckUrl}`)
    .join('\n')
  const text = `${multiple ? `${n} neue Prüfungen` : 'Neue Prüfung'} in der Reviewer-Queue\n\nKunde: ${opts.customerName} (${opts.customerCompany ?? opts.customerEmail})\nKandidat: ${opts.candidateName}${opts.assignedTo ? `\nZugewiesen an: ${opts.assignedTo}` : ''}\n\n${multiple ? 'Referenzen:' : 'Referenz:'}\n${textChecks}\n\nQueue: ${opts.queueUrl}\nSLA-Ziel: 24h.`

  return {
    subject: multiple
      ? `Reviewer-Queue: ${n} Prüfungen — ${opts.candidateName} (${opts.customerCompany ?? opts.customerName})`
      : `Reviewer-Queue: ${opts.candidateName} (${opts.customerCompany ?? opts.customerName})`,
    html,
    text,
  }
}

// ─────────────────────────────────────────────────────────────────
// Bewerber-Self-Service Waitlist (Phase 1) — candiq-Layout via shell()
// ─────────────────────────────────────────────────────────────────
export function candidateWaitlistConfirmEmail(opts: {
  firstName: string
  newsletter?: boolean
}): { subject: string; html: string; text: string } {
  const name = escapeHtml(opts.firstName)
  const html = shell(`
    <h1>Du stehst auf der Warteliste \u2713</h1>
    <p>Hallo ${name},</p>
    <p>danke f\u00fcr dein Interesse \u2014 du bist auf der Warteliste f\u00fcr die <strong>candiq-Bewerber-Plattform</strong> (Closed Beta, geplant Q4 2026). Wir starten klein und sauber mit den ersten 100 Bewerber:innen.</p>
    <p>Was dich erwartet: Du l\u00e4sst deine Stationen und Referenzen vorab pr\u00fcfen und teilst einen candiq-verifizierten Link mit jeder Bewerbung \u2014 wie eine SCHUFA-Auskunft f\u00fcr deinen Lebenslauf, nur f\u00fcrs Recruiting.</p>
    <p>Kein Spam. Wir melden uns nur zum Launch.${opts.newsletter ? ' Den Praxis-Newsletter (max. 1\u00d7/Monat) hast du mit angefordert \u2014 Abmeldung jederzeit per 1-Klick.' : ''}</p>
  `)
  const text = `Du stehst auf der candiq-Warteliste.\n\nHallo ${opts.firstName}, danke f\u00fcr dein Interesse \u2014 du bist auf der Warteliste f\u00fcr die candiq-Bewerber-Plattform (Closed Beta, geplant Q4 2026). Kein Spam, wir melden uns nur zum Launch.`
  return { subject: 'Du stehst auf der candiq-Warteliste', html, text }
}

export function candidateWaitlistNotifyEmail(opts: {
  firstName: string
  email: string
  position?: string | null
  newsletter?: boolean
}): { subject: string; html: string; text: string } {
  const html = shell(`
    <h1>Neue Bewerber-Waitlist-Anmeldung</h1>
    <p>Neue Anmeldung auf der Bewerber-Warteliste (<strong>/bewerber</strong>):</p>
    <p>
      <strong>Name:</strong> ${escapeHtml(opts.firstName)}<br>
      <strong>E-Mail:</strong> ${escapeHtml(opts.email)}<br>
      <strong>Position/Branche:</strong> ${escapeHtml(opts.position ?? '\u2014')}<br>
      <strong>Newsletter:</strong> ${opts.newsletter ? 'ja' : 'nein'}
    </p>
    <p style="font-size:13px;color:#475569;">Gespeichert in der DB (LeadMagnetRequest, slug=candidate-self-service) und an HubSpot gesynct.</p>
  `)
  const text = `Neue Bewerber-Waitlist-Anmeldung\nName: ${opts.firstName}\nE-Mail: ${opts.email}\nPosition: ${opts.position ?? '\u2014'}\nNewsletter: ${opts.newsletter ? 'ja' : 'nein'}`
  return { subject: `Neue Bewerber-Waitlist-Anmeldung: ${opts.firstName}`, html, text }
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Art. 14 DSGVO \u2014 Info-Mail an Referenzgeber
// Pflicht-Info, weil candiq personenbezogene Daten des Referenzgebers
// nicht direkt von ihm erhebt (sondern vom Bewerber), bevor wir ihn
// kontaktieren. Wird beim Statuswechsel zu IN_REVIEW automatisch
// versendet, sofern eine E-Mail-Adresse hinterlegt ist.
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
export function refereeArt14NotificationEmail(opts: {
  refereeName: string
  refereeCompany: string
  candidateName: string
  candidatePosition: string
  hiringCompany: string
  optOutUrl?: string
}): { subject: string; html: string; text: string } {
  const html = shell(`
    <h1>Information nach Art. 14 DSGVO</h1>
    <p>Guten Tag ${escapeHtml(opts.refereeName)},</p>
    <p>
      <strong>${escapeHtml(opts.candidateName)}</strong> hat Sie als Referenz f\u00fcr eine
      Bewerbung als <strong>${escapeHtml(opts.candidatePosition)}</strong> bei
      <strong>${escapeHtml(opts.hiringCompany)}</strong> benannt und uns gebeten, mit Ihnen
      Kontakt aufzunehmen. In den kommenden Tagen meldet sich ein geschulter candiq-Reviewer
      kurz telefonisch oder schriftlich bei Ihnen.
    </p>

    <p style="font-size:13px;color:#475569;margin-top:18px;"><strong>Wer wir sind</strong></p>
    <p style="margin-top:0;font-size:13px;color:#475569;">
      candiq ist eine DSGVO-konforme Plattform f\u00fcr professionelle Referenzpr\u00fcfungen,
      betrieben von der RSG Recruiting Solutions Group GmbH, Am Heiligenhaus 9, 65207
      Wiesbaden. Wir handeln im Auftrag von <strong>${escapeHtml(opts.hiringCompany)}</strong>
      (Verantwortlicher i.S.d. Art. 4 Nr. 7 DSGVO).
    </p>

    <p style="font-size:13px;color:#475569;margin-top:18px;"><strong>Mensch oder Bot?</strong></p>
    <p style="margin-top:0;font-size:13px;color:#475569;">
      Das Gespr\u00e4ch f\u00fchrt <strong>immer ein Mensch</strong> \u2014 ein geschulter candiq-Reviewer.
      KI-Werkzeuge nutzen wir ausschlie\u00dflich intern zur Dokumentation Ihrer Antworten und
      zum Abgleich mit dem Lebenslauf des Bewerbers, niemals f\u00fcr den Anruf selbst.
    </p>

    <p style="font-size:13px;color:#475569;margin-top:18px;"><strong>Welche Daten wir verarbeiten</strong></p>
    <p style="margin-top:0;font-size:13px;color:#475569;">
      Name, ggf. Unternehmen (<strong>${escapeHtml(opts.refereeCompany)}</strong>), Funktion
      und Kontaktdaten \u2014 vom Bewerber freiwillig angegeben. Plus Ihre Antworten zu Position,
      Besch\u00e4ftigungszeitraum und Aufgaben des Bewerbers. Wir fragen ausschlie\u00dflich nachpr\u00fcfbare
      Fakten ab \u2014 keine gesch\u00fctzten Merkmale (Herkunft, Religion, Gesundheit etc.), AGG-konform.
    </p>

    <p style="font-size:13px;color:#475569;margin-top:18px;"><strong>Zweck und Rechtsgrundlage</strong></p>
    <p style="margin-top:0;font-size:13px;color:#475569;">
      Verifizierung der Bewerberangaben im Recruiting-Prozess. Rechtsgrundlage: berechtigte
      Interessen (Art. 6 Abs. 1 lit. f DSGVO) des potenziellen Arbeitgebers. Ihre Antwort
      ist freiwillig.
    </p>

    <p style="font-size:13px;color:#475569;margin-top:18px;"><strong>Ihre Rechte</strong></p>
    <p style="margin-top:0;font-size:13px;color:#475569;">
      Auskunft (Art. 15), Berichtigung (Art. 16), L\u00f6schung (Art. 17), Einschr\u00e4nkung (Art. 18),
      Widerspruch (Art. 21). Auto-L\u00f6schung Ihrer Antworten sp\u00e4testens 6 Monate nach Abschluss
      des Bewerbungsverfahrens. Beschwerderecht bei der zust\u00e4ndigen Aufsichtsbeh\u00f6rde.
    </p>

    <p style="font-size:13px;color:#475569;margin-top:18px;"><strong>Kein Kontakt erw\u00fcnscht?</strong></p>
    <p style="margin-top:0;font-size:13px;color:#475569;">
      Antworten Sie einfach kurz auf diese Mail mit &bdquo;Bitte nicht kontaktieren&ldquo;
      \u2014 wir l\u00f6schen Ihre Daten dann unverz\u00fcglich und der Bewerber wird gebeten, eine
      andere Referenz zu nennen.
    </p>

    <p style="font-size:12px;color:#94a3b8;margin-top:18px;">
      Datenschutzerkl\u00e4rung: <a href="https://candiq.de/datenschutz">candiq.de/datenschutz</a> \u00b7
      Auftragsverarbeitungsvertrag: <a href="https://candiq.de/avv">candiq.de/avv</a> \u00b7
      Verantwortlicher i.S.d. DSGVO ist <strong>${escapeHtml(opts.hiringCompany)}</strong>.
    </p>
  `)

  const text = `Information nach Art. 14 DSGVO

Guten Tag ${opts.refereeName},

${opts.candidateName} hat Sie als Referenz f\u00fcr eine Bewerbung als ${opts.candidatePosition} bei ${opts.hiringCompany} benannt. In den kommenden Tagen meldet sich ein geschulter candiq-Reviewer kurz bei Ihnen.

MENSCH ODER BOT?
Das Gespr\u00e4ch f\u00fchrt immer ein Mensch (geschulter candiq-Reviewer). KI-Werkzeuge nutzen wir nur intern zur Dokumentation und zum Abgleich mit dem CV, niemals f\u00fcr den Anruf selbst.

WIR HANDELN IM AUFTRAG von ${opts.hiringCompany} (Verantwortlicher). Verarbeitete Daten: Name, Unternehmen (${opts.refereeCompany}), Funktion, Kontaktdaten \u2014 vom Bewerber freiwillig genannt. Wir fragen ausschlie\u00dflich nachpr\u00fcfbare Fakten ab (AGG-konform).

RECHTSGRUNDLAGE: Art. 6 Abs. 1 lit. f DSGVO. Auto-L\u00f6schung nach max. 6 Monaten.

KEIN KONTAKT ERW\u00dcNSCHT? Antworten Sie auf diese Mail mit "Bitte nicht kontaktieren" \u2014 wir l\u00f6schen dann unverz\u00fcglich.

Datenschutzerkl\u00e4rung: https://candiq.de/datenschutz
AVV: https://candiq.de/avv`

  return {
    subject: `${opts.candidateName} hat Sie als Referenz benannt \u2014 Info nach Art. 14 DSGVO`,
    html,
    text,
  }
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Partner-Programm: Co-Branded End-Mandanten-Welcome
//
// Headline: Partner-Logo (oder Partner-Name) PROMINENT \u2014 candiq-Siegel
// im Footer als Vertrauens-Anker (Co-Brand-Pflicht aus README, getestet
// in partner-landing-gating.test.ts).
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

function partnerShell(opts: {
  content: string
  partnerName: string
  partnerLogoUrl: string | null
}): string {
  const header = opts.partnerLogoUrl
    ? `<img src="${opts.partnerLogoUrl}" alt="${escapeAttr(opts.partnerName)}" style="max-height:40px;max-width:160px;display:block;margin:0 0 24px;">`
    : `<div class="logo" style="color:#0f172a">${escapeText(opts.partnerName)}</div>`
  // candiq-Siegel \u2014 UNENTFERNBAR per Co-Brand-Vertrag
  const seal = `<div style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;">verifiziert durch <strong style="color:#4f46e5">candiq</strong></div>`
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_STYLES}</style></head><body><div class="wrap"><div class="card">${header}${opts.content}${seal}<div class="meta">Diese E-Mail wurde im Auftrag von ${escapeText(opts.partnerName)} \u00fcber candiq versendet.</div></div></div></body></html>`
}

function escapeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function escapeAttr(s: string): string {
  return escapeText(s).replace(/"/g, '&quot;')
}

export function partnerCustomerWelcomeEmail(opts: {
  partnerName: string
  partnerLogoUrl: string | null
  customerContactName: string
  customerCompany: string
  planName: string
  signupUrl: string
}): { subject: string; html: string; text: string } {
  const greeting = opts.customerContactName.trim() ? `Hallo ${escapeText(opts.customerContactName)},` : 'Hallo,'
  const html = partnerShell({
    partnerName: opts.partnerName,
    partnerLogoUrl: opts.partnerLogoUrl,
    content: `
      <h1>Willkommen, ${escapeText(opts.customerCompany)}</h1>
      <p>${greeting}</p>
      <p>${escapeText(opts.partnerName)} hat Ihnen einen verifizierten Referenz-Check-Workspace eingerichtet \u2014
         betrieben auf candiq, der DSGVO-konformen Plattform f\u00fcr Bewerber-Referenz-Pr\u00fcfung.</p>
      <p><strong>Plan:</strong> ${escapeText(opts.planName)}</p>
      <p style="margin: 24px 0;">
        <a class="btn" href="${opts.signupUrl}">Konto aktivieren</a>
      </p>
      <p>Im Aktivierungs-Schritt legen Sie ein eigenes Passwort fest. Danach k\u00f6nnen Sie sofort
         Kandidaten anlegen und Referenz-Pr\u00fcfungen starten. Reports tragen das Logo von
         ${escapeText(opts.partnerName)} \u2014 die verifizierte Tiefe liefert candiq im Hintergrund.</p>
      <p>Sie erreichen ${escapeText(opts.partnerName)} jederzeit als Ansprechpartner. Technische Fragen zur
         Plattform beantworten wir gern unter <a href="mailto:hello@candiq.de">hello@candiq.de</a>.</p>
    `,
  })
  const text = `Willkommen, ${opts.customerCompany}\n\n${opts.customerContactName ? `Hallo ${opts.customerContactName},` : 'Hallo,'}\n\n${opts.partnerName} hat Ihnen einen verifizierten Referenz-Check-Workspace eingerichtet \u2014 betrieben auf candiq.\n\nPlan: ${opts.planName}\n\nKonto aktivieren: ${opts.signupUrl}\n\nReports tragen das Logo von ${opts.partnerName} \u2014 verifiziert durch candiq.`
  return {
    subject: `Ihr Referenz-Check-Workspace bei ${opts.partnerName} ist bereit`,
    html,
    text,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Partner-Programm: Admin-Aktions-Mails an Partner
//
// ALLE diese Mails sind reine candiq → Partner Kommunikation und nutzen
// daher den candiq-shell() (Logo, Branding, Footer-Hinweis). KEIN
// partnerShell — die Partner-Logo-Variante ist nur für Mails an die
// End-Mandanten gedacht.
// ─────────────────────────────────────────────────────────────────────────

function partnerSalutation(fullName: string | null | undefined): string {
  const n = (fullName ?? '').trim()
  return n ? `Hallo ${escapeText(n)},` : 'Hallo,'
}

export function partnerApprovedEmail(opts: {
  partnerName: string
  company: string
  loginUrl: string
}): { subject: string; html: string; text: string } {
  const html = shell(`
    <h1>Willkommen im candiq-Reseller-Programm</h1>
    <p>${partnerSalutation(opts.partnerName)}</p>
    <p>Ihre Partner-Bewerbung für <strong>${escapeText(opts.company)}</strong> ist freigegeben.
       Sie können sich jetzt einloggen und Ihren ersten Mandanten anlegen.</p>
    <p style="margin: 24px 0;"><a class="btn" href="${opts.loginUrl}">Zum Partner-Dashboard</a></p>
    <p><strong>Nächste Schritte:</strong></p>
    <p>1. Co-Brand-Logo hochladen (wird auf Reports und Welcome-Mails Ihrer Mandanten gezeigt)<br>
       2. Ersten Mandanten anlegen — wir verschicken die Welcome-Mail mit Ihrem Branding<br>
       3. Konditionen und Tier-Status im Dashboard prüfen</p>
    <p>Wir melden uns separat zum Erstgespräch (EK-Konditionen-Walkthrough und Co-Brand-Setup).
       Bei Fragen jederzeit gern an <a href="mailto:partner@candiq.de">partner@candiq.de</a>.</p>
  `)
  const text = `Willkommen im candiq-Reseller-Programm\n\n${partnerSalutation(opts.partnerName).replace(/<[^>]+>/g, '')}\n\nIhre Partner-Bewerbung für ${opts.company} ist freigegeben.\n\nLogin: ${opts.loginUrl}\n\nNächste Schritte: 1. Co-Brand-Logo hochladen 2. Ersten Mandanten anlegen 3. Konditionen prüfen\n\nWir melden uns separat zum Erstgespräch.`
  return {
    subject: `Ihre Partner-Bewerbung wurde freigegeben — ${opts.company}`,
    html,
    text,
  }
}

export function partnerRejectedEmail(opts: {
  partnerName: string
  reason?: string | null
}): { subject: string; html: string; text: string } {
  const reasonBlock = opts.reason
    ? `<p><strong>Begründung:</strong><br>${escapeText(opts.reason)}</p>`
    : ''
  const html = shell(`
    <h1>Zur Ihrer Partner-Bewerbung</h1>
    <p>${partnerSalutation(opts.partnerName)}</p>
    <p>vielen Dank, dass Sie sich für das candiq-Partner-Programm beworben haben.
       Nach Prüfung können wir Sie aktuell leider nicht ins Programm aufnehmen.</p>
    ${reasonBlock}
    <p>Eine erneute Bewerbung ist jederzeit möglich, sobald sich die Rahmenbedingungen
       geändert haben. Falls Sie Rückfragen zur Entscheidung haben, antworten Sie
       gern auf diese E-Mail.</p>
  `)
  const text = `Zur Ihrer Partner-Bewerbung\n\n${partnerSalutation(opts.partnerName).replace(/<[^>]+>/g, '')}\n\nvielen Dank für Ihre Bewerbung. Nach Prüfung können wir Sie aktuell leider nicht ins Programm aufnehmen.${opts.reason ? `\n\nBegründung: ${opts.reason}` : ''}\n\nEine erneute Bewerbung ist jederzeit möglich.`
  return {
    subject: 'Zur Ihrer Partner-Bewerbung — Rückmeldung',
    html,
    text,
  }
}

export function partnerSuspendedEmail(opts: {
  partnerName: string
  reason?: string | null
}): { subject: string; html: string; text: string } {
  const reasonBlock = opts.reason
    ? `<p><strong>Begründung:</strong><br>${escapeText(opts.reason)}</p>`
    : ''
  const html = shell(`
    <h1>Ihr Partner-Zugang wurde pausiert</h1>
    <p>${partnerSalutation(opts.partnerName)}</p>
    <p>Wir haben Ihren Partner-Zugang vorübergehend pausiert. Bestehende Mandanten
       laufen unverändert weiter — Sie können sich aktuell jedoch nicht einloggen
       und keine neuen Mandanten anlegen.</p>
    ${reasonBlock}
    <p>Bitte melden Sie sich unter
       <a href="mailto:partner@candiq.de">partner@candiq.de</a>,
       damit wir die nächsten Schritte gemeinsam klären können.</p>
  `)
  const text = `Ihr Partner-Zugang wurde pausiert\n\n${partnerSalutation(opts.partnerName).replace(/<[^>]+>/g, '')}\n\nWir haben Ihren Partner-Zugang vorübergehend pausiert.${opts.reason ? `\n\nBegründung: ${opts.reason}` : ''}\n\nBitte melden Sie sich unter partner@candiq.de.`
  return {
    subject: 'Ihr candiq-Partner-Zugang wurde pausiert',
    html,
    text,
  }
}

export function partnerReactivatedEmail(opts: {
  partnerName: string
  loginUrl: string
}): { subject: string; html: string; text: string } {
  const html = shell(`
    <h1>Ihr Partner-Zugang ist wieder aktiv</h1>
    <p>${partnerSalutation(opts.partnerName)}</p>
    <p>Wir haben Ihren Partner-Zugang wieder freigeschaltet. Sie können sich jetzt
       wieder einloggen und Ihre Mandanten verwalten.</p>
    <p style="margin: 24px 0;"><a class="btn" href="${opts.loginUrl}">Zum Partner-Dashboard</a></p>
    <p>Bei Rückfragen stehen wir Ihnen unter
       <a href="mailto:partner@candiq.de">partner@candiq.de</a> jederzeit zur Verfügung.</p>
  `)
  const text = `Ihr Partner-Zugang ist wieder aktiv\n\n${partnerSalutation(opts.partnerName).replace(/<[^>]+>/g, '')}\n\nWir haben Ihren Partner-Zugang wieder freigeschaltet.\n\nLogin: ${opts.loginUrl}`
  return {
    subject: 'Ihr candiq-Partner-Zugang ist wieder aktiv',
    html,
    text,
  }
}

/**
 * Interne Notification an LEAD_ALERT_EMAIL bei neuer Partner-Bewerbung.
 * Geht an candiq-interne Adresse — kein Partner-Branding, candiq-shell.
 */
export function partnerApplicationAdminNotificationEmail(opts: {
  company: string
  contactFirstName: string
  contactLastName: string
  email: string
  phone: string | null
  approvalUrl: string
}): { subject: string; html: string; text: string } {
  const html = shell(`
    <h1>Neue Partner-Bewerbung</h1>
    <p>Eine neue Bewerbung im candiq-Partner-Programm ist eingegangen:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
      <tr><td style="padding:6px 0;color:#64748b;width:120px;">Firma</td><td style="padding:6px 0;"><strong>${escapeText(opts.company)}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Kontakt</td><td style="padding:6px 0;">${escapeText(opts.contactFirstName)} ${escapeText(opts.contactLastName)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">E-Mail</td><td style="padding:6px 0;"><a href="mailto:${escapeAttr(opts.email)}">${escapeText(opts.email)}</a></td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Telefon</td><td style="padding:6px 0;">${escapeText(opts.phone ?? '—')}</td></tr>
    </table>
    <p style="margin: 24px 0;"><a class="btn" href="${opts.approvalUrl}">Zur Approval-Queue</a></p>
    <p style="font-size:12px;color:#94a3b8;">Bewerbungen werden manuell geprüft. Bitte innerhalb von 2 Werktagen über Approve/Reject entscheiden.</p>
  `)
  const text = `Neue Partner-Bewerbung\n\nFirma: ${opts.company}\nKontakt: ${opts.contactFirstName} ${opts.contactLastName}\nE-Mail: ${opts.email}\nTelefon: ${opts.phone ?? '—'}\n\nApproval-Queue: ${opts.approvalUrl}`
  return {
    subject: `Neue Partner-Bewerbung: ${opts.company}`,
    html,
    text,
  }
}

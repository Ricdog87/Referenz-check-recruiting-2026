/**
 * Pilot-Email-Drip-Sequence — drei Reminder-Touchpoints, sortiert
 * nach Abstand zur initialen Bewerbung. Wird nur an PENDING-Status
 * geschickt; sobald die Bewerbung ACCEPTED/REJECTED ist, stoppt
 * die Sequence automatisch (Cron-Filter im Route-Handler).
 *
 * Marketing-Logik:
 *  - Tag 1: Soft-Acknowledge mit konkreter Erwartung ("nächste 48h")
 *  - Tag 3: Wert-Reminder mit ROI-Rechner-Link (Sales-Material)
 *  - Tag 7: Letzter Touchpoint mit Slot-Knappheit + persönlichem Pitch
 *
 * Templates sind reines HTML mit Plain-Text-Fallback. Keine externen
 * Bilder/CSS-Files — Resend liefert das robust aus, Spam-Filter
 * neutral.
 */
import { BASE_URL } from '@/lib/seo'

type ReminderInput = {
  firstName: string
  company: string
}

type ReminderEmail = {
  subject: string
  html: string
  text: string
}

const FOOTER_TEXT = `
candiq — Die menschliche Vertrauensschicht für Hiring.
RSG Recruiting Solutions group GmbH · hello@candiq.de
Abmeldung: einfach auf diese Mail antworten mit "Abmelden".
`

const FOOTER_HTML = `
<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
<p style="font-size:12px;color:#64748b;line-height:1.5">
  candiq — Die menschliche Vertrauensschicht für Hiring.<br>
  RSG Recruiting Solutions group GmbH · <a href="mailto:hello@candiq.de" style="color:#4f46e5">hello@candiq.de</a><br>
  Abmeldung: einfach auf diese Mail antworten mit „Abmelden".
</p>
`

export function pilotReminderDay1({ firstName, company }: ReminderInput): ReminderEmail {
  const subject = `Ihre candiq Pilot-Bewerbung ist bei uns angekommen, ${firstName}`
  const text = `
Hallo ${firstName},

vielen Dank, dass Sie sich für das candiq Pilot-Programm beworben haben.
Wir haben Ihre Bewerbung für ${company} erhalten und arbeiten gerade
an einer kurzen Bestandsaufnahme:

  1. Passt das Pilot-Setup zu Ihrem Hiring-Volumen?
  2. Welche Vertikale ist bei Ihnen am stärksten betroffen?
  3. Gibt es ein bestehendes Tool, das wir mitberücksichtigen sollten?

In den nächsten 48 Stunden meldet sich ein Gründer mit einem kurzen
Termin-Vorschlag (15 Min, kein Pitch).

Wenn Sie vorab Fragen haben — einfach auf diese Mail antworten.

Bis gleich,
Ricardo Serrano
Gründer, candiq
${FOOTER_TEXT}
`.trim()
  const html = `
<p>Hallo ${firstName},</p>
<p>
  vielen Dank, dass Sie sich für das <strong>candiq Pilot-Programm</strong>
  beworben haben. Wir haben Ihre Bewerbung für <strong>${company}</strong>
  erhalten und arbeiten gerade an einer kurzen Bestandsaufnahme:
</p>
<ol style="line-height:1.7;color:#334155">
  <li>Passt das Pilot-Setup zu Ihrem Hiring-Volumen?</li>
  <li>Welche Vertikale ist bei Ihnen am stärksten betroffen?</li>
  <li>Gibt es ein bestehendes Tool, das wir mitberücksichtigen sollten?</li>
</ol>
<p>
  In den nächsten <strong>48 Stunden</strong> meldet sich ein Gründer
  mit einem kurzen Termin-Vorschlag (15 Min, kein Pitch).
</p>
<p>
  Wenn Sie vorab Fragen haben — einfach auf diese Mail antworten.
</p>
<p>
  Bis gleich,<br>
  <strong>Ricardo Serrano</strong><br>
  Gründer, candiq
</p>
${FOOTER_HTML}
`.trim()
  return { subject, html, text }
}

export function pilotReminderDay3({ firstName, company }: ReminderInput): ReminderEmail {
  const subject = `${firstName}, eine Zahl die das Pilot-Programm für ${company} relevant macht`
  const text = `
Hallo ${firstName},

vor wenigen Tagen haben Sie sich beim candiq Pilot-Programm beworben.

Eine Zahl, die wir oft hören, wenn HR-Verantwortliche das erste Mal
auf candiq stoßen:

  Eine durchschnittliche Fehlbesetzung kostet rund das 1,5-fache
  Jahresgehalt. Bei einem typischen Mid-Senior Hire (60-90k EUR)
  sind das 90.000 - 135.000 EUR pro vermiedener Falschentscheidung.

Wir haben einen kleinen Rechner gebaut, damit Sie die Zahlen mit
Ihren eigenen Pipeline-Größen durchspielen können:

  ${BASE_URL}/roi-rechner

Der Rechner ist quellenbasiert (SHRM, Bain & Company) und so
konservativ kalibriert, dass die Zahl realistisch bleibt.

Spielen Sie kurz damit. Wenn das Modell bei Ihrer Volumen-Größe
zur Pilot-Konversation passt, antworten Sie einfach mit "Termin"
auf diese Mail und ich schicke Ihnen drei Slot-Vorschläge.

Beste Grüße,
Ricardo
${FOOTER_TEXT}
`.trim()
  const html = `
<p>Hallo ${firstName},</p>
<p>
  vor wenigen Tagen haben Sie sich beim candiq Pilot-Programm
  beworben. Eine Zahl, die wir oft hören, wenn HR-Verantwortliche
  das erste Mal auf candiq stoßen:
</p>
<blockquote style="border-left:3px solid #4f46e5;padding:12px 16px;margin:16px 0;background:#f5f3ff;color:#312e81">
  Eine durchschnittliche Fehlbesetzung kostet rund das
  <strong>1,5-fache Jahresgehalt</strong>. Bei einem typischen
  Mid-Senior Hire (60–90k EUR) sind das 90.000 – 135.000 EUR
  pro vermiedener Falschentscheidung.
</blockquote>
<p>
  Wir haben einen kleinen Rechner gebaut, damit Sie die Zahlen
  mit Ihren eigenen Pipeline-Größen durchspielen können:
</p>
<p>
  <a href="${BASE_URL}/roi-rechner" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 20px;border-radius:9999px;font-weight:600;text-decoration:none">
    ROI-Rechner für ${company} ansehen →
  </a>
</p>
<p style="color:#64748b;font-size:14px">
  Der Rechner ist quellenbasiert (SHRM, Bain &amp; Company) und so
  konservativ kalibriert, dass die Zahl realistisch bleibt.
</p>
<p>
  Spielen Sie kurz damit. Wenn das Modell bei Ihrer Volumen-Größe
  zur Pilot-Konversation passt, antworten Sie einfach mit
  <strong>„Termin"</strong> auf diese Mail und ich schicke Ihnen
  drei Slot-Vorschläge.
</p>
<p>
  Beste Grüße,<br>
  <strong>Ricardo</strong>
</p>
${FOOTER_HTML}
`.trim()
  return { subject, html, text }
}

export function pilotReminderDay7({ firstName }: ReminderInput): ReminderEmail {
  const subject = `Letzter Pilot-Touchpoint, ${firstName} — danach gehe ich davon aus`
  const text = `
Hallo ${firstName},

das ist mein letzter Touchpoint zur Pilot-Bewerbung — danach gehe
ich davon aus, dass das Timing aktuell nicht passt, und melde mich
in 4-6 Monaten wieder.

Falls doch noch Interesse besteht: das Pilot-Programm Q3/2026 hat
maximal 10 Slots, und wir nehmen die Sequenz bewusst klein, weil
die monatlichen Strategie-Calls mit unserem Gründer-Team echte
Zeit-Investition sind.

Wenn Sie sich noch reinmelden wollen, antworten Sie einfach mit
einem Termin-Vorschlag (15 Min). Sonst — alles Gute für Ihr
Hiring 2026.

Beste Grüße,
Ricardo
${FOOTER_TEXT}
`.trim()
  const html = `
<p>Hallo ${firstName},</p>
<p>
  das ist mein letzter Touchpoint zur Pilot-Bewerbung — danach
  gehe ich davon aus, dass das Timing aktuell nicht passt, und
  melde mich in 4–6 Monaten wieder.
</p>
<p>
  Falls doch noch Interesse besteht: das Pilot-Programm Q3/2026
  hat <strong>maximal 10 Slots</strong>, und wir nehmen die Sequenz
  bewusst klein, weil die monatlichen Strategie-Calls mit unserem
  Gründer-Team echte Zeit-Investition sind.
</p>
<p>
  Wenn Sie sich noch reinmelden wollen, antworten Sie einfach mit
  einem Termin-Vorschlag (15 Min). Sonst — alles Gute für Ihr
  Hiring 2026.
</p>
<p>
  Beste Grüße,<br>
  <strong>Ricardo</strong>
</p>
${FOOTER_HTML}
`.trim()
  return { subject, html, text }
}

export const REMINDER_SCHEDULE = [
  { day: 1, builder: pilotReminderDay1 },
  { day: 3, builder: pilotReminderDay3 },
  { day: 7, builder: pilotReminderDay7 },
] as const

export type ReminderStep = (typeof REMINDER_SCHEDULE)[number]

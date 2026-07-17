/**
 * PII-Redaction für Log-Ausgaben (G11).
 *
 * Vercel-Logs / Log-Drains sind KEIN vertraulicher Speicher — E-Mail-
 * Adressen dürfen dort nicht im Klartext landen. Diese Helfer maskieren
 * den lokalen Teil, lassen aber die Domain stehen (für Deliverability-/
 * Bounce-Debugging nützlich, für sich genommen nicht personenbeziehbar).
 *
 * Bewusst KEINE Änderung an AuditLog-Persistenz (das ist G10) — hier geht
 * es ausschließlich um flüchtige Log-Zeilen.
 */

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g

/** `max.mustermann@example.com` → `m***@example.com`. */
export function redactEmail(input: unknown): string {
  const s = String(input ?? '').trim()
  const at = s.indexOf('@')
  if (at <= 0 || at === s.length - 1) return s ? '***' : ''
  const local = s.slice(0, at)
  const domain = s.slice(at + 1)
  return `${local[0]}***@${domain}`
}

/** Ersetzt ALLE E-Mail-Vorkommen in einem Freitext (z. B. API-Body-Slice). */
export function redactEmails(text: unknown): string {
  return String(text ?? '').replace(EMAIL_RE, (m) => redactEmail(m))
}

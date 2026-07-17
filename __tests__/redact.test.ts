/**
 * G11 — PII-Redaction für Logs.
 */
import { describe, it, expect } from 'vitest'
import { redactEmail, redactEmails } from '@/lib/redact'

describe('redactEmail', () => {
  it('maskiert den lokalen Teil, behält die Domain', () => {
    expect(redactEmail('max.mustermann@example.com')).toBe('m***@example.com')
    expect(redactEmail('a@b.co')).toBe('a***@b.co')
  })

  it('gibt bei Nicht-Adressen keine PII preis', () => {
    expect(redactEmail('kein-email')).toBe('***')
    expect(redactEmail('@nolocal.com')).toBe('***')
    expect(redactEmail('trailing@')).toBe('***')
    expect(redactEmail('')).toBe('')
    expect(redactEmail(null)).toBe('')
    expect(redactEmail(undefined)).toBe('')
  })
})

describe('redactEmails', () => {
  it('ersetzt alle Adressen in einem Freitext', () => {
    const raw = 'Fehler für a.b@x.io und zweite c@y.org im Batch'
    const out = redactEmails(raw)
    expect(out).toBe('Fehler für a***@x.io und zweite c***@y.org im Batch')
    expect(out).not.toContain('a.b@x.io')
    expect(out).not.toContain('c@y.org')
  })

  it('lässt Text ohne Adressen unverändert', () => {
    expect(redactEmails('HTTP 500 rate limited')).toBe('HTTP 500 rate limited')
    expect(redactEmails(null)).toBe('')
  })
})

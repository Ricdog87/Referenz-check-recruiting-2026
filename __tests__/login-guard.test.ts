/**
 * G1-Regression: Login-Rate-Limit (HR + Partner authorize).
 * Der In-Memory-Limiter ist prozess-lokal — die Tests laufen daher in
 * einem frischen Modul-Zustand.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

async function fresh() {
  vi.resetModules()
  return import('@/lib/login-guard')
}

function reqWithIp(ip: string) {
  return { headers: new Headers({ 'x-forwarded-for': ip }) }
}

describe('loginAttemptAllowed', () => {
  let loginAttemptAllowed: (s: 'hr' | 'partner', e: string, r: unknown) => boolean

  beforeEach(async () => {
    ;({ loginAttemptAllowed } = await fresh())
  })

  it('erlaubt die ersten 10 Versuche, blockt ab dem 11. (pro IP+Email)', () => {
    const req = reqWithIp('1.2.3.4')
    for (let i = 0; i < 10; i++) {
      expect(loginAttemptAllowed('hr', 'a@x.de', req)).toBe(true)
    }
    expect(loginAttemptAllowed('hr', 'a@x.de', req)).toBe(false)
  })

  it('IP-Bremse: dieselbe IP, andere Emails → nach 10 IP-Treffern geblockt', () => {
    const req = reqWithIp('9.9.9.9')
    // 10 verschiedene Emails von derselben IP: der IP-Bucket füllt sich.
    let lastAllowed = true
    for (let i = 0; i < 11; i++) {
      lastAllowed = loginAttemptAllowed('hr', `user${i}@x.de`, req)
    }
    expect(lastAllowed).toBe(false)
  })

  it('HR- und Partner-Scope zählen getrennt', () => {
    const req = reqWithIp('5.5.5.5')
    for (let i = 0; i < 10; i++) loginAttemptAllowed('hr', 'a@x.de', req)
    expect(loginAttemptAllowed('hr', 'a@x.de', req)).toBe(false)
    // Partner-Scope für dieselbe Email/IP ist noch frei.
    expect(loginAttemptAllowed('partner', 'a@x.de', req)).toBe(true)
  })

  it('toleriert Plain-Object-Header (NextAuth v4 authorize req)', () => {
    const req = { headers: { 'x-forwarded-for': '7.7.7.7' } }
    expect(loginAttemptAllowed('hr', 'b@x.de', req)).toBe(true)
  })

  it('toleriert fehlende Header (ip=unknown), blockt trotzdem nach Limit', () => {
    for (let i = 0; i < 10; i++) loginAttemptAllowed('hr', 'c@x.de', {})
    expect(loginAttemptAllowed('hr', 'c@x.de', {})).toBe(false)
  })
})

/**
 * __tests__/app-access.test.ts
 *
 * Beweist für den geschlossenen App-Zugang (Default):
 *   - Login, Registrierung, Passwort-Reset und Dashboard leiten um
 *   - Konto- und Session-APIs liefern 404, die Session-Abfrage „leer"
 *   - Marketing, Lead-Formulare, Consent-Portal, Webhooks und Crons
 *     bleiben unberührt
 *   - der Middleware-Matcher deckt jede gesperrte API ab
 */

import { describe, it, expect, afterEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { isAppAccessEnabled } from '@/lib/flags'
import {
  CLOSED_API_EXACT,
  CLOSED_API_PREFIXES,
  closedAppAction,
} from '@/lib/appAccess'

const KEY = 'NEXT_PUBLIC_APP_ACCESS_ENABLED'

describe('isAppAccessEnabled', () => {
  afterEach(() => {
    delete process.env[KEY]
  })

  it('is closed by default', () => {
    delete process.env[KEY]
    expect(isAppAccessEnabled()).toBe(false)
  })

  it('opens only on an explicit truthy value', () => {
    for (const v of ['true', '1', 'yes', 'on', ' TRUE ']) {
      process.env[KEY] = v
      expect(isAppAccessEnabled()).toBe(true)
    }
    for (const v of ['false', '0', '', 'off', 'enabled']) {
      process.env[KEY] = v
      expect(isAppAccessEnabled()).toBe(false)
    }
  })
})

describe('closedAppAction — pages', () => {
  it.each([
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/dashboard',
    '/dashboard/addons',
    '/candidates',
    '/candidates/abc123',
    '/checks/abc123',
    '/clients',
    '/integrations',
    '/analytics',
    '/settings/billing',
    '/audit',
    '/addons',
    '/report/check/abc123',
    '/reviewer',
    '/admin/partners',
  ])('redirects %s', (path) => {
    expect(closedAppAction(path)).toBe('redirect')
  })

  it.each([
    '/',
    '/termin',
    '/preise',
    '/pilotprogramm',
    '/bewerber',
    '/resources/dsgvo-checkliste-recruiting',
    '/datenschutz',
    '/en',
    // Consent-Portal der Bewerber: '/candidate/…' ≠ '/candidates'
    '/candidate/some-token',
    // nur Segment-genaue Treffer
    '/loginx',
    '/registered',
    '/addons-und-services',
  ])('lets %s through', (path) => {
    expect(closedAppAction(path)).toBe('pass')
  })
})

describe('closedAppAction — APIs', () => {
  it('answers the next-auth session poll with an empty session', () => {
    expect(closedAppAction('/api/auth/session')).toBe('empty-session')
    expect(closedAppAction('/api/auth/partner/session')).toBe('empty-session')
  })

  it.each([
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/profile',
    '/api/auth/csrf',
    '/api/auth/callback/credentials',
    '/api/auth/partner/callback/credentials',
    '/api/addons',
    '/api/admin/partners/p1/approve',
    '/api/candidates',
    '/api/candidates/c1/invite',
    '/api/checks/c1/report',
    '/api/cv-analysis',
    '/api/documents/d1',
    '/api/gdpr/export',
    '/api/gdpr/delete',
    '/api/reviewer/checks/c1/assign',
    '/api/sample-data',
    '/api/stripe/checkout',
    '/api/stripe/portal',
    '/api/upload',
  ])('blocks %s', (path) => {
    expect(closedAppAction(path)).toBe('not-found')
  })

  it.each([
    '/api/cv-analysis/preview',
    '/api/pilot-application',
    '/api/pilot-application/slots',
    '/api/lead-magnet',
    '/api/chat',
    '/api/chat/intent',
    '/api/candidate-waitlist',
    '/api/consent/tok/accept',
    '/api/consent/tok/upload',
    '/api/download/d1',
    '/api/health',
    '/api/cron/cleanup',
    '/api/internal/indexnow-ping',
    '/api/stripe/webhook',
    '/api/admin/init',
  ])('keeps %s public', (path) => {
    expect(closedAppAction(path)).toBe('pass')
  })
})

describe('middleware matcher', () => {
  // Der Matcher muss statisch in middleware.ts stehen. Fehlt dort ein
  // Eintrag, läuft die Route an der Sperre vorbei — deshalb hier der Abgleich.
  const src = readFileSync(resolve(__dirname, '..', 'middleware.ts'), 'utf-8')

  it('covers every closed API prefix', () => {
    for (const prefix of CLOSED_API_PREFIXES) {
      const covered =
        src.includes(`'${prefix}/:path*'`) || src.includes(`'${prefix}'`)
      expect(covered, `matcher entry for ${prefix}`).toBe(true)
    }
  })

  it('covers every exact closed API route without swallowing sub-routes', () => {
    for (const route of CLOSED_API_EXACT) {
      expect(src.includes(`'${route}'`), `matcher entry for ${route}`).toBe(true)
      expect(src.includes(`'${route}/:path*'`)).toBe(false)
    }
  })
})

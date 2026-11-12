/**
 * Pfad-Logik für den geschlossenen App-Zugang (siehe isAppAccessEnabled in
 * lib/flags.ts). Reine Funktionen ohne Next-Abhängigkeit, damit Middleware
 * und Tests dieselbe Quelle nutzen.
 */

/** Seiten des Kunden-Dashboards — bei offenem Zugang auth-geschützt. */
export const PROTECTED_PREFIXES = [
  '/dashboard',
  '/candidates',
  '/checks',
  '/clients',
  '/integrations',
  '/analytics',
  '/settings',
  '/audit',
  '/addons',
  '/report',
  '/reviewer',
  '/admin',
]

/** Login, Registrierung und Passwort-Reset. */
export const AUTH_PAGE_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]

/**
 * APIs, die ein Konto anlegen, eine Session ausstellen oder nur mit Session
 * funktionieren. Öffentliche Endpunkte (Lead-Formulare, Consent-Portal,
 * Stripe-Webhook, Crons, Health) stehen bewusst NICHT hier.
 *
 * Wichtig: jede Änderung hier muss im `config.matcher` der middleware.ts
 * nachgezogen werden — Next.js verlangt dort statische Strings.
 */
export const CLOSED_API_PREFIXES = [
  '/api/auth',
  '/api/addons',
  '/api/admin/partners',
  '/api/candidates',
  '/api/checks',
  '/api/documents',
  '/api/gdpr',
  '/api/reviewer',
  '/api/sample-data',
  '/api/stripe/checkout',
  '/api/stripe/portal',
  '/api/upload',
]

/** Nur exakt — /api/cv-analysis/preview ist der öffentliche Homepage-Check. */
export const CLOSED_API_EXACT = ['/api/cv-analysis']

/** next-auth-Clients fragen die Session ab; die Antwort ist „nicht eingeloggt". */
const SESSION_ENDPOINTS = ['/api/auth/session', '/api/auth/partner/session']

/** Wohin geschlossene Seiten umleiten. */
export const CLOSED_APP_REDIRECT = '/termin'

export type ClosedAppAction = 'pass' | 'redirect' | 'empty-session' | 'not-found'

function underPrefix(pathname: string, prefixes: string[]): boolean {
  // Segment-genau: '/candidates' darf '/candidate/<token>' (Consent-Portal)
  // nicht mit erwischen.
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/** Was mit einem Request passiert, solange der App-Zugang geschlossen ist. */
export function closedAppAction(pathname: string): ClosedAppAction {
  if (pathname.startsWith('/api/')) {
    if (SESSION_ENDPOINTS.includes(pathname)) return 'empty-session'
    if (CLOSED_API_EXACT.includes(pathname)) return 'not-found'
    return underPrefix(pathname, CLOSED_API_PREFIXES) ? 'not-found' : 'pass'
  }
  if (underPrefix(pathname, AUTH_PAGE_PREFIXES)) return 'redirect'
  if (underPrefix(pathname, PROTECTED_PREFIXES)) return 'redirect'
  return 'pass'
}

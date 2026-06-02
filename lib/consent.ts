// First-Party-Consent-Verwaltung für Webanalyse (GA4).
// Speicherung im First-Party-Cookie mit Zeitstempel + Version → nachweisbar
// (Art. 7 Abs. 1 DSGVO: Nachweis der Einwilligung).

export const CONSENT_COOKIE = 'candiq_consent'
// Version bei jeder materiellen Änderung der Cookie-/Tracking-Praxis erhöhen,
// damit Nutzer erneut gefragt werden.
export const CONSENT_VERSION = 1
export const CONSENT_MAX_AGE_DAYS = 180

export type ConsentChoice = 'granted' | 'denied'

export type ConsentState = {
  analytics: ConsentChoice
  ts: string // ISO-Zeitstempel der Entscheidung
  v: number // Consent-Version
}

export function parseConsent(raw: string | undefined | null): ConsentState | null {
  if (!raw) return null
  try {
    const data = JSON.parse(decodeURIComponent(raw)) as Partial<ConsentState>
    if (
      (data.analytics === 'granted' || data.analytics === 'denied') &&
      typeof data.v === 'number'
    ) {
      // Bei veralteter Version: erneut fragen.
      if (data.v !== CONSENT_VERSION) return null
      return { analytics: data.analytics, ts: data.ts ?? '', v: data.v }
    }
  } catch {
    // korruptes Cookie → behandeln wie keine Entscheidung
  }
  return null
}

export function readConsentCookie(): ConsentState | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`))
  return parseConsent(match?.split('=').slice(1).join('='))
}

export function writeConsentCookie(analytics: ConsentChoice): ConsentState {
  const state: ConsentState = {
    analytics,
    ts: new Date().toISOString(),
    v: CONSENT_VERSION,
  }
  const value = encodeURIComponent(JSON.stringify(state))
  const maxAge = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`
  return state
}

// Events zur Kommunikation zwischen Footer-Button und ConsentManager.
export const OPEN_CONSENT_EVENT = 'candiq:open-consent'
export const CONSENT_UPDATED_EVENT = 'candiq:consent-updated'

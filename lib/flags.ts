/**
 * Feature-Flag-Helper.
 *
 * Liest Boolean-Flags aus ENV-Variablen mit toleranter Parse-Logik
 * (true/1/yes/on, case-insensitive). Default ist immer false — neue
 * Features sind „off until explicitly enabled".
 *
 * Nutzung im Server-Code:
 *
 *   import { isPartnerProgramEnabled } from '@/lib/flags'
 *   if (!isPartnerProgramEnabled()) return notFound()
 */

function parseBool(raw: string | undefined): boolean {
  if (!raw) return false
  const v = raw.trim().toLowerCase()
  return v === 'true' || v === '1' || v === 'yes' || v === 'on'
}

export function isFlagEnabled(name: string): boolean {
  return parseBool(process.env[name])
}

/**
 * Master-Switch für alles, was ein Konto voraussetzt: Registrierung, Login,
 * Passwort-Reset, Kunden-Dashboard, session-gebundene APIs und das
 * Partner-Portal. Default false = geschlossen; candiq ist dann eine reine
 * Marketing-Seite mit Terminbuchung und Lead-Formularen.
 *
 * Bewusst literal auf `process.env.NEXT_PUBLIC_…` zugegriffen (nicht über
 * isFlagEnabled): nur so inlined Next.js den Wert zur Build-Zeit in
 * Client-Bundles und Middleware. Eine Änderung braucht daher ein Redeploy.
 */
export function isAppAccessEnabled(): boolean {
  return parseBool(process.env.NEXT_PUBLIC_APP_ACCESS_ENABLED)
}

/**
 * Das Partner-Portal hat eigene Login-/Registrierungs-Seiten und erzeugt
 * Registrierungs-Links für Endkunden — ohne App-Zugang ergibt es keinen
 * Sinn und bleibt deshalb ebenfalls zu.
 */
export function isPartnerProgramEnabled(): boolean {
  return isAppAccessEnabled() && isFlagEnabled('PARTNER_PROGRAM_ENABLED')
}

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

export function isPartnerProgramEnabled(): boolean {
  return isFlagEnabled('PARTNER_PROGRAM_ENABLED')
}

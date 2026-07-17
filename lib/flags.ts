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

/**
 * Master-Switch für die LLM-gestützte CV-Plausibilitätsprüfung.
 *
 * Default OFF: solange nicht explizit aktiviert, verlässt KEIN CV-Inhalt
 * die Plattform Richtung Anthropic/OpenAI — die deterministischen Checks
 * laufen weiter (safe fallback). Gibt einem Betreiber/Käufer einen
 * Config-Kill-Switch für den externen Datenabfluss, unabhängig davon,
 * ob API-Keys hinterlegt sind (R4/G13).
 */
export function isCvAnalysisLlmEnabled(): boolean {
  return isFlagEnabled('CV_ANALYSIS_LLM_ENABLED')
}

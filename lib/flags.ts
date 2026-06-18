/**
 * lib/flags.ts
 *
 * Schlanker Feature-Flag-Helper. Lest ausschliesslich Environment-Variablen
 * — wir wollen NICHT noch eine Flag-Library wie LaunchDarkly anschleppen.
 *
 * Konvention: Flags heissen `INTEGRATION_<NAME>_ENABLED`, Default false.
 * Wer in Production etwas einschalten will, setzt die Env-Var in Vercel auf
 * 'true'. Andere truthy Werte (1, yes, on) werden ebenfalls akzeptiert.
 */

const TRUTHY = new Set(['true', '1', 'yes', 'on'])

export function isFlagEnabled(name: string): boolean {
  const v = process.env[name]
  if (!v) return false
  return TRUTHY.has(v.toLowerCase().trim())
}

// Bekannte Flags — explizit auflisten, damit Tippfehler beim Lesen auffallen.
export const FLAGS = {
  INTEGRATION_ZVOOVE_ENABLED: 'INTEGRATION_ZVOOVE_ENABLED',
} as const

export function isZvooveEnabled(): boolean {
  return isFlagEnabled(FLAGS.INTEGRATION_ZVOOVE_ENABLED)
}

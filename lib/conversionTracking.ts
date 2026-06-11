/**
 * Conversion-Tracking — GA4-Custom-Events fuer alle wichtigen Funnel-
 * Aktionen. Eine einzelne Datei statt verstreute gtag-Calls, damit
 * Event-Namen und Parameter zentral aenderbar sind.
 *
 * Events landen unter event_name=conversion_step und tragen step+context
 * als Parameter. GA4-Custom-Dimensions fuer step und context muessen im
 * GA4-Admin als Event-Parameter registriert sein — sonst tauchen sie
 * in den Reports nicht auf.
 *
 * Funnel-Schritte (sortiert):
 *  - voice_demo_start     — Mikrofon-Klick auf der Voice-Konsole
 *  - voice_demo_end       — Gespräch beendet (Dauer in seconds)
 *  - fabrication_demo     — Live-CV-Check ausprobiert (clean | fake)
 *  - roi_calculator       — ROI-Slider bewegt (debounced)
 *  - pilot_form_submit    — Pilot-Bewerbung abgeschickt
 *  - pilot_form_success   — Server-Bestaetigung erhalten
 *  - cta_click            — Click auf einen CTA mit Label (cta_label)
 *
 * Bestehende Hero-A/B-Events (hero_engagement) bleiben separat in
 * lib/abExperiment.ts — verschiedene Reporting-Achsen.
 */

type ConversionStep =
  | 'voice_demo_start'
  | 'voice_demo_end'
  | 'fabrication_demo'
  | 'roi_calculator'
  | 'pilot_form_submit'
  | 'pilot_form_success'
  | 'cta_click'

declare global {
  interface Window {
    gtag?: (cmd: string, eventName: string, params?: Record<string, unknown>) => void
  }
}

export function trackConversion(
  step: ConversionStep,
  context?: Record<string, string | number | boolean>,
): void {
  if (typeof window === 'undefined') return
  if (typeof window.gtag !== 'function') return
  window.gtag('event', 'conversion_step', {
    step,
    ...(context ?? {}),
  })
}

/**
 * Debounce-Wrapper fuer Slider-Events (ROI-Rechner). Vermeidet 50
 * Events pro Drag — nur das finale Ergebnis zaehlt fuer den Funnel.
 */
let sliderDebounceTimer: ReturnType<typeof setTimeout> | null = null
export function trackConversionDebounced(
  step: ConversionStep,
  context: Record<string, string | number | boolean>,
  delayMs = 800,
): void {
  if (sliderDebounceTimer) clearTimeout(sliderDebounceTimer)
  sliderDebounceTimer = setTimeout(() => trackConversion(step, context), delayMs)
}

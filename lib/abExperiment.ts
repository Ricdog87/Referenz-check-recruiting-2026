/**
 * Hero-Variant-A/B-Setup — minimal & SSR-sicher.
 *
 * Variante wird per env-var NEXT_PUBLIC_HERO_VARIANT gesetzt:
 *  - 'A' (default): "Ihre Kandidaten sprechen mit candiq" — sensorisch
 *  - 'B':           "candiq nimmt das Telefon ab" — utilitaristisch
 *
 * Sticky-per-Visit-Cookie-Rolling wäre der naechste Schritt — derzeit
 * kein nennenswertes Traffic-Volumen, daher statischer Switch:
 * Variante A 2 Wochen ausspielen, GA4-Conversion vergleichen, dann B
 * 2 Wochen ausspielen. Klassisches sequenzielles Pre-Volume-A/B.
 *
 * Tracking-Events landen im GA4 als 'hero_engagement' mit Parametern
 * action + variant + experiment_id. Im GA4 Explorations-Report als
 * Segmente vergleichbar.
 */
export type HeroVariant = 'A' | 'B'

export const HERO_EXPERIMENT_ID = 'hero_voice_v1'

export function getHeroVariant(): HeroVariant {
  const v = (process.env.NEXT_PUBLIC_HERO_VARIANT ?? 'A').toUpperCase()
  return v === 'B' ? 'B' : 'A'
}

export const HERO_COPY: Record<HeroVariant, {
  badge: string
  headline: { line1: string; line2: string; line3: string }
  subline: {
    intro: string
    cta: string
  }
}> = {
  A: {
    badge: 'candiq Voice ist live · Probieren Sie es jetzt →',
    headline: {
      line1: 'Ihre Kandidaten',
      line2: 'sprechen mit candiq.',
      line3: 'In Sekunden. Rund um die Uhr.',
    },
    subline: {
      intro:
        'Echte Stimme statt Kontaktformular — die KI nimmt ab, sammelt Stationen und Referenzgeber strukturiert, geschulte Reviewer verifizieren. Sie sehen jedes Wort im Dashboard.',
      cta: 'und hören Sie selbst, wie sich das für Ihre Kandidaten anfühlt.',
    },
  },
  B: {
    badge: 'candiq Voice · Live im Browser ausprobieren →',
    headline: {
      line1: 'candiq nimmt das',
      line2: 'Telefon ab.',
      line3: 'In Sekunden. 24/7.',
    },
    subline: {
      intro:
        'Während Ihr Bewerbungsformular still ist, läuft candiq Voice. Ihre Kandidaten erreichen Sie sofort — die KI dokumentiert, geschulte Reviewer verifizieren.',
      cta: 'und prüfen Sie selbst, wie das klingt.',
    },
  },
}

type HeroAction = 'view' | 'voice_click' | 'booking_click' | 'sticky_voice_click'

declare global {
  interface Window {
    gtag?: (cmd: string, eventName: string, params?: Record<string, unknown>) => void
  }
}

/**
 * Schickt ein GA4-Custom-Event fuers Hero-Experiment. No-op wenn gtag
 * nicht initialisiert ist (z. B. ohne Consent-Banner-Zustimmung) — der
 * Aufrufer braucht sich nicht um Consent-State zu kuemmern.
 */
export function trackHeroEngagement(action: HeroAction, variant: HeroVariant): void {
  if (typeof window === 'undefined') return
  if (typeof window.gtag !== 'function') return
  window.gtag('event', 'hero_engagement', {
    action,
    variant,
    experiment_id: HERO_EXPERIMENT_ID,
  })
}

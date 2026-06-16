/**
 * Hero-Variant-A/B-Setup — minimal & SSR-sicher.
 *
 * Beide Varianten machen klar: candiq verifiziert Referenzen — die
 * eigentliche Pruefung wird von geschulten Reviewern am Telefon
 * gefuehrt, NICHT von einer KI mit dem Kandidaten. Die Voice-Demo
 * rechts ist eine interaktive Produktdemo, kein Teil des produktiven
 * Pruefungs-Flows.
 *
 * Variante wird per env-var NEXT_PUBLIC_HERO_VARIANT gesetzt:
 *  - 'A' (default): "Referenzen verifiziert." — outcome-orientiert
 *  - 'B':           "Wir pruefen, wer wirklich was war." — substanz-orientiert
 *
 * Tracking-Events landen im GA4 als 'hero_engagement' mit Parametern
 * action + variant + experiment_id.
 */
export type HeroVariant = 'A' | 'B'

export const HERO_EXPERIMENT_ID = 'hero_voice_v1'

export function getHeroVariant(): HeroVariant {
  const v = (process.env.NEXT_PUBLIC_HERO_VARIANT ?? 'A').toUpperCase()
  if (v === 'B') return 'B'
  // 'ROLLING' = client-side 50/50-Auslosung mit Sticky-per-Visit-Cookie.
  // Aktiviert nur, wenn der Cookie-basierte Roller per env-flag scharf
  // gestellt ist (Default off, weil ohne Traffic-Volumen sinnlos).
  if (v === 'ROLLING') {
    if (typeof document === 'undefined') return 'A' // SSR-Default
    const m = document.cookie.match(/(?:^|;\s*)candiq_hero_v=([AB])/)
    if (m) return m[1] as HeroVariant
    const rolled: HeroVariant = Math.random() < 0.5 ? 'A' : 'B'
    // Cookie 30 Tage, SameSite=Lax, HttpOnly NICHT (client liest selbst).
    document.cookie = `candiq_hero_v=${rolled}; Max-Age=${30 * 24 * 60 * 60}; Path=/; SameSite=Lax`
    return rolled
  }
  return 'A'
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
    badge: 'candiq Voice · Interaktive Produkt-Demo →',
    headline: {
      line1: 'Referenzen',
      line2: 'verifiziert.',
      line3: 'DSGVO-konform. In unter 48 h.',
    },
    subline: {
      intro:
        'Geschulte Reviewer rufen die Referenzgeber persönlich an, prüfen jede Station strukturiert und markieren Diskrepanzen. Sie sehen jeden Befund revisionssicher im Dashboard.',
      cta: 'und erleben Sie unsere Voice-Demo selbst.',
    },
  },
  B: {
    badge: 'candiq Voice · Interaktive Produkt-Demo →',
    headline: {
      line1: 'Wir prüfen,',
      line2: 'wer wirklich was war.',
      line3: 'Mensch-geprüft. DSGVO-konform.',
    },
    subline: {
      intro:
        'Bevor Sie einstellen: Unsere Reviewer telefonieren mit den ehemaligen Arbeitgebern und dokumentieren jede Station. Diskrepanzen zur Eigenangabe werden markiert — Sie entscheiden auf Faktenbasis.',
      cta: 'und testen Sie unsere Voice-Demo im Browser.',
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

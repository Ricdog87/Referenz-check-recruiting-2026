// Marketing-relevante Konstanten. Single source of truth für externe Links.

// Booking-Funnel läuft über unsere /termin-Page (candiq-Branded Wrapper
// um das HubSpot-Meeting r-serrano/candiq-demo). Dort steckt der iframe-
// Embed — Marken-Kontext bleibt während des gesamten Funnels candiq.
export const BOOKING_URL = '/termin'

// Direkter HubSpot-Link — nur für E-Mail-Signatur o.ä., wenn die
// candiq-Wrap-Seite umgangen werden soll.
export const BOOKING_URL_RAW =
  'https://meetings-eu1.hubspot.com/r-serrano/candiq-demo'

export const BOOKING_LABEL = 'Termin buchen'
export const BOOKING_LABEL_LONG = 'Termin für Testzugang buchen'

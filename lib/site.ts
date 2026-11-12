// Marketing-relevante Konstanten. Single source of truth für externe Links.

import { isAppAccessEnabled } from './flags'

// Booking-Funnel läuft über unsere /termin-Page (candiq-Branded Wrapper
// um das HubSpot-Meeting r-serrano/candiq-demo). Dort steckt der iframe-
// Embed — Marken-Kontext bleibt während des gesamten Funnels candiq.
export const BOOKING_URL = '/termin'

// Direkter HubSpot-Link — nur für E-Mail-Signatur o.ä., wenn die
// candiq-Wrap-Seite umgangen werden soll.
export const BOOKING_URL_RAW =
  'https://meetings-eu1.hubspot.com/r-serrano/candiq-demo'

// Registrierung, Login und Dashboard sind nur bei offenem App-Zugang
// erreichbar (NEXT_PUBLIC_APP_ACCESS_ENABLED). Marketing-Komponenten blenden
// ihre Konto-Links darüber ein bzw. aus.
export const APP_ACCESS_OPEN = isAppAccessEnabled()

// Einstieg für Personaldienstleister: Selbst-Registrierung, solange der
// App-Zugang offen ist — sonst der Termin-Funnel.
export const PDL_ENTRY_URL = APP_ACCESS_OPEN
  ? '/register?type=RECRUITMENT_AGENCY'
  : BOOKING_URL

export const BOOKING_LABEL = 'Termin buchen'
export const BOOKING_LABEL_LONG = 'Termin für Testzugang buchen'

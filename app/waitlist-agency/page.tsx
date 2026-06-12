import { redirect } from 'next/navigation'

/**
 * Die Closed-Beta-Warteliste fuer Personaldienstleister ist seit
 * 06/2026 obsolet — PDL-Konten sind ab sofort regulaer registrierbar.
 * Diese Seite leitet daher 308-permanent auf das Registrierungs-
 * Formular mit vor-ausgewaehltem PDL-Typ um.
 *
 * Vorteil dieser Loesung: alte URLs aus Footer-Caches, Google-Index
 * und Mail-Signaturen landen weiterhin im richtigen Funnel statt 404.
 */
export default function AgencyWaitlistRedirectPage() {
  redirect('/register?type=RECRUITMENT_AGENCY')
}

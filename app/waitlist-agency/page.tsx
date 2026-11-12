import { redirect } from 'next/navigation'
import { PDL_ENTRY_URL } from '@/lib/site'

/**
 * Die Closed-Beta-Warteliste für Personaldienstleister ist seit 06/2026
 * obsolet. Diese Seite leitet auf den aktuellen PDL-Einstieg um: das
 * Registrierungs-Formular mit vor-ausgewähltem PDL-Typ, solange der
 * App-Zugang offen ist — sonst auf die Terminbuchung.
 *
 * Vorteil dieser Lösung: alte URLs aus Footer-Caches, Google-Index
 * und Mail-Signaturen landen weiterhin im richtigen Funnel statt 404.
 */
export default function AgencyWaitlistRedirectPage() {
  redirect(PDL_ENTRY_URL)
}

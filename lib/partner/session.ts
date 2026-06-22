/**
 * Server-side Helper für die Partner-Session.
 *
 * Nutzungsbeispiel:
 *
 *   import { requireApprovedPartner } from '@/lib/partner/session'
 *
 *   export default async function PartnerDashboardPage() {
 *     const partner = await requireApprovedPartner()  // redirected wenn nicht eingeloggt / nicht approved
 *     // … nutze partner.id für withPartnerScope()
 *   }
 */

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { partnerAuthOptions } from '@/lib/partner/auth'

export type PartnerSession = {
  id: string
  email: string
  name: string
  status: string
  tier: string
}

/**
 * Liest die aktuelle Partner-Session. Gibt `null` zurück, wenn der
 * Browser keinen gültigen Partner-Session-Cookie hat.
 *
 * Diese Funktion macht KEINE Status-Prüfung — sie sagt nur, ob der
 * Browser einen gültigen Cookie für einen *existierenden* PartnerAccount
 * hat. Status (PENDING/APPROVED/SUSPENDED) prüft requireApprovedPartner().
 */
export async function getPartnerSession(): Promise<PartnerSession | null> {
  const session = await getServerSession(partnerAuthOptions)
  if (!session?.partner?.id) return null
  return session.partner
}

/**
 * Guard für Routen, die einen eingeloggten Partner-Account brauchen,
 * unabhängig vom Status. Redirected auf /partner/login wenn nicht eingeloggt.
 *
 * Sinnvoll für /partner/dashboard/status (zeigt "deine Bewerbung wird geprüft")
 * — der Partner soll auch im PENDING-Zustand seinen Status sehen können.
 */
export async function requirePartnerSession(): Promise<PartnerSession> {
  const session = await getPartnerSession()
  if (!session) redirect('/partner/login')
  return session
}

/**
 * Guard für ALLE Reseller-Funktionen (Mandanten anlegen, EK sehen,
 * Pricing-Overrides editieren). Stellt sicher, dass der Partner
 * vom Admin freigegeben ist.
 *
 *   PENDING    → /partner/pending (Hinweis-Seite)
 *   APPROVED   → durchlässig
 *   SUSPENDED  → Auth verweigert sowieso schon den Login,
 *                aber zur Sicherheit: zurück auf Login
 *   REJECTED   → analog SUSPENDED
 */
export async function requireApprovedPartner(): Promise<PartnerSession> {
  const session = await requirePartnerSession()
  if (session.status === 'PENDING') redirect('/partner/pending')
  if (session.status !== 'APPROVED') redirect('/partner/login')
  return session
}

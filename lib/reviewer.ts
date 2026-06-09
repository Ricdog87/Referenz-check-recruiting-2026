import type { Session } from 'next-auth'

/**
 * Reviewer-Rollen.
 *
 * Das `role`-Feld existiert bereits im User-Schema (default 'CLIENT') und wird
 * via lib/auth.ts in JWT + Session gespiegelt. Wir gaten den Reviewer-Bereich
 * gegen diese Rollen — KEIN userId-Filter, denn geschulte Reviewer arbeiten
 * workspace-übergreifend.
 */
export const REVIEWER_ROLES = ['REVIEWER', 'ADMIN'] as const

export function isReviewer(session: Session | null | undefined): boolean {
  const role = session?.user?.role
  return role === 'REVIEWER' || role === 'ADMIN'
}


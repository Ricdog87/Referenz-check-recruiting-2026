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

// ── SLA-Tracking ────────────────────────────────────────────────────────
// Wir versprechen Kunden 24h fuer Reviewer-Pruefungen. Diese Helper
// erzeugen Badges + Farben fuer Queue und Dashboard aus dem Abstand
// zwischen "im Review seit" (= ReferenceCheck.updatedAt) und jetzt.
export const SLA_HOURS = 24
const SLA_WARN_HOURS = 18 // ab dann orange „Achtung"

export type SlaState = 'fresh' | 'warn' | 'breached'

export function slaState(updatedAt: Date, now: Date = new Date()): {
  state: SlaState
  hoursInQueue: number
  hoursLeft: number
} {
  const diffMs = now.getTime() - updatedAt.getTime()
  const hoursInQueue = Math.max(0, diffMs / 3600_000)
  const hoursLeft = SLA_HOURS - hoursInQueue
  let state: SlaState = 'fresh'
  if (hoursInQueue >= SLA_HOURS) state = 'breached'
  else if (hoursInQueue >= SLA_WARN_HOURS) state = 'warn'
  return { state, hoursInQueue, hoursLeft }
}

export function formatHoursShort(h: number): string {
  if (h < 1) return `${Math.round(h * 60)} Min`
  if (h < 24) return `${Math.round(h)} h`
  const d = Math.floor(h / 24)
  const rest = Math.round(h - d * 24)
  return rest > 0 ? `${d} T ${rest} h` : `${d} T`
}


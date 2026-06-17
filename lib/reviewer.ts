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

// Nur ADMINs sehen /admin/** (Kundenliste, Drill-Down).
// REVIEWER sind absichtlich ausgeschlossen — Kunden-Stammdaten und Plan-Status
// sind Sales/Support-Daten, kein Reviewer-Anwendungsfall.
export function isAdmin(session: Session | null | undefined): boolean {
  return session?.user?.role === 'ADMIN'
}

// ── SLA-Tracking ────────────────────────────────────────────────────────
// Wir versprechen Kunden 24h fuer Reviewer-Pruefungen — bei Express-24h-
// Add-on (€29 Aufpreis) wird die Frist halbiert auf 12h. Helper liefern
// Badge-Farben fuer Queue und Dashboard aus dem Abstand zwischen
// "im Review seit" (= ReferenceCheck.updatedAt) und jetzt.
export const SLA_HOURS = 24
const SLA_WARN_HOURS = 18 // ab dann orange „Achtung"
export const SLA_HOURS_EXPRESS = 12
const SLA_WARN_HOURS_EXPRESS = 8

export type SlaState = 'fresh' | 'warn' | 'breached'

export function slaState(
  updatedAt: Date,
  opts: { isExpress?: boolean } = {},
  now: Date = new Date(),
): { state: SlaState; hoursInQueue: number; hoursLeft: number; slaHours: number } {
  const slaHours = opts.isExpress ? SLA_HOURS_EXPRESS : SLA_HOURS
  const warnHours = opts.isExpress ? SLA_WARN_HOURS_EXPRESS : SLA_WARN_HOURS
  const diffMs = now.getTime() - updatedAt.getTime()
  const hoursInQueue = Math.max(0, diffMs / 3600_000)
  const hoursLeft = slaHours - hoursInQueue
  let state: SlaState = 'fresh'
  if (hoursInQueue >= slaHours) state = 'breached'
  else if (hoursInQueue >= warnHours) state = 'warn'
  return { state, hoursInQueue, hoursLeft, slaHours }
}

export function formatHoursShort(h: number): string {
  if (h < 1) return `${Math.round(h * 60)} Min`
  if (h < 24) return `${Math.round(h)} h`
  const d = Math.floor(h / 24)
  const rest = Math.round(h - d * 24)
  return rest > 0 ? `${d} T ${rest} h` : `${d} T`
}


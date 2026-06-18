'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Users, CheckCircle2 } from 'lucide-react'

type Slots = { max: number; used: number; remaining: number; full: boolean; degraded?: boolean }

/**
 * Scarcity-Counter für das Pilot-Programm. Liest die echte Slot-Belegung
 * aus /api/pilot-application/slots und rendert je nach Stand drei
 * visuell unterschiedliche Zustaende:
 *
 * - voll:        rot, "Programm geschlossen" + Warteliste-CTA
 * - knapp (<=3): amber, blinkender Live-Punkt, "Nur noch X Slots"
 * - offen:       gruen, neutral, "X von Y Slots verfuegbar"
 *
 * Skeleton waehrend des Fetches verhindert Layout-Shift.
 */
export function PilotSlotCounter() {
  const [slots, setSlots] = useState<Slots | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    fetch('/api/pilot-application/slots', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Slots) => { if (alive) setSlots(d) })
      .catch(() => { if (alive) setError(true) })
    return () => { alive = false }
  }, [])

  if (error) return null
  if (!slots) {
    // Skeleton — gleiche Hoehe wie der gerenderte Counter
    return (
      <div aria-hidden className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-bg-secondary border border-border h-9 w-56 animate-pulse" />
    )
  }

  const { max, used, remaining, full } = slots
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0

  if (full) {
    return (
      <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-sm font-semibold">
        <CheckCircle2 className="w-4 h-4" />
        Pilot-Programm aktuell ausgebucht — Warteliste offen
      </div>
    )
  }

  const tight = remaining <= 3
  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-semibold border ${
        tight
          ? 'bg-amber-50 text-amber-800 border-amber-200'
          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
      }`}>
        {tight ? (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600" />
          </span>
        ) : (
          <Users className="w-4 h-4" />
        )}
        {tight
          ? `Nur noch ${remaining} ${remaining === 1 ? 'Pilot-Slot' : 'Pilot-Slots'} frei`
          : `${remaining} von ${max} Pilot-Slots verfügbar`}
      </div>
      {/* Fortschrittsbalken — visualisiert wie voll das Programm ist */}
      <div className="w-56 h-1.5 rounded-full bg-bg-secondary border border-border overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            tight ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-emerald-400 to-emerald-600'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-[11px] text-text-muted">
        <Sparkles className="w-3 h-3 inline-block mr-1" />
        {used} / {max} Plätze vergeben
      </div>
    </div>
  )
}

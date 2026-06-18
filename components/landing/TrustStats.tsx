'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, Users, Sparkles, Server } from 'lucide-react'

type Slots = {
  max: number
  used: number
  remaining: number
  full: boolean
  pipeline: number
  degraded?: boolean
}

/**
 * Live-Trust-Stats — vier echte Datenpunkte statt anonyme Zielgruppen-
 * Marquee. Drei davon kommen aus der DB (Pilot-Slot-API), einer ist
 * statisch (Server-Standort).
 *
 * Marketing-Logik: keine erfundenen Logos, keine "trusted by 10k+
 * companies"-Bullshit-Zahlen. Stattdessen Pilot-Counter + Pipeline-
 * Zahl als ehrliches "Knappheit + Traction"-Signal.
 *
 * Bei DB-Ausfall (degraded) blenden wir die Live-Stats aus, statt
 * irreführende Nullen zu zeigen.
 */
export function TrustStats() {
  const [slots, setSlots] = useState<Slots | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/pilot-application/slots', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Slots) => setSlots(d))
      .catch(() => setError(true))
  }, [])

  // Bei Fehler oder degraded-DB: nur die statischen Vertrauens-Signale
  const showLiveStats = !error && slots && !slots.degraded

  const stats = [
    showLiveStats && slots
      ? {
          icon: Sparkles,
          k: `${slots.remaining} / ${slots.max}`,
          // Knappheits-Frame statt "vergeben"-Frame: 10/10 frei liest sich
          // marketing-staerker als 0/10 vergeben.
          v: slots.remaining === 0 ? 'Programm aktuell voll' : 'Pilot-Slots verfügbar',
          accent: slots.remaining <= 3 ? ('amber' as const) : ('emerald' as const),
        }
      : null,
    showLiveStats && slots && slots.pipeline > 0
      ? {
          icon: Users,
          k: slots.pipeline.toString(),
          v: slots.pipeline === 1 ? 'Bewerbung in Pipeline' : 'Bewerbungen in Pipeline',
          accent: 'indigo' as const,
        }
      : null,
    {
      icon: Server,
      k: 'Server in DE',
      v: 'EU-Hosting, keine Drittland-Übermittlung',
      accent: 'brand' as const,
    },
    {
      icon: ShieldCheck,
      k: 'DSGVO',
      v: 'AVV ab Tag 1, Audit-Trail inklusive',
      accent: 'emerald' as const,
    },
  ].filter((s): s is NonNullable<typeof s> => s !== null)

  const accentClasses: Record<'amber' | 'indigo' | 'brand' | 'emerald', { bg: string; text: string; border: string }> = {
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    brand: { bg: 'bg-brand-50', text: 'text-brand-700', border: 'border-brand-200' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl mx-auto">
      {stats.map(({ icon: Icon, k, v, accent }) => {
        const c = accentClasses[accent]
        return (
          <div
            key={v}
            className={`card-md text-left flex items-start gap-3 ${c.bg} ${c.border}`}
          >
            <div className={`w-9 h-9 rounded-xl bg-white border ${c.border} flex items-center justify-center ${c.text} shrink-0`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className={`text-lg font-bold ${c.text} leading-none tabular-nums`}>{k}</div>
              <div className="text-xs text-text-muted mt-1.5 leading-snug">{v}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

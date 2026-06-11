import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_PILOT_SLOTS = parseInt(process.env.PILOT_PROGRAM_MAX_SLOTS ?? '10', 10)

/**
 * GET /api/pilot-application/slots
 *
 * Oeffentlicher Read-Only-Endpunkt fuer den Scarcity-Counter auf der
 * Pilot-Programm-Seite. Antwortet mit der aktuellen Slot-Belegung:
 *
 * { max: 10, used: 3, remaining: 7, full: false }
 *
 * Belegt = Status ACCEPTED. PENDING-Bewerbungen zaehlen NICHT als
 * belegter Slot — der echte Knappheits-Signal entsteht erst durch
 * Annahme. Cache-Control auf 60s, sodass kurzfristige Lastspitzen
 * nicht jede Anfrage gegen die DB hauen.
 */
export async function GET() {
  let used = 0
  try {
    used = await prisma.pilotApplication.count({ where: { status: 'ACCEPTED' } })
  } catch (err) {
    // DB-Ausfall: konservativer Default (Programm offen, Counter neutral).
    // Pilot-Seite zeigt dann nur den Max-Wert ohne aktuelle Belegung —
    // weniger Conversion-Signal, aber kein 500 fuer den Besucher.
    console.error('pilot_slots_count_failed', err)
    return NextResponse.json(
      { max: MAX_PILOT_SLOTS, used: 0, remaining: MAX_PILOT_SLOTS, full: false, degraded: true },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  const remaining = Math.max(0, MAX_PILOT_SLOTS - used)
  return NextResponse.json(
    { max: MAX_PILOT_SLOTS, used, remaining, full: remaining === 0 },
    { status: 200, headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' } },
  )
}

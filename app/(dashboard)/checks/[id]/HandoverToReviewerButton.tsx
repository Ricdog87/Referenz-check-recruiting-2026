'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Loader2 } from 'lucide-react'

/**
 * HR-Übergabe an den Reviewer-Pool.
 * Setzt die Prüfung auf IN_REVIEW → sie erscheint in /reviewer/queue.
 * Wird im Header der HR-Check-Detailseite gerendert.
 */
export function HandoverToReviewerButton({ checkId, status }: { checkId: string; status: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  // Optimistic local state: wenn Server-Update durch ist, sofort auf "Im Review"
  // schalten — wir warten nicht darauf, dass router.refresh() den Server-
  // Component re-mountet. Andernfalls bleibt der Button-Spinner haengen.
  const [localStatus, setLocalStatus] = useState(status)

  if (localStatus === 'IN_REVIEW') {
    return <span className="badge bg-amber-50 text-amber-700 border border-amber-200 text-sm py-1 px-3">Im Review</span>
  }
  // Nach Abschluss keine erneute Übergabe.
  if (localStatus === 'COMPLETED') return null

  async function handover() {
    if (!confirm('Prüfung an den Reviewer-Pool übergeben? Ein geschulter Reviewer übernimmt Gespräch & Freigabe.')) return
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch(`/api/checks/${checkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_REVIEW' }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `Übergabe fehlgeschlagen (HTTP ${res.status}).`)
      }
      // Optimistic: lokal sofort auf IN_REVIEW. Damit verschwindet der Button
      // und das Badge erscheint — ohne auf den Server-Refresh zu warten.
      setLocalStatus('IN_REVIEW')
      router.refresh()
    } catch (e: any) {
      console.error('[handover:fail]', e)
      setErr(e?.message ?? 'Übergabe fehlgeschlagen. Bitte erneut versuchen.')
    } finally {
      // WICHTIG: in finally, damit der Spinner NIE haengen bleibt — egal ob
      // Success oder Failure. (Bug bis 2026-06-16: setLoading(false) war nur
      // im catch-Pfad, dadurch fror der Button nach erfolgreichem PATCH ein.)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={handover} disabled={loading} className="btn-primary inline-flex items-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
        {loading ? 'Übergebe…' : 'An Reviewer übergeben'}
      </button>
      {err && <span className="text-xs text-rose-600">{err}</span>}
    </div>
  )
}


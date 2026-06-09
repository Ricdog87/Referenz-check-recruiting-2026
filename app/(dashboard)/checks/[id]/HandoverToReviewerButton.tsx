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

  if (status === 'IN_REVIEW') {
    return <span className="badge bg-amber-50 text-amber-700 border border-amber-200 text-sm py-1 px-3">Im Review</span>
  }
  // Nach Abschluss keine erneute Übergabe.
  if (status === 'COMPLETED') return null

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
      if (!res.ok) throw new Error((await res.json()).error ?? 'Übergabe fehlgeschlagen.')
      router.refresh()
    } catch (e: any) {
      setErr(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={handover} disabled={loading} className="btn-primary">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
        An Reviewer übergeben
      </button>
      {err && <span className="text-xs text-rose-600">{err}</span>}
    </div>
  )
}


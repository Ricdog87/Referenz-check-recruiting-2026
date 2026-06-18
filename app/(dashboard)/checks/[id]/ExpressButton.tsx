'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Zap, Loader2, CheckCircle2 } from 'lucide-react'

type Props = {
  checkId: string
  isExpress: boolean
  status: string
}

// Express-24h ist nicht mehr buchbar, wenn die Prüfung schon final ist —
// dann waere der Aufpreis wirkungslos.
const TERMINAL_STATUSES = ['COMPLETED', 'FAILED']

export function ExpressButton({ checkId, isExpress, status }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Stripe-Success-Redirect: ?express=ok → Toast + URL bereinigen.
  const expressFlag = searchParams.get('express')

  if (isExpress) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">
        <Zap className="w-3.5 h-3.5 fill-rose-700" />
        Express 24h aktiv
      </span>
    )
  }

  if (TERMINAL_STATUSES.includes(status)) {
    return null
  }

  async function book() {
    if (loading) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: 'EXPRESS_24H', checkId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.checkoutUrl) {
        setError(data?.error ?? 'Buchung fehlgeschlagen.')
        setLoading(false)
        return
      }
      window.location.assign(data.checkoutUrl)
    } catch {
      setError('Verbindungsfehler. Bitte erneut versuchen.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {expressFlag === 'ok' ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Express aktiviert — Webhook in wenigen Sekunden
        </span>
      ) : null}
      <button
        type="button"
        onClick={book}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-sm font-semibold transition-colors disabled:opacity-60"
        title="Bearbeitung in unter 24h, Eskalation an Senior-Reviewer"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
        Express 24h · €29
      </button>
      {error ? (
        <span className="text-[11px] text-rose-700">{error}</span>
      ) : null}
    </div>
  )
}

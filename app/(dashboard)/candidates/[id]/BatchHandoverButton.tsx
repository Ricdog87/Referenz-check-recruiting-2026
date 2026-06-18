'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Loader2 } from 'lucide-react'

/**
 * Sammelübergabe aller offenen Prüfungen eines Kandidaten an den
 * Reviewer-Pool. Ein Klick statt N Einzelübergaben auf N Check-Seiten.
 * Wird nur angezeigt, wenn es >=1 offene Prüfung (OPEN/IN_PROGRESS) gibt.
 */
export function BatchHandoverButton({
  candidateId,
  openCount,
}: {
  candidateId: string
  openCount: number
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (openCount === 0) return null

  async function handover() {
    if (
      !confirm(
        `${openCount} offene Referenz${openCount > 1 ? 'en' : ''} an den Reviewer-Pool übergeben? Ein geschulter Reviewer uebernimmt Gespraech & Freigabe.`,
      )
    )
      return
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch(`/api/candidates/${candidateId}/handover`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `Übergabe fehlgeschlagen (HTTP ${res.status}).`)
      }
      router.refresh()
    } catch (e: any) {
      setErr(e?.message ?? 'Übergabe fehlgeschlagen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handover}
        disabled={loading}
        className="btn-primary text-xs inline-flex items-center gap-1.5"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
        {loading
          ? 'Übergebe…'
          : `${openCount} Referenz${openCount > 1 ? 'en' : ''} prüfen lassen`}
      </button>
      {err && <span className="text-xs text-rose-600">{err}</span>}
    </div>
  )
}

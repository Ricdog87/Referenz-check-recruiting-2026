'use client'

import { useState } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'

export function BillingPortalButton() {
  const [loading, setLoading] = useState(false)

  async function openPortal() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        alert(data?.error ?? 'Portal konnte nicht geöffnet werden.')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      alert('Netzwerkfehler. Bitte erneut versuchen.')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={openPortal}
      disabled={loading}
      className="btn-primary inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Lädt…
        </>
      ) : (
        <>
          Abo verwalten <ExternalLink className="w-4 h-4" />
        </>
      )}
    </button>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { APP_ACCESS_OPEN, BOOKING_LABEL, BOOKING_URL } from '@/lib/site'

type Plan = 'starter' | 'professional' | 'business'
type Interval = 'monthly' | 'yearly'

export function PricingCTA({
  plan,
  interval,
  highlight,
}: {
  plan: Plan
  interval: Interval
  highlight?: boolean
}) {
  const { status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function startCheckout() {
    if (status !== 'authenticated') {
      // Nicht eingeloggt → Konto erstellen, dann zurück auf /preise
      router.push(`/register?next=/preise`)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, interval }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        alert(data?.error ?? 'Checkout konnte nicht gestartet werden.')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch (err) {
      alert('Netzwerkfehler. Bitte erneut versuchen.')
      setLoading(false)
    }
  }

  const label =
    status === 'authenticated' ? 'Plan auswählen' : 'Konto erstellen'

  const className = `w-full inline-flex items-center justify-center gap-2 py-3 rounded-full font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-wait ${
    highlight
      ? 'bg-white text-brand-700 hover:bg-bg-secondary'
      : 'btn-primary'
  }`

  // App-Zugang geschlossen: kein Konto, kein Self-Checkout — Pakete werden
  // im Termin gebucht.
  if (!APP_ACCESS_OPEN) {
    return (
      <Link href={BOOKING_URL} className={className}>
        {BOOKING_LABEL}
        <ArrowRight className="w-4 h-4" />
      </Link>
    )
  }

  return (
    <button
      onClick={startCheckout}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Lädt…
        </>
      ) : (
        <>
          {label}
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  )
}

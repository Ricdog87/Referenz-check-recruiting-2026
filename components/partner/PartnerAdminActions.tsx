'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Pause, Play, Loader2 } from 'lucide-react'

type Action = 'approve' | 'reject' | 'suspend' | 'reactivate'

export function PartnerAdminActions({ partnerId, status }: { partnerId: string; status: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState<Action | null>(null)
  const [error, setError] = useState('')

  async function run(action: Action, needsReason: boolean) {
    let reason: string | null = null
    if (needsReason) {
      // Browser-Prompt — pragmatisch für eine Admin-Liste, kein Marketing-Polish nötig.
      reason = window.prompt(`Begründung für ${action.toUpperCase()} (wird dem Partner mitgeteilt, optional):`)
      if (reason === null) return // User hat abgebrochen
    }
    setBusy(action)
    setError('')
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: reason ? JSON.stringify({ reason: reason.trim() }) : undefined,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Aktion fehlgeschlagen.')
        setBusy(null)
        return
      }
      startTransition(() => {
        router.refresh()
      })
    } catch {
      setError('Netzwerk-Fehler.')
    } finally {
      setBusy(null)
    }
  }

  const isPending = status === 'PENDING'
  const isApproved = status === 'APPROVED'
  const isSuspended = status === 'SUSPENDED'

  return (
    <div className="flex flex-col gap-1.5 items-end">
      <div className="flex gap-1.5">
        {isPending && (
          <>
            <Btn
              icon={busy === 'approve' || pending ? Loader2 : Check}
              spin={busy === 'approve'}
              label="Freigeben"
              variant="primary"
              onClick={() => run('approve', false)}
              disabled={!!busy}
            />
            <Btn
              icon={busy === 'reject' ? Loader2 : X}
              spin={busy === 'reject'}
              label="Ablehnen"
              variant="danger"
              onClick={() => run('reject', true)}
              disabled={!!busy}
            />
          </>
        )}
        {isApproved && (
          <Btn
            icon={busy === 'suspend' ? Loader2 : Pause}
            spin={busy === 'suspend'}
            label="Pausieren"
            variant="danger"
            onClick={() => run('suspend', true)}
            disabled={!!busy}
          />
        )}
        {isSuspended && (
          <Btn
            icon={busy === 'reactivate' ? Loader2 : Play}
            spin={busy === 'reactivate'}
            label="Reaktivieren"
            variant="primary"
            onClick={() => run('reactivate', false)}
            disabled={!!busy}
          />
        )}
      </div>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  )
}

function Btn(props: {
  icon: React.ComponentType<{ className?: string }>
  spin?: boolean
  label: string
  variant: 'primary' | 'danger'
  onClick: () => void
  disabled?: boolean
}) {
  const Icon = props.icon
  const cls =
    props.variant === 'primary'
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
      : 'bg-white border border-red-200 text-red-700 hover:bg-red-50'
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 ${cls}`}
    >
      <Icon className={`w-3.5 h-3.5 ${props.spin ? 'animate-spin' : ''}`} />
      {props.label}
    </button>
  )
}

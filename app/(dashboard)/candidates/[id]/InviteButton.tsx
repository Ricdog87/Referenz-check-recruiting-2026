'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Check, Clock, AlertCircle } from 'lucide-react'

type ConsentSummary = {
  hasActive: boolean
  status: 'NONE' | 'PENDING_ACCEPT' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED'
  expiresAt?: string
  acceptedAt?: string
  sentAt?: string
}

export function InviteButton({
  candidateId,
  candidateEmail,
  initialConsent,
}: {
  candidateId: string
  candidateEmail: string | null
  initialConsent: ConsentSummary
}) {
  const router = useRouter()
  const [consent, setConsent] = useState(initialConsent)
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null)

  async function invite() {
    if (!candidateEmail) {
      setToast({ kind: 'error', msg: 'Kandidat hat keine E-Mail-Adresse hinterlegt.' })
      setTimeout(() => setToast(null), 4000)
      return
    }
    setSending(true)
    try {
      const res = await fetch(`/api/candidates/${candidateId}/invite`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Versand fehlgeschlagen.')
      setConsent({
        hasActive: true,
        status: 'PENDING_ACCEPT',
        expiresAt: data.expiresAt,
        sentAt: new Date().toISOString(),
      })
      const providerLabel = data.provider === 'resend' ? 'E-Mail versendet' : 'Einladung erstellt (Dev-Modus: kein E-Mail-Provider)'
      setToast({ kind: 'success', msg: providerLabel })
      setTimeout(() => setToast(null), 4500)
      router.refresh()
    } catch (e: any) {
      setToast({ kind: 'error', msg: e?.message ?? 'Unbekannter Fehler.' })
      setTimeout(() => setToast(null), 5000)
    } finally {
      setSending(false)
    }
  }

  // ── Bereits Einwilligung erteilt ──────────────────────────────
  if (consent.status === 'ACCEPTED') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
        <Check className="w-3.5 h-3.5" />
        Einwilligung erteilt
        {consent.acceptedAt && (
          <span className="text-emerald-600 font-normal">
            · {new Date(consent.acceptedAt).toLocaleDateString('de-DE')}
          </span>
        )}
      </div>
    )
  }

  // ── Widerrufen ────────────────────────────────────────────────
  if (consent.status === 'REVOKED') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
        <AlertCircle className="w-3.5 h-3.5" />
        Einwilligung widerrufen
      </div>
    )
  }

  // ── Pending — Einladung läuft ────────────────────────────────
  if (consent.status === 'PENDING_ACCEPT') {
    return (
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
          <Clock className="w-3.5 h-3.5" />
          Auf Einwilligung wartend
        </div>
        <button
          onClick={invite}
          disabled={sending}
          className="text-xs text-text-secondary hover:text-text-primary underline disabled:opacity-50"
          title="Erneut senden"
        >
          {sending ? 'sendet…' : 'Erneut senden'}
        </button>
        {toast && (
          <span className={`text-xs ${toast.kind === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {toast.msg}
          </span>
        )}
      </div>
    )
  }

  // ── Default: noch keine Einladung — Primär-Button ─────────────
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={invite}
        disabled={sending}
        className="btn-secondary text-sm py-2 px-3 disabled:opacity-60 inline-flex items-center gap-1.5"
        title={candidateEmail ? 'DSGVO-konforme Einwilligungs-Mail an Bewerber senden' : 'Kandidat hat keine E-Mail'}
      >
        <Send className="w-4 h-4" />
        {sending ? 'Wird gesendet…' : 'Einwilligung anfordern'}
      </button>
      {toast && (
        <div
          className={`text-xs font-medium px-3 py-1.5 rounded-full ${
            toast.kind === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}

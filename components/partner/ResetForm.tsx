'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'

export function PartnerResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  if (!token) {
    return (
      <div className="card-md text-center max-w-sm mx-auto">
        <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
        <p className="text-sm text-text-secondary leading-relaxed">
          Der Link ist unvollständig. Bitte fordern Sie einen neuen Reset-Link an.
        </p>
        <Link
          href="/partner/forgot-password"
          className="inline-block mt-5 text-xs text-indigo-600 underline hover:text-indigo-700"
        >
          Neuen Link anfordern
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'submitting') return
    if (password !== confirm) {
      setStatus('error')
      setMessage('Die beiden Passwörter stimmen nicht überein.')
      return
    }
    setStatus('submitting')
    setMessage('')

    try {
      const res = await fetch('/api/partner/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(data.error ?? 'Passwort konnte nicht gesetzt werden.')
        return
      }
      setStatus('success')
      setMessage('Passwort gesetzt. Sie können sich jetzt einloggen.')
      setTimeout(() => router.push('/partner/login'), 2500)
    } catch {
      setStatus('error')
      setMessage('Netzwerk-Fehler. Bitte erneut versuchen.')
    }
  }

  if (status === 'success') {
    return (
      <div className="card-md text-center max-w-sm mx-auto">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
        <p className="text-sm text-text-secondary">{message}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
      <Field
        label="Neues Passwort (min. 10 Zeichen)"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        required
        minLength={10}
      />
      <Field
        label="Passwort wiederholen"
        type="password"
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
        required
        minLength={10}
      />

      {status === 'error' && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-text-primary text-white font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
      >
        {status === 'submitting' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Setze…
          </>
        ) : (
          <>
            Passwort setzen <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  )
}

function Field(props: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  autoComplete?: string
  minLength?: number
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-text-secondary mb-1.5 block">{props.label}</span>
      <input
        type={props.type ?? 'text'}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        required={props.required}
        autoComplete={props.autoComplete}
        minLength={props.minLength}
        className="w-full px-3 py-2.5 rounded-lg border border-border-default bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-sm"
      />
    </label>
  )
}

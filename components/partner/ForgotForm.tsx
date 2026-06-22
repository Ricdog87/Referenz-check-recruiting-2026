'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'

export function PartnerForgotForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setMessage('')

    try {
      const res = await fetch('/api/partner/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(data.error ?? 'Anfrage konnte nicht verarbeitet werden.')
        return
      }
      setStatus('success')
      setMessage('Wenn ein Account zu dieser E-Mail existiert, wurde ein Reset-Link versendet. Bitte prüfen Sie Ihr Postfach (auch Spam).')
    } catch {
      setStatus('error')
      setMessage('Netzwerk-Fehler. Bitte erneut versuchen.')
    }
  }

  if (status === 'success') {
    return (
      <div className="card-md text-center max-w-sm mx-auto">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
        <p className="text-sm text-text-secondary leading-relaxed">{message}</p>
        <Link
          href="/partner/login"
          className="inline-block mt-5 text-xs text-indigo-600 underline hover:text-indigo-700"
        >
          Zurück zum Login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
      <p className="text-sm text-text-secondary leading-relaxed">
        Geben Sie die E-Mail Ihres Partner-Accounts ein. Wir senden Ihnen einen
        Link zum Setzen eines neuen Passworts — gültig für 60 Minuten.
      </p>
      <label className="block">
        <span className="text-xs font-semibold text-text-secondary mb-1.5 block">E-Mail</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full px-3 py-2.5 rounded-lg border border-border-default bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-sm"
        />
      </label>

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
            <Loader2 className="w-4 h-4 animate-spin" /> Sende…
          </>
        ) : (
          <>
            Reset-Link anfordern <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  )
}

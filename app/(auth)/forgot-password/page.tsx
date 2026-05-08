'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError('')
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Bitte eine gültige E-Mail-Adresse eingeben.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Anfrage konnte nicht gesendet werden.')
        setLoading(false)
        return
      }
      setDone(true)
    } catch {
      setError('Verbindung fehlgeschlagen. Bitte erneut versuchen.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="animate-slide-up">
        <div className="card-lg shadow-card-md p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">E-Mail unterwegs</h1>
          <p className="text-sm text-text-secondary leading-relaxed mb-5">
            Falls für <span className="font-semibold text-text-primary">{email}</span> ein Konto besteht, haben wir
            soeben einen Reset-Link verschickt. Der Link ist <strong>60 Minuten</strong> gültig.
          </p>
          <p className="text-xs text-text-muted mb-5">
            Keine E-Mail erhalten? Schauen Sie kurz im Spam-Ordner — oder schreiben Sie uns an{' '}
            <a href="mailto:hello@candiq.de" className="text-brand-700 hover:underline">hello@candiq.de</a>.
          </p>
          <Link href="/login" className="text-sm text-text-secondary hover:text-text-primary inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Zurück zur Anmeldung
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">Passwort zurücksetzen</h1>
        <p className="text-text-secondary">Wir helfen Ihnen, schnell wieder Zugriff auf Ihr Konto zu bekommen.</p>
      </div>

      <div className="card-lg shadow-card-md p-6">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="label">E-Mail-Adresse Ihres Kontos</label>
            <input
              type="email"
              className="input-field"
              placeholder="firma@beispiel.de"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) setError('') }}
              required
              autoComplete="email"
              inputMode="email"
            />
          </div>

          {error && (
            <div role="alert" className="px-4 py-3 rounded-xl text-sm text-rose-700 bg-rose-50 border border-rose-200">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Wird gesendet…
              </span>
            ) : 'Anfrage senden'}
          </button>
        </form>

        <div className="mt-5 pt-5 border-t border-border text-center">
          <Link href="/login" className="text-sm text-text-secondary hover:text-text-primary inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Zurück zur Anmeldung
          </Link>
        </div>
      </div>

      <p className="text-[11px] text-text-muted text-center mt-5 leading-relaxed flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-emerald-600" />
        Aus Sicherheitsgründen geben wir nicht preis, ob ein Konto existiert.
      </p>
    </div>
  )
}

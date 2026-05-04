'use client'

import { Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'

type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string; tone: string }

function passwordStrength(pw: string): Strength {
  if (!pw) return { score: 0, label: '—', tone: 'bg-bg-tertiary' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++
  const map = [
    { label: 'Sehr schwach', tone: 'bg-rose-500' },
    { label: 'Schwach', tone: 'bg-rose-400' },
    { label: 'Okay', tone: 'bg-amber-500' },
    { label: 'Gut', tone: 'bg-emerald-500' },
    { label: 'Stark', tone: 'bg-emerald-600' },
  ] as const
  const cap = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4
  return { score: cap, ...map[cap] }
}

function ResetForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<{ email: string } | null>(null)

  const strength = useMemo(() => passwordStrength(password), [password])
  const passwordsMatch = !confirm || password === confirm

  if (!token) {
    return (
      <div className="card-lg shadow-card-md p-8 text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Ungültiger Link</h1>
        <p className="text-sm text-text-secondary mb-5">
          Dieser Reset-Link ist unvollständig. Bitte fordern Sie einen neuen Link an.
        </p>
        <Link href="/forgot-password" className="btn-primary inline-flex">
          Neuen Reset anfordern
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    if (password.length < 8) { setError('Passwort muss mindestens 8 Zeichen haben.'); return }
    if (password !== confirm) { setError('Passwörter stimmen nicht überein.'); return }

    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Reset fehlgeschlagen. Bitte neuen Link anfordern.')
        setLoading(false)
        return
      }
      setDone({ email: data.email })

      // Auto-Sign-In direkt nach erfolgreichem Reset
      await signIn('credentials', { email: data.email, password, redirect: false })
        .then((res) => {
          if (!res?.error) {
            router.push('/dashboard')
            router.refresh()
          }
        })
        .catch(() => {})
    } catch {
      setError('Verbindung fehlgeschlagen. Bitte erneut versuchen.')
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="card-lg shadow-card-md p-8 text-center">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Passwort gesetzt</h1>
        <p className="text-sm text-text-secondary mb-5">Sie werden gleich automatisch angemeldet…</p>
        <Link href="/login" className="text-sm text-text-secondary hover:text-text-primary inline-flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" /> Zur Anmeldung
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">Neues Passwort wählen</h1>
        <p className="text-text-secondary">Wählen Sie ein sicheres Passwort — danach werden Sie sofort angemeldet.</p>
      </div>

      <div className="card-lg shadow-card-md p-6">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="label">Neues Passwort</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="input-field pr-10"
                placeholder="Min. 8 Zeichen"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) setError('') }}
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text-primary"
                aria-label={showPw ? 'Passwort verbergen' : 'Passwort anzeigen'}>
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password && (
              <div className="mt-1.5">
                <div className="h-1 rounded-full bg-bg-tertiary overflow-hidden">
                  <div className={`h-full transition-all ${strength.tone}`} style={{ width: `${(strength.score / 4) * 100}%` }} />
                </div>
                <div className="text-[10px] text-text-muted mt-1">Stärke: {strength.label}</div>
              </div>
            )}
          </div>

          <div>
            <label className="label">Passwort bestätigen</label>
            <input
              type={showPw ? 'text' : 'password'}
              className={`input-field ${confirm && !passwordsMatch ? '!border-rose-300 focus:!ring-rose-500/20' : ''}`}
              placeholder="Wiederholen"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); if (error) setError('') }}
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
            />
            {confirm && !passwordsMatch && (
              <div className="text-[11px] text-rose-600 mt-1">Passwörter stimmen nicht überein.</div>
            )}
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
                Wird gespeichert…
              </span>
            ) : 'Passwort setzen & anmelden'}
          </button>
        </form>

        <div className="mt-5 pt-5 border-t border-border text-center">
          <Link href="/login" className="text-sm text-text-secondary hover:text-text-primary inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Zur Anmeldung
          </Link>
        </div>
      </div>

      <p className="text-[11px] text-text-muted text-center mt-5 leading-relaxed flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-emerald-600" />
        Reset-Link 60 Minuten gültig · ein Token, ein Reset
      </p>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-brand-600 animate-spin" /></div>}>
      <ResetForm />
    </Suspense>
  )
}

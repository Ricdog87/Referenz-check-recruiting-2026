'use client'

import { Suspense, useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')
  // Wir behalten den expliziten callbackUrl separat im Auge: nur wenn KEINER
  // gesetzt ist, redirecten wir role-basiert (Reviewer/Admin → /reviewer,
  // sonst /dashboard). Mit Deep-Link bleibt die Ziel-URL exakt erhalten.
  const explicitCallbackUrl = searchParams.get('callbackUrl')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError('')

    const cleanEmail = email.trim().toLowerCase()
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.')
      return
    }
    if (!password) {
      setError('Bitte geben Sie Ihr Passwort ein.')
      return
    }

    setLoading(true)
    try {
      const res = await signIn('credentials', {
        email: cleanEmail,
        password,
        redirect: false,
      })
      if (res?.error) {
        setError('E-Mail oder Passwort ungültig.')
        setLoading(false)
        return
      }
      let target = explicitCallbackUrl ?? '/dashboard'
      if (!explicitCallbackUrl) {
        const session = await getSession()
        const role = session?.user?.role
        if (role === 'REVIEWER' || role === 'ADMIN') target = '/reviewer'
      }
      router.push(target)
      router.refresh()
    } catch {
      setError('Anmeldung fehlgeschlagen. Bitte erneut versuchen.')
      setLoading(false)
    }
  }

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">Willkommen zurück</h1>
        <p className="text-text-secondary">Melden Sie sich in Ihrem candiq-Konto an</p>
      </div>

      {registered && (
        <div role="status" className="mb-4 px-4 py-3 rounded-xl text-sm text-emerald-700 bg-emerald-50 border border-emerald-200">
          Konto erstellt — bitte melden Sie sich jetzt an.
        </div>
      )}

      <div className="card-lg shadow-card-md p-6">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="label">E-Mail</label>
            <input
              type="email"
              className="input-field"
              placeholder="firma@beispiel.de"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) setError('') }}
              required
              autoComplete="email"
              inputMode="email"
              maxLength={254}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label !mb-0">Passwort</label>
              <Link href="/forgot-password" className="text-[11px] font-semibold text-brand-700 hover:text-brand-800">Passwort vergessen?</Link>
            </div>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="input-field pr-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) setError('') }}
                required
                autoComplete="current-password"
                maxLength={128}
              />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text-primary"
                aria-label={showPw ? 'Passwort verbergen' : 'Passwort anzeigen'}>
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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
                Anmelden…
              </span>
            ) : 'Anmelden'}
          </button>
        </form>

        <div className="mt-5 pt-5 border-t border-border text-center space-y-2">
          <p className="text-sm text-text-secondary">
            Noch kein Konto?{' '}
            <Link href="/register" className="text-brand-700 hover:text-brand-800 transition-colors font-semibold">
              Konto erstellen
            </Link>
          </p>
          <p className="text-xs text-text-muted">
            Testzugang gewünscht?{' '}
            <Link href="/termin" className="text-brand-700 hover:text-brand-800 font-semibold">
              15-Min-Termin buchen
            </Link>
          </p>
        </div>
      </div>

      <p className="text-[11px] text-text-muted text-center mt-5 leading-relaxed flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-emerald-600" />
        DSGVO-konform · Server in Deutschland ·{' '}
        <Link href="/datenschutz" className="underline hover:text-text-secondary">Datenschutz</Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-brand-600 animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  )
}

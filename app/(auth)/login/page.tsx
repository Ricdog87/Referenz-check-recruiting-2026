'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')
  const isDemo = searchParams.get('demo') === '1'

  const [email, setEmail] = useState(isDemo ? 'demo@refcheck.de' : '')
  const [password, setPassword] = useState(isDemo ? 'demo1234' : '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await signIn('credentials', {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      setError('E-Mail oder Passwort ungültig.')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {isDemo ? 'Demo testen' : 'Willkommen zurück'}
        </h1>
        <p className="text-sm text-white/40 mt-2">
          {isDemo
            ? 'Demo-Zugangsdaten sind bereits eingetragen'
            : 'Melden Sie sich in Ihrem RefCheck-Konto an'}
        </p>
      </div>

      {registered && (
        <div
          className="mb-4 px-4 py-3 rounded-xl text-sm text-status-success border border-status-success/20"
          style={{ background: 'rgba(48,209,88,0.08)' }}
        >
          Konto erfolgreich erstellt — bitte jetzt anmelden.
        </div>
      )}

      {isDemo && (
        <div
          className="mb-4 px-4 py-3 rounded-xl text-xs border"
          style={{
            background: 'rgba(10,132,255,0.07)',
            borderColor: 'rgba(10,132,255,0.2)',
          }}
        >
          <p className="text-accent font-medium mb-1">Demo-Konto</p>
          <p className="text-white/50">
            E-Mail: <span className="text-white/80 font-mono">demo@refcheck.de</span>
            {'  '}· Passwort: <span className="text-white/80 font-mono">demo1234</span>
          </p>
          <p className="text-white/30 mt-1">
            Das Demo-Konto enthält Beispieldaten zur Veranschaulichung.
          </p>
        </div>
      )}

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">E-Mail</label>
            <input
              type="email"
              className="input-field"
              placeholder="firma@beispiel.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus={!isDemo}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Passwort</label>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-[11px] text-text-muted hover:text-accent transition-colors"
              >
                Passwort vergessen?
              </button>
            </div>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div
              className="px-4 py-3 rounded-xl text-sm text-status-error border border-status-error/20"
              style={{ background: 'rgba(255,69,58,0.08)' }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 rounded-xl text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Anmelden…
              </span>
            ) : isDemo ? (
              'Demo öffnen →'
            ) : (
              'Anmelden'
            )}
          </button>
        </form>

        <div
          className="px-6 pb-5 text-center"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="text-sm text-white/35 pt-4">
            Noch kein Konto?{' '}
            <Link
              href="/register"
              className="text-accent hover:text-white transition-colors font-medium"
            >
              Kostenlos registrieren
            </Link>
          </p>
        </div>
      </div>

      <p className="text-[11px] text-white/20 text-center mt-5 leading-relaxed">
        Durch die Anmeldung stimmen Sie unserer{' '}
        <Link
          href="/datenschutz"
          className="underline hover:text-white/40 transition-colors"
        >
          Datenschutzerklärung
        </Link>{' '}
        zu.
      </p>

      {/* Forgot password modal */}
      {showForgot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowForgot(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{
              background: '#141414',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-white text-base">Passwort zurücksetzen</h2>
                <p className="text-xs text-white/40 mt-1">Wir helfen Ihnen schnell weiter.</p>
              </div>
              <button
                onClick={() => setShowForgot(false)}
                className="text-white/30 hover:text-white transition-colors text-xl leading-none mt-0.5"
              >
                ×
              </button>
            </div>

            <div
              className="rounded-xl p-4 space-y-2"
              style={{
                background: 'rgba(10,132,255,0.07)',
                border: '1px solid rgba(10,132,255,0.15)',
              }}
            >
              <p className="text-sm text-white/70 leading-relaxed">
                Schreiben Sie uns mit Ihrer registrierten E-Mail-Adresse:
              </p>
              <a
                href="mailto:support@refcheck.de?subject=Passwort zurücksetzen"
                className="block text-accent font-medium text-sm hover:underline"
              >
                support@refcheck.de
              </a>
              <p className="text-xs text-white/35">
                Wir setzen Ihr Passwort in der Regel innerhalb von 1 Werktag zurück.
              </p>
            </div>

            <button
              onClick={() => setShowForgot(false)}
              className="btn-secondary w-full text-sm py-2.5"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}

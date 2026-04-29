'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Loader2, Rocket, ShieldCheck } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await signIn('credentials', {
      email: email.trim(),
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
        <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">Willkommen zurück</h1>
        <p className="text-text-secondary">Melden Sie sich in Ihrem candiq-Konto an</p>
      </div>

      {registered && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm text-emerald-700 bg-emerald-50 border border-emerald-200">
          Konto erstellt — bitte anmelden.
        </div>
      )}

      {/* Demo CTA banner */}
      <Link
        href="/demo"
        className="flex items-center justify-between mb-5 px-4 py-4 rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-violet/5 hover:shadow-card transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#8b5cf6)', boxShadow: '0 4px 12px rgba(79,70,229,.2)' }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-text-primary">Live-Demo starten</div>
            <div className="text-xs text-text-secondary">3 Demoprofile · sofort · kein Konto nötig</div>
          </div>
        </div>
        <Rocket className="w-4 h-4 text-brand-600 group-hover:translate-x-1 transition-transform" />
      </Link>

      <div className="card-lg shadow-card-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
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
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label !mb-0">Passwort</label>
              <Link href="#" className="text-[11px] font-semibold text-brand-700 hover:text-brand-800">Passwort vergessen?</Link>
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
            <div className="px-4 py-3 rounded-xl text-sm text-rose-700 bg-rose-50 border border-rose-200">
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

        <div className="mt-5 pt-5 border-t border-border text-center">
          <p className="text-sm text-text-secondary">
            Noch kein Konto?{' '}
            <Link href="/register" className="text-brand-700 hover:text-brand-800 transition-colors font-semibold">
              Kostenlos registrieren
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

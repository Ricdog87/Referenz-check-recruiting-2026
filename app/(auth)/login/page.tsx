'use client'

import { Suspense, useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Building2, Loader2, ShieldCheck, Users2 } from 'lucide-react'

type DemoProfile = 'hr_basic' | 'hr_lead' | 'hr_exec'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')
  const demo = searchParams.get('demo')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState<DemoProfile | null>(null)
  const [demoHealthy, setDemoHealthy] = useState<boolean | null>(null)

  // Auto-trigger HR demo when ?demo=1 in URL
  useEffect(() => {
    if (demo === '1' && !demoLoading) {
      runDemo('hr_basic')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo])

  useEffect(() => {
    fetch('/api/demo')
      .then((r) => setDemoHealthy(r.ok))
      .catch(() => setDemoHealthy(false))
  }, [])

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

  async function runDemo(profile: DemoProfile) {
    setError('')
    setDemoLoading(profile)
    try {
      // Seed/refresh demo account, get credentials
      const seed = await fetch(`/api/demo?profile=${profile}`, { method: 'POST' })
      const data = await seed.json()
      if (!seed.ok) throw new Error(data.error || 'Demo konnte nicht geladen werden.')

      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (res?.error) throw new Error('Demo-Login fehlgeschlagen.')

      router.push('/dashboard')
      router.refresh()
    } catch (e: any) {
      setError(e.message || 'Demo nicht verfügbar.')
    } finally {
      setDemoLoading(null)
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

      {/* One-click demo cards */}
      <div className="card-lg shadow-card-md mb-5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-text-primary">Live-Demo (1 Klick)</span>
        </div>
        <p className="text-xs text-text-secondary mb-4 leading-relaxed">
          Direkt einsteigen — Demo-Account wird automatisch befüllt mit Beispiel-Kandidaten.
        </p>
        <div className="mb-3">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
            demoHealthy ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            {demoHealthy ? 'Demo-Service bereit' : 'Demo-Service wird geprüft'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => runDemo('hr_basic')}
            disabled={demoLoading !== null}
            className="group relative rounded-xl p-3.5 border border-border hover:border-brand-300 bg-white hover:bg-brand-50/40 transition-all disabled:opacity-50"
          >
            <Building2 className="w-5 h-5 text-brand-600 mb-2" />
            <div className="text-sm font-semibold text-text-primary text-left">HR</div>
            <div className="text-[10px] text-text-muted text-left">Manager</div>
            {demoLoading === 'hr_basic' && (
              <Loader2 className="absolute top-3 right-3 w-4 h-4 text-brand-600 animate-spin" />
            )}
          </button>

          <button
            onClick={() => runDemo('hr_lead')}
            disabled={demoLoading !== null}
            className="group relative rounded-xl p-3.5 border border-border hover:border-brand-300 bg-white hover:bg-brand-50/40 transition-all disabled:opacity-50"
          >
            <Users2 className="w-5 h-5 text-brand-600 mb-2" />
            <div className="text-sm font-semibold text-text-primary text-left">Lead</div>
            <div className="text-[10px] text-text-muted text-left">Teamleitung</div>
            {demoLoading === 'hr_lead' && (
              <Loader2 className="absolute top-3 right-3 w-4 h-4 text-brand-600 animate-spin" />
            )}
          </button>

          <button
            onClick={() => runDemo('hr_exec')}
            disabled={demoLoading !== null}
            className="group relative rounded-xl p-3.5 border border-border hover:border-brand-300 bg-white hover:bg-brand-50/40 transition-all disabled:opacity-50"
          >
            <Users2 className="w-5 h-5 text-brand-600 mb-2" />
            <div className="text-sm font-semibold text-text-primary text-left">Exec</div>
            <div className="text-[10px] text-text-muted text-left">Direktion</div>
            {demoLoading === 'hr_exec' && (
              <Loader2 className="absolute top-3 right-3 w-4 h-4 text-brand-600 animate-spin" />
            )}
          </button>
        </div>
      </div>

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

      <p className="text-[11px] text-text-muted text-center mt-5 leading-relaxed">
        Durch die Anmeldung stimmen Sie unserer{' '}
        <Link href="/datenschutz" className="underline hover:text-text-secondary">Datenschutzerklärung</Link> zu.
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

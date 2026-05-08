'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Loader2, Rocket, ShieldCheck, Eye, EyeOff, Play, Building2, Briefcase, Zap } from 'lucide-react'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const QUICK_DEMOS = [
  { key: 'hr',         label: 'HR-Abteilung',  desc: 'Mittelstand · Professional', icon: Building2, gradient: 'linear-gradient(135deg,#4f46e5,#6366f1)' },
  { key: 'enterprise', label: 'Enterprise',    desc: 'Konzern · Business',          icon: Briefcase, gradient: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' },
  { key: 'boutique',   label: 'Startup',       desc: 'Boutique · Starter',          icon: Zap,       gradient: 'linear-gradient(135deg,#059669,#10b981)' },
] as const

type DemoKey = typeof QUICK_DEMOS[number]['key']

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState<DemoKey | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading || demoLoading) return
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
      router.push(callbackUrl)
      router.refresh()
    } catch {
      setError('Anmeldung fehlgeschlagen. Bitte erneut versuchen.')
      setLoading(false)
    }
  }

  async function startDemo(key: DemoKey, attempt = 0): Promise<void> {
    if (loading || demoLoading) return
    setError('')
    setDemoLoading(key)
    try {
      const res = await fetch(`/api/demo?type=${key}`, { method: 'POST', cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data?.retryable && attempt === 0) {
          await new Promise((r) => setTimeout(r, 1200))
          return startDemo(key, 1)
        }
        setError(data?.error || 'Demo gerade nicht verfügbar. Bitte einen Moment warten.')
        setDemoLoading(null)
        return
      }
      const result = await signIn('credentials', { email: data.email, password: data.password, redirect: false })
      if (result?.error) {
        setError('Demo-Login fehlgeschlagen. Bitte erneut versuchen.')
        setDemoLoading(null)
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Demo gerade nicht erreichbar. Bitte erneut versuchen.')
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
        <div role="status" className="mb-4 px-4 py-3 rounded-xl text-sm text-emerald-700 bg-emerald-50 border border-emerald-200">
          Konto erstellt — bitte melden Sie sich jetzt an.
        </div>
      )}

      {/* Quick-Demo Buttons (One-Click-Test-Zugang) */}
      <div className="card-lg shadow-card-md p-5 mb-5 bg-gradient-to-br from-brand-50/60 to-violet/5 border border-brand-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#8b5cf6)', boxShadow: '0 4px 12px rgba(79,70,229,.25)' }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-text-primary">Tool sofort testen</div>
            <div className="text-[11px] text-text-secondary">Ein Klick · vorbefülltes Dashboard · keine Anmeldung nötig</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_DEMOS.map((d) => {
            const Icon = d.icon
            const isLoading = demoLoading === d.key
            const isDisabled = (demoLoading !== null && demoLoading !== d.key) || loading
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => startDemo(d.key)}
                disabled={isDisabled}
                className="group relative flex flex-col items-start text-left gap-1.5 p-3 rounded-xl bg-white border border-border hover:border-brand-300 hover:shadow-card transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: d.gradient }}>
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Icon className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className="text-[11px] font-bold text-text-primary leading-tight">{d.label}</div>
                <div className="text-[10px] text-text-muted leading-snug">{d.desc}</div>
              </button>
            )
          })}
        </div>
        <Link href="/demo" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-700 hover:text-brand-800 mt-3">
          <Play className="w-3 h-3" /> Mehr zu den Demo-Profilen <Rocket className="w-3 h-3" />
        </Link>
      </div>

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

          <button type="submit" disabled={loading || demoLoading !== null} className="btn-primary w-full py-3">
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
              Konto erstellen
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

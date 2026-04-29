'use client'

import { Suspense, useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Building2, Briefcase, Loader2, Clock3, Rocket, ShieldCheck } from 'lucide-react'

type DemoKey = 'hr' | 'enterprise' | 'boutique'

const DEMO_FLAVORS: { key: DemoKey; label: string; sub: string; icon: typeof Building2; tone: string }[] = [
  {
    key: 'hr',
    label: 'HR Inhouse',
    sub: 'Mittelstand · Professional',
    icon: Building2,
    tone: 'brand',
  },
  {
    key: 'enterprise',
    label: 'Enterprise',
    sub: 'Konzern · Business-Plan',
    icon: Briefcase,
    tone: 'violet',
  },
  {
    key: 'boutique',
    label: 'Startup',
    sub: 'Boutique · Starter',
    icon: Rocket,
    tone: 'emerald',
  },
]

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')
  const demoQuery = searchParams.get('demo')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState<DemoKey | null>(null)

  // Auto-trigger HR demo when ?demo=1 in URL
  useEffect(() => {
    if (demoQuery && !demoLoading) {
      const key = (['hr', 'enterprise', 'boutique'].includes(demoQuery) ? demoQuery : 'hr') as DemoKey
      runDemo(key)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoQuery])

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

  async function runDemo(type: DemoKey) {
    setError('')
    setDemoLoading(type)
    try {
      const seed = await fetch(`/api/demo?type=${type}`, {
        method: 'POST',
        cache: 'no-store',
      })
      const data = await seed.json()
      if (!seed.ok) throw new Error(data.error || 'Demo konnte nicht geladen werden.')

      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (res?.error) throw new Error('Demo-Login fehlgeschlagen. Bitte erneut versuchen.')

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
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-text-primary">Live-Demo (1 Klick)</span>
        </div>
        <p className="text-xs text-text-secondary mb-4 leading-relaxed">
          Ein Klick — wir öffnen ein vorbefülltes Demo-Konto, damit Sie das Dashboard sofort erleben können.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {DEMO_FLAVORS.map((d) => {
            const Icon = d.icon
            const tone = {
              brand: 'border-border hover:border-brand-300 hover:bg-brand-50/40',
              violet: 'border-border hover:border-violet/40 hover:bg-violet/5',
              emerald: 'border-border hover:border-emerald-300 hover:bg-emerald-50/40',
            }[d.tone] ?? 'border-border'
            const iconTone = {
              brand: 'text-brand-600',
              violet: 'text-violet',
              emerald: 'text-emerald-600',
            }[d.tone] ?? 'text-brand-600'
            return (
              <button
                key={d.key}
                onClick={() => runDemo(d.key)}
                disabled={demoLoading !== null}
                className={`group relative rounded-xl p-3 border bg-white transition-all disabled:opacity-50 ${tone}`}
              >
                <Icon className={`w-5 h-5 mb-2 ${iconTone}`} />
                <div className="text-[13px] font-semibold text-text-primary text-left">{d.label}</div>
                <div className="text-[10px] text-text-muted text-left leading-tight">{d.sub}</div>
                {demoLoading === d.key && (
                  <Loader2 className="absolute top-2 right-2 w-3.5 h-3.5 text-brand-600 animate-spin" />
                )}
              </button>
            )
          })}
        </div>
        <Link
          href="/waitlist-agency"
          className="mt-3 flex items-center justify-between rounded-xl px-3 py-2 border border-violet/30 bg-violet/5 hover:bg-violet/10 transition-all"
        >
          <div>
            <div className="text-[13px] font-semibold text-text-primary">Personaldienstleister-Demo</div>
            <div className="text-[10px] text-text-muted">Closed Beta · auf Warteliste</div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet">
            <Clock3 className="w-3.5 h-3.5" /> Bald
          </span>
        </Link>
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

      <p className="text-[11px] text-text-muted text-center mt-5 leading-relaxed flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-emerald-600" />
        DSGVO-konform · Server in Deutschland · {' '}
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

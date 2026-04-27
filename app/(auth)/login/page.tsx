'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputClass =
    'input-field !bg-white !border-slate-300 !text-slate-900 placeholder:!text-slate-400 focus:!border-accent'

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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Willkommen zurück</h1>
        <p className="text-sm text-slate-600 mt-2">Melden Sie sich in Ihrem RefCheck-Konto an</p>
      </div>

      {registered && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm text-status-success border border-status-success/20"
          style={{ background: 'rgba(48,209,88,0.08)' }}>
          Konto erstellt — bitte anmelden.
        </div>
      )}

      <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(15,23,42,0.08)' }}>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="px-4 py-3 rounded-xl text-xs text-slate-700 border border-slate-200 bg-slate-50">
            Demo-Zugang (Seed): <span className="font-semibold">demo@refcheck.de</span> / <span className="font-semibold">demo1234</span>
          </div>
          <div>
            <label className="label !text-slate-500">E-Mail</label>
            <input
              type="email"
              className={inputClass}
              placeholder="firma@beispiel.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label !text-slate-500">Passwort</label>
            <input
              type="password"
              className={inputClass}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm text-status-error border border-status-error/20"
              style={{ background: 'rgba(255,69,58,0.08)' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-xl text-sm">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Anmelden…
              </span>
            ) : 'Anmelden'}
          </button>
        </form>

        <div className="px-6 pb-5 text-center" style={{ borderTop: '1px solid rgba(15,23,42,0.08)' }}>
          <p className="text-sm text-slate-600 pt-4">
            Noch kein Konto?{' '}
            <Link href="/register" className="text-accent hover:text-accent-hover transition-colors font-medium">
              Registrieren
            </Link>
          </p>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 text-center mt-5 leading-relaxed">
        Durch die Anmeldung stimmen Sie unserer{' '}
        <Link href="/datenschutz" className="underline hover:text-slate-700 transition-colors">Datenschutzerklärung</Link> zu.
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  )
}

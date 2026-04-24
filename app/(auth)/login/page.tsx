'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
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
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">RC</span>
          </div>
          <span className="font-semibold text-text-primary">RefCheck</span>
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">Willkommen zurück</h1>
        <p className="text-text-secondary text-sm mt-2">Melden Sie sich in Ihrem Konto an</p>
      </div>

      <div className="card">
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
            <label className="label">Passwort</label>
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
            <div className="bg-status-errorBg border border-status-error/20 rounded-lg px-4 py-3 text-sm text-status-error">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Anmelden…
              </span>
            ) : (
              'Anmelden'
            )}
          </button>
        </form>

        <div className="divider" />

        <p className="text-sm text-text-secondary text-center">
          Noch kein Konto?{' '}
          <Link href="/register" className="text-accent hover:text-accent-hover transition-colors font-medium">
            Jetzt registrieren
          </Link>
        </p>
      </div>

      <p className="text-xs text-text-muted text-center mt-6">
        Mit der Anmeldung akzeptieren Sie unsere{' '}
        <Link href="/datenschutz" className="underline hover:text-text-secondary">
          Datenschutzerklärung
        </Link>
      </p>
    </div>
  )
}

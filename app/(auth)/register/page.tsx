'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    password: '',
    passwordConfirm: '',
  })
  const [gdprAccepted, setGdprAccepted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.passwordConfirm) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }
    if (form.password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.')
      return
    }
    if (!gdprAccepted) {
      setError('Bitte akzeptieren Sie die Datenschutzerklärung.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        company: form.company.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        gdprAccepted,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Registrierung fehlgeschlagen.')
      return
    }

    router.push('/login?registered=1')
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
        <h1 className="text-2xl font-bold text-text-primary">Konto erstellen</h1>
        <p className="text-text-secondary text-sm mt-2">Starten Sie Ihre kostenlose Testphase</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ihr Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="Max Mustermann"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Unternehmen</label>
              <input
                type="text"
                className="input-field"
                placeholder="Mustermann GmbH"
                value={form.company}
                onChange={(e) => update('company', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Geschäftliche E-Mail</label>
            <input
              type="email"
              className="input-field"
              placeholder="max@mustermann-gmbh.de"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="label">Passwort</label>
            <input
              type="password"
              className="input-field"
              placeholder="Min. 8 Zeichen"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="label">Passwort bestätigen</label>
            <input
              type="password"
              className="input-field"
              placeholder="Passwort wiederholen"
              value={form.passwordConfirm}
              onChange={(e) => update('passwordConfirm', e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="bg-accent-glow border border-accent/20 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={gdprAccepted}
                onChange={(e) => setGdprAccepted(e.target.checked)}
                className="mt-0.5 accent-accent"
              />
              <span className="text-xs text-text-secondary leading-relaxed">
                Ich habe die{' '}
                <Link href="/datenschutz" className="text-accent hover:underline" target="_blank">
                  Datenschutzerklärung
                </Link>{' '}
                gelesen und stimme der Verarbeitung meiner personenbezogenen Daten gemäß DSGVO zu.
                Meine Daten werden ausschließlich auf deutschen Servern gespeichert.
              </span>
            </label>
          </div>

          {error && (
            <div className="bg-status-errorBg border border-status-error/20 rounded-lg px-4 py-3 text-sm text-status-error">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !gdprAccepted} className="btn-primary w-full justify-center">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Konto wird erstellt…
              </span>
            ) : (
              'Konto erstellen'
            )}
          </button>
        </form>

        <div className="divider" />

        <p className="text-sm text-text-secondary text-center">
          Bereits registriert?{' '}
          <Link href="/login" className="text-accent hover:text-accent-hover transition-colors font-medium">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  )
}

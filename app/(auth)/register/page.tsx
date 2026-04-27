'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', company: '', email: '', password: '', passwordConfirm: '' })
  const [gdprAccepted, setGdprAccepted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputClass =
    'input-field !bg-white !border-slate-300 !text-slate-900 placeholder:!text-slate-400 focus:!border-accent'

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.passwordConfirm) { setError('Passwörter stimmen nicht überein.'); return }
    if (form.password.length < 8) { setError('Passwort muss mindestens 8 Zeichen haben.'); return }
    if (!gdprAccepted) { setError('Bitte akzeptieren Sie die Datenschutzerklärung.'); return }

    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, email: form.email.trim().toLowerCase(), gdprAccepted }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error || 'Registrierung fehlgeschlagen.'); return }
    router.push('/login?registered=1')
  }

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Konto erstellen</h1>
        <p className="text-sm text-slate-600 mt-2">Starten Sie Ihre kostenlose Testphase</p>
      </div>

      <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(15,23,42,0.08)' }}>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label !text-slate-500">Name</label>
              <input className={inputClass} placeholder="Max Mustermann" value={form.name} onChange={(e) => update('name', e.target.value)} required />
            </div>
            <div>
              <label className="label !text-slate-500">Unternehmen</label>
              <input className={inputClass} placeholder="Mustermann GmbH" value={form.company} onChange={(e) => update('company', e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="label !text-slate-500">Geschäftliche E-Mail</label>
            <input type="email" className={inputClass} placeholder="max@firma.de" value={form.email} onChange={(e) => update('email', e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <label className="label !text-slate-500">Passwort</label>
            <input type="password" className={inputClass} placeholder="Min. 8 Zeichen" value={form.password} onChange={(e) => update('password', e.target.value)} required autoComplete="new-password" />
          </div>
          <div>
            <label className="label !text-slate-500">Passwort bestätigen</label>
            <input type="password" className={inputClass} placeholder="Passwort wiederholen" value={form.passwordConfirm} onChange={(e) => update('passwordConfirm', e.target.value)} required autoComplete="new-password" />
          </div>

          {/* DSGVO */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(10,132,255,0.06)', border: '1px solid rgba(10,132,255,0.15)' }}>
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative flex-shrink-0 mt-0.5">
                <input type="checkbox" checked={gdprAccepted} onChange={(e) => setGdprAccepted(e.target.checked)} className="sr-only" />
                <div className={`w-5 h-5 rounded-md border transition-all duration-150 flex items-center justify-center ${gdprAccepted ? 'bg-accent border-accent' : 'border-white/20'}`}>
                  {gdprAccepted && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>
              <span className="text-[11px] text-slate-600 leading-relaxed">
                Ich habe die{' '}
                <Link href="/datenschutz" className="text-accent hover:underline" target="_blank">Datenschutzerklärung</Link>
                {' '}gelesen und stimme der Verarbeitung meiner Daten gemäß DSGVO zu.
              </span>
            </label>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-xs text-status-error border border-status-error/20"
              style={{ background: 'rgba(255,69,58,0.08)' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !gdprAccepted} className="btn-primary w-full py-3 rounded-xl text-sm">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Konto wird erstellt…
              </span>
            ) : 'Konto erstellen'}
          </button>
        </form>

        <div className="px-6 pb-5 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-sm text-slate-600 pt-4">
            Bereits registriert?{' '}
            <Link href="/login" className="text-accent hover:text-accent-hover transition-colors font-medium">Anmelden</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Building2, Users2, ShieldCheck, Loader2, ArrowRight, Check } from 'lucide-react'
import { ACCOUNT_TYPES, type AccountType, getPlanById } from '@/lib/utils'

function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const planId = params.get('plan') ?? 'PROFESSIONAL'
  const requestedType = (params.get('type') as AccountType | null) ?? 'HR_DEPARTMENT'
  const initialType: AccountType = requestedType === 'RECRUITMENT_AGENCY' ? 'HR_DEPARTMENT' : requestedType
  const plan = getPlanById(planId)

  const [step, setStep] = useState(1)
  const [accountType, setAccountType] = useState<AccountType>(initialType)
  const [form, setForm] = useState({ name: '', company: '', email: '', password: '', passwordConfirm: '' })
  const [gdprAccepted, setGdprAccepted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      body: JSON.stringify({
        ...form,
        email: form.email.trim().toLowerCase(),
        accountType,
        plan: planId,
        gdprAccepted,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Registrierung fehlgeschlagen.')
      setLoading(false)
      return
    }

    // Auto sign-in so the user lands directly on the dashboard
    const signInRes = await signIn('credentials', {
      email: form.email.trim().toLowerCase(),
      password: form.password,
      redirect: false,
    })

    setLoading(false)

    if (signInRes?.error) {
      // Account created but auto-login failed — fall back to login screen
      router.push('/login?registered=1')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">In 60 Sekunden startklar</h1>
        <p className="text-text-secondary">14 Tage kostenlos testen · keine Kreditkarte · jederzeit kündbar</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= n ? 'bg-gradient-to-br from-brand-500 to-violet text-white shadow-card' : 'bg-bg-tertiary text-text-muted'
            }`}>
              {step > n ? <Check className="w-3.5 h-3.5" /> : n}
            </div>
            {n < 2 && <div className={`w-10 h-0.5 ${step > n ? 'bg-brand-500' : 'bg-bg-tertiary'}`} />}
          </div>
        ))}
      </div>

      <div className="card-lg shadow-card-md p-6">
        {/* Plan badge */}
        <div className="mb-5 p-3 rounded-xl bg-brand-50 border border-brand-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-brand-700">Gewähltes Paket</div>
              <div className="text-sm font-semibold text-text-primary">{plan.name}</div>
            </div>
            <Link href="/preise" className="text-xs text-brand-700 hover:text-brand-800 font-semibold">Ändern →</Link>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <div className="label mb-3">Welche Art von Konto?</div>
              <div className="grid grid-cols-1 gap-2.5">
                {(Object.keys(ACCOUNT_TYPES) as AccountType[]).map((t) => {
                  const meta = ACCOUNT_TYPES[t]
                  const Icon = t === 'HR_DEPARTMENT' ? Building2 : Users2
                  const comingSoon = t === 'RECRUITMENT_AGENCY'
                  const active = accountType === t
                  if (comingSoon) {
                    return (
                      <div
                        key={t}
                        className="flex items-start gap-3 p-4 rounded-xl border text-left border-violet/30 bg-violet/5 opacity-85"
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-bg-secondary text-text-secondary">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-text-primary text-sm">
                            {meta.label} <span className="text-violet font-semibold">(bald verfügbar)</span>
                          </div>
                          <div className="text-xs text-text-secondary mt-0.5">
                            PDL-Accounts sind aktuell in der Closed Beta. Bitte über die Warteliste vormerken.
                          </div>
                          <Link href="/waitlist-agency" className="inline-flex mt-2 text-xs font-semibold text-violet hover:underline">
                            Zur PDL-Warteliste →
                          </Link>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAccountType(t)}
                      className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                        active
                          ? 'border-brand-500 bg-brand-50/40 shadow-card'
                          : 'border-border bg-white hover:border-brand-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        active ? 'bg-gradient-to-br from-brand-500 to-violet text-white shadow-card' : 'bg-bg-secondary text-text-secondary'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-text-primary text-sm">{meta.label}</div>
                        <div className="text-xs text-text-secondary mt-0.5">{meta.description}</div>
                      </div>
                      {active && (
                        <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn-primary w-full py-3"
            >
              Weiter <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Name</label>
                <input className="input-field" placeholder="Max Mustermann" value={form.name} onChange={(e) => update('name', e.target.value)} required />
              </div>
              <div>
                <label className="label">Unternehmen</label>
                <input className="input-field" placeholder="Mustermann GmbH" value={form.company} onChange={(e) => update('company', e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="label">Geschäftliche E-Mail</label>
              <input type="email" className="input-field" placeholder="max@firma.de" value={form.email} onChange={(e) => update('email', e.target.value)} required autoComplete="email" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Passwort</label>
                <input type="password" className="input-field" placeholder="Min. 8 Zeichen" value={form.password} onChange={(e) => update('password', e.target.value)} required autoComplete="new-password" />
              </div>
              <div>
                <label className="label">Bestätigen</label>
                <input type="password" className="input-field" placeholder="Wiederholen" value={form.passwordConfirm} onChange={(e) => update('passwordConfirm', e.target.value)} required autoComplete="new-password" />
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl bg-brand-50/40 border border-brand-100">
              <div className="relative flex-shrink-0 mt-0.5">
                <input type="checkbox" checked={gdprAccepted} onChange={(e) => setGdprAccepted(e.target.checked)} className="sr-only" />
                <div className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center ${gdprAccepted ? 'bg-brand-500 border-brand-500' : 'border-border bg-white'}`}>
                  {gdprAccepted && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
              </div>
              <span className="text-xs text-text-secondary leading-relaxed">
                Ich habe die <Link href="/datenschutz" className="text-brand-700 hover:underline" target="_blank">Datenschutzerklärung</Link> und{' '}
                <Link href="/agb" className="text-brand-700 hover:underline" target="_blank">AGB</Link> gelesen und stimme der Verarbeitung meiner Daten zu.
              </span>
            </label>

            {error && (
              <div className="px-4 py-3 rounded-xl text-xs text-rose-700 bg-rose-50 border border-rose-200">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">Zurück</button>
              <button type="submit" disabled={loading || !gdprAccepted} className="btn-primary flex-[2] py-3">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Konto wird erstellt…
                  </span>
                ) : 'Konto erstellen'}
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-text-muted justify-center pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> DSGVO-konform · Server in Deutschland
            </div>
          </form>
        )}

        <div className="pt-5 mt-5 border-t border-border text-center">
          <p className="text-sm text-text-secondary">
            Bereits registriert?{' '}
            <Link href="/login" className="text-brand-700 hover:text-brand-800 font-semibold transition-colors">Anmelden</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-brand-600 animate-spin" /></div>}>
      <RegisterForm />
    </Suspense>
  )
}

'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Building2, Users2, ShieldCheck, Loader2, ArrowRight, Check, Eye, EyeOff } from 'lucide-react'
import { ACCOUNT_TYPES, type AccountType, getPlanById } from '@/lib/utils'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string; tone: string }

function passwordStrength(pw: string): Strength {
  if (!pw) return { score: 0, label: '—', tone: 'bg-bg-tertiary' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++
  const map = [
    { label: 'Sehr schwach', tone: 'bg-rose-500' },
    { label: 'Schwach', tone: 'bg-rose-400' },
    { label: 'Okay', tone: 'bg-amber-500' },
    { label: 'Gut', tone: 'bg-emerald-500' },
    { label: 'Stark', tone: 'bg-emerald-600' },
  ] as const
  const cap = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4
  return { score: cap, ...map[cap] }
}

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
  const [showPw, setShowPw] = useState(false)
  const [gdprAccepted, setGdprAccepted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const strength = useMemo(() => passwordStrength(form.password), [form.password])
  const emailValid = !form.email || EMAIL_REGEX.test(form.email.trim())
  const passwordsMatch = !form.passwordConfirm || form.password === form.passwordConfirm

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    if (error) setError('')
  }

  function validateStep2(): string | null {
    if (!form.name.trim()) return 'Bitte geben Sie Ihren Namen ein.'
    if (!form.company.trim()) return 'Bitte geben Sie Ihr Unternehmen ein.'
    if (!form.email.trim()) return 'Bitte geben Sie Ihre E-Mail-Adresse ein.'
    if (!EMAIL_REGEX.test(form.email.trim())) return 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
    if (form.password.length < 8) return 'Passwort muss mindestens 8 Zeichen haben.'
    if (form.password !== form.passwordConfirm) return 'Passwörter stimmen nicht überein.'
    if (!gdprAccepted) return 'Bitte stimmen Sie der Datenschutzerklärung zu.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    const v = validateStep2()
    if (v) { setError(v); return }

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          company: form.company.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          accountType,
          plan: planId,
          gdprAccepted,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || 'Registrierung fehlgeschlagen. Bitte erneut versuchen.')
        setLoading(false)
        return
      }

      const signInRes = await signIn('credentials', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        redirect: false,
      })

      if (signInRes?.error) {
        // Konto angelegt, Auto-Login fehlgeschlagen — sauber zur Login-Seite leiten.
        router.push('/login?registered=1')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      console.error('register_submit_error', err)
      setError('Verbindung fehlgeschlagen. Bitte prüfen Sie Ihre Internetverbindung.')
      setLoading(false)
    }
  }

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">Konto erstellen</h1>
        <p className="text-text-secondary">Sie haben bereits einen Termin gehabt? Hier können Sie Ihr Konto aktivieren.</p>
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

            <div className="text-center text-xs text-text-muted pt-2">
              Lieber zuerst ansehen?{' '}
              <Link href="/demo" className="text-brand-700 hover:text-brand-800 font-semibold">Demo ohne Konto starten →</Link>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Name</label>
                <input className="input-field" placeholder="Max Mustermann" value={form.name}
                  onChange={(e) => update('name', e.target.value)} required maxLength={120} autoComplete="name" />
              </div>
              <div>
                <label className="label">Unternehmen</label>
                <input className="input-field" placeholder="Mustermann GmbH" value={form.company}
                  onChange={(e) => update('company', e.target.value)} required maxLength={160} autoComplete="organization" />
              </div>
            </div>
            <div>
              <label className="label">Geschäftliche E-Mail</label>
              <input
                type="email"
                className={`input-field ${form.email && !emailValid ? '!border-rose-300 focus:!ring-rose-500/20' : ''}`}
                placeholder="max@firma.de"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
                maxLength={254}
                autoComplete="email"
                inputMode="email"
              />
              {form.email && !emailValid && (
                <div className="text-[11px] text-rose-600 mt-1">Bitte eine gültige E-Mail eingeben.</div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Passwort</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="input-field pr-10"
                    placeholder="Min. 8 Zeichen"
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text-primary"
                    aria-label={showPw ? 'Passwort verbergen' : 'Passwort anzeigen'}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-1.5">
                    <div className="h-1 rounded-full bg-bg-tertiary overflow-hidden">
                      <div className={`h-full transition-all ${strength.tone}`} style={{ width: `${(strength.score / 4) * 100}%` }} />
                    </div>
                    <div className="text-[10px] text-text-muted mt-1">Stärke: {strength.label}</div>
                  </div>
                )}
              </div>
              <div>
                <label className="label">Bestätigen</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  className={`input-field ${form.passwordConfirm && !passwordsMatch ? '!border-rose-300 focus:!ring-rose-500/20' : ''}`}
                  placeholder="Wiederholen"
                  value={form.passwordConfirm}
                  onChange={(e) => update('passwordConfirm', e.target.value)}
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                />
                {form.passwordConfirm && !passwordsMatch && (
                  <div className="text-[11px] text-rose-600 mt-1">Passwörter stimmen nicht überein.</div>
                )}
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
              <div role="alert" className="px-4 py-3 rounded-xl text-xs text-rose-700 bg-rose-50 border border-rose-200">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} disabled={loading} className="btn-secondary flex-1 py-3">Zurück</button>
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

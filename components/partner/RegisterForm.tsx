'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function PartnerRegisterForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    contactFirstName: '',
    contactLastName: '',
    company: '',
    phone: '',
    email: '',
    password: '',
    acceptTerms: false,
    acceptPrivacy: false,
    acceptCoBranding: false,
  })
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setMessage('')

    try {
      const res = await fetch('/api/partner/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(data.error ?? 'Bewerbung konnte nicht gespeichert werden.')
        return
      }
      setStatus('success')
      setMessage(
        'Vielen Dank! Wir prüfen Ihre Bewerbung innerhalb von 2 Werktagen und melden uns per E-Mail. Sie können sich bereits jetzt einloggen, sehen aber erst nach Freigabe das Dashboard.',
      )
      setTimeout(() => router.push('/partner/pending'), 4000)
    } catch {
      setStatus('error')
      setMessage('Netzwerk-Fehler. Bitte versuchen Sie es erneut.')
    }
  }

  if (status === 'success') {
    return (
      <div className="card-md text-center max-w-lg mx-auto">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-text-primary mb-3">Bewerbung eingegangen</h2>
        <p className="text-sm text-text-secondary leading-relaxed">{message}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="Vorname"
          value={form.contactFirstName}
          onChange={(v) => setForm({ ...form, contactFirstName: v })}
          required
          autoComplete="given-name"
        />
        <Field
          label="Nachname"
          value={form.contactLastName}
          onChange={(v) => setForm({ ...form, contactLastName: v })}
          required
          autoComplete="family-name"
        />
      </div>

      <Field
        label="Firma (PDL / Agentur)"
        value={form.company}
        onChange={(v) => setForm({ ...form, company: v })}
        required
        autoComplete="organization"
      />

      <Field
        label="Geschäftliche E-Mail"
        type="email"
        value={form.email}
        onChange={(v) => setForm({ ...form, email: v })}
        required
        autoComplete="email"
      />

      <Field
        label="Telefon (optional)"
        type="tel"
        value={form.phone}
        onChange={(v) => setForm({ ...form, phone: v })}
        autoComplete="tel"
      />

      <Field
        label="Passwort (min. 10 Zeichen)"
        type="password"
        value={form.password}
        onChange={(v) => setForm({ ...form, password: v })}
        required
        autoComplete="new-password"
        minLength={10}
      />

      <div className="space-y-3 pt-2">
        <Checkbox
          checked={form.acceptCoBranding}
          onChange={(v) => setForm({ ...form, acceptCoBranding: v })}
          label={
            <>
              Ich verstehe, dass das Siegel <strong>{'„'}verifiziert durch candiq{'"'}</strong> auf
              allen Reports sichtbarer Pflichtbestandteil bleibt und nicht entfernbar ist.
            </>
          }
        />
        <Checkbox
          checked={form.acceptTerms}
          onChange={(v) => setForm({ ...form, acceptTerms: v })}
          label={
            <>
              Ich akzeptiere die <Link href="/agb" className="underline">AGB</Link> in der aktuellen Fassung.
            </>
          }
        />
        <Checkbox
          checked={form.acceptPrivacy}
          onChange={(v) => setForm({ ...form, acceptPrivacy: v })}
          label={
            <>
              Ich habe die <Link href="/datenschutz" className="underline">Datenschutzerklärung</Link> gelesen.
            </>
          }
        />
      </div>

      {status === 'error' && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-text-primary text-white font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
      >
        {status === 'submitting' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Bewerbung wird gesendet…
          </>
        ) : (
          <>
            Bewerbung absenden <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <p className="text-xs text-text-muted text-center">
        Bereits beworben?{' '}
        <Link href="/partner/login" className="underline hover:text-indigo-600">
          Einloggen
        </Link>
      </p>
    </form>
  )
}

function Field(props: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  autoComplete?: string
  minLength?: number
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-text-secondary mb-1.5 block">
        {props.label}
        {props.required && <span className="text-red-600 ml-0.5">*</span>}
      </span>
      <input
        type={props.type ?? 'text'}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        required={props.required}
        autoComplete={props.autoComplete}
        minLength={props.minLength}
        className="w-full px-3 py-2.5 rounded-lg border border-border-default bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-sm"
      />
    </label>
  )
}

function Checkbox(props: { checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode }) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
        className="mt-1 w-4 h-4 rounded border-border-default text-indigo-600 focus:ring-indigo-200"
      />
      <span className="text-xs text-text-secondary leading-relaxed">{props.label}</span>
    </label>
  )
}

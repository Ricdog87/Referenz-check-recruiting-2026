'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, AlertCircle, Save, KeyRound, Building2 } from 'lucide-react'

type ProfileInitial = {
  company: string
  contactFirstName: string
  contactLastName: string
  phone: string
}

export function PartnerSettingsForm({ initial, email }: { initial: ProfileInitial; email: string }) {
  return (
    <div className="space-y-6">
      <ProfileSection initial={initial} email={email} />
      <PasswordSection />
    </div>
  )
}

// ─── Firmendaten ──────────────────────────────────────────────────────

function ProfileSection({ initial, email }: { initial: ProfileInitial; email: string }) {
  const router = useRouter()
  const [form, setForm] = useState(initial)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const dirty =
    form.company !== initial.company ||
    form.contactFirstName !== initial.contactFirstName ||
    form.contactLastName !== initial.contactLastName ||
    form.phone !== initial.phone

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'submitting' || !dirty) return
    setStatus('submitting')
    setMessage('')
    try {
      const res = await fetch('/api/partner/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(data.error ?? 'Änderung fehlgeschlagen.')
        return
      }
      setStatus('success')
      setMessage('Firmendaten gespeichert.')
      router.refresh()
      setTimeout(() => setStatus('idle'), 2500)
    } catch {
      setStatus('error')
      setMessage('Netzwerk-Fehler.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-md space-y-4">
      <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
        <Building2 className="w-4 h-4" /> Firmendaten
      </h2>

      <label className="block">
        <span className="text-xs font-semibold text-text-secondary mb-1.5 block">Login-E-Mail</span>
        <input
          type="email"
          value={email}
          disabled
          className="w-full px-3 py-2.5 rounded-lg border border-border-default bg-surface-subtle text-sm text-text-muted cursor-not-allowed"
        />
      </label>

      <Field
        label="Firma"
        value={form.company}
        onChange={(v) => setForm({ ...form, company: v })}
        required
      />
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
        label="Telefon (optional)"
        type="tel"
        value={form.phone}
        onChange={(v) => setForm({ ...form, phone: v })}
        autoComplete="tel"
      />

      {status === 'success' && <Notice tone="ok" text={message} />}
      {status === 'error' && <Notice tone="error" text={message} />}

      <button
        type="submit"
        disabled={status === 'submitting' || !dirty}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-text-primary text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {status === 'submitting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Speichern
      </button>
    </form>
  )
}

// ─── Passwort ändern ──────────────────────────────────────────────────

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'submitting') return
    if (newPassword !== confirm) {
      setStatus('error')
      setMessage('Die neuen Passwörter stimmen nicht überein.')
      return
    }
    setStatus('submitting')
    setMessage('')
    try {
      const res = await fetch('/api/partner/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(data.error ?? 'Passwort konnte nicht geändert werden.')
        return
      }
      setStatus('success')
      setMessage('Passwort geändert. Es gilt ab der nächsten Anmeldung.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
      setTimeout(() => setStatus('idle'), 3500)
    } catch {
      setStatus('error')
      setMessage('Netzwerk-Fehler.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-md space-y-4">
      <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
        <KeyRound className="w-4 h-4" /> Passwort ändern
      </h2>

      <Field
        label="Aktuelles Passwort"
        type="password"
        value={currentPassword}
        onChange={setCurrentPassword}
        required
        autoComplete="current-password"
      />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="Neues Passwort (min. 10 Zeichen)"
          type="password"
          value={newPassword}
          onChange={setNewPassword}
          required
          autoComplete="new-password"
          minLength={10}
        />
        <Field
          label="Neues Passwort wiederholen"
          type="password"
          value={confirm}
          onChange={setConfirm}
          required
          autoComplete="new-password"
          minLength={10}
        />
      </div>

      {status === 'success' && <Notice tone="ok" text={message} />}
      {status === 'error' && <Notice tone="error" text={message} />}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-text-primary text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
      >
        {status === 'submitting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
        Passwort ändern
      </button>
    </form>
  )
}

// ─── Mini-Helpers ─────────────────────────────────────────────────────

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
        className="w-full px-3 py-2.5 rounded-lg border border-border-default bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
      />
    </label>
  )
}

function Notice({ tone, text }: { tone: 'ok' | 'error'; text: string }) {
  const Icon = tone === 'ok' ? CheckCircle2 : AlertCircle
  const cls =
    tone === 'ok'
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : 'text-red-700 bg-red-50 border-red-200'
  return (
    <div className={`flex items-start gap-2 text-sm border rounded-lg px-3 py-2 ${cls}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{text}</span>
    </div>
  )
}

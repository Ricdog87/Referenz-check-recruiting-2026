'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Loader2, AlertCircle, Pause, Play, X, Save, Edit3, CheckCircle2,
} from 'lucide-react'

type Customer = {
  id: string
  company: string
  contactFirstName: string
  contactLastName: string
  contactEmail: string
  planKey: string
  billingCycle: 'MONTHLY' | 'YEARLY'
  ekPriceCents: number
  endPriceCents: number
  marginCents: number
  status: 'ACTIVE' | 'PAUSED' | 'CHURNED'
  notes: string | null
  activatedAt: string
}

type PlanOption = {
  planKey: string
  name: string
  audience: string
  listMonthlyCents: number
  ekMonthlyCents: number
  listAnnualCents: number
  ekAnnualCents: number
}

export function PartnerCustomerList({
  initialCustomers,
  planOptions,
}: {
  initialCustomers: Customer[]
  planOptions: PlanOption[]
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(initialCustomers.length === 0)

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-text-secondary">
          {initialCustomers.length} Mandant{initialCustomers.length === 1 ? '' : 'en'} insgesamt
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-text-primary text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Formular schließen' : 'Neuer Mandant'}
        </button>
      </div>

      {/* Neu-Form */}
      {showForm && (
        <CustomerForm
          planOptions={planOptions}
          onSuccess={() => {
            setShowForm(false)
            router.refresh()
          }}
        />
      )}

      {/* Liste */}
      {initialCustomers.length === 0 ? (
        <div className="card-md text-center py-12">
          <p className="text-sm text-text-secondary">Noch keine Mandanten angelegt.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {initialCustomers.map((c) => (
            <CustomerRow key={c.id} customer={c} onChange={() => router.refresh()} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Neu-Anlegen-Form ─────────────────────────────────────────────────

function CustomerForm({
  planOptions,
  onSuccess,
}: {
  planOptions: PlanOption[]
  onSuccess: () => void
}) {
  const [form, setForm] = useState({
    company: '',
    contactFirstName: '',
    contactLastName: '',
    contactEmail: '',
    planKey: planOptions[0]?.planKey ?? '',
    billingCycle: 'MONTHLY' as 'MONTHLY' | 'YEARLY',
    endPriceEuro: '',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const selectedPlan = planOptions.find((p) => p.planKey === form.planKey)
  const ekCents = selectedPlan
    ? (form.billingCycle === 'MONTHLY' ? selectedPlan.ekMonthlyCents : selectedPlan.ekAnnualCents)
    : 0
  const listCents = selectedPlan
    ? (form.billingCycle === 'MONTHLY' ? selectedPlan.listMonthlyCents : selectedPlan.listAnnualCents)
    : 0

  const endCents = Math.round(Number(form.endPriceEuro || 0) * 100)
  const marginCents = endCents > 0 ? endCents - ekCents : 0
  const marginValid = endCents >= ekCents && endCents > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'submitting') return
    if (!marginValid) {
      setStatus('error')
      setMessage(`Verkaufspreis muss mindestens dem EK (${(ekCents / 100).toFixed(2)} €) entsprechen.`)
      return
    }
    setStatus('submitting')
    setMessage('')

    try {
      const res = await fetch('/api/partner/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: form.company,
          contactFirstName: form.contactFirstName,
          contactLastName: form.contactLastName,
          contactEmail: form.contactEmail,
          planKey: form.planKey,
          billingCycle: form.billingCycle,
          endPriceCents: endCents,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(data.error ?? 'Mandant konnte nicht angelegt werden.')
        return
      }
      onSuccess()
    } catch {
      setStatus('error')
      setMessage('Netzwerk-Fehler.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-md space-y-4 border-2 border-indigo-200">
      <div className="text-sm font-bold text-text-primary mb-2">Neuer Mandant</div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="Firma"
          value={form.company}
          onChange={(v) => setForm({ ...form, company: v })}
          required
        />
        <Field
          label="E-Mail (Kontakt)"
          type="email"
          value={form.contactEmail}
          onChange={(v) => setForm({ ...form, contactEmail: v })}
          required
        />
        <Field
          label="Vorname (Kontakt)"
          value={form.contactFirstName}
          onChange={(v) => setForm({ ...form, contactFirstName: v })}
          required
        />
        <Field
          label="Nachname (Kontakt)"
          value={form.contactLastName}
          onChange={(v) => setForm({ ...form, contactLastName: v })}
          required
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-text-secondary mb-1.5 block">Plan</span>
          <select
            value={form.planKey}
            onChange={(e) => setForm({ ...form, planKey: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-border-default bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            {planOptions.map((p) => (
              <option key={p.planKey} value={p.planKey}>
                {p.name} ({p.audience})
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-text-secondary mb-1.5 block">Zyklus</span>
          <select
            value={form.billingCycle}
            onChange={(e) => setForm({ ...form, billingCycle: e.target.value as any })}
            className="w-full px-3 py-2.5 rounded-lg border border-border-default bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <option value="MONTHLY">Monatlich</option>
            <option value="YEARLY">Jährlich</option>
          </select>
        </label>
      </div>

      {/* Pricing-Vorschau */}
      <div className="grid sm:grid-cols-4 gap-3 p-3 bg-surface-subtle rounded-lg text-xs">
        <Snippet label="Listenpreis" value={`${formatEur(listCents / 100)} €`} />
        <Snippet label="Ihr EK" value={`${formatEur(ekCents / 100)} €`} tone="indigo" />
        <Snippet
          label="Ihr VK"
          value={form.endPriceEuro ? `${formatEur(endCents / 100)} €` : '—'}
        />
        <Snippet
          label="Marge"
          value={marginCents !== 0 ? `${formatEur(marginCents / 100)} €` : '—'}
          tone={marginValid && marginCents > 0 ? 'emerald' : 'muted'}
        />
      </div>

      <Field
        label="Ihr Verkaufspreis (€)"
        type="number"
        value={form.endPriceEuro}
        onChange={(v) => setForm({ ...form, endPriceEuro: v })}
        required
        min={(ekCents / 100).toFixed(2)}
        step="0.01"
        hint={`Mindestens ${formatEur(ekCents / 100)} € (Ihr EK).`}
      />

      {status === 'error' && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={status === 'submitting' || !marginValid}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-text-primary text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {status === 'submitting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Mandant anlegen
        </button>
      </div>
    </form>
  )
}

// ─── Customer-Zeile mit Inline-Edit ───────────────────────────────────

function CustomerRow({ customer, onChange }: { customer: Customer; onChange: () => void }) {
  const [editing, setEditing] = useState(false)
  const [endPrice, setEndPrice] = useState(((customer.endPriceCents / 100)).toFixed(2))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [, startTransition] = useTransition()

  async function patchStatus(next: Customer['status']) {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/partner/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Fehlgeschlagen')
        setBusy(false)
        return
      }
      startTransition(() => onChange())
    } catch {
      setError('Netzwerk-Fehler')
    } finally {
      setBusy(false)
    }
  }

  async function patchPrice() {
    const cents = Math.round(Number(endPrice) * 100)
    if (!Number.isFinite(cents) || cents <= 0) {
      setError('Ungültiger Preis')
      return
    }
    if (cents < customer.ekPriceCents) {
      setError(`Mind. ${(customer.ekPriceCents / 100).toFixed(2)} € (Ihr EK)`)
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/partner/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endPriceCents: cents }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Fehlgeschlagen')
        setBusy(false)
        return
      }
      setEditing(false)
      startTransition(() => onChange())
    } catch {
      setError('Netzwerk-Fehler')
    } finally {
      setBusy(false)
    }
  }

  const statusMeta: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    PAUSED: 'bg-amber-50 text-amber-800 border-amber-200',
    CHURNED: 'bg-slate-100 text-slate-700 border-slate-200',
  }
  const statusLabel: Record<string, string> = {
    ACTIVE: 'Aktiv', PAUSED: 'Pausiert', CHURNED: 'Gekündigt',
  }

  return (
    <div className="card-md">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-text-primary">{customer.company}</span>
            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${statusMeta[customer.status]}`}>
              {statusLabel[customer.status]}
            </span>
          </div>
          <div className="text-xs text-text-secondary mt-1">
            {customer.contactFirstName} {customer.contactLastName} ·{' '}
            <a href={`mailto:${customer.contactEmail}`} className="underline hover:text-indigo-600">
              {customer.contactEmail}
            </a>
          </div>
          <div className="text-xs text-text-muted mt-1">
            Plan: <code>{customer.planKey}</code> ·{' '}
            {customer.billingCycle === 'YEARLY' ? 'jährlich' : 'monatlich'}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs text-right min-w-[240px]">
          <Snippet label="EK" value={`${formatEur(customer.ekPriceCents / 100)} €`} />
          <Snippet
            label="VK"
            value={editing ? (
              <input
                type="number"
                value={endPrice}
                onChange={(e) => setEndPrice(e.target.value)}
                step="0.01"
                min={(customer.ekPriceCents / 100).toFixed(2)}
                className="w-20 px-1.5 py-0.5 text-xs rounded border border-border-default"
              />
            ) : `${formatEur(customer.endPriceCents / 100)} €`}
          />
          <Snippet
            label="Marge"
            value={`${formatEur(customer.marginCents / 100)} €`}
            tone="emerald"
          />
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-1.5 mt-3 flex-wrap">
        {editing ? (
          <>
            <ActionBtn icon={busy ? Loader2 : Save} spin={busy} label="Speichern" onClick={patchPrice} variant="primary" />
            <ActionBtn icon={X} label="Abbrechen" onClick={() => { setEditing(false); setEndPrice((customer.endPriceCents / 100).toFixed(2)) }} />
          </>
        ) : (
          <>
            {customer.status === 'ACTIVE' && (
              <>
                <ActionBtn icon={Edit3} label="VK ändern" onClick={() => setEditing(true)} />
                <ActionBtn icon={busy ? Loader2 : Pause} spin={busy} label="Pausieren" onClick={() => patchStatus('PAUSED')} />
                <ActionBtn icon={busy ? Loader2 : X} spin={busy} label="Kündigen" onClick={() => patchStatus('CHURNED')} variant="danger" />
              </>
            )}
            {customer.status === 'PAUSED' && (
              <ActionBtn icon={busy ? Loader2 : Play} spin={busy} label="Reaktivieren" onClick={() => patchStatus('ACTIVE')} variant="primary" />
            )}
            {customer.status === 'CHURNED' && (
              <span className="text-xs text-text-muted italic">Gekündigt — read-only</span>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Mini-Helpers ─────────────────────────────────────────────────────

function Field(props: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  min?: string | number
  step?: string
  hint?: string
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
        min={props.min}
        step={props.step}
        className="w-full px-3 py-2.5 rounded-lg border border-border-default bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
      {props.hint && <span className="text-[10px] text-text-muted mt-1 block">{props.hint}</span>}
    </label>
  )
}

function Snippet({
  label, value, tone,
}: {
  label: string
  value: React.ReactNode
  tone?: 'indigo' | 'emerald' | 'muted'
}) {
  const cls =
    tone === 'indigo' ? 'text-indigo-700' :
    tone === 'emerald' ? 'text-emerald-700' :
    tone === 'muted' ? 'text-text-muted' : 'text-text-primary'
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-text-muted">{label}</div>
      <div className={`font-semibold ${cls}`}>{value}</div>
    </div>
  )
}

function ActionBtn(props: {
  icon: React.ComponentType<{ className?: string }>
  spin?: boolean
  label: string
  onClick: () => void
  variant?: 'primary' | 'danger'
}) {
  const Icon = props.icon
  const cls =
    props.variant === 'primary' ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent' :
    props.variant === 'danger' ? 'bg-white border-red-200 text-red-700 hover:bg-red-50' :
    'bg-white border-border-default text-text-secondary hover:bg-surface-subtle'
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors border ${cls}`}
    >
      <Icon className={`w-3.5 h-3.5 ${props.spin ? 'animate-spin' : ''}`} />
      {props.label}
    </button>
  )
}

function formatEur(amount: number): string {
  return amount.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

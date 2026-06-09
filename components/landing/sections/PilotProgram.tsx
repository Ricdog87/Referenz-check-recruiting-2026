'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

const HIRES_OPTIONS = [
  { value: '5-19', label: '5–19 Hires/Jahr' },
  { value: '20-49', label: '20–49 Hires/Jahr' },
  { value: '50-99', label: '50–99 Hires/Jahr' },
  { value: '100+', label: '100+ Hires/Jahr' },
]

export function PilotProgram() {
  const [form, setForm] = useState({
    company: '',
    firstName: '',
    lastName: '',
    email: '',
    hiresPerYear: '',
    consent: false,
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setMessage('')
    try {
      const res = await fetch('/api/pilot-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(data.error ?? 'Etwas ist schiefgelaufen.')
        return
      }
      setStatus('success')
      setMessage(data.message ?? 'Vielen Dank! Wir melden uns innerhalb von 2 Werktagen.')
    } catch (err: any) {
      setStatus('error')
      setMessage('Netzwerk-Fehler. Bitte versuchen Sie es erneut.')
    }
  }

  return (
    <section className="py-24 px-6" id="pilot">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="card-lg shadow-card-lg overflow-hidden relative"
        >
          {/* Brand-Akzent oben */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-400 via-violet to-brand-600" />

          <div className="grid lg:grid-cols-5 gap-8 p-8 sm:p-10">
            {/* Linke Spalte: Pitch */}
            <div className="lg:col-span-2 flex flex-col">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-4 self-start">
                <Sparkles className="w-3.5 h-3.5" />
                Pilot-Programm Q3/2026
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter mb-4 text-text-primary leading-tight">
                10 HR-Teams gesucht — 25 % Discount im ersten Jahr.
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-5">
                Als Pilot-Partner erhalten Sie unser <strong>Professional-Paket</strong> für 12
                Monate mit <strong>25 % Rabatt</strong>. Im Gegenzug machen wir nach 90 Tagen eine
                <strong> anonymisierte Case-Study</strong> über Ihre Ergebnisse — ohne Klarnamen,
                ohne Logo, mit Ihrer schriftlichen Freigabe vor Veröffentlichung.
              </p>
              <ul className="space-y-2 text-sm text-text-secondary mb-5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  Persönliches Onboarding mit dem Gründer-Team
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  Priority-Support &amp; direkter Feature-Einfluss
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  Anonymisierte Case-Study nach 90 Tagen (mit Ihrer Freigabe)
                </li>
              </ul>
              <p className="text-xs text-text-muted mt-auto">
                Pilot-Plätze werden in Reihenfolge der Eingänge bestätigt. Wir melden uns innerhalb von 2 Werktagen.
              </p>
            </div>

            {/* Rechte Spalte: Form */}
            <div className="lg:col-span-3 bg-bg-secondary border border-border rounded-2xl p-6 sm:p-7">
              {status === 'success' ? (
                <div className="flex flex-col items-center justify-center text-center py-10">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">Bewerbung angekommen</h3>
                  <p className="text-sm text-text-secondary max-w-md">{message}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Firma" required>
                      <input
                        type="text"
                        required
                        autoComplete="organization"
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        className="input-field"
                        placeholder="Demo GmbH"
                      />
                    </Field>
                    <Field label="Hires pro Jahr" required>
                      <select
                        required
                        value={form.hiresPerYear}
                        onChange={(e) => setForm({ ...form, hiresPerYear: e.target.value })}
                        className="input-field"
                      >
                        <option value="" disabled>Bitte wählen…</option>
                        {HIRES_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Vorname" required>
                      <input
                        type="text"
                        required
                        autoComplete="given-name"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        className="input-field"
                      />
                    </Field>
                    <Field label="Nachname" required>
                      <input
                        type="text"
                        required
                        autoComplete="family-name"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        className="input-field"
                      />
                    </Field>
                  </div>
                  <Field label="Geschäftliche E-Mail" required>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="input-field"
                      placeholder="vorname.nachname@firma.de"
                    />
                  </Field>

                  <label className="flex items-start gap-2 cursor-pointer text-xs text-text-secondary">
                    <input
                      type="checkbox"
                      checked={form.consent}
                      onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                      className="mt-0.5"
                      required
                    />
                    <span>
                      Ich willige in die Verarbeitung meiner Angaben zur Bearbeitung der
                      Pilot-Bewerbung ein (Art. 6 Abs. 1 lit. a + lit. b DSGVO). Die Daten werden bis zur
                      Beendigung des Pilot-Programms gespeichert und anschließend gelöscht.
                      Widerruf jederzeit per E-Mail an hello@candiq.de.
                    </span>
                  </label>

                  {status === 'error' && (
                    <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{message}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="btn-primary w-full py-3 inline-flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {status === 'submitting' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Wird gesendet…</>
                    ) : (
                      <><Send className="w-4 h-4" /> Pilot-Bewerbung senden</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-text-primary mb-1.5 inline-block">
        {label}
        {required && <span className="text-rose-600 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  )
}

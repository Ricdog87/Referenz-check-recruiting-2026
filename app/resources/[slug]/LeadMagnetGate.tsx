'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Send, CheckCircle2, AlertCircle, Loader2, Printer } from 'lucide-react'

type Props = {
  slug: string
  title: string
  markdown: string
}

const STORAGE_KEY_PREFIX = 'candiq.leadmagnet.unlocked.'

export function LeadMagnetGate({ slug, title, markdown }: Props) {
  const [unlocked, setUnlocked] = useState(false)
  const [form, setForm] = useState({ firstName: '', email: '', company: '', consent: false, newsletter: false })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [message, setMessage] = useState('')

  // Hydration-safe: check sessionStorage after mount (DSGVO: keine
  // dauerhafte Speicherung im localStorage ohne Cookie-Banner).
  useEffect(() => {
    try {
      const u = sessionStorage.getItem(STORAGE_KEY_PREFIX + slug)
      if (u === '1') setUnlocked(true)
    } catch {
      // Privacy mode etc. - ignorieren
    }
  }, [slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setMessage('')
    try {
      const res = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, slug, title }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(data.error ?? 'Etwas ist schiefgelaufen.')
        return
      }
      try {
        sessionStorage.setItem(STORAGE_KEY_PREFIX + slug, '1')
      } catch {
        // ignorieren
      }
      setUnlocked(true)
    } catch {
      setStatus('error')
      setMessage('Netzwerk-Fehler. Bitte versuchen Sie es erneut.')
    }
  }

  if (unlocked) {
    return (
      <article className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-12 prose-h3:text-xl prose-a:text-brand-700 prose-strong:text-text-primary">
        <div className="not-prose flex flex-col sm:flex-row sm:items-center gap-3 mb-8 print:hidden">
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 self-start">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Freigeschaltet
          </div>
          <button
            type="button"
            onClick={() => typeof window !== 'undefined' && window.print()}
            className="inline-flex items-center gap-2 text-xs font-semibold text-brand-700 hover:text-brand-800"
          >
            <Printer className="w-3.5 h-3.5" /> Als PDF speichern (Browser-Druckdialog)
          </button>
        </div>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </article>
    )
  }

  return (
    <div className="card-lg shadow-card-lg">
      <h2 className="text-2xl font-bold text-text-primary mb-2">
        Inhalt freischalten
      </h2>
      <p className="text-sm text-text-secondary mb-6">
        Wir senden Ihnen den Download-Link zusätzlich per E-Mail — damit Sie ihn später wiederfinden.
        Keine Newsletter-Pflicht.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-text-primary mb-1.5 inline-block">
              Vorname <span className="text-rose-600">*</span>
            </span>
            <input
              type="text"
              required
              autoComplete="given-name"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="input-field"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-text-primary mb-1.5 inline-block">
              Firma (optional)
            </span>
            <input
              type="text"
              autoComplete="organization"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="input-field"
              placeholder="Demo GmbH"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-semibold text-text-primary mb-1.5 inline-block">
            Geschäftliche E-Mail <span className="text-rose-600">*</span>
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input-field"
            placeholder="vorname.nachname@firma.de"
          />
        </label>

        <label className="flex items-start gap-2 cursor-pointer text-xs text-text-secondary">
          <input
            type="checkbox"
            required
            checked={form.consent}
            onChange={(e) => setForm({ ...form, consent: e.target.checked })}
            className="mt-0.5"
          />
          <span>
            Ich willige in die Verarbeitung meiner Angaben zur Zusendung der Ressource ein
            (Art. 6 Abs. 1 lit. a DSGVO). Die Daten werden für die Zusendung verwendet und
            anschließend zur Nachweis-Pflicht 24 Monate gespeichert. Widerruf jederzeit per
            E-Mail an hello@candiq.de.
          </span>
        </label>

        <label className="flex items-start gap-2 cursor-pointer text-xs text-text-secondary">
          <input
            type="checkbox"
            checked={form.newsletter}
            onChange={(e) => setForm({ ...form, newsletter: e.target.checked })}
            className="mt-0.5"
          />
          <span>
            Optional: Senden Sie mir den candiq Praxis-Newsletter (max. 1× pro Monat,
            Double-Opt-In, jederzeit abbestellbar).
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
            <><Loader2 className="w-4 h-4 animate-spin" /> Wird freigeschaltet…</>
          ) : (
            <><Send className="w-4 h-4" /> Inhalt jetzt ansehen</>
          )}
        </button>
      </form>
    </div>
  )
}

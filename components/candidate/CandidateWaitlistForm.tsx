'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'

/**
 * Bewerber-Waitlist-Form (Phase 1: Interesse-Capture).
 * Schreibt nach /api/candidate-waitlist (rate-limited, DSGVO-konform).
 * KEINE Account-Erstellung — Self-Service-Auth folgt in Phase 2.
 */
export function CandidateWaitlistForm() {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [position, setPosition] = useState('')
  const [consent, setConsent] = useState(false)
  const [newsletter, setNewsletter] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setError(null)

    if (!firstName.trim() || !email.trim()) {
      setError('Bitte Vorname und E-Mail angeben.')
      return
    }
    if (!consent) {
      setError('Bitte die Datenschutz-Einwilligung erteilen.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/candidate-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          email: email.trim().toLowerCase(),
          position: position.trim() || undefined,
          consent,
          newsletter,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Anmeldung fehlgeschlagen. Bitte später erneut versuchen.')
        return
      }
      setDone(true)
    } catch {
      setError('Verbindungsfehler. Bitte später erneut versuchen.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-emerald-900 mb-1">Du stehst auf der Liste.</h3>
            <p className="text-sm text-emerald-800 leading-relaxed">
              Wir melden uns bei dir, sobald die Bewerber-Plattform startet (geplant Q4 2026).
              Bis dahin: keine automatischen Mails, kein Spam. Versprochen.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="cwl-firstName" className="block text-xs font-semibold text-text-secondary mb-1.5">
            Vorname *
          </label>
          <input
            id="cwl-firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            autoComplete="given-name"
            className="input-field w-full"
            placeholder="Max"
          />
        </div>
        <div>
          <label htmlFor="cwl-email" className="block text-xs font-semibold text-text-secondary mb-1.5">
            E-Mail *
          </label>
          <input
            id="cwl-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="input-field w-full"
            placeholder="max@beispiel.de"
          />
        </div>
      </div>

      <div>
        <label htmlFor="cwl-position" className="block text-xs font-semibold text-text-secondary mb-1.5">
          Position oder Branche <span className="text-text-muted font-normal">(optional)</span>
        </label>
        <input
          id="cwl-position"
          type="text"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="input-field w-full"
          placeholder="z. B. Senior Product Manager / IT-Vertrieb"
        />
      </div>

      <label className="flex items-start gap-3 text-xs text-text-secondary cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-border accent-brand-600 flex-shrink-0"
        />
        <span>
          Ich willige ein, dass meine angegebenen Daten (Vorname, E-Mail, Position) gespeichert
          werden, um mich über den Start der Bewerber-Plattform zu informieren. Verantwortlich
          ist die RSG Recruiting Solutions group GmbH (Betreiberin der Marke candiq). Mehr
          Infos in der{' '}
          <a href="/datenschutz" className="text-brand-700 underline hover:text-brand-800" target="_blank" rel="noopener noreferrer">
            Datenschutzerklärung
          </a>
          . Widerruf jederzeit per Mail an <a href="mailto:hello@candiq.de" className="text-brand-700 underline hover:text-brand-800">hello@candiq.de</a>.
        </span>
      </label>

      <label className="flex items-start gap-3 text-xs text-text-secondary cursor-pointer">
        <input
          type="checkbox"
          checked={newsletter}
          onChange={(e) => setNewsletter(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-border accent-brand-600 flex-shrink-0"
        />
        <span>
          Optional: Schickt mir Praxis-Tipps zu Bewerbungen und Reference Checks (max. 1×/Monat).
          Abmeldung jederzeit per 1-Klick.
        </span>
      </label>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !consent}
        className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Wird gesendet…
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            Auf die Warteliste
          </>
        )}
      </button>

      <p className="text-[11px] text-text-muted">
        Kein Spam. Kein Verkauf von Daten. Nur Benachrichtigung zum Launch.
      </p>
    </form>
  )
}

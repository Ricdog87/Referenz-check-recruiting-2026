'use client'

import { useState } from 'react'

type Referee = {
  firstName: string
  lastName: string
  company: string
  position: string
  email: string
  phone: string
  relationship: string
  startDate: string
  endDate: string
}

const EMPTY_REFEREE: Referee = {
  firstName: '',
  lastName: '',
  company: '',
  position: '',
  email: '',
  phone: '',
  relationship: '',
  startDate: '',
  endDate: '',
}

type InitialData = {
  candidate: { firstName: string; lastName: string; position: string }
  hiringCompany: string
  status: string
  expiresAt: string
  acceptedAt: string | null
  consentVersion: string
  scope: string[]
}

export function ConsentPortalClient({ token, initialData }: { token: string; initialData: InitialData }) {
  const [status, setStatus] = useState(initialData.status)
  const [referees, setReferees] = useState<Referee[]>([{ ...EMPTY_REFEREE }])
  const [consentGiven, setConsentGiven] = useState(false)
  const [scopeConfirm, setScopeConfirm] = useState({
    referenceCheck: false,
    contactReferees: false,
    retention: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revokeConfirm, setRevokeConfirm] = useState(false)

  const allScopesConfirmed = scopeConfirm.referenceCheck && scopeConfirm.contactReferees && scopeConfirm.retention
  const canSubmit = consentGiven && allScopesConfirmed && referees.every(r => r.firstName && r.lastName && r.company && (r.email || r.phone))

  function updateReferee(i: number, key: keyof Referee, value: string) {
    setReferees(prev => prev.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)))
  }
  function addReferee() {
    if (referees.length >= 5) return
    setReferees(prev => [...prev, { ...EMPTY_REFEREE }])
  }
  function removeReferee(i: number) {
    setReferees(prev => prev.filter((_, idx) => idx !== i))
  }

  async function submit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/consent/${encodeURIComponent(token)}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consentGiven: true, referees }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Fehler beim Speichern.')
      setStatus('ACCEPTED')
    } catch (err: any) {
      setError(err?.message ?? 'Unbekannter Fehler.')
    } finally {
      setSubmitting(false)
    }
  }

  async function revoke() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/consent/${encodeURIComponent(token)}/revoke`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Fehler beim Widerruf.')
      setStatus('REVOKED')
    } catch (err: any) {
      setError(err?.message ?? 'Unbekannter Fehler.')
    } finally {
      setSubmitting(false)
      setRevokeConfirm(false)
    }
  }

  // ── ZUSTAND 1: Bereits angenommen ─────────────────────────────
  if (status === 'ACCEPTED') {
    return (
      <main className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-8">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">✓</div>
            <h1 className="text-2xl font-bold text-slate-900">Einwilligung erteilt</h1>
            <p className="text-slate-600 mt-2 text-sm">
              Vielen Dank, {initialData.candidate.firstName}. <strong>{initialData.hiringCompany}</strong> wird nun mit der Referenzprüfung beginnen.
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-5 text-sm text-slate-700 mb-6">
            <p className="font-semibold mb-2">Was passiert jetzt?</p>
            <ul className="space-y-1.5 list-none">
              <li>1. Unsere geschulten Reviewer kontaktieren ausschließlich die von Ihnen freigegebenen Referenzgeber.</li>
              <li>2. Die Gespräche folgen standardisierten Fragen — keine Bots, keine Hintergrundrecherche.</li>
              <li>3. Der Report wird ausschließlich an <strong>{initialData.hiringCompany}</strong> übermittelt.</li>
              <li>4. Ihre Daten werden spätestens nach 6 Monaten automatisch gelöscht.</li>
            </ul>
          </div>
          <div className="border-t border-slate-200 pt-6">
            <p className="text-xs text-slate-500 mb-3">
              Sie können Ihre Einwilligung jederzeit widerrufen (Art. 7 Abs. 3 DSGVO). Bewahren Sie diesen Link sicher auf.
            </p>
            {!revokeConfirm ? (
              <button
                onClick={() => setRevokeConfirm(true)}
                className="text-sm text-rose-600 hover:underline"
              >
                Einwilligung widerrufen
              </button>
            ) : (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                <p className="text-sm text-rose-900 font-semibold mb-2">Wirklich widerrufen?</p>
                <p className="text-xs text-rose-800 mb-3">Alle offenen Referenzprüfungen werden sofort gestoppt. Diese Aktion ist nicht umkehrbar.</p>
                <div className="flex gap-2">
                  <button
                    onClick={revoke}
                    disabled={submitting}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {submitting ? 'Wird widerrufen…' : 'Ja, widerrufen'}
                  </button>
                  <button
                    onClick={() => setRevokeConfirm(false)}
                    className="text-sm text-slate-600 px-4 py-2"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
            {error && <p className="text-sm text-rose-600 mt-2">{error}</p>}
          </div>
        </div>
      </main>
    )
  }

  // ── ZUSTAND 2: Widerrufen ─────────────────────────────────────
  if (status === 'REVOKED') {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="text-5xl mb-4">🛑</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Einwilligung widerrufen</h1>
          <p className="text-slate-600 text-sm">
            Ihre Einwilligung wurde widerrufen. {initialData.hiringCompany} wurde informiert, alle offenen Prüfungen wurden gestoppt.
          </p>
        </div>
      </main>
    )
  }

  // ── ZUSTAND 3: Pending — Formular ─────────────────────────────
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="text-indigo-600 font-black text-2xl mb-1">candiq</div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Einwilligung zur Referenzprüfung
          </h1>
          <p className="text-slate-600">
            Hallo {initialData.candidate.firstName}, <strong>{initialData.hiringCompany}</strong> möchte für Ihre Bewerbung als <strong>{initialData.candidate.position}</strong> Referenzen prüfen.
          </p>
        </div>

        {/* Transparenz-Box (Art. 13 DSGVO Pflichtinfos) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="font-bold text-slate-900 mb-3">📋 Was wird verarbeitet?</h2>
          <dl className="space-y-2.5 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <dt className="text-slate-500 font-medium">Verantwortlich</dt>
              <dd className="sm:col-span-2 text-slate-900">{initialData.hiringCompany} (gemeinsam mit candiq GmbH als Auftragsverarbeiter)</dd>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <dt className="text-slate-500 font-medium">Zweck</dt>
              <dd className="sm:col-span-2 text-slate-900">Verifikation Ihrer Bewerbungsangaben (Position, Zeitraum, fachliche Eignung)</dd>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <dt className="text-slate-500 font-medium">Rechtsgrundlage</dt>
              <dd className="sm:col-span-2 text-slate-900">Ihre Einwilligung gem. Art. 6 Abs. 1 lit. a DSGVO</dd>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <dt className="text-slate-500 font-medium">Empfänger</dt>
              <dd className="sm:col-span-2 text-slate-900">Nur die von Ihnen freigegebenen Referenzgeber + {initialData.hiringCompany}</dd>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <dt className="text-slate-500 font-medium">Speicherdauer</dt>
              <dd className="sm:col-span-2 text-slate-900">Max. 6 Monate nach Abschluss des Bewerbungsverfahrens, dann automatische Löschung</dd>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <dt className="text-slate-500 font-medium">Ihre Rechte</dt>
              <dd className="sm:col-span-2 text-slate-900">Auskunft, Berichtigung, Löschung, Widerruf jederzeit · Beschwerde bei Aufsichtsbehörde</dd>
            </div>
          </dl>
        </div>

        {/* Referenzgeber-Liste */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="font-bold text-slate-900 mb-1">👥 Ihre Referenzgeber</h2>
          <p className="text-sm text-slate-600 mb-4">
            Nennen Sie 1–5 Personen aus früheren Arbeitsverhältnissen, die unsere Reviewer kontaktieren dürfen.
          </p>

          {referees.map((r, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-4 mb-3 bg-slate-50/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Referenz {i + 1}</span>
                {referees.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeReferee(i)}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Entfernen
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Vorname *"
                  value={r.firstName}
                  onChange={e => updateReferee(i, 'firstName', e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  maxLength={120}
                />
                <input
                  type="text"
                  placeholder="Nachname *"
                  value={r.lastName}
                  onChange={e => updateReferee(i, 'lastName', e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  maxLength={120}
                />
                <input
                  type="text"
                  placeholder="Unternehmen *"
                  value={r.company}
                  onChange={e => updateReferee(i, 'company', e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm sm:col-span-2"
                  maxLength={120}
                />
                <input
                  type="text"
                  placeholder="Position des Referenzgebers (z.B. Team Lead)"
                  value={r.position}
                  onChange={e => updateReferee(i, 'position', e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm sm:col-span-2"
                  maxLength={120}
                />
                <input
                  type="email"
                  placeholder="E-Mail (E-Mail ODER Telefon * erforderlich)"
                  value={r.email}
                  onChange={e => updateReferee(i, 'email', e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  maxLength={254}
                />
                <input
                  type="tel"
                  placeholder="Telefon"
                  value={r.phone}
                  onChange={e => updateReferee(i, 'phone', e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  maxLength={40}
                />
                <input
                  type="text"
                  placeholder="Zeitraum von (z.B. 01/2021)"
                  value={r.startDate}
                  onChange={e => updateReferee(i, 'startDate', e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  maxLength={16}
                />
                <input
                  type="text"
                  placeholder="Zeitraum bis (z.B. 12/2024)"
                  value={r.endDate}
                  onChange={e => updateReferee(i, 'endDate', e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  maxLength={16}
                />
              </div>
            </div>
          ))}

          {referees.length < 5 && (
            <button
              type="button"
              onClick={addReferee}
              className="text-sm text-indigo-600 hover:underline font-semibold"
            >
              + Weiteren Referenzgeber hinzufügen
            </button>
          )}
        </div>

        {/* Granulare Einwilligungen */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="font-bold text-slate-900 mb-4">✅ Ich willige ein in:</h2>
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={scopeConfirm.referenceCheck}
                onChange={e => setScopeConfirm({ ...scopeConfirm, referenceCheck: e.target.checked })}
                className="mt-1 w-5 h-5 rounded text-indigo-600"
              />
              <span className="text-sm text-slate-900">
                Die Durchführung einer Referenzprüfung im Auftrag von <strong>{initialData.hiringCompany}</strong>.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={scopeConfirm.contactReferees}
                onChange={e => setScopeConfirm({ ...scopeConfirm, contactReferees: e.target.checked })}
                className="mt-1 w-5 h-5 rounded text-indigo-600"
              />
              <span className="text-sm text-slate-900">
                Die Kontaktaufnahme mit den oben genannten Referenzgebern durch geschulte Reviewer.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={scopeConfirm.retention}
                onChange={e => setScopeConfirm({ ...scopeConfirm, retention: e.target.checked })}
                className="mt-1 w-5 h-5 rounded text-indigo-600"
              />
              <span className="text-sm text-slate-900">
                Die Speicherung der Ergebnisse für max. 6 Monate, danach automatische Löschung.
              </span>
            </label>
          </div>

          <div className="border-t border-slate-200 mt-5 pt-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={e => setConsentGiven(e.target.checked)}
                className="mt-1 w-5 h-5 rounded text-indigo-600"
              />
              <span className="text-sm text-slate-900">
                <strong>Ich bestätige hiermit ausdrücklich</strong> meine Einwilligung gem. Art. 6 Abs. 1 lit. a DSGVO und bin darüber informiert, dass ich diese jederzeit ohne Angabe von Gründen widerrufen kann.
              </span>
            </label>
          </div>
        </div>

        {/* Submit */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4 text-sm text-rose-900">
            {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={!canSubmit || submitting}
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition"
        >
          {submitting ? 'Wird gespeichert…' : 'Einwilligung erteilen'}
        </button>

        <p className="text-xs text-slate-500 text-center mt-4">
          Datenschutzversion {initialData.consentVersion} · Server in Deutschland · TLS-verschlüsselt · Gültig bis {new Date(initialData.expiresAt).toLocaleDateString('de-DE')}
        </p>
      </div>
    </main>
  )
}

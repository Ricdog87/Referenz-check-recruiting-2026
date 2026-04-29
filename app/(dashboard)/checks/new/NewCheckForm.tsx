'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'

export function NewCheckForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCandidateId = searchParams.get('candidateId')

  const [candidates, setCandidates] = useState<
    { id: string; firstName: string; lastName: string; position: string }[]
  >([])
  const [form, setForm] = useState({
    candidateId: preselectedCandidateId || '',
    employerName: '',
    employerContact: '',
    employerPhone: '',
    employerEmail: '',
    position: '',
    startDate: '',
    endDate: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/candidates')
      .then((r) => r.json())
      .then(setCandidates)
      .catch(() => {})
  }, [])

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/checks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Fehler beim Anlegen der Prüfung.')
      return
    }

    router.push(`/checks/${data.id}`)
  }

  return (
    <>
      <Header
        title="Referenzprüfung anlegen"
        subtitle="Neue Verifizierung beim früheren Arbeitgeber"
        action={<Link href="/checks" className="btn-secondary">Abbrechen</Link>}
      />

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Candidate selection */}
          <div className="card-md space-y-4">
            <h2 className="section-title">Kandidat</h2>
            <div>
              <label className="label">Kandidat *</label>
              <select
                className="input-field"
                value={form.candidateId}
                onChange={(e) => update('candidateId', e.target.value)}
                required
              >
                <option value="">Kandidaten auswählen…</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} — {c.position}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Employer */}
          <div className="card-md space-y-4">
            <h2 className="section-title">Früherer Arbeitgeber</h2>
            <div>
              <label className="label">Unternehmensname *</label>
              <input
                className="input-field"
                value={form.employerName}
                onChange={(e) => update('employerName', e.target.value)}
                required
                placeholder="z.B. Mustermann GmbH"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Ansprechpartner</label>
                <input
                  className="input-field"
                  value={form.employerContact}
                  onChange={(e) => update('employerContact', e.target.value)}
                  placeholder="z.B. Frau Müller, HR"
                />
              </div>
              <div>
                <label className="label">Telefon</label>
                <input
                  type="tel"
                  className="input-field"
                  value={form.employerPhone}
                  onChange={(e) => update('employerPhone', e.target.value)}
                  placeholder="+49 89 12345678"
                />
              </div>
            </div>
            <div>
              <label className="label">E-Mail (optional)</label>
              <input
                type="email"
                className="input-field"
                value={form.employerEmail}
                onChange={(e) => update('employerEmail', e.target.value)}
                placeholder="hr@mustermann-gmbh.de"
              />
            </div>
          </div>

          {/* Position & dates */}
          <div className="card-md space-y-4">
            <h2 className="section-title">Zu prüfende Tätigkeit</h2>
            <div>
              <label className="label">Position laut Lebenslauf</label>
              <input
                className="input-field"
                value={form.position}
                onChange={(e) => update('position', e.target.value)}
                placeholder="z.B. Senior Developer"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Beschäftigt von</label>
                <input
                  className="input-field"
                  value={form.startDate}
                  onChange={(e) => update('startDate', e.target.value)}
                  placeholder="z.B. 01/2020"
                />
              </div>
              <div>
                <label className="label">Beschäftigt bis</label>
                <input
                  className="input-field"
                  value={form.endDate}
                  onChange={(e) => update('endDate', e.target.value)}
                  placeholder="z.B. 12/2023"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Wird angelegt…
                </span>
              ) : (
                'Prüfung anlegen'
              )}
            </button>
            <Link href="/checks" className="btn-secondary">Abbrechen</Link>
          </div>
        </form>
      </div>
    </>
  )
}

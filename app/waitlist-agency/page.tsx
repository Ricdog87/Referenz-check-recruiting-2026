'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { Building2, Users2, CheckCircle2, ArrowRight } from 'lucide-react'

export default function AgencyWaitlistPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    company: '',
    name: '',
    email: '',
    website: '',
    placementsPerYear: '',
  })

  function update<K extends keyof typeof form>(field: K, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/waitlist-agency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? 'Anfrage konnte nicht gesendet werden. Bitte erneut versuchen.')
        setSubmitting(false)
        return
      }
      setSubmitted(true)
    } catch {
      setError('Verbindung fehlgeschlagen. Bitte erneut versuchen.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-text-primary overflow-x-hidden antialiased">
      <LandingNav />

      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-16 left-1/2 -translate-x-1/2 w-[900px] h-[380px]"
            style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.16), transparent 60%)', filter: 'blur(80px)' }}
          />
        </div>

        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet/10 text-violet border border-violet/20 mb-4">
              <Users2 className="w-3.5 h-3.5" /> Personaldienstleister · Closed Beta
            </div>
            <h1 className="text-[clamp(34px,5.5vw,56px)] font-black tracking-tightest mb-4 leading-[1.05]">
              PDL-Warteliste für <span className="text-gradient-brand">candiq</span>
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed max-w-3xl mx-auto">
              Spezielle candiq-Pakete für Personaldienstleister mit Multi-Mandanten-Setup, White-Label-Reports und API-Anbindung sind in Vorbereitung.
              Tragen Sie sich ein, um frühzeitig Zugang zu erhalten und das Produkt mitzugestalten.
            </p>
          </div>

          <div className="card-lg shadow-card-lg">
            {!submitted ? (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Firmenname</label>
                    <input
                      className="input-field"
                      placeholder="Beispiel: Muster Personalberatung GmbH"
                      value={form.company}
                      onChange={(e) => update('company', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Name</label>
                    <input
                      className="input-field"
                      placeholder="Vor- und Nachname"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">E-Mail</label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="name@firma.de"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Website / LinkedIn</label>
                    <input
                      className="input-field"
                      placeholder="https://..."
                      value={form.website}
                      onChange={(e) => update('website', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Anzahl Placements pro Jahr</label>
                  <input
                    className="input-field"
                    placeholder="z. B. 50"
                    value={form.placementsPerYear}
                    onChange={(e) => update('placementsPerYear', e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div role="alert" className="px-4 py-3 rounded-xl text-sm text-rose-700 bg-rose-50 border border-rose-200">
                    {error}
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <p className="text-xs text-text-muted">Wir nutzen Ihre Angaben ausschließlich zur Kontaktaufnahme zum PDL-Launch.</p>
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? 'Wird gesendet…' : <>Frühen Zugang vormerken <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </form>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <div className="font-semibold text-emerald-800 mb-1">Danke! Wir melden uns, sobald die PDL-Pakete live gehen.</div>
                    <p className="text-sm text-emerald-700">
                      Bis dahin können Sie candiq intern mit HR-Paketen testen.
                    </p>
                    <div className="mt-3">
                      <Link href="/register" className="text-sm font-semibold text-emerald-800 hover:underline inline-flex items-center gap-1">
                        HR-Paket jetzt testen <Building2 className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}

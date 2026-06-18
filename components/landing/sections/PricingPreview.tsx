'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import { Check, ArrowRight, Building2, Users2, Clock3 } from 'lucide-react'
import { HR_PLANS } from '@/lib/utils'
import { Reveal } from '../Reveal'
import { BOOKING_URL } from '@/lib/site'

export function PricingPreview() {
  const [tab, setTab] = useState<'hr' | 'agency'>('hr')
  const [annual, setAnnual] = useState(true)

  const plans = HR_PLANS.slice(0, 3)

  return (
    <section id="preise" className="py-28 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-4">
              Preise
            </div>
            <h2 className="text-[clamp(32px,5vw,52px)] font-bold tracking-tighter mb-5 text-text-primary">
              Faire Preise. <span className="text-gradient-brand">Klare Pakete.</span>
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              Keine versteckten Kosten. Monatlich kündbar. Jederzeit upgraden oder downgraden.
            </p>
          </div>
        </Reveal>

        {/* Audience tabs */}
        <Reveal>
          <div className="flex flex-col items-center gap-5 mb-10">
            <div className="inline-flex items-center bg-bg-secondary border border-border rounded-full p-1">
              <button
                onClick={() => setTab('hr')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  tab === 'hr'
                    ? 'bg-white text-text-primary shadow-card'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Building2 className="w-4 h-4" /> HR-Abteilungen
              </button>
              <button
                onClick={() => setTab('agency')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  tab === 'agency'
                    ? 'bg-white text-text-primary shadow-card'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Users2 className="w-4 h-4" /> Personaldienstleister
              </button>
            </div>

            {tab === 'hr' && (
              <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${!annual ? 'text-text-primary' : 'text-text-muted'}`}>Monatlich</span>
              <button
                onClick={() => setAnnual(!annual)}
                className="relative w-12 h-6 rounded-full bg-brand-500 transition-colors"
              >
                <motion.div
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                  animate={{ left: annual ? '26px' : '2px' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              </button>
              <span className={`text-sm font-medium ${annual ? 'text-text-primary' : 'text-text-muted'}`}>
                Jährlich <span className="text-emerald-600 font-bold">−20 %</span>
              </span>
              </div>
            )}
          </div>
        </Reveal>

        {/* Cards */}
        {tab === 'hr' ? (
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid md:grid-cols-3 gap-5"
          >
            {plans.map((p) => {
              const price = annual ? p.priceAnnual : p.priceMonthly
              return (
                <motion.div
                  key={p.id}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                  className={`relative rounded-3xl p-7 transition-all ${
                    p.highlight
                      ? 'bg-gradient-to-br from-brand-600 via-brand-700 to-violet text-white shadow-float'
                      : 'bg-white border border-border shadow-card-md hover:shadow-card-xl'
                  }`}
                >
                  {p.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white text-brand-700 shadow-card">
                      {p.badge}
                    </div>
                  )}

                  <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${p.highlight ? 'text-white/70' : 'text-brand-600'}`}>
                    {p.name}
                  </div>
                  <div className={`text-sm mb-5 ${p.highlight ? 'text-white/80' : 'text-text-secondary'}`}>{p.tagline}</div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black tracking-tighter" style={{ fontFeatureSettings: '"tnum"' }}>
                        {price === 0 ? 'Custom' : `${price}`}
                      </span>
                      {price > 0 && <span className={`text-lg font-medium ${p.highlight ? 'text-white/70' : 'text-text-muted'}`}>€/Mo.</span>}
                    </div>
                    {p.pricePerCheck !== null && (
                      <div className={`text-xs mt-1 ${p.highlight ? 'text-white/60' : 'text-text-muted'}`}>
                        Inkl. {p.includedChecks} Prüfungen · danach {p.pricePerCheck} €/Stück
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2.5 mb-7">
                    {p.features.slice(0, 5).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${p.highlight ? 'text-white' : 'text-brand-600'}`} />
                        <span className={p.highlight ? 'text-white/95' : 'text-text-primary'}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={BOOKING_URL}
                    className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-full font-semibold text-sm transition-all ${
                      p.highlight
                        ? 'bg-white text-brand-700 hover:bg-bg-secondary'
                        : 'btn-primary'
                    }`}
                  >
                    Termin buchen
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="card-lg bg-violet/5 border-violet/20">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white text-violet border border-violet/20 mb-3">
                <Clock3 className="w-3.5 h-3.5" /> Bald verfügbar
              </div>
              <h3 className="text-xl font-bold tracking-tight text-text-primary mb-2">PDL-Pakete in Entwicklung</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Spezielle PDL-Pakete mit Multi-Mandanten, White-Label und API befinden sich aktuell in Entwicklung.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {['Agency Starter (in Planung)', 'Agency Professional (in Planung)', 'Agency Enterprise (in Planung)'].map((name) => (
                <div key={name} className="rounded-2xl border border-border bg-white p-5 shadow-card">
                  <div className="text-xs font-bold uppercase tracking-widest text-violet mb-2">In Planung</div>
                  <div className="text-sm font-semibold text-text-primary">{name}</div>
                </div>
              ))}
            </div>

            <div className="card-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-text-secondary">
                PDL-Konten sind ab sofort buchbar. Multi-Mandanten + White-Label folgen iterativ — wir
                planen die Roadmap gemeinsam mit den ersten Pilotkunden.
              </div>
              <Link href="/register?type=RECRUITMENT_AGENCY" className="btn-primary whitespace-nowrap">
                PDL-Konto anlegen <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}

        {/* Add-on-Preise inline — damit Budget-Planung ohne Klick funktioniert.
            Vollständige Doku unter /preise#addons */}
        <div className="mt-10 max-w-3xl mx-auto">
          <div className="text-center mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">
              Pay-as-you-go Add-ons
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Aufpreise pro Prüfung, kein Abo nötig — auch ohne Plan buchbar.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <AddonPill name="Einzelcheck" price="49 €" sub="ohne Bundle" />
            <AddonPill name="Express 24h" price="+29 €" sub="garantiert &lt; 24 h" highlight />
            <AddonPill name="Deep-Check" price="249 €" sub="60-Min-Interview" />
            <AddonPill name="Zeugnis prüfen" price="+19 €" sub="ergänzend zum Check" />
          </div>
          <div className="text-center mt-3">
            <Link
              href="/preise#addons"
              className="text-xs text-text-muted hover:text-brand-700 underline"
            >
              Alle 6 Add-ons im Detail
            </Link>
          </div>
        </div>

        <div className="text-center mt-10">
          <Link href="/preise" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800 group">
            Alle Pakete & Enterprise-Optionen vergleichen
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function AddonPill({
  name,
  price,
  sub,
  highlight,
}: {
  name: string
  price: string
  sub: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-3 text-center transition-colors ${
        highlight
          ? 'bg-rose-50 border-rose-200'
          : 'bg-white border-border hover:border-brand-200'
      }`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        {name}
      </div>
      <div
        className={`text-base font-bold mt-0.5 ${highlight ? 'text-rose-700' : 'text-text-primary'}`}
        dangerouslySetInnerHTML={{ __html: price }}
      />
      <div className="text-[10px] text-text-muted mt-0.5" dangerouslySetInnerHTML={{ __html: sub }} />
    </div>
  )
}

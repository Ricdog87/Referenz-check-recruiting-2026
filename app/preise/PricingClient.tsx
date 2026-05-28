'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, X, ArrowRight, Building2, Users2, ChevronDown, Clock3, CalendarCheck } from 'lucide-react'
import { HR_PLANS } from '@/lib/utils'
import { Reveal } from '@/components/landing/Reveal'
import { BOOKING_URL } from '@/lib/site'
import { PricingCTA } from '@/components/PricingCTA'
import { AddonsShowcase } from '@/components/landing/sections/AddonsShowcase'

export function PricingClient() {
  const [tab, setTab] = useState<'hr' | 'agency'>('hr')
  const [annual, setAnnual] = useState(true)

  const plans = HR_PLANS

  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-12 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[1000px] h-[400px]"
            style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.18), transparent 60%)', filter: 'blur(80px)' }} />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 mb-5">
            <CalendarCheck className="w-3.5 h-3.5" /> Testzugang nach 15-Min-Termin · monatlich kündbar
          </div>
          <h1 className="text-[clamp(40px,6vw,68px)] font-black tracking-tightest mb-5 leading-[1.05]">
            Klare Preise. <br />
            <span className="text-gradient-brand">Bezahlt sich ab dem ersten Hire.</span>
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Wählen Sie das Paket, das zu Ihrem Hiring-Volumen passt. Monatlich kündbar, kein Mindestvertrag, jederzeit upgradebar.
          </p>
        </div>
      </section>

      {/* Tabs + toggle */}
      <section className="px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center gap-5 mb-10">
            <div id={tab} className="inline-flex items-center bg-bg-secondary border border-border rounded-full p-1">
              <button
                onClick={() => setTab('hr')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  tab === 'hr' ? 'bg-white text-text-primary shadow-card' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Building2 className="w-4 h-4" /> HR-Abteilungen
              </button>
              <button
                onClick={() => setTab('agency')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  tab === 'agency' ? 'bg-white text-text-primary shadow-card' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Users2 className="w-4 h-4" /> Personaldienstleister
              </button>
            </div>

            {tab === 'hr' && (
              <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${!annual ? 'text-text-primary' : 'text-text-muted'}`}>Monatlich</span>
              <button onClick={() => setAnnual(!annual)} className="relative w-12 h-6 rounded-full bg-brand-500 transition-colors">
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
        </div>
      </section>

      {/* Plans */}
      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          {tab === 'hr' ? (
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid gap-5 md:grid-cols-3"
            >
              {plans.map((p) => {
                const price = annual ? p.priceAnnual : p.priceMonthly
                return (
                  <motion.div
                    key={p.id}
                    whileHover={{ y: -6 }}
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

                    <div className="mb-5">
                      {price === 0 ? (
                        <div className="text-4xl font-black tracking-tighter">Auf Anfrage</div>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-black tracking-tighter" style={{ fontFeatureSettings: '"tnum"' }}>
                            {price}
                          </span>
                          <span className={`text-base font-medium ${p.highlight ? 'text-white/70' : 'text-text-muted'}`}>€/Mo.</span>
                        </div>
                      )}
                      {p.pricePerCheck !== null && p.pricePerCheck > 0 && (
                        <div className={`text-xs mt-1 ${p.highlight ? 'text-white/60' : 'text-text-muted'}`}>
                          Inkl. {p.includedChecks} Prüfungen · danach {p.pricePerCheck} €/Stück
                        </div>
                      )}
                      <div className={`text-xs mt-1 ${p.highlight ? 'text-white/60' : 'text-text-muted'}`}>
                        {typeof p.seats === 'number' ? `${p.seats} ${p.seats === 1 ? 'Sitz' : 'Sitze'}` : p.seats} inklusive
                      </div>
                    </div>

                    <ul className="space-y-2.5 mb-7">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${p.highlight ? 'text-white' : 'text-brand-600'}`} />
                          <span className={p.highlight ? 'text-white/95' : 'text-text-primary'}>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {p.id === 'ENTERPRISE' ? (
                      <Link
                        href="mailto:hello@candiq.de?subject=Enterprise-Anfrage"
                        className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-full font-semibold text-sm transition-all ${
                          p.highlight ? 'bg-white text-brand-700 hover:bg-bg-secondary' : 'btn-primary'
                        }`}
                      >
                        {p.ctaLabel}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <PricingCTA
                        plan={p.id.toLowerCase() as 'starter' | 'professional' | 'business'}
                        interval={annual ? 'yearly' : 'monthly'}
                        highlight={p.highlight}
                      />
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          ) : (
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div className="card-lg bg-violet/5 border-violet/20">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white text-violet border border-violet/20 mb-3">
                  <Clock3 className="w-3.5 h-3.5" /> Bald verfügbar
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-text-primary mb-2">PDL-Pakete in Vorbereitung</h2>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Spezielle PDL-Pakete mit Multi-Mandanten, White-Label und API befinden sich aktuell in Entwicklung.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {['Agency Starter (in Planung)', 'Agency Professional (in Planung)', 'Agency Enterprise (in Planung)'].map((name) => (
                  <div key={name} className="rounded-2xl border border-border bg-white p-6 shadow-card">
                    <div className="text-xs font-bold uppercase tracking-widest text-violet mb-2">In Planung</div>
                    <div className="text-base font-semibold text-text-primary">{name}</div>
                    <div className="text-xs text-text-muted mt-2">Preis- und Feature-Details folgen mit dem Launch.</div>
                  </div>
                ))}
              </div>

              <div className="card-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-text-secondary">
                  Geplanter Launch: Q4 2026. Tragen Sie sich ein, um als Erste informiert zu werden.
                </div>
                <Link href="/waitlist-agency" className="btn-primary whitespace-nowrap">
                  Auf PDL-Warteliste setzen <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Recruiting-Services & Add-ons (Deep-Check premium hero + service grids) */}
      <AddonsShowcase />

      {/* Comparison table */}
      <section className="py-20 px-6 bg-bg-secondary">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold tracking-tighter mb-3 text-text-primary">Detaillierter Vergleich</h2>
              <p className="text-text-secondary">Alle Features auf einen Blick</p>
            </div>
          </Reveal>

          <Reveal>
            <div className="card-lg shadow-card-md overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-5 font-semibold text-text-primary">Feature</th>
                      {plans.slice(0, 3).map((p) => (
                        <th key={p.id} className="text-center p-5 font-semibold text-text-primary">{p.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { l: 'Inkludierte Prüfungen / Monat', vs: plans.slice(0, 3).map((p) => p.includedChecks > 0 ? `${p.includedChecks}` : 'Custom') },
                      { l: 'Zusatz-Prüfung', vs: plans.slice(0, 3).map((p) => p.pricePerCheck ? `${p.pricePerCheck} €` : 'Verhandelt') },
                      { l: 'Nutzer-Sitze', vs: plans.slice(0, 3).map((p) => `${p.seats}`) },
                      { l: 'CV- & Zeugnis-Upload', vs: plans.slice(0, 3).map(() => true) },
                      { l: 'White-Label PDF-Reports', vs: plans.slice(0, 3).map((_, i) => i >= 1) },
                      { l: 'ATS-Integration', vs: plans.slice(0, 3).map((_, i) => i >= 2) },
                      { l: 'Multi-Mandanten / Workspaces', vs: plans.slice(0, 3).map((_, i) => i >= 2) },
                      { l: 'API + Webhooks', vs: plans.slice(0, 3).map((_, i) => i >= 2) },
                      { l: 'Dediziertes Onboarding', vs: plans.slice(0, 3).map((_, i) => i >= 2) },
                      { l: 'Priority Support', vs: plans.slice(0, 3).map((_, i) => i >= 1) },
                      { l: 'Audit-Trail Export (DSGVO Art. 30)', vs: plans.slice(0, 3).map((_, i) => i >= 2) },
                    ].map((row, ri) => (
                      <tr key={ri} className="border-b border-border last:border-0 hover:bg-bg-secondary/50">
                        <td className="p-4 text-text-primary font-medium">{row.l}</td>
                        {row.vs.map((v, vi) => (
                          <td key={vi} className="p-4 text-center">
                            {typeof v === 'boolean'
                              ? v
                                ? <Check className="w-5 h-5 text-brand-600 inline" />
                                : <X className="w-5 h-5 text-text-disabled inline" />
                              : <span className="text-text-secondary">{v}</span>
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold tracking-tighter mb-3 text-text-primary">Häufige Fragen</h2>
              <p className="text-text-secondary">Alles, was Sie vor dem Start wissen müssen</p>
            </div>
          </Reveal>

          <div className="space-y-3">
            {[
              {
                q: 'Wie bekomme ich einen Testzugang?',
                a: 'Über einen 15-Minuten-Termin. Reference Checks brauchen aktive Begleitung — wir richten Ihren Testzugang persönlich ein, klären Use Case und Datenfluss und führen Sie durch den Report. Kein Self-Service-Trial, keine starre Befristung.',
              },
              {
                q: 'Wie lange habe ich Zeit, candiq zu evaluieren?',
                a: 'So lange Sie brauchen. Der Testzugang ist nicht zeitbefristet — Sie entscheiden gemeinsam mit uns, wann der produktive Start sinnvoll ist. Erst dann beginnt die Abrechnung.',
              },
              {
                q: 'Kann ich jederzeit das Paket wechseln?',
                a: 'Ja. Upgrades sind sofort wirksam (anteilige Abrechnung), Downgrades zum Ende des Abrechnungszeitraums.',
              },
              {
                q: 'Was, wenn ich mehr Prüfungen brauche als im Paket enthalten?',
                a: 'Zusatz-Prüfungen werden zum Paketpreis berechnet (siehe Spalte "Zusatz-Prüfung" oben). Ab 50 zusätzlichen Checks/Monat erhalten Sie automatische Volumenrabatte.',
              },
              {
                q: 'Wie funktioniert die Abrechnung für Personaldienstleister?',
                a: 'PDL-Pakete sind aktuell in Vorbereitung. Tragen Sie sich auf die Warteliste ein, um zuerst informiert zu werden und den Rollout mitzugestalten.',
              },
              {
                q: 'Ist candiq DSGVO-konform?',
                a: 'Ja, by Design. Alle Daten in deutschen Rechenzentren, Einwilligungs-Workflow für Kandidaten, Recht auf Auskunft & Löschung per Knopfdruck. AVV-Vertrag standardmäßig im Onboarding.',
              },
              {
                q: 'Bietet ihr Enterprise-Verträge & SSO?',
                a: 'Ja. Für 50+ Sitze, SSO-Integration (SAML, Azure AD, Okta) oder On-Premise-Deployments — bitte direkten Kontakt unter hello@candiq.de.',
              },
            ].map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold tracking-tight mb-4 text-text-primary">Noch unsicher?</h3>
          <p className="text-text-secondary mb-7">Schauen Sie sich candiq in der Live-Demo an — voll funktionsfähig, ohne Anmeldung. Oder vereinbaren Sie ein 15-Minuten-Gespräch an Ihrem konkreten Use Case und erhalten direkt einen Testzugang.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary py-3 px-7 inline-flex items-center gap-2"
            >
              <CalendarCheck className="w-4 h-4" />
              15-Min-Termin buchen
            </Link>
            <Link href="/demo" className="btn-secondary py-3 px-7">Live-Demo öffnen</Link>
          </div>
        </div>
      </section>
    </>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      className="card-md cursor-pointer"
      onClick={() => setOpen(!open)}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="font-semibold text-text-primary">{q}</div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-text-secondary" />
        </motion.div>
      </div>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="text-sm text-text-secondary leading-relaxed pt-3">{a}</p>
      </motion.div>
    </motion.div>
  )
}

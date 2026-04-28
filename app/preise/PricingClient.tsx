'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, X, ArrowRight, Building2, Users2, Sparkles, ChevronDown } from 'lucide-react'
import { HR_PLANS, AGENCY_PLANS } from '@/lib/utils'
import { Reveal } from '@/components/landing/Reveal'

export function PricingClient() {
  const [tab, setTab] = useState<'hr' | 'agency'>('hr')
  const [annual, setAnnual] = useState(true)

  const plans = tab === 'hr' ? HR_PLANS : AGENCY_PLANS

  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-12 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[1000px] h-[400px]"
            style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.18), transparent 60%)', filter: 'blur(80px)' }} />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-5">
            <Sparkles className="w-3.5 h-3.5" /> 14 Tage kostenlos · jederzeit kündbar
          </div>
          <h1 className="text-[clamp(40px,6vw,68px)] font-black tracking-tightest mb-5 leading-[1.05]">
            Faire Preise. <br />
            <span className="text-gradient-brand">Klare Pakete.</span>
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Je nach Volumen das passende Paket. Wechseln Sie jederzeit, ohne Vertragslaufzeit.
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
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`grid gap-5 ${plans.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'}`}
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

                  <Link
                    href={p.id === 'ENTERPRISE' ? 'mailto:sales@candiq.de' : `/register?plan=${p.id}&type=${p.forType}`}
                    className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-full font-semibold text-sm transition-all ${
                      p.highlight
                        ? 'bg-white text-brand-700 hover:bg-bg-secondary'
                        : 'btn-primary'
                    }`}
                  >
                    {p.ctaLabel}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

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
                      {plans.slice(0, 4).map((p) => (
                        <th key={p.id} className="text-center p-5 font-semibold text-text-primary">{p.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { l: 'Inkludierte Prüfungen / Monat', vs: plans.slice(0, 4).map((p) => p.includedChecks > 0 ? `${p.includedChecks}` : 'Custom') },
                      { l: 'Zusatz-Prüfung', vs: plans.slice(0, 4).map((p) => p.pricePerCheck ? `${p.pricePerCheck} €` : 'Verhandelt') },
                      { l: 'Nutzer-Sitze', vs: plans.slice(0, 4).map((p) => `${p.seats}`) },
                      { l: 'CV- & Zeugnis-Upload', vs: plans.slice(0, 4).map(() => true) },
                      { l: 'White-Label PDF-Reports', vs: plans.slice(0, 4).map((_, i) => i >= 1) },
                      { l: 'ATS-Integration', vs: plans.slice(0, 4).map((_, i) => i >= 2) },
                      { l: 'Multi-Mandanten / Workspaces', vs: plans.slice(0, 4).map((_, i) => tab === 'agency' || i >= 2) },
                      { l: 'API + Webhooks', vs: plans.slice(0, 4).map((_, i) => i >= 2 || (tab === 'agency' && i >= 1)) },
                      { l: 'SSO (SAML / Azure AD)', vs: plans.slice(0, 4).map((_, i) => i === 3) },
                      { l: 'Dediziertes Onboarding', vs: plans.slice(0, 4).map((_, i) => i >= 2) },
                      { l: 'Priority Support', vs: plans.slice(0, 4).map((_, i) => i >= 1) },
                      { l: 'Audit-Trail Export (DSGVO Art. 30)', vs: plans.slice(0, 4).map((_, i) => i >= 2) },
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
                q: 'Was ist im 14-tägigen Test enthalten?',
                a: 'Voller Funktionsumfang Ihres gewählten Pakets, inklusive 3 kostenlosen Referenzprüfungen. Keine Kreditkarte nötig — Sie müssen nur ein Konto erstellen.',
              },
              {
                q: 'Was passiert nach dem Test?',
                a: 'Sie können das Abonnement aktivieren oder Ihr Konto verfällt automatisch. Wir buchen niemals etwas ohne Ihre ausdrückliche Bestätigung.',
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
                a: 'Sie zahlen das gewählte Agency-Paket. Ihren Endkunden können Sie die Reports im Rahmen Ihres Vermittlungshonorars in Rechnung stellen — wir geben Ihnen White-Label-Reports an die Hand.',
              },
              {
                q: 'Ist candiq DSGVO-konform?',
                a: 'Ja, by Design. Alle Daten in deutschen Rechenzentren, Einwilligungs-Workflow für Kandidaten, Recht auf Auskunft & Löschung per Knopfdruck. AVV-Vertrag standardmäßig im Onboarding.',
              },
              {
                q: 'Bietet ihr Enterprise-Verträge & SSO?',
                a: 'Ja. Für 50+ Sitze, SSO-Integration (SAML, Azure AD, Okta) oder On-Premise-Deployments — bitte direkten Kontakt unter sales@candiq.de.',
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
          <p className="text-text-secondary mb-7">Buchen Sie ein 15-min Demo-Gespräch. Wir zeigen candiq live an Ihrem Use Case.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="mailto:sales@candiq.de" className="btn-primary py-3 px-7">Demo buchen</a>
            <Link href="/login?demo=1" className="btn-secondary py-3 px-7">Selbst testen</Link>
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

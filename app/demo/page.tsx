'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, Briefcase, Rocket, Loader2, ArrowRight,
  CheckCircle2, ShieldCheck, Users, ClipboardList, ShoppingBag,
  Sparkles, BarChart3, Clock3, ChevronLeft,
} from 'lucide-react'

type DemoKey = 'hr' | 'enterprise' | 'boutique'

const DEMOS: {
  key: DemoKey
  label: string
  company: string
  role: string
  plan: string
  planColor: string
  icon: typeof Building2
  gradient: string
  ring: string
  badgeBg: string
  candidates: number
  checks: number
  addons: string[]
  highlights: string[]
}[] = [
  {
    key: 'hr',
    label: 'HR Inhouse',
    company: 'Demo Holding GmbH',
    role: 'Lara Weber · HR Managerin',
    plan: 'Professional',
    planColor: 'text-brand-700 bg-brand-50 border-brand-200',
    icon: Building2,
    gradient: 'from-brand-600 via-brand-700 to-violet',
    ring: 'ring-brand-400',
    badgeBg: 'bg-brand-50',
    candidates: 9,
    checks: 21,
    addons: ['5er-Pack Checks', '2× candiq Interview'],
    highlights: [
      'Pipeline-Übersicht mit 9 Kandidaten',
      'Activity Chart (14 Tage)',
      'Diskrepanz-Markierungen',
      'Plan-Nutzungsanzeige',
      'Add-ons buchen',
    ],
  },
  {
    key: 'enterprise',
    label: 'Enterprise',
    company: 'NovaCorp Holding AG',
    role: 'Dr. Martin Krüger · Head of HR',
    plan: 'Business',
    planColor: 'text-violet bg-violet/10 border-violet/20',
    icon: Briefcase,
    gradient: 'from-violet via-purple-700 to-brand-800',
    ring: 'ring-violet',
    badgeBg: 'bg-violet/5',
    candidates: 15,
    checks: 35,
    addons: ['10er-Pack Checks', '4× Express 24h', '3× Interview'],
    highlights: [
      'Großes Kandidaten-Portfolio (15)',
      'Multi-Departement-Ansicht',
      'Höchste Check-Volumen-Auslastung',
      'Mehrere Add-on-Bestellungen',
      'Turnaround-Analyse',
    ],
  },
  {
    key: 'boutique',
    label: 'Startup',
    company: 'Boutique Talent GmbH',
    role: 'Tina Lange · Geschäftsführerin',
    plan: 'Starter',
    planColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    icon: Rocket,
    gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    ring: 'ring-emerald-400',
    badgeBg: 'bg-emerald-50',
    candidates: 5,
    checks: 9,
    addons: ['1× Einzel-Check'],
    highlights: [
      'Kompaktes Starter-Dashboard',
      'Trial-Countdown (14 Tage)',
      'Onboarding-Flow sichtbar',
      'Upgrade-Hinweis im Dashboard',
      'Ideal für kleines Team',
    ],
  },
]

export default function DemoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<DemoKey | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function startDemo(key: DemoKey) {
    if (loading) return
    setError(null)
    setLoading(key)
    try {
      const res = await fetch(`/api/demo?type=${key}`, { method: 'POST', cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Demo konnte nicht geladen werden.')

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })
      if (result?.error) throw new Error('Anmeldung fehlgeschlagen — bitte erneut versuchen.')

      router.push('/dashboard')
      router.refresh()
    } catch (e: any) {
      setError(e.message ?? 'Demo nicht verfügbar.')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Header bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#8b5cf6)', boxShadow: '0 4px 12px rgba(79,70,229,.25)' }}>
              <span className="text-white text-[10px] font-black">CQ</span>
            </div>
            <span className="text-sm font-bold text-text-primary">candiq</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-xs font-medium text-text-secondary hover:text-text-primary">Anmelden</Link>
            <Link href="/register" className="btn-primary text-xs py-1.5 px-4">Kostenlos testen</Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-violet py-16 px-6">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-cyan/20 blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center text-white">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300" />
            </span>
            Live-Demo · Kein Konto erforderlich
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tightest leading-tight mb-4">
            Erleben Sie candiq<br />
            <span className="text-amber-300">in Echtzeit</span>
          </h1>
          <p className="text-base text-white/80 max-w-xl mx-auto leading-relaxed">
            Wählen Sie ein Demo-Profil — wir bereiten ein vorbefülltes Konto mit echten Kandidaten,
            Referenzprüfungen und Auswertungen vor. Ein Klick, sofort drin.
          </p>
        </div>
      </div>

      {/* Demo profile cards */}
      <div className="max-w-6xl mx-auto px-6 -mt-6 pb-20">
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm text-rose-700 bg-rose-50 border border-rose-200 max-w-xl mx-auto text-center">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-5">
          {DEMOS.map((demo) => {
            const Icon = demo.icon
            const isLoading = loading === demo.key
            const isDisabled = loading !== null && !isLoading

            return (
              <div
                key={demo.key}
                className={`bg-white rounded-3xl border border-border shadow-card overflow-hidden flex flex-col transition-all hover:shadow-card-lg ${
                  isLoading ? `ring-2 ${demo.ring}` : ''
                }`}
              >
                {/* Card header gradient */}
                <div className={`relative bg-gradient-to-br ${demo.gradient} p-6 text-white`}>
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
                  <div className="relative">
                    <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-0.5">{demo.label}</div>
                    <div className="text-lg font-black leading-tight">{demo.company}</div>
                    <div className="text-xs text-white/70 mt-1">{demo.role}</div>
                  </div>
                </div>

                {/* Plan badge + stats */}
                <div className="px-5 py-4 border-b border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${demo.planColor}`}>
                      <Sparkles className="w-2.5 h-2.5" />
                      {demo.plan}-Plan
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`rounded-xl p-3 ${demo.badgeBg}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Users className="w-3 h-3 text-text-muted" />
                        <span className="text-[10px] text-text-muted font-medium">Kandidaten</span>
                      </div>
                      <div className="text-xl font-black text-text-primary">{demo.candidates}</div>
                    </div>
                    <div className={`rounded-xl p-3 ${demo.badgeBg}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <ClipboardList className="w-3 h-3 text-text-muted" />
                        <span className="text-[10px] text-text-muted font-medium">Prüfungen</span>
                      </div>
                      <div className="text-xl font-black text-text-primary">{demo.checks}</div>
                    </div>
                  </div>
                </div>

                {/* What you'll see */}
                <div className="px-5 py-4 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Was Sie sehen werden</div>
                  <ul className="space-y-2">
                    {demo.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-xs text-text-secondary">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        {h}
                      </li>
                    ))}
                  </ul>

                  {demo.addons.length > 0 && (
                    <div className="mt-4">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Gebuchte Add-ons</div>
                      <div className="flex flex-wrap gap-1">
                        {demo.addons.map((a) => (
                          <span key={a} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200">
                            <ShoppingBag className="w-2.5 h-2.5" />
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="px-5 pb-5">
                  <button
                    onClick={() => startDemo(demo.key)}
                    disabled={isDisabled || isLoading}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all bg-gradient-to-r ${demo.gradient} text-white shadow-card hover:shadow-card-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Konto wird vorbereitet…
                      </>
                    ) : (
                      <>
                        Als {demo.label} einloggen
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom trust + info strip */}
        <div className="mt-10 grid sm:grid-cols-3 gap-4">
          {[
            { icon: Clock3, title: 'Sofort einsatzbereit', desc: 'Das Demo-Konto wird in Sekunden bereitgestellt — keine E-Mail, kein Formular.' },
            { icon: ShieldCheck, title: 'Keine echten Daten', desc: 'Alle Kandidaten und Checks sind synthetisch generiert. DSGVO-konform.' },
            { icon: BarChart3, title: 'Vollständiges Dashboard', desc: 'Sie sehen exakt dasselbe Dashboard, das echte Kunden täglich nutzen.' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="bg-white rounded-2xl border border-border p-5 flex items-start gap-3 shadow-card">
                <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <div className="text-xs font-bold text-text-primary mb-1">{item.title}</div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">{item.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Register CTA */}
        <div className="mt-8 text-center">
          <p className="text-sm text-text-secondary mb-3">Bereit für Ihren eigenen Workspace?</p>
          <Link href="/register" className="btn-primary py-3 px-8 text-base">
            <Sparkles className="w-4 h-4" />
            14 Tage kostenlos & unverbindlich testen
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-text-muted mt-3">Keine Kreditkarte · Kündigung jederzeit</p>
        </div>
      </div>
    </div>
  )
}

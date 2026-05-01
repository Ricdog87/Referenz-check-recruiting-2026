'use client'

import { useState, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Link from 'next/link'
import {
  Building2, Briefcase, Rocket, Loader2, ArrowRight,
  CheckCircle2, ShieldCheck, Users, ClipboardList, ShoppingBag,
  Sparkles, BarChart3, Clock3, Play, Star,
  TrendingUp, AlertTriangle, Zap,
} from 'lucide-react'

type DemoKey = 'hr' | 'enterprise' | 'boutique'

const DEMOS = [
  {
    key: 'hr' as DemoKey,
    label: 'HR Inhouse',
    company: 'Demo Holding GmbH',
    role: 'Lara Weber · HR Managerin',
    plan: 'Professional',
    icon: Building2,
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #8b5cf6 100%)',
    glowColor: 'rgba(99,102,241,0.4)',
    accentColor: '#6366f1',
    candidates: 9,
    checks: 21,
    badge: 'Beliebt',
    badgeColor: 'bg-amber-400 text-amber-900',
    addons: ['5er-Pack Checks', '2× candiq Interview'],
    highlights: [
      { icon: BarChart3, text: 'Pipeline mit 9 Kandidaten & Charts' },
      { icon: AlertTriangle, text: 'Diskrepanz-Markierungen sichtbar' },
      { icon: TrendingUp, text: 'Activity-Chart über 14 Tage' },
      { icon: ShoppingBag, text: 'Add-ons buchen & verwalten' },
    ],
  },
  {
    key: 'enterprise' as DemoKey,
    label: 'Enterprise',
    company: 'NovaCorp Holding AG',
    role: 'Dr. Martin Krüger · Head of HR',
    plan: 'Business',
    icon: Briefcase,
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%)',
    glowColor: 'rgba(139,92,246,0.4)',
    accentColor: '#8b5cf6',
    candidates: 15,
    checks: 35,
    badge: 'Vollständig',
    badgeColor: 'bg-violet-100 text-violet-800',
    addons: ['10er-Pack', '4× Express 24h', '3× Interview'],
    highlights: [
      { icon: Users, text: '15 Kandidaten, Multi-Dept' },
      { icon: ClipboardList, text: 'Höchste Check-Volumen (35)' },
      { icon: ShoppingBag, text: 'Mehrere Add-on-Bestellungen' },
      { icon: BarChart3, text: 'Turnaround & Pipeline-Analyse' },
    ],
  },
  {
    key: 'boutique' as DemoKey,
    label: 'Startup',
    company: 'Boutique Talent GmbH',
    role: 'Tina Lange · Geschäftsführerin',
    plan: 'Starter',
    icon: Rocket,
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
    glowColor: 'rgba(16,185,129,0.4)',
    accentColor: '#10b981',
    candidates: 5,
    checks: 9,
    badge: 'Einfach',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    addons: ['1× Einzel-Check'],
    highlights: [
      { icon: Rocket, text: 'Starter-Dashboard (kleines Team)' },
      { icon: Clock3, text: 'Trial-Countdown (14 Tage)' },
      { icon: Zap, text: 'Onboarding-Flow & Upgrade-CTA' },
      { icon: ShieldCheck, text: 'DSGVO-Einwilligungs-Flow' },
    ],
  },
]

const FEATURES = [
  { icon: BarChart3, title: 'Echtzeit-Dashboard', desc: 'KPIs, Pipeline-Status und Aktivitäts-Charts wie in der Produktion.' },
  { icon: Users, title: 'Kandidaten-Pipeline', desc: 'Anlegen, Referenzen erfassen, Status tracken — alles simuliert.' },
  { icon: ShoppingBag, title: 'Add-ons buchen', desc: 'Interview-Pakete, Express-Prüfungen, Bulk-CVs — buchbar und direkt sichtbar.' },
  { icon: ShieldCheck, title: 'DSGVO-Compliance', desc: 'Einwilligungsmanagement und Audit-Trail sind vollständig implementiert.' },
]

// 3D Tilt card hook
function useTilt(intensity = 10) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateY = useSpring(useTransform(mx, [-1, 1], [-intensity, intensity]), { stiffness: 150, damping: 20 })
  const rotateX = useSpring(useTransform(my, [-1, 1], [intensity, -intensity]), { stiffness: 150, damping: 20 })
  const glowX = useTransform(mx, [-1, 1], ['0%', '100%'])
  const glowY = useTransform(my, [-1, 1], ['0%', '100%'])

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2)
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2)
  }
  function onLeave() { mx.set(0); my.set(0) }

  return { rotateX, rotateY, glowX, glowY, onMove, onLeave }
}

function DemoCard({ demo, onStart, isLoading, isDisabled }: {
  demo: typeof DEMOS[0]
  onStart: () => void
  isLoading: boolean
  isDisabled: boolean
}) {
  const tilt = useTilt(8)
  const Icon = demo.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformStyle: 'preserve-3d', perspective: 1000 }}
      onMouseMove={tilt.onMove}
      onMouseLeave={tilt.onLeave}
      className="group relative flex flex-col rounded-3xl overflow-hidden bg-white border border-white/60 shadow-card-xl cursor-pointer"
    >
      {/* Mouse-follow glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
        style={{
          background: useTransform(
            [tilt.glowX, tilt.glowY],
            ([x, y]) => `radial-gradient(500px circle at ${x} ${y}, ${demo.glowColor}, transparent 40%)`
          ) as any,
        }}
      />

      {/* Card header */}
      <div
        className="relative p-6 pb-5 overflow-hidden"
        style={{ background: demo.gradient }}
      >
        {/* Blob */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />

        {/* Badge */}
        {demo.badge && (
          <span className={`absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${demo.badgeColor}`}>
            {demo.badge}
          </span>
        )}

        <div className="relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mb-4 shadow-lg"
            style={{ transform: 'translateZ(20px)' }}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-0.5">{demo.label}</div>
          <div className="text-xl font-black text-white leading-tight">{demo.company}</div>
          <div className="text-xs text-white/70 mt-1">{demo.role}</div>
        </div>

        {/* Plan badge */}
        <div className="relative z-10 mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20">
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span className="text-[10px] font-bold text-white">{demo.plan}-Plan</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
        <div className="px-5 py-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <Users className="w-3 h-3 text-text-muted" />
            <span className="text-[10px] text-text-muted font-medium uppercase tracking-wide">Kandidaten</span>
          </div>
          <div className="text-2xl font-black text-text-primary" style={{ fontFeatureSettings: '"tnum"' }}>{demo.candidates}</div>
        </div>
        <div className="px-5 py-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <ClipboardList className="w-3 h-3 text-text-muted" />
            <span className="text-[10px] text-text-muted font-medium uppercase tracking-wide">Prüfungen</span>
          </div>
          <div className="text-2xl font-black text-text-primary" style={{ fontFeatureSettings: '"tnum"' }}>{demo.checks}</div>
        </div>
      </div>

      {/* Highlights */}
      <div className="px-5 py-4 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Was Sie sehen & testen</div>
        <ul className="space-y-2">
          {demo.highlights.map(({ icon: HIcon, text }) => (
            <li key={text} className="flex items-center gap-2.5 text-xs text-text-secondary">
              <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${demo.accentColor}18` }}>
                <HIcon className="w-3 h-3" style={{ color: demo.accentColor }} />
              </div>
              {text}
            </li>
          ))}
        </ul>

        {/* Add-ons */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Gebuchte Add-ons</div>
          <div className="flex flex-wrap gap-1">
            {demo.addons.map((a) => (
              <span key={a} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold">
                <ShoppingBag className="w-2.5 h-2.5" />{a}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <button
          onClick={onStart}
          disabled={isDisabled || isLoading}
          className="w-full relative flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group/btn"
          style={{ background: demo.gradient, boxShadow: `0 8px 24px ${demo.glowColor}` }}
        >
          <div className="absolute inset-0 bg-white/0 group-hover/btn:bg-white/10 transition-colors duration-300" />
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin relative z-10" /><span className="relative z-10">Wird vorbereitet…</span></>
          ) : (
            <>
              <Play className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Als {demo.label} einloggen</span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}

export default function DemoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<DemoKey | null>(null)
  const [error, setError] = useState<{ message: string; retryable: boolean; key: DemoKey } | null>(null)

  async function startDemo(key: DemoKey, attempt = 0): Promise<void> {
    if (loading) return
    setError(null)
    setLoading(key)
    try {
      const res = await fetch(`/api/demo?type=${key}`, { method: 'POST', cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) {
        // One automatic silent retry for retryable failures (cold start / transient DB).
        if (data.retryable && attempt === 0) {
          await new Promise((r) => setTimeout(r, 1200))
          return startDemo(key, 1)
        }
        throw Object.assign(
          new Error(data.error ?? 'Demo konnte nicht geladen werden.'),
          { retryable: !!data.retryable },
        )
      }
      const result = await signIn('credentials', { email: data.email, password: data.password, redirect: false })
      if (result?.error) throw Object.assign(new Error('Anmeldung fehlgeschlagen — bitte erneut versuchen.'), { retryable: true })
      router.push('/dashboard')
      router.refresh()
    } catch (e: any) {
      setError({
        message: e.message ?? 'Demo gerade nicht verfügbar.',
        retryable: e.retryable ?? true,
        key,
      })
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] overflow-x-hidden">

      {/* ── Sticky nav ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#8b5cf6)', boxShadow: '0 4px 12px rgba(79,70,229,.3)' }}>
              <span className="text-white text-[10px] font-black">CQ</span>
            </div>
            <span className="text-sm font-bold text-text-primary">candiq</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-xs font-medium text-text-secondary hover:text-text-primary transition-colors">Anmelden</Link>
            <Link href="/register" className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#8b5cf6)', boxShadow: '0 4px 14px rgba(79,70,229,.3)' }}>
              <Sparkles className="w-3.5 h-3.5" />Kostenlos testen
            </Link>
          </div>
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-16 px-6 overflow-hidden">
        {/* Animated blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-10 left-1/4 w-[500px] h-[500px] rounded-full opacity-30"
            style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.5), transparent 65%)', filter: 'blur(60px)' }}
          />
          <motion.div
            animate={{ x: [0, -25, 0], y: [0, 25, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
            className="absolute top-20 right-1/4 w-[400px] h-[400px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.6), transparent 65%)', filter: 'blur(60px)' }}
          />
          <motion.div
            animate={{ x: [0, 20, 0], y: [0, 30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
            className="absolute bottom-0 left-1/2 w-[600px] h-[300px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.4), transparent 65%)', filter: 'blur(60px)' }}
          />
        </div>

        {/* Grid */}
        <div className="absolute inset-0 grid-bg grid-bg-mask opacity-40 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white border border-brand-200 shadow-card text-xs font-semibold text-text-primary"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-600" />
            </span>
            Live · Kein Konto · Echte Produktdaten
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-[clamp(36px,6vw,68px)] font-black tracking-tightest leading-[1.02] mb-6 text-text-primary"
          >
            Sehen Sie sich{' '}
            <span className="text-gradient-brand">candiq</span>
            <br />in 10 Sekunden an
          </motion.h1>

          {/* Explanation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="max-w-2xl mx-auto mb-10"
          >
            <p className="text-lg text-text-secondary leading-relaxed mb-6">
              Drei vorbefüllte Demo-Konten. Wählen Sie das Profil, das Ihrer Situation am nächsten kommt — und sehen Sie das echte Dashboard.{' '}
              <span className="font-semibold text-text-primary">Ein Klick, kein Formular.</span>
            </p>

            {/* What you can test — explanation grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              {FEATURES.map(({ icon: FIcon, title, desc }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.08 }}
                  className="bg-white rounded-2xl border border-border p-3.5 shadow-card"
                >
                  <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-2">
                    <FIcon className="w-4 h-4 text-brand-600" />
                  </div>
                  <div className="text-xs font-bold text-text-primary mb-0.5">{title}</div>
                  <div className="text-[10px] text-text-muted leading-relaxed">{desc}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Demo cards ── */}
      <section className="px-6 pb-10 max-w-6xl mx-auto">
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="mb-6 mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50/80 backdrop-blur-sm px-5 py-4 shadow-card"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-amber-900 mb-0.5">
                  {error.retryable ? 'Demo wird gerade vorbereitet' : 'Demo aktuell nicht verfügbar'}
                </div>
                <p className="text-xs text-amber-800/90 leading-relaxed mb-3">
                  {error.message}
                </p>
                <div className="flex flex-wrap gap-2">
                  {error.retryable && (
                    <button
                      onClick={() => startDemo(error.key)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                    >
                      <Loader2 className="w-3 h-3" /> Erneut versuchen
                    </button>
                  )}
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white border border-amber-200 text-amber-900 hover:bg-amber-100 transition-colors"
                  >
                    Stattdessen kostenloses Konto erstellen <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid md:grid-cols-3 gap-5" style={{ perspective: 1200 }}>
          {DEMOS.map((demo, i) => (
            <motion.div
              key={demo.key}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              <DemoCard
                demo={demo}
                onStart={() => startDemo(demo.key)}
                isLoading={loading === demo.key}
                isDisabled={loading !== null && loading !== demo.key}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="px-6 pb-16 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid sm:grid-cols-3 gap-4"
        >
          {[
            { icon: Clock3, title: 'Bereit in Sekunden', desc: 'Kein Formular, keine E-Mail-Bestätigung. Das Demo-Konto ist in unter drei Sekunden live.' },
            { icon: ShieldCheck, title: 'Synthetische Daten', desc: 'Alle Kandidaten und Checks sind Beispieldaten — DSGVO-konform, ohne echtes Risiko.' },
            { icon: Star, title: 'Echtes Produkt', desc: 'Sie sehen genau das Dashboard, das produktiv genutzt wird — keine Mockups, keine Schönrechnung.' },
          ].map(({ icon: TIcon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
              className="bg-white rounded-2xl border border-border p-5 flex items-start gap-3 shadow-card"
            >
              <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
                <TIcon className="w-4 h-4 text-brand-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-text-primary mb-1">{title}</div>
                <p className="text-[11px] text-text-secondary leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-10 text-center"
        >
          <p className="text-sm text-text-secondary mb-4">Überzeugt? Starten Sie mit Ihrem eigenen Workspace.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-base font-bold px-8 py-3.5 rounded-full text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#8b5cf6)', boxShadow: '0 8px 30px rgba(79,70,229,.35)' }}
          >
            <Sparkles className="w-4 h-4" />
            14 Tage kostenlos & unverbindlich
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-text-muted mt-3">Keine Kreditkarte · Kündigung jederzeit</p>
        </motion.div>
      </section>
    </div>
  )
}

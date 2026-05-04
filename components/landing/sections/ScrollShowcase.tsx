'use client'

import { motion, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion'
import { useRef } from 'react'
import {
  Users, ClipboardList, CheckCircle2, AlertTriangle, Clock, Sparkles,
  TrendingUp, FileText, Phone,
} from 'lucide-react'

/**
 * Cinematic scroll-tied product preview.
 *
 * Beim Scrollen wird das Dashboard-Mockup aus der Tiefe „aufgeklappt":
 *  - rotateX 18° → 0°
 *  - scale 0.85 → 1
 *  - perspective + sticky → das Bild bleibt im Viewport, während der Effekt läuft
 *  - parallel laufende Mini-KPI-Karten ploppen aus der Tiefe nach vorne
 */
export function ScrollShowcase() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })

  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 25, mass: 0.5 })

  const rotateX = useTransform(smooth, [0, 0.4, 0.7, 1], [22, 0, 0, -10])
  const scale = useTransform(smooth, [0, 0.4, 0.7, 1], [0.78, 1, 1, 0.94])
  const y = useTransform(smooth, [0, 0.5], [80, 0])
  const opacity = useTransform(smooth, [0, 0.15, 0.85, 1], [0, 1, 1, 0.6])
  const glow = useTransform(smooth, [0, 0.4, 0.7, 1], [0.3, 1, 1, 0.4])

  // Floating cards
  const card1Y = useTransform(smooth, [0.2, 0.7], [80, -40])
  const card1X = useTransform(smooth, [0.2, 0.7], [-30, -80])
  const card2Y = useTransform(smooth, [0.25, 0.75], [120, -10])
  const card2X = useTransform(smooth, [0.25, 0.75], [40, 100])
  const card3Y = useTransform(smooth, [0.3, 0.8], [200, 30])
  const card3X = useTransform(smooth, [0.3, 0.8], [-60, -120])

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-24 lg:py-36 px-6"
      style={{ perspective: 1600 }}
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          style={{ opacity: glow }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full"
        >
          <div className="w-full h-full" style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.35), transparent 60%)', filter: 'blur(80px)' }} />
        </motion.div>
        <div className="absolute inset-0 grid-bg grid-bg-mask opacity-30" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan/10 text-cyan border border-cyan/20 mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Im Tool
            </div>
            <h2 className="text-[clamp(32px,5vw,54px)] font-bold tracking-tighter mb-5 text-text-primary">
              Ein Dashboard, das <span className="text-gradient-brand">Klarheit schafft.</span>
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              Pipeline, KPIs, Report-Status und Audit-Trail — alles auf einen Blick.
              Scrollen Sie weiter, um es in Aktion zu sehen.
            </p>
          </motion.div>
        </div>

        {/* The 3D stage */}
        <div className="relative" style={{ perspective: 1800 }}>
          <motion.div
            style={{
              rotateX,
              scale,
              y,
              opacity,
              transformStyle: 'preserve-3d',
              transformOrigin: 'center 80%',
            }}
            className="relative mx-auto max-w-5xl"
          >
            <DashboardMock smooth={smooth} />
          </motion.div>

          {/* Floating mini cards */}
          <motion.div
            style={{ y: card1Y, x: card1X, opacity }}
            className="absolute top-[15%] left-1/2 -translate-x-1/2 hidden lg:block"
          >
            <FloatingCard
              tone="emerald"
              icon={CheckCircle2}
              title="Verifiziert"
              value="92 %"
              sub="Quote · 30 T."
            />
          </motion.div>
          <motion.div
            style={{ y: card2Y, x: card2X, opacity }}
            className="absolute top-[35%] left-1/2 -translate-x-1/2 hidden lg:block"
          >
            <FloatingCard
              tone="rose"
              icon={AlertTriangle}
              title="Diskrepanz"
              value="3"
              sub="diese Woche"
            />
          </motion.div>
          <motion.div
            style={{ y: card3Y, x: card3X, opacity }}
            className="absolute top-[55%] left-1/2 -translate-x-1/2 hidden lg:block"
          >
            <FloatingCard
              tone="brand"
              icon={Clock}
              title="Ø Durchlaufzeit"
              value="38 h"
              sub="−18 % vs. Vorwoche"
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function DashboardMock({ smooth }: { smooth: MotionValue<number> }) {
  const lineProgress = useTransform(smooth, [0.3, 0.7], [0, 1])

  return (
    <div className="relative rounded-3xl border border-border bg-white shadow-card-xl overflow-hidden" style={{ transformStyle: 'preserve-3d' }}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-bg-secondary">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-300" />
          <span className="w-3 h-3 rounded-full bg-amber-300" />
          <span className="w-3 h-3 rounded-full bg-emerald-300" />
        </div>
        <div className="ml-3 flex-1 max-w-sm h-6 rounded-md bg-white border border-border text-[10px] text-text-muted flex items-center px-3">
          app.candiq.de/dashboard
        </div>
      </div>

      {/* Welcome strip */}
      <div className="p-6 lg:p-8 bg-gradient-to-br from-brand-600 via-brand-700 to-violet text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-sm font-bold">DH</div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">Demo Holding GmbH</div>
            <div className="text-[10px] text-white/60">Professional Plan · Trial 12 Tage</div>
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-black tracking-tight mb-1">Guten Morgen, Lara.</div>
        <div className="text-sm text-white/80 mb-4">9 Kandidaten · 21 Prüfungen · 3 offen</div>
        <div className="flex gap-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-brand-700">+ Kandidat</span>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/15 text-white border border-white/25">Neue Prüfung</span>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-3 p-6 border-b border-border">
        {[
          { label: 'Kandidaten', value: '9', icon: Users, tone: 'brand' },
          { label: 'Verifiziert', value: '92 %', icon: CheckCircle2, tone: 'emerald' },
          { label: 'Diskrepanz', value: '1', icon: AlertTriangle, tone: 'rose' },
          { label: 'Ø Zeit', value: '38h', icon: Clock, tone: 'violet' },
        ].map((s) => (
          <Stat key={s.label} {...s} />
        ))}
      </div>

      {/* Chart placeholder + list */}
      <div className="grid grid-cols-3 gap-4 p-6">
        <div className="col-span-2 rounded-xl border border-border bg-bg-secondary/40 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Aktivität · 14 Tage</div>
            <div className="flex gap-2 text-[9px]">
              <span className="flex items-center gap-1 text-brand-700"><span className="w-1.5 h-1.5 rounded-full bg-brand-500" />Geprüft</span>
              <span className="flex items-center gap-1 text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Verifiziert</span>
            </div>
          </div>
          <FakeChart progress={lineProgress} />
        </div>
        <div className="rounded-xl border border-border bg-white p-4 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Letzte Prüfungen</div>
          {[
            { name: 'Lukas Berger', emp: 'Zalando SE', tone: 'emerald', label: 'Verifiziert' },
            { name: 'Sarah Hoffmann', emp: 'BMW Group', tone: 'emerald', label: 'Verifiziert' },
            { name: 'Jonas Vogel', emp: 'Otto Group', tone: 'rose', label: 'Diskrepanz' },
          ].map((row) => (
            <div key={row.name} className="flex items-center gap-2 p-1.5 rounded-lg bg-bg-secondary/50">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-100 to-violet/20 border border-brand-200 flex items-center justify-center text-[9px] font-bold text-brand-700">
                {row.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-text-primary truncate">{row.name}</div>
                <div className="text-[9px] text-text-muted truncate">{row.emp}</div>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                row.tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}>{row.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: string }) {
  const toneClass = {
    brand: 'text-brand-600 bg-brand-50 border-brand-200',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    rose: 'text-rose-600 bg-rose-50 border-rose-200',
    violet: 'text-violet bg-violet/10 border-violet/20',
  }[tone] ?? 'text-brand-600 bg-brand-50 border-brand-200'

  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <div className={`w-7 h-7 rounded-lg border flex items-center justify-center mb-2 ${toneClass}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="text-xl font-black tracking-tighter text-text-primary">{value}</div>
      <div className="text-[10px] text-text-muted">{label}</div>
    </div>
  )
}

function FakeChart({ progress }: { progress: MotionValue<number> }) {
  // Build a deterministic SVG sparkline whose stroke-dashoffset is tied to scroll
  const points = '0,52 18,40 36,46 54,28 72,32 90,18 108,24 126,12 144,18 162,8'
  const width = 300
  const height = 80

  return (
    <div className="relative h-24">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gradFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#4f46e5" />
            <stop offset="1" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        {/* fill */}
        <motion.path
          d={`M 0 ${height} L ${points
            .split(' ')
            .map((p) => p.split(',').join(' '))
            .map((p, i, arr) => `L ${p}`)
            .join(' ')} L ${width} ${height} Z`}
          fill="url(#gradFill)"
          style={{ pathLength: progress }}
        />
        {/* line */}
        <motion.polyline
          fill="none"
          stroke="url(#gradStroke)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          style={{ pathLength: progress }}
        />
      </svg>
    </div>
  )
}

function FloatingCard({ tone, icon: Icon, title, value, sub }: {
  tone: 'emerald' | 'rose' | 'brand'
  icon: any
  title: string
  value: string
  sub: string
}) {
  const toneStyles = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-600' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', icon: 'text-rose-600' },
    brand: { bg: 'bg-brand-50', border: 'border-brand-200', text: 'text-brand-700', icon: 'text-brand-600' },
  }[tone]

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border ${toneStyles.border} shadow-card-lg backdrop-blur-md`}>
      <div className={`w-9 h-9 rounded-xl ${toneStyles.bg} border ${toneStyles.border} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${toneStyles.icon}`} />
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{title}</div>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-black tracking-tighter text-text-primary">{value}</span>
          <span className="text-[10px] text-text-muted">{sub}</span>
        </div>
      </div>
    </div>
  )
}

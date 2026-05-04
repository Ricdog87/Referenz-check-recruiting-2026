'use client'

import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { useRef } from 'react'
import {
  ShieldCheck, Phone, FileText, Activity, Users, Lock,
  Zap, BarChart3, Mic,
} from 'lucide-react'
import { Reveal, StaggerChildren, StaggerItem } from '../Reveal'

type Feature = {
  icon: any
  title: string
  desc: string
  color: string
  glow: string
  badge?: string
}

const features: Feature[] = [
  {
    icon: Phone,
    title: 'Telefonische Verifizierung',
    desc: 'Geschulte Reviewer führen strukturierte Reference-Calls — keine Bots, keine generische E-Mail-Tickerei.',
    color: 'from-brand-500 to-brand-700',
    glow: 'rgba(99,102,241,0.3)',
  },
  {
    icon: FileText,
    title: 'Strukturierter Report',
    desc: 'Bewertung pro Station, Diskrepanz-Markierung, Gesprächsnotizen. Direkt teilbar mit Hiring Manager und Compliance.',
    color: 'from-violet to-violet/80',
    glow: 'rgba(139,92,246,0.3)',
  },
  {
    icon: ShieldCheck,
    title: 'DSGVO by Design',
    desc: 'Einwilligungs-Workflow, Recht auf Auskunft & Löschung auf Knopfdruck. Server in Deutschland, AVV inklusive.',
    color: 'from-emerald-500 to-emerald-700',
    glow: 'rgba(16,185,129,0.3)',
  },
  {
    icon: Activity,
    title: 'Live-Status pro Kandidat',
    desc: 'Jederzeit sichtbar, welche Prüfungen offen, in Arbeit oder abgeschlossen sind — inklusive Hinweis bei Verzögerung.',
    color: 'from-cyan to-brand-500',
    glow: 'rgba(6,182,212,0.3)',
  },
  {
    icon: Zap,
    title: 'Express-Option in 24 h',
    desc: 'Wenn es schnell gehen muss: Express-Slot dazubuchen — Standard-Durchlaufzeit liegt sonst unter 48 Stunden.',
    color: 'from-amber-500 to-amber-700',
    glow: 'rgba(245,158,11,0.3)',
  },
  {
    icon: BarChart3,
    title: 'Hiring-KPIs im Dashboard',
    desc: 'Pipeline-Status, Verifizierungsquote und Durchlaufzeit auf einen Blick. Ohne Excel-Hin-und-Her.',
    color: 'from-rose-500 to-violet',
    glow: 'rgba(244,63,94,0.3)',
  },
  {
    icon: Lock,
    title: 'Audit-Trail',
    desc: 'Jeder Datenzugriff geloggt. Export für DSGVO Art. 30, Wirtschaftsprüfer oder interne Compliance.',
    color: 'from-slate-700 to-slate-900',
    glow: 'rgba(15,23,42,0.3)',
  },
  {
    icon: Users,
    title: 'Multi-Mandanten',
    desc: 'Für Personaldienstleister: Endkunden mit eigenem Branding und getrennten Workflows verwalten — derzeit in Closed Beta.',
    color: 'from-amber-500 to-rose-500',
    glow: 'rgba(245,158,11,0.3)',
    badge: 'Closed Beta',
  },
  {
    icon: Mic,
    title: 'candiq Interview',
    desc: 'Strukturierte Kompetenz- und Cultural-Fit-Interviews als Service inkl. Scorecards. Ergänzt Referenzprüfungen ideal.',
    color: 'from-violet to-cyan',
    glow: 'rgba(99,102,241,0.28)',
    badge: 'In Vorbereitung',
  },
]

export function Features() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })
  // sanftes Parallax für Hintergrund-Blobs
  const blob1Y = useTransform(scrollYProgress, [0, 1], [-80, 80])
  const blob2Y = useTransform(scrollYProgress, [0, 1], [60, -60])

  return (
    <section ref={sectionRef} id="features" className="py-28 px-6 bg-bg-secondary relative overflow-hidden">
      <motion.div
        style={{ y: blob1Y }}
        className="absolute -top-40 -left-20 w-[480px] h-[480px] rounded-full opacity-30 blur-3xl pointer-events-none"
      >
        <div className="w-full h-full" style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.5), transparent 60%)' }} />
      </motion.div>
      <motion.div
        style={{ y: blob2Y }}
        className="absolute -bottom-40 -right-20 w-[520px] h-[520px] rounded-full opacity-30 blur-3xl pointer-events-none"
      >
        <div className="w-full h-full" style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.45), transparent 60%)' }} />
      </motion.div>

      <div className="absolute inset-0 grid-bg grid-bg-mask opacity-50 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet/10 text-violet border border-violet/20 mb-4">
              Was Sie bekommen
            </div>
            <h2 className="text-[clamp(32px,5vw,52px)] font-bold tracking-tighter mb-5 text-text-primary">
              Alles, was eine seriöse <br className="hidden sm:block" />
              <span className="text-gradient-brand">Vorqualifizierung</span> braucht.
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              Vom Kandidaten-Upload bis zum auditierbaren Report — in einer Oberfläche. Kein Excel, keine Telefonliste, kein Tool-Wirrwarr.
            </p>
          </div>
        </Reveal>

        <StaggerChildren className="grid md:grid-cols-2 lg:grid-cols-3 gap-5" staggerDelay={0.06}>
          {features.map((f) => (
            <StaggerItem key={f.title}>
              <FeatureCard f={f} />
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  )
}

function FeatureCard({ f }: { f: Feature }) {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateY = useSpring(useTransform(mx, [-1, 1], [-7, 7]), { stiffness: 200, damping: 22 })
  const rotateX = useSpring(useTransform(my, [-1, 1], [7, -7]), { stiffness: 200, damping: 22 })
  const glowX = useTransform(mx, [-1, 1], ['0%', '100%'])
  const glowY = useTransform(my, [-1, 1], ['0%', '100%'])
  const gradientFollow = useTransform(
    [glowX, glowY],
    ([x, y]) => `radial-gradient(420px circle at ${x} ${y}, ${f.glow}, transparent 50%)`,
  )

  function onMove(e: React.MouseEvent) {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2)
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2)
  }
  function onLeave() {
    mx.set(0)
    my.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1000 }}
      className="group relative card-md hover:shadow-card-xl transition-all overflow-hidden h-full"
    >
      {/* Mouse-follow glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: gradientFollow as any }}
      />

      <div className="relative" style={{ transform: 'translateZ(20px)' }}>
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-card`}>
          <f.icon className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
        {f.badge && (
          <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-violet/10 text-violet border border-violet/20 mb-2">
            {f.badge}
          </div>
        )}
        <h3 className="text-base font-semibold text-text-primary mb-2 tracking-tight">{f.title}</h3>
        <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
      </div>
    </motion.div>
  )
}

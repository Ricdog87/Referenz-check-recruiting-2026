'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Link from 'next/link'
import { useRef } from 'react'
import { Building2, Users2, ArrowRight, CheckCircle2, Sparkles, Lock, Calendar, Rocket } from 'lucide-react'
import { Reveal } from '../Reveal'

function useTilt(intensity = 6) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateY = useSpring(useTransform(mx, [-1, 1], [-intensity, intensity]), { stiffness: 200, damping: 20 })
  const rotateX = useSpring(useTransform(my, [-1, 1], [intensity, -intensity]), { stiffness: 200, damping: 20 })
  const glowX = useTransform(mx, [-1, 1], ['0%', '100%'])
  const glowY = useTransform(my, [-1, 1], ['0%', '100%'])
  return { rotateX, rotateY, mx, my, glowX, glowY }
}

export function TwoAudiences() {
  return (
    <section id="zielgruppen" className="py-28 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 mb-4">
              Für wen ist candiq?
            </div>
            <h2 className="text-[clamp(32px,5vw,52px)] font-bold tracking-tighter mb-5 text-text-primary">
              Für interne HR-Teams <br className="hidden sm:block" />
              und <span className="text-gradient-brand">Personaldienstleister.</span>
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              HR-Pakete sind heute live und produktiv nutzbar. PDL-Pakete mit Multi-Mandanten und
              White-Label folgen — frühen Zugang können Sie heute sichern.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6 items-stretch" style={{ perspective: 1400 }}>
          <HrCard />
          <PdlCard />
        </div>
      </div>
    </section>
  )
}

// ─── HR Card (Live) ──────────────────────────────────────────────
function HrCard() {
  const ref = useRef<HTMLDivElement>(null)
  const tilt = useTilt(5)

  function onMove(e: React.MouseEvent) {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    tilt.mx.set(((e.clientX - r.left) / r.width - 0.5) * 2)
    tilt.my.set(((e.clientY - r.top) / r.height - 0.5) * 2)
  }
  function onLeave() {
    tilt.mx.set(0)
    tilt.my.set(0)
  }

  const bullets = [
    'Strukturierte Reference-Workflows pro Rolle',
    'Verifizierte Stationen vor dem Erstgespräch',
    'Audit-Trail für Compliance & Wirtschaftsprüfer',
    'Berichte direkt teilbar mit Hiring Manager',
  ]

  return (
    <Reveal>
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3 }}
        style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformStyle: 'preserve-3d' }}
        className="group relative h-full overflow-hidden card-lg shadow-card-lg hover:shadow-card-xl transition-shadow bg-gradient-to-br from-brand-50/60 to-white"
      >
        {/* Mouse-follow glow */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: useTransform(
              [tilt.glowX, tilt.glowY],
              ([x, y]) => `radial-gradient(600px circle at ${x} ${y}, rgba(99,102,241,0.18), transparent 40%)`,
            ) as any,
          }}
        />
        <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full opacity-30 blur-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-violet" />

        {/* LIVE Badge */}
        <div className="absolute top-5 right-5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200" style={{ transform: 'translateZ(40px)' }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600" />
          </span>
          Live & produktiv
        </div>

        <div className="relative" style={{ transform: 'translateZ(20px)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-violet flex items-center justify-center shadow-glow">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-bold text-brand-700 uppercase tracking-widest">Inhouse Recruiting</span>
          </div>

          <h3 className="text-3xl font-bold text-text-primary tracking-tight mb-3">HR-Abteilungen</h3>
          <p className="text-base text-text-secondary leading-relaxed mb-6">
            Sie stellen für Ihr eigenes Unternehmen ein. Sie wollen Bewerber sauber vorqualifizieren,
            ohne dass das Team in Reference-Calls versinkt.
          </p>

          <ul className="space-y-3 mb-8">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm text-text-primary">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-2.5">
            <Link href="/preise#hr" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 group/cta">
              Pakete ansehen
              <ArrowRight className="w-4 h-4 group-hover/cta:translate-x-1 transition-transform" />
            </Link>
            <Link href="/register" className="inline-flex items-center gap-1.5 text-sm font-bold text-white px-3.5 py-1.5 rounded-full bg-gradient-to-r from-brand-500 to-violet shadow-card hover:shadow-glow transition-shadow">
              <Sparkles className="w-3.5 h-3.5" /> 14 Tage testen
            </Link>
          </div>
        </div>
      </motion.div>
    </Reveal>
  )
}

// ─── PDL Card (Closed Beta) — vom Stub zur prominenten Roadmap ──────
function PdlCard() {
  const ref = useRef<HTMLDivElement>(null)
  const tilt = useTilt(6)

  function onMove(e: React.MouseEvent) {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    tilt.mx.set(((e.clientX - r.left) / r.width - 0.5) * 2)
    tilt.my.set(((e.clientY - r.top) / r.height - 0.5) * 2)
  }
  function onLeave() {
    tilt.mx.set(0)
    tilt.my.set(0)
  }

  const roadmap = [
    { label: 'Mandanten-Verwaltung mit eigenen Workflows', q: 'Q3 2026', status: 'building' },
    { label: 'White-Label inkl. Logo & Reports', q: 'Q3 2026', status: 'building' },
    { label: 'Bulk-Upload für ganze Pipelines', q: 'Q4 2026', status: 'planned' },
    { label: 'API & Webhooks für Ihre Systeme', q: 'Q4 2026', status: 'planned' },
  ]

  return (
    <Reveal delay={0.1}>
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3 }}
        style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformStyle: 'preserve-3d' }}
        className="group relative h-full overflow-hidden card-lg shadow-card-lg hover:shadow-card-xl transition-shadow"
      >
        {/* Animated gradient border */}
        <div className="absolute inset-0 rounded-[inherit] pointer-events-none">
          <div className="absolute inset-0 rounded-[inherit] opacity-60"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.10), rgba(99,102,241,0.05) 40%, rgba(6,182,212,0.10))',
            }}
          />
        </div>

        {/* Diagonal Ribbon */}
        <div
          className="absolute top-0 right-0 z-20 overflow-hidden pointer-events-none"
          style={{ width: 180, height: 180, transform: 'translateZ(50px)' }}
          aria-hidden
        >
          <div
            className="absolute top-[28px] right-[-50px] w-[220px] text-center text-[10px] font-black uppercase tracking-[2px] text-white py-1.5 shadow-lg"
            style={{
              transform: 'rotate(45deg)',
              background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
              boxShadow: '0 4px 14px rgba(139,92,246,0.4)',
            }}
          >
            Closed Beta
          </div>
        </div>

        {/* Soft glow blob */}
        <div className="absolute -top-32 -left-32 w-72 h-72 rounded-full opacity-30 blur-3xl bg-gradient-to-br from-violet via-violet to-cyan" />

        {/* Mouse-follow glow */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: useTransform(
              [tilt.glowX, tilt.glowY],
              ([x, y]) => `radial-gradient(600px circle at ${x} ${y}, rgba(139,92,246,0.22), transparent 40%)`,
            ) as any,
          }}
        />

        <div className="relative" style={{ transform: 'translateZ(20px)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-violet via-violet to-cyan flex items-center justify-center shadow-glow">
              <Users2 className="w-6 h-6 text-white" />
              {/* Lock badge */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-border flex items-center justify-center shadow-card">
                <Lock className="w-2.5 h-2.5 text-violet" />
              </div>
            </div>
            <span className="text-xs font-bold text-violet uppercase tracking-widest">Personaldienstleister</span>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="text-3xl font-bold text-text-primary tracking-tight">PDL-Pakete</h3>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-violet/15 to-cyan/15 text-violet border border-violet/20 mb-4">
            <Sparkles className="w-3 h-3" /> Bald verfügbar · Q3 2026
          </div>

          <p className="text-base text-text-secondary leading-relaxed mb-6">
            Sie liefern Kandidaten an Endkunden — Ihr Wert hängt davon ab, dass die Vorqualifizierung
            wirklich stimmt. Aktuell bauen wir die PDL-Suite mit ausgewählten Pilot-Partnern. Sichern Sie
            sich Ihren Platz — frühe Tester profitieren von einem dauerhaften Rabatt.
          </p>

          {/* Roadmap timeline */}
          <div className="relative pl-5 mb-6 space-y-3">
            <div className="absolute left-[7px] top-1.5 bottom-1.5 w-0.5 bg-gradient-to-b from-violet/40 via-violet/30 to-cyan/30" />
            {roadmap.map((item) => (
              <div key={item.label} className="relative flex items-start gap-3">
                <div
                  className={`absolute -left-5 top-1 w-3.5 h-3.5 rounded-full border-2 ${
                    item.status === 'building'
                      ? 'bg-violet border-violet shadow-glow'
                      : 'bg-white border-violet/40'
                  }`}
                />
                <div className="flex-1 flex items-baseline justify-between gap-3 min-w-0">
                  <span className="text-sm text-text-primary leading-snug">{item.label}</span>
                  <span className="text-[10px] font-bold text-violet whitespace-nowrap flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" /> {item.q}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Beta perks */}
          <div className="rounded-xl border border-violet/20 bg-gradient-to-br from-violet/5 to-cyan/5 p-3.5 mb-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-violet mb-1.5 flex items-center gap-1">
              <Rocket className="w-3 h-3" /> Beta-Vorteile
            </div>
            <ul className="space-y-1 text-xs text-text-secondary">
              <li className="flex items-start gap-1.5"><span className="text-violet">•</span> Persönliche Roadmap-Mitsprache</li>
              <li className="flex items-start gap-1.5"><span className="text-violet">•</span> Dauerhafter Frühbucher-Rabatt (–25 % auf Listenpreis)</li>
              <li className="flex items-start gap-1.5"><span className="text-violet">•</span> Kostenlose Onboarding-Session mit Product-Team</li>
            </ul>
          </div>

          <Link
            href="/waitlist-agency"
            className="inline-flex items-center gap-2 text-sm font-bold text-white px-5 py-2.5 rounded-full bg-gradient-to-r from-violet to-cyan shadow-card hover:shadow-glow transition-all group/cta"
          >
            <Sparkles className="w-4 h-4" />
            Auf Warteliste eintragen
            <ArrowRight className="w-4 h-4 group-hover/cta:translate-x-1 transition-transform" />
          </Link>

          <div className="mt-3 text-[11px] text-text-muted">
            <span className="font-semibold text-text-secondary">42 Personaldienstleister</span> stehen bereits auf der Liste · kein Vertrag, kostenlos
          </div>
        </div>
      </motion.div>
    </Reveal>
  )
}

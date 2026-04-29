'use client'

import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { Hero3D } from '../Hero3D'
import { AnimatedCounter } from '../AnimatedCounter'

export function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const blobY = useTransform(scrollYProgress, [0, 1], [0, 120])
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60])
  const fadeOut = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section ref={ref} className="relative pt-28 pb-24 lg:pb-32 px-6 overflow-hidden">
      {/* Animated background blobs */}
      <motion.div style={{ y: blobY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-[600px] h-[600px] rounded-full opacity-40 animate-blob"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.45), transparent 60%)', filter: 'blur(60px)' }} />
        <div className="absolute top-32 right-1/4 w-[500px] h-[500px] rounded-full opacity-30 animate-blob"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.45), transparent 60%)', filter: 'blur(60px)', animationDelay: '4s' }} />
        <div className="absolute -bottom-20 left-1/2 w-[700px] h-[400px] rounded-full opacity-25 animate-blob"
          style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.4), transparent 60%)', filter: 'blur(60px)', animationDelay: '8s' }} />
      </motion.div>

      {/* Grid background */}
      <div className="absolute inset-0 grid-bg grid-bg-mask opacity-60 pointer-events-none" />

      <motion.div style={{ opacity: fadeOut }} className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
        <motion.div style={{ y: textY }}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-7 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-brand-200 shadow-card"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-600" />
            </span>
            <span className="text-text-primary">Neu: Multi-Mandanten-Workflow für Personaldienstleister</span>
            <ArrowRight className="w-3 h-3 text-brand-600" />
          </motion.div>
          <div className="mb-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-violet/10 text-violet border border-violet/20">
              Closed Beta für Personaldienstleister – PDL-Pakete bald verfügbar.
            </span>
          </div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-[clamp(40px,6.5vw,76px)] font-bold leading-[1.02] tracking-tightest mb-6 text-text-primary"
          >
            <span className="block">Schluss mit</span>
            <span className="block">
              <span className="text-gradient-brand">KI-Bewerbungen</span>
            </span>
            <span className="block">die nicht stimmen.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="text-lg text-text-secondary leading-relaxed max-w-xl mb-9"
          >
            <span className="font-semibold text-text-primary">candiq</span> verifiziert Referenzen, Zeugnisse und Tätigkeiten Ihrer Kandidaten —
            DSGVO-konform, in unter <span className="font-semibold text-brand-700">48 Stunden</span>.
            Vermeiden Sie Fehlbesetzungen, die Sie <span className="font-semibold text-text-primary">€ 50.000+</span> kosten.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 mb-10"
          >
            <Link href="/register" className="btn-primary text-base py-3.5 px-7 group">
              <Sparkles className="w-4 h-4" />
              14 Tage kostenlos testen
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/demo" className="btn-secondary text-base py-3.5 px-7">
              <Zap className="w-4 h-4 text-brand-600" />
              Live-Demo ansehen
            </Link>
          </motion.div>
          <div className="mb-10">
            <Link href="/waitlist-agency" className="text-sm text-text-secondary hover:text-text-primary underline decoration-dotted underline-offset-4">
              Sie sind Personaldienstleister? PDL-Features sind bald verfügbar – jetzt für frühen Zugang vormerken.
            </Link>
          </div>

          {/* Trust line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex items-center gap-5 text-xs text-text-muted"
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> DSGVO-konform
            </div>
            <span className="w-1 h-1 rounded-full bg-text-muted/50" />
            <div>Server in Deutschland</div>
            <span className="w-1 h-1 rounded-full bg-text-muted/50" />
            <div>Keine Kreditkarte nötig</div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-border"
          >
            {[
              { v: 94, suffix: ' %', l: 'Verifiziert' },
              { v: 48, suffix: ' h', l: 'Durchlaufzeit' },
              { v: 1200, prefix: '+', l: 'Geprüfte Kandidaten' },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-3xl font-bold text-text-primary">
                  {s.prefix && <span>{s.prefix}</span>}
                  <AnimatedCounter value={s.v} suffix={s.suffix ?? ''} />
                </div>
                <div className="text-xs text-text-muted uppercase tracking-wider mt-1 font-medium">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right column: 3D card stack */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:block"
        >
          <Hero3D />
        </motion.div>
      </motion.div>
    </section>
  )
}

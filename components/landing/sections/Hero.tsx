'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight, CalendarCheck, ShieldCheck, Headphones } from 'lucide-react'
import { BOOKING_URL } from '@/lib/site'

const VoiceConsole = dynamic(() => import('./VoiceConsole'), {
  ssr: false,
  loading: () => <VoiceConsoleSkeleton />,
})

function VoiceConsoleSkeleton() {
  const bars = Array.from({ length: 32 })
  return (
    <>
      <div className="mt-8 flex h-24 items-center justify-center gap-1">
        {bars.map((_, i) => (
          <span
            key={i}
            className="w-1 rounded-full bg-gradient-to-t from-indigo-500 to-fuchsia-400"
            style={{ height: '100%', transform: 'scaleY(0.18)', opacity: 0.35 }}
          />
        ))}
      </div>
      <div className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
        Status: <span className="text-white">BEREIT</span>
      </div>
      <div className="mt-6 h-14 w-full rounded-full bg-white/10" />
      <p className="mt-4 text-xs text-slate-400">Kostenlos · ca. 2 Min · Mikrofon · DSGVO · EU-Server</p>
    </>
  )
}

export function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const blobY = useTransform(scrollYProgress, [0, 1], [0, 120])
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60])
  const fadeOut = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section ref={ref} id="hero" className="relative pt-28 pb-24 lg:pb-32 px-6 overflow-hidden">
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

      <motion.div style={{ opacity: fadeOut }} className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">
        {/* LEFT: Copy */}
        <motion.div style={{ y: textY }}>
          {/* Live badge — referenziert direkt das Voice-Element */}
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
            <span className="text-text-primary">candiq Voice ist live · Probieren Sie es jetzt →</span>
          </motion.div>

          {/* Headline — sensorisch, Voice im Zentrum */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-[clamp(40px,6.5vw,72px)] font-bold leading-[1.02] tracking-tightest mb-6 text-text-primary"
          >
            <span className="block">Ihre Kandidaten</span>
            <span className="block"><span className="text-gradient-brand">sprechen mit candiq.</span></span>
            <span className="block">In Sekunden. Rund um die Uhr.</span>
          </motion.h1>

          {/* Subtitle — Erlebnis statt Feature, CTA in den Fließtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="text-lg text-text-secondary leading-relaxed max-w-xl mb-9"
          >
            Echte Stimme statt Kontaktformular — die KI nimmt ab, sammelt Stationen und Referenzgeber
            strukturiert, geschulte Reviewer verifizieren. Sie sehen jedes Wort im Dashboard.{' '}
            <span className="font-semibold text-text-primary">
              Klicken Sie das Mikrofon{' '}
              <Link href="#voice-demo" className="underline decoration-2 decoration-brand-400 underline-offset-4 hover:text-brand-700 lg:no-underline">
                rechts
              </Link>
              {' '}und hören Sie selbst, wie sich das für Ihre Kandidaten anfühlt.
            </span>
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 mb-6"
          >
            <Link
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-base py-3.5 px-7 group"
            >
              <CalendarCheck className="w-4 h-4" />
              Testzugang buchen
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            {/* Mobile-only Anker zum Voice-Demo (auf Desktop schon sichtbar) */}
            <Link href="#voice-demo" className="btn-secondary text-base py-3.5 px-7 lg:hidden">
              <Headphones className="w-4 h-4 text-brand-600" />
              candiq Voice testen
            </Link>
          </motion.div>

          {/* Microcopy */}
          <div className="text-xs text-text-muted mb-10">
            15-Min-Termin · DSGVO-konform · Server in Deutschland · Mensch-verifiziert
          </div>

          {/* Value pills — knapp, ohne Icon-Overhead */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="grid grid-cols-3 gap-5 mt-10 pt-8 border-t border-border"
          >
            {[
              { k: '< 1 Sek', v: 'Antwortzeit' },
              { k: '24/7', v: 'Erreichbar' },
              { k: '< 48 h', v: 'Audit-Report' },
            ].map(({ k, v }) => (
              <div key={k}>
                <div className="text-2xl font-bold text-text-primary leading-none">{k}</div>
                <div className="text-xs text-text-muted mt-1.5">{v}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT: Voice console — dark glass card, anker für Sticky-CTA und Mobile-CTA */}
        <motion.div
          id="voice-demo"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="scroll-mt-24"
        >
          <div className="relative">
            {/* Outer glow ring */}
            <div className="absolute -inset-3 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/35 via-fuchsia-500/25 to-cyan-500/25 blur-2xl" />
            <div className="relative rounded-[2rem] border border-white/10 bg-slate-950 p-7 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-indigo-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Live · im Browser · keine Wartezeit
              </div>
              <h2 className="text-center text-xl sm:text-2xl font-semibold text-white mt-4">
                candiq Voice ausprobieren
              </h2>
              <p className="text-center text-xs text-slate-400 mt-1.5">
                Klicken, sprechen, hören — Ihre Live-Demo.
              </p>
              <VoiceConsole />
              <div className="mt-6 flex items-start gap-2 text-[11px] leading-relaxed text-slate-400 border-t border-white/10 pt-5">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-indigo-300" />
                <span>
                  candiq Voice spricht <strong className="text-slate-200">nur mit Kandidaten</strong> —
                  Referenzgeber werden immer von geschulten Reviewern persönlich angerufen.
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

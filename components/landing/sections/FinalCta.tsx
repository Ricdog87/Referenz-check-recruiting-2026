'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Reveal } from '../Reveal'

export function FinalCta() {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px]"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.18), transparent 60%)', filter: 'blur(60px)' }} />
      </div>

      <Reveal>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            animate={{ y: [-8, 8, -8] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-brand-200 shadow-card mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            14 Tage kostenlos · keine Kreditkarte nötig
          </motion.div>

          <h2 className="text-[clamp(40px,6vw,72px)] font-black tracking-tightest mb-6 leading-[1.05]">
            Heute starten. <br />
            <span className="text-gradient-brand">Morgen sicherer einstellen.</span>
          </h2>

          <p className="text-lg text-text-secondary mb-10 max-w-xl mx-auto leading-relaxed">
            Schließen Sie sich über 200 HR-Teams und Personaldienstleistern an, die bereits mit RefCheck ihre Hiring-Quote verbessert haben.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link href="/register" className="btn-primary text-base py-4 px-8 group">
              Konto erstellen
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login?demo=1" className="btn-secondary text-base py-4 px-8">
              Live-Demo testen
            </Link>
          </div>

          <div className="mt-8 text-xs text-text-muted">
            Fragen? <a href="mailto:hello@refcheck.de" className="text-brand-700 font-semibold hover:underline">hello@refcheck.de</a>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

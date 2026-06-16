'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarCheck } from 'lucide-react'
import { Reveal } from '../Reveal'
import { BOOKING_URL } from '@/lib/site'
import { trackConversion } from '@/lib/conversionTracking'

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
            <CalendarCheck className="w-3.5 h-3.5 text-brand-600" />
            15-Min-Termin · individueller Testzugang
          </motion.div>

          <h2 className="text-[clamp(40px,6vw,72px)] font-black tracking-tightest mb-6 leading-[1.05]">
            Heute sprechen. <br />
            <span className="text-gradient-brand">Morgen sauberer einstellen.</span>
          </h2>

          <p className="text-lg text-text-secondary mb-10 max-w-xl mx-auto leading-relaxed">
            Reference Checks brauchen aktive Begleitung — keine Self-Service-Buttons. Buchen Sie 15 Minuten,
            wir richten Ihren persönlichen Testzugang ein und zeigen Ihnen den Report-Flow live.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href={BOOKING_URL}
              onClick={() => trackConversion('cta_click', { cta_label: 'final_cta_booking' })}
              className="btn-primary text-base py-4 px-8 group"
            >
              <CalendarCheck className="w-4 h-4" />
              Termin für Testzugang buchen
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/termin" className="btn-secondary text-base py-4 px-8">
              Live-Demo öffnen
            </Link>
          </div>

          <div className="mt-8 text-xs text-text-muted">
            Lieber direkt schreiben? <a href="mailto:hello@candiq.de" className="text-brand-700 font-semibold hover:underline">hello@candiq.de</a>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

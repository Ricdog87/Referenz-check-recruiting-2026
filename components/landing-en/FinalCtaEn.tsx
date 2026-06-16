'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarCheck } from 'lucide-react'
import { Reveal } from '../landing/Reveal'
import { BOOKING_URL } from '@/lib/site'

export function FinalCtaEn() {
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
            15-min call · personal test access
          </motion.div>

          <h2 className="text-[clamp(40px,6vw,72px)] font-black tracking-tightest mb-6 leading-[1.05]">
            Talk today. <br />
            <span className="text-gradient-brand">Hire smarter tomorrow.</span>
          </h2>

          <p className="text-lg text-text-secondary mb-10 max-w-xl mx-auto leading-relaxed">
            Reference checks need active guidance — not self-serve buttons. Book 15 minutes;
            we set up your personal test environment and walk you through the report flow live.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href={BOOKING_URL}
              className="btn-primary text-base py-4 px-8 group"
            >
              <CalendarCheck className="w-4 h-4" />
              Book a 15-min walkthrough
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <Link href="/termin" className="btn-secondary text-base py-4 px-8">
              Open live demo
            </Link>
          </div>

          <div className="mt-8 text-xs text-text-muted">
            Prefer to write?{' '}
            <a href="mailto:hello@candiq.de" className="text-brand-700 font-semibold hover:underline">
              hello@candiq.de
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

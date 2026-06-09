'use client'

import { Marquee } from '../landing/Marquee'
import { Reveal } from '../landing/Reveal'

export function TrustBarEn() {
  return (
    <section className="py-10 border-y border-border bg-bg-secondary/50">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <div className="text-center text-xs font-semibold text-text-muted uppercase tracking-widest mb-5">
            Built for HR teams and recruitment agencies across the DACH region — from enterprise to mid-market
          </div>
          <Marquee />
        </Reveal>
      </div>
    </section>
  )
}

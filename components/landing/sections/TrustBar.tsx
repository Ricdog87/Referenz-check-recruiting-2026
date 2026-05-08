'use client'

import { Marquee } from '../Marquee'
import { Reveal } from '../Reveal'

export function TrustBar() {
  return (
    <section className="py-10 border-y border-border bg-bg-secondary/50">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <div className="text-center text-xs font-semibold text-text-muted uppercase tracking-widest mb-5">
            Gebaut für HR-Teams und Personaldienstleister im DACH-Raum — vom Konzern bis zum Mittelstand
          </div>
          <Marquee />
        </Reveal>
      </div>
    </section>
  )
}

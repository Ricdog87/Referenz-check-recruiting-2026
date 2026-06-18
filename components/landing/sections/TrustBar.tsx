'use client'

import { Marquee } from '../Marquee'
import { Reveal } from '../Reveal'
import { TrustStats } from '../TrustStats'

export function TrustBar() {
  return (
    <section className="py-12 border-y border-border bg-bg-secondary/50">
      <div className="max-w-7xl mx-auto px-6 space-y-8">
        <Reveal>
          {/* Akt 1: Live-Vertrauenssignale (echte Datenpunkte, kein Fake-Logo-Wall).
              Bei leerer DB blenden die zwei Live-Stats automatisch aus —
              keine irreführenden Nullen. */}
          <TrustStats />
        </Reveal>

        <Reveal>
          <div className="text-center text-xs font-semibold text-text-muted uppercase tracking-widest mb-3 pt-2">
            Gebaut für HR-Teams und Personaldienstleister im DACH-Raum — vom Konzern bis zum Mittelstand
          </div>
          <Marquee />
        </Reveal>
      </div>
    </section>
  )
}

{/*
  TODO für Marketing (Claude Cowork oder manuell):
  - Sobald 3+ echte Pilot-Kunden Logo-Freigabe geben, ein
    PressLogosStrip darunter einfuegen mit:
    components/landing/PressLogosStrip.tsx
    Format: 5-6 Logos in Graustufe + Hover-Color.
  - Sobald candiq in Fachpresse gelistet wurde (Personalwirtschaft,
    Crosswater Job Guide, Recruiting Insights), MediaMentionsStrip
    ergaenzen — Zitat-Karten mit Quelle.
  - Beides bewusst NICHT mit Platzhaltern bauen — Marketing-
    Glaubwürdigkeit ist groesser als Whitespace.
*/}

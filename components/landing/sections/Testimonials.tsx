'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import { Reveal, StaggerChildren, StaggerItem } from '../Reveal'

const testimonials = [
  {
    quote: 'In den ersten 6 Wochen haben wir zwei Bewerber identifiziert, deren angegebene Tätigkeiten nicht stimmten. Das hätte uns leicht 200k+ gekostet.',
    name: 'Dr. Stefanie Bender',
    role: 'Head of People',
    company: 'NovaTec Consulting',
    initials: 'SB',
    accent: 'from-brand-500 to-violet',
  },
  {
    quote: 'Als Personaldienstleister liefern wir jetzt jeden Kandidaten mit Audit-Report. Unsere Endkunden zahlen 15% Premium dafür — candiq refinanziert sich um Faktor 7.',
    name: 'Marius Hoffmann',
    role: 'Geschäftsführer',
    company: 'Hoffmann Executive Search',
    initials: 'MH',
    accent: 'from-cyan to-brand-500',
  },
  {
    quote: 'Endlich ein Tool, das DSGVO ernst nimmt. Server in Deutschland, Audit-Trail, Einwilligungs-Workflow — unsere Compliance-Abteilung hat sofort grünes Licht gegeben.',
    name: 'Petra Schäfer',
    role: 'Datenschutzbeauftragte',
    company: 'Allianz Tochter (anonymisiert)',
    initials: 'PS',
    accent: 'from-emerald-500 to-cyan',
  },
]

export function Testimonials() {
  return (
    <section className="py-28 px-6 bg-bg-secondary relative overflow-hidden">
      <div className="absolute inset-0 grid-bg grid-bg-mask opacity-50" />

      <div className="max-w-7xl mx-auto relative">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 mb-4">
              Stimmen unserer Kunden
            </div>
            <h2 className="text-[clamp(32px,5vw,52px)] font-bold tracking-tighter mb-5 text-text-primary">
              Echte Ergebnisse. <span className="text-gradient-brand">Echte Kunden.</span>
            </h2>
          </div>
        </Reveal>

        <StaggerChildren className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <StaggerItem key={i}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
                className="card-lg shadow-card-md hover:shadow-card-xl transition-shadow h-full flex flex-col"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-brand-200 mb-3" />
                <blockquote className="text-text-primary leading-relaxed mb-6 flex-1">
                  &bdquo;{t.quote}&ldquo;
                </blockquote>
                <div className="flex items-center gap-3 pt-5 border-t border-border">
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.accent} flex items-center justify-center text-white text-sm font-bold shadow-card`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-text-primary">{t.name}</div>
                    <div className="text-xs text-text-muted">{t.role} · {t.company}</div>
                  </div>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  )
}

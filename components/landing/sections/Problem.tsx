'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Bot, Hourglass, Banknote } from 'lucide-react'
import { Reveal, StaggerChildren, StaggerItem } from '../Reveal'

const cards = [
  {
    icon: Bot,
    headline: 'KI-Lebenslauf',
    title: 'Auf jede Stelle wie maßgeschneidert',
    body: 'ChatGPT formuliert Tätigkeiten und Anschreiben perfekt zur Stelle um. Was im CV steht, sagt heute wenig darüber aus, was der Kandidat wirklich kann.',
    color: 'bg-rose-50 text-rose-600 border-rose-200',
  },
  {
    icon: Hourglass,
    headline: 'Bewerber­flut',
    title: 'Mehr Bewerbungen, weniger Signal',
    body: 'Pro Stelle landen Dutzende Bewerbungen mit auswechselbaren Buzzwords im Postfach. Jeder zweite Kandidat verbraucht ein Erstgespräch — die meisten ohne Mehrwert.',
    color: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  {
    icon: Banknote,
    headline: 'Fehl­besetzung',
    title: '1,5× Jahresgehalt im Schnitt',
    body: 'SHRM und Bain beziffern die Kosten einer einzigen Fehleinstellung auf das 1,5-fache des Jahresgehalts — bei Schlüsselrollen geht es schnell in den sechsstelligen Bereich.',
    color: 'bg-brand-50 text-brand-600 border-brand-200',
  },
]

export function Problem() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [40, -40])

  return (
    <section ref={ref} className="py-28 px-6 relative overflow-hidden">
      <motion.div
        className="absolute -top-32 right-0 w-[500px] h-[500px] rounded-full opacity-30 pointer-events-none"
        style={{ y, background: 'radial-gradient(ellipse, rgba(244,63,94,0.18), transparent 60%)', filter: 'blur(80px)' }}
      />

      <div className="max-w-6xl mx-auto">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 mb-4">
              Das Problem
            </div>
            <h2 className="text-[clamp(32px,5vw,52px)] font-bold tracking-tighter mb-5 text-text-primary">
              Schöner Lebenslauf <br className="hidden sm:block"/>
              ist heute <span className="text-gradient-brand">kein Signal mehr.</span>
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              HR-Teams und Personaldienstleister bewerten zunehmend Texte, die eine KI geschrieben hat. Echte Eignung lässt sich daraus nicht ablesen.
            </p>
          </div>
        </Reveal>

        <StaggerChildren className="grid md:grid-cols-3 gap-5">
          {cards.map((c, i) => (
            <StaggerItem key={i}>
              <motion.div
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group relative card-md hover:shadow-card-xl transition-shadow h-full"
              >
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 ${c.color}`}>
                  <c.icon className="w-6 h-6" />
                </div>
                <div className="text-2xl font-bold text-text-primary tracking-tight mb-2">
                  {c.headline}
                </div>
                <div className="text-sm font-semibold text-text-primary mb-3">{c.title}</div>
                <p className="text-sm text-text-secondary leading-relaxed">{c.body}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  )
}

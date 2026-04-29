'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { TrendingUp, Clock, Banknote } from 'lucide-react'
import { Reveal, StaggerChildren, StaggerItem } from '../Reveal'

const cards = [
  {
    icon: TrendingUp,
    headline: '+ 400 %',
    title: 'Mehr Bewerbungen seit ChatGPT',
    body: 'Generierte Lebensläufe, perfekt formulierte Anschreiben — die Spreu vom Weizen zu trennen ist Sisyphos-Arbeit. Ohne Verifizierung bewerten Sie Fiktion.',
    color: 'bg-rose-50 text-rose-600 border-rose-200',
  },
  {
    icon: Clock,
    headline: '< 2 min',
    title: 'pro Referenz im Durchschnitt',
    body: '90 % der Recruiter prüfen Referenzen oberflächlich oder gar nicht. Telefonische Verifizierung ist zeitintensiv — und meist die erste Aufgabe, die wegfällt.',
    color: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  {
    icon: Banknote,
    headline: '€ 50.000+',
    title: 'Kosten einer Fehlbesetzung',
    body: 'Bain & Company beziffert die Kosten einer einzigen Fehleinstellung auf das 1,5-fache des Jahresgehalts — bei Schlüsselpositionen geht es in die Hunderttausende.',
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
              Der KI-Tsunami trifft <br className="hidden sm:block"/>
              <span className="text-gradient-brand">jedes HR-Team.</span>
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              Bewerbungen sehen besser aus als je zuvor. Nur — was davon stimmt eigentlich noch?
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
                <div className="text-4xl font-bold text-text-primary tracking-tighter mb-2"
                  style={{ fontFeatureSettings: '"tnum"' }}>
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

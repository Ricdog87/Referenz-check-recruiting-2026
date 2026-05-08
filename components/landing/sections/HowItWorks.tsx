'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Upload, Phone, FileCheck, ArrowDown } from 'lucide-react'
import { Reveal } from '../Reveal'

const steps = [
  {
    n: '01',
    icon: Upload,
    title: 'Kandidat & Stationen erfassen',
    body: 'CV hochladen, frühere Arbeitgeber und Referenzpersonen ergänzen. Die DSGVO-Einwilligung wird automatisch eingeholt und dokumentiert.',
    accent: 'from-brand-500 to-brand-600',
  },
  {
    n: '02',
    icon: Phone,
    title: 'Referenzen werden verifiziert',
    body: 'Geschulte Reviewer prüfen telefonisch Position, Zeitraum, Verantwortung und Stärken. Keine Bots, keine generischen E-Mail-Tickets.',
    accent: 'from-brand-600 to-violet',
  },
  {
    n: '03',
    icon: FileCheck,
    title: 'Strukturierter Report',
    body: 'PDF-Report mit klarer Bewertung (verifiziert / Diskrepanz), Gesprächsnotizen und vollständigem Audit-Trail — direkt teilbar mit Hiring Manager und Compliance.',
    accent: 'from-violet to-cyan',
  },
]

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.7], ['0%', '100%'])

  return (
    <section id="wie-es-funktioniert" ref={ref} className="py-28 px-6 bg-bg-secondary relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-4">
              So funktioniert&rsquo;s
            </div>
            <h2 className="text-[clamp(32px,5vw,52px)] font-bold tracking-tighter mb-5 text-text-primary">
              Drei Schritte. <span className="text-gradient-brand">Verlässliches Signal.</span>
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              Vom Kandidaten-Upload bis zum strukturierten Report — typischerweise in unter 48 Stunden.
            </p>
          </div>
        </Reveal>

        <div className="relative max-w-4xl mx-auto">
          {/* Vertical animated line */}
          <div className="absolute left-1/2 top-12 bottom-12 w-0.5 -translate-x-1/2 bg-border hidden md:block">
            <motion.div
              className="absolute top-0 left-0 right-0 origin-top"
              style={{ height: lineHeight, background: 'linear-gradient(to bottom, #4f46e5, #6366f1, #8b5cf6)' }}
            />
          </div>

          <div className="space-y-12">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1}>
                <div className={`relative flex flex-col md:flex-row items-center gap-8 ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                  {/* Card */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 card-lg shadow-card-md hover:shadow-card-xl transition-shadow"
                  >
                    <div className="flex items-start gap-5">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.accent} flex items-center justify-center flex-shrink-0 shadow-glow`}>
                        <s.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-1">Schritt {s.n}</div>
                        <h3 className="text-xl font-bold text-text-primary mb-2 tracking-tight">{s.title}</h3>
                        <p className="text-sm text-text-secondary leading-relaxed">{s.body}</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Center number */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex w-16 h-16 rounded-full bg-white border-2 border-border items-center justify-center shadow-card font-bold text-brand-600 text-base z-10"
                    style={{ fontFeatureSettings: '"tnum"' }}>
                    {s.n}
                  </div>

                  {/* Spacer for layout */}
                  <div className="flex-1 hidden md:block" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

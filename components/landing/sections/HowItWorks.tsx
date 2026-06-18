'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Upload, Phone, ShieldCheck, FileCheck2 } from 'lucide-react'
import { Reveal } from '../Reveal'

// Akteur-Labels machen sichtbar, wer in welchem Schritt aktiv wird —
// wichtig für Kunden-Verständnis, dass candiq KEIN Self-Service-Tool
// für Bewerber ist und KEIN Bot, der HR-Aufgaben uebernimmt.
type Actor = 'Kunde' | 'Bewerber' | 'candiq'

const ACTOR_STYLES: Record<Actor, string> = {
  Kunde: 'bg-brand-50 text-brand-700 border-brand-200',
  Bewerber: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  candiq: 'bg-violet-50 text-violet-700 border-violet-200',
}

type Step = {
  n: string
  actor: Actor
  icon: typeof Upload
  title: string
  body: string
  accent: string
}

const steps: Step[] = [
  {
    n: '01',
    actor: 'Kunde',
    icon: Upload,
    title: 'Anfrage in 30 Sekunden',
    body: 'Kunde legt Bewerber an: Position + E-Mail, optional CV-Upload. candiq verschickt automatisch einen sicheren, zeitbegrenzten Magic-Link. Sofort DSGVO-konform – Einwilligung vor jeder Verarbeitung.',
    accent: 'from-brand-500 to-brand-600',
  },
  {
    n: '02',
    actor: 'Bewerber',
    icon: ShieldCheck,
    title: 'Einwilligung & Freigabe',
    body: 'Der Bewerber öffnet das Self-Service-Portal, sieht transparent, was geprüft wird, nennt seine Referenzgeber selbst und erteilt die granulare Einwilligung. Jederzeit widerrufbar. Erst jetzt wird ein hochgeladener CV für die Prüfung freigegeben.',
    accent: 'from-emerald-500 to-emerald-600',
  },
  {
    n: '03',
    actor: 'candiq',
    icon: Phone,
    title: 'Mensch ruft an, KI dokumentiert',
    body: 'Ein geschulter Reviewer telefoniert die freigegebenen Referenzgeber ab – standardisierter Fragenkatalog, AGG-konform, nie ein Bot. Die KI dokumentiert wörtlich und gleicht gegen den CV ab.',
    accent: 'from-violet-500 to-violet-600',
  },
  {
    n: '04',
    actor: 'Kunde',
    icon: FileCheck2,
    title: 'Prüfungssicherer Report',
    body: 'Strukturierter PDF-Report mit Bewertung pro Station, Diskrepanz-Markierung und Audit-Footer. Standard < 48 h, Express in 24 h.',
    accent: 'from-cyan-500 to-cyan-600',
  },
]

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.7], ['0%', '100%'])

  return (
    <section
      id="wie-es-funktioniert"
      ref={ref}
      className="py-28 px-6 bg-bg-secondary relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-4">
              So funktioniert candiq
            </div>
            <h2 className="text-[clamp(32px,5vw,52px)] font-bold tracking-tighter mb-5 text-text-primary">
              Vier Schritte. <span className="text-gradient-brand">Klare Verantwortung.</span>
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              Wer macht was — und warum die Einwilligung des Bewerbers immer vor der Prüfung steht. Vom Auftrag bis zum Report typischerweise in unter 48 Stunden.
            </p>
          </div>
        </Reveal>

        <div className="relative max-w-4xl mx-auto">
          {/* Vertikale animierte Linie (Desktop) */}
          <div className="absolute left-1/2 top-12 bottom-12 w-0.5 -translate-x-1/2 bg-border hidden md:block">
            <motion.div
              className="absolute top-0 left-0 right-0 origin-top"
              style={{
                height: lineHeight,
                background:
                  'linear-gradient(to bottom, #4f46e5, #10b981, #8b5cf6, #06b6d4)',
              }}
            />
          </div>

          <div className="space-y-12">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.08}>
                <div
                  className={`relative flex flex-col md:flex-row items-center gap-8 ${
                    i % 2 === 1 ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* Karte */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 card-lg shadow-card-md hover:shadow-card-xl transition-shadow w-full"
                  >
                    <div className="flex items-start gap-5">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.accent} flex items-center justify-center flex-shrink-0 shadow-glow`}
                      >
                        <s.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">
                            Schritt {s.n}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${ACTOR_STYLES[s.actor]}`}
                            aria-label={`Akteur: ${s.actor}`}
                          >
                            {s.actor}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-text-primary mb-2 tracking-tight">
                          {s.title}
                        </h3>
                        <p className="text-sm text-text-secondary leading-relaxed">
                          {s.body}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Zentrale Nummer (Desktop) */}
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex w-16 h-16 rounded-full bg-white border-2 border-border items-center justify-center shadow-card font-bold text-brand-600 text-base z-10"
                    style={{ fontFeatureSettings: '"tnum"' }}
                  >
                    {s.n}
                  </div>

                  {/* Spacer fürs Layout */}
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

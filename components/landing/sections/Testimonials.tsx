'use client'

import { motion } from 'framer-motion'
import { Clock3, Users, ShieldCheck, Target } from 'lucide-react'
import { Reveal, StaggerChildren, StaggerItem } from '../Reveal'

// Neutral value props — no fabricated quotes, no fake logos.
// Replace with real testimonials once available.
const benefits = [
  {
    icon: Clock3,
    title: 'Weniger Erstgespräche, die nichts bringen',
    body: 'Verifizierte Stationen und Tätigkeiten vor dem Interview — Sie laden nur die Kandidaten ein, bei denen sich der Slot lohnt.',
    accent: 'from-brand-500 to-brand-700',
  },
  {
    icon: Target,
    title: 'Schnellere, sauberere Shortlists',
    body: 'Statt Bauchgefühl und CV-Raten: ein strukturierter Report pro Kandidat, den Hiring Manager und Geschäftsführung sofort verstehen.',
    accent: 'from-violet to-violet/80',
  },
  {
    icon: Users,
    title: 'Bessere Einstellungsqualität',
    body: 'Diskrepanzen zwischen Eigenangaben und Referenzaussagen werden sichtbar. Fehlbesetzungen lassen sich systematisch reduzieren.',
    accent: 'from-cyan to-brand-500',
  },
  {
    icon: ShieldCheck,
    title: 'Verteidigbar gegenüber Compliance',
    body: 'Einwilligungs-Workflow und vollständiger Audit-Trail. Auch bei einer DSGVO-Auskunft, einem Audit oder bei Wirtschaftsprüfern liefern Sie sauber.',
    accent: 'from-emerald-500 to-cyan',
  },
]

export function Testimonials() {
  return (
    <section className="py-28 px-6 bg-bg-secondary relative overflow-hidden">
      <div className="absolute inset-0 grid-bg grid-bg-mask opacity-50" />

      <div className="max-w-6xl mx-auto relative">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 mb-4">
              Was Sie davon haben
            </div>
            <h2 className="text-[clamp(32px,5vw,52px)] font-bold tracking-tighter mb-5 text-text-primary">
              Mehr Signal. Weniger Lärm. <br className="hidden sm:block" />
              <span className="text-gradient-brand">Bessere Entscheidungen.</span>
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              Vier konkrete Verbesserungen, die HR-Teams und Personaldienstleister mit candiq spürbar erreichen.
            </p>
          </div>
        </Reveal>

        <StaggerChildren className="grid md:grid-cols-2 gap-5">
          {benefits.map((b) => (
            <StaggerItem key={b.title}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
                className="card-lg shadow-card-md hover:shadow-card-xl transition-shadow h-full flex items-start gap-5"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${b.accent} flex items-center justify-center flex-shrink-0 shadow-glow`}>
                  <b.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2 tracking-tight">{b.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{b.body}</p>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerChildren>

        <Reveal>
          <p className="text-xs text-text-muted text-center mt-10 max-w-xl mx-auto">
            Echte Kunden-Stimmen veröffentlichen wir, sobald die Closed-Beta-Phase abgeschlossen ist und unsere Partner ihre Zustimmung gegeben haben.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

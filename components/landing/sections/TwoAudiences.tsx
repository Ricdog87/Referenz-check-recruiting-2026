'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Building2, Users2, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Reveal } from '../Reveal'

const audiences = [
  {
    icon: Building2,
    badge: 'Inhouse Recruiting',
    title: 'HR-Abteilungen',
    description:
      'Ihr internes Recruiting-Team verifiziert Kandidaten für Festanstellungen. Sie wollen Fehlbesetzungen vermeiden, ohne sich in Telefonate zu verlieren.',
    bullets: [
      'Strukturierte Reference-Workflows pro Abteilung',
      'ATS-Integration (Personio, SAP SF, Workday)',
      'Audit-Trail für Compliance & Wirtschaftsprüfer',
      'White-Label-Reports für Hiring Manager',
    ],
    cta: 'Pakete für HR-Teams',
    href: '/preise#hr',
    gradient: 'from-brand-500 via-brand-600 to-violet',
    bg: 'from-brand-50/60 to-white',
  },
  {
    icon: Users2,
    badge: 'Personaldienstleister',
    title: 'Personaldienstleister (bald verfügbar)',
    description:
      'Spezielle Multi-Mandanten-Workflows, White-Label-Reports und API-Zugänge für PDLer — aktuell in der finalen Testphase. Melden Sie sich für den frühen Zugang an.',
    bullets: [
      'Geplant: Mandanten-Verwaltung mit eigenen Workflows',
      'Kommt bald: White-Label inkl. Logo, Domain & Reports',
      'Geplant: Bulk-Upload bis 500 Kandidaten (CSV)',
      'Kommt bald: API + Webhook-Integration in Ihre Systeme',
    ],
    cta: 'Frühen Zugang anfragen',
    href: '/waitlist-agency',
    gradient: 'from-violet via-violet to-cyan',
    bg: 'from-violet/10 to-white',
  },
]

export function TwoAudiences() {
  return (
    <section id="zielgruppen" className="py-28 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 mb-4">
              Für wen ist candiq?
            </div>
            <h2 className="text-[clamp(32px,5vw,52px)] font-bold tracking-tighter mb-5 text-text-primary">
              Zwei Zielgruppen. <br className="hidden sm:block" />
              <span className="text-gradient-brand">Eine Plattform.</span>
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              Egal ob Sie intern für Ihr Unternehmen einstellen oder professionell vermitteln — wir haben den passenden Rollout.
              HR-Pakete sind heute vollständig verfügbar; PDL-Pakete folgen nach der Closed-Beta-Phase.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6">
          {audiences.map((a, i) => (
            <Reveal key={a.title} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                className={`relative h-full overflow-hidden card-lg shadow-card-lg hover:shadow-card-xl transition-shadow bg-gradient-to-br ${a.bg}`}
              >
                {/* Decorative gradient ball */}
                <div className={`absolute -top-32 -right-32 w-72 h-72 rounded-full opacity-30 blur-3xl bg-gradient-to-br ${a.gradient}`} />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${a.gradient} flex items-center justify-center shadow-glow`}>
                      <a.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-bold text-brand-700 uppercase tracking-widest">{a.badge}</span>
                  </div>

                  <h3 className="text-3xl font-bold text-text-primary tracking-tight mb-3">{a.title}</h3>
                  <p className="text-base text-text-secondary leading-relaxed mb-6">{a.description}</p>

                  <ul className="space-y-3 mb-8">
                    {a.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-sm text-text-primary">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href={a.href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 group">
                    {a.cta}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

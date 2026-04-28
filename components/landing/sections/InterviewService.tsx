'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  MessageSquareText,
  UserCheck,
  ClipboardCheck,
  Layers,
  Users,
  Building2,
  Briefcase,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { Reveal, StaggerChildren, StaggerItem } from '../Reveal'

const highlights = [
  {
    icon: UserCheck,
    title: 'Geschulte Interviewer',
    body: 'Interviews durch erfahrene HR- und Recruiting-Professionals mit klaren Qualitätsstandards.',
  },
  {
    icon: ClipboardCheck,
    title: 'Leitfäden je Rolle',
    body: 'Standardisierte Interview-Frameworks für Sales, Tech, Führung und weitere Schlüsselprofile.',
  },
  {
    icon: MessageSquareText,
    title: 'Objektive Scorecards',
    body: 'Strukturierte Bewertung mit nachvollziehbaren Kriterien — direkt mit Hiring Managern teilbar.',
  },
  {
    icon: Layers,
    title: 'Quality Bundles',
    body: 'Kombinieren Sie Interviews mit Referenzprüfungen für ein belastbares Gesamtbild pro Kandidat.',
  },
  {
    icon: Users,
    title: 'Für HR & PDL nutzbar',
    body: 'Einsetzbar für Inhouse-Recruiting und Personaldienstleister mit denselben Qualitätsmetriken.',
  },
]

const interviewSteps = [
  {
    n: '01',
    title: 'Rolle & Interviewtyp auswählen',
    body: 'Wählen Sie den passenden Interviewtyp, z. B. ein Kompetenz-Interview für Sales Manager.',
  },
  {
    n: '02',
    title: 'Kandidat anlegen & Slot buchen',
    body: 'Kandidat anlegen, Verfügbarkeit abstimmen und den Interview-Slot direkt terminieren.',
  },
  {
    n: '03',
    title: 'Scorecard- & Audit-Report erhalten',
    body: 'Sie erhalten eine strukturierte Auswertung inkl. Empfehlung und dokumentierter Entscheidungsgrundlage.',
  },
]

export function InterviewService() {
  return (
    <section id="interview-service" className="py-28 px-6 bg-bg-secondary relative overflow-hidden">
      <div className="absolute inset-0 grid-bg grid-bg-mask opacity-45 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative space-y-14">
        <Reveal>
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan/10 text-cyan border border-cyan/20 mb-4">
              Interview-Service
            </div>
            <h2 className="text-[clamp(30px,5vw,50px)] font-bold tracking-tighter mb-5 text-text-primary">
              candiq Interview – strukturierte Interviews als Service
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              Neben der Referenzprüfung bietet candiq jetzt auch strukturierte Kompetenz- und Cultural-Fit-Interviews als Service.
              Sie erhalten objektive Scorecards und einen auditierbaren Report für fundierte Hiring-Entscheidungen.
            </p>
          </div>
        </Reveal>

        <StaggerChildren className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          {highlights.map((item) => (
            <StaggerItem key={item.title}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25 }}
                className="card-md h-full bg-white border border-border hover:border-brand-200 transition-colors"
              >
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-violet flex items-center justify-center mb-4 shadow-card">
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary mb-2">{item.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{item.body}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerChildren>

        <div className="grid lg:grid-cols-2 gap-6">
          <Reveal>
            <div className="card-lg bg-white border border-border shadow-card-md">
              <h3 className="text-2xl font-bold tracking-tight text-text-primary mb-4">Für wen ist candiq Interview gedacht?</h3>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand-700 mb-3">
                    <Building2 className="w-4 h-4" /> HR-Abteilungen
                  </div>
                  <ul className="space-y-2.5">
                    {[
                      'Entlastung bei Erst- und Zweitgesprächen durch einen externen, strukturierten Interviewprozess.',
                      'Objektive Zweitmeinung für kritische Positionen und finale Entscheidungsrunden.',
                      'Dokumentierte Entscheidungsgrundlage für Hiring Manager und Fachbereich.',
                    ].map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-text-primary">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-violet mb-3">
                    <Briefcase className="w-4 h-4" /> Personaldienstleister
                  </div>
                  <ul className="space-y-2.5">
                    {[
                      'Premium-Baustein für Kandidatenpräsentationen gegenüber Endkunden.',
                      'Höhere Fees nachvollziehbar begründbar durch strukturierte Qualitätsbewertung.',
                      'White-Label-Reports für professionelle Kundendokumentation.',
                    ].map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-text-primary">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="space-y-6">
              <div className="card-lg bg-white border border-border shadow-card-md">
                <h3 className="text-2xl font-bold tracking-tight text-text-primary mb-4">So funktioniert candiq Interview</h3>
                <div className="space-y-4">
                  {interviewSteps.map((step) => (
                    <div key={step.n} className="rounded-2xl border border-border bg-bg-secondary/60 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-brand-700 mb-1">Schritt {step.n}</div>
                      <div className="text-sm font-semibold text-text-primary mb-1.5">{step.title}</div>
                      <p className="text-sm text-text-secondary leading-relaxed">{step.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-lg bg-gradient-to-br from-brand-600 via-brand-700 to-violet text-white shadow-float">
                <div className="text-xs font-bold uppercase tracking-widest text-white/75 mb-2">Pricing-Logik</div>
                <h4 className="text-xl font-bold tracking-tight mb-3">Interview as a Service — flexibel als Add-on</h4>
                <p className="text-sm text-white/90 leading-relaxed mb-4">
                  candiq Interview wird als Premium-Service pro Kandidat/Interview angeboten — separat oder im Bundle zu Ihren bestehenden candiq-Paketen.
                </p>
                <p className="text-sm text-white/90 leading-relaxed mb-5">
                  Beispiel: <span className="font-semibold">Interview &amp; Reference Bundles</span> mit 1 strukturiertem Interview + 2 Referenz-Calls je Kandidat.
                </p>
                <Link href="/preise" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-brand-700 text-sm font-semibold hover:bg-bg-secondary transition-colors">
                  Bundle-Optionen ansehen <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal>
          <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-5">
            <p className="text-sm text-text-primary leading-relaxed">
              <span className="font-semibold">candiq ist eine Marke der RSG Recruiting Solutions group GmbH</span>, spezialisiert auf Recruiting und
              Referenzprüfungen im DACH-Raum. Unser Interview-Team besteht aus geschulten HR-/Recruiting-Professionals und arbeitet
              konsequent nach standardisierten Leitfäden.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

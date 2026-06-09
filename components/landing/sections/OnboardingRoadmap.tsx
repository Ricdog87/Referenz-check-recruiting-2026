'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import { CalendarCheck, Settings2, UserPlus, FileText, ArrowRight, Sparkles } from 'lucide-react'
import { Reveal } from '../Reveal'
import { BOOKING_URL } from '@/lib/site'

const steps = [
  {
    day: 'Tag 0',
    title: 'Termin & Kennenlernen (15 Min)',
    body:
      'Sie buchen einen 15-Minuten-Termin. Wir klären Ihren Use Case, Volumen pro Monat, Branchen-Spezifika und die DSGVO-Anforderungen Ihres Unternehmens. Sie erhalten einen persönlichen Testzugang.',
    icon: CalendarCheck,
    accent: 'from-brand-500 to-brand-600',
  },
  {
    day: 'Tag 1',
    title: 'Workspace-Setup & Onboarding',
    body:
      'Wir richten Ihren Workspace ein, hinterlegen Logo und Brief-Templates, importieren ggf. bestehende Kandidatendaten und schalten die richtigen Add-ons frei. 30-Min-Live-Walkthrough mit Ihrem Team — Aufzeichnung inklusive.',
    icon: Settings2,
    accent: 'from-brand-600 to-violet',
  },
  {
    day: 'Tag 2–3',
    title: 'Ersten Kandidaten anlegen',
    body:
      'Sie legen Ihren ersten Reference-Check-Auftrag an: Position + Bewerber-Mail. Das Consent-Portal versendet automatisch die DSGVO-Einwilligung, der Bewerber nennt seine Referenzgeber.',
    icon: UserPlus,
    accent: 'from-violet to-violet/80',
  },
  {
    day: 'Tag 4–5',
    title: 'KI verifiziert, Reviewer gibt frei',
    body:
      'candiq Voice kontaktiert die freigegebenen Referenzgeber telefonisch — standardisierte Fragebögen, wörtliches Protokoll, Diskrepanz-Markierung. Ein geschulter Reviewer prüft und gibt frei. Sie sehen den Live-Status im Dashboard.',
    icon: Sparkles,
    accent: 'from-violet to-cyan',
  },
  {
    day: 'Tag 7',
    title: 'PDF-Report im Postfach',
    body:
      'Strukturierter Audit-Report pro Kandidat — Verifiziert/Diskrepanz/Nicht erreichbar, mit Gesprächsnotizen und Hire-Recommendation. Direkt teilbar mit Hiring-Manager und Geschäftsführung.',
    icon: FileText,
    accent: 'from-cyan to-emerald-500',
  },
]

export function OnboardingRoadmap() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.7], ['0%', '100%'])

  return (
    <section id="onboarding-roadmap" ref={ref} className="py-28 px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[400px] opacity-25"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.4), transparent 65%)', filter: 'blur(80px)' }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-4">
              <CalendarCheck className="w-3.5 h-3.5" /> Onboarding in 7 Tagen
            </div>
            <h2 className="text-[clamp(32px,5vw,52px)] font-bold tracking-tighter mb-5 text-text-primary leading-[1.1]">
              Vom Termin zum ersten Report.
              <br />
              <span className="text-gradient-brand">In einer Woche produktiv.</span>
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              Klare Schritte. Keine Setup-Workshops über Monate, keine technische Onboarding-Hürde.
              Sie buchen heute den Termin — in spätestens 7 Tagen liegt der erste fertige Reference-Check-Report
              in Ihrem Postfach.
            </p>
          </div>
        </Reveal>

        <div className="relative max-w-4xl mx-auto">
          {/* Vertical animated line (desktop only) */}
          <div className="absolute left-1/2 top-12 bottom-12 w-0.5 -translate-x-1/2 bg-border hidden md:block">
            <motion.div
              className="absolute top-0 left-0 right-0 origin-top"
              style={{ height: lineHeight, background: 'linear-gradient(to bottom, #4f46e5, #6366f1, #8b5cf6, #06b6d4, #10b981)' }}
            />
          </div>

          <div className="space-y-10">
            {steps.map((s, i) => (
              <Reveal key={s.day} delay={i * 0.08}>
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
                        <div className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-1">{s.day}</div>
                        <h3 className="text-xl font-bold text-text-primary mb-2 tracking-tight">{s.title}</h3>
                        <p className="text-sm text-text-secondary leading-relaxed">{s.body}</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Center day-badge */}
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex w-20 h-20 rounded-full bg-white border-2 border-border items-center justify-center shadow-card font-bold text-brand-600 text-xs z-10 flex-col"
                    style={{ fontFeatureSettings: '"tnum"' }}
                  >
                    <span className="text-[9px] uppercase tracking-widest text-text-muted">Tag</span>
                    <span className="text-lg leading-none">{s.day.replace('Tag ', '').replace('–', '–')}</span>
                  </div>

                  {/* Spacer for layout */}
                  <div className="flex-1 hidden md:block" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Bottom CTA bar */}
        <Reveal>
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-violet p-8 md:p-10 text-white shadow-float text-center relative overflow-hidden">
              <div
                className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-30 blur-3xl"
                style={{ background: 'radial-gradient(ellipse, #fbbf24, transparent 60%)' }}
              />
              <div
                className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-25 blur-3xl"
                style={{ background: 'radial-gradient(ellipse, #06b6d4, transparent 60%)' }}
              />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/15 border border-white/20 backdrop-blur-md mb-4">
                  <Sparkles className="w-3 h-3 text-amber-200" /> Heute starten
                </div>
                <h3 className="text-2xl md:text-3xl font-black tracking-tightest mb-3">
                  Ihr nächster Hire könnte schon nächste Woche sauberer sein.
                </h3>
                <p className="text-sm md:text-base text-white/85 mb-6 max-w-xl mx-auto leading-relaxed">
                  Reference Checks brauchen aktive Begleitung — wir richten Ihren Testzugang im persönlichen
                  15-Min-Termin ein. Konzentrieren Sie sich auf die richtigen Entscheidungen, wir übernehmen
                  die Verifizierung.
                </p>
                <Link
                  href={BOOKING_URL}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-base font-bold bg-white text-brand-700 hover:bg-bg-secondary shadow-card transition-all"
                >
                  <CalendarCheck className="w-4 h-4" />
                  15-Min-Termin buchen
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

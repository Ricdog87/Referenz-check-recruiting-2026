'use client'

import { motion } from 'framer-motion'
import { Building2, CalendarClock, BadgeCheck, UserSearch, BookCheck, ShieldCheck, Sparkles } from 'lucide-react'
import { Reveal } from '../Reveal'

const checks = [
  {
    icon: Building2,
    title: 'Firma existiert wirklich',
    body: 'Wir gleichen Arbeitgeber gegen Handelsregister und öffentliche Quellen ab. Ghost-Companies und reine Fassaden fallen vor dem Anruf auf.',
  },
  {
    icon: CalendarClock,
    title: 'Zeitlinien sind konsistent',
    body: 'Überschneidende Voll­zeit­stellen, unerklärte Lücken oder rückwärts geschriebene Karrieren fallen sofort auf — bevor jemand interviewen geht.',
  },
  {
    icon: BadgeCheck,
    title: 'Titel und Dauer stimmen mit der Referenz überein',
    body: 'Der geschulte Reviewer bestätigt die im CV genannte Rolle und Dauer direkt beim Referenzgeber. Aufgeplusterte Titel werden im Report markiert.',
  },
  {
    icon: UserSearch,
    title: 'Der Referenzgeber ist eine echte Person',
    body: 'Wir validieren Rolle, Firma und Erreichbarkeit. Erfundene Vorgesetzte und gefälschte E-Mail-Adressen fallen auf — Reviewer ruft an, nie ein Bot.',
  },
  {
    icon: BookCheck,
    title: 'Substanz statt Schreibstil',
    body: 'Wir bewerten Aussagen zu konkreten Projekten und Ergebnissen — nicht Sprache, Stil, Akzent oder Herkunft. Streng AGG-konform.',
  },
]

export function FabricationCheck() {
  return (
    <section className="py-28 px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-32 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] opacity-25"
          style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.25), transparent 65%)', filter: 'blur(80px)' }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Fabrikations-Check
            </div>
            <h2 className="text-[clamp(28px,4.5vw,46px)] font-bold tracking-tighter mb-5 text-text-primary leading-[1.1]">
              Hör auf zu fragen, <span className="text-text-secondary line-through decoration-rose-400/60">wer</span> den Lebenslauf geschrieben hat.<br className="hidden sm:block" />
              <span className="text-gradient-brand">Frag, ob er wahr ist.</span>
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              Den CV-Schreibstil zu analysieren ist 2022 — und gegen Diskriminierung schwer verteidigbar. candiq prüft die Substanz: Existiert die Firma? Stimmen die Zeiträume? Ist der Referenzgeber echt? Substanz ist nicht fälschbar, ohne dass es jemand bemerkt.
            </p>
          </div>
        </Reveal>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 mb-10">
          <Reveal>
            <ul className="space-y-3">
              {checks.map((c) => (
                <li key={c.title} className="card-md flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center flex-shrink-0">
                    <c.icon className="w-5 h-5 text-brand-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary mb-1">{c.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{c.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* candiq Verified Siegel */}
          <Reveal delay={0.15}>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
              className="relative rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-brand-700 text-white shadow-float p-7 h-full overflow-hidden flex flex-col"
            >
              <div
                className="absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-30 blur-3xl"
                style={{ background: 'radial-gradient(ellipse, #fbbf24, transparent 60%)' }}
              />
              <div className="relative flex-1 flex flex-col">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/15 border border-white/25 backdrop-blur-md w-fit mb-4">
                  <ShieldCheck className="w-3 h-3 text-amber-200" /> Auf jedem Report
                </div>
                <h3 className="text-2xl font-black tracking-tightest mb-3">candiq Verified</h3>
                <p className="text-sm text-white/90 leading-relaxed mb-5">
                  Jeder freigegebene Report trägt das candiq-Verified-Siegel — ein teilbares Vertrauens-Asset für Hiring-Manager, Geschäftsführung und Compliance. Verteidigbar gegenüber Wirtschaftsprüfern, lesbar in unter 30 Sekunden.
                </p>
                <ul className="space-y-2 text-xs text-white/85 mt-auto">
                  <li className="flex items-start gap-2"><Sparkles className="w-3.5 h-3.5 mt-0.5 text-amber-200 flex-shrink-0" /> Inkl. Audit-Trail-Verweis</li>
                  <li className="flex items-start gap-2"><Sparkles className="w-3.5 h-3.5 mt-0.5 text-amber-200 flex-shrink-0" /> Substanz-Bewertung pro Station</li>
                  <li className="flex items-start gap-2"><Sparkles className="w-3.5 h-3.5 mt-0.5 text-amber-200 flex-shrink-0" /> Eindeutige Hire-/Hold-/Reject-Empfehlung</li>
                </ul>
              </div>
            </motion.div>
          </Reveal>
        </div>

        <Reveal>
          <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-bg-secondary p-5 text-center">
            <p className="text-xs text-text-muted leading-relaxed">
              <strong className="text-text-secondary">AGG-Hinweis:</strong> candiq bewertet ausschließlich verifizierbare Substanz —
              Position, Dauer, Tätigkeit, Diskrepanz zur Eigenangabe. Keine Bewertung von Sprache, Stil, Akzent, Herkunft oder anderen
              nach § 1 AGG geschützten Merkmalen. Wir prüfen, was war — nicht, wer es geschrieben hat.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

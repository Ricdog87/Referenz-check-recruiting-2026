'use client'

import { motion } from 'framer-motion'
import {
  Bot, UserCheck, Cpu, Phone, Mic, FileText,
  Sparkles, MessageSquare, ClipboardCheck, ShieldCheck,
} from 'lucide-react'
import { Reveal } from '../Reveal'

const aiTasks = [
  { icon: MessageSquare, title: 'Intake im Bewerber-Chat', body: 'candiq Voice nimmt die Anfrage entgegen, sammelt Stationen und Referenzgeber strukturiert.' },
  { icon: Sparkles, title: 'Terminierung & Pre-Screening', body: 'Verfügbarkeit, Sprache, Motivation — 24/7 erreichbar, Antwort in unter einer Sekunde.' },
  { icon: Cpu, title: 'Vorab-Plausibilität', body: 'Firmen-Existenz, Zeitlinien-Konsistenz, Ghost-Employer-Check — bevor ein Mensch wählt.' },
  { icon: FileText, title: 'Wörtliche Dokumentation', body: 'Jedes Gespräch transkribiert, Audit-Trail mit Zeitstempel, automatisch nach 6 Monaten gelöscht.' },
]

const humanTasks = [
  { icon: Phone, title: 'Der Verifizierungs-Call', body: 'Ein geschulter Reviewer ruft den freigegebenen Referenzgeber an. Echter Mensch bürgt für echten Menschen.' },
  { icon: Mic, title: 'Strukturiertes Gespräch', body: 'Standardisierter Fragenkatalog, keine Stil-Bewertung. Substanz statt Sprache, AGG-konform.' },
  { icon: ClipboardCheck, title: 'Urteil & Diskrepanz-Bewertung', body: 'Aussagen mit den Eigenangaben des Kandidaten abgeglichen, Widersprüche markiert.' },
  { icon: ShieldCheck, title: 'Report-Freigabe', body: 'Vier-Augen-Prüfung vor dem Versand. Niemand sieht den Report, bevor ein Mensch ihn unterschrieben hat.' },
]

export function SpeedAndProof() {
  return (
    <section className="py-28 px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] opacity-20"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.4), transparent 65%)', filter: 'blur(80px)' }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Die candiq-Arbeitsteilung
            </div>
            <h2 className="text-[clamp(32px,5vw,52px)] font-bold tracking-tighter mb-5 text-text-primary leading-[1.1]">
              KI fürs <span className="text-gradient-brand">Tempo</span>.<br className="hidden sm:block" />
              Mensch für den <span className="text-gradient-brand">Beweis</span>.
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              candiq ist KI-nativ — und zieht bewusst die Grenze, wo der Mensch unverzichtbar ist. Maschinen
              skalieren Geschwindigkeit, geschulte Reviewer skalieren Vertrauen. Beides in einem Workflow,
              keines auf Kosten des anderen.
            </p>
          </div>
        </Reveal>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* KI / Tempo */}
          <Reveal>
            <div className="rounded-3xl border border-border bg-white shadow-card-md h-full p-7">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-brand-700" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-brand-700">KI macht</div>
                  <div className="text-xl font-bold text-text-primary">Tempo &amp; Dokumentation</div>
                </div>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                Alles, was eine Maschine besser, schneller und konsistenter kann als ein Mensch — vom Erstkontakt
                mit dem Kandidaten bis zum Audit-Protokoll. Inklusive candiq Voice als Komfort-Layer für Kandidaten.
              </p>
              <ul className="space-y-4">
                {aiTasks.map((t) => (
                  <li key={t.title} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <t.icon className="w-4 h-4 text-brand-700" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-text-primary">{t.title}</div>
                      <div className="text-xs text-text-secondary leading-relaxed">{t.body}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Mensch / Beweis */}
          <Reveal delay={0.1}>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
              className="relative rounded-3xl bg-gradient-to-br from-brand-700 via-violet to-brand-700 text-white shadow-float h-full p-7 overflow-hidden"
            >
              <div
                className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-30 blur-3xl"
                style={{ background: 'radial-gradient(ellipse, #fbbf24, transparent 60%)' }}
              />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-amber-200">Mensch macht</div>
                    <div className="text-xl font-bold">Den Beweis</div>
                  </div>
                </div>
                <p className="text-sm text-white/85 leading-relaxed mb-6">
                  Das Einzige, das in einer Welt aus KI-Behauptungen nicht fälschbar ist: Ein geschulter
                  Reviewer bestätigt, dass ein echter Mensch für einen echten Menschen einsteht. Keine
                  Bot-Anrufe bei Ihren Referenzgebern. Niemals.
                </p>
                <ul className="space-y-4">
                  {humanTasks.map((t) => (
                    <li key={t.title} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                        <t.icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{t.title}</div>
                        <div className="text-xs text-white/80 leading-relaxed">{t.body}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </Reveal>
        </div>

        {/* Punchline */}
        <Reveal>
          <div className="mt-10 text-center max-w-3xl mx-auto">
            <p className="text-base text-text-secondary leading-relaxed">
              Das ist die candiq-Wette: <span className="font-semibold text-text-primary">In einer Welt voller automatisierter Behauptungen wird das menschliche Urteil zum knappsten Gut im Hiring.</span> Wir produktisieren es.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

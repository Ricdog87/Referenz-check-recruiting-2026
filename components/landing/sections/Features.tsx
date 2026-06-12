'use client'

import { motion } from 'framer-motion'
import {
  ShieldCheck, Phone, FileText, Activity, Users, Lock,
  Zap, BarChart3, Mic,
} from 'lucide-react'
import { Reveal, StaggerChildren, StaggerItem } from '../Reveal'

const features = [
  {
    icon: Phone,
    title: 'Mensch ruft an, KI dokumentiert',
    desc: 'Geschulte Reviewer führen den Verifizierungs-Call mit standardisiertem Fragenkatalog. candiq dokumentiert wörtlich. Keine Bot-Anrufe bei Ihren Referenzgebern — niemals.',
    color: 'from-brand-500 to-brand-700',
    glow: 'rgba(99,102,241,0.3)',
  },
  {
    icon: FileText,
    title: 'Strukturierter Report',
    desc: 'Bewertung pro Station, Diskrepanz-Markierung, Gesprächsnotizen. Direkt teilbar mit Hiring Manager und Compliance.',
    color: 'from-violet to-violet/80',
    glow: 'rgba(139,92,246,0.3)',
  },
  {
    icon: ShieldCheck,
    title: 'DSGVO by Design',
    desc: 'Einwilligungs-Workflow, Recht auf Auskunft & Löschung auf Knopfdruck. Server in Deutschland, AVV inklusive.',
    color: 'from-emerald-500 to-emerald-700',
    glow: 'rgba(16,185,129,0.3)',
  },
  {
    icon: Activity,
    title: 'Live-Status pro Kandidat',
    desc: 'Jederzeit sichtbar, welche Prüfungen offen, in Arbeit oder abgeschlossen sind — inklusive Hinweis bei Verzögerung.',
    color: 'from-cyan to-brand-500',
    glow: 'rgba(6,182,212,0.3)',
  },
  {
    icon: Zap,
    title: 'Express-Option in 24 h',
    desc: 'Wenn es schnell gehen muss: Express-Slot dazubuchen — Standard-Durchlaufzeit liegt sonst unter 48 Stunden.',
    color: 'from-amber-500 to-amber-700',
    glow: 'rgba(245,158,11,0.3)',
  },
  {
    icon: BarChart3,
    title: 'Hiring-KPIs im Dashboard',
    desc: 'Pipeline-Status, Verifizierungsquote und Durchlaufzeit auf einen Blick. Ohne Excel-Hin-und-Her.',
    color: 'from-rose-500 to-violet',
    glow: 'rgba(244,63,94,0.3)',
  },
  {
    icon: Lock,
    title: 'Audit-Trail',
    desc: 'Jeder Datenzugriff geloggt. Export für DSGVO Art. 30, Wirtschaftsprüfer oder interne Compliance.',
    color: 'from-slate-700 to-slate-900',
    glow: 'rgba(15,23,42,0.3)',
  },
  {
    icon: Users,
    title: 'Multi-Mandanten',
    desc: 'Für Personaldienstleister: Endkunden mit eigenem Branding und getrennten Workflows verwalten. PDL-Konten sind ab sofort buchbar; Mandanten-Features folgen iterativ.',
    color: 'from-amber-500 to-rose-500',
    glow: 'rgba(245,158,11,0.3)',
    badge: 'Roadmap',
  },
  {
    icon: Mic,
    title: 'candiq Interview',
    desc: 'Strukturierte Kompetenz- und Cultural-Fit-Interviews als Service inkl. Scorecards. Ergänzt Referenzprüfungen ideal.',
    color: 'from-violet to-cyan',
    glow: 'rgba(99,102,241,0.28)',
    badge: 'In Vorbereitung',
  },
]

export function Features() {
  return (
    <section id="features" className="py-28 px-6 bg-bg-secondary relative overflow-hidden">
      <div className="absolute inset-0 grid-bg grid-bg-mask opacity-50 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet/10 text-violet border border-violet/20 mb-4">
              Was Sie bekommen
            </div>
            <h2 className="text-[clamp(32px,5vw,52px)] font-bold tracking-tighter mb-5 text-text-primary">
              Alles, was eine seriöse <br className="hidden sm:block" />
              <span className="text-gradient-brand">Vorqualifizierung</span> braucht.
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              Vom Kandidaten-Upload bis zum auditierbaren Report — in einer Oberfläche. Kein Excel, keine Telefonliste, kein Tool-Wirrwarr.
            </p>
          </div>
        </Reveal>

        <StaggerChildren className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <StaggerItem key={f.title}>
              <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="group relative card-md hover:shadow-card-xl transition-all overflow-hidden h-full"
              >
                {/* Hover glow */}
                <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-500 blur-3xl"
                  style={{ background: f.glow }} />

                <div className="relative">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-card`}>
                    <f.icon className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  {'badge' in f && (
                    <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-violet/10 text-violet border border-violet/20 mb-2">
                      {f.badge}
                    </div>
                  )}
                  <h3 className="text-base font-semibold text-text-primary mb-2 tracking-tight">{f.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  )
}

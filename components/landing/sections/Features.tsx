'use client'

import { motion } from 'framer-motion'
import {
  ShieldCheck, Phone, FileText, Activity, Users, Lock,
  Globe, Zap, BarChart3,
} from 'lucide-react'
import { Reveal, StaggerChildren, StaggerItem } from '../Reveal'

const features = [
  {
    icon: Phone,
    title: 'Telefonische Verifizierung',
    desc: 'Geschulte Mitarbeiter führen strukturierte Reference-Calls — keine Bots, keine E-Mail-Tickerei.',
    color: 'from-brand-500 to-brand-700',
    glow: 'rgba(99,102,241,0.3)',
  },
  {
    icon: ShieldCheck,
    title: 'DSGVO by Design',
    desc: 'Einwilligungs-Workflow, Recht auf Löschung & Auskunft auf Knopfdruck. Server in Deutschland.',
    color: 'from-emerald-500 to-emerald-700',
    glow: 'rgba(16,185,129,0.3)',
  },
  {
    icon: FileText,
    title: 'Strukturierte Reports',
    desc: 'PDF-Reports mit Status, Diskrepanzen, Gesprächsprotokollen — White-Label-fähig.',
    color: 'from-violet to-violet/80',
    glow: 'rgba(139,92,246,0.3)',
  },
  {
    icon: Activity,
    title: 'Live-Status-Tracking',
    desc: 'Sehen Sie in Echtzeit, welche Prüfungen laufen, abgeschlossen oder blockiert sind.',
    color: 'from-cyan to-brand-500',
    glow: 'rgba(6,182,212,0.3)',
  },
  {
    icon: Users,
    title: 'Multi-Mandanten',
    desc: 'Personaldienstleister verwalten Endkunden mit eigenen Workflows, Branding & Reports.',
    color: 'from-amber-500 to-rose-500',
    glow: 'rgba(245,158,11,0.3)',
  },
  {
    icon: Globe,
    title: 'ATS-Integration',
    desc: 'Personio, SAP SuccessFactors, Workday, Greenhouse — Kandidaten 1-Klick synchronisiert.',
    color: 'from-brand-600 to-cyan',
    glow: 'rgba(99,102,241,0.3)',
  },
  {
    icon: BarChart3,
    title: 'Recruiting-Analytics',
    desc: 'KPI-Dashboard: Durchlaufzeit, Verifizierungsquote, Diskrepanz-Rate pro Quelle.',
    color: 'from-rose-500 to-violet',
    glow: 'rgba(244,63,94,0.3)',
  },
  {
    icon: Zap,
    title: '< 48 h Durchlaufzeit',
    desc: 'Express-Option in 24h verfügbar. SLA für Business- und Enterprise-Pakete.',
    color: 'from-amber-500 to-amber-700',
    glow: 'rgba(245,158,11,0.3)',
  },
  {
    icon: Lock,
    title: 'Audit-Trail',
    desc: 'Jeder Datenzugriff geloggt. Export für DSGVO Art. 30 oder Wirtschaftsprüfer.',
    color: 'from-slate-700 to-slate-900',
    glow: 'rgba(15,23,42,0.3)',
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
              Alles drin
            </div>
            <h2 className="text-[clamp(32px,5vw,52px)] font-bold tracking-tighter mb-5 text-text-primary">
              Eine Plattform für <br className="hidden sm:block" />
              <span className="text-gradient-brand">moderne Reference-Workflows.</span>
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              Vom CV-Upload bis zum auditierbaren Report — alles unter einer Oberfläche.
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

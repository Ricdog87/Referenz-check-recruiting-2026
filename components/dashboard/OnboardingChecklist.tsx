'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, Circle, Sparkles, ArrowRight, X,
  UserPlus, Phone, ShieldCheck, ShoppingBag,
} from 'lucide-react'

type Step = {
  id: string
  done: boolean
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  cta: string
  href: string
}

interface Props {
  candidateCount: number
  checkCount: number
  hasGdprConsent: boolean
  hasAddon: boolean
}

export function OnboardingChecklist({ candidateCount, checkCount, hasGdprConsent, hasAddon }: Props) {
  const [dismissed, setDismissed] = useState(false)

  const steps: Step[] = [
    {
      id: 'candidate',
      done: candidateCount > 0,
      icon: UserPlus,
      title: 'Ersten Kandidaten anlegen',
      desc: 'Name, Position und CV — wir kümmern uns um den Rest.',
      cta: 'Kandidat anlegen',
      href: '/candidates/new',
    },
    {
      id: 'check',
      done: checkCount > 0,
      icon: Phone,
      title: 'Erste Referenzprüfung starten',
      desc: 'Ehemaligen Arbeitgeber eintragen — wir verifizieren in unter 48h.',
      cta: 'Prüfung starten',
      href: '/checks/new',
    },
    {
      id: 'gdpr',
      done: hasGdprConsent,
      icon: ShieldCheck,
      title: 'DSGVO-Einwilligung einholen',
      desc: 'Per Klick beim Anlegen — Audit-Trail wird automatisch protokolliert.',
      cta: 'Mehr erfahren',
      href: '/datenschutz',
    },
    {
      id: 'addon',
      done: hasAddon,
      icon: ShoppingBag,
      title: 'Add-on entdecken',
      desc: 'Express-Bearbeitung, Interview-Pakete oder Bulk-CV-Verifizierung.',
      cta: 'Add-ons ansehen',
      href: '/addons',
    },
  ]

  const completed = steps.filter((s) => s.done).length
  const total = steps.length
  const progress = Math.round((completed / total) * 100)

  if (dismissed || completed === total) return null

  const nextStep = steps.find((s) => !s.done)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="card-lg shadow-card-md relative overflow-hidden bg-gradient-to-br from-white via-brand-50/30 to-violet/5"
      >
        {/* Decorative blob */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.5), transparent 60%)', filter: 'blur(40px)' }} />

        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors z-10"
          aria-label="Onboarding ausblenden"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-violet flex items-center justify-center text-white shadow-card flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-text-primary">Erste Schritte</h3>
                <span className="text-[11px] font-bold text-brand-700 bg-brand-100 rounded-full px-2 py-0.5">
                  {completed}/{total}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 max-w-md h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-brand-500 to-violet rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-[10px] font-bold text-text-secondary font-mono">{progress}%</span>
              </div>
            </div>
          </div>

          {/* Next-action highlight */}
          {nextStep && (
            <Link
              href={nextStep.href}
              className="flex items-center gap-3 p-3 mb-3 rounded-xl bg-white border border-brand-200 hover:border-brand-300 hover:shadow-card transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet flex items-center justify-center text-white shadow-card flex-shrink-0">
                <nextStep.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-text-primary">{nextStep.title}</div>
                <div className="text-[11px] text-text-secondary truncate">{nextStep.desc}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-brand-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </Link>
          )}

          {/* Compact step list */}
          <ul className="space-y-1 grid sm:grid-cols-2 gap-x-3">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <li key={step.id}>
                  <Link
                    href={step.href}
                    className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors ${
                      step.done ? 'text-text-muted line-through' : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                    }`}
                  >
                    {step.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-text-muted flex-shrink-0" />
                    )}
                    <Icon className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                    <span className="text-xs">{step.title}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
